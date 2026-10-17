defmodule SemtextWeb.Hologram.Pages.HomePage do
  @moduledoc """
  `/` — port of the Next.js landing page (`web/app/page.tsx`).

  Sections: hero (with HeroWindow), try (TryViews), reading, quick start
  (CodeViewer + ThemeGenerator), surface, scope, addons (AddonsCarousel),
  extend. The tiers section is omitted upstream-disabled (SHOW_TIERS false,
  user 2026-10-14) and is not rendered here.

  The Scope/Extend Sem blocks ship their authored markup verbatim via
  `{%raw}` (real DOM after SSR, exactly like the Next.js `Sem(html=…)`,
  so the fallback bundle wires them once loaded); `window.__semJsOff` and
  the deferred bundles are the layout's job — the page ships no scripts.

  Data tables (glossary, chronology, references, artifacts, showcase menu,
  integrations) hydrate as serialized state; the small helpers used by the
  template (chrono dot / suffix) stay inside the transpilable subset.
  Deviations (lane report): inline `<code>` styling inside the data-table
  strings is flattened to plain text (no slot markup in v1); the reading
  section's sem-reader/audience prose is verbatim text.
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Components.Landing.AddonsCarousel
  alias SemtextWeb.Hologram.Components.Landing.CodeViewer
  alias SemtextWeb.Hologram.Components.Landing.HeroWindow
  alias SemtextWeb.Hologram.Components.Landing.ThemeGenerator
  alias SemtextWeb.Hologram.Components.Landing.TryViews
  alias SemtextWeb.Hologram.Layouts.LandingLayout

  @repo "https://github.com/noizu-labs-ml/npl-enhanced-content"
  @spec_url @repo <> "/blob/develop/spec"

  route "/"
  layout LandingLayout

  # -- data (verbatim from page.tsx / docs-shell.tsx) ---------------------

  @glossary [
    %{
      term: "record",
      def:
        "One entry in the array extraction returns: a type, an id, qualifiers, a payload of fields, and one line of text."
    },
    %{
      term: "tier",
      def:
        "Which script, if any, is driving the document: none (CSS only), the fallback bundle, or the Lit components."
    },
    %{
      term: "tier marker",
      def:
        "The data-sem-fallback or data-sem-upgraded attribute a script sets on what it wired; every hide rule is gated on one of them."
    }
  ]

  @chronology [
    %{
      when: "Jan 2026",
      what: "Format spec v0 and the Tier-0 schemas.",
      status: "done"
    },
    %{
      when: "Mar 2026",
      what: "Fallback tier, extraction contract, scripts-stripped artifact.",
      status: "done"
    },
    %{
      when: "Sep 2026",
      what: "Reading experience: foundations, then the prose elements on this page.",
      status: "current"
    },
    %{
      when: "2026 Q4",
      what: "Theme pipeline and the reader chrome.",
      status: nil
    }
  ]

  @references [
    %{
      cite: "extraction.md §5",
      href: @spec_url <> "/extraction.md",
      text:
        "The central invariant: extraction output is identical whether or not JS ran, under any view, and after any interaction."
    },
    %{
      cite: "sem-references.md",
      href: @spec_url <> "/schema/sem-references.md",
      text:
        "In print, a reference's URL appears after its text — inside the references block only, never at the citation."
    }
  ]

  @artifacts [
    %{
      key: "semtext.js",
      desc:
        "One bundle: Lit 3 components, reading chrome and the Markdown renderer · global SemText"
    },
    %{
      key: "semtext.css",
      desc: "Structure for the sem-* classes. Reads --sem-* tokens, declares none."
    },
    %{
      key: "semtext-theme-<name>.css",
      desc:
        "Optional. Token values only, plus a dark-mode block. A new theme is a copy with new values."
    }
  ]

  @showcase_items [
    %{
      label: "CLAUDE.md",
      href: "/showcase/claude-md/",
      note: "repo guidance one file serves to an agent and to a human"
    },
    %{
      label: "Documentation",
      href: "/showcase/documentation/",
      note: "long-form docs with callouts, listings and citations"
    },
    %{
      label: "Onboarding",
      href: "/showcase/onboarding/",
      note: "a checklist that tracks itself — steps, progress, facts"
    },
    %{
      label: "Agent",
      href: "/showcase/agent/",
      note: "an agent record and the facts it answers from"
    },
    %{
      label: "Command",
      href: "/showcase/command/",
      note: "a command spec: arguments, steps, invariants"
    },
    %{
      label: "Skill",
      href: "/showcase/skill/",
      note: "a skill file with tabbed reference and examples"
    },
    %{
      label: "Data viewer",
      href: "/showcase/data-viewer/",
      note: "sort and filter a table authored in the document"
    },
    %{
      label: "Embedding",
      href: "/showcase/embedding/",
      note: "reuse one document's sections inside another"
    },
    %{
      label: "sem-shell",
      href: "/showcase/sem-shell/",
      note: "the interactive terminal element over a virtual file system"
    }
  ]

  @integrations [
    %{
      label: "The Robot Learns",
      href: "https://therobotlearns.com",
      note: "live app; courses as SemText with per-user quiz tracking is the planned add-on",
      planned: true
    },
    %{
      label: "The Robot Plans",
      href: "https://therobotplans.com",
      note: "live app; issue submission into Jira, ClickUp or GitHub is the planned add-on",
      planned: true
    },
    %{
      label: "The Robot Knows",
      href: "https://therobotknows.com",
      note: "live app; the knowledge-base hookup is the planned add-on",
      planned: true
    },
    %{
      label: "Draftamo",
      href: "https://draftamo.com",
      note:
        "live app; mockups and UML renders from hosted projects or local XML is the planned add-on",
      planned: true
    }
  ]

  # -- Sem blocks (authored markup, injected verbatim) --------------------

  @scope_notes """
  <sem-note variant="info">SemText is a markup vocabulary, two stylesheets and one script. It is not a CMS, a site generator or an application framework, and it has no opinion about how you produce the HTML.</sem-note>
  <sem-note variant="warning">A new version should not break markup authored against an older one. New elements and attributes land alongside the ones a document already uses — never swapped out from under it — so a file authored today keeps rendering as the vocabulary grows. Pin a version when you ship.</sem-note>
  <sem-note variant="tip">Nothing in the SemText bundle is React, and none is planned. Lit 3 is the only runtime dependency, and it is optional — the fallback tier has none.</sem-note>
  """

  @scope_qa """
  <sem-reveal summary="Why not Markdown?" collapsed>Markdown has nowhere to put the attributes that make a datum machine-readable — no way to mark a conclusion as distinct from a distractor, or a step as blocked. A converter that compiles Markdown into SemText is worth building; the canonical artifact stays XHTML, because that is what the browser, the terminal and the model all read.</sem-reveal>
  <sem-reveal summary="Does a language model really need this?" collapsed>A model can read any HTML. What it cannot do reliably is tell a conclusion from a distractor, or a caveat from a heading, when nothing in the markup says so. The claim here is narrow: the attributes remove that guesswork, and the extraction contract makes the result stable enough to cite.</sem-reveal>
  <sem-reveal summary="Is anyone using it?" collapsed>Noizu Labs, Inc. and The Robot Lives use SemText internally — agent-facing docs and demo documents are authored in it. SemText is a published spec with a reference implementation; there are no third-party deployments to point at and no benchmarks to quote.</sem-reveal>
  """

  @extend_html """
  <sem-note variant="info">The vocabulary is open at the edges: an organisation can define its own elements for what its documents say over and over — a runbook step type, a compliance datum, a product fact.</sem-note>
  <sem-note variant="warning">The submission flow below is planned, not shipped — nothing here clicks yet. Custom elements are Lit components with a vocabulary entry, and the AI submission tool assembles both.</sem-note>
  <sem-procedure kind="submission" role="list">
    <sem-step role="listitem" status="todo">Describe the element to the submission agent — a name, what it means, one example.</sem-step>
    <sem-step role="listitem" status="todo">The agent drafts the vocabulary entry and builds the Lit component.</sem-step>
    <sem-step role="listitem" status="todo">Review the render, then submit — the component ships in your org's bundle with its submission flow attached.</sem-step>
  </sem-procedure>
  """

  # -- marked-lines listing (reading · Code) ------------------------------

  @g_head """
  <p>Rotate per use<a href="#r-rfc">[1]</a>.</p>
  <sem-references id="refs" kind="bibliography" role="list">
  """

  @g_mark """
    <sem-reference id="r-rfc" role="listitem"
         href="https://www.rfc-editor.org/rfc/rfc6749" cite="RFC 6749">The OAuth 2.0 Authorization Framework, §10.4.</sem-reference>
  """

  @g_tail """
  </sem-references>
  """

  def init(_params, component, _server) do
    put_state(component,
      glossary: @glossary,
      chronology: @chronology,
      references: @references,
      artifacts: @artifacts,
      showcase_items: @showcase_items,
      integrations: @integrations,
      g_head: @g_head,
      g_mark: @g_mark,
      g_tail: @g_tail
    )
  end

  def template do
    ~HOLO"""
    <main id="main">
      <section class="border-b border-white/10">
        <div class="mx-auto grid max-w-docs grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:py-16">
          <div>
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">a semantic text format</p>
            <h1 class="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">One XHTML file,<br />in place of Markdown.</h1>
            <p class="mt-5 max-w-md text-base leading-relaxed text-ink-mute sm:text-lg">SemText is a semantic text format: a single XHTML file that a language model reads and writes the way it writes Markdown today. The difference is what the text can say. A fact, a step, a caveat, an incorrect statement, a term and its definition are each written as what they <em>are</em> — a tag and a few attributes — so the structure is in the text itself, not inferred from it.</p>
            <p class="mt-4 max-w-md text-base leading-relaxed text-ink-mute">Read it as-is. A model, a diff, a terminal, or an editor shows readable text in document order, with every qualifier spelled out next to the thing it qualifies. Nothing has to run first.</p>
            <p class="mt-4 max-w-md text-base leading-relaxed text-ink-mute">Open it in a browser and the same markup becomes working web components: flashcards flip, quizzes score, tabs switch, code copies, terms preview, and a reader bar tracks the outline. All of it works from a double-clicked file in any current browser, and none of it changes the text the model wrote.</p>
            <div class="mt-8 flex flex-wrap items-center gap-3">
              <a href="#try" class="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110">See it work</a>
              <a href="/reference/" class="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft">Browse the reference</a>
              <a href="#start" class="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft">Get started</a>
            </div>
          </div>
          <HeroWindow cid="hero_window" />
        </div>
      </section>

      <section id="try" aria-labelledby="try-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">The idea, in one control</p>
            <h2 id="try-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Switch the view. The content does not change.</h2>
            <p class="mt-3 leading-relaxed text-ink-mute">These four facts are authored once, as <code class="font-mono">&lt;sem-fact&gt;</code> elements holding a <code class="font-mono">&lt;statement&gt;</code>, a <code class="font-mono">&lt;conclusion&gt;</code> and a <code class="font-mono">&lt;incorrect-statement&gt;</code>. <code class="font-mono">view-as</code> on the <code class="font-mono">&lt;sem-facts&gt;</code> element selects how they render — switching it rewrites nothing, and the records a machine reads are the same in every view. One file, three readers:</p>
            <ul role="list" class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-relaxed text-ink-mute">
              <li><code class="font-mono text-violet-soft">semtext.html</code> — the in-browser render: double-click the file and it runs.</li>
              <li><code class="font-mono text-violet-soft">semtext tui</code> — the same file in an interactive terminal for people: navigate sections, flip flashcards, run quizzes.</li>
              <li><code class="font-mono text-violet-soft">semtext --render</code> — plain text for agents: collapsed sections expand on demand, embeds load, and the file arrives as its own summary.</li>
            </ul>
          </div>
          <div class="mt-8">
            <TryViews cid="try_views" />
            <p class="mt-3 text-sm text-ink-mute">The browser pane renders <code class="font-mono">demo/example-deck.sem.html</code> itself — the same file double-clicking opens. The shell panes type their first commands once the shell bundle lands. More sample documents sit in the <a href="#scope" class="text-violet-soft underline-offset-4 hover:underline">showcase menu</a> below.</p>
          </div>
        </div>
      </section>

      <section id="reading" aria-labelledby="reading-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">Reading</p>
            <h2 id="reading-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Long-form documents, with the reading affordances left in.</h2>
            <p class="mt-3 leading-relaxed text-ink-mute">The recall elements above are one use of the vocabulary. Most documents are read, not drilled, so it also carries what a long document needs: a glossary whose terms preview on hover, references with backlinks, a dated chronology, listings with provenance, notes that can float in the margin, content addressed to a named audience, and links that reach into closed disclosures. The examples below are the real content; the live affordances — hover previews, sorting, the reader bar — run on the <a href="/#reading" class="text-violet-soft underline-offset-4 hover:underline">showcase</a>.</p>
          </div>
          <div class="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h3 class="text-xl font-semibold tracking-tight text-ink">Glossary</h3>
              <p class="mt-2 leading-relaxed text-ink-mute">A <code class="font-mono">sem-properties</code> block with <code class="font-mono">view-as="glossary"</code>. Each property carries an <code class="font-mono">id</code>; a term in prose is a plain anchor to it. With scripts off, the link simply jumps to the definition; the reading bundle adds a preview on hover or focus.</p>
              <dl class="mt-4 divide-y divide-white/5 border-y border-white/5">
                {%for item <- @glossary}
                  <div class="py-3">
                    <dt class="font-mono text-sm text-violet-soft">{item.term}</dt>
                    <dd class="mt-1 text-sm leading-relaxed text-ink-mute">{item.def}</dd>
                  </div>
                {/for}
              </dl>
              <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">Chronology</h3>
              <p class="mt-2 leading-relaxed text-ink-mute"><code class="font-mono">sem-chronology</code> is CSS only: a list of <code class="font-mono">sem-event</code> items in chronological order, each with a <code class="font-mono">when</code> and an optional <code class="font-mono">status</code>. Extraction gives each event a positional ordinal.</p>
              <ol class="mt-4 border-l border-code-border pl-4">
                {%for item <- @chronology}
                  <li class="relative pb-4">
                    <span class={chrono_dot_class(item.status)} aria-hidden="true"></span>
                    <p class="font-mono text-xs text-ink-faint">{item.when}{when_suffix(item.status)}</p>
                    <p class="mt-0.5 text-sm leading-relaxed text-ink-mute">{item.what}</p>
                  </li>
                {/for}
              </ol>
              <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">Audience</h3>
              <p class="mt-2 leading-relaxed text-ink-mute">A <code class="font-mono">sem-audiences</code> block declares the profiles a document knows; any element may carry <code class="font-mono">audience</code>. Nothing is removed — content for a profile is hidden until a reader claims it, and extraction never consults visibility, so a filtered document still extracts whole.</p>
              <div class="mt-4 flex flex-col gap-3">
                <aside class="rounded-xl border border-amber-400/40 bg-amber-400/5 px-5 py-4">
                  <p class="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-faint">sem-note · warning</p>
                  <div class="mt-2 leading-relaxed text-ink-mute">Operators only: an operator implies reader, so this profile sees every reader note as well.</div>
                </aside>
                <aside class="rounded-xl border border-sky-400/40 bg-sky-400/5 px-5 py-4">
                  <p class="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-faint">sem-note · info</p>
                  <div class="mt-2 leading-relaxed text-ink-mute">Readers and operators: profiles are claimed from the reader bar; this note is addressed to both.</div>
                </aside>
                <aside class="rounded-xl border border-violet-soft/40 bg-violet/10 px-5 py-4">
                  <p class="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-faint">sem-note · tip</p>
                  <div class="mt-2 leading-relaxed text-ink-mute">Everyone except operators: a negated spec shows by default and hides once the excluded profile is active.</div>
                </aside>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold tracking-tight text-ink">Code</h3>
              <p class="mt-2 leading-relaxed text-ink-mute"><code class="font-mono">sem-code</code> carries what a listing cannot: a filename, a language and a set of marked lines. The listing is written directly inside the element — it becomes a <code class="font-mono">&lt;pre&gt;&lt;code&gt;</code> when the reading bundle runs — stays byte-identical, and extraction reports it verbatim.</p>
              <figure class="code-window mt-4" aria-label="A source listing of a sem-references block: a citation in prose and the reference entry it points to">
                <div class="code-chrome">
                  <span class="dot live" aria-hidden="true"></span>
                  <span>doc.html</span>
                </div>
                <pre><code>{@g_head}{@g_mark}{@g_tail}</code></pre>
              </figure>
              <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">Reader</h3>
              <p class="mt-2 leading-relaxed text-ink-mute"><code class="font-mono">sem-reader</code> is the bar pinned to the top of the showcase page: one per document, a direct child of the root wrapper, mints nothing. Its outline is generated from the headings, <code class="font-mono">h2</code> on down. Focus, type size, face and colour scheme are attributes on <code class="font-mono">&lt;html&gt;</code> that the vocabulary CSS keys on, remembered in <code class="font-mono">localStorage</code> when the browser allows it.</p>
              <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">Source, Markdown, tables</h3>
              <p class="mt-2 leading-relaxed text-ink-mute"><code class="font-mono">sem-source</code> lets a reader flip a section between the rendered result and the markup that produced it. <code class="font-mono">sem-md</code> holds Markdown as its text and renders it in the browser — tables above all. <code class="font-mono">sem-table</code> wraps an authored <code class="font-mono">&lt;table&gt;</code> and adds sort and filter; there is no JSON payload — the markup is the data. All three run live on the <a href="/#reading" class="text-violet-soft underline-offset-4 hover:underline">showcase</a>.</p>
              <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">References</h3>
              <p class="mt-2 leading-relaxed text-ink-mute"><code class="font-mono">sem-references</code> numbers its entries with a CSS counter in every tier. Citations in prose are plain anchors; the reading bundle adds a preview on each, a backlink per citation, and an external link where an entry has an <code class="font-mono">href</code>.</p>
              <ol class="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-mute">
                {%for item <- @references}
                  <li>{item.text} <a href={item.href} class="font-mono text-xs text-violet-soft underline-offset-4 hover:underline">{item.cite}</a></li>
                {/for}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="start" aria-labelledby="start-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">Quick start</p>
            <h2 id="start-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">What you actually write.</h2>
            <p class="mt-3 leading-relaxed text-ink-mute">A SemText document is an HTML file. The vocabulary is custom elements with plain attributes — <code class="font-mono text-violet-soft">&lt;sem-facts view-as="flashcards"&gt;</code>, <code class="font-mono text-violet-soft">&lt;sem-step status="done"&gt;</code> — so any editor, template language or generator that emits HTML can write one, and the browser parses it with or without a script.</p>
          </div>
          <div class="mt-8">
            <CodeViewer cid="code_viewer" />
          </div>
          <p class="mt-3 max-w-2xl text-sm text-ink-mute">Save it, double-click it. That is the whole workflow. Written the older way — <code class="font-mono">&lt;div class="sem-note" data-variant="warning"&gt;</code> — it renders and extracts the same; that spelling is the compatibility alias, documented once in the spec's Appendix A. The <code class="font-mono">cdn.semtext.dev</code> links are the planned origin; today the same files ship in the <a href={"https://github.com/noizu-labs-ml/npl-enhanced-content"} class="text-violet-soft underline-offset-4 hover:underline">spec repo</a>.</p>
          <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">Adding it to a project</h3>
          <ol class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li class="rounded-xl border border-code-border bg-slateink-lift p-4 text-sm leading-relaxed text-ink-mute"><span class="mr-2 font-mono text-xs text-violet-soft">01</span>Copy <code class="font-mono">semtext.css</code> — and, if you want a theme, <code class="font-mono">semtext-theme-&lt;name&gt;.css</code> — next to your document, and set <code class="font-mono">data-sem-theme</code> on <code class="font-mono">&lt;html&gt;</code> to that theme's name.</li>
            <li class="rounded-xl border border-code-border bg-slateink-lift p-4 text-sm leading-relaxed text-ink-mute"><span class="mr-2 font-mono text-xs text-violet-soft">02</span>Add <code class="font-mono">semtext.js</code>. Link it, or paste it inline for a document you intend to send as a single file.</li>
            <li class="rounded-xl border border-code-border bg-slateink-lift p-4 text-sm leading-relaxed text-ink-mute"><span class="mr-2 font-mono text-xs text-violet-soft">03</span>Write the content with <code class="font-mono">sem-*</code> elements where interactivity or machine-readability pays. Ordinary HTML stays ordinary HTML.</li>
          </ol>
          <ThemeGenerator cid="theme_generator" />
        </div>
      </section>

      <section id="surface" aria-labelledby="surface-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">Surface</p>
            <h2 id="surface-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Everything that ships.</h2>
            <p class="mt-3 leading-relaxed text-ink-mute">One script and one stylesheet, plus an optional theme file. Everything a document needs rides in the single <code class="font-mono">semtext.js</code> — the components, the reading chrome and the Markdown renderer — so there is no build step and nothing else to link.</p>
          </div>
          <dl class="mt-8 divide-y divide-white/5 border-y border-white/5">
            {%for item <- @artifacts}
              <div class="grid gap-1 py-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4">
                <dt class="font-mono text-sm text-violet-soft">{item.key}</dt>
                <dd class="text-sm leading-relaxed text-ink-mute">{item.desc}</dd>
              </div>
            {/for}
          </dl>
          <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">The vocabulary</h3>
          <p class="mt-2 max-w-3xl leading-relaxed text-ink-mute">Twenty-one element types mint records: <code class="font-mono">sem-agent</code>, <code class="font-mono">sem-note</code>, <code class="font-mono">sem-facts</code> and <code class="font-mono">sem-fact</code>, <code class="font-mono">sem-details</code> and <code class="font-mono">sem-detail</code>, <code class="font-mono">sem-procedure</code> and <code class="font-mono">sem-step</code>, <code class="font-mono">sem-properties</code> and <code class="font-mono">sem-property</code>, <code class="font-mono">sem-views</code> and <code class="font-mono">sem-view</code>, <code class="font-mono">sem-reveal</code>, <code class="font-mono">sem-progress</code>, <code class="font-mono">sem-chronology</code> and <code class="font-mono">sem-event</code>, <code class="font-mono">sem-code</code>, <code class="font-mono">sem-references</code> and <code class="font-mono">sem-reference</code>, <code class="font-mono">sem-table</code> and <code class="font-mono">sem-md</code>. <code class="font-mono">sem-reader</code> is chrome and mints nothing.</p>
          <p class="mt-3 text-sm text-ink-mute">Browse all of them — purpose, options, and the authored markup — in the <a href="/reference/" class="font-mono text-violet-soft underline-offset-4 hover:underline">tag reference</a>.</p>
          <p class="mt-8 text-sm text-ink-mute">A <code class="font-mono">sem-agent</code> block is document-level metadata aimed at a model, carried by the same file a person is reading. It is inert to a browser and it is a record to an extractor.</p>
        </div>
      </section>

      <section id="scope" aria-labelledby="scope-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">Scope</p>
            <h2 id="scope-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">What it is not.</h2>
            <p class="mt-3 leading-relaxed text-ink-mute">SemText ends at the document: no build step, no service, no install. The limits below are the design, not the gaps.</p>
          </div>
          <div class="mt-8 flex max-w-3xl flex-col gap-3" data-sem-theme="minimal-tech-light" data-color-mode="dark">
            {%raw}<sem-note variant="info">SemText is a markup vocabulary, two stylesheets and one script. It is not a CMS, a site generator or an application framework, and it has no opinion about how you produce the HTML.</sem-note>
    <sem-note variant="warning">A new version should not break markup authored against an older one. New elements and attributes land alongside the ones a document already uses — never swapped out from under it — so a file authored today keeps rendering as the vocabulary grows. Pin a version when you ship.</sem-note>
    <sem-note variant="tip">Nothing in the SemText bundle is React, and none is planned. Lit 3 is the only runtime dependency, and it is optional — the fallback tier has none.</sem-note>{/raw}
          </div>
          <h3 class="mt-10 text-xl font-semibold tracking-tight text-ink">The obvious questions</h3>
          <div class="mt-4 flex max-w-3xl flex-col gap-3" data-sem-theme="minimal-tech-light" data-color-mode="dark">
            {%raw}<sem-reveal summary="Why not Markdown?" collapsed>Markdown has nowhere to put the attributes that make a datum machine-readable — no way to mark a conclusion as distinct from a distractor, or a step as blocked. A converter that compiles Markdown into SemText is worth building; the canonical artifact stays XHTML, because that is what the browser, the terminal and the model all read.</sem-reveal>
    <sem-reveal summary="Does a language model really need this?" collapsed>A model can read any HTML. What it cannot do reliably is tell a conclusion from a distractor, or a caveat from a heading, when nothing in the markup says so. The claim here is narrow: the attributes remove that guesswork, and the extraction contract makes the result stable enough to cite.</sem-reveal>
    <sem-reveal summary="Is anyone using it?" collapsed>Noizu Labs, Inc. and The Robot Lives use SemText internally — agent-facing docs and demo documents are authored in it. SemText is a published spec with a reference implementation; there are no third-party deployments to point at and no benchmarks to quote.</sem-reveal>{/raw}
          </div>
          <div class="mt-14 flex flex-wrap items-center gap-3">
            <details class="showcase-menu">
              <summary class="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 bg-violet px-5 py-2 text-sm font-semibold text-white marker:hidden hover:brightness-110">Open the showcase<span aria-hidden="true" class="text-xs">▾</span></summary>
              <div class="showcase-menu-panel">
                <p class="g-nav-title">Showcase</p>
                <ul class="mt-2 flex flex-col gap-1.5" role="list">
                  {%for item <- @showcase_items}
                    <li class="text-sm leading-6">
                      {%if item.href}
                        <a href={item.href} class="font-mono text-violet-soft underline-offset-4 hover:underline">{item.label}</a>
                      {%else}
                        <span class="font-mono text-ink-faint">{item.label}</span>
                      {/if}
                      <span class="text-ink-mute"> — {item.note}</span>
                    </li>
                  {/for}
                </ul>
                <p class="g-nav-title mt-5">Integrations</p>
                <ul class="mt-2 flex flex-col gap-1.5" role="list">
                  {%for item <- @integrations}
                    <li class="text-sm leading-6">
                      {%if item.href}
                        <a href={item.href} class="font-mono text-violet-soft underline-offset-4 hover:underline">{item.label}</a>
                      {%else}
                        <span class="font-mono text-ink-faint">{item.label}</span>
                      {/if}
                      <span class="text-ink-mute"> — {item.note}</span>
                      {%if item.planned}
                        <b class="g-status">planned</b>
                      {/if}
                    </li>
                  {/for}
                </ul>
              </div>
            </details>
            <a href="/reference/" class="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft">Browse the reference</a>
            <span class="font-mono text-xs text-ink-faint">every tag, from the spec</span>
          </div>
        </div>
      </section>

      <section id="addons" aria-labelledby="addons-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">Integrations</p>
            <h2 id="addons-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Documents that do more than read.</h2>
            <p class="mt-4 leading-relaxed text-ink-mute">The reading and extraction core is free and static. Integrations connect a document to live systems — tickets and knowledge-base answers cited inline, quizzes and courses readers work through, mockups and UML rendered in place. Each is wired to its real logic as it is built, and none change how a document reads.</p>
          </div>
          <AddonsCarousel cid="addons_carousel" />
          <div class="mt-8">
            <a href="/integrations" class="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft">More integrations<span aria-hidden="true" class="ml-2">→</span></a>
          </div>
        </div>
      </section>

      <section id="extend" aria-labelledby="extend-h" class="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20">
        <div class="mx-auto max-w-docs">
          <div class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">Extend</p>
            <h2 id="extend-h" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Extend the vocabulary.</h2>
            <p class="mt-4 leading-relaxed text-ink-mute">Org-specific components, and a submission tool where you talk an element into existence: the agent drafts the vocabulary entry, builds the Lit component, and wires the submission flow.</p>
          </div>
          <div class="mt-8 flex max-w-3xl flex-col gap-4" data-sem-theme="minimal-tech-light" data-color-mode="dark">
            {%raw}<sem-note variant="info">The vocabulary is open at the edges: an organisation can define its own elements for what its documents say over and over — a runbook step type, a compliance datum, a product fact.</sem-note>
    <sem-note variant="warning">The submission flow below is planned, not shipped — nothing here clicks yet. Custom elements are Lit components with a vocabulary entry, and the AI submission tool assembles both.</sem-note>
    <sem-procedure kind="submission" role="list">
    <sem-step role="listitem" status="todo">Describe the element to the submission agent — a name, what it means, one example.</sem-step>
    <sem-step role="listitem" status="todo">The agent drafts the vocabulary entry and builds the Lit component.</sem-step>
    <sem-step role="listitem" status="todo">Review the render, then submit — the component ships in your org's bundle with its submission flow attached.</sem-step>
    </sem-procedure>{/raw}
          </div>
        </div>
      </section>
    </main>
    """
  end

  # Chronology dot: current events glow violet-soft, others stay code-border.
  defp chrono_dot_class("current") do
    "absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full bg-violet-soft shadow-[0_0_8px_var(--accent-soft)]"
  end

  defp chrono_dot_class(_) do
    "absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full bg-code-border"
  end

  defp when_suffix("current"), do: " · current"
  defp when_suffix("done"), do: " · done"
  defp when_suffix(_), do: ""
end
