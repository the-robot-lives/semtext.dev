defmodule SemtextWeb.Hologram.Components.Site.ShowcaseFrame do
  @moduledoc """
  Shared scaffold for the /showcase/<slug>/ pages — port of
  `ShowcaseFrame` in the Next site's `components/showcase-page.tsx`: the
  docs sidebar, the eyebrow + title, then the page's content (whose FIRST
  element is the one-paragraph "why this use case" lede).

  Hologram has a single slot, so the lede paragraph travels in the slot
  ahead of the sections (the Next version passed it as a `lede` prop).
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.DocsShell

  prop :slug, :string, required: true
  prop :title, :string, required: true
  prop :groups, :list, required: true
  prop :sections, :list, default: []

  def template do
    ~HOLO"""
    <DocsShell active={"showcase-" <> @slug} groups={@groups} sections={@sections} examples={[]}>
      <main id="main">
        <p class="g-eyebrow">Showcase</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {@title}
        </h1>
        <slot />
      </main>
    </DocsShell>
    """
  end
end
