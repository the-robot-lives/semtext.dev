defmodule SemtextWeb.Hologram.Components.Site.ShowcaseFooter do
  @moduledoc """
  The footer row every showcase page shares — port of `ShowcaseFooter` in
  the Next site's `components/showcase-page.tsx`.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <p class="mt-12 max-w-3xl border-t border-white/10 pt-6 text-sm leading-6 text-ink-faint">
      <slot />
    </p>
    """
  end
end
