defmodule SemtextWeb.Hologram.Components.Landing.AddonsCarousel do
  @moduledoc """
  Integrations carousel (port of Next.js `components/addons-carousel.tsx`).

  One card per integration, each with a mock of the surface the integration
  would put on a page — an embedded ticket, a knowledge-base answer, a
  course panel, a scored quiz, a Draftamo UML render, a filed issue. No
  status chips: an integration is wired to its real logic as it is built,
  and until then the mocks are illustrations of planned output, not
  screenshots of shipped product — nothing in them is a claim of
  availability.

  This component is FULLY STATIC — no client state, no actions. The
  previous on_hydrated/index-state version broke two ways: the component
  never defined a client `init/2`, so hydrated actions met empty state
  (ArithmeticError on nil arithmetic) and every control click died; and
  every state flip re-rendered the track. All behaviour lives in
  `/js/landing-bootstrap.js` behind delegated listeners on the
  `[data-carousel-autoplay]` region: prev/next wrap, the dots jump,
  left/right arrows work while focus is inside the region, the track
  advances every 4 seconds (pausing on hover, focus and hidden tabs, and
  never starting for prefers-reduced-motion readers), and the status line
  plus `aria-hidden` flags follow the index.

  Zero-JS: the server HTML stacks all six cards in document order; the
  controls carry the `js-only` class and stay hidden (`html.sem-booting
  .js-only { display: none }` — landing-bootstrap removes `sem-booting`
  when it runs), so a scripts-off reader gets a plain list and nothing
  promises interaction. The card mocks are static template markup,
  unrolled per card (six branches), so no string building or dynamic
  component dispatch is needed anywhere.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <div
      data-carousel-autoplay="true"
      role="region"
      aria-roledescription="carousel"
      aria-label="Integration cards"
      tabindex="0"
      class="mt-8 max-w-4xl"
    >
      <div class="relative">
      <div class="overflow-hidden">
        <ul data-carousel-track="true" class="flex items-stretch flex-col gap-4">
          <li data-carousel-card="0">
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-ticket-embedding-h">
              <h3 id="addon-ticket-embedding-h" class="text-lg font-semibold text-ink">Ticket embedding</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">An account key enables ticket embedding — live tickets from your tracker, cited inline like any other datum.</p>
              <div class="mt-4">
                <div class="overflow-hidden rounded-lg border border-code-border bg-slateink">
                  <div class="flex items-center gap-2 border-b border-code-border px-3 py-2 font-mono text-[0.65rem] text-ink-faint">
                    <span class="inline-block h-2 w-2 rounded-full bg-violet" aria-hidden="true"></span>
                    embed.semtext.dev/tickets?account=key_live_7f3k9x
                  </div>
                  <div class="p-3">
                    <p class="font-mono text-xs text-violet-soft">TRK-241 · open</p>
                    <p class="mt-1 text-sm text-ink">Streak reset wipes a completed quiz score</p>
                    <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">assigned @dana · tagged semtext · cited inline from your tracker</p>
                  </div>
                </div>
              </div>
            </article>
          </li>
          <li data-carousel-card="1">
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-the-robot-knows-h">
              <h3 id="addon-the-robot-knows-h" class="text-lg font-semibold text-ink">The Robot Knows hookup</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">Point a document at your knowledge base, so facts and procedures draw on live KB entries.</p>
              <div class="mt-4">
                <div class="rounded-lg border border-code-border bg-slateink p-3">
                  <p class="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">KB-118 · account keys · v3</p>
                  <p class="mt-2 text-sm font-medium text-ink">What does an account key unlock?</p>
                  <p class="mt-1 text-sm leading-relaxed text-ink-mute">Embedding — tickets, quizzes and course progress render inside your documents; the reading core stays open.</p>
                  <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">source: The Robot Knows · entry cited on the fact</p>
                </div>
              </div>
            </article>
          </li>
          <li data-carousel-card="2">
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-the-robot-learns-h">
              <h3 id="addon-the-robot-learns-h" class="text-lg font-semibold text-ink">The Robot Learns courses</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">Courses load as SemText and track each reader's quiz progress; sign-in is prompted when tracking starts.</p>
              <div class="mt-4">
                <div class="rounded-lg border border-code-border bg-slateink p-3">
                  <p class="font-mono text-xs text-violet-soft">course · Working with SemText</p>
                  <div class="mt-2 h-1 rounded bg-code" role="presentation">
                    <div class="h-1 w-2/5 rounded bg-violet"></div>
                  </div>
                  <ol class="mt-2 space-y-1 font-mono text-[0.68rem] text-ink-mute">
                    <li>1 · documents &amp; records — done</li>
                    <li class="text-ink">2 · reading views — current</li>
                    <li>3 · extraction — up next</li>
                  </ol>
                  <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">progress tracked per reader · sign-in prompted on start</p>
                </div>
              </div>
            </article>
          </li>
          <li data-carousel-card="3">
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-embedded-quizzes-h">
              <h3 id="addon-embedded-quizzes-h" class="text-lg font-semibold text-ink">Private &amp; public quizzes</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">Private exams and quizzes from The Robot Learns embed in your pages, beside a public catalogue of embedded quizzes.</p>
              <div class="mt-4">
                <div class="rounded-lg border border-code-border bg-slateink p-3">
                  <p class="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">quiz · public catalogue</p>
                  <p class="mt-2 text-sm font-medium text-ink">Which attribute selects an alternate rendering?</p>
                  <ul class="mt-2 space-y-1 font-mono text-[0.68rem] text-ink-mute">
                    <li>a · key</li>
                    <li class="text-violet-soft">b · view-as — correct</li>
                    <li>c · role</li>
                  </ul>
                  <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">scores in place · private exams use the same embed</p>
                </div>
              </div>
            </article>
          </li>
          <li data-carousel-card="4">
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-draftamo-renders-h">
              <h3 id="addon-draftamo-renders-h" class="text-lg font-semibold text-ink">Draftamo mockups &amp; UML</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">Mockups and UML renders from Draftamo-hosted projects, or from local Draftamo XML.</p>
              <div class="mt-4">
                <div class="rounded-lg border border-code-border bg-slateink p-3">
                  <svg viewBox="0 0 330 66" role="img" aria-label="UML render: sem-doc to reader to records" class="w-full">
                    <g fill="none" stroke="var(--code-border)" stroke-width="1">
                      <rect x="4" y="18" width="90" height="30" rx="6"></rect>
                      <rect x="120" y="18" width="90" height="30" rx="6"></rect>
                      <rect x="236" y="18" width="90" height="30" rx="6"></rect>
                    </g>
                    <g fill="var(--ink-mute)" font-size="10" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">
                      <text x="49" y="37">sem-doc</text>
                      <text x="165" y="37">reader</text>
                      <text x="281" y="37">records</text>
                    </g>
                    <g stroke="var(--accent)" stroke-width="1" fill="none">
                      <path d="M94 33 H116"></path>
                      <path d="M116 33 l-5 -3 v6 z" fill="var(--accent)"></path>
                      <path d="M210 33 H232"></path>
                      <path d="M232 33 l-5 -3 v6 z" fill="var(--accent)"></path>
                    </g>
                  </svg>
                  <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">checkout-flow.uml · rendered by Draftamo</p>
                </div>
              </div>
            </article>
          </li>
          <li data-carousel-card="5">
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-issue-submission-h">
              <h3 id="addon-issue-submission-h" class="text-lg font-semibold text-ink">The Robot Plans issue submission</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">Submit an issue from the page itself — The Robot Plans files it in Jira, ClickUp, or GitHub.</p>
              <div class="mt-4">
                <div class="rounded-lg border border-code-border bg-slateink p-3">
                  <p class="font-mono text-xs text-violet-soft">SEM-312 · Integration carousel keyboard focus ring</p>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <span class="g-status">integrations</span>
                    <span class="g-status">enhancement</span>
                  </div>
                  <p class="mt-2 text-sm leading-relaxed text-ink-mute">Reported from this page — reporter, page section and build attached automatically.</p>
                  <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">filed via embedded form → The Robot Plans (GitHub)</p>
                </div>
              </div>
            </article>
          </li>
        </ul>
      </div>
      <button
        type="button"
        data-carousel-prev="true"
        aria-label="Previous integration"
        class="js-only absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-code-border bg-slateink font-mono text-base text-ink shadow-md hover:border-violet-soft"
      >
        ‹
      </button>
      <button
        type="button"
        data-carousel-next="true"
        aria-label="Next integration"
        class="js-only absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-code-border bg-slateink font-mono text-base text-ink shadow-md hover:border-violet-soft"
      >
        ›
      </button>
      </div>

      <div class="js-only mt-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-carousel-prev="true"
            aria-label="Previous integration"
            class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
          >
            ← prev
          </button>
          <button
            type="button"
            data-carousel-next="true"
            aria-label="Next integration"
            class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
          >
            next →
          </button>
        </div>
        <div class="flex items-center gap-2" data-carousel-dots="true">
          <button type="button" data-carousel-go="0" aria-label="Go to card 1: Ticket embedding" class="h-2.5 w-2.5 rounded-full bg-code-border"></button>
          <button type="button" data-carousel-go="1" aria-label="Go to card 2: The Robot Knows hookup" class="h-2.5 w-2.5 rounded-full bg-code-border"></button>
          <button type="button" data-carousel-go="2" aria-label="Go to card 3: The Robot Learns courses" class="h-2.5 w-2.5 rounded-full bg-code-border"></button>
          <button type="button" data-carousel-go="3" aria-label="Go to card 4: Private &amp; public quizzes" class="h-2.5 w-2.5 rounded-full bg-code-border"></button>
          <button type="button" data-carousel-go="4" aria-label="Go to card 5: Draftamo mockups &amp; UML" class="h-2.5 w-2.5 rounded-full bg-code-border"></button>
          <button type="button" data-carousel-go="5" aria-label="Go to card 6: The Robot Plans issue submission" class="h-2.5 w-2.5 rounded-full bg-code-border"></button>
        </div>
        <p aria-live="off" data-carousel-status="true" class="font-mono text-xs text-ink-faint">
          1 / 6 — Ticket embedding
        </p>
      </div>
    </div>
    """
  end
end
