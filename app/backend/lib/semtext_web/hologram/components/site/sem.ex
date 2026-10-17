defmodule SemtextWeb.Hologram.Components.Site.Sem do
  @moduledoc """
  A themed block of pre-rendered SemText markup — port of the Next site's
  `Sem` in `components/docs-shell.tsx`.

  Hologram escapes every template interpolation, so the pre-rendered HTML
  travels in a `data-sem-html` attribute (attribute-escaped, lossless) and
  `/js/site-chrome.js` hydrates it into `innerHTML` at boot. Without
  scripts the attribute simply stays inert — the block renders as an
  (empty) themed pane, exactly the degradation the Next site's
  dangerouslySetInnerHTML avoids by rendering server-side.
  """

  use Hologram.Component

  prop :html, :string, required: true
  prop :class, :string, default: ""

  def template do
    ~HOLO"""
    <div data-sem-theme="minimal-tech-light" data-color-mode="dark" data-sem-html={@html} class={@class} />
    """
  end
end
