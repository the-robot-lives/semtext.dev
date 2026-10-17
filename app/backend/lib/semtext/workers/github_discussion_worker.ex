defmodule Semtext.Workers.GithubDiscussionWorker do
  @moduledoc """
  Creates the GitHub Discussion for one proposal (design v1 §6, v2 §8 P1
  acceptance).

  Acceptance contract this worker implements:

    * a successful submit enqueues (via `Semtext.Github.Sync`); with GitHub
      healthy the discussion exists immediately (well inside the 60s gate)
      with the deep link back;
    * a FORCED GITHUB OUTAGE leaves the proposal visible and untouched — the
      chip stays `pending` (state is written through the port, the proposal
      itself is never modified here), the job retries with exponential
      backoff, and the retry lands the discussion;
    * a PERMANENT failure (bad category id, forbidden, GraphQL input error)
      flips the chip to `failed` and cancels retrying — the manual retry
      action (`Semtext.Github.Sync.retry_discussion/1`) re-enqueues after
      remediation.

  Unique per `proposal_id` while active (available/scheduled/executing) so a
  double-enqueue can never create two discussions; a settled job re-enqueues
  freely and the perform-time link check makes it a no-op.
  """

  use Oban.Worker,
    queue: :github_sync,
    max_attempts: 12,
    unique: [period: :infinity, states: [:available, :scheduled, :executing], keys: [:proposal_id]]

  require Logger

  alias Semtext.Github
  alias Semtext.Github.Graphql

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"proposal_id" => proposal_id}} = job) do
    unless Github.enabled?() do
      Logger.warning(
        "github_discussion_worker: Semtext.Github not configured (app id/key/installation/ids); " <>
          "cancelling job — re-enqueue after provisioning"
      )

      {:cancel, :github_not_configured}
    else
      sync(proposal_id, job)
    end
  end

  # Exponential backoff, 30s doubling to a 15-min ceiling — an outage
  # stretches retries over ~2.5h across 12 attempts, then the chip flips to
  # `failed`.
  @impl Oban.Worker
  def backoff(%Oban.Job{attempt: attempt}) do
    min(trunc(:math.pow(2, attempt - 1) * 30), 900)
  end

  # -- sync ---------------------------------------------------------------

  defp sync(proposal_id, job) do
    port = Github.port()

    with {:ok, link} <- port.get_discussion_link(proposal_id),
         :create <- already_linked?(link),
         {:ok, target} <- port.get_sync_target(proposal_id),
         :ok <- mark_pending(port, proposal_id) do
      case Graphql.create_discussion(target) do
        {:ok, created} ->
          # A link write can legitimately fail (e.g. uq_discussion_links_repo_
          # number collision) — never a bare `:ok =` match: that would crash
          # the job unclassified instead of a handled permanent failure.
          case port.put_discussion_link(proposal_id, created) do
            :ok ->
              Logger.info("github_discussion_worker: discussion ##{created.discussion_number} created for proposal #{proposal_id}")
              :ok

            {:error, reason} ->
              handle_failure(proposal_id, job, :permanent, {:link_write_failed, reason})
          end

        {:error, {kind, reason}} ->
          handle_failure(proposal_id, job, kind, reason)
      end
    else
      :skip ->
        # Already synced (double-enqueue race, or a retry after a completed
        # job) — a no-op, never a second discussion.
        :ok

      {:error, :not_found} ->
        {:cancel, :proposal_not_found}

      {:error, reason} ->
        Logger.error("github_discussion_worker: port error for #{proposal_id}: #{inspect(reason)}")
        {:error, {:port_error, reason}}
    end
  end

  # Chip flip to `pending` — a port error here is transient-shape (DB trouble)
  # and Oban retries; it must not crash the worker with a MatchError.
  defp mark_pending(port, proposal_id) do
    case port.mark_discussion_pending(proposal_id) do
      :ok -> :ok
      {:error, reason} -> {:error, {:port_error, reason}}
    end
  end

  # LANE=data (coordinator follow-up 2026-10-17): a `removed` link is ALSO a
  # skip — recreation is exclusively the moderator `Proposals.recreate_discussion/1`
  # action; a stray retry/job must never auto-recreate a deleted discussion.
  # Map.get, NOT Access (`link[:state]`): the production adapter returns a
  # `%DiscussionLink{}` struct, which does not implement Access (a plain-map
  # fake port does — both must work).
  defp already_linked?(nil), do: :create

  defp already_linked?(link) do
    state = Map.get(link, :state)

    cond do
      state == :removed -> :skip
      state == :ok and is_binary(Map.get(link, :node_id)) -> :skip
      true -> :create
    end
  end

  defp handle_failure(proposal_id, _job, :permanent, reason) do
    mark_failed(Github.port(), proposal_id, reason)
    Logger.error("github_discussion_worker: permanent failure for #{proposal_id}: #{inspect(reason)} — chip set to failed, manual retry available")
    {:cancel, {:permanent, reason}}
  end

  defp handle_failure(proposal_id, job, :transient, reason) do
    if job.attempt >= job.max_attempts do
      mark_failed(Github.port(), proposal_id, reason)
      Logger.error("github_discussion_worker: retries exhausted for #{proposal_id} — chip set to failed")
      {:error, {:transient_exhausted, reason}}
    else
      # Keep the chip `pending` — Oban retries with backoff; the proposal
      # stays visible the whole time (v1 §3.1 "async-tolerant").
      Logger.warning("github_discussion_worker: transient failure for #{proposal_id} (attempt #{job.attempt}/#{job.max_attempts}): #{inspect(reason)}")
      {:error, {:transient, reason}}
    end
  end

  # The failure write itself must never crash the worker with a MatchError —
  # a port error here is logged and the classified job result still returned.
  defp mark_failed(port, proposal_id, reason) do
    case port.mark_discussion_failed(proposal_id, format_reason(reason)) do
      :ok -> :ok
      {:error, cs_error} -> Logger.error("github_discussion_worker: failed to write :failed chip for #{proposal_id}: #{inspect(cs_error)}")
    end
  end

  defp format_reason(reason) when is_binary(reason), do: reason
  defp format_reason(reason), do: inspect(reason)
end
