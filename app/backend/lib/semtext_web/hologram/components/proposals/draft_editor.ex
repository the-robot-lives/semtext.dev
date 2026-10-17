defmodule SemtextWeb.Hologram.Components.Proposals.DraftEditor do
  @moduledoc """
  The dashboard's draft editor (design §4 dashboard: my proposals +
  drafts). Owns create (no slug yet) and update (existing draft) through
  the `:save_draft` command; submit/withdraw of the saved draft are page
  commands on `DashboardPage` (they operate on list rows too).

  State carries form INPUTS only; every derived value (options parsing,
  field mapping) is computed server-side in the command via
  `Fields.from_draft/1` — nothing user-typed is processed client-side
  beyond echoing it back (payload-safety rule from the port lanes).

  `submitting` disables double-fires; failures render through
  `ProblemNotice` (same problem map as the REST surface).
  """

  use Hologram.Component

  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.{Fields, Problems}
  alias SemtextWeb.Hologram.Components.Proposals.ProblemNotice

  prop :draft, :map, default: %{}

  def init(props, component, _server) do
    draft = Map.get(props, :draft) || %{}

    put_state(component,
      draft_slug: Map.get(draft, :slug) || "",
      element_tag: Map.get(draft, :element_tag) || "",
      title: Map.get(draft, :title) || "",
      summary: Map.get(draft, :summary) || "",
      motivation: Map.get(draft, :motivation) || "",
      # Options stay the free-text "name — meaning" block, same as the
      # /extend wizard; parsed server-side on save.
      attrs: Map.get(draft, :attrs) || "",
      example: Map.get(draft, :example) || "",
      problem: %{},
      saving: false
    )
  end

  # ── actions (client) ─────────────────────────────────────────

  def action(:set_element_tag, params, component),
    do: put_state(component, element_tag: params.event.value)

  def action(:set_title, params, component), do: put_state(component, title: params.event.value)

  def action(:set_summary, params, component),
    do: put_state(component, summary: params.event.value)

  def action(:set_motivation, params, component),
    do: put_state(component, motivation: params.event.value)

  def action(:set_attrs, params, component), do: put_state(component, attrs: params.event.value)

  def action(:set_example, params, component),
    do: put_state(component, example: params.event.value)

  def action(:submit, _params, component) do
    put_state(component, saving: true)
    put_command(component, :save_draft, fields: fields_from_state(component))
  end

  def action(:save_failed, params, component) do
    put_state(component, problem: params.problem, saving: false)
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

  defp fields_from_state(component) do
    s = component.state

    %{
      element_tag: s.element_tag,
      title: s.title,
      summary: s.summary,
      motivation: s.motivation,
      attrs: s.attrs,
      example: s.example,
      draft_slug: s.draft_slug
    }
  end

  # ── command (server) ─────────────────────────────────────────

  def command(:save_draft, params, server) do
    with {:auth, user} when is_map(user) <- {:auth, Auth.current_user(server)},
         fields = Fields.from_draft(Map.get(params, :fields) || %{}),
         result <- save(user, fields) do
      case result do
        {:ok, slug} ->
          # Fresh SSR of the dashboard list (the draft row appears with
          # its current status; no client-side list patching needed).
          put_action(server, :goto, url: "/dashboard")

        {:error, problem} ->
          put_action(server, :save_failed, problem: problem)
      end
    else
      {:auth, _} ->
        put_action(server, :save_failed,
          problem: Problems.problem("unauthenticated")
        )
    end
  end

  defp save(user, fields) do
    {slug, attrs} = Map.pop(fields, :draft_slug)

    result =
      if slug == "" or slug == nil do
        Semtext.Proposals.save_draft(user[:id] || user["id"], attrs)
      else
        Semtext.Proposals.update_draft(user[:id] || user["id"], slug, attrs)
      end

    case Problems.from_result(result) do
      {:ok, proposal} -> {:ok, proposal.slug}
      {:error, problem} -> {:error, problem}
    end
  end

  # ── template ─────────────────────────────────────────────────

  def template do
    ~HOLO"""
    <div class="border border-code-border px-4 py-4" data-cy="draft-editor">
      <div class="font-mono text-xs text-violet-soft">
        {%if @draft_slug == ""}
          New draft
        {%else}
          Editing draft {@draft_slug}
        {/if}
      </div>
      <div class="mt-3 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div>
          <label for="draft-tag" class="block font-mono text-xs text-ink-mute">Element name</label>
          <input
            id="draft-tag"
            type="text"
            value={@element_tag}
            placeholder="yelp-sem-review-summary"
            class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            $change="set_element_tag"
          />
        </div>
        <div>
          <label for="draft-title" class="block font-mono text-xs text-ink-mute">Title</label>
          <input
            id="draft-title"
            type="text"
            value={@title}
            placeholder="Review-score roll-up element"
            class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            $change="set_title"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="draft-summary" class="block font-mono text-xs text-ink-mute">Summary</label>
          <input
            id="draft-summary"
            type="text"
            value={@summary}
            class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            $change="set_summary"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="draft-motivation" class="block font-mono text-xs text-ink-mute">
            Why the existing vocabulary cannot express it
          </label>
          <textarea
            id="draft-motivation"
            rows="3"
            class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            $change="set_motivation"
          >{@motivation}</textarea>
        </div>
        <div class="sm:col-span-2">
          <label for="draft-attrs" class="block font-mono text-xs text-ink-mute">
            Options — one per line, <code>name — meaning</code>
          </label>
          <textarea
            id="draft-attrs"
            rows="2"
            class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            $change="set_attrs"
          >{@attrs}</textarea>
        </div>
        <div class="sm:col-span-2">
          <label for="draft-example" class="block font-mono text-xs text-ink-mute">Worked example</label>
          <textarea
            id="draft-example"
            rows="4"
            class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            $change="set_example"
          >{@example}</textarea>
        </div>
      </div>
      <ProblemNotice problem={@problem} />
      <button
        type="button"
        class="mt-4 inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
        $click="submit"
        data-cy="draft-save"
      >
        {%if @draft_slug == ""}
          Save draft
        {%else}
          Save changes
        {/if}
      </button>
    </div>
    """
  end
end
