defmodule SemtextWeb.Hologram.Components.Site.AddonsCarousel do
  @moduledoc """
  The integrations carousel — port of the Next site's
  `components/addons-carousel.tsx`: six integration cards, each with a
  mock of the surface the integration would put on a page (see the
  `Site.AddonMocks.*` components). No status chips: the mocks are
  illustrations of planned output, not screenshots — nothing in them
  claims availability.

  Zero-JS: the `.no-js` stylesheet gating stacks all six cards and hides
  the controls (a scripts-off reader gets a plain list). With scripts on,
  the stack becomes a translated track driven by prev/next, the dots, and
  the left/right arrow keys while focus is inside the carousel. Autoplay:
  deliberately none — the section never moves on its own.

  Implementation deviations from the Next version (both noted in the lane
  report): the hydration `js` flag becomes `html.no-js` CSS gating, and
  the track translation is CSS-keyed off `data-index` (six static rules in
  site.css) instead of an inline style, so no integer-to-string runs on
  the client.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.AddonMocks.{
    CoursePanel,
    DraftamoUml,
    KnowsAnswer,
    PlansIssue,
    QuizCard,
    TicketEmbed
  }

  def init(_props, component, _server) do
    put_state(component, :index, 0)
  end

  def action(:go, params, component) do
    put_state(component, :index, clamp(params.index))
  end

  def action(:next, _params, component) do
    put_state(component, :index, clamp(component.state.index + 1))
  end

  def action(:prev, _params, component) do
    put_state(component, :index, clamp(component.state.index - 1))
  end

  defp clamp(n) when n < 0, do: 0
  defp clamp(n) when n > 5, do: 5
  defp clamp(n), do: n

  # Static lookups so templates and actions never do arithmetic or string
  # building on the client.
  def title_at(0), do: "Ticket embedding"
  def title_at(1), do: "The Robot Knows hookup"
  def title_at(2), do: "The Robot Learns courses"
  def title_at(3), do: "Private & public quizzes"
  def title_at(4), do: "Draftamo mockups & UML"
  def title_at(5), do: "The Robot Plans issue submission"

  def position_text(0), do: "1 / 6 — Ticket embedding"
  def position_text(1), do: "2 / 6 — The Robot Knows hookup"
  def position_text(2), do: "3 / 6 — The Robot Learns courses"
  def position_text(3), do: "4 / 6 — Private & public quizzes"
  def position_text(4), do: "5 / 6 — Draftamo mockups & UML"
  def position_text(5), do: "6 / 6 — The Robot Plans issue submission"

  def dot_class(active) do
    if active do
      "h-2.5 w-2.5 rounded-full bg-violet"
    else
      "h-2.5 w-2.5 rounded-full bg-code-border"
    end
  end

  def li_class(hidden) do
    if hidden do
      "sem-carousel-card aria-hidden min-w-full"
    else
      "sem-carousel-card min-w-full"
    end
  end

  def template do
    ~HOLO"""
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Integration cards"
      tabindex="0"
      class="mt-8 max-w-4xl"
      $key_down.arrow_right.prevent_default="next"
      $key_down.arrow_left.prevent_default="prev"
    >
      <div class="overflow-hidden">
        <ul class="sem-carousel-track flex items-stretch" data-index={@index}>
          <li class={li_class(@index != 0)}>
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-ticket-embedding-h">
              <h3 id="addon-ticket-embedding-h" class="text-lg font-semibold text-ink">Ticket embedding</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">
                An account key enables ticket embedding — live tickets from your tracker, cited inline like any other datum.
              </p>
              <div class="mt-4">
                <TicketEmbed />
              </div>
            </article>
          </li>
          <li class={li_class(@index != 1)}>
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-the-robot-knows-h">
              <h3 id="addon-the-robot-knows-h" class="text-lg font-semibold text-ink">The Robot Knows hookup</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">
                Point a document at your knowledge base, so facts and procedures draw on live KB entries.
              </p>
              <div class="mt-4">
                <KnowsAnswer />
              </div>
            </article>
          </li>
          <li class={li_class(@index != 2)}>
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-the-robot-learns-h">
              <h3 id="addon-the-robot-learns-h" class="text-lg font-semibold text-ink">The Robot Learns courses</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">
                Courses load as SemText and track each reader's quiz progress; sign-in is prompted when tracking starts.
              </p>
              <div class="mt-4">
                <CoursePanel />
              </div>
            </article>
          </li>
          <li class={li_class(@index != 3)}>
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-embedded-quizzes-h">
              <h3 id="addon-embedded-quizzes-h" class="text-lg font-semibold text-ink">Private &amp; public quizzes</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">
                Private exams and quizzes from The Robot Learns embed in your pages, beside a public catalogue of embedded quizzes.
              </p>
              <div class="mt-4">
                <QuizCard />
              </div>
            </article>
          </li>
          <li class={li_class(@index != 4)}>
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-draftamo-renders-h">
              <h3 id="addon-draftamo-renders-h" class="text-lg font-semibold text-ink">Draftamo mockups &amp; UML</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">
                Mockups and UML renders from Draftamo-hosted projects, or from local Draftamo XML.
              </p>
              <div class="mt-4">
                <DraftamoUml />
              </div>
            </article>
          </li>
          <li class={li_class(@index != 5)}>
            <article class="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5" aria-labelledby="addon-issue-submission-h">
              <h3 id="addon-issue-submission-h" class="text-lg font-semibold text-ink">The Robot Plans issue submission</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-mute">
                Submit an issue from the page itself — The Robot Plans files it in Jira, ClickUp, or GitHub.
              </p>
              <div class="mt-4">
                <PlansIssue />
              </div>
            </article>
          </li>
        </ul>
      </div>

      <div class="js-only mt-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <button
            type="button"
            $click="prev"
            disabled={@index == 0}
            aria-label="Previous integration"
            class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← prev
          </button>
          <button
            type="button"
            $click="next"
            disabled={@index == 5}
            aria-label="Next integration"
            class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            next →
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" $click={action: :go, index: 0} aria-label="Go to card 1: Ticket embedding" aria-current={if @index == 0 do "true" else nil end} class={dot_class(@index == 0)} />
          <button type="button" $click={action: :go, index: 1} aria-label="Go to card 2: The Robot Knows hookup" aria-current={if @index == 1 do "true" else nil end} class={dot_class(@index == 1)} />
          <button type="button" $click={action: :go, index: 2} aria-label="Go to card 3: The Robot Learns courses" aria-current={if @index == 2 do "true" else nil end} class={dot_class(@index == 2)} />
          <button type="button" $click={action: :go, index: 3} aria-label="Go to card 4: Private & public quizzes" aria-current={if @index == 3 do "true" else nil end} class={dot_class(@index == 3)} />
          <button type="button" $click={action: :go, index: 4} aria-label="Go to card 5: Draftamo mockups & UML" aria-current={if @index == 4 do "true" else nil end} class={dot_class(@index == 4)} />
          <button type="button" $click={action: :go, index: 5} aria-label="Go to card 6: The Robot Plans issue submission" aria-current={if @index == 5 do "true" else nil end} class={dot_class(@index == 5)} />
        </div>
        <p aria-live="polite" class="font-mono text-xs text-ink-faint">
          {position_text(@index)}
        </p>
      </div>
    </div>
    """
  end
end
