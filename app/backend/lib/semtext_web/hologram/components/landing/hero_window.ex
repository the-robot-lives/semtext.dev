defmodule SemtextWeb.Hologram.Components.Landing.HeroWindow do
  @moduledoc """
  Hero code window (port of Next.js `components/hero-window.tsx`).

  SOURCE and RENDERED_HTML are the SAME string on purpose: the section's
  point is that render never rewrites the authored markup — Render wires
  the identical markup in place. Do not "diverge" them.

  Zero-JS: the Source/Render pills are only in the DOM after hydration
  (the bootstrap dispatches `on_hydrated`); the static page stays zero-JS
  clean, exactly as in the Next.js site. The rendered pane's markup is
  always present (hidden until Render); the imperative bundle wiring
  (theme links + semtext-fallback enhance, pane-scoped, with timed
  re-checks) lives in `/js/landing-bootstrap.js` and is called from the
  client action via Hologram.JS (no-op during SSR).
  """

  use Hologram.Component

  @source """
  <sem-note variant="warning">
    Refresh tokens rotate per use —
    each exchange retires the last one.
  </sem-note>

  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access tokens;
      the refresh grant issues a new pair.</conclusion>
      <incorrect-statement>Store the token in
      localStorage for durability.</incorrect-statement>
    </sem-fact>
  </sem-facts>
  """

  @rendered_html """
  <sem-note variant="warning">
    Refresh tokens rotate per use —
    each exchange retires the last one.
  </sem-note>

  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access tokens;
      the refresh grant issues a new pair.</conclusion>
      <incorrect-statement>Store the token in
      localStorage for durability.</incorrect-statement>
    </sem-fact>
  </sem-facts>
  """

  def init(_props, component, _server) do
    put_state(component,
      view: "source",
      hydrated: false,
      source: String.trim_trailing(@source)
    )
  end

  # The source <pre> is written on ONE line on purpose: template whitespace
  # inside white-space:pre renders as text — a leading blank line + indent,
  # i.e. the "broken padding" the round-2 feedback flagged.
  def template do
    ~HOLO"""
    <figure class="code-window" aria-label="A SemText document fragment">
      <div class="code-chrome">
        <span class="dot live" aria-hidden="true"></span>
        <span class="dot" aria-hidden="true"></span>
        <span class="dot" aria-hidden="true"></span>
        <span>auth-notes.html · what the model reads</span>
        {%if @hydrated}
          <span class="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              $click={action: :show, params: %{view: "source"}}
              aria-pressed={if @view == "source" do "true" else "false" end}
              class={pill_class(@view == "source")}
            >
              Source
            </button>
            <button
              type="button"
              $click={action: :show, params: %{view: "rendered"}}
              aria-pressed={if @view == "rendered" do "true" else "false" end}
              class={pill_class(@view == "rendered")}
            >
              Render
            </button>
          </span>
        {/if}
      </div>
      <pre hidden={@view != "source"}><code>{@source}</code></pre>
      <div
        id="hero-render-pane"
        hidden={@view != "rendered"}
        data-sem-theme="minimal-tech-light"
        data-color-mode="dark"
        class="px-4 py-4 sm:px-5"
      >
        {%raw}<sem-note variant="warning">
    Refresh tokens rotate per use —
    each exchange retires the last one.
    </sem-note>

    <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
    <statement>JWTs rotate per session</statement>
    <conclusion>Short-lived access tokens;
    the refresh grant issues a new pair.</conclusion>
    <incorrect-statement>Store the token in
    localStorage for durability.</incorrect-statement>
    </sem-fact>
    </sem-facts>{/raw}
      </div>
    </figure>
    """
  end

  def action(:on_hydrated, _params, component) do
    put_state(component, hydrated: true)
  end

  def action(:show, params, component) do
    view = params.view
    component = put_state(component, view: view)

    if view == "rendered" do
      Hologram.JS.exec("window.SemtextLanding && SemtextLanding.enhanceHeroPane()")
    end

    component
  end

  defp pill_class(true) do
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors border-violet bg-violet text-white"
  end

  defp pill_class(false) do
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors border-code-border text-code-gray hover:border-violet-soft hover:text-ink"
  end
end
