defmodule Semtext.Proposals do
  @moduledoc """
  Public context for the proposals domain (P1 contract — LANE=data).

  Other lanes (github-sync, ui, auth) code against THESE functions; the
  bodies land in the data lane's implementation commits. Error contract:

    | returned                     | meaning                                  | HTTP mapping       |
    |------------------------------|------------------------------------------|--------------------|
    | `{:ok, value}`               | success                                  | 2xx                |
    | `{:ok, value, :replayed}`    | Idempotency-Key replay; original returned | 2xx + `Idempotency-Replayed: true` |
    | `{:error, %Ecto.Changeset{}}`| validation failure (`errors` map in body)| 422 validation-failed |
    | `{:error, :not_found}`       | missing OR hidden/draft for this viewer  | 404 not-found      |
    | `{:error, :forbidden}`       | authenticated but not owner/moderator    | 403 forbidden      |
    | `{:error, :invalid_transition}` | status lifecycle violation            | 409 invalid-status-transition |
    | `{:error, {:limited, secs}}` | rate limit exhausted (`secs` = retry-after) | 429 rate-limited |

  Full HTTP + Hologram-command shapes, problem+json catalogue and rate-limit
  buckets: `docs/proposals/API.md`.
  """

  import Ecto.Query, warn: false

  alias Semtext.Proposals.DiscussionLink
  alias Semtext.Proposals.ModerationEvent
  alias Semtext.Proposals.Proposal
  alias Semtext.Proposals.ProposalVersion
  alias Semtext.Proposals.Report

  ## Types -------------------------------------------------------------------

  @typedoc "Actor of a moderation action: a moderator user or the system (wizard heuristics)."
  @type actor :: %{user_id: Ecto.UUID.t()} | %{system: String.t()}

  @typedoc """
  Who is asking. `nil` = anonymous. Moderators see hidden/draft rows and
  moderation metadata; owners additionally see their own drafts.
  """
  @type viewer :: nil | %{user_id: Ecto.UUID.t(), moderator: boolean()}

  @typedoc "Opaque cursor page returned by every list function."
  @type page(t) :: %{items: [t], next_cursor: String.t() | nil, has_more: boolean()}

  @typedoc "List/search filters — see `list_proposals/1`."
  @type filters :: %{
          optional(:q) => String.t(),
          optional(:tag) => String.t(),
          optional(:status) => atom() | [atom()],
          optional(:sort) => :newest | :updated | :discussed,
          optional(:fork_of) => String.t(),
          optional(:submitter_id) => Ecto.UUID.t(),
          optional(:include_hidden) => boolean(),
          optional(:after) => String.t(),
          optional(:limit) => pos_integer()
        }

  @type create_result ::
          {:ok, Proposal.t(), :created}
          | {:ok, Proposal.t(), :replayed}
          | {:error, Ecto.Changeset.t()}

  @typedoc "Rate-limit buckets (docs/proposals/API.md § Rate limits)."
  @type rate_bucket :: :submit | :report | :fork | :read

  ## Constants ---------------------------------------------------------------

  @public_statuses [:submitted, :under_review, :accepted, :merged]

  @doc "Statuses the anonymous public browse/search/detail surface may see."
  def public_statuses, do: @public_statuses

  @doc """
  Owner-permitted status transitions (v1 §3.7): submit a draft, withdraw a
  draft or a submitted proposal.
  """
  @spec owner_transitions() :: %{atom() => [atom()]}
  def owner_transitions do
    %{draft: [:submitted, :withdrawn], submitted: [:withdrawn]}
  end

  @doc "Moderator-permitted status transitions (v1 §3.7)."
  @spec moderator_transitions() :: %{atom() => [atom()]}
  def moderator_transitions do
    %{
      submitted: [:under_review, :declined],
      under_review: [:accepted, :declined],
      accepted: [:merged]
    }
  end

  ## Submit / lifecycle -------------------------------------------------------

  @doc """
  Submit a proposal: creates the row (`status: :submitted`) plus version 1,
  computes `files_sha256` when files are supplied, and dedupes on
  `idempotency_key` — a replay returns the ORIGINAL proposal with
  `:replayed`. `attrs` are the wizard fields (element_tag/title/summary/
  motivation/options/example, optional files map).
  """
  @spec create_and_submit(Ecto.UUID.t(), map(), String.t() | nil) :: create_result()
  def create_and_submit(user_id, attrs, idempotency_key), do: unimplemented({user_id, attrs, idempotency_key})

  @doc "Save a draft (owner-only visibility; `status: :draft`, no version yet)."
  @spec save_draft(Ecto.UUID.t(), map()) :: {:ok, Proposal.t()} | {:error, Ecto.Changeset.t()}
  def save_draft(user_id, attrs), do: unimplemented({user_id, attrs})

  @doc "Edit an owned draft's fields (drafts only; post-submit edits are P2 versions)."
  @spec update_draft(Ecto.UUID.t(), String.t(), map()) ::
          {:ok, Proposal.t()} | {:error, :not_found | :forbidden | Ecto.Changeset.t()}
  def update_draft(user_id, slug, attrs), do: unimplemented({user_id, slug, attrs})

  @doc "Owner submits a draft (`draft -> submitted`, writes version 1)."
  @spec submit_draft(Ecto.UUID.t(), String.t()) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :forbidden | :invalid_transition | Ecto.Changeset.t()}
  def submit_draft(user_id, slug), do: unimplemented({user_id, slug})

  @doc "Owner withdraws (`draft/submitted -> withdrawn`)."
  @spec withdraw(Ecto.UUID.t(), String.t()) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :forbidden | :invalid_transition | Ecto.Changeset.t()}
  def withdraw(user_id, slug), do: unimplemented({user_id, slug})

  ## Reads -------------------------------------------------------------------

  @doc """
  Detail by slug. Visibility: public rows for everyone; drafts only for the
  owner + moderators; hidden rows only for moderators. Returns the proposal
  with `:discussion` (sync chip state) and `:current_version` when present.
  Hidden/draft-for-stranger collapses to `{:error, :not_found}` (no existence leak).
  """
  @spec get_by_slug(String.t(), viewer()) ::
          {:ok, %{proposal: Proposal.t(), discussion: DiscussionLink.t() | nil}} | {:error, :not_found}
  def get_by_slug(slug, viewer \\ nil), do: unimplemented({slug, viewer})

  @doc """
  Browse/search with cursor pagination. `q` runs Postgres full-text over the
  generated tsvector (tag + title + summary + motivation, websearch syntax);
  `tag` is an exact element_tag filter; default sort `:newest`. Public calls
  see only `public_statuses()` non-hidden rows; `status:` narrows within that
  set unless the viewer is a moderator (`include_hidden`).
  """
  @spec list_proposals(filters(), viewer()) :: {:ok, page(Proposal.t())}
  def list_proposals(filters \\ %{}, viewer \\ nil), do: unimplemented({filters, viewer})

  @doc "Version list for a slug, descending (P2 consumes; P1 exposes read-only)."
  @spec list_versions(String.t()) :: {:ok, [ProposalVersion.t()]} | {:error, :not_found}
  def list_versions(slug), do: unimplemented({slug})

  @doc "Exact version of a slug."
  @spec get_version(String.t(), pos_integer()) ::
          {:ok, ProposalVersion.t()} | {:error, :not_found}
  def get_version(slug, n), do: unimplemented({slug, n})

  @doc """
  Dashboard: the user's own proposals — drafts, submitted/live, forks —
  newest first. No pagination needed at MVP scale (their own rows only).
  """
  @spec owner_proposals(Ecto.UUID.t()) :: {:ok, [Proposal.t()]}
  def owner_proposals(user_id), do: unimplemented({user_id})

  @doc "Direct children of a proposal (Forks tab / tree level; recursive walk is P2)."
  @spec list_forks(String.t()) :: {:ok, [Proposal.t()]} | {:error, :not_found}
  def list_forks(slug), do: unimplemented({slug})

  ## Moderation --------------------------------------------------------------

  @doc """
  Apply a status transition as moderator (`moderator_transitions/0`) and
  append the `status_change` moderation event. Invalid moves return
  `{:error, :invalid_transition}` — the lifecycle is DB-authoritative.
  """
  @spec change_status(actor(), String.t(), atom(), String.t() | nil) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :invalid_transition | Ecto.Changeset.t()}
  def change_status(actor, slug, to_status, reason \\ nil),
    do: unimplemented({actor, slug, to_status, reason})

  @doc "Hide a proposal (soft-hide via `hidden_at`) + `hide` event. Hidden rows 404 publicly."
  @spec hide(actor(), String.t(), String.t() | nil) ::
          {:ok, Proposal.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def hide(actor, slug, reason \\ nil), do: unimplemented({actor, slug, reason})

  @doc "Reverse a hide + `unhide` event."
  @spec unhide(actor(), String.t()) :: {:ok, Proposal.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def unhide(actor, slug), do: unimplemented({actor, slug})

  @doc "Audit trail for a proposal, newest first."
  @spec moderation_events(String.t()) :: {:ok, [ModerationEvent.t()]} | {:error, :not_found}
  def moderation_events(slug), do: unimplemented({slug})

  @doc """
  Moderator queue: hidden proposals, open reports, and proposals whose
  discussion sync is `:failed` (manual retry targets).
  """
  @spec moderation_queue() ::
          {:ok, %{hidden: [Proposal.t()], reported: [Report.t()], sync_failed: [Proposal.t()]}}
  def moderation_queue, do: unimplemented(:moderation_queue)

  ## Reports -----------------------------------------------------------------

  @doc """
  File an abuse report (public endpoint; Turnstile-gated above this layer).
  Appends the matching `report` moderation event. `reporter_id` is nil for
  anonymous reports.
  """
  @spec create_report(String.t(), Ecto.UUID.t() | nil, map()) ::
          {:ok, Report.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def create_report(slug, reporter_id, attrs), do: unimplemented({slug, reporter_id, attrs})

  @doc "Moderator resolves/dismisses a report (open reports feed moderation_queue/0)."
  @spec resolve_report(actor(), Ecto.UUID.t(), :resolved | :dismissed) ::
          {:ok, Report.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def resolve_report(actor, report_id, outcome), do: unimplemented({actor, report_id, outcome})

  @doc "Reports by status (`:open` for the queue)."
  @spec list_reports(:open | :resolved | :dismissed) :: {:ok, [Report.t()]}
  def list_reports(status), do: unimplemented({status})

  ## Discussion sync (github-sync lane) --------------------------------------

  @doc "Idempotently create the pending link for a proposal (on submit)."
  @spec ensure_discussion_link(Ecto.UUID.t(), String.t()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def ensure_discussion_link(proposal_id, repo), do: unimplemented({proposal_id, repo})

  @doc "Creation succeeded: `state: :ok`, store number/node/url/category."
  @spec record_discussion_created(Ecto.UUID.t(), map()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_created(proposal_id, attrs), do: unimplemented({proposal_id, attrs})

  @doc """
  Creation attempt failed: `attempts` +1, `last_error` set; `state` moves to
  `:failed` after `max_attempts` (config `:semtext, :proposals,
  :discussion_max_attempts`, default 5), stays `:pending` while retrying.
  """
  @spec record_discussion_failure(Ecto.UUID.t(), String.t()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_failure(proposal_id, error), do: unimplemented({proposal_id, error})

  @doc "Webhook sync landed: update counts/reactions + `last_synced_at` (state unchanged)."
  @spec record_discussion_sync(Ecto.UUID.t(), map()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_sync(proposal_id, attrs), do: unimplemented({proposal_id, attrs})

  @doc "Manual retry: `:failed -> :pending` (attempts preserved for the audit story)."
  @spec retry_discussion(Ecto.UUID.t()) ::
          {:ok, DiscussionLink.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def retry_discussion(proposal_id), do: unimplemented({proposal_id})

  @doc "Retry-worker input: links due for a creation attempt, oldest first."
  @spec pending_discussions(pos_integer()) :: {:ok, [DiscussionLink.t()]}
  def pending_discussions(limit \\ 25), do: unimplemented({limit})

  @doc "The link for a proposal, if any."
  @spec discussion_link_for(Ecto.UUID.t()) ::
          {:ok, DiscussionLink.t()} | {:error, :not_found}
  def discussion_link_for(proposal_id), do: unimplemented({proposal_id})

  ## Webhook dedupe ----------------------------------------------------------

  @doc """
  Record a `X-GitHub-Delivery` id BEFORE processing. `:new` means "proceed";
  `:duplicate` means a replayed delivery — the caller must no-op.
  """
  @spec record_delivery(String.t(), String.t() | nil) :: :new | :duplicate | {:error, Ecto.Changeset.t()}
  def record_delivery(delivery_id, event \\ nil), do: unimplemented({delivery_id, event})

  ## Rate limits ---------------------------------------------------------------

  @doc """
  Bucket configuration (see docs/proposals/API.md): submit 5/hour per user,
  report 10/hour per IP, fork 10/day per user (P2), read 120/min per IP.
  """
  @spec rate_buckets() :: %{rate_bucket() => %{limit: pos_integer(), window_seconds: pos_integer()}}
  def rate_buckets do
    %{
      submit: %{limit: 5, window_seconds: 60 * 60},
      report: %{limit: 10, window_seconds: 60 * 60},
      fork: %{limit: 10, window_seconds: 24 * 60 * 60},
      read: %{limit: 120, window_seconds: 60}
    }
  end

  @doc """
  Check-and-consume one token for `bucket`/`subject` (subject = user uuid or
  `"ip:" <> ip`). `:ok` consumes + records; `{:error, {:limited, secs}}`
  carries the Retry-After seconds. Implemented in
  `Semtext.Proposals.RateLimit`.
  """
  @spec consume_rate_limit(rate_bucket(), String.t()) :: :ok | {:error, {:limited, pos_integer()}}
  def consume_rate_limit(bucket, subject), do: unimplemented({bucket, subject})

  @doc "Retry-after seconds for an already-limited bucket/subject (for 429 bodies)."
  @spec rate_limit_retry_after(rate_bucket(), String.t()) :: pos_integer()
  def rate_limit_retry_after(bucket, subject), do: unimplemented({bucket, subject})

  ## Internals ----------------------------------------------------------------

  defp unimplemented(args) do
    # Contract-only placeholder (P1 data lane): bodies land in the
    # implementation commits. Other lanes may code against these heads now.
    raise "todo: Semtext.Proposals — #{inspect(args)}"
  end
end
