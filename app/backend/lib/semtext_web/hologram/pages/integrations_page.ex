defmodule SemtextWeb.Hologram.Pages.IntegrationsPage do
  @moduledoc """
  /integrations/ — port of the Next site's `app/integrations/page.tsx`:
  the integrations carousel plus the four live portfolio origins whose
  SemText hookups are planned. Both lists are shared, neither redefined
  here: the carousel owns the six cards, and
  `SemtextWeb.Docs.Showcase.integrations/0` is the same array the landing
  showcase menu uses (the no-drift rule).
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Showcase
  alias SemtextWeb.Hologram.Components.Site.AddonsCarousel
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/integrations"
  layout SiteLayout,
    page_title: "Integrations — SemText",
    description:
      "The integrations catalog: ticket embedding, knowledge-base answers, courses and quizzes, Draftamo mockups and UML, issue submission — each wired to its real logic as it is built. The reading and extraction core stays free and static.",
    canonical: "https://semtext.dev/integrations/"

  def init(_params, component, _server) do
    put_state(component, integrations: Showcase.integrations())
  end

  def template do
    ~HOLO"""
    <div class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p class="g-eyebrow">Platform</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Documents that do more than read
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          The reading and extraction core is free and static. Integrations
          connect a document to live systems — tickets and knowledge-base
          answers cited inline, quizzes and courses readers work through,
          mockups and UML rendered in place. Each is wired to its real logic
          as it is built, and none change how a document reads.
        </p>

        <h2 class="mt-12 text-2xl font-semibold tracking-tight text-ink">
          The integrations
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Six surfaces, one rule: the document stays the record. Each mock
          below is an illustration of planned output, not a screenshot —
          nothing in it claims availability.
        </p>
        <AddonsCarousel cid="integrations_carousel" />

        <h2 class="mt-14 text-2xl font-semibold tracking-tight text-ink">
          Where they will live
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          The portfolio apps the hookups land in first. Every origin below is
          live today; the SemText hookup is the planned part.
        </p>
        <ul class="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2" role="list">
          {%for d <- @integrations}
            <li class="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3.5">
              <span class="flex items-baseline justify-between gap-2">
                <a
                  href={d.href}
                  class="font-mono text-sm text-violet-soft underline-offset-4 hover:underline"
                >
                  {d.label}
                </a>
                {%if d.planned}
                  <b class="g-status">hookup planned</b>
                {/if}
              </span>
              <span class="mt-1.5 block text-sm leading-6 text-ink-mute">
                {d.note}
              </span>
            </li>
          {/for}
        </ul>
      </main>
    </div>
    """
  end
end
