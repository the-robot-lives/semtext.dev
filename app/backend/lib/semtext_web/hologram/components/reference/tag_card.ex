defmodule SemtextWeb.Hologram.Components.Reference.TagCard do
  @moduledoc """
  One element card on the reference index (port of the Next TagCard +
  BundleBadge, prebuilt into a plain map by the page's init): tag name,
  family badge, summary (or the gap note when the schema file states
  none), and the compact shipped-runtime line whose `title` carries the
  full provenance. `data_ref` is the filter payload the island bridge
  narrows against; `data_ref_tag` marks the card for the same script.
  """

  use Hologram.Component

  prop :card, :map, required: true

  def template do
    ~HOLO"""
    <a href={@card.href} data-ref-tag={@card.name} data-ref={@card.data_ref} class="ref-card">
      <span class="ref-card-head">
        <code class="ref-card-name">&lt;{@card.name}&gt;</code>
        <span class="ref-card-family">{@card.family_label}</span>
      </span>
      {%if @card.summary != ""}
        <span class="ref-card-summary">{@card.summary}</span>
      {%else}
        {%if @card.gap_note}
          <span class="ref-card-summary is-gap">No summary stated — the schema file marks the gap.</span>
        {%else}
          <span class="ref-card-summary is-gap">See the element's page.</span>
        {/if}
      {/if}
      {%if @card.badge}
        <span class="ref-card-badge" title={@card.badge.title}>{@card.badge.text}</span>
      {/if}
    </a>
    """
  end
end
