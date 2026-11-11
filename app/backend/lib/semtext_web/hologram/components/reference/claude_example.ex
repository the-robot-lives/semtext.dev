defmodule SemtextWeb.Hologram.Components.Reference.ClaudeExample do
  @moduledoc """
  The per-card "SemText — Claude example" block: a static code block of the
  tag's `claude_example` (a real `<pre><code>`, tokenized, CSS-counter line
  numbers so copy and CSS-off reading get clean source) plus a custom
  render pane that renders the same fragment live through the island
  bridge (`semtext-island.js`).

  Render pane lifecycle:

    * collapsed by default on the index — the pane is not in the DOM until
      the reader presses the `aria-expanded` toggle (or the page-wide
      "show renders" switch flips `show_render`), so the index never boots
      115 islands at load;
    * expanded panes carry `data-sem-defer="visible"`: the bridge boots
      them only when they scroll into view (IntersectionObserver);
    * `always_on` (the element page header) mounts the pane at SSR and
      boots it immediately.

  The pane spec (built server-side by `Semtext.Reference.CardData`) names
  the bundles bundles.json maps to the tag — a vendored runtime update
  upgrades the render with no change here.

  JS-shell hook: `data-sem-shell="pending"` marks where the future SemText
  JS shell mounts (owner: static code block for now).
  """

  use Hologram.Component

  prop :example, :map, required: true
  prop :always_on, :boolean, default: false
  prop :show_render, :boolean, default: false

  def init(props, component, _server), do: do_init(props, component)
  def init(props, component), do: do_init(props, component)

  defp do_init(props, component) do
    id = props.example.dom_id

    put_state(component,
      # nil = follow the page-wide switch; true/false = the reader's choice.
      expanded: nil,
      view: "both",
      copied: false,
      copy_js:
        "navigator.clipboard.writeText(document.getElementById(\"" <>
          id <> "-code\").textContent.replace(/\\n$/, \"\"))"
    )
  end

  def action(:toggle, %{open: open}, component) do
    put_state(component, expanded: not open)
  end

  def action(:set_view, %{view: view}, component) do
    put_state(component, view: view)
  end

  def action(:copy, _params, component) do
    Hologram.JS.exec(component.state.copy_js)
    put_state(component, copied: true)
  end

  def template do
    ~HOLO"""
    <figure
      class={"ref-claude is-" <> (if @always_on or (if @expanded == nil do @show_render else @expanded end) do @view else "code" end)}
      id={@example.dom_id}
      data-claude-example={@example.name}
      data-claude-source={@example.source}
      aria-label={"SemText — Claude example for " <> @example.name}
    >
      <figcaption class="ref-claude-chrome">
        <span class="ref-claude-title">SemText — Claude example</span>
        <span class="ref-claude-controls">
          {%if @always_on or (if @expanded == nil do @show_render else @expanded end)}
            <span class="ref-view-pills ref-claude-js-only" role="group" aria-label="Claude example view">
              <button type="button" class="ref-view-pill"
                aria-pressed={if @view == "both" do "true" else "false" end}
                $click={:set_view, view: "both"}>both</button>
              <button type="button" class="ref-view-pill"
                aria-pressed={if @view == "code" do "true" else "false" end}
                $click={:set_view, view: "code"}>code</button>
              <button type="button" class="ref-view-pill"
                aria-pressed={if @view == "render" do "true" else "false" end}
                $click={:set_view, view: "render"}>render</button>
            </span>
          {/if}
          <button type="button" class="ref-action ref-claude-js-only" aria-label={"Copy the " <> @example.name <> " Claude example"} $click={:copy}>{if @copied do "✓ Copied" else "Copy" end}</button>
          {%if not @always_on}
            <button
              type="button"
              class="ref-action ref-claude-toggle ref-claude-js-only"
              aria-expanded={if (if @expanded == nil do @show_render else @expanded end) do "true" else "false" end}
              aria-controls={@example.dom_id <> "-render"}
              $click={:toggle, open: (if @expanded == nil do @show_render else @expanded end)}
            >Live render</button>
          {/if}
        </span>
      </figcaption>
      <pre class="ref-claude-code" id={@example.dom_id <> "-code"}><code>{%if @example.highlight}{%for line <- @example.lines}<span class="ref-claude-line">{%for tok <- line.toks}<span class={if Enum.at(tok, 1) == "" do "tok-plain" else Enum.at(tok, 1) end}>{Enum.at(tok, 0)}</span>{/for}</span>{"\n"}{/for}{%else}{%for line <- @example.plain_lines}<span class="ref-claude-line">{%for seg <- line}{seg}{/for}</span>{"\n"}{/for}{/if}</code></pre>
      <!-- js-shell: TODO — the SemText JS shell mounts here and replaces the static block -->
      <div class="ref-claude-shell" data-sem-shell="pending" data-sem-shell-tag={@example.name}></div>
      <div class="ref-claude-render" id={@example.dom_id <> "-render"}>
        {%if @always_on or (if @expanded == nil do @show_render else @expanded end)}
          <div
            id={@example.dom_id <> "-pane"}
            class="ref-render-pane ref-claude-pane"
            data-sem-pane={@example.spec_json}
            data-sem-defer={if @always_on do nil else "visible" end}
            data-sem-theme="minimal-tech-light"
            data-color-mode="dark"
          >
            <p class="ref-render-placeholder">Live render boots with JavaScript — the authored source is above.</p>
          </div>
          {%if not @example.shipped}
            <p class="ref-claude-note">No shipped runtime for this element yet — the render shows the authored markup with the theme CSS.</p>
          {/if}
        {/if}
      </div>
    </figure>
    """
  end
end
