defmodule SemtextWeb.Hologram.Pages.ShowcaseSkillPage do
  @moduledoc """
  /showcase/skill/ — port of the Next site's `app/showcase/skill/page.tsx`:
  the agent instructions plus switchable reference and example views — one
  file a model executes and a reader browses, so nothing drifts.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/skill"
  layout SiteLayout,
    page_title: "Skill — SemText showcase",
    description:
      "A skill file in SemText: the agent instructions, switchable reference and example views, and the caution that stays attached — one file a model executes and a reader browses.",
    canonical: "https://semtext.dev/showcase/skill/"

  @example ~S"""
  <sem-enhanced-document>
    <h1 data-kind="title">release-notes</h1>

    <agent>
      <name>release-notes skill</name>
      <bio>Drafts a dated work log from landed changes.</bio>
      <instructions>One line per landed change, newest first. Cite identifiers exactly as recorded; never invent them.</instructions>
    </agent>

    <sem-views id="release-notes">
      <sem-view name="Reference" active role="tabpanel">
        <sem-properties kind="arguments">
          <sem-property key="since" role="definition" aria-label="since">Date or tag to start the log from</sem-property>
          <sem-property key="--format" role="definition" aria-label="--format">log | announce — the output shape</sem-property>
        </sem-properties>
      </sem-view>
      <sem-view name="Example" role="tabpanel">
        <sem-code lang="markdown" filename="CHANGELOG.md" controls="copy,wrap">
  <pre><code>## 2026-10-14
  - otel meter scope fix (#73)
  - bump chart tag (#75)</code></pre>
        </sem-code>
      </sem-view>
    </sem-views>

    <sem-note variant="tip">The same file a model executes as the skill renders as these tabs.</sem-note>
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
    <ShowcaseFrame slug="skill" title="A skill file with its reference attached" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        A skill is instructions plus reference material, and the usual
        failure is drift between them. Here the instructions live in the{" "}
        <code class="font-mono">agent</code> record and the reference
        lives beside them as views — the same perspectives, switchable
        tabs, deep-linkable at{" "}
        <code class="font-mono">#release-notes/example</code>. Nothing
        is duplicated, so nothing drifts.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Render it and switch tabs — the bundle keeps the shown view in the
          URL, arrow keys rove the tab bar, and with scripts off every view
          stacks under its name.
        </p>
        <ExampleViewer cid="example-viewer" id="skill" label="skill example" filename="skill.md" caption="authored SemText" lines={@lines} renderable={true} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code class="font-mono">sem-view</code>{" "}
            <code class="font-mono">name</code> is unique per container —
            the tab identity is the authoring identity, in the URL too.
          </li>
          <li>
            View switching is presentation: extraction is unchanged by which
            tab is shown, so the model reads the whole skill every time.
          </li>
          <li>
            The listing keeps its source verbatim — the example output a
            model imitates is byte-identical to what a reader copies.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code class="font-mono">agent</code>,{" "}
        <code class="font-mono">sem-views</code>,{" "}
        <code class="font-mono">sem-properties</code>,{" "}
        <code class="font-mono">sem-code</code>. Their contracts live on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
