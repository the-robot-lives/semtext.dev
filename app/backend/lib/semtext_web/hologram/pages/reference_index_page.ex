defmodule SemtextWeb.Hologram.Pages.ReferenceIndexPage do
  @moduledoc """
  /reference — the section index (port of the Next site's
  `app/reference/page.tsx`): a short intro, the filter box, and a card per
  element grouped by the job the element does (the buckets) plus the
  display families — SemText extensions, Agent Kit and NPL. Every card
  links to the element's own page.

  The filter is the Next page's vanilla script, moved into the island
  bridge (`/js/semtext-island.js` initRefFilter): it narrows the already
  rendered cards and sidebar links by tag name or summary. With no JS
  nothing runs and the page shows every element — the SSR render is whole,
  exactly like the static export.
  """

  use Hologram.Page

  alias Semtext.Reference.{Buckets, Nav, Tags}
  alias SemtextWeb.Hologram.Components.Reference.TagCard
  alias SemtextWeb.Hologram.Components.Site.DocsShell
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/reference"

  layout SiteLayout,
    page_title: "Reference — every SemText tag",
    description: "Generated reference for every SemText (sem-*), SemText extension (semext-*), Agent Kit (agent-kit-*) and NPL (npl-) tag: options, children and an authored example, one page per element, built from the spec's schema files.",
    canonical: "https://semtext.dev/reference/",
    reference_assets: true

  @npl_blurb "The npl-* components — display renders of NPL prompt blocks (agent introspection, critique, reasoning)."
  @semext_blurb "The semext-* embeds — service-backed views (SigNoz signals, media prompts, doc pointers, styleguide themes) rendered where a plain tag cannot reach."
  @agent_kit_blurb "The agent-kit-* cards — the work-item vocabulary (tickets, epics, personas, test cases) rendered from Agent Kit records."

  def init(_params, component, _server) do
    put_state(component,
      groups: Nav.groups(),
      total: length(Tags.all_tags()),
      buckets: index_buckets(),
      npl_blurb: @npl_blurb,
      npl_tags: index_tags(Tags.npl_tags()),
      semext_blurb: @semext_blurb,
      semext_tags: index_tags(Tags.semext_tags()),
      agent_kit_blurb: @agent_kit_blurb,
      agent_kit_tags: index_tags(Tags.agent_kit_tags())
    )
  end

  # Bucket sections for the page body: label, description, cards. Cards are
  # prebuilt maps (template only interpolates — every data call stays
  # server-side, since the client re-renders the template and cannot call
  # the data modules).
  defp index_buckets do
    for b <- Buckets.buckets() do
      %{
        id: b.id,
        label: b.label,
        description: b.description,
        cards: index_tags(b.tags)
      }
    end
  end

  defp index_tags(tags) do
    for t <- tags do
      missing = Tags.gap_missing_for(t.name)
      gap_note = "summary" in missing or "description" in missing

      %{
        name: t.name,
        family: t.family,
        family_label: Tags.family_label(t.family),
        summary: t.summary,
        gap_note: gap_note,
        href: Tags.tag_href(t.name),
        # Filter payload: tag name plus summary words, lowercase (TS dataRef).
        data_ref: String.downcase("#{t.name} #{t.summary}")
      }
    end
  end

  def template do
    ~HOLO"""
    <DocsShell active="reference" groups={@groups}>
      <main id="main">
        <p class="g-eyebrow">Reference</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Tag reference
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          The {@total} tags across the SemText vocabulary, its extension
          families and NPL, grouped by the job the element
          does. Each card opens the element's page — its options, children
          and an authored example — and a field its source does not state
          is marked there. To write with them right away,{" "}
          <a
            class="text-violet-soft underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
            href="/editor/"
          >
            open the editor →
          </a>{" "}
          — any example below opens in it with <code class="font-mono">?example=&lt;tag&gt;</code>.{" "}
          <a
            class="text-violet-soft underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
            href="/reference/all"
          >
            Every tag in one table →
          </a>
        </p>

        <div class="mt-8 max-w-3xl">
          <label for="ref-search" class="g-nav-title">Filter tags</label>
          <input
            id="ref-search"
            type="search"
            placeholder="Type a tag name or a summary word — e.g. quiz, chronology, agent"
            autocomplete="off"
            class="ref-search-input mt-2 w-full"
          />
          <p id="ref-count" hidden class="mt-2 text-sm text-ink-mute" aria-live="polite"></p>
        </div>

        {%for bucket <- @buckets}
          <section aria-labelledby={"bucket-" <> bucket.id <> "-h"} class="mt-14">
            <h2 id={"bucket-" <> bucket.id <> "-h"} class="text-2xl font-semibold tracking-tight text-ink">
              {bucket.label}
            </h2>
            <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">{bucket.description}</p>
            <div class="ref-card-grid mt-6">
              {%for card <- bucket.cards}
                <TagCard card={card} />
              {/for}
            </div>
          </section>
        {/for}

        <section aria-labelledby="family-semext-h" class="mt-14">
          <h2 id="family-semext-h" class="text-2xl font-semibold tracking-tight text-ink">
            SemText extensions
          </h2>
          <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">{@semext_blurb}</p>
          <div class="ref-card-grid mt-6">
            {%for card <- @semext_tags}
              <TagCard card={card} />
            {/for}
          </div>
        </section>

        <section aria-labelledby="family-agent-kit-h" class="mt-14">
          <h2 id="family-agent-kit-h" class="text-2xl font-semibold tracking-tight text-ink">
            Agent Kit elements
          </h2>
          <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">{@agent_kit_blurb}</p>
          <div class="ref-card-grid mt-6">
            {%for card <- @agent_kit_tags}
              <TagCard card={card} />
            {/for}
          </div>
        </section>

        <section aria-labelledby="family-npl-h" class="mt-14">
          <h2 id="family-npl-h" class="text-2xl font-semibold tracking-tight text-ink">
            NPL elements
          </h2>
          <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">{@npl_blurb}</p>
          <div class="ref-card-grid mt-6">
            {%for card <- @npl_tags}
              <TagCard card={card} />
            {/for}
          </div>
        </section>
      </main>
    </DocsShell>
    """
  end
end
