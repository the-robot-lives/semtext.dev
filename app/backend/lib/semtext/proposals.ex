defmodule Semtext.Proposals do
  @moduledoc """
  〚📦:0c187ff2-d759-53b6-b2a6-f770a7f6be4f〛 Semtext.Proposals :: Proposals domain facade — proposals, versions, discussion links, moderation, reports, rate limits (P1 lane contract).

  Public context for the proposals domain (P1 contract — LANE=data).

  Other lanes (github-sync, ui, auth) code against THESE functions. Error contract:

    | returned                        | meaning                                   | HTTP mapping       |
    |---------------------------------|-------------------------------------------|--------------------|
    | `{:ok, value}`                  | success                                   | 2xx                |
    | `{:ok, value, :replayed}`       | Idempotency-Key replay; original returned  | 2xx + `Idempotency-Replayed: true` |
    | `{:error, %Ecto.Changeset{}}`   | validation failure (`errors` map in body) | 422 validation-failed |
    | `{:error, :not_found}`          | missing OR hidden/draft for this viewer   | 404 not-found      |
    | `{:error, :invalid_transition}` | status lifecycle violation                | 409 invalid-status-transition |
    | `{:error, {:limited, secs}}`    | rate limit exhausted (`secs` = retry-after) | 429 rate-limited  |

  Full HTTP + Hologram-command shapes, problem+json catalogue and rate-limit
  buckets: `docs/proposals/API.md`.
  """

  import Ecto.Query, warn: false

  alias Semtext.Proposals.DiscussionLink
  alias Semtext.Proposals.ModerationEvent
  alias Semtext.Proposals.Proposal
  alias Semtext.Proposals.ProposalVersion
  alias Semtext.Proposals.Queries
  alias Semtext.Proposals.RateLimit
  alias Semtext.Proposals.Report
  alias Semtext.Proposals.WebhookDelivery
  alias Semtext.Repo

  ## Types -------------------------------------------------------------------

  @typedoc "Actor of a moderation/status action: a moderator user or the system."
  @type actor :: %{user_id: Ecto.UUID.t()} | %{system: String.t()}

  @typedoc """
  Who is asking. `nil` = anonymous. Moderators see hidden/draft rows;
  owners additionally see their own drafts.
  """
  @type viewer :: nil | %{user_id: Ecto.UUID.t(), moderator: boolean()}

  @typedoc "Opaque cursor page returned by every list function."
  @type page(t) :: %{items: [t], next_cursor: String.t() | nil, has_more: boolean()}

  @typedoc "List/search filters (atom keys) — see `list_proposals/2`."
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
  @max_slug_attempts 10

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
  Submit a proposal: creates the row plus version 1 (computing `files_sha256`
  from the optional file set), creates the pending discussion link, and
  dedupes on `idempotency_key` — a replay returns the ORIGINAL proposal with
  `:replayed`. `attrs` accept string or atom keys
  (element_tag/title/summary/motivation/options/example, optional files, optional slug).
  """
  @spec create_and_submit(Ecto.UUID.t(), map(), String.t() | nil) :: create_result()
  def create_and_submit(user_id, attrs, idempotency_key) when is_binary(user_id) do
    case idempotent_lookup(idempotency_key) do
      %Proposal{} = existing ->
        {:ok, Repo.preload(existing, :discussion_link), :replayed}

      nil ->
        base = normalize_attrs(attrs)

        with {:ok, cs} <- base_changeset(user_id, base, idempotency_key) do
          insert_submitted(cs, user_id, base, idempotency_key, 1)
        end
    end
  end

  defp insert_submitted(cs, user_id, base, idempotency_key, attempt) do
    result =
      Repo.transaction(fn ->
        with {:ok, proposal} <- Repo.insert(cs),
             {:ok, proposal} <- attach_version_1(proposal, user_id, base.files),
             {:ok, _link} <- ensure_discussion_link(proposal.id, discussion_repo()),
             {:ok, proposal} <- transition(proposal, :submitted, %{user_id: user_id}, nil),
             # Same transaction as the submit: a rollback (e.g. slug retry)
             # can never leave an orphan Oban job behind.
             {:ok, _job} <- Semtext.Github.Sync.enqueue_discussion(proposal.id) do
          Repo.preload(proposal, :discussion_link)
        else
          {:error, %Ecto.Changeset{} = cs} -> Repo.rollback({:changeset, cs})
          {:error, reason} -> Repo.rollback({:error, reason})
        end
      end)

    case result do
      {:ok, proposal} ->
        {:ok, proposal, :created}

      {:error, {:changeset, cs}} ->
        handle_create_conflicts(cs, user_id, base, idempotency_key, attempt)

      {:error, {:error, reason}} ->
        {:error, reason}
    end
  end

  # Unique-constraint fall-out: idempotency race → replay; slug collision →
  # retry with a `-2`, `-3`, … suffix (max #{@max_slug_attempts} attempts).
  defp handle_create_conflicts(cs, user_id, base, idempotency_key, attempt) do
    cond do
      idempotency_taken?(cs.errors) and idempotency_key != nil ->
        case idempotent_lookup(idempotency_key) do
          %Proposal{} = existing -> {:ok, Repo.preload(existing, :discussion_link), :replayed}
          nil -> {:error, cs}
        end

      slug_taken?(cs.errors) and attempt < @max_slug_attempts ->
        next = attempt + 1
        base = Map.put(base, :slug, bump_slug(base.slug || base.element_tag, attempt, next))

        with {:ok, cs} <- base_changeset(user_id, base, idempotency_key) do
          insert_submitted(cs, user_id, base, idempotency_key, next)
        end

      true ->
        {:error, cs}
    end
  end

  # slug for attempt `prev` carried suffix(prev); build the slug for `next`.
  defp bump_slug(stem, 1, next), do: stem <> suffix(next)

  defp bump_slug(slug, prev, next),
    do: slug |> String.replace_suffix(suffix(prev), "") |> Kernel.<>(suffix(next))

  defp suffix(1), do: ""
  defp suffix(n) when is_integer(n) and n > 1, do: "-#{n}"

  @doc "Save a draft (owner-only visibility; `status: :draft`, no version yet)."
  @spec save_draft(Ecto.UUID.t(), map()) :: {:ok, Proposal.t()} | {:error, Ecto.Changeset.t()}
  def save_draft(user_id, attrs) when is_binary(user_id) do
    base = normalize_attrs(attrs)

    with {:ok, cs} <- base_changeset(user_id, base, nil) do
      insert_draft(cs, user_id, base, 1)
    end
  end

  defp insert_draft(cs, user_id, base, attempt) do
    case Repo.insert(cs) do
      {:ok, proposal} ->
        {:ok, proposal}

      {:error, cs} ->
        if slug_taken?(cs.errors) and attempt < @max_slug_attempts do
          next = attempt + 1
          base = Map.put(base, :slug, bump_slug(base.slug || base.element_tag, attempt, next))

          with {:ok, cs} <- base_changeset(user_id, base, nil) do
            insert_draft(cs, user_id, base, next)
          end
        else
          {:error, cs}
        end
    end
  end

  @doc "Edit an owned draft's fields (drafts only; post-submit edits are P2 versions)."
  @spec update_draft(Ecto.UUID.t(), String.t(), map()) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :invalid_transition | Ecto.Changeset.t()}
  def update_draft(user_id, slug, attrs) when is_binary(user_id) do
    case owner_proposal(user_id, slug) do
      nil ->
        {:error, :not_found}

      %Proposal{status: :draft} = proposal ->
        proposal
        |> Proposal.edit_changeset(attrs)
        |> Repo.update()

      %Proposal{} ->
        {:error, :invalid_transition}
    end
  end

  @doc "Owner submits a draft (`draft -> submitted`, writes version 1 + pending discussion link)."
  @spec submit_draft(Ecto.UUID.t(), String.t()) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :invalid_transition | Ecto.Changeset.t()}
  def submit_draft(user_id, slug) when is_binary(user_id) do
    case owner_proposal(user_id, slug) do
      nil ->
        {:error, :not_found}

      %Proposal{status: :draft} = proposal ->
        result =
          Repo.transaction(fn ->
            with {:ok, proposal} <- attach_version_1(proposal, user_id, %{}),
                 {:ok, _link} <- ensure_discussion_link(proposal.id, discussion_repo()),
                 {:ok, proposal} <- transition(proposal, :submitted, %{user_id: user_id}, nil),
                 {:ok, _job} <- Semtext.Github.Sync.enqueue_discussion(proposal.id) do
              Repo.preload(proposal, :discussion_link)
            else
              {:error, %Ecto.Changeset{} = cs} -> Repo.rollback({:changeset, cs})
              {:error, reason} -> Repo.rollback({:error, reason})
            end
          end)

        unwrap(result)

      %Proposal{} ->
        {:error, :invalid_transition}
    end
  end

  @doc "Owner withdraws (`draft/submitted -> withdrawn`)."
  @spec withdraw(Ecto.UUID.t(), String.t()) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :invalid_transition | Ecto.Changeset.t()}
  def withdraw(user_id, slug) when is_binary(user_id) do
    case owner_proposal(user_id, slug) do
      nil ->
        {:error, :not_found}

      %Proposal{status: status} = proposal ->
        if status in [:draft, :submitted] do
          Repo.transaction(fn ->
            with {:ok, proposal} <- transition(proposal, :withdrawn, %{user_id: user_id}, nil) do
              proposal
            else
              {:error, %Ecto.Changeset{} = cs} -> Repo.rollback({:changeset, cs})
              {:error, reason} -> Repo.rollback({:error, reason})
            end
          end)
          |> unwrap()
        else
          {:error, :invalid_transition}
        end
    end
  end

  ## Reads -------------------------------------------------------------------

  @doc """
  Detail by slug. Visibility: public rows for everyone; drafts only for the
  owner + moderators; hidden rows only for moderators. Hidden/draft-for-
  stranger collapses to `{:error, :not_found}` (no existence leak).
  """
  @spec get_by_slug(String.t(), viewer()) ::
          {:ok, %{proposal: Proposal.t(), discussion: DiscussionLink.t() | nil}}
          | {:error, :not_found}
  def get_by_slug(slug, viewer \\ nil) do
    case Repo.one(from p in Proposal, where: p.slug == ^slug) do
      nil ->
        {:error, :not_found}

      proposal ->
        if Queries.can_view?(proposal, viewer) do
          proposal = Repo.preload(proposal, :discussion_link)
          {:ok, %{proposal: proposal, discussion: proposal.discussion_link}}
        else
          {:error, :not_found}
        end
    end
  end

  @doc """
  Browse/search with cursor pagination. `q` runs Postgres full-text over the
  generated tsvector (tag + title + summary + motivation, websearch syntax);
  `tag` is an exact element_tag filter; default sort `:newest`. Public calls
  see only `public_statuses()` non-hidden rows; a moderator may pass
  `include_hidden: true` to lift both veils (moderation queue view).
  """
  @spec list_proposals(filters(), viewer()) :: {:ok, page(Proposal.t())}
  def list_proposals(filters \\ %{}, viewer \\ nil)

  def list_proposals(filters, viewer) do
    filters = filters || %{}
    moderator? = is_map(viewer) and viewer[:moderator] == true
    include_hidden? = moderator? and Map.get(filters, :include_hidden, false)

    base =
      if include_hidden? do
        Proposal
      else
        Queries.visible_to(viewer)
      end

    {query, limit} =
      base
      |> Queries.filter(filters, viewer)
      |> Queries.paginate(filters)

    sort = Queries.normalize_sort(filters[:sort])

    items =
      query
      |> limit(^(limit + 1))
      |> Repo.all()
      |> Repo.preload(:discussion_link)

    {:ok, Queries.page(items, limit, sort)}
  end

  @doc "Version list for a slug, descending (public rows only — drafts have no versions yet)."
  @spec list_versions(String.t()) :: {:ok, [ProposalVersion.t()]} | {:error, :not_found}
  def list_versions(slug) do
    with {:ok, %{proposal: proposal}} <- get_by_slug(slug, nil) do
      {:ok,
       Repo.all(
         from v in ProposalVersion,
           where: v.proposal_id == ^proposal.id,
           order_by: [desc: v.version]
       )}
    end
  end

  @doc "Exact version of a slug."
  @spec get_version(String.t(), pos_integer()) ::
          {:ok, ProposalVersion.t()} | {:error, :not_found}
  def get_version(slug, n) do
    with {:ok, %{proposal: proposal}} <- get_by_slug(slug, nil) do
      case Repo.one(
             from v in ProposalVersion,
               where: v.proposal_id == ^proposal.id and v.version == ^n
           ) do
        nil -> {:error, :not_found}
        version -> {:ok, version}
      end
    end
  end

  @doc """
  Dashboard: the user's own proposals — drafts, live, withdrawn, forks —
  newest-updated first. No pagination at MVP scale (their own rows only).
  """
  @spec owner_proposals(Ecto.UUID.t()) :: {:ok, [Proposal.t()]}
  def owner_proposals(user_id) do
    {:ok,
     Repo.all(
       from p in Proposal,
         where: p.submitter_id == ^user_id,
         order_by: [desc: p.updated_at]
     )
     |> Repo.preload(:discussion_link)}
  end

  @doc "Direct children of a proposal (Forks tab / tree level; recursive walk is P2)."
  @spec list_forks(String.t()) :: {:ok, [Proposal.t()]} | {:error, :not_found}
  def list_forks(slug) do
    with {:ok, %{proposal: parent}} <- get_by_slug(slug, nil) do
      {:ok,
       Queries.public_visible()
       |> where([p], p.forked_from_proposal_id == ^parent.id)
       |> order_by([p], desc: p.inserted_at)
       |> Repo.all()
       |> Repo.preload(:discussion_link)}
    end
  end

  ## Moderation --------------------------------------------------------------

  @doc """
  Apply a status transition as moderator (`moderator_transitions/0`) and
  append the `status_change` moderation event. Invalid moves return
  `{:error, :invalid_transition}` — the lifecycle is DB-authoritative.
  The caller must have enforced `require_role(:moderator)`; this layer
  records the actor, it does not re-check group membership.
  """
  @spec change_status(actor(), String.t(), atom(), String.t() | nil) ::
          {:ok, Proposal.t()}
          | {:error, :not_found | :invalid_transition | Ecto.Changeset.t()}
  def change_status(actor, slug, to_status, reason \\ nil) do
    case Repo.one(from p in Proposal, where: p.slug == ^slug) do
      nil ->
        {:error, :not_found}

      %Proposal{status: from} = proposal ->
        if to_status in Map.get(moderator_transitions(), from, []) do
          result =
            Repo.transaction(fn ->
              with {:ok, proposal} <- transition(proposal, to_status, actor, reason) do
                proposal
              else
                {:error, %Ecto.Changeset{} = cs} -> Repo.rollback({:changeset, cs})
                {:error, reason} -> Repo.rollback({:error, reason})
              end
            end)

          unwrap(result)
        else
          {:error, :invalid_transition}
        end
    end
  end

  @doc "Hide a proposal (soft-hide via `hidden_at`) + `hide` event. Hidden rows 404 publicly."
  @spec hide(actor(), String.t(), String.t() | nil) ::
          {:ok, Proposal.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def hide(actor, slug, reason \\ nil) do
    case Repo.one(from p in Proposal, where: p.slug == ^slug) do
      nil ->
        {:error, :not_found}

      proposal ->
        with {:ok, proposal} <-
               proposal |> Ecto.Changeset.change(hidden_at: DateTime.utc_now()) |> Repo.update(),
             {:ok, _} <- append_event(proposal, :hide, actor, %{reason: reason}) do
          {:ok, proposal}
        end
    end
  end

  @doc "Reverse a hide + `unhide` event."
  @spec unhide(actor(), String.t()) ::
          {:ok, Proposal.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def unhide(actor, slug) do
    case Repo.one(from p in Proposal, where: p.slug == ^slug) do
      nil ->
        {:error, :not_found}

      proposal ->
        with {:ok, proposal} <-
               proposal |> Ecto.Changeset.change(hidden_at: nil) |> Repo.update(),
             {:ok, _} <- append_event(proposal, :unhide, actor, %{}) do
          {:ok, proposal}
        end
    end
  end

  @doc "Audit trail for a proposal, newest first."
  @spec moderation_events(String.t()) :: {:ok, [ModerationEvent.t()]} | {:error, :not_found}
  def moderation_events(slug) do
    case Repo.one(from p in Proposal, where: p.slug == ^slug, select: p.id) do
      nil ->
        {:error, :not_found}

      proposal_id ->
        {:ok,
         Repo.all(
           from e in ModerationEvent,
             where: e.proposal_id == ^proposal_id,
             order_by: [desc: e.inserted_at]
         )}
    end
  end

  @doc """
  Moderator queue: hidden proposals, open reports, and proposals whose
  discussion sync is `:failed` (manual retry targets).
  """
  @spec moderation_queue() ::
          {:ok, %{hidden: [Proposal.t()], reported: [Report.t()], sync_failed: [Proposal.t()]}}
  def moderation_queue do
    hidden =
      Repo.all(from p in Proposal, where: not is_nil(p.hidden_at), order_by: [desc: p.hidden_at])
      |> Repo.preload(:discussion_link)

    reported =
      Repo.all(from r in Report, where: r.status == :open, order_by: [desc: r.inserted_at])
      |> Repo.preload(proposal: [:discussion_link])

    sync_failed =
      Repo.all(
        from p in Proposal,
          join: dl in DiscussionLink,
          on: dl.proposal_id == p.id,
          where: dl.state == :failed,
          order_by: [asc: dl.updated_at]
      )
      |> Repo.preload(:discussion_link)

    {:ok, %{hidden: hidden, reported: reported, sync_failed: sync_failed}}
  end

  ## Reports -----------------------------------------------------------------

  @doc """
  File an abuse report (public endpoint; Turnstile-gated above this layer).
  Appends the matching `report` moderation event. `reporter_id` is nil for
  anonymous reports. Target must be publicly visible (404 otherwise).
  """
  @spec create_report(String.t(), Ecto.UUID.t() | nil, map()) ::
          {:ok, Report.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def create_report(slug, reporter_id, attrs) do
    case Repo.one(from p in Queries.public_visible(), where: p.slug == ^slug) do
      nil ->
        {:error, :not_found}

      proposal ->
        attrs =
          normalize_report_attrs(attrs)
          |> Map.merge(%{proposal_id: proposal.id, reporter_id: reporter_id})

        result =
          Repo.transaction(fn ->
            with {:ok, report} <- %Report{} |> Report.changeset(attrs) |> Repo.insert(),
                 {:ok, _} <-
                   append_event(proposal, :report, %{system: "public-report"}, %{
                     actor_user_id: reporter_id,
                     reason: "report filed (#{report.reason})"
                   }) do
              report
            else
              {:error, %Ecto.Changeset{} = cs} -> Repo.rollback({:changeset, cs})
              {:error, reason} -> Repo.rollback({:error, reason})
            end
          end)

        unwrap(result)
    end
  end

  @doc "Moderator resolves/dismisses a report (open reports feed moderation_queue/0)."
  @spec resolve_report(actor(), Ecto.UUID.t(), :resolved | :dismissed) ::
          {:ok, Report.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def resolve_report(_actor, report_id, outcome) when outcome in [:resolved, :dismissed] do
    case Repo.get(Report, report_id) do
      nil -> {:error, :not_found}
      report -> report |> Report.changeset(%{status: outcome}) |> Repo.update()
    end
  end

  @doc "Reports by status (`:open` for the queue)."
  @spec list_reports(:open | :resolved | :dismissed) :: {:ok, [Report.t()]}
  def list_reports(status) do
    {:ok,
     Repo.all(
       from r in Report,
         where: r.status == ^status,
         order_by: [desc: r.inserted_at],
         preload: [:proposal]
     )}
  end

  ## Discussion sync (github-sync lane) --------------------------------------

  @doc "Idempotently create the pending link for a proposal (on submit)."
  @spec ensure_discussion_link(Ecto.UUID.t(), String.t()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def ensure_discussion_link(proposal_id, repo) do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      %DiscussionLink{} = link ->
        {:ok, link}

      nil ->
        %DiscussionLink{}
        |> DiscussionLink.changeset(%{proposal_id: proposal_id, repo: repo, state: :pending})
        |> Repo.insert()
    end
  end

  @doc "Creation succeeded: `state: :ok`, store number/node/url/category, clear last_error."
  @spec record_discussion_created(Ecto.UUID.t(), map()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_created(proposal_id, attrs) do
    with {:ok, link} <-
           ensure_discussion_link(
             proposal_id,
             Map.get(attrs, :repo) || Map.get(attrs, "repo") || discussion_repo()
           ) do
      attrs =
        attrs
        |> maybe_put_atom_key("repo")
        |> Map.merge(%{state: :ok, last_error: nil})

      link |> DiscussionLink.changeset(attrs) |> Repo.update()
    end
  end

  @doc """
  Creation attempt failed: `attempts` +1, `last_error` set; `state` moves to
  `:failed` after `config :semtext, :proposals, :discussion_max_attempts`
  (default 5), stays `:pending` while retrying. No-op on an already-`:ok`
  link (a late failure against a created discussion must not flip the chip).
  """
  @spec record_discussion_failure(Ecto.UUID.t(), String.t() | nil) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_failure(proposal_id, error) do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      nil ->
        {:error,
         %DiscussionLink{}
         |> Ecto.Changeset.change()
         |> Ecto.Changeset.add_error(:proposal_id, "does not exist")}

      %DiscussionLink{state: :ok} = link ->
        {:ok, link}

      %DiscussionLink{} = link ->
        attempts = link.attempts + 1
        state = if attempts >= discussion_max_attempts(), do: :failed, else: :pending

        link
        |> DiscussionLink.changeset(%{
          attempts: attempts,
          state: state,
          last_error: String.slice(error || "unknown error", 0, 2000)
        })
        |> Repo.update()
    end
  end

  @doc """
  Webhook `discussion.deleted` / removed-on-GitHub: `state -> :removed` with
  the reason in `last_error`. Only an `:ok` link can become `:removed` — a
  discussion must have existed to be deleted; a stale webhook against a
  `:pending`/`:failed` link is a no-op so it can never suppress creation.
  Recreation is NEVER automatic — only `recreate_discussion/1`.
  """
  @spec record_discussion_removed(Ecto.UUID.t(), String.t()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_removed(proposal_id, reason \\ "discussion removed on GitHub") do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      nil ->
        {:error,
         %DiscussionLink{}
         |> Ecto.Changeset.change()
         |> Ecto.Changeset.add_error(:proposal_id, "does not exist")}

      %DiscussionLink{state: :ok} = link ->
        link
        |> DiscussionLink.changeset(%{
          state: :removed,
          last_error: String.slice(reason || "discussion removed on GitHub", 0, 2000)
        })
        |> Repo.update()

      %DiscussionLink{} = link ->
        {:ok, link}
    end
  end

  @doc "Webhook sync landed: update counts/reactions + `last_synced_at` (state unchanged)."
  @spec record_discussion_sync(Ecto.UUID.t(), map()) ::
          {:ok, DiscussionLink.t()} | {:error, Ecto.Changeset.t()}
  def record_discussion_sync(proposal_id, attrs) do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      nil ->
        {:error,
         %DiscussionLink{}
         |> Ecto.Changeset.change()
         |> Ecto.Changeset.add_error(:proposal_id, "does not exist")}

      link ->
        attrs = Map.merge(attrs, %{last_synced_at: DateTime.utc_now()})
        link |> DiscussionLink.changeset(attrs) |> Repo.update()
    end
  end

  @doc "Manual retry: `:failed -> :pending` (attempts preserved for the audit story)."
  @spec retry_discussion(Ecto.UUID.t()) ::
          {:ok, DiscussionLink.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def retry_discussion(proposal_id) do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      nil ->
        {:error, :not_found}

      %DiscussionLink{state: :failed} = link ->
        link |> DiscussionLink.changeset(%{state: :pending}) |> Repo.update()

      link ->
        {:ok, link}
    end
  end

  @doc """
  Moderator action for a `:removed` link: `state -> :pending` with a FRESH
  attempt budget (the old attempts belong to a discussion that no longer
  exists), clears the link target, and re-enqueues creation — link update and
  job insert in one transaction. The only path back from `:removed`; the
  worker refuses `:removed` links, so nothing recreates implicitly.
  """
  @spec recreate_discussion(Ecto.UUID.t()) ::
          {:ok, DiscussionLink.t()} | {:error, :not_found | :invalid_transition | Ecto.Changeset.t()}
  def recreate_discussion(proposal_id) do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      nil ->
        {:error, :not_found}

      %DiscussionLink{state: :removed} = link ->
        Repo.transaction(fn ->
          with {:ok, link} <-
                 link
                 |> DiscussionLink.changeset(%{
                   state: :pending,
                   attempts: 0,
                   last_error: nil,
                   discussion_number: nil,
                   node_id: nil,
                   url: nil
                 })
                 |> Repo.update(),
               {:ok, _job} <- Semtext.Github.Sync.enqueue_discussion(proposal_id) do
            link
          else
            {:error, %Ecto.Changeset{} = cs} -> Repo.rollback({:changeset, cs})
            {:error, reason} -> Repo.rollback({:error, reason})
          end
        end)
        |> unwrap()

      %DiscussionLink{} ->
        {:error, :invalid_transition}
    end
  end

  @doc "Retry-worker input: links due for a creation attempt, oldest first."
  @spec pending_discussions(pos_integer()) :: {:ok, [DiscussionLink.t()]}
  def pending_discussions(limit \\ 25) do
    {:ok,
     Repo.all(
       from dl in DiscussionLink,
         where: dl.state == :pending,
         order_by: [asc: dl.updated_at],
         limit: ^limit
     )}
  end

  @doc "The link for a proposal, if any."
  @spec discussion_link_for(Ecto.UUID.t()) :: {:ok, DiscussionLink.t()} | {:error, :not_found}
  def discussion_link_for(proposal_id) do
    case Repo.one(from dl in DiscussionLink, where: dl.proposal_id == ^proposal_id) do
      nil -> {:error, :not_found}
      link -> {:ok, link}
    end
  end

  ## Webhook dedupe ----------------------------------------------------------

  @doc """
  Record an `X-GitHub-Delivery` id BEFORE processing. `:new` means "proceed";
  `:duplicate` means a replayed delivery — the caller must no-op.
  """
  @spec record_delivery(delivery_id, event :: String.t() | nil) ::
          :new | :duplicate | {:error, Ecto.Changeset.t()}
        when delivery_id: String.t()
  def record_delivery(delivery_id, event \\ nil) do
    cs = WebhookDelivery.changeset(%WebhookDelivery{}, %{delivery_id: delivery_id, event: event})

    case Repo.insert(cs, on_conflict: :nothing, conflict_target: :delivery_id) do
      {:ok, %{id: attempted_id}} ->
        # on_conflict: :nothing + client-side autogen id: on a duplicate the DB
        # keeps the ORIGINAL row (different id), so re-select and compare.
        case Repo.one(from d in WebhookDelivery, where: d.delivery_id == ^delivery_id, select: d.id) do
          ^attempted_id -> :new
          _ -> :duplicate
        end

      {:error, cs} ->
        {:error, cs}
    end
  end

  ## Rate limits ---------------------------------------------------------------

  @doc """
  Bucket configuration (docs/proposals/API.md § Rate limits): submit 5/hour
  per user, report 10/hour per IP, fork 10/day per user (P2), read 120/min
  per IP.
  """
  @spec rate_buckets() :: %{
          rate_bucket() => %{limit: pos_integer(), window_seconds: pos_integer()}
        }
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
  carries the Retry-After seconds. See `Semtext.Proposals.RateLimit`.
  """
  @spec consume_rate_limit(rate_bucket(), String.t()) ::
          :ok | {:error, {:limited, pos_integer()}}
  def consume_rate_limit(bucket, subject), do: RateLimit.consume(bucket, subject)

  @doc "Retry-after seconds for an already-limited bucket/subject (for 429 bodies)."
  @spec rate_limit_retry_after(rate_bucket(), String.t()) :: pos_integer()
  def rate_limit_retry_after(bucket, subject), do: RateLimit.retry_after(bucket, subject)

  ## Internals ----------------------------------------------------------------

  defp unwrap({:ok, value}), do: {:ok, value}
  defp unwrap({:error, {:changeset, cs}}), do: {:error, cs}
  defp unwrap({:error, {:error, reason}}), do: {:error, reason}

  defp idempotent_lookup(nil), do: nil

  defp idempotent_lookup(key) when is_binary(key) do
    Repo.one(from p in Proposal, where: p.idempotency_key == ^key)
  end

  defp base_changeset(user_id, base, idempotency_key) do
    cs =
      Proposal.changeset(%Proposal{}, %{
        element_tag: base.element_tag,
        title: base.title,
        summary: base.summary,
        motivation: base.motivation,
        options: base.options,
        example: base.example,
        status: :draft,
        submitter_id: user_id,
        idempotency_key: idempotency_key,
        slug: base.slug || base.element_tag
      })

    if cs.valid?, do: {:ok, cs}, else: {:error, cs}
  end

  # Attach version 1 + persist the circular current_version_id pointer
  # (FK is DEFERRABLE INITIALLY DEFERRED — one transaction covers both writes).
  defp attach_version_1(proposal, user_id, files) do
    files = files || %{}

    %ProposalVersion{}
    |> ProposalVersion.changeset(%{
      proposal_id: proposal.id,
      version: 1,
      title: proposal.title,
      summary: proposal.summary,
      motivation: proposal.motivation,
      options: proposal.options,
      example: proposal.example,
      files: files,
      files_sha256: files_sha256(files),
      created_by_id: user_id
    })
    |> Repo.insert()
    |> case do
      {:ok, version} ->
        proposal
        |> Ecto.Changeset.change(current_version_id: version.id)
        |> Repo.update()

      {:error, cs} ->
        {:error, cs}
    end
  end

  # Status update + audit event in the CALLER's transaction (no nesting here).
  defp transition(proposal, to_status, actor, reason) do
    from_status = proposal.status

    with {:ok, proposal} <-
           proposal |> Ecto.Changeset.change(status: to_status) |> Repo.update(),
         {:ok, _} <-
           append_event(proposal, :status_change, actor, %{
             from_status: from_status,
             to_status: to_status,
             reason: reason
           }) do
      {:ok, proposal}
    end
  end

  defp append_event(proposal, event, actor, extra) do
    {actor_user_id, actor_system} =
      case actor do
        %{user_id: id} -> {id, nil}
        %{system: s} -> {nil, s}
        _ -> raise ArgumentError, "invalid moderation actor: #{inspect(actor)}"
      end

    base = %{
      proposal_id: proposal.id,
      actor_user_id: actor_user_id,
      actor_system: actor_system,
      event: event
    }

    %ModerationEvent{}
    |> ModerationEvent.changeset(Map.merge(base, extra))
    |> Repo.insert()
  end

  defp owner_proposal(user_id, slug) do
    Repo.one(from p in Proposal, where: p.slug == ^slug and p.submitter_id == ^user_id)
  end

  defp files_sha256(files) when is_map(files) do
    files
    |> ProposalVersion.canonical_files()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end

  defp normalize_attrs(attrs) when is_map(attrs) do
    %{
      element_tag: fetch_attr(attrs, :element_tag),
      title: fetch_attr(attrs, :title),
      summary: fetch_attr(attrs, :summary),
      motivation: fetch_attr(attrs, :motivation),
      options: fetch_attr(attrs, :options) || [],
      example: fetch_attr(attrs, :example) || "",
      files: fetch_attr(attrs, :files) || %{},
      slug: fetch_attr(attrs, :slug)
    }
  end

  defp normalize_report_attrs(attrs) when is_map(attrs) do
    %{
      reason: fetch_attr(attrs, :reason) || :other,
      details: fetch_attr(attrs, :details),
      status: fetch_attr(attrs, :status) || :open
    }
  end

  # Accept atom- or string-keyed payloads (Hologram commands, JSON bodies).
  defp fetch_attr(attrs, key) when is_atom(key) do
    Map.get(attrs, key) || Map.get(attrs, Atom.to_string(key))
  end

  # Copy a string-keyed value to its atom key when present (cast accepts both).
  defp maybe_put_atom_key(map, key) when is_map(map) and is_binary(key) do
    atom = String.to_existing_atom(key)

    case Map.fetch(map, key) do
      {:ok, value} -> Map.put(map, atom, value)
      :error -> map
    end
  end

  defp idempotency_taken?(errors), do: Keyword.has_key?(errors, :idempotency_key)
  defp slug_taken?(errors), do: Keyword.has_key?(errors, :slug)

  defp discussion_max_attempts do
    :semtext
    |> Application.get_env(:proposals, [])
    |> Keyword.get(:discussion_max_attempts, 5)
  end

  defp discussion_repo do
    :semtext
    |> Application.get_env(:proposals, [])
    |> Keyword.get(:discussion_repo, "noizu-labs-ml/npl-enhanced-content")
  end
end
