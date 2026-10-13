import type { Metadata } from "next";
import { DocsShell, Sem, SAMPLE_DOCS, type SampleDoc } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "Docs — SemText",
  description:
    "Getting started with SemText: one XHTML file, two stylesheets and the fallback bundle. Sample docs to browse, themes to pick from.",
  alternates: { canonical: "https://semtext.dev/docs/" },
};

/*
 * The CDN stub is illustrative: cdn.semtext.dev is the planned origin;
 * today the same three files ship in the spec repo's dist/ (and in this
 * site's public/semtext/). The page renders live SemText below, so the
 * fallback bundle is loaded WITHOUT __semJsOff — its DOMContentLoaded
 * auto-wire enhances everything on the page.
 */

const STUB = `<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8" />
  <title>Auth notes</title>
  <link rel="stylesheet" href="https://cdn.semtext.dev/v0/themes/_vocabulary.css" />
  <link rel="stylesheet" href="https://cdn.semtext.dev/v0/themes/minimal-tech-light.css" />
  <script defer src="https://cdn.semtext.dev/v0/semtext-fallback.js"></script>
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
</html>`;

const THEMES_HTML = `<sem-properties kind="themes">
  <sem-property key="_vocabulary.css" role="definition">Required base — the element defaults every theme builds on. <b class="g-status">ships</b></sem-property>
  <sem-property key="minimal-tech-light" role="definition">The one themed skin today: light values plus an explicit dark block. <b class="g-status">ships</b></sem-property>
  <sem-property key="your theme here" role="definition">A theme is a token sheet over the vocabulary — the slot is open. <b class="g-status">planned</b></sem-property>
</sem-properties>`;

function sampleHtml(docs: SampleDoc[], kind: string): string {
  const rows = docs
    .map((d) => {
      const where = d.href
        ? `<a href="${d.href}">${d.label}</a>`
        : `<span class="g-muted">${d.label}</span>`;
      return `  <sem-property key="${d.label}" role="definition">${where} — ${d.note} <b class="g-status">${d.planned ? "planned" : "live"}</b></sem-property>`;
    })
    .join("\n");
  return `<sem-properties kind="${kind}">\n${rows}\n</sem-properties>`;
}

const SAMPLES_HTML = sampleHtml(SAMPLE_DOCS, "samples");

const GLOSSARY_TIP_HTML =
  '<sem-note variant="tip">Every element and attribute — purpose, allowed values, a live render and the authored markup — is catalogued in the <a href="/elements/">elements glossary</a>.</sem-note>';

export default function DocsPage() {
  return (
    <DocsShell active="getting-started">
      <main id="main">
        <p className="g-eyebrow">Guides</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Docs
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          A SemText document is one XHTML file. Ship it with two stylesheets
          and a small script and the same file a model reads becomes working
          web components — no build step, no framework, nothing compiled.
        </p>

        {/* —— Getting started —— */}
        <section
          id="getting-started"
          aria-labelledby="getting-started-h"
          className="mt-14 scroll-mt-24"
        >
          <h2
            id="getting-started-h"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Getting started
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            Author your document as XHTML using the SemText vocabulary — any
            tool that writes HTML can write it. Then load the vocabulary, a
            theme, and the fallback bundle. That is the whole integration:
          </p>

          <figure className="code-window mt-6" aria-label="A minimal SemText page">
            <div className="code-chrome">
              <span className="dot live" aria-hidden="true" />
              <span className="dot" aria-hidden="true" />
              <span className="dot" aria-hidden="true" />
              <span>semtext.html</span>
            </div>
            <pre>
              <code>{STUB}</code>
            </pre>
          </figure>
          <p className="mt-3 font-mono text-xs leading-5 text-ink-faint">
            cdn.semtext.dev is the planned CDN origin; today the same three
            files ship in the spec repo&apos;s dist/ — and in this site&apos;s
            public/semtext/, which the examples on{" "}
            <a
              href="/elements/"
            className="text-violet-soft underline-offset-4 hover:underline"
            >
              /elements/
            </a>{" "}
            render with.
          </p>

          <h3 className="mt-10 text-lg font-semibold tracking-tight text-ink">
            Pick a theme
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">
            The data-sem-theme attribute on the html element keys the token
            sheet; data-color-mode picks its light or dark block. One theme
            ships today; the vocabulary is the shared base every theme builds
            on.
          </p>
          <Sem
            className="mt-4 flex max-w-3xl flex-col gap-3"
            html={THEMES_HTML}
          />

          <Sem className="mt-4" html={GLOSSARY_TIP_HTML} />
        </section>

        {/* —— Sample docs —— */}
        <section
          id="samples"
          aria-labelledby="samples-h"
          className="mt-14 scroll-mt-24 border-t border-white/10 pt-10"
        >
          <h2
            id="samples-h"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Sample docs
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
            The showcase serves whole documents built from the vocabulary —
            the same menu sits in the Scope section of the landing page. Each
            sample is one XHTML file you can view-source.
          </p>
          <Sem
            className="mt-4 flex max-w-3xl flex-col gap-3"
            html={SAMPLES_HTML}
          />
        </section>

        <script defer src="/semtext/semtext-fallback.js" />
      </main>
    </DocsShell>
  );
}
