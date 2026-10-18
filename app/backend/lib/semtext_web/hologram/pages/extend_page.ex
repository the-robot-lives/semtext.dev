defmodule SemtextWeb.Hologram.Pages.ExtendPage do
  @moduledoc """
  /extend/ — port of the Next site's `app/extend/page.tsx`: two paths, one
  page.

    1. Your own vocabulary, today: a namespace the core never needs to know
       about, following the spec's hosted-lazy contract. The wizard
       generates the five files; an agent (or a human) copies them out.
    2. A vocabulary for everyone: propose the element upstream. The wizard
       drafts the proposal and opens it as a prefilled GitHub issue on
       noizu-labs-ml/npl-enhanced-content — the spec's repository.

  The generators are the `Site.VocabScaffoldWizard` and
  `Site.VocabProposalWizard` components; this page is the static frame and
  the steps copy. (The Next `Step` helper's section markup is inlined per
  step here — same ids, classes and structure.)
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Components.Site.VocabProposalWizard
  alias SemtextWeb.Hologram.Components.Site.VocabScaffoldWizard
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/extend"
  layout SiteLayout,
    page_title: "Extend — SemText",
    description:
      "Extend SemText with your own vocabulary: a step-by-step scaffold for a namespace — vocabulary base, light-DOM elements, manifest and hosted-lazy loader — plus the proposal path for adding a vocabulary upstream.",
    canonical: "https://semtext.dev/extend/"

  def template do
    ~HOLO"""
    <div class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p class="g-eyebrow">Platform</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Extend the vocabulary
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          SemText is a vocabulary, not a framework: an element is a custom
          element with an agreed contract, and a namespace is a set of them
          plus a loader. Nothing in the core needs to change for{" "}
          <code class="font-mono">&lt;yelp-sem-org-chart&gt;</code> or{" "}
          <code class="font-mono">&lt;yelp-sem-system-status&gt;</code> to
          work in a served document. Two paths below — keep your vocabulary
          private, or propose it upstream.
        </p>

        <h2
          id="own-vocabulary"
          class="mt-14 scroll-mt-24 border-t border-white/10 pt-10 text-2xl font-semibold tracking-tight text-ink"
        >
          Your own vocabulary, today
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          Five files, generated for your namespace below. Each step says what
          an agent should produce or check; the wizard fills in the artifacts.
        </p>

        <section aria-labelledby="step-1-h" class="mt-10 scroll-mt-24">
          <h3
            id="step-1-h"
            class="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink"
          >
            <span aria-hidden="true" class="font-mono text-sm text-violet-soft">1</span>
            Name the namespace and its elements
          </h3>
          <div class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
            <p>
              A namespace prefix keeps your tags out of the core's way:{" "}
              <code class="font-mono">yelp-sem-org-chart</code>, not{" "}
              <code class="font-mono">sem-org-chart</code>. Custom-element
              names must contain a hyphen and stay lowercase — the generator
              validates and prefixes for you.
            </p>
          </div>
        </section>

        <section aria-labelledby="step-2-h" class="mt-10 scroll-mt-24">
          <h3
            id="step-2-h"
            class="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink"
          >
            <span aria-hidden="true" class="font-mono text-sm text-violet-soft">2</span>
            Generate the scaffold
          </h3>
          <div class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
            <p>
              The vocabulary base (a block box per element before any
              definition, so the document presents without script), one
              light-DOM element per tag, the manifest, the loader, and a demo
              page. Copy each file out as generated.
            </p>
            <div class="mt-5">
              <VocabScaffoldWizard cid="vocab_scaffold_wizard" />
            </div>
          </div>
        </section>

        <section aria-labelledby="step-3-h" class="mt-10 scroll-mt-24">
          <h3
            id="step-3-h"
            class="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink"
          >
            <span aria-hidden="true" class="font-mono text-sm text-violet-soft">3</span>
            Host it and load the loader
          </h3>
          <div class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
            <p>
              Serve the directory over HTTP(S) and put one{" "}
              <code class="font-mono">&lt;script src="./your-ns-lazy.js"&gt;</code>{" "}
              on the page. The loader scans the document for its namespace's
              tags and imports only the chunks those tags need — components
              not on the page never download, and a failed chunk degrades only
              its own elements to authored prose with a{" "}
              <code class="font-mono">role="alert"</code> note. That is the
              spec's hosted-lazy contract (§7) applied to your namespace.
            </p>
          </div>
        </section>

        <section aria-labelledby="step-4-h" class="mt-10 scroll-mt-24">
          <h3
            id="step-4-h"
            class="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink"
          >
            <span aria-hidden="true" class="font-mono text-sm text-violet-soft">4</span>
            Verify the degradation
          </h3>
          <div class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
            <p>
              Load the page with scripts off: every element shows its authored
              content, nothing hidden, the record intact. Then load it with
              scripts on and confirm the upgrade markers land. A vocabulary
              that fails either check is not done.
            </p>
          </div>
        </section>

        <h2
          id="propose-upstream"
          class="mt-14 scroll-mt-24 border-t border-white/10 pt-10 text-2xl font-semibold tracking-tight text-ink"
        >
          Propose it upstream
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          A vocabulary earns a place in the core when the need is shared. The
          proposal needs the element's name, a one-line summary, why the
          existing vocabulary cannot express it, its options, and a worked
          example — the drafter shapes that into a prefilled issue on{" "}
          <code class="font-mono">noizu-labs-ml/npl-enhanced-content</code>,
          the spec's repository.
        </p>
        <div class="mt-5 max-w-3xl">
          <VocabProposalWizard cid="vocab_proposal_wizard" />
        </div>
      </main>
    </div>
    """
  end
end
