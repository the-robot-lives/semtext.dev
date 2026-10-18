defmodule SemtextWeb.Hologram.Components.Site.ExampleViewer do
  @moduledoc """
  Placeholder example viewer — the parity shell of the Next site's
  `components/example-viewer.tsx`, pending the port-reference lane's real
  viewer (their brief owns the split/island ExampleViewer; this lane's
  showcase pages need the same DOM contract now).

  Parity contract kept: `figure.code-window` per example with an
  aria-label, view pills (Source / Split / Render) with aria-pressed and
  client-side view state, a `data-sem-render-note` render pane, and the
  `#example-<id>` anchor. The render pane is the Next export's themed host
  (`data-sem-theme` + `data-color-mode`, "render" pane tag) carrying the
  example's own source in `data-sem-html` (attribute-escaped by
  interpolation — payload-safe, the 83c34cd lesson stays about state only).
  site-chrome.js hydrates it on load: with JS the pane holds the real
  authored markup presented by the vocabulary/theme CSS exactly as the
  static export does; without JS nothing injects and the honest note stays
  as the fallback (the export SSRs the markup raw; Hologram templates
  cannot inject raw HTML server-side, so the attribute + hydration is the
  same end state one tick later).

  Zero-JS: without scripts the pills are hidden (html.no-js gating in
  site.css) and the split view renders as static content — source + note,
  nothing hidden.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.CodeBody

  prop :id, :string, required: true
  prop :label, :string, required: true
  prop :filename, :string, default: "doc.html"
  prop :caption, :string, default: "authored SemText"
  prop :lines, :list, required: true
  prop :renderable, :boolean, default: true
  prop :note, :string, default: ""
  # The example's own source as a compile-time literal (module attr on the
  # page). MUST be a template literal prop, not state/derivation: strings
  # derived from the tokenized lines (state-seeded or template-computed)
  # serialize to codepoint lists in the component IR and interpolate as
  # digit soup in attribute position ("Auth" -> "65117116104"; probe-
  # verified in live SSR). Literal props like label/filename render true.
  prop :raw, :string, default: ""

  def init(_props, component, _server) do
    put_state(component, :view, "split")
  end

  def action(:set_view, params, component) do
    put_state(component, :view, params.view)
  end

  def pill_class(active) do
    if active do
      "sem-pill is-active inline-flex min-h-8 items-center rounded-md border border-violet/60 bg-violet/20 px-2.5 font-mono text-xs text-ink"
    else
      "sem-pill inline-flex min-h-8 items-center rounded-md border border-white/15 px-2.5 font-mono text-xs text-ink-mute hover:border-white/40 hover:text-ink"
    end
  end

  def render_note(note) do
    if note == "" do
      "Render view: this block wires to the SemText runtime bundle in the full example viewer (port-reference lane) — the source beside it is the same file, byte for byte."
    else
      note
    end
  end

  def template do
    ~HOLO"""
    <section id={"example-" <> @id} class="sem-example mt-6 scroll-mt-24">
      <div class="sem-viewer-head flex items-center justify-between gap-3">
        <p class="g-nav-title">{@label}</p>
        {%if @renderable}
          <div class="sem-view-pills no-js-hidden flex gap-1" role="group" aria-label="Example view">
            <button
              type="button"
              class={pill_class(@view == "source")}
              aria-pressed={if @view == "source" do "true" else "false" end}
              $click={action: :set_view, view: "source"}
            >
              Source
            </button>
            <button
              type="button"
              class={pill_class(@view == "split")}
              aria-pressed={if @view == "split" do "true" else "false" end}
              $click={action: :set_view, view: "split"}
            >
              Split
            </button>
            <button
              type="button"
              class={pill_class(@view == "render")}
              aria-pressed={if @view == "render" do "true" else "false" end}
              $click={action: :set_view, view: "render"}
            >
              Render
            </button>
          </div>
        {/if}
      </div>
      <figure class="code-window mt-8" aria-label={@label}>
        <div class="code-chrome">
          <span class="dot live" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate" title={@filename <> " · " <> @caption}>
            {@filename} · {@caption}
          </span>
        </div>
        {%if @view == "render"}
          {%if @renderable}
            <div class="px-4 pt-3 pb-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-code-gray sm:px-5">render</div>
            <div
              data-sem-theme="minimal-tech-light"
              data-color-mode="dark"
              data-sem-html={@raw}
              class="min-h-24 px-4 py-4 sm:px-5"
            >
              <p class="m-0 text-sm italic leading-6 text-ink-faint" data-sem-render-note>
                {render_note(@note)}
              </p>
            </div>
          {%else}
            <div class="min-h-24 px-4 py-6 text-sm italic leading-6 text-ink-faint sm:px-5" data-sem-render-note>
              {render_note(@note)}
            </div>
          {/if}
        {%else}
          {%if @view == "source"}
            <CodeBody lines={@lines} />
          {%else}
            <div class="grid gap-0 md:grid-cols-2">
              <div class="min-w-0 md:border-r md:border-white/10">
                <div class="px-4 pt-3 pb-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-code-gray sm:px-5">source</div>
                <CodeBody lines={@lines} />
              </div>
              <div class="min-w-0 border-t border-white/10 md:border-t-0 md:border-l md:pl-0">
                {%if @renderable}
                  <div class="px-4 pt-3 pb-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-code-gray sm:px-5">render</div>
                  <div
                    data-sem-theme="minimal-tech-light"
                    data-color-mode="dark"
                    data-sem-html={@raw}
                    class="min-h-24 px-4 py-4 sm:px-5"
                  >
                    <p class="m-0 text-sm italic leading-6 text-ink-faint" data-sem-render-note>
                      {render_note(@note)}
                    </p>
                  </div>
                {%else}
                  <div class="px-4 pt-3 pb-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-code-gray sm:px-5">render — pending bundle</div>
                  <div class="min-h-24 px-4 py-6 text-sm italic leading-6 text-ink-faint sm:px-5" data-sem-render-note>
                    {render_note(@note)}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        {/if}
      </figure>
    </section>
    """
  end
end
