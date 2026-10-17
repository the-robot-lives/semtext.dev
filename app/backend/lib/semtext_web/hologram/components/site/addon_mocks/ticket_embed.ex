defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.TicketEmbed do
  @moduledoc "Ticket-embedding mock — port of `TicketEmbedMock` in the Next site's `components/addons-carousel.tsx`."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="overflow-hidden rounded-lg border border-code-border bg-slateink">
      <div class="flex items-center gap-2 border-b border-code-border px-3 py-2 font-mono text-[0.65rem] text-ink-faint">
        <span class="inline-block h-2 w-2 rounded-full bg-violet" aria-hidden="true" />
        embed.semtext.dev/tickets?account=key_live_7f3k9x
      </div>
      <div class="p-3">
        <p class="font-mono text-xs text-violet-soft">TRK-241 · open</p>
        <p class="mt-1 text-sm text-ink">Streak reset wipes a completed quiz score</p>
        <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
          assigned @dana · tagged semtext · cited inline from your tracker
        </p>
      </div>
    </div>
    """
  end
end
