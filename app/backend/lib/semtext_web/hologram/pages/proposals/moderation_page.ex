defmodule SemtextWeb.Hologram.Pages.Proposals.ModerationPage do
  @moduledoc """
  `/moderation` — the moderator queue (design §4): hidden proposals
  (unhide), open reports (resolve/dismiss), failed discussion syncs
  (retry; `removed` links show the recreate path on their detail page).

  Gated by `ModeratorGate` (moderators only — anonymous goes to GitHub
  login, non-moderators back to browse; it also gates every command).
  Every command re-scopes through the context; failures surface as
  problem maps.
  """

  use Hologram.Page

  alias Semtext.Proposals
  alias SemtextWeb.Hologram.Pages.Proposals.Fields
  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.Problems
  alias SemtextWeb.Hologram.Components.Proposals.{ProblemNotice, StatusBadge, SyncChip}
  alias SemtextWeb.Hologram.Layouts.ProposalsLayout
  alias SemtextWeb.Hologram.Pages.Proposals.{HostGuard, ModeratorGate}

  route "/moderation"

  layout ProposalsLayout,
    page_title: "Moderation — SemText Proposals",
    description: "Moderator queue for SemText vocabulary proposals."

  middleware HostGuard
  middleware ModeratorGate

  def init(_params, component, _server) do
    {:ok, %{hidden: hidden, reported: reported, sync_failed: sync_failed}} =
      Proposals.moderation_queue()

    put_state(component,
      hidden_rows: Enum.map(hidden, &hidden_row/1),
      report_rows: Enum.map(reported, &report_row/1),
      sync_rows: Enum.map(sync_failed, &sync_row/1),
      problem: %{}
    )
  end

  # ── actions (client) ─────────────────────────────────────────

  def action(:request_unhide, params, component) do
    put_command(component, :mod_unhide, slug: params.slug)
  end

  def action(:request_resolve, params, component) do
    put_command(component, :resolve_report, report_id: params.report_id, outcome: "resolved")
  end

  def action(:request_dismiss, params, component) do
    put_command(component, :resolve_report, report_id: params.report_id, outcome: "dismissed")
  end

  def action(:request_retry_sync, params, component) do
    put_command(component, :mod_retry_sync, slug: params.slug)
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

  def command(:mod_unhide, params, server) do
    guard_mod(server, fn _user ->
      slug = param_str(params, :slug)

      case Problems.from_result(Proposals.unhide(:moderation_page, slug)) do
        {:ok, _} -> reload(server)
        {:error, problem} -> fail(server, problem)
      end
    end)
  end

  def command(:resolve_report, params, server) do
    guard_mod(server, fn _user ->
      report_id = param_str(params, :report_id)
      outcome = outcome_atom(param_str(params, :outcome))

      case outcome do
        {:ok, oc} ->
          case Problems.from_result(Proposals.resolve_report(:moderation_page, report_id, oc)) do
            {:ok, _} -> reload(server)
            {:error, problem} -> fail(server, problem)
          end

        :error ->
          fail(server, Problems.problem("validation-failed", "Unknown report outcome."))
      end
    end)
  end

  def command(:mod_retry_sync, params, server) do
    guard_mod(server, fn user ->
      slug = param_str(params, :slug)
      viewer = %{user_id: user.id, moderator: true}

      case Proposals.get_by_slug(slug, viewer) do
        {:ok, %{proposal: p}} ->
          case Problems.from_result(Proposals.retry_discussion(p.id)) do
            {:ok, _} -> reload(server)
            {:error, problem} -> fail(server, problem)
          end

        _ ->
          fail(server, Problems.problem("not-found"))
      end
    end)
  end

  defp guard_mod(server, fun) do
    case Auth.current_user(server) do
      %{is_moderator: true} = user ->
        fun.(user)

      _ ->
        fail(server, Problems.problem("forbidden"))
    end
  end

  defp reload(server) do
    put_action(server, :goto, url: "/moderation")
  end

  defp fail(server, problem) do
    put_action(server, :action_failed, problem: problem)
  end

  # ── server-side row shaping ──────────────────────────────────

  defp hidden_row(p) do
    %{
      slug: p.slug,
      title: Fields.hydrate_safe(p.title),
      element_tag: Fields.hydrate_safe(p.element_tag),
      status: Atom.to_string(p.status)
    }
  end

  defp report_row(r) do
    proposal = r.proposal || %{slug: "", title: "(deleted)"}

    %{
      report_id: r.id,
      reason: Atom.to_string(r.reason),
      details: Fields.hydrate_safe(r.details || ""),
      proposal_slug: proposal.slug,
      proposal_title: Fields.hydrate_safe(proposal.title),
      proposal_details: Fields.hydrate_safe(r.details || "")
    }
  end

  defp sync_row(p) do
    %{
      slug: p.slug,
      title: Fields.hydrate_safe(p.title),
      element_tag: Fields.hydrate_safe(p.element_tag),
      sync_state: sync_state(p)
    }
  end

  defp sync_state(p) do
    case p.discussion_link do
      %{state: s} when not is_nil(s) -> Atom.to_string(s)
      _ -> "pending"
    end
  end

  defp outcome_atom("resolved"), do: {:ok, :resolved}
  defp outcome_atom("dismissed"), do: {:ok, :dismissed}
  defp outcome_atom(_), do: :error

  defp param_str(params, key) do
    value = Map.get(params, key) || Map.get(params, Atom.to_string(key)) || ""
    if is_binary(value), do: String.slice(String.trim(value), 0, 200), else: ""
  end

  # ── template ─────────────────────────────────────────────────

  def template do
    ~HOLO"""
    <div>
      <h1 class="text-xl font-semibold text-ink" data-cy="moderation-title">Moderation</h1>
      <ProblemNotice problem={@problem} />

      <h2 class="mt-6 font-mono text-xs uppercase text-ink-faint">Open reports</h2>
      {%if Enum.empty?(@report_rows)}
        <div class="mt-2 border border-code-border px-4 py-3 text-sm text-ink-mute" data-cy="reports-empty">
          No open reports.
        </div>
      {%else}
        <div class="mt-2 grid gap-3">
          {%for row <- @report_rows}
            <div class="border border-code-border px-4 py-3" data-cy="report-row">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center border border-amber-500 px-2 py-0.5 font-mono text-[0.68rem] text-amber-400">
                  {row_reason(row)}
                </span>
                <a href={"/p/" <> row_proposal_slug(row)} class="text-sm font-semibold text-ink hover:text-violet-soft">
                  {row_proposal_title(row)}
                </a>
              </div>
              {%if row_details(row) != ""}
                <div class="mt-1 text-sm leading-relaxed text-ink-mute">{row_details(row)}</div>
              {/if}
              <div class="mt-2 flex gap-2">
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click={:request_resolve, report_id: row_report_id(row)} data-cy="report-resolve">
                  Resolve
                </button>
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink-mute hover:border-red-400" $click={:request_dismiss, report_id: row_report_id(row)} data-cy="report-dismiss">
                  Dismiss
                </button>
              </div>
            </div>
          {/for}
        </div>
      {/if}

      <h2 class="mt-8 font-mono text-xs uppercase text-ink-faint">Failed discussion sync</h2>
      {%if Enum.empty?(@sync_rows)}
        <div class="mt-2 border border-code-border px-4 py-3 text-sm text-ink-mute" data-cy="sync-empty">
          Nothing failing.
        </div>
      {%else}
        <div class="mt-2 grid gap-3">
          {%for row <- @sync_rows}
            <div class="border border-code-border px-4 py-3" data-cy="sync-row">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs text-violet-soft">{row_tag(row)}</span>
                <SyncChip state={row_sync_state(row)} />
              </div>
              <a href={"/p/" <> row_slug(row)} class="mt-1 block text-sm font-semibold text-ink hover:text-violet-soft">
                {row_title(row)}
              </a>
              <div class="mt-2">
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click={:request_retry_sync, slug: row_slug(row)} data-cy="sync-retry">
                  Retry sync
                </button>
              </div>
            </div>
          {/for}
        </div>
      {/if}

      <h2 class="mt-8 font-mono text-xs uppercase text-ink-faint">Hidden proposals</h2>
      {%if Enum.empty?(@hidden_rows)}
        <div class="mt-2 border border-code-border px-4 py-3 text-sm text-ink-mute" data-cy="hidden-empty">
          Nothing hidden.
        </div>
      {%else}
        <div class="mt-2 grid gap-3">
          {%for row <- @hidden_rows}
            <div class="border border-code-border px-4 py-3" data-cy="hidden-row">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs text-violet-soft">{row_tag(row)}</span>
                <StatusBadge status={row_status(row)} />
              </div>
              <span class="mt-1 block text-sm font-semibold text-ink">{row_title(row)}</span>
              <div class="mt-2">
                <button type="button" class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-xs text-ink hover:border-violet-soft" $click={:request_unhide, slug: row_slug(row)} data-cy="hidden-unhide">
                  Unhide
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
  defp row_status(row), do: Map.get(row, :status) || "submitted"
  defp row_sync_state(row), do: Map.get(row, :sync_state) || "failed"
  defp row_reason(row), do: Map.get(row, :reason) || "other"
  defp row_details(row), do: Map.get(row, :details) || ""
  defp row_proposal_slug(row), do: Map.get(row, :proposal_slug) || ""
  defp row_proposal_title(row), do: Map.get(row, :proposal_title) || ""
  defp row_report_id(row), do: Map.get(row, :report_id) || ""
end
