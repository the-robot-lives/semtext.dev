defmodule Semtext.Github.Port do
  @moduledoc """
  The seam between LANE=github-sync and the proposals domain (LANE=data).

  This lane never touches proposals tables directly — Liquibase schema and
  Ecto schemas belong to the data lane. Everything github-sync needs to READ
  (what to post, where links stand) or WRITE (link state, synced stats) goes
  through this behaviour:

    * production adapter: `Semtext.Github.Adapters.ProposalsContext` —
      delegates to the `Semtext.Proposals` context (P1 contract §2)
    * dev/demo adapter: `Semtext.Github.Adapters.Memory` — ETS-backed,
      so the sync flow is demonstrable before the data context lands

  Select via `config :semtext, Semtext.Github, proposals_port: MyAdapter`.

  All callbacks return `{:error, term}` on failure — workers turn port errors
  into Oban retries, never into crashes. State vocabulary mirrors the data
  contract (`pending | ok | failed` + `last_error`); "removed on GitHub" is
  expressed as `mark_discussion_removed/1` so the data lane maps it onto its
  own enum.
  """

  @type proposal_id :: String.t()

  @typedoc "Everything the discussion body needs to snapshot a proposal."
  @type sync_target :: %{
          required(:proposal_id) => proposal_id(),
          required(:slug) => String.t(),
          optional(:title) => String.t() | nil,
          optional(:element_tag) => String.t() | nil,
          optional(:summary) => String.t() | nil,
          optional(:motivation) => String.t() | nil,
          optional(:options) => term(),
          optional(:example) => String.t() | nil
        }

  @typedoc "The stored discussion-link row, as this lane consumes it."
  @type discussion_link :: %{
          required(:proposal_id) => proposal_id(),
          optional(:repo) => String.t() | nil,
          optional(:discussion_number) => pos_integer() | nil,
          optional(:node_id) => String.t() | nil,
          optional(:url) => String.t() | nil,
          optional(:state) => :pending | :ok | :failed | :removed,
          optional(:last_error) => String.t() | nil
        }

  @typedoc "Webhook-synced denormalized cache (v1 §4 discussion_links)."
  @type discussion_stats :: %{
          required(:comment_count) => non_neg_integer(),
          required(:reactions) => %{String.t() => non_neg_integer()},
          required(:last_synced_at) => DateTime.t()
        }

  @doc "The proposal snapshot to post (or `:not_found` — e.g. deleted draft)."
  @callback get_sync_target(proposal_id()) ::
              {:ok, sync_target()} | {:error, :not_found | term()}

  @doc "The current discussion link, or nil when none was created yet."
  @callback get_discussion_link(proposal_id()) ::
              {:ok, discussion_link() | nil} | {:error, term()}

  @doc "Marks the link `pending` (an attempt is starting / a job is active)."
  @callback mark_discussion_pending(proposal_id()) :: :ok | {:error, term()}

  @doc "Stores a successfully created discussion and marks the link `ok`."
  @callback put_discussion_link(proposal_id(), %{
              required(:node_id) => String.t(),
              required(:discussion_number) => pos_integer(),
              required(:url) => String.t()
            }) :: :ok | {:error, term()}

  @doc "Marks the link `failed` with a human-readable `last_error`."
  @callback mark_discussion_failed(proposal_id(), reason :: String.t()) :: :ok | {:error, term()}

  @doc "The discussion was deleted on GitHub — viewer chip flips to \"removed\"."
  @callback mark_discussion_removed(proposal_id()) :: :ok | {:error, term()}

  @doc "Writes webhook-synced counts (comment/reaction cache + last_synced_at)."
  @callback update_discussion_stats(proposal_id(), discussion_stats()) :: :ok | {:error, term()}

  @doc "Finds a link by GitHub discussion node id (webhook `discussion.created` sanity)."
  @callback find_discussion_by_node(String.t()) ::
              {:ok, discussion_link() | nil} | {:error, term()}

  @doc "Finds a link by repo (owner/name) + discussion number (webhook events)."
  @callback find_discussion_by_number(repo :: String.t(), pos_integer()) ::
              {:ok, discussion_link() | nil} | {:error, term()}
end
