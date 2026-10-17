defmodule SemtextWeb.Hologram.Components.Proposals.SyncChip do
  @moduledoc """
  GitHub discussion sync chip (p1-data report + follow-up: render from
  `discussion.state` — "pending" / "ok" / "failed" / "removed").

  - `ok` → "Synced" (+ comment count, linking out to the discussion).
  - `pending` → "Sync pending" — the webhook round-trip has not landed yet.
  - `failed` → "Sync failed" — the discussion was never created; moderators
    retry from the detail page / moderation queue.
  - `removed` → "Discussion removed" — the discussion was deleted on
    GitHub (never auto-recreated); moderators recreate it, which is the
    only path back to pending.

  Stateless; the page passes display-ready strings.
  """

  use Hologram.Component

  prop :state, :string, default: "pending"
  prop :comment_count, :integer, default: 0
  prop :url, :string, default: ""

  def template do
    ~HOLO"""
    {%if @state == "ok"}
      <span class="inline-flex items-center border border-emerald-500 px-2 py-0.5 font-mono text-[0.68rem] text-emerald-400" data-cy="sync-chip">
        {%if @url != ""}
          <a href={@url} target="_blank" rel="noopener noreferrer" class="hover:underline">
            Synced · {comment_label(@comment_count)}
          </a>
        {%else}
          Synced · {comment_label(@comment_count)}
        {/if}
      </span>
    {/if}
    {%if @state == "failed"}
      <span class="inline-flex items-center border border-red-400 px-2 py-0.5 font-mono text-[0.68rem] text-red-400" data-cy="sync-chip" title="GitHub discussion could not be created">
        Sync failed
      </span>
    {/if}
    {%if @state == "removed"}
      <span class="inline-flex items-center border border-code-border px-2 py-0.5 font-mono text-[0.68rem] text-ink-faint" data-cy="sync-chip" title="The GitHub discussion was deleted; a moderator can recreate it">
        Discussion removed
      </span>
    {/if}
    {%if @state != "ok" and @state != "failed" and @state != "removed"}
      <span class="inline-flex items-center border border-code-border px-2 py-0.5 font-mono text-[0.68rem] text-ink-faint" data-cy="sync-chip">
        Sync pending
      </span>
    {/if}
    """
  end

  defp comment_label(0), do: "0 comments"
  defp comment_label(1), do: "1 comment"
  defp comment_label(n) when is_integer(n), do: to_string(n) <> " comments"
  defp comment_label(_), do: "comments"
end
