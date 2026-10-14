defmodule SemtextWeb.Hologram.Pages.DataVizPage do
  @moduledoc """
  /dataviz — port of the Next site's `app/dataviz/page.tsx`: the
  sem-data-visualizer showcase. The copy is authored SemText exactly as
  the spec defines it — nothing here is bespoke visualizer code; the
  reading bundle (`/dataviz/semtext-reading.js`, built by
  noizu-labs-ml/npl-enhanced-content, feat/data-viz-phase6) renders and
  auto-wires the whole document.

  Hologram escapes every template interpolation, so each visualizer's
  authored markup travels in a `Sem` pane's `data-sem-html` attribute
  (lossless) and `/dataviz/sem-html-boot.js` hydrates it into the DOM
  before the deferred reading bundle scans for
  `<sem-data-visualizer>` elements. With scripts off the panes stay
  inert attributes — the document reads as authored, the same zero-JS
  posture the Next page documents.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.DocsShell
  alias SemtextWeb.Hologram.Components.Site.Sem
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/dataviz"

  layout SiteLayout,
    page_title: "Data visualizer — SemText showcase",
    description:
      "The sem-data-visualizer family live: tables from inline Markdown, CSV and YAML sources, per-column typed sort, named views, a declarative join, and an editable default query — served by the reading bundle.",
    canonical: "https://semtext.dev/dataviz/"

  # Build-time authored SemText (never user input). Kept as raw strings in
  # module attributes on purpose: they contain no `</script>` bytes, so
  # they are safe to carry in page state and the hydration payload (the
  # payload-leak rule from the 83c34cd lesson).
  @fleet_html ~S"""
  <sem-data-visualizer id="dv-fleet">
    <sem-data-source data-name="Fleet" data-views="all=*; operators=name, replicas" data-view="all">| name   | region | port | replicas |
|--------|--------|------|----------|
| auth   | eu     | 8080 | 3        |
| billing| us     | 8443 | 2        |
| pages  | ap     | 3000 | 2        |
| search | eu     | 9200 | 5        |</sem-data-source>
  </sem-data-visualizer>
  """

  @ops_html ~S"""
  <sem-data-visualizer id="dv-ops">
    <sem-data-source data-name="Services" source="data/services.csv"></sem-data-source>
    <sem-data-source data-name="Regions" source="data/regions.yaml"></sem-data-source>
    <sem-data-join data-name="Service Regions" data-left="Services" data-right="Regions" data-on="region"></sem-data-join>
    <sem-data-query>SELECT name, port, zone, latency_ms FROM service-regions ORDER BY latency_ms DESC</sem-data-query>
  </sem-data-visualizer>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      fleet_html: @fleet_html,
      ops_html: @ops_html
    )
  end

  def template do
    ~HOLO"""
    <DocsShell active="showcase-data-visualizer" groups={@groups}>
      <main id="main">
        <p class="g-eyebrow">Showcase</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Data visualizer
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          Tables that live inside the document: authored as plain SemText
          (<code class="font-mono">sem-data-visualizer</code>,{" "}
          <code class="font-mono">sem-data-source</code>,{" "}
          <code class="font-mono">sem-data-join</code>,{" "}
          <code class="font-mono">sem-data-query</code> — see{" "}
          <a class="underline decoration-white/30 underline-offset-2 hover:decoration-white/70" href="/reference/sem-data-visualizer/">
            the tag reference
          </a>
          ), rendered and wired by the reading bundle. Sort any column, switch
          views, edit the query — everything below is the bundle&apos;s own
          chrome over authored markup, served from this site at{" "}
          <code class="font-mono">/dataviz/semtext-reading.js</code>.
        </p>

        <h2 id="views" class="mt-12 text-xl font-semibold tracking-tight text-ink">
          Inline source, named views
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          One visualizer, one inline Markdown table: per-column typed sort on
          every header, an <code class="font-mono">aria-pressed</code> view
          switch for the declared views (<code class="font-mono">all</code>,{" "}
          <code class="font-mono">operators</code>), and the expand /
          copy-link chrome — the container id makes it deep-linkable
          (<code class="font-mono">#dv=dv-fleet&amp;view=…</code>) and the
          modal opens the same rendered view full-page.
        </p>
        <Sem html={@fleet_html} class="mt-5" />

        <h2 id="join-query" class="mt-12 text-xl font-semibold tracking-tight text-ink">
          Files, a declarative join, the editable query
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          One visualizer, the whole story: two buckets fetched from files next
          to this page (CSV and YAML), a{" "}
          <code class="font-mono">sem-data-join</code> composing them on
          the named key column, and the editable default query reading the
          joined bucket — the results re-run as you type (debounced), and the
          edited statement deep-links too
          (<code class="font-mono">#dv=dv-ops&amp;q=…</code>). The authored
          query text is never rewritten: edits are session-only.
        </p>
        <Sem html={@ops_html} class="mt-5" />

        <p class="mt-10 max-w-3xl text-sm leading-6 text-ink-faint">
          With scripts off both sources read as pre-wrapped authored text —
          the document is the record; the chrome is presentation.
        </p>
      </main>
      <link rel="stylesheet" precedence="semtext-dataviz" href="/dataviz/vocabulary.css" />
      <script src="/dataviz/sem-html-boot.js"></script>
      <script defer src="/dataviz/semtext-reading.js"></script>
    </DocsShell>
    """
  end
end
