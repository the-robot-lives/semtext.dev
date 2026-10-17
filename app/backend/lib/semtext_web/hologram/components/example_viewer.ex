defmodule SemtextWeb.Hologram.Components.ExampleViewer do
  @moduledoc """
  The one-card example viewer for /reference pages (port of the Next site's
  ExampleViewer, web/components/example-viewer.tsx): authored source with
  highlight + line numbers beside the live render pane, split/source/render
  pills, Copy/Save in the window chrome.

  Division of labour (design v2 §2.2): the component owns only STATE that
  Hologram renders — the view pills flip a state key and CSS shows/hides the
  two panes, so the bridge's injected render content survives view flips
  untouched. Every imperative DOM behaviour (bundle boot, handler chain,
  markup injection, color-mode sync) lives in the island bridge
  (semtext-island.js), driven by the `data-sem-pane` JSON payload this
  component renders — the bridge auto-boots every spec-carrying pane on
  load, and actions never pass data across the boundary.

  Everything derivable is derived SERVER-SIDE (page init/3) and arrives as
  props: tokenized lines, the pane spec JSON, the prebuilt Copy/Save JS
  snippets (so the client never needs Jason). Zero-JS behaviour: pills and
  Copy/Save stay `display:none` until the bridge flips `.is-live` on the
  figure after a successful boot; the render pane shows an honest
  placeholder note until the bridge injects the authored markup.

  Parity contract (parity-harness lane): figure.code-window + aria-label
  "Authored {name} example{ — label}", view pills with aria-pressed,
  data-sem-render-note panes, #example-<id> anchors.
  """

  use Hologram.Component

  prop :anchor, :string, required: true
  prop :tag_name, :string, default: ""
  prop :code, :string, required: true
  prop :lines, :list, required: true
  prop :renderable, :boolean, default: false
  prop :render_note, :string, default: ""
  prop :spec_json, :string, default: ""
  prop :aria_label, :string, required: true
  prop :chrome_label, :string, default: ""
  prop :filename, :string, default: ""
  prop :copy_js, :string, default: ""
  prop :save_js, :string, default: ""
  # /editor deep link for this example (site-editor lane) — empty on
  # viewers without an editorable source (e.g. markdown); renders a plain
  # navigation link under the figure so it works with scripts off, unlike
  # the boot-gated chrome actions above.
  prop :editor_href, :string, default: ""

  # init/3 runs server-side (SSR), init/2 client-side; both just seed state.
  def init(props, component, _server), do: do_init(props, component)
  def init(props, component), do: do_init(props, component)

  defp do_init(props, component) do
    put_state(component,
      view: "split",
      copied: false,
      saved: false,
      # JS snippets arrive as props (built server-side) but actions read
      # state, so seed them here — props are not addressable in actions.
      copy_js: Map.get(props, :copy_js, ""),
      save_js: Map.get(props, :save_js, "")
    )
  end

  # View pills: pure state flips (panes stay mounted; CSS shows/hides).
  def action(:set_view, %{view: view}, component) do
    put_state(component, view: view)
  end

  def action(:copy, _params, component) do
    Hologram.JS.exec(component.state.copy_js)
    put_state(component, copied: true)
  end

  def action(:save, _params, component) do
    Hologram.JS.exec(component.state.save_js)
    put_state(component, saved: true)
  end

  def template do
    ~HOLO"""
    <div id={"example-" <> @anchor} class="ref-example">
      {%if @chrome_label != ""}
        <div class="g-nav-title ref-example-label">{@chrome_label}</div>
      {/if}
      <figure class="code-window ref-viewer" aria-label={@aria_label}>
        <div class="code-chrome">
          <span class={if @renderable do "dot live" else "dot" end} aria-hidden="true" />
          <span class="ref-chrome-title">{@filename}</span>
          <span class="ref-actions">
            <button type="button" class="ref-action" aria-label="Copy code"
              title={if @copied do "Copied" else "Copy" end}
              $click={:copy}>
              {if @copied do "✓ Copied" else "Copy" end}
            </button>
            <button type="button" class="ref-action" aria-label={"Save " <> @filename}
              title={if @saved do "Saving…" else "Save" end}
              $click={:save}>
              {if @saved do "↓ Saving" else "Save" end}
            </button>
          </span>
          <span class="ref-view-pills" role="group" aria-label="View mode">
            <button type="button" class="ref-view-pill"
              aria-pressed={if @view == "split" do "true" else "false" end}
              $click={:set_view, view: "split"}>
              split
            </button>
            <button type="button" class="ref-view-pill"
              aria-pressed={if @view == "source" do "true" else "false" end}
              $click={:set_view, view: "source"}>
              source
            </button>
            <button type="button" class="ref-view-pill"
              aria-pressed={if @view == "render" do "true" else "false" end}
              $click={:set_view, view: "render"}>
              render
            </button>
          </span>
        </div>
        <div class={"ref-view-body is-" <> @view}>
          <div class="ref-source-col">
            <div class="ref-pane-tag">source</div>
            <div class="code-content">
              {%for line <- @lines}
                <div class="code-line">
                  <span class="code-line-no">{line.n}</span>
                  <span class="code-line-text">
                    {%for tok <- line.toks}
                      <span class={if Enum.at(tok, 1) == "" do "tok-plain" else Enum.at(tok, 1) end}>{Enum.at(tok, 0)}</span>
                    {/for}
                  </span>
                </div>
              {/for}
            </div>
          </div>
          <div class="ref-render-col">
            <div class="ref-pane-tag">render</div>
            {%if @renderable}
              <div
                id={"sem-pane-" <> @anchor}
                class="ref-render-pane"
                data-sem-pane={@spec_json}
                data-sem-theme="minimal-tech-light"
                data-color-mode="dark"
              >
                <p class="ref-render-placeholder">
                  Live render boots with JavaScript — the authored source is alongside.
                </p>
              </div>
            {%else}
              <div class="ref-render-note-pane" data-sem-render-note>{@render_note}</div>
            {/if}
          </div>
        </div>
      </figure>
      {%if @editor_href != ""}
        <p class="mt-2 text-xs">
          <a
            class="underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
            href={@editor_href}
          >
            Open in editor
          </a>
        </p>
      {/if}
    </div>
    """
  end
end
