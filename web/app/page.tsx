import { HeroWindow } from "@/components/hero-window";
import { TryViews } from "@/components/try-views";
import { CodeViewer } from "@/components/code-viewer";
import { ThemeGenerator } from "@/components/theme-generator";
import { AddonsCarousel } from "@/components/addons-carousel";
import { Sem, SHOWCASE_ITEMS, INTEGRATIONS } from "@/components/docs-shell";
import { semtextAsset } from "@/lib/semtext-asset";

const REPO = "https://github.com/noizu-labs-ml/npl-enhanced-content";
const SPEC = `${REPO}/blob/develop/spec`;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
      {children}
    </p>
  );
}

function SectionHead({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

const FACTS: Array<{
  id: string;
  statement: string;
  conclusion: string;
  incorrectStatement: string;
}> = [
  {
    id: "f-view-as",
    statement: "view-as is a parameter, not an identity",
    conclusion:
      "A fact is a fact in every view; the attribute only selects a rendering.",
    incorrectStatement: "Each view is a different element type.",
  },
  {
    id: "f-light-dom",
    statement: "Components render into light DOM",
    conclusion:
      "Content stays in the page, so find-in-page, copy and plain CSS all still reach it.",
    incorrectStatement: "Content moves into a shadow root for encapsulation.",
  },
  {
    id: "f-invariant",
    statement: "Extraction reads the authored document",
    conclusion:
      "Generated chrome is skipped, so records do not depend on the view on screen.",
    incorrectStatement: "Extraction reads whatever is currently rendered.",
  },
  {
    id: "f-no-build",
    statement: "Authoring needs no build step",
    conclusion:
      "One stylesheet and one script tag in a plain HTML file; a theme is optional.",
    incorrectStatement: "A bundler compiles the vocabulary down to HTML.",
  },
];

// Degradation section is disabled on the landing page (user, 2026-10-14) — kept, not deleted.
const SHOW_TIERS = false;

const TIERS: Array<[string, string]> = [
  [
    "Tier 1 — CSS only",
    "Two stylesheets and no script: every element renders. Quiz answers, collapsed notes and inactive views all stay on the page — the rules that would hide them never match.",
  ],
  [
    "Tier 2 — the fallback script",
    "Up to 64 KB of vanilla JavaScript wires flashcards, quizzes, tabs and disclosure. No dependencies, no network, no build — and it is embedded in the file, so a copy you email keeps this tier.",
  ],
  [
    "Tier 3 — Lit components",
    "When the Lit bundle loads, elements claim data-sem-upgraded, drop the fallback marker and take over in place. Content is never re-parented into a shadow root.",
  ],
];

const GLOSSARY: Array<[string, React.ReactNode]> = [
  [
    "record",
    "One entry in the array extraction returns: a type, an id, qualifiers, a payload of fields, and one line of text.",
  ],
  [
    "tier",
    "Which script, if any, is driving the document: none (CSS only), the fallback bundle, or the Lit components.",
  ],
  [
    "tier marker",
    <>
      The <code className="font-mono">data-sem-fallback</code> or{" "}
      <code className="font-mono">data-sem-upgraded</code> attribute a script
      sets on what it wired; every hide rule is gated on one of them.
    </>,
  ],
];

const CHRONOLOGY: Array<[string, string, string?]> = [
  ["Jan 2026", "Format spec v0 and the Tier-0 schemas.", "done"],
  ["Mar 2026", "Fallback tier, extraction contract, scripts-stripped artifact.", "done"],
  ["Sep 2026", "Reading experience: foundations, then the prose elements on this page.", "current"],
  ["2026 Q4", "Theme pipeline and the reader chrome.", undefined],
];

const REFERENCES: Array<[string, string, string]> = [
  [
    "extraction.md §5",
    `${SPEC}/extraction.md`,
    "The central invariant: extraction output is identical whether or not JS ran, under any view, and after any interaction.",
  ],
  [
    "sem-references.md",
    `${SPEC}/schema/sem-references.md`,
    "In print, a reference's URL appears after its text — inside the references block only, never at the citation.",
  ],
];

const ARTIFACTS: Array<[string, React.ReactNode]> = [
  [
    "semtext.js",
    <>
      One bundle: Lit 3 components, reading chrome and the Markdown
      renderer · global <code className="font-mono">SemText</code>
    </>,
  ],
  [
    "semtext.css",
    <>
      Structure for the <code className="font-mono">sem-*</code> classes.
      Reads <code className="font-mono">--sem-*</code> tokens, declares
      none.
    </>,
  ],
  [
    "semtext-theme-<name>.css",
    <>
      Optional. Token values only, plus a dark-mode block. A new theme is a
      copy with new values.
    </>,
  ],
];

const QUESTIONS: Array<[string, string]> = [
  [
    "Why not Markdown?",
    "Markdown has nowhere to put the attributes that make a datum machine-readable — no way to mark a conclusion as distinct from a distractor, or a step as blocked. A converter that compiles Markdown into SemText is worth building; the canonical artifact stays XHTML, because that is what the browser, the terminal and the model all read.",
  ],
  [
    "Does a language model really need this?",
    "A model can read any HTML. What it cannot do reliably is tell a conclusion from a distractor, or a caveat from a heading, when nothing in the markup says so. The claim here is narrow: the attributes remove that guesswork, and the extraction contract makes the result stable enough to cite.",
  ],
  [
    "Is anyone using it?",
    "Noizu Labs, Inc. and The Robot Lives use SemText internally — agent-facing docs and demo documents are authored in it. It is still a draft spec: no third-party deployments to point at and no benchmarks to quote.",
  ],
];

/*
 * The Scope section and the two platform sections below are rendered with
 * the real vocabulary — sem-note, sem-reveal, sem-properties, sem-procedure
 * — through the Sem() themed block, not with lookalike divs. The strings
 * are the authored SemText source: what the DOM ships is what a model
 * would read. Raw innerHTML (rather than JSX elements) keeps attribute
 * names like key= and view-as= verbatim; React reserves key= on JSX props.
 */
const SCOPE_NOTES = `<sem-note variant="info">SemText is a markup vocabulary, two stylesheets and one script. It is not a CMS, a site generator or an application framework, and it has no opinion about how you produce the HTML.</sem-note>
<sem-note variant="warning">A new version should not break markup authored against an older one. New elements and attributes land alongside the ones a document already uses — never swapped out from under it — so a file authored today keeps rendering as the vocabulary grows. Pin a version when you ship.</sem-note>
<sem-note variant="tip">Nothing in the SemText bundle is React, and none is planned. Lit 3 is the only runtime dependency, and it is optional — the fallback tier has none.</sem-note>`;

const SCOPE_QA = QUESTIONS.map(
  ([q, a]) => `<sem-reveal summary="${q}" collapsed>${a}</sem-reveal>`
).join("\n");

const EXTEND_HTML = `<sem-note variant="info">The vocabulary is open at the edges: an organisation can define its own elements for what its documents say over and over — a runbook step type, a compliance datum, a product fact.</sem-note>
<sem-note variant="warning">The submission flow below is planned, not shipped — nothing here clicks yet. Custom elements are Lit components with a vocabulary entry, and the AI submission tool assembles both.</sem-note>
<sem-procedure kind="submission" role="list">
  <sem-step role="listitem" status="todo">Describe the element to the submission agent — a name, what it means, one example.</sem-step>
  <sem-step role="listitem" status="todo">The agent drafts the vocabulary entry and builds the Lit component.</sem-step>
  <sem-step role="listitem" status="todo">Review the render, then submit — the component ships in your org's bundle with its submission flow attached.</sem-step>
</sem-procedure>`;

function Note({
  variant,
  children,
}: {
  variant: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const tone = {
    info: "border-sky-400/40 bg-sky-400/5",
    warning: "border-amber-400/40 bg-amber-400/5",
    tip: "border-violet-soft/40 bg-violet/10",
  }[variant];
  const label = { info: "info", warning: "warning", tip: "tip" }[variant];
  return (
    <aside className={`rounded-xl border px-5 py-4 ${tone}`}>
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-faint">
        sem-note · {label}
      </p>
      <div className="mt-2 leading-relaxed text-ink-mute">{children}</div>
    </aside>
  );
}

export default function Home() {
  return (
    <main id="main">
      {/* Hero ------------------------------------------------------------- */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-docs grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
              a semantic text format
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              One XHTML file,
              <br />
              in place of Markdown.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-mute sm:text-lg">
              SemText is a semantic text format: a single XHTML file that a
              language model reads and writes the way it writes Markdown
              today. The difference is what the text can say. A fact, a step,
              a caveat, an incorrect statement, a term and its definition are each
              written as what they <em>are</em> — a tag and a few attributes —
              so the structure is in the text itself, not inferred from it.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-mute">
              Read it as-is. A model, a diff, a terminal, or an editor shows
              readable text in document order, with every qualifier spelled
              out next to the thing it qualifies. Nothing has to run first.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-mute">
              Open it in a browser and the same markup becomes working web
              components: flashcards flip, quizzes score, tabs switch, code
              copies, terms preview, and a reader bar tracks the outline. All
              of it works from a double-clicked file in any current browser,
              and none of it changes the text the model wrote.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#try"
                className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                See it work
              </a>
              <a
                href="/reference/"
                className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              >
                Browse the reference
              </a>
              <a
                href="#start"
                className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              >
                Get started
              </a>
            </div>
          </div>

          <HeroWindow />
        </div>
      </section>

      {/* Try -------------------------------------------------------------- */}
      <section
        id="try"
        aria-labelledby="try-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="try-h" eyebrow="The idea, in one control" title="Switch the view. The content does not change.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              These four facts are authored once, as{" "}
              <code className="font-mono">&lt;sem-fact&gt;</code> elements
              holding a <code className="font-mono">&lt;statement&gt;</code>, a{" "}
              <code className="font-mono">&lt;conclusion&gt;</code> and a{" "}
              <code className="font-mono">&lt;incorrect-statement&gt;</code>.{" "}
              <code className="font-mono">view-as</code> on the{" "}
              <code className="font-mono">&lt;sem-facts&gt;</code> element
              selects how they render — switching it rewrites nothing, and the
              records a machine reads are the same in every view. One file,
              three readers:
            </p>
            <ul
              role="list"
              className="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-relaxed text-ink-mute"
            >
              <li>
                <code className="font-mono text-violet-soft">semtext.html</code>{" "}
                — the in-browser render: double-click the file and it runs.
              </li>
              <li>
                <code className="font-mono text-violet-soft">semtext tui</code>{" "}
                — the same file in an interactive terminal for people: navigate
                sections, flip flashcards, run quizzes.
              </li>
              <li>
                <code className="font-mono text-violet-soft">
                  semtext --render
                </code>{" "}
                — plain text for agents: collapsed sections expand on demand,
                embeds load, and the file arrives as its own summary.
              </li>
            </ul>
          </SectionHead>

          <div className="mt-8">
            <TryViews facts={FACTS} />
            <p className="mt-3 text-sm text-ink-mute">
              The browser pane renders{" "}
              <code className="font-mono">demo/example-deck.sem.html</code>{" "}
              itself — the same file double-clicking opens. The shell panes
              type their first commands once the shell bundle lands. More
              sample documents sit in the{" "}
              <a
                href="#scope"
                className="text-violet-soft underline-offset-4 hover:underline"
              >
                showcase menu
              </a>{" "}
              below.
            </p>
          </div>
        </div>
      </section>

      {/* Tiers (disabled: see SHOW_TIERS) ---------------------------------- */}
      {SHOW_TIERS ? (
      <section
        id="tiers"
        aria-labelledby="tiers-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="tiers-h" eyebrow="Degradation" title="Three tiers, and the bottom one is the contract.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              Nothing is hidden until a script asks for it. Every hide rule in
              the vocabulary CSS is gated on a tier marker only a script sets,
              so with no script the document is still complete — it simply
              reads as prose. Each tier adds behaviour; none of them moves
              content.
            </p>
          </SectionHead>

          <ol className="mt-8 grid gap-px border border-code-border bg-code-border text-sm sm:grid-cols-3">
            {TIERS.map(([name, body]) => (
              <li key={name} className="bg-slateink p-5">
                <h3 className="font-mono font-semibold text-violet-soft">{name}</h3>
                <p className="mt-2 leading-relaxed text-ink-mute">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      ) : null}

      {/* Reading ---------------------------------------------------------- */}
      <section
        id="reading"
        aria-labelledby="reading-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="reading-h" eyebrow="Reading" title="Long-form documents, with the reading affordances left in.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              The recall elements above are one use of the vocabulary. Most
              documents are read, not drilled, so it also carries what a long
              document needs: a glossary whose terms preview on hover, references
              with backlinks, a dated chronology, listings with provenance, notes
              that can float in the margin, content addressed to a named
              audience, and links that reach into closed disclosures. The
              examples below are the real content; the live affordances — hover
              previews, sorting, the reader bar — run on the{" "}
              <a
                href="/#reading"
                className="text-violet-soft underline-offset-4 hover:underline"
              >
                showcase
              </a>
              .
            </p>
          </SectionHead>

          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-ink">
                Glossary
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                A <code className="font-mono">sem-properties</code> block with{" "}
                <code className="font-mono">view-as=&quot;glossary&quot;</code>.
                Each property carries an <code className="font-mono">id</code>;
                a term in prose is a plain anchor to it. With scripts off, the
                link simply jumps to the definition; the reading bundle adds a
                preview on hover or focus.
              </p>
              <dl className="mt-4 divide-y divide-white/5 border-y border-white/5">
                {GLOSSARY.map(([term, def]) => (
                  <div key={term} className="py-3">
                    <dt className="font-mono text-sm text-violet-soft">
                      {term}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink-mute">
                      {def}
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                Chronology
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-chronology</code> is CSS only:
                a list of <code className="font-mono">sem-event</code> items in
                chronological order, each with a{" "}
                <code className="font-mono">when</code> and an optional{" "}
                <code className="font-mono">status</code>. Extraction gives each
                event a positional ordinal.
              </p>
              <ol className="mt-4 border-l border-code-border pl-4">
                {CHRONOLOGY.map(([when, what, status]) => (
                  <li key={when} className="relative pb-4 last:pb-0">
                    <span
                      className={`absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full ${
                        status === "current"
                          ? "bg-violet-soft shadow-[0_0_8px_var(--accent-soft)]"
                          : "bg-code-border"
                      }`}
                      aria-hidden="true"
                    />
                    <p className="font-mono text-xs text-ink-faint">
                      {when}
                      {status === "current" ? " · current" : ""}
                      {status === "done" ? " · done" : ""}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-mute">
                      {what}
                    </p>
                  </li>
                ))}
              </ol>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                Audience
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                A <code className="font-mono">sem-audiences</code> block
                declares the profiles a document knows; any element may carry{" "}
                <code className="font-mono">audience</code>. Nothing is removed —
                content for a profile is hidden until a reader claims it, and
                extraction never consults visibility, so a filtered document
                still extracts whole.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Note variant="warning">
                  Operators only: an operator implies reader, so this profile
                  sees every reader note as well.
                </Note>
                <Note variant="info">
                  Readers and operators: profiles are claimed from the reader
                  bar; this note is addressed to both.
                </Note>
                <Note variant="tip">
                  Everyone except operators: a negated spec shows by default
                  and hides once the excluded profile is active.
                </Note>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold tracking-tight text-ink">
                Code
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-code</code> carries what a
                listing cannot: a filename, a language and a set of marked
                lines. The listing is written directly inside the element —
                it becomes a <code className="font-mono">&lt;pre&gt;&lt;code&gt;</code>{" "}
                when the reading bundle runs — stays byte-identical, and
                extraction reports it verbatim.
              </p>
              <figure
                className="code-window mt-4"
                aria-label="A source listing of a sem-references block: a citation in prose and the reference entry it points to"
              >
                <div className="code-chrome">
                  <span className="dot live" aria-hidden="true" />
                  <span>doc.html</span>
                </div>
                <pre>
                  <code>
                    {`<p>Rotate per use<a href="#r-rfc">[1]</a>.</p>
<sem-references id="refs" kind="bibliography" role="list">
  <sem-reference id="r-rfc" role="listitem"
       href="https://www.rfc-editor.org/rfc/rfc6749" cite="RFC 6749">The OAuth 2.0 Authorization Framework, §10.4.</sem-reference>
</sem-references>`}
                  </code>
                </pre>
              </figure>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                Reader
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-reader</code> is the bar
                pinned to the top of the showcase page: one per document, a
                direct child of the root wrapper, mints nothing. Its outline is
                generated from the headings,{" "}
                <code className="font-mono">h2</code> on down. Focus, type size,
                face and colour scheme are attributes on{" "}
                <code className="font-mono">&lt;html&gt;</code> that the
                vocabulary CSS keys on, remembered in{" "}
                <code className="font-mono">localStorage</code> when the
                browser allows it.
              </p>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                Source, Markdown, tables
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-source</code> lets a reader
                flip a section between the rendered result and the markup that
                produced it. <code className="font-mono">sem-md</code> holds
                Markdown as its text and renders it in the browser — tables
                above all.{" "}
                <code className="font-mono">sem-table</code> wraps an authored{" "}
                <code className="font-mono">&lt;table&gt;</code> and adds sort
                and filter; there is no JSON payload — the markup is the data.
                All three run live on the{" "}
                <a
                  href="/#reading"
                  className="text-violet-soft underline-offset-4 hover:underline"
                >
                  showcase
                </a>
                .
              </p>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                References
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-references</code> numbers its
                entries with a CSS counter in every tier. Citations in prose
                are plain anchors; the reading bundle adds a preview on each, a
                backlink per citation, and an external link where an entry has
                an <code className="font-mono">href</code>.
              </p>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-mute">
                {REFERENCES.map(([cite, href, text]) => (
                  <li key={cite}>
                    {text}{" "}
                    <a
                      href={href}
                      className="font-mono text-xs text-violet-soft underline-offset-4 hover:underline"
                    >
                      {cite}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Quick start ------------------------------------------------------ */}
      <section
        id="start"
        aria-labelledby="start-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="start-h" eyebrow="Quick start" title="What you actually write.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              A SemText document is an HTML file. The vocabulary is custom
              elements with plain attributes —{" "}
              <code className="font-mono text-violet-soft">
                &lt;sem-facts view-as=&quot;flashcards&quot;&gt;
              </code>
              ,{" "}
              <code className="font-mono text-violet-soft">
                &lt;sem-step status=&quot;done&quot;&gt;
              </code>{" "}
              — so any editor, template language or generator that emits HTML
              can write one, and the browser parses it with or without a script.
            </p>
          </SectionHead>

          <div className="mt-8">
            <CodeViewer />
          </div>
          <p className="mt-3 max-w-2xl text-sm text-ink-mute">
            Save it, double-click it. That is the whole workflow. Written the
            older way —{" "}
            <code className="font-mono">
              &lt;div class=&quot;sem-note&quot; data-variant=&quot;warning&quot;&gt;
            </code>{" "}
            — it renders and extracts the same; that spelling is the
            compatibility alias, documented once in the spec&apos;s Appendix A.
            The <code className="font-mono">cdn.semtext.dev</code> links are
            the planned origin; today the same files ship in the{" "}
            <a
              href={REPO}
              className="text-violet-soft underline-offset-4 hover:underline"
            >
              spec repo
            </a>
            .
          </p>

          <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
            Adding it to a project
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              <>
                Copy{" "}
                <code className="font-mono">semtext.css</code> — and, if you
                want a theme,{" "}
                <code className="font-mono">semtext-theme-&lt;name&gt;.css</code>{" "}
                — next to your document, and set{" "}
                <code className="font-mono">data-sem-theme</code> on{" "}
                <code className="font-mono">&lt;html&gt;</code> to that
                theme&apos;s name.
              </>,
              <>
                Add <code className="font-mono">semtext.js</code>.
                Link it, or paste it inline for a document you intend to send
                as a single file.
              </>,
              <>
                Write the content with{" "}
                <code className="font-mono">sem-*</code> elements where
                interactivity or machine-readability pays. Ordinary HTML stays
                ordinary HTML.
              </>,
            ].map((step, i) => (
              <li
                key={i}
                className="rounded-xl border border-code-border bg-slateink-lift p-4 text-sm leading-relaxed text-ink-mute"
              >
                <span className="mr-2 font-mono text-xs text-violet-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <ThemeGenerator />
        </div>
      </section>

      {/* Surface ---------------------------------------------------------- */}
      <section
        id="surface"
        aria-labelledby="surface-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="surface-h" eyebrow="Surface" title="Everything that ships.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              One script and one stylesheet, plus an optional theme file.
              Everything a document needs rides in the single{" "}
              <code className="font-mono">semtext.js</code> — the components,
              the reading chrome and the Markdown renderer — so there is no
              build step and nothing else to link.
            </p>
          </SectionHead>

          <dl className="mt-8 divide-y divide-white/5 border-y border-white/5">
            {ARTIFACTS.map(([key, desc]) => (
              <div
                key={key}
                className="grid gap-1 py-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="font-mono text-sm text-violet-soft">{key}</dt>
                <dd className="text-sm leading-relaxed text-ink-mute">
                  {desc}
                </dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
            The vocabulary
          </h3>
          <p className="mt-2 max-w-3xl leading-relaxed text-ink-mute">
            Twenty-one element types mint records:{" "}
            <code className="font-mono">sem-agent</code>,{" "}
            <code className="font-mono">sem-note</code>,{" "}
            <code className="font-mono">sem-facts</code> and{" "}
            <code className="font-mono">sem-fact</code>,{" "}
            <code className="font-mono">sem-details</code> and{" "}
            <code className="font-mono">sem-detail</code>,{" "}
            <code className="font-mono">sem-procedure</code> and{" "}
            <code className="font-mono">sem-step</code>,{" "}
            <code className="font-mono">sem-properties</code> and{" "}
            <code className="font-mono">sem-property</code>,{" "}
            <code className="font-mono">sem-views</code> and{" "}
            <code className="font-mono">sem-view</code>,{" "}
            <code className="font-mono">sem-reveal</code>,{" "}
            <code className="font-mono">sem-progress</code>,{" "}
            <code className="font-mono">sem-chronology</code> and{" "}
            <code className="font-mono">sem-event</code>,{" "}
            <code className="font-mono">sem-code</code>,{" "}
            <code className="font-mono">sem-references</code> and{" "}
            <code className="font-mono">sem-reference</code>,{" "}
            <code className="font-mono">sem-table</code> and{" "}
            <code className="font-mono">sem-md</code>.{" "}
            <code className="font-mono">sem-reader</code> is chrome and mints
            nothing.
          </p>
          <p className="mt-3 text-sm text-ink-mute">
            Browse all of them — purpose, options, and the authored markup —
            in the{" "}
            <a
              href="/reference/"
              className="font-mono text-violet-soft underline-offset-4 hover:underline"
            >
              tag reference
            </a>
            .
          </p>

          <p className="mt-8 text-sm text-ink-mute">
            A <code className="font-mono">sem-agent</code> block is
            document-level metadata aimed at a model, carried by the same file
            a person is reading. It is inert to a browser and it is a record to
            an extractor.
          </p>
        </div>
      </section>

      {/* Scope ------------------------------------------------------------ */}
      <section
        id="scope"
        aria-labelledby="scope-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="scope-h" eyebrow="Scope" title="What it is not.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              SemText ends at the document: no build step, no service, no
              install. The limits below are the design, not the gaps.
            </p>
          </SectionHead>

          <Sem
            className="mt-8 flex max-w-3xl flex-col gap-3"
            html={SCOPE_NOTES}
          />

          <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
            The obvious questions
          </h3>
          <Sem
            className="mt-4 flex max-w-3xl flex-col gap-3"
            html={SCOPE_QA}
          />

          <div className="mt-14 flex flex-wrap items-center gap-3">
            {/* The showcase CTA is a menu of sample SemText docs (plus the
                portfolio integrations) — same lists the /docs/ sidebar and
                Sample docs section use, so they cannot drift. */}
            <details className="showcase-menu">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 bg-violet px-5 py-2 text-sm font-semibold text-white marker:hidden hover:brightness-110">
                Open the showcase
                <span aria-hidden="true" className="text-xs">
                  ▾
                </span>
              </summary>
              <div className="showcase-menu-panel">
                <p className="g-nav-title">Showcase</p>
                <ul className="mt-2 flex flex-col gap-1.5" role="list">
                  {SHOWCASE_ITEMS.map((d) => (
                    <li key={d.label} className="text-sm leading-6">
                      {d.href ? (
                        <a
                          href={d.href}
                          className="font-mono text-violet-soft underline-offset-4 hover:underline"
                        >
                          {d.label}
                        </a>
                      ) : (
                        <span className="font-mono text-ink-faint">
                          {d.label}
                        </span>
                      )}
                      <span className="text-ink-mute"> — {d.note}</span>
                      {d.planned && (
                        <b className="g-status">planned</b>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="g-nav-title mt-5">Integrations</p>
                <ul className="mt-2 flex flex-col gap-1.5" role="list">
                  {INTEGRATIONS.map((d) => (
                    <li key={d.label} className="text-sm leading-6">
                      {d.href ? (
                        <a
                          href={d.href}
                          className="font-mono text-violet-soft underline-offset-4 hover:underline"
                        >
                          {d.label}
                        </a>
                      ) : (
                        <span className="font-mono text-ink-faint">
                          {d.label}
                        </span>
                      )}
                      <span className="text-ink-mute"> — {d.note}</span>
                      {d.planned && (
                        <b className="g-status">planned</b>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
            <a
              href="/reference/"
              className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
            >
              Browse the reference
            </a>
            <span className="font-mono text-xs text-ink-faint">
              every tag, from the spec
            </span>
          </div>
        </div>
      </section>

      {/* Integrations ----------------------------------------------------- */}
      <section
        id="addons"
        aria-labelledby="addons-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead
            id="addons-h"
            eyebrow="Integrations"
            title="Documents that do more than read."
          >
            <p className="mt-4 leading-relaxed text-ink-mute">
              The reading and extraction core is free and static. Integrations
              connect a document to live systems — tickets and knowledge-base
              answers cited inline, quizzes and courses readers work through,
              mockups and UML rendered in place. Each is wired to its real
              logic as it is built, and none change how a document reads.
            </p>
          </SectionHead>
          <AddonsCarousel />
          <div className="mt-8">
            <a
              href="/integrations"
              className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
            >
              More integrations
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Extend ----------------------------------------------------------- */}
      <section
        id="extend"
        aria-labelledby="extend-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead
            id="extend-h"
            eyebrow="Extend"
            title="Extend the vocabulary."
          >
            <p className="mt-4 leading-relaxed text-ink-mute">
              Org-specific components, and a submission tool where you talk an
              element into existence: the agent drafts the vocabulary entry,
              builds the Lit component, and wires the submission flow.
            </p>
          </SectionHead>
          <Sem
            className="mt-8 flex max-w-3xl flex-col gap-4"
            html={EXTEND_HTML}
          />
        </div>
      </section>

      {/* SemText runtime for the Scope / Extend blocks above.
          __semJsOff keeps the bundle from auto-wiring on injection; the
          one-shot listener below enhances the whole document exactly once,
          after the deferred bundle has loaded. The hero window re-checks
          the html[data-sem-fallback] marker before touching anything. */}
      <script dangerouslySetInnerHTML={{ __html: "window.__semJsOff=true;" }} />
      <script defer src={semtextAsset("semtext-fallback.js")} />
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.addEventListener('DOMContentLoaded',function(){if(window.SemTextFallback&&!document.documentElement.hasAttribute('data-sem-fallback')){window.SemTextFallback.enhance(document);}});",
        }}
      />
    </main>
  );
}
