import type { Metadata } from "next";
import Script from "next/script";
import { DocsShell, Sem } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "Data visualizer — SemText showcase",
  description:
    "The sem-data-visualizer family live: tables from inline Markdown, CSV and YAML sources, per-column typed sort, named views, a declarative join, and an editable default query — served by the reading bundle.",
  alternates: { canonical: "https://semtext.dev/dataviz/" },
};

/*
 * The data visualizer is part of the SemText reading bundle
 * (semtext-reading.js, built by noizu-labs-ml/npl-enhanced-content,
 * feat/data-viz-phase6). The copy under /dataviz/ loads and auto-wires the
 * whole document; the markup below is authored SemText exactly as the spec
 * (spec/data-visualizer.md) and the project's own demo page define it —
 * nothing on this page is bespoke visualizer code.
 *
 * vocabulary.css is the project's themes/_vocabulary.css with the same
 * [data-sem-theme] body-paint patch public/semtext/themes/ carries (see
 * public/semtext/VERSION.md); the theme tokens themselves come from the
 * global minimal-tech-light.css the layout already loads, activated by the
 * Sem wrapper's data-sem-theme attribute.
 */

const FLEET = `<sem-data-visualizer id="dv-fleet">
  <sem-data-source data-name="Fleet" data-views="all=*; operators=name, replicas" data-view="all">| name   | region | port | replicas |
|--------|--------|------|----------|
| auth   | eu     | 8080 | 3        |
| billing| us     | 8443 | 2        |
| pages  | ap     | 3000 | 2        |
| search | eu     | 9200 | 5        |</sem-data-source>
</sem-data-visualizer>`;

const OPS = `<sem-data-visualizer id="dv-ops">
  <sem-data-source data-name="Services" source="data/services.csv"></sem-data-source>
  <sem-data-source data-name="Regions" source="data/regions.yaml"></sem-data-source>
  <sem-data-join data-name="Service Regions" data-left="Services" data-right="Regions" data-on="region"></sem-data-join>
  <sem-data-query>SELECT name, port, zone, latency_ms FROM service-regions ORDER BY latency_ms DESC</sem-data-query>
</sem-data-visualizer>`;

export default function DataVizPage() {
  return (
    <DocsShell active="showcase-data-visualizer">
      <main id="main">
        <p className="g-eyebrow">Showcase</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Data visualizer
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          Tables that live inside the document: authored as plain SemText
          (<code className="font-mono">sem-data-visualizer</code>,{" "}
          <code className="font-mono">sem-data-source</code>,{" "}
          <code className="font-mono">sem-data-join</code>,{" "}
          <code className="font-mono">sem-data-query</code> — see{" "}
          <a className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70" href="/reference/#sem-data-visualizer">
            the tag reference
          </a>
          ), rendered and wired by the reading bundle. Sort any column, switch
          views, edit the query — everything below is the bundle&apos;s own
          chrome over authored markup, served from this site at{" "}
          <code className="font-mono">/dataviz/semtext-reading.js</code>.
        </p>

        <h2 id="views" className="mt-12 text-xl font-semibold tracking-tight text-ink">
          Inline source, named views
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          One visualizer, one inline Markdown table: per-column typed sort on
          every header, an <code className="font-mono">aria-pressed</code> view
          switch for the declared views (<code className="font-mono">all</code>,{" "}
          <code className="font-mono">operators</code>), and the expand /
          copy-link chrome — the container id makes it deep-linkable
          (<code className="font-mono">#dv=dv-fleet&amp;view=…</code>) and the
          modal opens the same rendered view full-page.
        </p>
        <Sem html={FLEET} className="mt-5" />

        <h2 id="join-query" className="mt-12 text-xl font-semibold tracking-tight text-ink">
          Files, a declarative join, the editable query
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          One visualizer, the whole story: two buckets fetched from files next
          to this page (CSV and YAML), a{" "}
          <code className="font-mono">sem-data-join</code> composing them on
          the named key column, and the editable default query reading the
          joined bucket — the results re-run as you type (debounced), and the
          edited statement deep-links too
          (<code className="font-mono">#dv=dv-ops&amp;q=…</code>). The authored
          query text is never rewritten: edits are session-only.
        </p>
        <Sem html={OPS} className="mt-5" />

        <p className="mt-10 max-w-3xl text-sm leading-6 text-ink-faint">
          With scripts off both sources read as pre-wrapped authored text —
          the document is the record; the chrome is presentation.
        </p>
      </main>
      <link
        rel="stylesheet"
        precedence="semtext-dataviz"
        href="/dataviz/vocabulary.css"
      />
      <Script src="/dataviz/semtext-reading.js" strategy="afterInteractive" />
    </DocsShell>
  );
}
