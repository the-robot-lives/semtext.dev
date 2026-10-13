import type { Metadata } from "next";
import { DocsShell, Sem, SHOWCASE_ITEMS } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "Docs — SemText",
  description:
    "SemText CLI and documentation: getting started, writing guides, and sample pages.",
  alternates: { canonical: "https://semtext.dev/docs/" },
};

const SHOWCAES_HTML = (function () {
  const rows = SHOWCASE_ITEMS.map((d) => {
    const where = d.href
      ? `<a href="${d.href}">${d.label}</a>`
      : `<span class="g-muted">${d.label}</span>`;
    return `  <sem-property key="${d.label}" role="definition">${where} — ${d.note}</sem-property>`;
  }).join("\n");
  return `<sem-properties kind="showcase">\n${rows}\n</sem-properties>`;
})();

export default function DocsPage() {
  return (
    <DocsShell
      active="cli"
      sections={[
        { id: "cli-commands", label: "CLI commands" },
        { id: "showcase", label: "Showcase pages" },
      ]}
    >
      <main id="main">
        <p className="g-eyebrow">Guides</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Documentation
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          SemText ships as a CLI and as component bundles. Author documents as
          plain XHTML, then read them in the browser, the terminal, or render
          them for distribution to agents.
        </p>

        {/* ———— CLI commands ———— */}
        <section
          id="cli-commands"
          aria-labelledby="cli-commands-h"
          className="mt-14 scroll-mt-24"
        >
          <h2
            id="cli-commands-h"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            CLI commands
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            The <code className="font-mono">semtext</code> command-line tool
            reads and renders SemText documents. Every command operates on local
            files and produces local output — no network, no API key, no cloud.
          </p>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext — read a document (raw)
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Prints the document in the terminal, as authored XHTML: sections,
            facts, steps and all the structure, readable as plain text from a
            buffer or a pipe.
          </p>

          <figure className="code-window mt-4" aria-label="The semtext command">
            <div className="code-chrome">
              <span className="dot live" aria-hidden="true" />
              <span className="font-mono">terminal</span>
            </div>
            <pre>
              <code>
{`$ semtext doc.semtext.html
Auth notes

refresh tokens rotate per use — each exchange retires the previous token.

Facts

  f-jwt
  kind: concept
  JWTs rotate per session
  conclusion:
    Short-lived access tokens; the refresh grant issues a new pair.
  distractors:
    Store the token in localStorage for durability.

$`}
              </code>
            </pre>
          </figure>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext tui — interactive terminal
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Opens an interactive terminal UI for browsing the document: navigate
            sections, flip flashcards, run quizzes, and inspect structured
            records. No dependencies, runs in your shell.
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            Usage: <code className="font-mono">semtext tui doc.semtext.html</code>
          </p>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext --render — render for agents
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Renders the document into a plain-text representation designed for
            language models: collapsed sections expand on demand, embeds load,
            examples stay inline. The output is the document itself as a text
            input to a model, with every structure it needs.
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            Usage: <code className="font-mono">semtext --render doc.semtext.html</code> ·
            output: plain text to stdout
          </p>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext extract — extract records
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Extracts structured records — facts, steps, properties, references,
            and all machine-readable content — in YAML or JSON format. Use this
            to feed a document's structured content into your own tools.
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            Usage: <code className="font-mono">semtext extract [--format yaml|json] doc.semtext.html</code>
          </p>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext validate — check a document
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            Parses the document and reports any structural issues: mismatched
            nesting, invalid attributes, broken links. Exits 0 if the document
            is valid.
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            Usage: <code className="font-mono">semtext validate doc.semtext.html</code>
          </p>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            semtext --version
          </h3>
          <p className="mt-2 text-sm text-ink-mute">
            Print the CLI and vocabulary version.
          </p>
        </section>

        {/* ———— Showcase ———— */}
        <section
          id="showcase"
          aria-labelledby="showcase-h"
          className="mt-14 scroll-mt-24 border-t border-white/10 pt-10"
        >
          <h2
            id="showcase-h"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Showcase pages
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            Live pages on the showcase site where you can see each SemText
            feature in the browser. Each page is a real SemText document,
            running the full fallback and reading bundle.
          </p>
          <Sem className="mt-4 flex max-w-3xl flex-col gap-3" html={SHOWCAES_HTML} />
        </section>

        <script defer src="/semtext/semtext-fallback.js" />
      </main>
    </DocsShell>
  );
}
