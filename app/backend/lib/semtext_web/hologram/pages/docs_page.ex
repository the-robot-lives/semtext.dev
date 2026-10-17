defmodule SemtextWeb.Hologram.Pages.DocsPage do
  @moduledoc """
  /docs/ — CLI + documentation guide, port of the Next site's
  `app/docs/page.tsx`: the getting-started intro, the CLI command
  reference (the search index's CLI list mirrors these sections) and the
  showcase sampler rendered as live `sem-properties`.

  The page loads the SemText bundle WITHOUT the off-switches
  (SiteLayout's load_semtext_bundle) so its DOMContentLoaded auto-wire
  enhances everything on the page, as upstream. The code windows here are
  plain `pre > code` figures (raw text, no tokenizer) exactly as
  upstream; the STUB / terminal / showcase-HTML strings are built
  server-side in init and interpolated escaped, which displays them
  verbatim (an interpolation inside <pre><code> renders the literal
  source, entities included, like a static export).
  """

  use Hologram.Page

  alias SemtextWeb.Docs.{NavGroups, Showcase}
  alias SemtextWeb.Hologram.Components.Site.DocsShell
  alias SemtextWeb.Hologram.Components.Site.Sem
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/docs"
  layout SiteLayout,
    page_title: "Docs — SemText",
    description: "SemText CLI and documentation: getting started, writing guides, and sample pages.",
    canonical: "https://semtext.dev/docs/",
    load_semtext_bundle: true

  # Verbatim from the Next page's STUB constant (attribute-for-attribute).
  @stub """
  <!doctype html>
  <html lang="en" data-sem-theme="minimal-tech-light">
  <head>
    <meta charset="utf-8" />
    <title>Auth notes</title>
    <link rel="stylesheet" href="https://cdn.semtext.dev/v0/semtext.css" />
    <link rel="stylesheet" href="https://cdn.semtext.dev/v0/semtext-theme-minimal-tech-light.css" />
    <script defer src="https://cdn.semtext.dev/v0/semtext.js"></script>
  </head>
  <body>
    <sem-enhanced-document>
      <h1 data-kind="title">Auth notes</h1>
      <sem-note variant="tip">Readable as plain text —
      the CDN tier makes it interactive.</sem-note>
      <sem-facts view-as="flashcards">
        <sem-fact id="f-rotate" kind="concept">
          <statement>Refresh tokens rotate per use</statement>
          <conclusion>Each exchange retires the
          previous token.</conclusion>
        </sem-fact>
      </sem-facts>
    </sem-enhanced-document>
  </body>
  </html>
  """

  # Verbatim from the Next page's first CLI code window (the demo document
  # these commands run against, kept as the integration sample above).
  @demo_doc "auth-notes.sem.html"

  # REAL CLI outputs, captured by running bin/semtext.mjs +
  # bin/semtext-validate.mjs from the spec repo (npl-enhanced-content)
  # against the auth-notes demo document. Thread 7b2969f9: never invent
  # output formats — regenerate these when the CLI changes.
  @view_output """
  $ semtext view auth-notes.sem.html
  sem-note (#tip-1): Refresh tokens rotate per use — each exchange retires the previous token.
    variant: tip
  sem-facts (#facts-1)
    sem-fact (#f-rotate kind=concept): Refresh tokens rotate per session :: Short-lived access tokens; the refresh grant issues a new pair.
      incorrectStatements: Store the token in localStorage for durability.
  """

  @outline_output """
  $ semtext outline auth-notes.sem.html
  - [top-h] section: Auth notes (2 nested)
    - [tip-1] sem-note: Refresh tokens rotate per use — each exchange retires the previous token.
    - [facts-1] sem-facts: sem-facts (1 nested)
      - [f-rotate] sem-fact: Refresh tokens rotate per session :: Short-lived access tokens; the refresh grant issues…
  """

  @filter_output """
  $ semtext filter auth-notes.sem.html --type sem-fact
  <sem-fact id="f-rotate" kind="concept">
        <statement>Refresh tokens rotate per session</statement>
        <conclusion>Short-lived access tokens; the refresh grant issues a new pair.</conclusion>
        <incorrect-statement>Store the token in localStorage for durability.</incorrect-statement>
      </sem-fact>
  """

  @expand_output """
  $ semtext expand auth-notes.sem.html f-rotate
  [f-rotate] sem-fact
  sem-fact (#f-rotate kind=concept): Refresh tokens rotate per session :: Short-lived access tokens; the refresh grant issues a new pair.
    incorrectStatements: Store the token in localStorage for durability.
  """

  @validate_output """
  $ semtext-validate auth-notes.sem.html
  1 file checked, 0 errors, 0 warnings
  """

  def stub_text, do: @stub
  def demo_doc, do: @demo_doc
  def view_output, do: @view_output
  def outline_output, do: @outline_output
  def filter_output, do: @filter_output
  def expand_output, do: @expand_output
  def validate_output, do: @validate_output

  def init(_params, component, _server) do
    # The Next page builds SHOWCASE_HTML in a module IIFE; same build here,
    # server-side in init. Verbatim row/keys: label, href, note.
    showcase_rows =
      for d <- Showcase.items() do
        where =
          if d.href do
            ~s(<a href="#{d.href}">#{d.label}</a>)
          else
            ~s(<span class="g-muted">#{d.label}</span>)
          end

        ~s(  <sem-property key="#{d.label}" role="definition">#{where} — #{d.note}</sem-property>)
      end

    showcase_html =
      "<sem-properties kind=\"showcase\">\n" <> Enum.join(showcase_rows, "\n") <> "\n</sem-properties>"

    put_state(component,
      groups: NavGroups.groups(),
      showcase_html: showcase_html,
      sections: [
        %{id: "cli-commands", label: "CLI commands"},
        %{id: "showcase", label: "Showcase pages"}
      ]
    )
  end

  def template do
    ~HOLO"""
    <DocsShell active="cli" groups={@groups} sections={@sections} examples={[]}>
      <main id="main">
        <p class="g-eyebrow">Guides</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Documentation
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          A SemText document is one XHTML file. Ship it with
          <code class="font-mono">semtext.css</code> and a small script —
          plus an optional theme — and the same file a model reads becomes
          working web components — no build step, no framework, nothing
          compiled. SemText ships as a CLI and as component bundles. Author
          documents as plain XHTML, then read them in the browser, the
          terminal, or render them for distribution to agents. Want to try
          one right now?{" "}
          <a
            class="text-violet-soft underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
            href="/editor/"
          >
            Open the editor →
          </a>
        </p>

        <section id="cli-commands" aria-labelledby="cli-commands-h" class="mt-14 scroll-mt-24">
          <h2 id="cli-commands-h" class="text-2xl font-semibold tracking-tight text-ink">
            CLI commands
          </h2>
          <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            The <code class="font-mono">semtext</code> command-line tool
            reads and renders SemText documents. Every command operates on local
            files and produces local output — no network, no API key, no cloud.
          </p>

          <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            Author your document as XHTML using the SemText vocabulary — any
            tool that writes HTML can write it. Then load
            <code class="font-mono">semtext.css</code> and
            <code class="font-mono">semtext.js</code>, plus an optional
            theme. That is the whole integration:
          </p>

          <figure class="code-window mt-6" aria-label="A minimal SemText page">
            <div class="code-chrome">
              <span class="dot live" aria-hidden="true" />
              <span class="dot" aria-hidden="true" />
              <span class="dot" aria-hidden="true" />
              <span>semtext.html</span>
            </div>
            <pre><code>{stub_text()}</code></pre>
          </figure>
          <p class="mt-3 font-mono text-xs leading-5 text-ink-faint">
            cdn.semtext.dev is the planned CDN origin; today the same three
            files ship in the spec repo's dist/ — and in this site's
            public/semtext/, which the examples on
            <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
              /reference/
            </a>
            render with.
          </p>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext view — read a document
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Prints the whole document as plain text in the terminal: every
            record with its id and attributes, readable from a buffer or a
            pipe.
          </p>

          <figure class="code-window mt-4" aria-label="The semtext view command">
            <div class="code-chrome">
              <span class="dot live" aria-hidden="true" />
              <span class="font-mono">terminal</span>
            </div>
            <pre><code>{view_output()}</code></pre>
          </figure>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext outline — the block tree
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Prints the document's structure: one line per block with its
            stable id in brackets. Use <code class="font-mono">--depth N</code>{" "}
            to trim nesting, or <code class="font-mono">--json</code> for
            machine-readable output.
          </p>

          <figure class="code-window mt-4" aria-label="The semtext outline command">
            <div class="code-chrome">
              <span class="dot live" aria-hidden="true" />
              <span class="font-mono">terminal</span>
            </div>
            <pre><code>{outline_output()}</code></pre>
          </figure>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext filter — select records
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Prints matching blocks as normalised XHTML. Filter by record type
            (<code class="font-mono">--type</code>), attribute
            (<code class="font-mono">--attr</code>), text
            (<code class="font-mono">--text</code>), id, kind, tag, audience
            or CSS selector — criteria combine with AND. Add
            <code class="font-mono"> --json</code> for structured output your
            tools can consume.
          </p>

          <figure class="code-window mt-4" aria-label="The semtext filter command">
            <div class="code-chrome">
              <span class="dot live" aria-hidden="true" />
              <span class="font-mono">terminal</span>
            </div>
            <pre><code>{filter_output()}</code></pre>
          </figure>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext expand — one block in full
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Loads a single block by the id the outline printed — the
            on-demand counterpart to a collapsed outline or a filtered
            result.
          </p>

          <figure class="code-window mt-4" aria-label="The semtext expand command">
            <div class="code-chrome">
              <span class="dot live" aria-hidden="true" />
              <span class="font-mono">terminal</span>
            </div>
            <pre><code>{expand_output()}</code></pre>
          </figure>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext format — normalise a document
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Rewrites the document in its normal form — <code class="font-mono">--text</code>{" "}
            prints the plain-text form instead, <code class="font-mono">--json</code>{" "}
            the machine-readable one. Same output shape as
            <code class="font-mono"> view</code>, normalised.
          </p>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext tui — interactive terminal
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Opens an interactive terminal UI for browsing the document:
            arrows or j/k move, Enter expands or collapses a block,
            <code class="font-mono"> / </code>searches,
            <code class="font-mono"> r </code>shows the raw source. No
            dependencies, runs in your shell.
          </p>
          <p class="mt-2 text-sm text-ink-faint">
            Usage: <code class="font-mono">semtext tui auth-notes.sem.html</code>
          </p>

          <h3 class="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext-validate — check a document
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Validates documents against the spec schema and reports unknown
            elements, bad nesting and schema violations per line. Accepts
            multiple files or globs; exits 0 when everything is clean.
          </p>

          <figure class="code-window mt-4" aria-label="The semtext-validate command">
            <div class="code-chrome">
              <span class="dot live" aria-hidden="true" />
              <span class="font-mono">terminal</span>
            </div>
            <pre><code>{validate_output()}</code></pre>
          </figure>

          <p class="mt-3 font-mono text-xs leading-5 text-ink-faint">
            The CLI ships in the spec repo (npl-enhanced-content):
            <code class="font-mono">semtext</code>,
            <code class="font-mono">semtext-validate</code> and the
            <code class="font-mono">semtext-agent</code> toolkit (search,
            write, edit) — installed with
            <code class="font-mono"> npm install npl-enhanced-content</code>.
          </p>
        </section>

        <section id="showcase" aria-labelledby="showcase-h" class="mt-14 scroll-mt-24 border-t border-white/10 pt-10">
          <h2 id="showcase-h" class="text-2xl font-semibold tracking-tight text-ink">
            Showcase pages
          </h2>
          <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            Live pages on the showcase site where you can see each SemText
            feature in the browser. Each page is a real SemText document,
            running the full fallback and reading bundle.
          </p>
          <Sem class="mt-4 flex max-w-3xl flex-col gap-3" html={@showcase_html} />
        </section>
      </main>
    </DocsShell>
    """
  end
end
