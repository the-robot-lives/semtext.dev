defmodule SemtextWeb.Hologram.Components.Site.CodeWindow do
  @moduledoc """
  Shared code window: chrome + highlighted body — port of `CodeViewer` in
  the Next site's `components/code-viewer.tsx` (figure.code-window,
  live-dot chrome, filename · caption, tokenized CodeBody).

  Deviations (placeholder contract, see the lane report): the chrome's
  Copy / Save buttons are NOT ported here — they are clipboard/Blob-DOM
  work owned by the port-reference lane's real ExampleViewer. Everything
  static (chrome, aria-label, line numbers, tokens) is parity-exact.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.CodeBody

  prop :lines, :list, required: true
  prop :filename, :string, default: "doc.html"
  prop :caption, :string, default: ""
  prop :label, :string, required: true
  prop :class, :string, default: "mt-8"

  def template do
    ~HOLO"""
    <figure class={"code-window " <> @class} aria-label={@label}>
      <div class="code-chrome">
        <span class="dot live" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate" title={@filename <> " · " <> @caption}>
          {@filename} · {@caption}
        </span>
      </div>
      <CodeBody lines={@lines} />
    </figure>
    """
  end
end
