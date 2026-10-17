defmodule SemtextWeb.Hologram.Pages.ShowcaseOnboardingPage do
  @moduledoc """
  /showcase/onboarding/ — port of the Next site's
  `app/showcase/onboarding/page.tsx`: a status-annotated procedure, a
  completion meter and facts that double as flashcards — the checklist
  reads, and tracks itself.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/onboarding"

  layout SiteLayout,
    page_title: "Onboarding — SemText showcase",
    description:
      "An onboarding checklist in SemText: a status-annotated procedure, a completion meter and the facts a new contributor keeps — the checklist reads, and tracks itself.",
    canonical: "https://semtext.dev/showcase/onboarding/"

  @example ~S"""
  <sem-enhanced-document>
    <h1 data-kind="title">First week</h1>

    <sem-progress value="0.4" label="checklist" role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.4"></sem-progress>

    <sem-procedure kind="checklist" role="list">
      <sem-step role="listitem" status="done">Read the contributor guide</sem-step>
      <sem-step role="listitem" status="done">Get repository access</sem-step>
      <sem-step role="listitem" status="current">Ship a first change behind a feature branch</sem-step>
      <sem-step role="listitem">Pair on a review</sem-step>
      <sem-step role="listitem" status="blocked">Deploy shadowing — waits on the access audit</sem-step>
    </sem-procedure>

    <h2>Facts worth keeping</h2>
    <sem-facts view-as="flashcards" controls="shuffle">
      <sem-fact id="ob-branch" kind="concept">
        <statement>Where does feature work live?</statement>
        <conclusion>In a worktree under .claude/worktrees/, forked from develop.</conclusion>
      </sem-fact>
      <sem-fact id="ob-main" kind="invariant">
        <statement>Who merges to main?</statement>
        <conclusion>CI only — the release path is automated.</conclusion>
        <incorrect-statement>The latest reviewer merges it by hand.</incorrect-statement>
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
    <ShowcaseFrame slug="onboarding" title="Onboarding: a checklist that reads and tracks" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        Onboarding material decays fastest when it lives in three places:
        the checklist in a doc, the facts in a wiki, the quiz in a form. In
        one SemText document the procedure carries its statuses, the meter
        carries the score, and the facts double as flashcards — the same
        file the new contributor reads is the one a model can quiz them
        from.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Render it and flip the flashcards: front is the statement, back the
          conclusion, and the incorrect statement on{" "}
          <code class="font-mono">ob-main</code> joins the quiz options
          when the deck is switched to quiz view.
        </p>
        <ExampleViewer cid="example-viewer" id="onboarding" label="onboarding example" filename="onboarding.md" caption="authored SemText" lines={@lines} renderable={true} raw={@example} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code class="font-mono">sem-step</code> status is canonical —
            done / current / todo / blocked — and DOM order is the execution
            order, so the checklist cannot silently disagree with itself.
          </li>
          <li>
            <code class="font-mono">sem-progress</code> is one scalar
            assertion: <code class="font-mono">value</code> clamps to
            0..1 and the no-script tier renders the number, never a fake bar.
          </li>
          <li>
            An <code class="font-mono">incorrect-statement</code> is never
            extracted as a claim — it only ever plays the wrong answer.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code class="font-mono">sem-progress</code>,{" "}
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
