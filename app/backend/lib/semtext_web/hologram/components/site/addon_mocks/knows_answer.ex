defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.KnowsAnswer do
  @moduledoc "Knowledge-base answer mock — port of `KnowsAnswerMock` in the Next site's `components/addons-carousel.tsx`."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="rounded-lg border border-code-border bg-slateink p-3">
      <p class="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
        KB-118 · account keys · v3
      </p>
      <p class="mt-2 text-sm font-medium text-ink">What does an account key unlock?</p>
      <p class="mt-1 text-sm leading-relaxed text-ink-mute">
        Embedding — tickets, quizzes and course progress render inside your
        documents; the reading core stays open.
      </p>
      <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
        source: The Robot Knows · entry cited on the fact
      </p>
    </div>
    """
  end
end
