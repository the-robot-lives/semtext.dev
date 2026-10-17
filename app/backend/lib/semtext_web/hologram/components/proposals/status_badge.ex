defmodule SemtextWeb.Hologram.Components.Proposals.StatusBadge do
  @moduledoc """
  Status pill for a proposal (submitted / under_review / accepted /
  declined / merged / withdrawn / draft). Stateless; the page passes the
  status as a plain string.
  """

  use Hologram.Component

  prop :status, :string, default: "draft"

  def template do
    ~HOLO"""
    <span class={status_class(@status) <> " inline-flex items-center border px-2 py-0.5 font-mono text-[0.68rem] uppercase"} data-cy="status-badge">
      {@status}
    </span>
    """
  end

  # Plain strings only — this runs client-side too (no atoms from data).
  defp status_class("accepted"), do: "border-emerald-500 text-emerald-400"
  defp status_class("merged"), do: "border-emerald-500 text-emerald-400"
  defp status_class("under_review"), do: "border-violet-soft text-violet-soft"
  defp status_class("declined"), do: "border-red-400 text-red-400"
  defp status_class("withdrawn"), do: "border-code-border text-ink-faint"
  defp status_class("draft"), do: "border-amber-500 text-amber-400"
  defp status_class(_), do: "border-code-border text-ink-mute"
end
