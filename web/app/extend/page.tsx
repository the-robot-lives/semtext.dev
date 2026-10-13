import type { Metadata } from "next";
import { VocabProposalWizard, VocabScaffoldWizard } from "@/components/extend-wizard";

export const metadata: Metadata = {
  title: "Extend — SemText",
  description:
    "Extend SemText with your own vocabulary: a step-by-step scaffold for a namespace — vocabulary base, light-DOM elements, manifest and hosted-lazy loader — plus the proposal path for adding a vocabulary upstream.",
  alternates: { canonical: "https://semtext.dev/extend/" },
};

/*
 * The Extend page — two paths, one page:
 *
 *   1. Your own vocabulary, today: a namespace the core never needs to
 *      know about, following the spec's hosted-lazy contract. The wizard
 *      generates the five files; an agent (or a human) copies them out.
 *   2. A vocabulary for everyone: propose the element upstream. The wizard
 *      drafts the proposal and opens it as a prefilled GitHub issue on
 *      noizu-labs-ml/npl-enhanced-content — the spec's repository. (Submit
 *      target per the docs-overhaul brief; pending a user decision.)
 *
 * The generators are client components (components/extend-wizard.tsx);
 * this page is the static frame and the steps copy.
 */

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${n}-h`} className="mt-10 scroll-mt-24">
      <h3
        id={`step-${n}-h`}
        className="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink"
      >
        <span
          aria-hidden="true"
          className="font-mono text-sm text-violet-soft"
        >
          {n}
        </span>
        {title}
      </h3>
      <div className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
        {children}
      </div>
    </section>
  );
}

export default function ExtendPage() {
  return (
    <div className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p className="g-eyebrow">Platform</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Extend the vocabulary
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          SemText is a vocabulary, not a framework: an element is a custom
          element with an agreed contract, and a namespace is a set of them
          plus a loader. Nothing in the core needs to change for{" "}
          <code className="font-mono">&lt;yelp-sem-org-chart&gt;</code> or{" "}
          <code className="font-mono">&lt;yelp-sem-system-status&gt;</code> to
          work in a served document. Two paths below — keep your vocabulary
          private, or propose it upstream.
        </p>

        <h2
          id="own-vocabulary"
          className="mt-14 scroll-mt-24 border-t border-white/10 pt-10 text-2xl font-semibold tracking-tight text-ink"
        >
          Your own vocabulary, today
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          Five files, generated for your namespace below. Each step says what
          an agent should produce or check; the wizard fills in the artifacts.
        </p>

        <Step n="1" title="Name the namespace and its elements">
          <p>
            A namespace prefix keeps your tags out of the core&apos;s way:{" "}
            <code className="font-mono">yelp-sem-org-chart</code>, not{" "}
            <code className="font-mono">sem-org-chart</code>. Custom-element
            names must contain a hyphen and stay lowercase — the generator
            validates and prefixes for you.
          </p>
        </Step>

        <Step n="2" title="Generate the scaffold">
          <p>
            The vocabulary base (a block box per element before any
            definition, so the document presents without script), one
            light-DOM element per tag, the manifest, the loader, and a demo
            page. Copy each file out as generated.
          </p>
          <div className="mt-5">
            <VocabScaffoldWizard />
          </div>
        </Step>

        <Step n="3" title="Host it and load the loader">
          <p>
            Serve the directory over HTTP(S) and put one{" "}
            <code className="font-mono">&lt;script src="./your-ns-lazy.js"&gt;</code>{" "}
            on the page. The loader scans the document for its namespace&apos;s
            tags and imports only the chunks those tags need — components not
            on the page never download, and a failed chunk degrades only its
            own elements to authored prose with a{" "}
            <code className="font-mono">role="alert"</code> note. That is the
            spec&apos;s hosted-lazy contract (§7) applied to your namespace.
          </p>
        </Step>

        <Step n="4" title="Verify the degradation">
          <p>
            Load the page with scripts off: every element shows its authored
            content, nothing hidden, the record intact. Then load it with
            scripts on and confirm the upgrade markers land. A vocabulary
            that fails either check is not done.
          </p>
        </Step>

        <h2
          id="propose-upstream"
          className="mt-14 scroll-mt-24 border-t border-white/10 pt-10 text-2xl font-semibold tracking-tight text-ink"
        >
          Propose it upstream
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          A vocabulary earns a place in the core when the need is shared. The
          proposal needs the element&apos;s name, a one-line summary, why the
          existing vocabulary cannot express it, its options, and a worked
          example — the drafter shapes that into a prefilled issue on{" "}
          <code className="font-mono">noizu-labs-ml/npl-enhanced-content</code>,
          the spec&apos;s repository.
        </p>
        <div className="mt-5 max-w-3xl">
          <VocabProposalWizard />
        </div>
      </main>
    </div>
  );
}
