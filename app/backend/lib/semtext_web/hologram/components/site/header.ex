defmodule SemtextWeb.Hologram.Components.Site.Header do
  @moduledoc """
  Site header — port of the Next site's `components/header.tsx`: brand
  mark, desktop nav links, the search combobox and the below-sm menu
  toggle. Stateless chrome; the interactive children carry their own cids.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.{HeaderMenu, HeaderSearch}

  def template do
    ~HOLO"""
    <header class="sticky top-0 z-40 border-b border-white/10 bg-slateink/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-docs items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/#main" class="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-tight text-ink sm:text-base">
          <span class="brand-mark" aria-hidden="true">∑</span>
          <span>Sem<span class="text-violet-soft">Text</span></span>
        </a>
        <nav aria-label="Primary" class="flex items-center gap-4 text-sm sm:gap-6">
          <a href="/#try" class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex">See it work</a>
          <a href="/reference/" class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex">Reference</a>
          <a href="/spec/semtext.html" class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex">Spec</a>
          <a href="/#start" class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex">Get started</a>
          <HeaderSearch cid="header_search" />
          <a href="https://therobotlives.com" class="hidden min-h-11 items-center font-medium text-violet-soft underline-offset-4 hover:underline sm:inline-flex">The Robot Lives</a>
          <HeaderMenu cid="header_menu" />
        </nav>
      </div>
    </header>
    """
  end
end
