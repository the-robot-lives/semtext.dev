import type { Metadata } from "next";
import { ExampleViewer } from "@/components/example-viewer";
import {
  ShowcaseFooter,
  ShowcaseFrame,
} from "@/components/showcase-page";

export const metadata: Metadata = {
  title: "CLAUDE.md — SemText showcase",
  description:
    "Repo guidance as a SemText document: the agent record, the procedure and the invariants an agent must keep — one file the model reads and a contributor browses.",
  alternates: { canonical: "https://semtext.dev/showcase/claude-md/" },
};

/*
 * Every element below is spec vocabulary (spec/conventions.md §5): the
 * bare agent record and its name/bio/instructions parts, sem-note,
 * sem-procedure/sem-step and sem-facts/sem-fact. The viewer renders it
 * with the site's fallback bundle — the same file, no second source.
 */

const EXAMPLE = `<sem-enhanced-document>
  <agent>
    <name>Repo Guide</name>
    <bio>Answers build and release questions for this repository.</bio>
    <instructions>Answer only from the sem-fact records on this page; cite fact ids. Never invent commands.</instructions>
  </agent>

  <h1 data-kind="title">Contributor guide</h1>

  <sem-note variant="warning">Never push to <code>main</code> by hand — CI owns it.</sem-note>

  <h2>Build</h2>
  <sem-procedure kind="runbook" role="list">
    <sem-step role="listitem" status="done">Install dependencies</sem-step>
    <sem-step role="listitem" status="current">Run the dev server</sem-step>
    <sem-step role="listitem">Build before every PR</sem-step>
  </sem-procedure>

  <h2>Invariants</h2>
  <sem-facts view-as="list" controls="filter">
    <sem-fact id="g-main" kind="invariant">
      <statement>main is CI/CD-only</statement>
      <conclusion>All merges into main are performed by automation; humans and agents merge to develop.</conclusion>
    </sem-fact>
    <sem-fact id="g-tests" kind="invariant">
      <statement>Tests run against built pages</statement>
      <conclusion>Run the build before the suite — the specs read the built output, not the sources.</conclusion>
    </sem-fact>
  </sem-facts>
</sem-enhanced-document>`;

export default function ClaudeMdShowcasePage() {
  return (
    <ShowcaseFrame
      slug="claude-md"
      title="CLAUDE.md, in one file for every reader"
      lede={
        <>
          Repository guidance is written once and read twice: an agent needs
          the rules as records it can quote, a contributor needs a page they
          can skim. As SemText, the same file is both — the{" "}
          <code className="font-mono">agent</code> record carries the
          name, bio and instructions a model follows, while the procedure and
          fact blocks are the same guidance rendered as this page. Point the
          agent at the file; hand the human the URL.
        </>
      }
      sections={[
        { id: "example", label: "The document" },
        { id: "why", label: "Why this works" },
      ]}
    >
      <section id="example" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Switch to <em>Render</em> to read it as a contributor does; the
          source is the same file the agent consumes. The facts carry ids, so
          an answer can cite <code className="font-mono">g-main</code> the way
          the instructions require.
        </p>
        <ExampleViewer name="claude-md" code={EXAMPLE} renderable={true} />
      </section>

      <section id="why" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul className="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            The <code className="font-mono">agent</code> record is
            machine-facing metadata — extraction names it a record; the
            browser leaves it invisible.
          </li>
          <li>
            <code className="font-mono">sem-procedure</code> statuses
            (done / current / blocked) are canonical attributes, so both
            readers agree on where the process stands.
          </li>
          <li>
            With scripts off nothing is hidden — the guidance reads as plain
            authored text, the record intact.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code className="font-mono">agent</code>,{" "}
        <code className="font-mono">sem-note</code>,{" "}
        <code className="font-mono">sem-procedure</code>,{" "}
        <code className="font-mono">sem-facts</code>. Their contracts live on{" "}
        <a href="/reference/" className="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
  );
}
