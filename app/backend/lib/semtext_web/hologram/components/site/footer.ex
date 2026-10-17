defmodule SemtextWeb.Hologram.Components.Site.Footer do
  @moduledoc """
  Site footer: the link list (external spec/repo links plus local anchors),
  the "part of Noizu Prompt Lingua" line, the tobor-kit `<noizu-footer-brand>`
  attribution ("A The Robot Lives Joint", same kit pin as annotate and the
  widget) themed through `--noizu-footer-brand-*` vars, and the copyright.
  The old pill marquee (`.token-rail`) is gone. Also rendered by
  LandingLayout so there is exactly one footer.

  Links are inlined (the Next version builds them from constants) — same
  targets, no indirection.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <footer class="border-t border-white/10 bg-slateink">
      <div class="mx-auto max-w-docs px-4 py-10 sm:px-6">
        <ul class="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href="https://github.com/noizu-labs-ml/npl-enhanced-content/blob/develop/spec/conventions.md" class="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline">
              Format spec
            </a>
          </li>
          <li>
            <a href="https://github.com/noizu-labs-ml/npl-enhanced-content/blob/develop/spec/extraction.md" class="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline">
              Extraction contract
            </a>
          </li>
          <li>
            <a href="https://github.com/noizu-labs-ml/npl-enhanced-content" class="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline">
              Repository
            </a>
          </li>
          <li>
            <a href="/reference/" class="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline">
              Vocabulary
            </a>
          </li>
          <li>
            <a href="/#try" class="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline">
              Lit views
            </a>
          </li>
          <li>
            <a href="/#reading" class="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline">
              Reading
            </a>
          </li>
        </ul>
        <p class="mt-6 text-sm text-ink-mute">
          SemText · part of Noizu Prompt Lingua.
        </p>
        <noizu-footer-brand
          class="mt-1"
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
