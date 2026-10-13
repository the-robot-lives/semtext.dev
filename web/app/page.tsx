import { HeroWindow } from "@/components/hero-window";
import { TryViews } from "@/components/try-views";
import { Sem, SAMPLE_DOCS, INTEGRATIONS } from "@/components/docs-shell";

const SHOWCASE = "http://localhost:4173";
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
  distractor: string;
}> = [
  {
    id: "f-view-as",
    statement: "view-as is a parameter, not an identity",
    conclusion:
      "A fact is a fact in every view; the attribute only selects a rendering.",
    distractor: "Each view is a different element type.",
  },
  {
    id: "f-light-dom",
    statement: "Components render into light DOM",
    conclusion:
      "Content stays in the page, so find-in-page, copy and plain CSS all still reach it.",
    distractor: "Content moves into a shadow root for encapsulation.",
  },
  {
    id: "f-invariant",
    statement: "Extraction reads the authored document",
    conclusion:
      "Generated chrome is skipped, so records do not depend on the view on screen.",
    distractor: "Extraction reads whatever is currently rendered.",
  },
  {
    id: "f-no-build",
    statement: "Authoring needs no build step",
    conclusion: "Two stylesheets and one script tag in a plain HTML file.",
    distractor: "A bundler compiles the vocabulary down to HTML.",
  },
];

const TIERS: Array<[string, string]> = [
  [
    "Tier 1 — CSS only",
    "Two stylesheets render every element readably. Quiz answers, collapsed notes and inactive views all stay on the page, because the rules that would hide them never match.",
  ],
  [
    "Tier 2 — the fallback script",
    "About 7 KB of vanilla JavaScript wires flashcards, quizzes, tabs, disclosure and meters. No dependencies, no network, no build. It is the tier a file you email still has.",
  ],
  [
    "Tier 3 — Lit components",
    "When the component bundle loads, elements claim data-sem-upgraded, drop the fallback marker and take over in place. Content is never re-parented into a shadow root.",
  ],
];

const GLOSSARY: Array<[string, React.ReactNode]> = [
  [
    "record",
    "One entry in the array extraction returns: a type, an id, qualifiers, a payload of fields and a one-line text.",
  ],
  [
    "tier",
    "Which script, if any, is driving the document: none (CSS only), the fallback bundle, or the Lit components.",
  ],
  [
    "tier marker",
    "The data-sem-fallback or data-sem-upgraded attribute a script sets on what it wired; every hide rule is gated on one of them.",
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
    "Print appends (href) inside the references block only.",
  ],
];

const ARTIFACTS: Array<[string, React.ReactNode]> = [
  [
    "semtext.js",
    <>
      Lit 3 components · global <code className="font-mono">SemText</code>
    </>,
  ],
  [
    "semtext-fallback.js",
    <>
      Vanilla interactivity, no dependencies · global{" "}
      <code className="font-mono">SemTextFallback</code>
    </>,
  ],
  [
    "semtext-reading.js",
    <>
      Code chrome, reference and glossary previews, the reader bar, table sort
      and filter · global <code className="font-mono">SemTextReading</code>
    </>,
  ],
  [
    "semtext-extract.js",
    <>
      DOM to records and annotated text · global{" "}
      <code className="font-mono">SemTextExtract</code>
    </>,
  ],
  [
    "semtext-md.js",
    <>
      The <code className="font-mono">sem-md</code> Markdown renderer · global{" "}
      <code className="font-mono">SemTextMd</code>
    </>,
  ],
  [
    "_vocabulary.css",
    <>
      Structure for the <code className="font-mono">sem-*</code> classes. Reads{" "}
      <code className="font-mono">--sem-*</code> tokens, declares none.
    </>,
  ],
  [
    "theme css",
    <>
      Token values only, plus a <code className="font-mono">prefers-color-scheme</code>{" "}
      block. A new theme is a copy with new values.
    </>,
  ],
];

const QUESTIONS: Array<[string, string]> = [
  [
    "Why not Markdown?",
    "Markdown has nowhere to put the attributes that make a datum machine-readable — no way to mark a conclusion as distinct from a decoy, or a step as blocked. An authoring aid that compiles Markdown into SemText is a reasonable thing to build, but the canonical artifact stays XHTML, because that is the artifact all three readers consume.",
  ],
  [
    "Does a language model really need this?",
    "A model can read any HTML. What it cannot do reliably is tell a conclusion from a distractor, or a caveat from a heading, when nothing in the markup says so. The claim here is narrow: the attributes remove that guesswork, and the extraction contract makes the result stable enough to cite.",
  ],
  [
    "Is anyone using it?",
    "Not yet. This is a draft spec, a reference implementation and a Cypress suite. There are no users to point at, no benchmarks to quote and no production deployments beyond this page and its demos.",
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
const SCOPE_NOTES = `<sem-note variant="info">SemText is a markup vocabulary and three small scripts. It is not a CMS, a site generator or an application framework, and it has no opinion about how you produce the HTML.</sem-note>
<sem-note variant="warning">Versioning follows the open/closed principle: any version changes should not break your existing markup. New elements and attributes land alongside the ones a document already uses — never swapped out from under it — so a file authored today keeps rendering as the vocabulary grows. Pin a version when you ship.</sem-note>
<sem-note variant="tip">There is no React in the dependency tree and there is not going to be one. Lit 3 is the only runtime dependency, and it is optional — the fallback tier has none.</sem-note>`;

const SCOPE_QA = QUESTIONS.map(
  ([q, a]) => `<sem-reveal summary="${q}" collapsed>${a}</sem-reveal>`
).join("\n");

const ADDONS_HTML = `<sem-note variant="info">Add Ons unlock behind an account key. The vocabulary itself stays open — every add-on embeds into or extends a document, and none of them change how one is read.</sem-note>
<sem-properties kind="add-ons">
  <sem-property key="Ticket embedding" role="definition">An account key enables ticket embedding — live tickets from your tracker, cited inline like any other datum. <b class="g-status">planned</b></sem-property>
  <sem-property key="The Robot Knows hookup" role="definition">Point a document at your knowledge base, so facts and procedures draw on live KB entries. <b class="g-status">planned</b></sem-property>
  <sem-property key="The Robot Learns courses" role="definition">Courses load as SemText and track each reader's quiz progress; sign-in is prompted when tracking starts. <b class="g-status">planned</b></sem-property>
  <sem-property key="Embedded exams &amp; quizzes" role="definition">Private exams and quizzes from The Robot Learns embed in your pages, beside an always-available catalogue of public embedded quizzes. <b class="g-status">planned</b></sem-property>
  <sem-property key="Draftamo renders" role="definition">Mockups and UML renders from Draftamo-hosted projects, or from local Draftamo XML. <b class="g-status">planned</b></sem-property>
  <sem-property key="Issue submission" role="definition">Submit an issue from the page itself — The Robot Plans files it in Jira, ClickUp, or GitHub. <b class="g-status">planned</b></sem-property>
</sem-properties>`;

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
        <div className="mx-auto grid max-w-docs gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
              semantic text · one XHTML file
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              One XHTML file,
              <br />
              in place of Markdown.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-mute sm:text-lg">
              SemText is a semantic text format: a single XHTML file that a
              language model reads and writes the way it reads and writes
              Markdown today. The difference is what the text can say. A fact,
              a step, a caveat, a distractor, a term and its definition are
              each written as what they <em>are</em> — a class and a few
              attributes on a plain element — so the structure is in the text
              itself, not inferred from it.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-mute">
              Read it as-is. A model, a diff, a terminal, or a person with the
              file open in an editor sees readable text in document order, with
              every qualifier spelled out next to the thing it qualifies.
              Nothing has to run first.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-mute">
              Open it in a browser and the same markup becomes working web
              components: flashcards flip, quizzes score, tabs switch, code
              copies, terms preview, and a reader bar tracks the outline. That
              works in any current browser from a double-clicked file, and none
              of it changes the text the model wrote.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#try"
                className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                See it work
              </a>
              <a
                href="/spec/semtext.html"
                className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              >
                Read the spec
              </a>
              <a
                href="#start"
                className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              >
                Get started
              </a>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 font-mono text-xs text-ink-mute">
              <div>
                <dt className="text-ink-faint">files</dt>
                <dd className="mt-1 text-ink">one, standalone</dd>
              </div>
              <div>
                <dt className="text-ink-faint">build step</dt>
                <dd className="mt-1 text-ink">none</dd>
              </div>
            </dl>
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
          <SectionHead id="try-h" eyebrow="The idea, in one control" title="Change the view. The content does not move.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              These four facts are authored once, as{" "}
              <code className="font-mono">&lt;sem-fact&gt;</code> elements
              holding a <code className="font-mono">&lt;statement&gt;</code>{" "}
              and a <code className="font-mono">&lt;conclusion&gt;</code>.{" "}
              <code className="font-mono">view-as</code> on the{" "}
              <code className="font-mono">&lt;sem-facts&gt;</code> element
              selects how the facts render. Switching it rewrites nothing
              about what they are, and the records a machine reads stay
              identical. The same file has three views:
            </p>
            <ul className="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-relaxed text-ink-mute">
              <li>
                <code className="font-mono text-violet-soft">semtext.html</code>{" "}
                — the in-browser render: open it and the markup becomes the
                page you are reading.
              </li>
              <li>
                <code className="font-mono text-violet-soft">semtext tui</code>{" "}
                — an interactive terminal viewer for people, with flashcards,
                a data visualizer and graphs.
              </li>
              <li>
                <code className="font-mono text-violet-soft">
                  semtext --render
                </code>{" "}
                — renders and loads embeds, with collapse, expand and
                filtering for agents. Summaries can be expanded — a file is
                effectively its own summary view — and expand with{" "}
                <code className="font-mono">
                  &lt;sem-view-more&gt;&lt;sem-embed data-source=&quot;./non-summary-file.semtext.html&quot;
                  data-section=&quot;#Anchor Name&quot;&gt;&lt;/sem-view-more&gt;
                </code>
                .
              </li>
            </ul>
          </SectionHead>

          <div className="mt-8">
            <TryViews facts={FACTS} />
            <p className="mt-3 text-sm text-ink-mute">
              The live toggle — list, flashcards, quiz — runs on the{" "}
              <a
                href={`${SHOWCASE}/site/#try`}
                className="text-violet-soft underline-offset-4 hover:underline"
              >
                showcase
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Tiers ------------------------------------------------------------ */}
      <section
        id="tiers"
        aria-labelledby="tiers-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="tiers-h" eyebrow="Degradation" title="Three tiers, and the bottom one is the contract.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              Every hide rule in the vocabulary CSS is gated on an enhancement
              marker that only a script sets. With no script, nothing is hidden
              and the document reads as prose. Each tier above that adds
              behaviour without moving content.
            </p>
          </SectionHead>

          <ol className="mt-8 grid gap-px border border-code-border bg-code-border text-sm sm:grid-cols-3">
            {TIERS.map(([name, body]) => (
              <li key={name} className="bg-slateink p-5">
                <p className="font-mono text-violet-soft">{name}</p>
                <p className="mt-2 leading-relaxed text-ink-mute">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Reading ---------------------------------------------------------- */}
      <section
        id="reading"
        aria-labelledby="reading-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead id="reading-h" eyebrow="Reading" title="Long-form documents, with the reading affordances left in.">
            <p className="mt-3 leading-relaxed text-ink-mute">
              The recall elements above are one use. Most documents are read,
              not drilled, so the vocabulary also carries what a long document
              needs: a glossary whose terms preview on hover, references with
              backlinks, a dated chronology, listings with provenance, notes
              that sit in the margin, content addressed to a named audience,
              and links that reach into closed disclosures. The examples below
              are the real content; the live affordances — hover previews,
              sorting, the reader bar — run on the{" "}
              <a
                href={`${SHOWCASE}/site/#reading`}
                className="text-violet-soft underline-offset-4 hover:underline"
              >
                showcase
              </a>
              .
            </p>
          </SectionHead>

          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-ink">
                Glossary
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                A <code className="font-mono">sem-properties</code> block with{" "}
                <code className="font-mono">data-view-as=&quot;glossary&quot;</code>.
                Each property carries an <code className="font-mono">id</code>;
                a term in prose is a plain anchor to it. With scripts off the
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
              <p className="mt-4 text-sm leading-relaxed text-ink-mute">
                Because every hide rule is gated on a tier marker, a document
                with no script hides nothing, and the records a machine reads
                are the same at every tier.
              </p>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                Chronology
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-chronology</code> is CSS only:
                a list of <code className="font-mono">sem-event</code> items in
                chronological order, each with a{" "}
                <code className="font-mono">data-when</code> and an optional
                status. Extraction gives each event a positional ordinal.
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
                <code className="font-mono">data-audience</code>. Nothing is
                removed — content for a profile is hidden until a reader claims
                it, and extraction never looks at{" "}
                <code className="font-mono">hidden</code>, so a filtered
                document still extracts whole.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Note variant="warning">
                  Operators only: an operator implies reader, so this profile
                  sees every reader note as well.
                </Note>
                <Note variant="info">
                  Readers and operators: content for a profile is hidden until
                  a reader claims it, never deleted.
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
                <code className="font-mono">sem-code</code> wraps one{" "}
                <code className="font-mono">&lt;pre&gt;&lt;code&gt;</code> and
                carries what the listing cannot: a filename, a language and a
                set of marked lines. The chrome is added by the reading bundle;
                the listing text stays byte-identical, and extraction reports
                it verbatim.
              </p>
              <figure
                className="code-window mt-4"
                aria-label="A reference cited from prose"
              >
                <div className="code-chrome">
                  <span className="dot live" aria-hidden="true" />
                  <span>doc.html · lines 3-4 marked</span>
                </div>
                <pre>
                  <code>
                    {`<p>Rotate per use<a href="#r-rfc">[1]</a>.</p>
<div class="sem-references" data-kind="bibliography" role="list">
  <div class="sem-reference" id="r-rfc" role="listitem"
       data-href="https://www.rfc-editor.org/rfc/rfc6749" data-cite="RFC 6749">…</div>
</div>`}
                  </code>
                </pre>
              </figure>

              <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
                Reader
              </h3>
              <p className="mt-2 leading-relaxed text-ink-mute">
                <code className="font-mono">sem-reader</code> is the bar
                pinned to the top of the showcase page: one per document,
                first child of the wrapper, mints nothing. Its outline is
                generated from the <code className="font-mono">h2</code>{" "}
                headings, and focus, type size, face and colour scheme are
                attributes on <code className="font-mono">&lt;html&gt;</code>{" "}
                that the vocabulary CSS keys on, remembered in{" "}
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
                Markdown as its text and renders it in the browser; tables are
                the case it exists for.{" "}
                <code className="font-mono">sem-table</code> wraps an authored{" "}
                <code className="font-mono">&lt;table&gt;</code> and adds sort
                and filter; there is no JSON payload, the markup is the data.
                All three run live on the{" "}
                <a
                  href={`${SHOWCASE}/site/#reading`}
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
              can emit it, and the browser parses it with or without a script.
            </p>
          </SectionHead>

          <figure
            className="code-window mt-8"
            aria-label="A minimal SemText document"
          >
            <div className="code-chrome">
              <span className="dot live" aria-hidden="true" />
              <span>doc.html · minimal SemText document</span>
            </div>
            <pre>
              <code>
                {`<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Auth notes</title>
  <link rel="stylesheet" href="semtext/themes/_vocabulary.css">
  <link rel="stylesheet" href="semtext/themes/minimal-tech-light.css">
  <script src="semtext/semtext-fallback.js"></script>
</head>
<body>
<sem-enhanced-document>

  <h1>Auth notes</h1>

  <sem-note variant="warning">
    Refresh tokens rotate per use — each exchange retires the last one.
  </sem-note>

  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access tokens; the refresh grant issues a new pair.</conclusion>
      <sem-distractor>Store the token in localStorage for durability.</sem-distractor>
    </sem-fact>
  </sem-facts>

</sem-enhanced-document>
</body>
</html>`}
              </code>
            </pre>
          </figure>
          <p className="mt-3 text-sm text-ink-mute">
            Save it, double-click it. That is the whole workflow. Written the
            older way —{" "}
            <code className="font-mono">
              &lt;div class=&quot;sem-note&quot; data-variant=&quot;warning&quot;&gt;
            </code>{" "}
            — it renders and extracts the same; that spelling is the
            compatibility alias, documented once in the spec&apos;s Appendix A.
          </p>

          <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
            Adding it to a project
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              <>
                Copy{" "}
                <code className="font-mono">themes/_vocabulary.css</code> and
                one theme file next to your document, and set{" "}
                <code className="font-mono">data-sem-theme</code> on{" "}
                <code className="font-mono">&lt;html&gt;</code> to that
                theme&apos;s name.
              </>,
              <>
                Add <code className="font-mono">semtext-fallback.js</code>.
                Link it, or paste it inline for a document you intend to send
                as a single file.
              </>,
              <>
                Write the content with{" "}
                <code className="font-mono">sem-*</code> elements where
                interactivity or machine-readability pays. Ordinary HTML stays
                ordinary HTML.
              </>,
              <>
                Optional: add <code className="font-mono">semtext.js</code> for
                the Lit tier, and{" "}
                <code className="font-mono">semtext-extract.js</code> where a
                tool needs the records.
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
              Five independent classic scripts, each installing one global,
              plus two stylesheets. They are separate on purpose: the fallback
              tier has to run in a document that never loads Lit, a document
              with no listings or references need not carry the reading bundle,
              and one with no Markdown need not carry the parser. Measured
              sizes live on the{" "}
              <a
                href={`${SHOWCASE}/site/#surface`}
                className="text-violet-soft underline-offset-4 hover:underline"
              >
                showcase
              </a>
              .
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
            Browse all of them — purpose, attributes, a live render from the
            fallback tier, and the authored markup — in the{" "}
            <a
              href="/elements/"
              className="font-mono text-violet-soft underline-offset-4 hover:underline"
            >
              elements glossary
            </a>
            .
          </p>

          <div className="mt-8 rounded-xl border border-code-border bg-slateink-lift p-5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-faint">
              sem-agent
            </p>
            <p className="mt-2 font-semibold text-ink">SemText Guide</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-mute">
              Answers questions about SemText from the facts on this page.
            </p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-ink-faint">
              Answer only from sem-fact records in this document; cite ids.
            </p>
          </div>
          <p className="mt-3 text-sm text-ink-mute">
            A <code className="font-mono">sem-agent</code> block, above:
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
          <SectionHead id="scope-h" eyebrow="Scope" title="What it is not." />

          <Sem
            className="mt-6 flex max-w-3xl flex-col gap-3"
            html={SCOPE_NOTES}
          />

          <h3 className="mt-10 text-xl font-semibold tracking-tight text-ink">
            Reasonable questions
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
                <p className="g-nav-title">Sample docs</p>
                <ul className="mt-2 flex flex-col gap-1.5" role="list">
                  {SAMPLE_DOCS.map((d) => (
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
              href={`${SHOWCASE}/demo/`}
              className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
            >
              Open the demo
            </a>
            <span className="font-mono text-xs text-ink-faint">
              running at {SHOWCASE}
            </span>
          </div>
        </div>
      </section>

      {/* Add Ons ---------------------------------------------------------- */}
      <section
        id="addons"
        aria-labelledby="addons-h"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <SectionHead
            id="addons-h"
            eyebrow="Add Ons"
            title="Super Charge with Add Ons."
          >
            <p className="mt-4 leading-relaxed text-ink-mute">
              The reading and extraction core is free and static. The add-ons
              are where documents start doing things — every one of them is
              planned, none of them change how a document reads.
            </p>
          </SectionHead>
          <Sem
            className="mt-8 flex max-w-3xl flex-col gap-4"
            html={ADDONS_HTML}
          />
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

      {/* SemText runtime for the Scope / Add Ons / Extend blocks above.
          __semJsOff keeps the bundle from auto-wiring on injection; the
          one-shot listener below enhances the whole document exactly once,
          after the deferred bundle has loaded. The hero window re-checks
          the html[data-sem-fallback] marker before touching anything. */}
      <script dangerouslySetInnerHTML={{ __html: "window.__semJsOff=true;" }} />
      <script defer src="/semtext/semtext-fallback.js" />
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.addEventListener('DOMContentLoaded',function(){if(window.SemTextFallback&&!document.documentElement.hasAttribute('data-sem-fallback')){window.SemTextFallback.enhance(document);}});",
        }}
      />
    </main>
  );
}
