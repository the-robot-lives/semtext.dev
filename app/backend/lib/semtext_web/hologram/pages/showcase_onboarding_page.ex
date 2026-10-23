defmodule SemtextWeb.Hologram.Pages.ShowcaseOnboardingPage do
  @moduledoc """
  /showcase/onboarding/ — port of the Next site's
  `app/showcase/onboarding/page.tsx`: a status-annotated procedure, a
  completion meter and facts that double as flashcards — the checklist
  reads, and tracks itself.
  """

  use Hologram.Page

  alias Semtext.Reference.Tokenize
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/onboarding"

  layout SiteLayout,
    page_title: "Onboarding — SemText showcase",
    description:
      "An onboarding checklist in SemText: a status-annotated procedure, a completion meter and the facts a new contributor keeps — the checklist reads, and tracks itself.",
    canonical: "https://semtext.dev/showcase/onboarding/",
    # SEMTEX-013: the render pane boots through the island bridge (the one
    # documented imperative-DOM seam), which reference_assets loads. Without
    # it the pane hydrates markup only (site-chrome.js) and the flashcards
    # never upgrade — the exact break this ticket reports.
    reference_assets: true

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
    <sem-facts view-as="flashcards">
      <sem-fact id="ob-branch">
        <statement>Where does feature work live?</statement>
        <conclusion>In a worktree under .claude/worktrees/, forked from develop.</conclusion>
      </sem-fact>
      <sem-fact id="ob-main">
        <statement>Who merges to main?</statement>
        <conclusion>CI only — the release path is automated.</conclusion>
        <incorrect-statement>The latest reviewer merges it by hand.</incorrect-statement>
      </sem-fact>
    </sem-facts>
  </sem-enhanced-document>
  """

  # SEMTEX-013: the render pane's runtime spec — the same file set the Next
  # page's BUNDLES dedupe produces (semtext-lazy.js plus the sem-stubs and
  # sem-facts chunks; sem-progress/sem-procedure/sem-step ride sem-stubs,
  # sem-facts/sem-fact add sem-facts). The island bridge auto-boots panes
  # carrying data-sem-pane: html injects the authored markup, wire: true
  # attaches the flip/quiz handlers, lazy defers to the loader. Spec fields
  # mirror Semtext.Reference.Tags.viewer_spec/3 (kept literal here — the
  # onboarding document is not a schema tag, so it has no tag record).
  @viewer_spec_json Jason.encode!(%{
                      "renderable" => true,
                      "lazy" => true,
                      "classForm" => false,
                      "wire" => true,
                      "html" => @example,
                      "files" => [
                        %{"src" => "/semtext/semtext-lazy.js", "type" => "module"},
                        %{"src" => "/semtext/chunks/sem-stubs.js", "type" => "module"},
                        %{"src" => "/semtext/chunks/sem-facts.js", "type" => "module"}
                      ],
                      "themeCss" => [
                        "/semtext/themes/_vocabulary.css",
                        "/semtext/themes/minimal-tech-light.css"
                      ]
                    })

  # Prebuilt clipboard/download snippets (parity with the reference viewer's
  # Copy/Save chrome — built server-side so the client never needs Jason).
  @copy_js "navigator.clipboard.writeText(" <> Jason.encode!(@example) <> ")"

  @save_js "var b=new Blob([" <>
             Jason.encode!(@example) <>
             "],{type:\"text/html;charset=utf-8\"}),u=URL.createObjectURL(b),a=document.createElement(\"a\");" <>
             "a.href=u;a.download=\"onboarding.md\";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)"

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      # The island viewer tokenizes per line (shape %{n, toks}), unlike the
      # site viewer's numbered_lines — same scanner family, pane contract.
      lines: Tokenize.html_lines(@example),
      # raw source: template @example below is state, and the pane spec
      # carries it for the island's markup injection.
      example: @example,
      spec_json: @viewer_spec_json,
      copy_js: @copy_js,
      save_js: @save_js
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="onboarding" title="Onboarding: a checklist that reads and tracks" groups={@groups} sections={[%{id: "example", label: "The document"}]}>
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
        <ExampleViewer
          cid="onboarding-viewer"
          anchor="primary"
          lines={@lines}
          renderable={true}
          render_note=""
          spec_json={@spec_json}
          aria_label="Authored onboarding example"
          chrome_label="onboarding.md"
          filename="onboarding.md"
          copy_js={@copy_js}
          save_js={@save_js}
        />
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
