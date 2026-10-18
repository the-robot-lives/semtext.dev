import type { Metadata } from "next";
import { ExampleViewer } from "@/components/example-viewer";
import {
  ShowcaseFooter,
  ShowcaseFrame,
} from "@/components/showcase-page";
import { bundlesFor } from "@/data/reference-tags";

/*
 * The shipped bundle files this example's tags render through (sem-progress,
 * sem-procedure/sem-step and sem-facts all ride semtext-lazy.js — deduped by
 * file+chunk so the viewer loads the lazy loader once and both chunks).
 * Without them the render pane never wires a runtime: the flashcards stay
 * un-upgraded markup (SEMTEX-013).
 */
const BUNDLES = [
  ...new Map(
    ["sem-progress", "sem-procedure", "sem-step", "sem-facts", "sem-fact"]
      .flatMap((t) => bundlesFor(t)?.bundles ?? [])
      .map((b) => [`${b.file}:${b.chunk ?? ""}`, b] as const),
  ).values(),
];

export const metadata: Metadata = {
  title: "Onboarding — SemText showcase",
  description:
    "An onboarding checklist in SemText: a status-annotated procedure, a completion meter and the facts a new contributor keeps — the checklist reads, and tracks itself.",
  alternates: { canonical: "https://semtext.dev/showcase/onboarding/" },
};

/*
 * Spec vocabulary used: sem-progress (value/label + meter roles),
 * sem-procedure/sem-step with statuses, sem-facts with an incorrect statement in
 * flashcards view.
 */

const EXAMPLE = `<sem-enhanced-document>
  <h1 data-kind="title">First week</h1>

  <sem-progress value="0.4" label="checklist" role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.4"></sem-progress>

  <sem-procedure kind="checklist" role="list">
    <sem-step role="listitem" status="done">Read the contributor guide</sem-step>
    <sem-step role="listitem" status="done">Get repository access</sem-step>
    <sem-step role="listitem" status="current">Ship a first change behind a feature branch</sem-step>
    <sem-step role="listitem">Pair on a review</sem-step>
    <sem-step role="listitem" status="blocked">Deploy shadowing — waits on the access audit</sem-step>
  </sem-procedure>

  <h2>Facts worth keeping</h2>
  <sem-facts view-as="flashcards">
    <sem-fact id="ob-branch">
      <statement>Where does feature work live?</statement>
      <conclusion>In a worktree under .claude/worktrees/, forked from develop.</conclusion>
    </sem-fact>
    <sem-fact id="ob-main">
      <statement>Who merges to main?</statement>
      <conclusion>CI only — the release path is automated.</conclusion>
      <incorrect-statement>The latest reviewer merges it by hand.</incorrect-statement>
    </sem-fact>
  </sem-facts>
</sem-enhanced-document>`;

export default function OnboardingShowcasePage() {
  return (
    <ShowcaseFrame
      slug="onboarding"
      title="Onboarding: a checklist that reads and tracks"
      lede={
        <>
          Onboarding material decays fastest when it lives in three places:
          the checklist in a doc, the facts in a wiki, the quiz in a form. In
          one SemText document the procedure carries its statuses, the meter
          carries the score, and the facts double as flashcards — the same
          file the new contributor reads is the one a model can quiz them
          from.
        </>
      }
      sections={[{ id: "example", label: "The document" }]}
    >
      <section id="example" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Render it and flip the flashcards: front is the statement, back the
          conclusion, and the incorrect statement on{" "}
          <code className="font-mono">ob-main</code> joins the quiz options
          when the deck is switched to quiz view.
        </p>
        <ExampleViewer
          name="onboarding"
          code={EXAMPLE}
          renderable={true}
          bundles={BUNDLES}
        />
      </section>

      <ShowcaseFooter>
        Elements used: <code className="font-mono">sem-progress</code>,{" "}
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
