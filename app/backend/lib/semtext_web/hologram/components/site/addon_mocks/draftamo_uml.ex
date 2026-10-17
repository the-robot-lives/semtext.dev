defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.DraftamoUml do
  @moduledoc "Draftamo UML render mock — port of `DraftamoUmlMock` in the Next site's `components/addons-carousel.tsx`."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="rounded-lg border border-code-border bg-slateink p-3">
      <svg
        viewBox="0 0 330 66"
        role="img"
        aria-label="UML render: sem-doc to reader to records"
        class="w-full"
      >
        <g fill="none" stroke="var(--code-border)" stroke-width="1">
          <rect x="4" y="18" width="90" height="30" rx="6" />
          <rect x="120" y="18" width="90" height="30" rx="6" />
          <rect x="236" y="18" width="90" height="30" rx="6" />
        </g>
        <g
          fill="var(--ink-mute)"
          font-size="10"
          font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
          text-anchor="middle"
        >
          <text x="49" y="37">sem-doc</text>
          <text x="165" y="37">reader</text>
          <text x="281" y="37">records</text>
        </g>
        <g stroke="var(--accent)" stroke-width="1" fill="none">
          <path d="M94 33 H116" />
          <path d="M116 33 l-5 -3 v6 z" fill="var(--accent)" />
          <path d="M210 33 H232" />
          <path d="M232 33 l-5 -3 v6 z" fill="var(--accent)" />
        </g>
      </svg>
      <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
        checkout-flow.uml · rendered by Draftamo
      </p>
    </div>
    """
  end
end
