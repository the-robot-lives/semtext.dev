defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.QuizCard do
  @moduledoc "Quiz-card mock — port of `QuizCardMock` in the Next site's `components/addons-carousel.tsx`."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="rounded-lg border border-code-border bg-slateink p-3">
      <p class="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
        quiz · public catalogue
      </p>
      <p class="mt-2 text-sm font-medium text-ink">
        Which attribute selects an alternate rendering?
      </p>
      <ul class="mt-2 space-y-1 font-mono text-[0.68rem] text-ink-mute">
        <li>a · key</li>
        <li class="text-violet-soft">b · view-as — correct</li>
        <li>c · role</li>
      </ul>
      <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
        scores in place · private exams use the same embed
      </p>
    </div>
    """
  end
end
