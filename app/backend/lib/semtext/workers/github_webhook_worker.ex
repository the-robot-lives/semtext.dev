defmodule Semtext.Workers.GithubWebhookWorker do
  @moduledoc """
  Applies one verified GitHub webhook delivery to the discussion-sync cache
  (v1 §6: discussion / discussion_comment / reaction events → counts + last
  activity; replayed deliveries are no-ops).

  Dedupe lives at ENQUEUE time (`X-GitHub-Delivery` unique job key — see
  `SemtextWeb.GithubWebhookController`), so a replayed delivery never reaches
  `perform/1`; handlers additionally write idempotent values (stats are
  fetched fresh and re-written), making even a past-TTL replay a no-op.

  The event is only a TRIGGER — counts always come from a fresh GraphQL
  fetch, so a missed/dropped webhook self-heals on the next event of any
  kind. A `NOT_FOUND` from that fetch means the discussion was deleted on
  GitHub → the link flips to "removed" (viewer chip contract, v1 §6).
  """

  use Oban.Worker,
    queue: :github_sync,
    max_attempts: 10,
    unique: [period: :infinity, states: ~w(available scheduled executing completed discarded)a, keys: [:delivery_id]]

  require Logger

  alias Semtext.Github
  alias Semtext.Github.Graphql

  @supported_events ~w(discussion discussion_comment reaction)

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{
          "delivery_id" => delivery_id,
          "event" => event,
          "action" => action,
          "payload" => payload
        }
      }) do
    cond do
      event == "ping" ->
        :ok

      event not in @supported_events ->
        Logger.debug("github_webhook_worker: ignoring event #{event} (delivery #{delivery_id})")
        :ok

      event == "discussion" and action == "deleted" ->
        delete_discussion(payload)

      true ->
        refresh_stats(delivery_id, payload)
    end
  end

  # -- discussion.deleted -------------------------------------------------

  defp delete_discussion(payload) do
    port = Github.port()

    case find_link(payload) do
      {:ok, nil} ->
        # Not a discussion we track.
        :ok

      {:ok, link} ->
        :ok = port.mark_discussion_removed(link.proposal_id)
        Logger.info("github_webhook_worker: discussion removed on GitHub (proposal #{link.proposal_id})")
        :ok

      {:error, reason} ->
        {:error, {:port_error, reason}}
    end
  end

  # -- stats refresh ------------------------------------------------------

  defp refresh_stats(delivery_id, payload) do
    case find_link(payload) do
      {:ok, nil} ->
        # A discussion we never created (created out-of-band or for another
        # consumer of the app) — nothing to sync.
        Logger.debug("github_webhook_worker: no tracked discussion for delivery #{delivery_id}")
        :ok

      {:ok, link} ->
        fetch_and_store(link)

      {:error, reason} ->
        {:error, {:port_error, reason}}
    end
  end

  defp fetch_and_store(link) do
    case Graphql.fetch_stats(link.discussion_number) do
      {:ok, stats} ->
        stats = Map.put(stats, :last_synced_at, DateTime.utc_now())
        :ok = Github.port().update_discussion_stats(link.proposal_id, stats)
        :ok

      {:error, {:permanent, {:not_found, :discussion}}} ->
        # Deleted out-of-band (without a webhook reaching us).
        :ok = Github.port().mark_discussion_removed(link.proposal_id)
        Logger.warning("github_webhook_worker: discussion ##{link.discussion_number} is gone on GitHub — chip set to removed")
        :ok

      {:error, {kind, reason}} ->
        {:error, {kind, reason}}
    end
  end

  # -- link resolution ----------------------------------------------------

  defp find_link(payload) do
    port = Github.port()
    discussion = Map.get(payload, "discussion") || %{}
    repo = get_in(payload, ["repository", "full_name"])
    number = discussion["number"]
    node_id = discussion["node_id"]

    with {:ok, nil} <- by_node(port, node_id) do
      by_number(port, repo, number)
    end
  end

  defp by_node(_port, node_id) when not is_binary(node_id) or node_id == "", do: {:ok, nil}
  defp by_node(port, node_id), do: port.find_discussion_by_node(node_id)

  defp by_number(_port, _repo, number) when not is_integer(number), do: {:ok, nil}
  defp by_number(_port, nil, _number), do: {:ok, nil}
  defp by_number(port, repo, number), do: port.find_discussion_by_number(repo, number)
end
