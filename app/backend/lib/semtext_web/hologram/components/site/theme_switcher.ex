defmodule SemtextWeb.Hologram.Components.Site.ThemeSwitcher do
  @moduledoc """
  Whole-page theme switcher for /themes/showcase/ — port of the switcher
  half of the Next site's `app/themes/showcase/showcase-client.tsx`:
  writes `data-sem-theme` on `<html>` (the whole-document form; the
  Default button removes the attribute again). The themed panels on the
  page are static CSS — zero-JS safe — so this is the only interactive
  part of the page.

  Client-only command (the ThemeGenerator precedent): the slug is
  allowlisted against the shipped theme constants before it may touch a
  JS string, so template data can never smuggle script into the
  attribute write.
  """

  use Hologram.Component

  @slugs ~w(minimal-tech-light nocturne-console organic-warm editorial-settings newsprint)

  prop :themes, :list, required: true

  def init(_props, component, _server) do
    put_state(component, active: nil)
  end

  def command(:set_page_theme, params, component, _server) do
    slug = params.slug

    if slug in @slugs do
      Hologram.JS.exec(
        "document.documentElement.setAttribute('data-sem-theme', '" <> slug <> "')"
      )

      put_state(component, :active, slug)
    else
      Hologram.JS.exec("document.documentElement.removeAttribute('data-sem-theme')")
      put_state(component, :active, nil)
    end
  end

  defp switch_class(active) do
    if active do
      "rounded-md border border-violet-soft px-3 py-1.5 font-mono text-sm text-violet-soft"
    else
      "rounded-md border border-code-border px-3 py-1.5 font-mono text-sm text-ink hover:border-violet-soft"
    end
  end

  def template do
    ~HOLO"""
    <div
      class="mt-10 flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Theme switcher (whole page)"
    >
      <span class="text-xs font-medium uppercase tracking-wide text-ink-mute">
        Switch this page:
      </span>
      <button
        type="button"
        class={switch_class(@active == nil)}
        aria-pressed={if @active == nil do "true" else "false" end}
        $click={command: :set_page_theme, slug: ""}
      >
        Default (no attribute)
      </button>
      {%for t <- @themes}
        <button
          type="button"
          class={switch_class(@active == t.slug)}
          aria-pressed={if @active == t.slug do "true" else "false" end}
          $click={command: :set_page_theme, slug: t.slug}
        >
          {t.slug}
        </button>
      {/for}
    </div>
    """
  end
end
