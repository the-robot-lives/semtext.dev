defmodule SemtextWeb.Hologram.Pages.ShowcaseEmbeddingPage do
  @moduledoc """
  /showcase/embedding/ — port of the Next site's
  `app/showcase/embedding/page.tsx`: reusing one document's sections
  inside another via the sem-embed pattern. A vocabulary proposal, not a
  spec element — the example stays in source view and the copy says so.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/embedding"
  layout SiteLayout,
    page_title: "Embedding — SemText showcase",
    description:
      "Reusing one document's sections inside another: the sem-embed pattern — source, a selected block, a card mode. A vocabulary proposal; not a spec element yet.",
    canonical: "https://semtext.dev/showcase/embedding/"

  @example ~S"""
  <h2>Shared glossary</h2>
  <p>Definitions are written once and embedded where they are read —
  never copied between documents:</p>

  <sem-embed source="../glossary.sem.html"></sem-embed>

  <!-- one block of the source, by its id -->
  <sem-embed source="../glossary.sem.html#f-oidc"></sem-embed>

  <!-- the same block, presented as a card -->
  <sem-embed source="../glossary.sem.html#f-oidc" mode="card"></sem-embed>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      lines: Highlighter.numbered_lines(@example)
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="embedding" title="One source of truth, embedded where it is read" groups={@groups} sections={[%{id: "example", label: "The contract"}, %{id: "status", label: "Status"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        The moment a definition is copied into a second document, the two
        copies drift. SemText's{" "}
        <code class="font-mono">sem-embed</code> points at the other
        document instead — a whole document, one block by id, or a block in
        a presentation mode — so the glossary entry, the procedure, the
        fact exists once and renders wherever it is read.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The contract
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Three forms: a whole source document, a{" "}
          <code class="font-mono">#section-id</code> into it, and a{" "}
          <code class="font-mono">mode</code> for how the block presents.
          This example stays in source view — see the status note below.
        </p>
        <ExampleViewer cid="example-viewer" id="embedding" label="embedding example" filename="embedding.md" caption="authored SemText" lines={@lines} renderable={false} />
      </section>

      <section id="status" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Status
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          This is a proposal, not a catalogued element: the spec states no
          schema for <code class="font-mono">sem-embed</code> and no
          shipped tier renders it — this page deliberately does not fake a
          render. Until a schema lands, an embedded reference reads as its
          authored markup, which is a record, not a broken page.
        </p>
      </section>

      <ShowcaseFooter>
        There is no reference page for this pattern — it has no schema file
        in the spec. Vocabulary proposals land in{" "}
        <a href="https://github.com/noizu-labs-ml/npl-enhanced-content" class="text-violet-soft underline-offset-4 hover:underline">
          npl-enhanced-content
        </a>
        's spec catalog.
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
