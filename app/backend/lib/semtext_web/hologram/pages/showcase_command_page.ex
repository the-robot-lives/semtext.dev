defmodule SemtextWeb.Hologram.Pages.ShowcaseCommandPage do
  @moduledoc """
  /showcase/command/ — port of the Next site's
  `app/showcase/command/page.tsx`: a command spec whose arguments,
  ordered procedure and invariants are records — one file for the
  operator and the model.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/command"
  layout SiteLayout,
    page_title: "Command — SemText showcase",
    description:
      "A command spec in SemText: arguments as a definition list, the procedure as ordered steps, the invariants as facts — one file for the operator and the model.",
    canonical: "https://semtext.dev/showcase/command/"

  @example ~S"""
  <sem-enhanced-document>
    <h1 data-kind="title">/release</h1>
    <p>Files a release: verify the schema, merge the release branch, watch the deploy.</p>

    <sem-properties kind="arguments">
      <sem-property key="target" role="definition" aria-label="target">develop | stage | main — the branch receiving the release</sem-property>
      <sem-property key="--verify-schema" role="definition" aria-label="--verify-schema">Re-check pending changesets before merging (default: on)</sem-property>
    </sem-properties>

    <sem-procedure kind="runbook" role="list">
      <sem-step role="listitem">Verify applied changesets in the migrations table</sem-step>
      <sem-step role="listitem" status="current">Open the release PR</sem-step>
      <sem-step role="listitem">Watch checks and the deployed image</sem-step>
      <sem-step role="listitem">Back-merge main into develop</sem-step>
    </sem-procedure>

    <sem-facts view-as="list">
      <sem-fact id="rel-schema" kind="invariant">
        <statement>Schema lands before code</statement>
        <conclusion>The migration must be applied and present in the changelog table before the image deploys.</conclusion>
      </sem-fact>
    </sem-facts>

    <sem-note variant="danger">A red guard on a promotion means a back-merge is owed — never force it.</sem-note>
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
    <ShowcaseFrame slug="command" title="A command spec, for the operator and the model" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        Commands accumulate lore — arguments in one place, steps in
        another, the caution that saves you at 2am in a third. As one
        SemText document, the argument table, the ordered procedure and the
        invariants are records: an agent can execute the procedure or
        answer “what does --verify-schema do?” from the same
        file the operator skims.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          The properties block renders a definition grid (the{" "}
          <code class="font-mono">aria-label</code> repeats the key for
          assistive tech), and the procedure's{" "}
          <code class="font-mono">current</code> step shows where a run
          stands.
        </p>
        <ExampleViewer cid="example-viewer" id="command" label="command example" filename="command.md" caption="authored SemText" lines={@lines} renderable={true} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code class="font-mono">sem-property</code> pairs are a closed
            set: key is the term, content is the value — a definition list,
            not a layout.
          </li>
          <li>
            <code class="font-mono">kind</code> qualifies every block
            (<code class="font-mono">arguments</code>,{" "}
            <code class="font-mono">runbook</code>,{" "}
            <code class="font-mono">invariant</code>) — the machine
            reading knows what each record is.
          </li>
          <li>
            The danger note renders beside the flow in every tier — cautions
            are content, not chrome.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code class="font-mono">sem-properties</code>,{" "}
        <code class="font-mono">sem-procedure</code>,{" "}
        <code class="font-mono">sem-facts</code>,{" "}
        <code class="font-mono">sem-note</code>. Their contracts live on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
