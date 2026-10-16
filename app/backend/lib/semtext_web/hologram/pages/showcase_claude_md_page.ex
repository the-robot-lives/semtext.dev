defmodule SemtextWeb.Hologram.Pages.ShowcaseClaudeMdPage do
  @moduledoc """
  /showcase/claude-md/ — port of the Next site's
  `app/showcase/claude-md/page.tsx`. Every element in the example is spec
  vocabulary (spec/conventions.md §5): the bare agent record and its
  name/bio/instructions parts, sem-note, sem-procedure/sem-step and
  sem-facts/sem-fact. The viewer renders it with the site's fallback
  bundle — the same file, no second source.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/claude-md"

  layout SiteLayout,
    page_title: "CLAUDE.md — SemText showcase",
    description:
      "Repo guidance as a SemText document: the agent record, the procedure and the invariants an agent must keep — one file the model reads and a contributor browses.",
    canonical: "https://semtext.dev/showcase/claude-md/"

  @example ~S"""
  <sem-enhanced-document>
    <agent>
      <name>Repo Guide</name>
      <bio>Answers build and release questions for this repository.</bio>
      <instructions>Answer only from the sem-fact records on this page; cite fact ids. Never invent commands.</instructions>
    </agent>

    <h1 data-kind="title">Contributor guide</h1>

    <sem-note variant="warning">Never push to <code>main</code> by hand — CI owns it.</sem-note>

    <h2>Build</h2>
    <sem-procedure kind="runbook" role="list">
      <sem-step role="listitem" status="done">Install dependencies</sem-step>
      <sem-step role="listitem" status="current">Run the dev server</sem-step>
      <sem-step role="listitem">Build before every PR</sem-step>
    </sem-procedure>

    <h2>Invariants</h2>
    <sem-facts view-as="list" controls="filter">
      <sem-fact id="g-main" kind="invariant">
        <statement>main is CI/CD-only</statement>
        <conclusion>All merges into main are performed by automation; humans and agents merge to develop.</conclusion>
      </sem-fact>
      <sem-fact id="g-tests" kind="invariant">
        <statement>Tests run against built pages</statement>
        <conclusion>Run the build before the suite — the specs read the built output, not the sources.</conclusion>
      </sem-fact>
    </sem-facts>
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
    <ShowcaseFrame slug="claude-md" title="CLAUDE.md, in one file for every reader" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        Repository guidance is written once and read twice: an agent needs
        the rules as records it can quote, a contributor needs a page they
        can skim. As SemText, the same file is both — the{" "}
        <code class="font-mono">agent</code> record carries the name, bio
        and instructions a model follows, while the procedure and fact
        blocks are the same guidance rendered as this page. Point the agent
        at the file; hand the human the URL.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Switch to <em>Render</em> to read it as a contributor does; the
          source is the same file the agent consumes. The facts carry ids, so
          an answer can cite <code class="font-mono">g-main</code> the way
          the instructions require.
        </p>
        <ExampleViewer cid="example-viewer" id="claude-md" label="claude-md example" filename="claude.md" caption="authored SemText" lines={@lines} renderable={true} raw={@example} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            The <code class="font-mono">agent</code> record is
            machine-facing metadata — extraction names it a record; the
            browser leaves it invisible.
          </li>
          <li>
            <code class="font-mono">sem-procedure</code> statuses
            (done / current / blocked) are canonical attributes, so both
            readers agree on where the process stands.
          </li>
          <li>
            With scripts off nothing is hidden — the guidance reads as plain
            authored text, the record intact.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code class="font-mono">agent</code>,{" "}
        <code class="font-mono">sem-note</code>,{" "}
        <code class="font-mono">sem-procedure</code>,{" "}
        <code class="font-mono">sem-facts</code>. Their contracts live on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
