defmodule SemtextWeb.Hologram.Components.SemMdExample do
  @moduledoc """
  The sem-md example's Render/Source toggle (port of the Next site's
  SemMdExample): the landing hero window's view control applied to the one
  tag whose authored example is Markdown.

  Render view (the default): the static table the zero-JS export shows —
  inlined in this template as literal markup, because Hologram escapes every
  interpolation and there is no raw-HTML escape hatch. The authored
  `<sem-md>` element sits hidden beside it inside the pane; when the bridge
  loads semtext-lazy.js scoped to this pane (the spec's `wire: false` +
  lazy-loader pin), the chunk upgrades the element and a CSS rule keyed on
  the upgrade marker swaps the static table out — no timing race, no double
  render. A failed chunk load changes nothing: the static table already IS
  the render.

  Source view: the authored markup as plain line-numbered text.

  Zero-JS: the pills and Copy/Save stay `display:none` until the bridge
  flips `.is-live` on the figure (same rule as ExampleViewer); the static
  export renders the table and the authored element, no controls.
  """

  use Hologram.Component

  prop :anchor, :string, required: true
  prop :chrome_label, :string, required: true
  prop :lines, :list, required: true
  prop :spec_json, :string, required: true
  prop :copy_js, :string, default: ""
  prop :save_js, :string, default: ""

  def init(props, component, _server), do: do_init(props, component)
  def init(props, component), do: do_init(props, component)

  defp do_init(props, component) do
    put_state(component,
      view: "render",
      copied: false,
      saved: false,
      copy_js: Map.get(props, :copy_js, ""),
      save_js: Map.get(props, :save_js, "")
    )
  end

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
    <div id={"example-" <> @anchor}>
      <figure class="code-window ref-viewer" aria-label="The sem-md example: rendered and authored">
        <div class="code-chrome">
          <span class="dot live" aria-hidden="true"></span>
          <span class="ref-chrome-title">{@chrome_label}</span>
          <span class="ref-actions">
            <button type="button" class="ref-action" aria-label="Copy the authored Markdown"
              title={if @copied do "Copied" else "Copy" end}
              $click={:copy}>
              {if @copied do "✓ Copied" else "Copy" end}
            </button>
            <button type="button" class="ref-action" aria-label="Save sem-md.md"
              title={if @saved do "Saving…" else "Save" end}
              $click={:save}>
              {if @saved do "↓ Saving" else "Save" end}
            </button>
          </span>
          <span class="ref-view-pills" role="group" aria-label="View mode">
            <button type="button" class="ref-view-pill"
              aria-pressed={if @view == "render" do "true" else "false" end}
              $click={:set_view, view: "render"}>
              render
            </button>
            <button type="button" class="ref-view-pill"
              aria-pressed={if @view == "source" do "true" else "false" end}
              $click={:set_view, view: "source"}>
              source
            </button>
          </span>
        </div>
        <div class={"ref-view-body is-" <> @view}>
          <div class="ref-render-col">
            <div
              id={"sem-pane-" <> @anchor}
              class="ref-md-example"
            >
              <div class="ref-md-static">
                <div class="ref-md-static-label">Token lifetimes</div>
                <table>
                  <thead>
                    <tr>
                      <th scope="col" style="text-align: left">Token</th>
                      <th scope="col" style="text-align: right">Lifetime</th>
                      <th scope="col" style="text-align: center">Rotates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>access</td><td style="text-align: right">15 min</td><td style="text-align: center">no</td></tr>
                    <tr><td>refresh</td><td style="text-align: right">30 days</td><td style="text-align: center">yes</td></tr>
                  </tbody>
                </table>
              </div>
              <sem-md id="m-lifetimes" label="Token lifetimes" controls="toggle,copy">| Token   | Lifetime | Rotates |
    | :------ | -------: | :-----: |
    | access  | 15 min   | no      |
    | refresh | 30 days  | yes     |</sem-md>
            </div>
          </div>
          <div class="ref-source-col">
            <div class="ref-pane-tag">source</div>
            <div class="ref-md-source-pre"><code>
              {%for line <- @lines}
                <span class="ref-md-line"><span class="ref-md-ln" aria-hidden="true">{line.n}</span>{line.text}</span>
              {/for}
            </code></div>
          </div>
        </div>
      </figure>
    </div>
    """
  end
end
