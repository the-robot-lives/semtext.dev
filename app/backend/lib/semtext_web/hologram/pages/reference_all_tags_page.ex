defmodule SemtextWeb.Hologram.Pages.ReferenceAllTagsPage do
  @moduledoc """
  /reference/all — every SemText and NPL element in one table (thread
  858cc161): tag, family, description. The descriptions are the same
  plain-language copy the index cards and element pages show
  (priv/data/description-overrides.json, applied in Semtext.Reference.Tags).

  Static server-rendered rows — the table is plain HTML, no island, no
  filter: the /reference index's filter box covers search, this page is
  the full inventory at a glance (and trivially printable).
  """

  use Hologram.Page

  alias Semtext.Reference.Nav
  alias Semtext.Reference.Tags
  alias SemtextWeb.Hologram.Components.Site.DocsShell
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/reference/all"

  layout SiteLayout,
    page_title: "All tags — SemText reference",
    description:
      "Every SemText and NPL element in one table: the tag, its family, and a plain-language description.",
    canonical: "https://semtext.dev/reference/all/",
    reference_assets: true

  def init(_params, component, _server) do
    rows =
      for t <- Tags.all_tags() do
        %{
          name: t.name,
          family: t.family,
          description: t.description,
          href: Tags.tag_href(t.name)
        }
      end

    put_state(component,
      groups: Nav.groups(),
      rows: rows,
      total: length(rows)
    )
  end

  def template do
    ~HOLO"""
    <DocsShell active="reference" groups={@groups}>
      <main id="main">
        <p class="g-eyebrow">Reference</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Every tag, one table
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          All {@total} SemText and NPL elements — the tag, the family it
          belongs to, and what it does in one sentence each. The
          <a
            class="text-violet-soft underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
            href="/reference/"
          >
            grouped reference
          </a>{" "}
          has the per-element pages; the
          <a
            class="text-violet-soft underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
            href="/editor/"
          >
            editor
          </a>{" "}
          opens any of them live.
        </p>

        <div class="ref-all-table-wrap mt-10 overflow-x-auto">
          <table class="ref-all-table">
            <thead>
              <tr>
                <th scope="col">Tag</th>
                <th scope="col">Family</th>
                <th scope="col">What it does</th>
              </tr>
            </thead>
            <tbody>
              {%for row <- @rows}
                <tr>
                  <td>
                    <a class="ref-all-tag" href={row.href}><code class="font-mono">{row.name}</code></a>
                  </td>
                  <td class="ref-all-family">{if row.family == :sem do "SemText" else "NPL" end}</td>
                  <td class="ref-all-desc">{row.description}</td>
                </tr>
              {/for}
            </tbody>
          </table>
        </div>
      </main>
    </DocsShell>
    """
  end
end
