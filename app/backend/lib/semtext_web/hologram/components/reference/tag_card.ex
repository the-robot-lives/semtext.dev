defmodule SemtextWeb.Hologram.Components.Reference.TagCard do
  @moduledoc """
  One element card on the reference index (prebuilt into a plain map by
  the page's init): tag name (the link to the element page), family badge,
  summary (or the gap note when the schema file states none), and the
  tag's custom render — the `ClaudeExample` block: a static "SemText —
  Claude example" code block plus a live render pane.

  The card is an `<article>` (it holds buttons and a `<pre>`, which cannot
  nest in a link); the name is the link. `data_ref` is the filter payload
  the island bridge narrows against; `data-ref-tag` marks the card for the
  same script.

  `show_render` is the index's page-wide "show renders" switch; `always_on`
  mounts and boots the render at load.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Reference.ClaudeExample

  prop :card, :map, required: true
  prop :show_render, :boolean, default: false
  prop :always_on, :boolean, default: false

  def template do
    ~HOLO"""
    <article data-ref-tag={@card.name} data-ref={@card.data_ref} class="ref-card">
      <span class="ref-card-head">
        <a href={@card.href} class="ref-card-link"><code class="ref-card-name">&lt;{@card.name}&gt;</code></a>
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
      <ClaudeExample
        cid={"claude-card-" <> @card.name}
        example={@card.claude}
        show_render={@show_render}
        always_on={@always_on}
      />
    </article>
    """
  end
end
