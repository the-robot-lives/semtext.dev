defmodule SemtextWeb.Hologram.Pages.ShowcaseIndexPage do
  @moduledoc """
  /showcase/ — port of the Next site's `app/showcase/page.tsx`: one card
  per page under /showcase/<slug>/. The list is
  `SemtextWeb.Docs.Showcase.items/0` — the same array the sidebar and the
  landing menu use, so the three cannot drift.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Showcase
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase"
  layout SiteLayout,
    page_title: "Showcase — SemText",
    description:
      "Real use cases worked in SemText: repo guidance, documentation, onboarding, agent records, command and skill files, data viewers, embedding and the interactive shell — every example is authored SemText, rendered live.",
    canonical: "https://semtext.dev/showcase/"

  def init(_params, component, _server) do
    put_state(component, items: Showcase.items())
  end

  def template do
    ~HOLO"""
    <div class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p class="g-eyebrow">Showcase</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          One format, real jobs
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          Each page is one use case worked in SemText — a document an agent
          and a human read from the same file. Every example is authored
          SemText built only from tags the spec defines, with a source toggle
          so you can see the markup doing the work.
        </p>
        <ul class="mt-10 grid gap-3 sm:grid-cols-2" role="list">
          {%for d <- @items}
            <li>
              <a
                href={if d.href == nil do "/showcase/" else d.href end}
                class="group block h-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3.5 transition-colors hover:border-white/30 hover:bg-white/[0.06]"
              >
                <span class="block font-mono text-sm text-ink group-hover:text-white">
                  {d.label}
                </span>
                <span class="mt-1.5 block text-sm leading-6 text-ink-mute">
                  {d.note}
                </span>
              </a>
            </li>
          {/for}
        </ul>
      </main>
    </div>
    """
  end
end
