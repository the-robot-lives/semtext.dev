defmodule SemtextWeb.Hologram.Pages.Proposals.DashboardPage do
  @moduledoc """
  `/dashboard` — my proposals + drafts on the proposals host (design §4).

  Signed-in only (`RequireAuth`, the auth lane's middleware — it also
  gates every command). Sections: drafts (edit → `DraftEditor`, submit,
  withdraw) and submitted/live proposals (link out to their detail
  pages). `?draft=<slug>` opens the editor for that draft; `?new=1` for a
  fresh one.

  Submit consumes the per-user `:submit` rate bucket before
  `submit_draft/2`; failures surface as problem maps (429 carries the
  retry seconds).
  """

  use Hologram.Page

  alias Semtext.Proposals
  alias SemtextWeb.Hologram.Pages.Proposals.Fields
  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.Problems
  alias SemtextWeb.Hologram.Components.Proposals.DraftEditor
  alias SemtextWeb.Hologram.Components.Proposals.StatusBadge
  alias SemtextWeb.Hologram.Layouts.ProposalsLayout
  alias SemtextWeb.Hologram.Middleware.RequireAuth
  alias SemtextWeb.Hologram.Pages.Proposals.HostGuard

  route "/dashboard"

  layout ProposalsLayout,
    page_title: "My proposals — SemText Proposals",
    description: "Your SemText vocabulary proposals and drafts."

  middleware HostGuard
  middleware RequireAuth

  def init(_params, component, server) do
    user = get_stash(server, :current_user) || Auth.current_user(server)

    {:ok, proposals} = Proposals.owner_proposals(user.id)

    rows = Enum.map(proposals, &row_map/1)
    {drafts, live} = Enum.split_with(rows, fn row -> row.status == "draft" end)

    put_state(component,
      user_name: github_login(user),
      drafts: drafts,
      live: live,
      editor_open: editor_open?(server),
      editor_draft: editor_draft(server, proposals),
      problem: %{}
    )
  end

  # ── actions (client) ─────────────────────────────────────────

  def action(:open_new_draft, _params, component) do
    put_state(component, editor_open: true, editor_draft: %{}, problem: %{})
  end

  def action(:request_submit_draft, params, component) do
    put_command(component, :submit_draft, slug: params.slug)
  end

  def action(:request_withdraw, params, component) do
    put_command(component, :withdraw_draft, slug: params.slug)
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

  # ── commands (server) ────────────────────────────────────────

  def command(:submit_draft, params, server) do
    with_user(server, fn user ->
      slug = param_str(params, :slug)

      case Semtext.Proposals.consume_rate_limit(:submit, user.id) do
        :ok ->
          case Problems.from_result(Proposals.submit_draft(user.id, slug)) do
            {:ok, proposal} -> put_action(server, :goto, url: "/p/" <> proposal.slug)
            {:error, problem} -> fail(server, problem)
          end

        {:error, {:limited, secs}} ->
          fail(server, Problems.problem("rate-limited", %{"retry_after" => secs}))

        _ ->
          fail(server, Problems.problem("internal-error"))
      end
    end)
  end

  def command(:withdraw_draft, params, server) do
    with_user(server, fn user ->
      slug = param_str(params, :slug)

      case Problems.from_result(Proposals.withdraw(user.id, slug)) do
        {:ok, _} -> put_action(server, :goto, url: "/dashboard")
        {:error, problem} -> fail(server, problem)
      end
    end)
  end

  defp with_user(server, fun) do
    case Auth.current_user(server) do
      nil -> fail(server, Problems.problem("unauthenticated"))
      user -> fun.(user)
    end
  end

  defp fail(server, problem) do
    put_action(server, :action_failed, problem: problem)
  end

  # ── server-side helpers ──────────────────────────────────────

  defp row_map(p) do
    %{
      slug: p.slug,
      title: Fields.hydrate_safe(p.title),
      element_tag: Fields.hydrate_safe(p.element_tag),
      summary: Fields.hydrate_safe(p.summary || ""),
      status: Atom.to_string(p.status),
      updated: Calendar.strftime(p.updated_at, "%b %d, %Y")
    }
  end

  defp editor_open?(server) do
    server.query["draft"] != nil or server.query["new"] != nil
  end

  defp editor_draft(server, proposals) do
    slug = server.query["draft"] || ""

    case Enum.find(proposals, fn p -> p.slug == slug and p.status == :draft end) do
      nil ->
        %{}

      p ->
        # The editor edits the raw fields; options round-trip as the
        # free-text "label — meaning" block they were parsed from.
        %{
          slug: p.slug,
          element_tag: p.element_tag,
          title: Fields.hydrate_safe(p.title),
          summary: Fields.hydrate_safe(p.summary || ""),
          motivation: Fields.hydrate_safe(p.motivation || ""),
          attrs: options_text(p.options),
          example: Fields.hydrate_safe(p.example || "")
        }
    end
  end

  defp options_text(options) when is_list(options) do
    options
    |> Enum.map(fn opt ->
      label = Map.get(opt, "label") || Map.get(opt, :label) || ""
      meaning = Map.get(opt, "meaning") || Map.get(opt, :meaning) || ""

      if meaning == "" do
        label
      else
        label <> " — " <> meaning
      end
    end)
    |> Enum.reject(&(&1 == ""))
    |> Enum.join("\n")
  end

  defp options_text(_), do: ""

  defp github_login(user) do
    case user do
      %{github_login: login} when is_binary(login) and login != "" -> login
      _ -> "you"
    end
  end

  defp param_str(params, key) do
    value = Map.get(params, key) || Map.get(params, Atom.to_string(key)) || ""
    if is_binary(value), do: String.slice(value, 0, 200), else: ""
  end

  # ── template ─────────────────────────────────────────────────

  def template do
    ~HOLO"""
    <div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold text-ink" data-cy="dashboard-title">My proposals</h1>
        <button
          type="button"
          class="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
          $click="open_new_draft"
          data-cy="new-draft"
        >
          New draft
        </button>
      </div>

      {%if @editor_open}
        <div class="mt-6">
          <DraftEditor cid="draft-editor" draft={@editor_draft} />
        </div>
      {/if}

      <h2 class="mt-8 font-mono text-xs uppercase text-ink-faint">Drafts</h2>
      {%if Enum.empty?(@drafts)}
        <div class="mt-2 border border-code-border px-4 py-4 text-sm text-ink-mute" data-cy="drafts-empty">
          No drafts yet. Start one with “New draft”, or use the
          <a href="https://semtext.dev/extend/" class="text-violet-soft hover:underline">extend wizard</a>.
        </div>
      {%else}
        <div class="mt-2 grid gap-3">
          {%for row <- @drafts}
            <div class="border border-code-border px-4 py-3" data-cy="draft-row" data-slug={row_slug(row)}>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs text-violet-soft">{row_tag(row)}</span>
                <StatusBadge status={row_status(row)} />
                <span class="font-mono text-[0.68rem] text-ink-faint">{row_updated(row)}</span>
              </div>
              <div class="mt-1 text-sm font-semibold text-ink">{row_title(row)}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <a href={"/dashboard?draft=" <> row_slug(row)} class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" data-cy="draft-edit">
                  Edit
                </a>
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click={:request_submit_draft, slug: row_slug(row)} data-cy="draft-submit">
                  Submit for review
                </button>
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink-mute hover:border-red-400" $click={:request_withdraw, slug: row_slug(row)} data-cy="draft-withdraw">
                  Withdraw
                </button>
              </div>
            </div>
          {/for}
        </div>
      {/if}

      <h2 class="mt-8 font-mono text-xs uppercase text-ink-faint">Submitted &amp; live</h2>
      {%if Enum.empty?(@live)}
        <div class="mt-2 border border-code-border px-4 py-4 text-sm text-ink-mute" data-cy="live-empty">
          Nothing submitted yet.
        </div>
      {%else}
        <div class="mt-2 grid gap-3">
          {%for row <- @live}
            <div class="border border-code-border px-4 py-3" data-cy="live-row">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs text-violet-soft">{row_tag(row)}</span>
                <StatusBadge status={row_status(row)} />
              </div>
              <a href={"/p/" <> row_slug(row)} class="mt-1 block text-sm font-semibold text-ink hover:text-violet-soft" data-cy="live-link">
                {row_title(row)}
              </a>
              <div class="mt-2">
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink-mute hover:border-red-400" $click={:request_withdraw, slug: row_slug(row)} data-cy="live-withdraw">
                  Withdraw
                </button>
              </div>
            </div>
          {/for}
        </div>
      {/if}
    </div>
    """
  end

  # ── client-transpilable helpers ──────────────────────────────

  defp row_slug(row), do: Map.get(row, :slug) || ""
  defp row_title(row), do: Map.get(row, :title) || ""
  defp row_tag(row), do: Map.get(row, :element_tag) || ""
  defp row_status(row), do: Map.get(row, :status) || "draft"
  defp row_updated(row), do: Map.get(row, :updated) || ""

end
