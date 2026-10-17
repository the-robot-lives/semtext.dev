defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.PlansIssue do
  @moduledoc "Issue-submission mock — port of `PlansIssueMock` in the Next site's `components/addons-carousel.tsx`."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="rounded-lg border border-code-border bg-slateink p-3">
      <p class="font-mono text-xs text-violet-soft">
        SEM-312 · Integration carousel keyboard focus ring
      </p>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <span class="g-status">integrations</span>
        <span class="g-status">enhancement</span>
      </div>
      <p class="mt-2 text-sm leading-relaxed text-ink-mute">
        Reported from this page — reporter, page section and build attached
        automatically.
      </p>
      <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
        filed via embedded form → The Robot Plans (GitHub)
      </p>
    </div>
    """
  end
end
