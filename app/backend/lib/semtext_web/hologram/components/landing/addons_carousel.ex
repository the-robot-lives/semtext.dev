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

  Zero-JS: the server HTML stacks all six cards in document order and the
  controls are not in the DOM at all (the same reveal-on-hydration pattern
  as the Next.js site — a `hidden` attribute would lose to the .flex
  utility in the cascade), so a scripts-off reader gets a plain list. With
  scripts on, the stack becomes a translated track driven by the prev/next
  buttons, the dots, and the left/right arrow keys while focus is inside
  the carousel. Autoplay: deliberately none — the section never moves on
  its own.

  The track transform is a single interpolated expression
  (`translateX(-index*100%)`), matching the React inline style; the card
  mocks are static template markup, unrolled per card (six branches), so
  no string building or dynamic component dispatch is needed on the
  client.
  """

  use Hologram.Component

  def init(_props, component, _server) do
    put_state(component,
      hydrated: false,
      index: 0
    )
  end

  def template do
    ~HOLO"""
    <div
      role={if @hydrated do "region" end}
      aria-roledescription={if @hydrated do "carousel" end}
      aria-label={if @hydrated do "Integration cards" end}
      tabindex={if @hydrated do 0 end}
      $key_down.arrow_right.prevent_default={action: :next}
      $key_down.arrow_left.prevent_default={action: :prev}
      class="mt-8 max-w-4xl"
    >
      <div class="overflow-hidden">
        <ul class={if @hydrated do "flex items-stretch flex-row transition-transform duration-300 ease-out" else "flex items-stretch flex-col gap-4" end} style={if @hydrated do track_transform(@index) end}>
          <li class={if @hydrated do "min-w-full px-0" end} aria-hidden={if @hydrated and @index != 0 do "true" end}>
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
          <li class={if @hydrated do "min-w-full px-0" end} aria-hidden={if @hydrated and @index != 1 do "true" end}>
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
          <li class={if @hydrated do "min-w-full px-0" end} aria-hidden={if @hydrated and @index != 2 do "true" end}>
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
          <li class={if @hydrated do "min-w-full px-0" end} aria-hidden={if @hydrated and @index != 3 do "true" end}>
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
          <li class={if @hydrated do "min-w-full px-0" end} aria-hidden={if @hydrated and @index != 4 do "true" end}>
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
          <li class={if @hydrated do "min-w-full px-0" end} aria-hidden={if @hydrated and @index != 5 do "true" end}>
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

      {%if @hydrated}
        <div class="mt-5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <button
              type="button"
              $click={action: :prev}
              disabled={@index == 0}
              aria-label="Previous integration"
              class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← prev
            </button>
            <button
              type="button"
              $click={action: :next}
              disabled={@index == 5}
              aria-label="Next integration"
              class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              next →
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" $click={action: :go, params: %{index: 0}} aria-label="Go to card 1: Ticket embedding" aria-current={if @index == 0 do "true" end} class={dot_class(@index == 0)}></button>
            <button type="button" $click={action: :go, params: %{index: 1}} aria-label="Go to card 2: The Robot Knows hookup" aria-current={if @index == 1 do "true" end} class={dot_class(@index == 1)}></button>
            <button type="button" $click={action: :go, params: %{index: 2}} aria-label="Go to card 3: The Robot Learns courses" aria-current={if @index == 2 do "true" end} class={dot_class(@index == 2)}></button>
            <button type="button" $click={action: :go, params: %{index: 3}} aria-label="Go to card 4: Private &amp; public quizzes" aria-current={if @index == 3 do "true" end} class={dot_class(@index == 3)}></button>
            <button type="button" $click={action: :go, params: %{index: 4}} aria-label="Go to card 5: Draftamo mockups &amp; UML" aria-current={if @index == 4 do "true" end} class={dot_class(@index == 4)}></button>
            <button type="button" $click={action: :go, params: %{index: 5}} aria-label="Go to card 6: The Robot Plans issue submission" aria-current={if @index == 5 do "true" end} class={dot_class(@index == 5)}></button>
          </div>
          <p aria-live="polite" class="font-mono text-xs text-ink-faint">
            {@index + 1} / 6 — {addon_title(@index)}
          </p>
        </div>
      {/if}
    </div>
    """
  end

  # -- actions -----------------------------------------------------------

  def action(:on_hydrated, _params, component) do
    put_state(component, hydrated: true)
  end

  def action(:prev, _params, component) do
    put_state(component, index: clamp(component.state.index - 1))
  end

  def action(:next, _params, component) do
    put_state(component, index: clamp(component.state.index + 1))
  end

  def action(:go, params, component) do
    put_state(component, index: clamp(params.index))
  end

  # -- internals (client-safe: no Enum, no regex, no processes) ----------

  defp clamp(index) do
    index = if index < 0, do: 0
    index = if index > 5, do: 5
    index
  end

  defp track_transform(index) do
    "transform: translateX(-" <> Integer.to_string(index * 100) <> "%)"
  end

  defp dot_class(true), do: "h-2.5 w-2.5 rounded-full bg-violet"
  defp dot_class(false), do: "h-2.5 w-2.5 rounded-full bg-code-border"

  defp addon_title(0), do: "Ticket embedding"
  defp addon_title(1), do: "The Robot Knows hookup"
  defp addon_title(2), do: "The Robot Learns courses"
  defp addon_title(3), do: "Private & public quizzes"
  defp addon_title(4), do: "Draftamo mockups & UML"
  defp addon_title(5), do: "The Robot Plans issue submission"
end
