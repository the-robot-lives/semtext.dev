defmodule SemtextWeb.Hologram.Pages.ShowcaseDataViewerPage do
  @moduledoc """
  /showcase/data-viewer/ — port of the Next site's
  `app/showcase/data-viewer/page.tsx`: a sortable, filterable table whose
  authored <table> is the contract — no JSON payload, no loader, the
  markup is the source of truth.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/data-viewer"

  layout SiteLayout,
    page_title: "Data viewer — SemText showcase",
    description:
      "Data in the document: a sortable, filterable table whose authored <table> is the contract — no JSON payload, no loader, the markup is the source of truth.",
    canonical: "https://semtext.dev/showcase/data-viewer/"

  @example ~S"""
  <sem-enhanced-document>
    <h1 data-kind="title">Service inventory</h1>

    <sem-table controls="sort,filter" sticky>
      <table>
        <caption>Services and owners</caption>
        <thead>
          <tr><th scope="col">Service</th><th scope="col">Region</th><th scope="col">Replicas</th></tr>
        </thead>
        <tbody>
          <tr><td>auth</td><td>eu</td><td data-value="3">3</td></tr>
          <tr><td>billing</td><td>us</td><td data-value="2">2</td></tr>
          <tr><td>pages</td><td>ap</td><td data-value="2">2</td></tr>
          <tr><td>search</td><td>eu</td><td data-value="5">5</td></tr>
        </tbody>
      </table>
    </sem-table>

    <sem-note variant="tip">Bigger data — CSV and YAML sources, a declarative join, an editable query — is the sem-data-visualizer family on the <a href="/dataviz/">data visualizer page</a>.</sem-note>
  </sem-enhanced-document>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      lines: Highlighter.numbered_lines(@example),
      # raw source for ExampleViewer data-sem-html (template @example = state key)
      example: @example
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="data-viewer" title="A data viewer with no viewer to build" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        The usual data table ships three times: the data, the component
        that renders it, and the wiring between them. SemText's{" "}
        <code class="font-mono">sem-table</code> collapses that to the
        markup: the authored <code class="font-mono">&lt;table&gt;</code>{" "}
        is the contract — sort and filter are chrome the reading bundle adds,
        and extraction returns the rows in authored order. A model reads the
        same cells a human sorts.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Render it: headers become sort buttons (an{" "}
          <code class="font-mono">aria-sort</code> cycle), the filter box
          narrows rows, and the sticky header survives the scroll.{" "}
          <code class="font-mono">data-value</code> is an ordinary HTML
          sort key on a plain cell, not vocabulary syntax.
        </p>
        <ExampleViewer cid="example-viewer" id="data-viewer" label="data-viewer example" filename="data-viewer.md" caption="authored SemText" lines={@lines} renderable={true} raw={@example} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            No payload duplication: there is no JSON beside the table to go
            stale — the <code class="font-mono">&lt;table&gt;</code> is
            the only copy of the data.
          </li>
          <li>
            Extraction is in on it: the record comes back as{" "}
            <code class="font-mono">
              {"{caption, columns[], rows[]}"}
            </code>{" "}
            in authored order — the one recorded exception, stamped so the
            order is stable under sorting.
          </li>
          <li>
            With scripts off the table is an ordinary, valid HTML table —
            the data never depended on the bundle.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        The full visualizer family —{" "}
        <code class="font-mono">sem-data-source</code>,{" "}
        <code class="font-mono">sem-data-join</code>,{" "}
        <code class="font-mono">sem-data-query</code> — renders live on{" "}
        <a href="/dataviz/" class="text-violet-soft underline-offset-4 hover:underline">
          /dataviz/
        </a>
        ; each tag's contract is on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          its reference page
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
