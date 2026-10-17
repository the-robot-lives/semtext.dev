defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.CoursePanel do
  @moduledoc "Course-panel mock — port of `CoursePanelMock` in the Next site's `components/addons-carousel.tsx`."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="rounded-lg border border-code-border bg-slateink p-3">
      <p class="font-mono text-xs text-violet-soft">course · Working with SemText</p>
      <div class="mt-2 h-1 rounded bg-code" role="presentation">
        <div class="h-1 w-2/5 rounded bg-violet" />
      </div>
      <ol class="mt-2 space-y-1 font-mono text-[0.68rem] text-ink-mute">
        <li>1 · documents &amp; records — done</li>
        <li class="text-ink">2 · reading views — current</li>
        <li>3 · extraction — up next</li>
      </ol>
      <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
        progress tracked per reader · sign-in prompted on start
      </p>
    </div>
    """
  end
end
