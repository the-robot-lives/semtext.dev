defmodule SemtextWeb.Hologram.Components.Site.HeaderMenu do
  @moduledoc """
  Compact nav for the header below `sm` — port of the Next site's
  `components/header-menu.tsx`. One disclosure button (aria-expanded,
  native button semantics — Enter/Space toggle, tab-reachable) opens a
  panel with the same links the desktop row shows.

  Escape closes; a click outside the menu closes it (`$click_outside`,
  the same gesture the Next version wires with a document pointerdown
  listener); opening a link navigates (full page load, so the open state
  resets itself — the Next version's close-on-click is free here).

  Remaining deviation (lane report): Escape does not restore focus to the
  button — Hologram has no focus() primitive; /js/site-chrome.js covers
  it with a DOM keydown listener.
  """

  use Hologram.Component

  def init(_props, component, _server) do
    put_state(component, :open, false)
  end

  def action(:toggle, _params, component) do
    put_state(component, :open, not component.state.open)
  end

  def action(:close, _params, component) do
    put_state(component, :open, false)
  end

  def template do
    ~HOLO"""
    <div class="relative sm:hidden" $click_outside="close">
      <button
        type="button"
        data-sem-menu-toggle
        aria-expanded={if @open do "true" else "false" end}
        aria-controls="header-menu-panel"
        aria-label={if @open do "Close menu" else "Open menu" end}
        $click="toggle"
        $key_down.escape.stop_propagation="close"
        class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/15 font-mono text-ink hover:border-white/40"
      >
        <span aria-hidden="true">{if @open do "✕" else "≡" end}</span>
      </button>
      {%if @open}
        <div
          id="header-menu-panel"
          data-sem-menu-panel
          $key_down.escape="close"
          class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-white/15 bg-slateink/95 p-2 shadow-2xl backdrop-blur-md"
        >
          <nav aria-label="Primary menu" class="flex flex-col">
            <a href="/#try" class="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink">See it work</a>
            <a href="/reference/" class="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink">Reference</a>
            <a href="/spec/semtext.html" class="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink">Read the spec</a>
            <a href="/#start" class="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink">Get started</a>
            <a href="https://therobotlives.com" class="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink">The Robot Lives</a>
          </nav>
        </div>
      {/if}
    </div>
    """
  end
end
