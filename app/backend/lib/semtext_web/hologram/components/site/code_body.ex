defmodule SemtextWeb.Hologram.Components.Site.CodeBody do
  @moduledoc """
  The highlighted, line-numbered code area alone — no window chrome.
  Port of `CodeBody` in the Next site's `components/code-viewer.tsx`.

  Takes PRE-TOKENIZED lines (see `SemtextWeb.Docs.Highlighter`), computed
  server-side by the page — the template is a dumb renderer so the client
  never tokenizes. Horizontal overflow stays inside this element so a
  long authored line can never stretch a page or a grid cell.
  """

  use Hologram.Component

  prop :lines, :list, required: true

  def template do
    ~HOLO"""
    <div class="code-content">
      {%for line <- @lines}
        <div class="code-line">
          <span class="code-lineno" aria-hidden="true">{line.number}</span>
          <span class="code-linetext">
            {%for tok <- line.tokens}
              {%if tok.type == "default"}
                <span>{tok.text}</span>
              {%else}
                <span class={"tok-" <> tok.type}>{tok.text}</span>
              {/if}
            {/for}
          </span>
        </div>
      {/for}
    </div>
    """
  end
end
