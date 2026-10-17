defmodule SemtextWeb.Hologram.Pages.ReferenceIndexPage do
  @moduledoc """
  /reference — the section index (port of the Next site's
  `app/reference/page.tsx`): a short intro, the filter box, and a card per
  element grouped by the job the element does (the seven buckets) plus the
  NPL family. Every card links to the element's own page.

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
    page_title: "Reference — every SemText and NPL tag",
    description: "Generated reference for every SemText (sem-*) and NPL (npl-) tag: options, children and an authored example, one page per element, built from the spec's schema files.",
    canonical: "https://semtext.dev/reference/",
    reference_assets: true

  @npl_blurb "The npl-* components — display renders of NPL prompt blocks (agent introspection, critique, reasoning)."

  def init(_params, component, _server) do
    put_state(component,
      groups: Nav.groups(),
      total: length(Tags.sem_tags()) + length(Tags.npl_tags()),
      buckets: index_buckets(),
      npl_blurb: @npl_blurb,
      npl_tags: index_tags(Tags.npl_tags())
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
        family_label: if(t.family == :sem, do: "SemText", else: "NPL"),
        summary: t.summary,
        gap_note: gap_note,
        href: Tags.tag_href(t.name),
        # Filter payload: tag name plus summary words, lowercase (TS dataRef).
        data_ref: String.downcase("#{t.name} #{t.summary}"),
        badge: badge(t)
      }
    end
  end

  # Compact shipped-runtime badge (TS BundleBadge): the file that provides
  # the element (lazy chunk when one exists, else the fallback bundle), a
  # fallback suffix when the enhancement tier also covers it, or an honest
  # none. `title` carries the full provenance.
  defp badge(t) do
    case Tags.bundles_for(t.name) do
      nil ->
        nil

      b ->
        cond do
          t.family == :npl ->
            %{text: "not in site bundles", title: b[:note] || ""}

          not b.shipped and b.css_only ->
            # Zero-JS by contract, painted by the shipped theme CSS: say
            # what paints the example instead of implying the pane is dead.
            %{text: "theme CSS only", title: b[:note] || ""}

          not b.shipped ->
            %{text: "no shipped runtime", title: b[:note] || ""}

          true ->
            files = b.bundles || []
            lazy = Enum.find(files, &(&1.file == "semtext-lazy.js"))
            chunk = lazy && String.replace_prefix(lazy.detail, "loads ", "")
            fallback? = Enum.any?(files, &(&1.file == "semtext-fallback.js"))

            text =
              [chunk || (files != [] && hd(files).file) || nil, fallback? && "fallback"]
              |> Enum.reject(&(&1 in [nil, false]))
              |> Enum.join(" · ")

            title =
              (if b.shared_with, do: "same runtime as #{b.shared_with}: ", else: "") <>
                Enum.map_join(files, " + ", & &1.file)

            %{text: text, title: title}
        end
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
          The {@total} SemText and NPL tags, grouped by the job the element
          does. Each card opens the element's page — its options, children
          and an authored example — and a field its source does not state
          is marked there.
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
