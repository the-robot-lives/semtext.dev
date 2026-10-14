defmodule SemtextWeb.Hologram.Components.Site.Footer do
  @moduledoc """
  Site footer — port of the Next site's `components/footer.tsx`: the
  token rail marquee, the link list (external spec/repo links plus local
  anchors) and the portfolio sign-off. The "Scripts-off tier" link stays
  disabled exactly as upstream (disabled there 2026-10-14).

  Links are inlined (the Next version builds them from constants) — same
  targets, no indirection.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <footer class="border-t border-white/10 bg-slateink">
      <div class="token-rail" aria-hidden="true">
        <span>sem-note</span>
        <span>sem-facts</span>
        <span>sem-procedure</span>
        <span>sem-code</span>
        <span>sem-table</span>
        <span>sem-reader</span>
        <span>one file</span>
        <span>three readers</span>
        <span>no build step</span>
        <span>sem-note</span>
        <span>sem-facts</span>
        <span>sem-procedure</span>
        <span>sem-code</span>
        <span>sem-table</span>
        <span>sem-reader</span>
      </div>
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
          SemText · draft spec · part of Noizu Prompt Lingua.
          <a href="https://therobotlives.com" class="text-violet-soft underline-offset-4 hover:underline">
            The Robot Lives
          </a>
          portfolio.
        </p>
        <p class="mt-1 font-mono text-xs text-ink-faint">
          © 2026 semtext
        </p>
      </div>
    </footer>
    """
  end
end
