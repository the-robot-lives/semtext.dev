defmodule SemtextWeb.Hologram.Components.Site.AddonMocks.DraftamoUml do
  @moduledoc "Draftamo diagram card: the real `semext-draftamo-diagram` element rendered from inline XML (no hosted link)."
  use Hologram.Component

  def template do
    ~HOLO"""
    <div class="rounded-lg border border-code-border bg-slateink p-3">
      <semext-draftamo-diagram kind="uml-class" label="sem-doc to reader to records">
        <semext-draftamo-node id="a">sem-doc</semext-draftamo-node><semext-draftamo-edge from="a" to="b"></semext-draftamo-edge>
        <semext-draftamo-node id="b">reader</semext-draftamo-node><semext-draftamo-edge from="b" to="c"></semext-draftamo-edge>
        <semext-draftamo-node id="c">records</semext-draftamo-node>
      </semext-draftamo-diagram>
      <p class="mt-2 font-mono text-[0.65rem] text-ink-faint">
        inline XML · semext-draftamo-diagram
      </p>
    </div>
    """
  end
end
