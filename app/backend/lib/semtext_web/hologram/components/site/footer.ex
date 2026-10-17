defmodule SemtextWeb.Hologram.Components.Site.Footer do
  @moduledoc """
  Site footer: the tobor-kit `<noizu-footer-brand>`
  attribution ("A The Robot Lives Joint", same kit pin as annotate and the
  widget) themed through `--noizu-footer-brand-*` vars, and the copyright.
  The old pill marquee (`.token-rail`) is gone. Also rendered by
  LandingLayout so there is exactly one footer.

  No link row and no Privacy/Terms links: semtext has no such pages.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <footer class="border-t border-white/10 bg-slateink">
      <div class="mx-auto max-w-docs px-4 py-10 sm:px-6">
        <noizu-footer-brand
          class="mt-0"
          align="start"
          style="text-align: left; --noizu-footer-brand-fg: var(--mute); --noizu-footer-brand-brand-color: var(--accent-soft); --noizu-footer-brand-size: 0.875rem"
        ></noizu-footer-brand>
        <p class="mt-1 font-mono text-xs text-ink-faint">
          © 2026 Noizu Labs, Inc.
        </p>
        <script type="module" src="https://cdn.derobot.is/tobor-kit/sha-0e5a20e04fefcb400f9f395795c438a7312f27ec/components/footer-brand/noizu-footer-brand.js"></script>
      </div>
    </footer>
    """
  end
end
