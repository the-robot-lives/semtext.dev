const TOKENS: { surf: string; pos: string }[] = [
  { surf: "The", pos: "DET" },
  { surf: "robot", pos: "NOUN" },
  { surf: "lives", pos: "VERB" },
  { surf: "in", pos: "ADP" },
  { surf: "the", pos: "DET" },
  { surf: "text", pos: "NOUN" },
  { surf: ".", pos: "PUNCT" },
];

const HITS: { id: string; score: string; text: string }[] = [
  { id: "d0", score: "0.91", text: "The robot lives in the text." },
  { id: "d4", score: "0.74", text: "Machines inhabit language." },
  { id: "d2", score: "0.61", text: "A corpus of robot stories." },
  { id: "d7", score: "0.33", text: "Vector clocks for replicas." },
];

export default function Home() {
  return (
    <main id="main">
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-docs gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
              docs · semantic text toolkit
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Parse meaning.
              <br />
              Embed it. Query it.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-mute sm:text-lg">
              semtext is a developer tool for meaning-aware text: tokenize with
              spans, embed into a small dense space, and retrieve neighbors by
              cosine. The samples on this page are printed — no runtime, no
              waitlist.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#quickstart"
                className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Read the sample
              </a>
              <a
                href="#api"
                className="inline-flex min-h-11 items-center border border-code-border px-5 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              >
                API reference
              </a>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 font-mono text-xs text-ink-mute">
              <div>
                <dt className="text-ink-faint">tokens</dt>
                <dd className="mt-1 text-ink">span + POS</dd>
              </div>
              <div>
                <dt className="text-ink-faint">embed</dt>
                <dd className="mt-1 text-ink">384-d mini</dd>
              </div>
              <div>
                <dt className="text-ink-faint">similar</dt>
                <dd className="mt-1 text-ink">cosine / k</dd>
              </div>
            </dl>
          </div>

          <figure className="code-window" aria-label="Quickstart TypeScript sample">
            <div className="code-chrome">
              <span className="dot live" aria-hidden="true" />
              <span className="dot" aria-hidden="true" />
              <span className="dot" aria-hidden="true" />
              <span>quickstart.ts · static sample</span>
            </div>
            <pre>
              <code>
                <span className="tok-kw">import</span>
                {" { parse, embed, similar } "}
                <span className="tok-kw">from</span>{" "}
                <span className="tok-str">&quot;semtext&quot;</span>
                <span className="tok-punct">;</span>
                {"\n\n"}
                <span className="tok-kw">const</span> doc ={" "}
                <span className="tok-fn">parse</span>
                <span className="tok-punct">(</span>
                <span className="tok-str">&quot;The robot lives in the text.&quot;</span>
                <span className="tok-punct">);</span>
                {"\n"}
                <span className="tok-cmt">
                  {"// Doc { tokens, lemmas, spans }"}
                </span>
                {"\n\n"}
                <span className="tok-kw">const</span> vec ={" "}
                <span className="tok-kw">await</span>{" "}
                <span className="tok-fn">embed</span>
                <span className="tok-punct">(</span>
                {"doc, { model: "}
                <span className="tok-str">&quot;semtext-mini&quot;</span>
                {" }"}
                <span className="tok-punct">);</span>
                {"\n"}
                <span className="tok-cmt">{"// Float32Array(384)"}</span>
                {"\n\n"}
                <span className="tok-kw">const</span> hits ={" "}
                <span className="tok-fn">similar</span>
                <span className="tok-punct">(</span>
                {"vec, corpus, { k: "}
                <span className="tok-num">5</span>
                {", metric: "}
                <span className="tok-str">&quot;cosine&quot;</span>
                {" }"}
                <span className="tok-punct">);</span>
              </code>
            </pre>
          </figure>
        </div>
      </section>

      <section
        id="quickstart"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto grid max-w-docs gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav className="toc hidden lg:block" aria-label="On this page">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">
              on this page
            </p>
            <a href="#quickstart">quickstart</a>
            <a href="#tokens">tokens</a>
            <a href="#api">api.parse</a>
            <a href="#api">api.embed</a>
            <a href="#api">api.similar</a>
            <a href="#pipeline">pipeline</a>
          </nav>

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
              01 · tokens on the glass
            </p>
            <h2
              id="tokens"
              className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
            >
              The sentence, split on meaning
            </h2>
            <p className="mt-3 max-w-2xl text-ink-mute">
              <code className="font-mono text-violet-soft">parse()</code> does
              not just split on whitespace. Each surface form keeps a POS tag,
              a lemma, and a character span so downstream embedders can weight
              content words.
            </p>

            <ol className="mt-8 flex flex-wrap gap-2" aria-label="Tokenized sample">
              {TOKENS.map((tok) => (
                <li key={`${tok.surf}-${tok.pos}`} className="chip">
                  <span className="surf">{tok.surf}</span>
                  <span className="pos">{tok.pos}</span>
                </li>
              ))}
            </ol>

            <figure className="code-window mt-8" aria-label="parse() return value">
              <div className="code-chrome">
                <span className="dot live" aria-hidden="true" />
                <span>parse.json · printed result</span>
              </div>
              <pre>
                <code>
                  <span className="tok-punct">{"{"}</span>
                  {"\n  "}
                  <span className="tok-str">&quot;text&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">
                    &quot;The robot lives in the text.&quot;
                  </span>
                  <span className="tok-punct">,</span>
                  {"\n  "}
                  <span className="tok-str">&quot;tokens&quot;</span>
                  <span className="tok-punct">:</span>
                  {" [\n    { "}
                  <span className="tok-str">&quot;i&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-num">0</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;surf&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">&quot;The&quot;</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;lemma&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">&quot;the&quot;</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;pos&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">&quot;DET&quot;</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;span&quot;</span>
                  <span className="tok-punct">:</span>
                  {" ["}
                  <span className="tok-num">0</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-num">3</span>
                  {"] },\n    { "}
                  <span className="tok-str">&quot;i&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-num">1</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;surf&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">&quot;robot&quot;</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;lemma&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">&quot;robot&quot;</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;pos&quot;</span>
                  <span className="tok-punct">:</span>{" "}
                  <span className="tok-str">&quot;NOUN&quot;</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-str">&quot;span&quot;</span>
                  <span className="tok-punct">:</span>
                  {" ["}
                  <span className="tok-num">4</span>
                  <span className="tok-punct">,</span>{" "}
                  <span className="tok-num">9</span>
                  {"] }\n    "}
                  <span className="tok-cmt">{"// …"}</span>
                  {"\n  ]\n"}
                  <span className="tok-punct">{"}"}</span>
                </code>
              </pre>
            </figure>
          </div>
        </div>
      </section>

      <section
        id="api"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
            02 · api · three verbs
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Reference, not a playground
          </h2>
          <p className="mt-3 max-w-2xl text-ink-mute">
            Tabs are radio buttons. Samples are static. Pick a verb; read the
            signature and a printed call.
          </p>
        </div>

        <div className="api-switch relative mx-auto mt-8 max-w-docs">
          <input
            className="api-radio"
            type="radio"
            name="api-tab"
            id="tab-parse"
            defaultChecked
          />
          <input
            className="api-radio"
            type="radio"
            name="api-tab"
            id="tab-embed"
          />
          <input
            className="api-radio"
            type="radio"
            name="api-tab"
            id="tab-similar"
          />

          <div className="tab-bar flex flex-wrap gap-2">
            <label
              htmlFor="tab-parse"
              className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink"
            >
              parse()
            </label>
            <label
              htmlFor="tab-embed"
              className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink"
            >
              embed()
            </label>
            <label
              htmlFor="tab-similar"
              className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink"
            >
              similar()
            </label>
          </div>

          <div className="panels mt-4">
            <article id="panel-parse" className="panel">
              <p className="sig mb-3">
                parse(text: string, opts?: {"{ lang?: string }"}): Doc
              </p>
              <figure className="code-window">
                <div className="code-chrome">
                  <span className="dot live" aria-hidden="true" />
                  <span>parse.ts</span>
                </div>
                <pre>
                  <code>
                    <span className="tok-kw">const</span> doc ={" "}
                    <span className="tok-fn">parse</span>
                    <span className="tok-punct">(</span>
                    {"\n  "}
                    <span className="tok-str">
                      &quot;The robot lives in the text.&quot;
                    </span>
                    <span className="tok-punct">,</span>
                    {"\n  { lang: "}
                    <span className="tok-str">&quot;en&quot;</span>
                    {" }\n"}
                    <span className="tok-punct">);</span>
                    {"\n\n"}
                    <span className="tok-fn">console</span>
                    <span className="tok-punct">.</span>
                    <span className="tok-fn">log</span>
                    <span className="tok-punct">(</span>
                    {"doc.tokens.map(t => t.pos)"}
                    <span className="tok-punct">);</span>
                    {"\n"}
                    <span className="tok-cmt">
                      {"// [DET, NOUN, VERB, ADP, DET, NOUN, PUNCT]"}
                    </span>
                  </code>
                </pre>
              </figure>
            </article>

            <article id="panel-embed" className="panel">
              <p className="sig mb-3">
                embed(doc: Doc | string, opts?: {"{ model?: string }"}):
                Promise{"<Float32Array>"}
              </p>
              <figure className="code-window">
                <div className="code-chrome">
                  <span className="dot live" aria-hidden="true" />
                  <span>embed.ts · 384-d preview</span>
                </div>
                <pre>
                  <code>
                    <span className="tok-kw">const</span> vec ={" "}
                    <span className="tok-kw">await</span>{" "}
                    <span className="tok-fn">embed</span>
                    <span className="tok-punct">(</span>
                    {"doc, {\n  model: "}
                    <span className="tok-str">&quot;semtext-mini&quot;</span>
                    {",\n  pooling: "}
                    <span className="tok-str">&quot;mean&quot;</span>
                    {"\n}"}
                    <span className="tok-punct">);</span>
                    {"\n\n"}
                    <span className="tok-cmt">{"// printed slice"}</span>
                    {"\n"}
                    <span className="tok-fn">Array</span>
                    <span className="tok-punct">.</span>
                    <span className="tok-fn">from</span>
                    <span className="tok-punct">(</span>
                    {"vec.slice("}
                    <span className="tok-num">0</span>
                    <span className="tok-punct">,</span>{" "}
                    <span className="tok-num">6</span>
                    {")"}
                    <span className="tok-punct">)</span>
                    {"\n"}
                    <span className="tok-cmt">
                      {"// [0.118, -0.442, 0.807, 0.051, -0.190, 0.334]"}
                    </span>
                  </code>
                </pre>
              </figure>
            </article>

            <article id="panel-similar" className="panel">
              <p className="sig mb-3">
                similar(query: Float32Array, corpus: Corpus, opts?: {"{ k?: number; metric?: \"cosine\" }"}): Hit[]
              </p>
              <figure className="code-window">
                <div className="code-chrome">
                  <span className="dot live" aria-hidden="true" />
                  <span>similar.ts · k=4</span>
                </div>
                <pre>
                  <code>
                    <span className="tok-kw">const</span> hits ={" "}
                    <span className="tok-fn">similar</span>
                    <span className="tok-punct">(</span>
                    {"vec, corpus, {\n  k: "}
                    <span className="tok-num">4</span>
                    {",\n  metric: "}
                    <span className="tok-str">&quot;cosine&quot;</span>
                    {"\n}"}
                    <span className="tok-punct">);</span>
                    {"\n\n"}
                    {HITS.map(
                      (h) =>
                        `// ${h.id}  ${h.score}  ${h.text}\n`,
                    ).join("")}
                  </code>
                </pre>
              </figure>
            </article>
          </div>
        </div>
      </section>

      <section
        id="pipeline"
        className="border-b border-white/10 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-docs">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
            03 · pipeline
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Text in. Neighbors out.
          </h2>
          <p className="mt-3 max-w-2xl text-ink-mute">
            Four stages, always in this order. Nothing on this page executes —
            the pipeline is the documentation.
          </p>

          <ol className="pipe mt-10">
            <li className="pipe-step">
              <p className="n">01 SOURCE</p>
              <h3 className="mt-2 font-mono text-sm text-ink">raw string</h3>
              <p className="mt-2 text-sm text-ink-mute">
                UTF-8 in. No HTML strip here — pass clean text.
              </p>
            </li>
            <li className="pipe-step">
              <p className="n">02 PARSE</p>
              <h3 className="mt-2 font-mono text-sm text-ink">tokens + spans</h3>
              <p className="mt-2 text-sm text-ink-mute">
                POS, lemma, character offsets. Content words weighted later.
              </p>
            </li>
            <li className="pipe-step">
              <p className="n">03 EMBED</p>
              <h3 className="mt-2 font-mono text-sm text-ink">semtext-mini</h3>
              <p className="mt-2 text-sm text-ink-mute">
                Mean-pool token vectors into 384 floats. L2-normalized.
              </p>
            </li>
            <li className="pipe-step">
              <p className="n">04 SIMILAR</p>
              <h3 className="mt-2 font-mono text-sm text-ink">cosine / k</h3>
              <p className="mt-2 text-sm text-ink-mute">
                Rank the corpus. Return ids, scores, and original strings.
              </p>
            </li>
          </ol>

          <div className="mt-12 grid items-center gap-8 lg:grid-cols-2">
            <figure>
              <picture>
                <source srcSet="/assets/hero.webp" type="image/webp" />
                <img
                  src="/assets/hero.jpg"
                  alt="A small black-and-silver robot on a dark desk holds glowing API nodes while tablets around it show docs, code, a schema graph, and telemetry."
                  width={1280}
                  height={720}
                  className="w-full rounded-xl border border-code-border"
                />
              </picture>
            </figure>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-soft">
                graph of meaning
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Docs, schema, and the query live on one desk
              </h3>
              <p className="mt-4 leading-relaxed text-ink-mute">
                The robot does not improvise the lexicon. It hangs ENDPOINT,
                AUTH, SCHEMA, QUERY, and DOCS in a constellation, then walks
                the edges. semtext is that walk: parse the node labels, embed
                the edges, retrieve the neighbor that actually meant the same
                thing.
              </p>
              <p className="mt-4 font-mono text-sm text-violet-soft">
                cosine(q, d0) = 0.91
              </p>
            </div>
          </div>

          <figure className="mt-12">
            <picture>
              <source srcSet="/assets/accent.webp" type="image/webp" />
              <img
                src="/assets/accent.jpg"
                alt="A desk-scale robot composes a constellation of labeled API nodes—ENDPOINT, AUTH, SCHEMA, WEBHOOK, QUERY, DOCS—beside tablets of documentation and bar-chart telemetry."
                width={1280}
                height={720}
                className="w-full rounded-xl border border-code-border"
              />
            </picture>
          </figure>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
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
            Printed samples. No eval.
          </h2>
          <p className="mt-4 leading-relaxed text-ink-mute">
            No package to install from this page. No snippet runner. The API is
            the documentation: parse, embed, similar — already on the glass.
          </p>
          <a
            href="https://therobotlives.com"
            className="mt-8 inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            The Robot Lives
          </a>
        </div>
      </section>
    </main>
  );
}
