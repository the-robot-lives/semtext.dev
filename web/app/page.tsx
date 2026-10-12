const SHOWCASE = "http://localhost:4173";

export default function Home() {
  return (
    <main id="main">
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-docs gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
              docs · structured XHTML for AI prompts
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              One XHTML file,
              <br />
              in place of Markdown.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-mute sm:text-lg">
              SemText is a context-dense replacement for Markdown in AI
              prompts. A fact, a step, a caveat, a term and its definition are
              each written as what they <em>are</em> — a tag and a few
              attributes — so the structure is in the text itself, not
              inferred from it.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-mute">
              One standalone file, read three ways: open it in a browser and
              it becomes working web components; hand it to a model and it is
              structural XHTML; open it in an editor and it is readable text
              as-is.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#readers"
                className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                See the three readers
              </a>
              <a
                href="#write"
                className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              >
                Write one
              </a>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 font-mono text-xs text-ink-mute">
              <div>
                <dt className="text-ink-faint">files</dt>
                <dd className="mt-1 text-ink">one, standalone</dd>
              </div>
              <div>
                <dt className="text-ink-faint">readers</dt>
                <dd className="mt-1 text-ink">browser · model · text</dd>
              </div>
              <div>
                <dt className="text-ink-faint">build step</dt>
                <dd className="mt-1 text-ink">none</dd>
              </div>
            </dl>
          </div>

          <figure className="code-window" aria-label="A SemText prompt fragment">
            <div className="code-chrome">
              <span className="dot live" aria-hidden="true" />
              <span className="dot" aria-hidden="true" />
              <span className="dot" aria-hidden="true" />
              <span>auth-notes.xhtml · what the model reads</span>
            </div>
            <pre>
              <code>
                <span className="tok-punct">{"<"}</span>
                <span className="tok-fn">sem-note</span>{" "}
                <span className="tok-kw">variant</span>
                <span className="tok-punct">=</span>
                <span className="tok-str">&quot;warning&quot;</span>
                <span className="tok-punct">{">"}</span>
                {"\n  Rotate refresh tokens per use —\n  each exchange retires the last one.\n"}
                <span className="tok-punct">{"</"}</span>
                <span className="tok-fn">sem-note</span>
                <span className="tok-punct">{">"}</span>
                {"\n\n"}
                <span className="tok-punct">{"<"}</span>
                <span className="tok-fn">sem-facts</span>{" "}
                <span className="tok-kw">view-as</span>
                <span className="tok-punct">=</span>
                <span className="tok-str">&quot;flashcards&quot;</span>
                <span className="tok-punct">{">"}</span>
                {"\n  "}
                <span className="tok-punct">{"<"}</span>
                <span className="tok-fn">sem-fact</span>{" "}
                <span className="tok-kw">kind</span>
                <span className="tok-punct">=</span>
                <span className="tok-str">&quot;concept&quot;</span>
                <span className="tok-punct">{">"}</span>
                {"\n    "}
                <span className="tok-punct">{"<"}</span>
                <span className="tok-fn">statement</span>
                <span className="tok-punct">{">"}</span>
                {"JWTs rotate per session"}
                <span className="tok-punct">{"</"}</span>
                <span className="tok-fn">statement</span>
                <span className="tok-punct">{">"}</span>
                {"\n    "}
                <span className="tok-punct">{"<"}</span>
                <span className="tok-fn">conclusion</span>
                <span className="tok-punct">{">"}</span>
                {"Short-lived access tokens;"}
                {"\n    the refresh grant issues a new pair."}
                <span className="tok-punct">{"</"}</span>
                <span className="tok-fn">conclusion</span>
                <span className="tok-punct">{">"}</span>
                {"\n  "}
                <span className="tok-punct">{"</"}</span>
                <span className="tok-fn">sem-fact</span>
                <span className="tok-punct">{">"}</span>
                {"\n"}
                <span className="tok-punct">{"</"}</span>
                <span className="tok-fn">sem-facts</span>
                <span className="tok-punct">{">"}</span>
              </code>
            </pre>
          </figure>
        </div>
      </section>

      <section
        id="readers"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto grid max-w-docs gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav className="toc hidden lg:block" aria-label="On this page">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">
              on this page
            </p>
            <a href="#readers">three readers</a>
            <a href="#tags">the vocabulary</a>
            <a href="#write">write one</a>
            <a href="#showcase">showcase</a>
          </nav>

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
              01 · one file, three readers
            </p>
            <h2
              id="readers-h"
              className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
            >
              Read as a page, as structure, and as text.
            </h2>
            <p className="mt-3 max-w-2xl text-ink-mute">
              Markdown carries prose well and rich content poorly, so prompts
              end up as one copy for people and a second structured copy for
              the model, and the two drift. SemText keeps one file and lets
              each reader take what it needs from it. Pick a reader.
            </p>
          </div>
        </div>

        <div className="api-switch relative mx-auto mt-8 max-w-docs">
          <input
            className="api-radio"
            type="radio"
            name="reader-tab"
            id="tab-browser"
            defaultChecked
          />
          <input
            className="api-radio"
            type="radio"
            name="reader-tab"
            id="tab-model"
          />
          <input
            className="api-radio"
            type="radio"
            name="reader-tab"
            id="tab-text"
          />

          <div className="tab-bar flex flex-wrap gap-2">
            <label
              htmlFor="tab-browser"
              className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink"
            >
              browser
            </label>
            <label
              htmlFor="tab-model"
              className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink"
            >
              model
            </label>
            <label
              htmlFor="tab-text"
              className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink"
            >
              plain text
            </label>
          </div>

          <div className="panels mt-4">
            <article id="panel-browser" className="panel">
              <p className="sig mb-3">view: Lit web components, in place</p>
              <p className="max-w-2xl leading-relaxed text-ink-mute">
                The theme CSS styles the vocabulary directly, so the document
                is readable the moment it opens. When the Lit bundle loads,
                elements upgrade where they stand: flashcards flip, quizzes
                score, tabs switch, code copies, and a{" "}
                <code className="font-mono text-violet-soft">sem-reader</code>{" "}
                bar tracks the outline. It works from a double-clicked file —
                no server, no bundler, no network calls.
              </p>
            </article>

            <article id="panel-model" className="panel">
              <p className="sig mb-3">view: structural XHTML</p>
              <p className="max-w-2xl leading-relaxed text-ink-mute">
                The same file, read as markup.{" "}
                <code className="font-mono text-violet-soft">kind</code> says
                what a thing is,{" "}
                <code className="font-mono text-violet-soft">status</code>{" "}
                says where it stands, and a caveat sits in the file next to
                the claim it qualifies. The model does not have to infer the
                structure — the structure is written down — so the prompt
                carries more meaning per token than the same prose in
                Markdown.
              </p>
            </article>

            <article id="panel-text" className="panel">
              <p className="sig mb-3">view: the file in an editor</p>
              <p className="max-w-2xl leading-relaxed text-ink-mute">
                Opened in an editor, a diff, or a terminal, the file is
                readable as-is: prose in document order, every qualifier
                spelled out beside the thing it qualifies, nothing to run
                first. A model writes the same text back. When a condensed
                record view is useful, an optional reduction derives one from
                the markup — nothing depends on it.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="tags"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
            02 · the vocabulary
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The markup can say what a thing is.
          </h2>
          <p className="mt-3 max-w-2xl text-ink-mute">
            Twenty-one element types mint records a machine can read; these
            six carry most documents. Ordinary HTML stays ordinary HTML — you
            reach for a <code className="font-mono">sem-*</code> tag where
            interactivity or machine-readability pays.
          </p>

          <dl className="mt-10 grid gap-px border border-code-border bg-code-border text-sm sm:grid-cols-2">
            {[
              [
                "sem-note",
                "A caveat that sits beside the claim it qualifies — a margin note on wide screens, inline on phones.",
              ],
              [
                "sem-facts",
                "A deck of statements, conclusions and distractors; renders as a list, flashcards, or a quiz.",
              ],
              [
                "sem-procedure",
                "Ordered steps that carry a status, so a blocked step is written down, not implied.",
              ],
              [
                "sem-code",
                "A listing with a filename, a language and marked lines; the copy chrome wraps text that stays byte-identical.",
              ],
              [
                "sem-table",
                "Tabular data the reading bundle makes sortable and filterable; the cells stay plain text.",
              ],
              [
                "sem-reader",
                "The reading bar: outline, progress, focus, type, print. Chrome only — it mints no records.",
              ],
            ].map(([tag, desc]) => (
              <div key={tag} className="bg-slateink p-5">
                <dt className="font-mono text-violet-soft">{tag}</dt>
                <dd className="mt-2 leading-relaxed text-ink-mute">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="write"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
            03 · write one
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            An HTML file. That is the whole workflow.
          </h2>
          <p className="mt-3 max-w-2xl text-ink-mute">
            Two stylesheets and one script tag in a plain XHTML file; wrap the
            body in{" "}
            <code className="font-mono text-violet-soft">
              &lt;sem-enhanced-document&gt;
            </code>{" "}
            and write. Any editor, template language, or generator that emits
            HTML can emit it. Save it, double-click it.
          </p>

          <figure
            className="code-window mt-8"
            aria-label="A minimal SemText document"
          >
            <div className="code-chrome">
              <span className="dot live" aria-hidden="true" />
              <span>doc.xhtml · minimal SemText document</span>
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
    </sem-fact>
  </sem-facts>

</sem-enhanced-document>
</body>
</html>`}
              </code>
            </pre>
          </figure>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={`${SHOWCASE}/site/`}
              className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Open the showcase
            </a>
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

      <section id="showcase" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <picture>
            <source srcSet="/assets/mark.webp" type="image/webp" />
            <img
              src="/assets/mark.jpg"
              alt="A square slate badge showing a robot head assembled from punctuation and binary glyphs, with two glowing chip-like eyes and a caret antenna."
              width={1024}
              height={1024}
              className="mx-auto mb-6 h-28 w-28 rounded-2xl object-cover sm:h-36 sm:w-36"
            />
          </picture>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            One file. Every reader.
          </h2>
          <p className="mt-4 leading-relaxed text-ink-mute">
            The showcase is this page&apos;s argument, lived: a full SemText
            document running all three readers, and a demo you can take apart.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`${SHOWCASE}/site/`}
              className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Showcase — /site/
            </a>
            <a
              href={`${SHOWCASE}/demo/`}
              className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
            >
              Demo — /demo/
            </a>
          </div>
          <p className="mt-6 font-mono text-xs text-ink-faint">
            Part of The Robot Lives portfolio
          </p>
        </div>
      </section>
    </main>
  );
}
