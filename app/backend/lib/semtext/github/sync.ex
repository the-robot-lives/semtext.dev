defmodule Semtext.Github.Sync do
  @moduledoc """
  Enqueue/manual-retry facade for the discussion-creation flow — the seam
  other lanes call (no GitHub/Oban internals leak).

  LANE=data's submit path calls `enqueue_discussion/1` after a successful
  create/submit; the moderation/UI "retry" action calls the same function (an
  active job for the same proposal is deduped by Oban unique, a settled one
  re-runs). See `Semtext.Workers.GithubDiscussionWorker` for semantics.
  """

  @doc """
  Enqueues discussion creation for a proposal.

  Returns the Oban insert result: `{:ok, %Oban.Job{}}` (set `job.conflicting`
  when an identical active job already exists) or `{:error, changeset}`.
  """
  @spec enqueue_discussion(term(), keyword()) ::
          {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()}
  def enqueue_discussion(proposal_id, opts \\ []) do
    %{"proposal_id" => to_string(proposal_id)}
    |> Semtext.Workers.GithubDiscussionWorker.new(opts)
    |> Oban.insert()
  end

  @doc """
  The manual retry action (v1 §6: "Oban retry with backoff + manual retry
  action"). Same as enqueue — the worker re-checks link state before it
  touches GitHub, so a spurious retry is a cheap no-op.
  """
  @spec retry_discussion(term()) :: {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()}
  def retry_discussion(proposal_id), do: enqueue_discussion(proposal_id)
end
