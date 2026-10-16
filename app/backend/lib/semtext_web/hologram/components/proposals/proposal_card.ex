defmodule SemtextWeb.Hologram.Components.Proposals.ProposalCard do
  @moduledoc """
  One proposal in a browse/search result list (stateless). All display
  strings are precomputed by the page (init is server-side); this component
  only interpolates and links.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Proposals.StatusBadge

  prop :slug, :string, default: ""
  prop :title, :string, default: ""
  prop :element_tag, :string, default: ""
  prop :summary, :string, default: ""
  prop :status, :string, default: "submitted"
  prop :meta, :string, default: ""

  def template do
    ~HOLO"""
    <a href={"/p/" <> @slug} class="block border border-code-border px-4 py-3 hover:border-violet-soft" data-cy="proposal-card" data-slug={@slug}>
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-xs text-violet-soft">{@element_tag}</span>
        <StatusBadge status={@status} />
      </div>
      <div class="mt-1 text-sm font-semibold text-ink" data-cy="card-title">{@title}</div>
      <div class="mt-1 text-sm leading-relaxed text-ink-mute">{@summary}</div>
      <div class="mt-1 font-mono text-[0.68rem] text-ink-faint">{@meta}</div>
    </a>
    """
  end
end
