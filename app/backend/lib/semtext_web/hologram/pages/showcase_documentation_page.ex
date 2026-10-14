defmodule SemtextWeb.Hologram.Pages.ShowcaseDocumentationPage do
  @moduledoc """
  /showcase/documentation/ — port of the Next site's
  `app/showcase/documentation/page.tsx`: a collapsed callout, a code
  listing with filename and marked line, an occludable aside and numbered
  citations — provenance kept on every element an extractor quotes back.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/documentation"
  layout SiteLayout,
    page_title: "Documentation — SemText showcase",
    description:
      "Long-form documentation in SemText: callouts, code listings with provenance, occludable asides and numbered citations — authored once, readable and quotable.",
    canonical: "https://semtext.dev/showcase/documentation/"

  @example ~S"""
  <sem-enhanced-document>
    <h1 data-kind="title">Rotation keys</h1>

    <sem-note variant="tip" collapsed>Rotate per session — the short version is two lines of config.</sem-note>

    <h2>Key lifetime</h2>
    <p>Short-lived access tokens are paired with a refresh grant that issues a new pair<a href="#r-oauth">[1]</a>.</p>

    <sem-code lang="yaml" filename="config/auth.yaml" mark="2" controls="copy,wrap">
  <pre><code>access_ttl: 15m
  refresh_rotation: per-use</code></pre>
    </sem-code>

    <sem-details>
      <sem-detail>
        Why rotation matters: a token copied from <highlight>localStorage</highlight> outlives its session unless the grant rotates it.
      </sem-detail>
    </sem-details>

    <sem-references kind="bibliography" role="list">
      <sem-reference id="r-oauth" role="listitem" href="https://datatracker.ietf.org/doc/html/rfc6749" cite="RFC 6749">The OAuth 2.0 Authorization Framework.</sem-reference>
    </sem-references>
  </sem-enhanced-document>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      lines: Highlighter.numbered_lines(@example)
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="documentation" title="Documentation that keeps its provenance" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        A documentation page is prose plus evidence: callouts that keep the
        quick answer close, listings that carry their filename, asides that
        stay out of the way until asked for, citations a reader can
        check. Every one of those is an element, not a plugin — and each
        one is also a record an extractor can quote back.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          The collapsed note teases ten words and expands on click; the
          listing gets copy and wrap controls with line 2 marked; the aside
          occludes its highlight in quiz views; the citation previews on
          hover with a backlink.
        </p>
        <ExampleViewer cid="example-viewer" id="documentation" label="documentation example" filename="documentation.md" caption="authored SemText" lines={@lines} renderable={true} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code class="font-mono">sem-code</code> keeps its source
            verbatim — extraction returns the listing byte-identical, so a
            model can quote the config, not a rendering of it.
          </li>
          <li>
            <code class="font-mono">sem-references</code> mints nothing:
            the numbering is CSS, the citation is an attribute, and the
            record survives scripts-off.
          </li>
          <li>
            Every hide rule is gated on the script having run — with no
            JavaScript the note is open, the aside is visible, and the
            document reads whole.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code class="font-mono">sem-note</code>,{" "}
        <code class="font-mono">sem-code</code>,{" "}
        <code class="font-mono">sem-details</code>,{" "}
        <code class="font-mono">sem-references</code>. Their contracts live
        on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
