defmodule SemtextWeb.Hologram.Components.Reference.TagCard do
  @moduledoc """
  One element card on the reference index (port of the Next TagCard,
  prebuilt into a plain map by the page's init): tag name, family badge,
  and summary (or the gap note when the schema file states none). The
  shipped-runtime line the Next card carried is gone (round-2 feedback):
  provenance lives on the element page's bundles section, not on every
  card. `data_ref` is the filter payload the island bridge narrows
  against; `data_ref_tag` marks the card for the same script.
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
    </a>
    """
  end
end
