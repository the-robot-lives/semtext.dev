import type { Metadata } from "next";
import { ExampleViewer } from "@/components/example-viewer";
import {
  ShowcaseFooter,
  ShowcaseFrame,
} from "@/components/showcase-page";

export const metadata: Metadata = {
  title: "Command — SemText showcase",
  description:
    "A command spec in SemText: arguments as a definition list, the procedure as ordered steps, the invariants as facts — one file for the operator and the model.",
  alternates: { canonical: "https://semtext.dev/showcase/command/" },
};

/*
 * Spec vocabulary used: sem-properties/sem-property (key + role="definition"
 * + aria-label), sem-procedure/sem-step, sem-facts/sem-fact, sem-note
 * (variant="danger").
 */

const EXAMPLE = `<sem-enhanced-document>
  <h1 data-kind="title">/release</h1>
  <p>Files a release: verify the schema, merge the release branch, watch the deploy.</p>

  <sem-properties kind="arguments">
    <sem-property key="target" role="definition" aria-label="target">develop | stage | main — the branch receiving the release</sem-property>
    <sem-property key="--verify-schema" role="definition" aria-label="--verify-schema">Re-check pending changesets before merging (default: on)</sem-property>
  </sem-properties>

  <sem-procedure kind="runbook" role="list">
    <sem-step role="listitem">Verify applied changesets in the migrations table</sem-step>
    <sem-step role="listitem" status="current">Open the release PR</sem-step>
    <sem-step role="listitem">Watch checks and the deployed image</sem-step>
    <sem-step role="listitem">Back-merge main into develop</sem-step>
  </sem-procedure>

  <sem-facts view-as="list">
    <sem-fact id="rel-schema" kind="invariant">
      <statement>Schema lands before code</statement>
      <conclusion>The migration must be applied and present in the changelog table before the image deploys.</conclusion>
    </sem-fact>
  </sem-facts>

  <sem-note variant="danger">A red guard on a promotion means a back-merge is owed — never force it.</sem-note>
</sem-enhanced-document>`;

export default function CommandShowcasePage() {
  return (
    <ShowcaseFrame
      slug="command"
      title="A command spec, for the operator and the model"
      lede={
        <>
          Commands accumulate lore — arguments in one place, steps in
          another, the caution that saves you at 2am in a third. As one
          SemText document, the argument table, the ordered procedure and the
          invariants are records: an agent can execute the procedure or
          answer &ldquo;what does --verify-schema do?&rdquo; from the same
          file the operator skims.
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
          The properties block renders a definition grid (the{" "}
          <code className="font-mono">aria-label</code> repeats the key for
          assistive tech), and the procedure&apos;s{" "}
          <code className="font-mono">current</code> step shows where a run
          stands.
        </p>
        <ExampleViewer name="command" code={EXAMPLE} renderable={true} />
      </section>

      <section id="why" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul className="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code className="font-mono">sem-property</code> pairs are a closed
            set: key is the term, content is the value — a definition list,
            not a layout.
          </li>
          <li>
            <code className="font-mono">kind</code> qualifies every block
            (<code className="font-mono">arguments</code>,{" "}
            <code className="font-mono">runbook</code>,{" "}
            <code className="font-mono">invariant</code>) — the machine
            reading knows what each record is.
          </li>
          <li>
            The danger note renders beside the flow in every tier — cautions
            are content, not chrome.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code className="font-mono">sem-properties</code>,{" "}
        <code className="font-mono">sem-procedure</code>,{" "}
        <code className="font-mono">sem-facts</code>,{" "}
        <code className="font-mono">sem-note</code>. Their contracts live on{" "}
        <a href="/reference/" className="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
  );
}
