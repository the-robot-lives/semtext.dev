defmodule SemtextWeb.Hologram.Components.Landing.HeaderMenu do
  @moduledoc """
  Mobile header disclosure (port of Next.js `components/header-menu.tsx`).

  Compact nav for the header below `sm`, where the four inline links hide.
  One disclosure button (aria-expanded, native button semantics) opens a
  panel with the same links the desktop row shows. Escape closes; a pointer
  press outside closes (`$click_outside`); opening a link navigates (full
  page load, which resets the state). Escape-to-focus-restore of the button
  is the one dropped affordance (imperative focus is not expressible as a
  data action) — noted in the port-landing report.
  """
  use Hologram.Component

  @mobile_links [
    %{href: "/#try", label: "See it work"},
    %{href: "/reference/", label: "Reference"},
    %{href: "/spec/semtext.html", label: "Spec"},
    %{href: "/#start", label: "Get started"},
    %{href: "https://therobotlives.com", label: "The Robot Lives"}
  ]

  def init(_props, component, _server) do
    put_state(component, open: false, mobile_links: @mobile_links)
  end

  def template do
    ~HOLO"""
    <div class="relative sm:hidden" $click_outside={action: :close}>
      <button
        type="button"
        aria-expanded={if @open do "true" end}
        aria-controls="header-menu-panel"
        aria-label={if @open do "Close menu" else "Open menu" end}
        $click={action: :toggle}
        $key_down.escape.stop_propagation={action: :close}
        class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/15 font-mono text-ink hover:border-white/40"
      >
        <span aria-hidden="true">{%if @open}✕{%else}≡{/if}</span>
      </button>
      {%if @open}
        <div
          id="header-menu-panel"
          $key_down.escape.stop_propagation={action: :close}
          class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-white/15 bg-slateink/95 p-2 shadow-2xl backdrop-blur-md"
        >
          <nav aria-label="Primary menu" class="flex flex-col">
            {%for link <- @mobile_links}
              <a
                href={link.href}
                class="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink"
              >
                {link.label}
              </a>
            {/for}
          </nav>
        </div>
      {/if}
    </div>
    """
  end

  def action(:toggle, _params, component) do
    put_state(component, open: not component.state.open)
  end

  def action(:close, _params, component) do
    put_state(component, open: false)
  end
end
