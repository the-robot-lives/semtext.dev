defmodule SemtextWeb.Hologram.Pages.Proposals.DetailPage do
  @moduledoc """
  `/p/:slug` — proposal detail on the proposals host (design §4).

  Overview and Discussion tabs; the sync chip renders from
  `discussion.state` (pending / ok / failed / removed — p1-data contract,
  including the `removed` follow-up: no link, recreate is the only way
  back). Moderators get an action panel (status transitions, hide/unhide,
  sync retry / discussion recreate); owners get withdraw while the status
  allows it; everyone gets the report form (the one Turnstile surface).

  Visibility is the data lane's contract: hidden proposals and
  drafts-for-strangers collapse to a real 404 (no existence leak). The
  404 happens in the `load_proposal` FUNCTION middleware — a middleware's
  non-nil status is terminal, so the body never renders. Command requests
  (`/hologram/command`) carry no path slug, so the middleware passes them
  through and every command re-validates visibility through the
  owner/moderator-scoped context functions instead.

  All derivation runs server-side in init (state = plain display data);
  template helpers are client-transpilable string/map reads only.
  """

  use Hologram.Page

  alias Semtext.Proposals
  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Components.Proposals.{ProblemNotice, ReportForm, StatusBadge, SyncChip}
  alias SemtextWeb.Hologram.Layouts.ProposalsLayout
  alias SemtextWeb.Hologram.Pages.Proposals.{Fields, HostGuard, Moderators, Problems}

  route "/p/:slug"

  param :slug, :string

  layout ProposalsLayout,
    page_title: "Proposal — SemText Proposals",
    description: "A SemText vocabulary proposal.",
    load_turnstile: true

  middleware HostGuard
  middleware :load_proposal

  # ── middleware ───────────────────────────────────────────────

  @doc "Function middleware: stash the visible proposal or 404 (terminal)."
  def load_proposal(server, _opts) do
    if String.starts_with?(server.path || "", "/hologram/command") do
      server
    else
      resolve(server)
    end
  end

  # ── init ─────────────────────────────────────────────────────

  def init(_params, component, server) do
    case get_stash(server, :proposal) do
      nil ->
        put_state(component, found: false)

      proposal ->
        init_found(proposal, get_stash(server, :discussion), server, component)
    end
  end

  defp init_found(proposal, discussion, server, component) do
    user = Auth.current_user(server)
    owner? = is_map(user) and user.id == proposal.submitter_id
    moderator? = Moderators.moderator?(user)
    discussion = discussion || %{state: :pending, comment_count: 0, url: nil}

    put_state(component,
      found: true,
      slug: proposal.slug,
      element_tag: Fields.hydrate_safe(proposal.element_tag),
      title: Fields.hydrate_safe(proposal.title),
      summary: Fields.hydrate_safe(proposal.summary || ""),
      motivation: Fields.hydrate_safe(proposal.motivation || ""),
      options: option_rows(proposal.options),
      example: Fields.hydrate_safe(proposal.example || ""),
      status: Atom.to_string(proposal.status),
      hidden: not is_nil(proposal.hidden_at),
      # sync chip inputs
      sync_state: Atom.to_string(discussion.state),
      comment_count: discussion.comment_count || 0,
      discussion_url: discussion.url || "",
      # viewer capabilities
      is_owner: owner?,
      is_moderator: moderator?,
      can_withdraw: owner? and proposal.status in [:draft, :submitted],
      # moderator panel
      next_statuses:
        Enum.map(Proposals.moderator_transitions()[proposal.status] || [], &Atom.to_string/1),
      # ui
      tab: "overview",
      page_title: Fields.hydrate_safe(proposal.title) <> " — SemText Proposals",
      # report form inputs (public Turnstile site key; "" = not configured)
      turnstile_site_key: turnstile_site_key(),
      problem: %{}
    )
  end

  # ── actions (client): forward to commands with the slug ──────

  def action(:show_overview, _params, component), do: put_state(component, tab: "overview")
  def action(:show_discussion, _params, component), do: put_state(component, tab: "discussion")

  def action(:request_withdraw, _params, component) do
    put_command(component, :withdraw, slug: component.state.slug)
  end

  def action(:request_transition, params, component) do
    put_command(component, :mod_transition, slug: component.state.slug, to: params.to)
  end

  def action(:request_hide, _params, component) do
    put_command(component, :mod_hide, slug: component.state.slug)
  end

  def action(:request_unhide, _params, component) do
    put_command(component, :mod_unhide, slug: component.state.slug)
  end

  def action(:request_retry_sync, _params, component) do
    put_command(component, :mod_retry_sync, slug: component.state.slug)
  end

  def action(:request_recreate_discussion, _params, component) do
    put_command(component, :mod_recreate_discussion, slug: component.state.slug)
  end

  # Commands cannot 302 (the client runtime has no redirect handling for
  # command responses) — they raise a :goto action instead; the action runs
  # client-side and navigates. URLs are always server-built (validated slug
  # + configured origin), so plain quoting is safe.
  def action(:goto, params, component) do
    Hologram.JS.exec("window.location.assign('" <> params.url <> "')")
    # The action must return the component struct (the client runtime reads
    # next_action off the return value).
    component
  end

  def action(:action_failed, params, component),
    do: put_state(component, problem: params.problem)

  # ── commands (server) — every one re-scopes through the context ──

  def command(:withdraw, params, server) do
    guard_owner_command(server, params, fn user, slug ->
      Problems.from_result(Proposals.withdraw(user.id, slug))
    end)
  end

  def command(:mod_transition, params, server) do
    guard_mod_command(server, params, fn _user, slug ->
      case status_atom(param_str(params, :to)) do
        {:ok, to} -> Problems.from_result(Proposals.change_status(%{system: :moderator_panel}, slug, to))
        :error -> {:error, Problems.problem("validation-failed", "Unknown status.")}
      end
    end)
  end

  def command(:mod_hide, params, server) do
    guard_mod_command(server, params, fn _user, slug ->
      Problems.from_result(Proposals.hide(%{system: :moderator_panel}, slug, nil))
    end)
  end

  def command(:mod_unhide, params, server) do
    guard_mod_command(server, params, fn _user, slug ->
      Problems.from_result(Proposals.unhide(%{system: :moderator_panel}, slug))
    end)
  end

  def command(:mod_retry_sync, params, server) do
    guard_mod_command(server, params, fn _user, _slug ->
      with {:ok, %{proposal: p}} <- lookup_visible(server, params),
           result <- Proposals.retry_discussion(p.id) do
        Problems.from_result(result)
      else
        _ -> {:error, Problems.problem("internal-error")}
      end
    end)
  end

  def command(:mod_recreate_discussion, params, server) do
    guard_mod_command(server, params, fn _user, _slug ->
      with {:ok, %{proposal: p}} <- lookup_visible(server, params),
           result <- Proposals.recreate_discussion(p.id) do
        Problems.from_result(result)
      else
        _ -> {:error, Problems.problem("internal-error")}
      end
    end)
  end

  # Shared skeleton: authenticate, resolve the slug from the command
  # params, re-check visibility (strangers cannot act on hidden rows by
  # slug guessing), then run the scoped action.
  defp guard_owner_command(server, params, fun) do
    with_command_user(server, fn user ->
      slug = command_slug(params)

      case visible?(server, params, slug) do
        true ->
          case fun.(user, slug) do
            {:ok, _} -> redirect_to_slug(server, slug)
            {:error, problem} -> fail(server, problem)
          end

        false ->
          fail(server, Problems.problem("not-found"))
      end
    end)
  end

  defp guard_mod_command(server, params, fun) do
    with_command_user(server, fn user ->
      if Moderators.moderator?(user) do
        slug = command_slug(params)

        case visible?(server, params, slug) do
          true ->
            case fun.(user, slug) do
              {:ok, _} -> redirect_to_slug(server, slug)
              {:error, problem} -> fail(server, problem)
            end

          false ->
            fail(server, Problems.problem("not-found"))
        end
      else
        fail(server, Problems.problem("forbidden"))
      end
    end)
  end

  defp with_command_user(server, fun) do
    case Auth.current_user(server) do
      nil -> fail(server, Problems.problem("unauthenticated"))
      user -> fun.(user)
    end
  end

  defp lookup_visible(server, params) do
    slug = command_slug(params)

    case Proposals.get_by_slug(slug, viewer_from_user(Auth.current_user(server))) do
      {:ok, %{proposal: p, discussion: _}} -> {:ok, %{proposal: p}}
      _ -> {:error, :not_found}
    end
  end

  defp visible?(server, _params, slug) do
    case Proposals.get_by_slug(slug, viewer_from_user(Auth.current_user(server))) do
      {:ok, %{proposal: _}} -> true
      _ -> false
    end
  end

  defp command_slug(params) do
    value = Map.get(params, :slug) || Map.get(params, "slug") || ""
    if is_binary(value), do: String.slice(value, 0, 200), else: ""
  end

  defp redirect_to_slug(server, slug) do
    put_action(server, :goto, url: "/p/" <> slug)
  end

  defp fail(server, problem) do
    put_action(server, :action_failed, problem: problem)
  end

  # ── server-side helpers ──────────────────────────────────────

  defp resolve(server) do
    slug = slug_from_path(server.path)

    case Proposals.get_by_slug(slug, viewer_from_user(Auth.current_user(server))) do
      {:ok, %{proposal: proposal, discussion: discussion}} ->
        server
        |> put_stash(:proposal, proposal)
        |> put_stash(:discussion, discussion)

      _ ->
        put_status(server, 404)
    end
  end

  defp slug_from_path(path) when is_binary(path) do
    case String.split(String.replace_prefix(path, "/p/", ""), "/") do
      [slug | _] -> slug
      [] -> ""
    end
  end

  defp slug_from_path(_), do: ""

  defp viewer_from_user(user), do: Moderators.viewer(user)

  defp option_rows(options) when is_list(options) do
    Enum.map(options, fn opt ->
      label = Map.get(opt, "label") || Map.get(opt, :label) || ""
      meaning = Map.get(opt, "meaning") || Map.get(opt, :meaning) || ""
      %{label: Fields.hydrate_safe(label), meaning: Fields.hydrate_safe(meaning)}
    end)
  end

  defp option_rows(_), do: []

  defp status_atom(s) when s in ["under_review", "accepted", "declined", "merged"],
    do: {:ok, String.to_existing_atom(s)}

  defp status_atom(_), do: :error

  defp turnstile_site_key do
    case Application.get_env(:semtext, :proposals_ui, []) do
      kw when is_list(kw) -> kw[:turnstile_site_key] || ""
      _ -> ""
    end
  end

  defp param_str(params, key) do
    value = Map.get(params, key) || Map.get(params, Atom.to_string(key)) || ""

    if is_binary(value) do
      String.slice(String.trim(value), 0, 2000)
    else
      ""
    end
  end

  # ── template ─────────────────────────────────────────────────

  def template do
    ~HOLO"""
    <div>
      {%if @found != true}
        <div class="border border-code-border px-4 py-6" data-cy="not-found">
          <div class="font-mono text-xs text-ink-faint">404</div>
          <h1 class="mt-1 text-lg font-semibold text-ink">No proposal here</h1>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-mute">
            Either the address is wrong or the proposal is not publicly
            visible. <a href="/" class="text-violet-soft hover:underline">Browse proposals</a>.
          </p>
        </div>
      {/if}
      {%if @found}
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-mono text-sm text-violet-soft" data-cy="detail-tag">{@element_tag}</span>
          <StatusBadge status={@status} />
          <SyncChip state={@sync_state} comment_count={@comment_count} url={@discussion_url} />
          {%if @hidden}
            <span class="inline-flex items-center border border-red-400 px-2 py-0.5 font-mono text-[0.68rem] text-red-400" data-cy="hidden-chip">
              Hidden
            </span>
          {/if}
        </div>
        <h1 class="mt-2 text-xl font-semibold text-ink" data-cy="detail-title">{@title}</h1>

        <div class="mt-4 flex gap-2" role="tablist">
          <button
            type="button"
            class={tab_class(@tab, "overview")}
            $click="show_overview"
            data-cy="tab-overview"
          >
            Overview
          </button>
          <button
            type="button"
            class={tab_class(@tab, "discussion")}
            $click="show_discussion"
            data-cy="tab-discussion"
          >
            Discussion
          </button>
        </div>

        {%if @tab == "overview"}
          <section class="mt-4 max-w-3xl" data-cy="overview">
            <p class="text-sm leading-relaxed text-ink">{@summary}</p>
            <h2 class="mt-6 font-mono text-xs uppercase text-ink-faint">Motivation</h2>
            <p class="mt-1 text-sm leading-relaxed text-ink-mute">{@motivation}</p>
            {%if Enum.empty?(@options) != true}
              <h2 class="mt-6 font-mono text-xs uppercase text-ink-faint">Options</h2>
              <table class="mt-2 w-full max-w-2xl text-sm">
                <tbody>
                  {%for opt <- @options}
                    <tr class="border-b border-code-border">
                      <td class="py-1 pr-4 font-mono text-violet-soft">{opt_label(opt)}</td>
                      <td class="py-1 text-ink-mute">{opt_meaning(opt)}</td>
                    </tr>
                  {/for}
                </tbody>
              </table>
            {/if}
            {%if @example != ""}
              <h2 class="mt-6 font-mono text-xs uppercase text-ink-faint">Example</h2>
              <pre class="mt-2 overflow-x-auto border border-code-border bg-slate-900 px-4 py-3 text-xs leading-5 text-ink" data-cy="detail-example"><code>{@example}</code></pre>
            {/if}
          </section>
        {/if}

        {%if @tab == "discussion"}
          <section class="mt-4 max-w-3xl" data-cy="discussion">
            {%if @sync_state == "ok"}
              <p class="text-sm leading-relaxed text-ink-mute">
                The GitHub discussion carries the conversation
                ({@comment_count} comments so far).
              </p>
              {%if @discussion_url != ""}
                <a href={@discussion_url} target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft" data-cy="discussion-link">
                  Open the GitHub discussion
                </a>
              {/if}
            {/if}
            {%if @sync_state == "pending"}
              <p class="text-sm leading-relaxed text-ink-mute" data-cy="discussion-pending">
                The GitHub discussion is being created — check back in a
                moment. This stays open until the webhook confirms.
              </p>
            {/if}
            {%if @sync_state == "failed"}
              <p class="text-sm leading-relaxed text-ink-mute" data-cy="discussion-failed">
                The GitHub discussion could not be created. A moderator can
                retry; the proposal itself is unaffected.
              </p>
            {/if}
            {%if @sync_state == "removed"}
              <p class="text-sm leading-relaxed text-ink-mute" data-cy="discussion-removed">
                The GitHub discussion was deleted. It is not recreated
                automatically; a moderator can recreate it, which starts a
                fresh discussion.
              </p>
            {/if}
            {%if @is_moderator and (@sync_state == "failed" or @sync_state == "removed")}
              <div class="mt-3 flex gap-2">
                {%if @sync_state == "failed"}
                  <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click="request_retry_sync" data-cy="retry-sync">
                    Retry sync
                  </button>
                {/if}
                {%if @sync_state == "removed"}
                  <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click="request_recreate_discussion" data-cy="recreate-discussion">
                    Recreate discussion
                  </button>
                {/if}
              </div>
            {/if}
          </section>
        {/if}

        {%if @is_moderator}
          <section class="mt-8 border border-violet-soft px-4 py-4" data-cy="moderator-panel">
            <div class="font-mono text-xs uppercase text-violet-soft">Moderator actions</div>
            <ProblemNotice problem={@problem} />
            <div class="mt-3 flex flex-wrap gap-2">
              {%for st <- @next_statuses}
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click={:request_transition, to: st} data-cy={"mod-" <> st}>
                  Mark {st}
                </button>
              {/for}
              {%if @hidden}
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click="request_unhide" data-cy="mod-unhide">
                  Unhide
                </button>
              {%else}
                <button type="button" class="inline-flex min-h-11 items-center border border-red-400 px-4 py-2 font-mono text-xs text-red-400 hover:brightness-110" $click="request_hide" data-cy="mod-hide">
                  Hide proposal
                </button>
              {/if}
            </div>
          </section>
        {/if}

        {%if @can_withdraw}
          <div class="mt-6">
            <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink-mute hover:border-red-400" $click="request_withdraw" data-cy="withdraw">
              Withdraw this proposal
            </button>
          </div>
        {/if}

        <div class="mt-10">
          <ReportForm cid="report-form" slug={@slug} site_key={@turnstile_site_key} />
        </div>
      {/if}
    </div>
    """
  end

  # ── client-transpilable helpers ──────────────────────────────

  defp opt_label(opt), do: Map.get(opt, :label) || ""
  defp opt_meaning(opt), do: Map.get(opt, :meaning) || ""

  defp tab_class(tab, which) do
    active =
      if tab == which do
        "border-violet-soft text-violet-soft"
      else
        "border-code-border text-ink-mute"
      end

    active <> " border px-4 py-2 font-mono text-xs"
  end
end
