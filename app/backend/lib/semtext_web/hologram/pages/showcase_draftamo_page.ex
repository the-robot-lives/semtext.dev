defmodule SemtextWeb.Hologram.Pages.ShowcaseDraftamoPage do
  @moduledoc """
  /showcase/draftamo/ — the real 13-node Draftamo document
  (`holograph-m0-m1-walking-skeleton`, 13 nodes / 14 edges, from the
  drafts app) authored as a `<semext-draftamo-diagram>` with the
  normalized DiagramJson v1 payload riding in a hidden
  `<semext-draftamo-data>` child. The bundle hydrates the payload;
  without the bundle the element stays an empty diagram shell, and once
  the 3D viewer bundle is published (THEROB-168) the same markup
  upgrades to the interactive 3D scene — 2D SVG until then.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/draftamo"

  layout SiteLayout,
    page_title: "Draftamo diagram — SemText showcase",
    description:
      "The real 13-node Draftamo document authored as a <semext-draftamo-diagram> with its native v1 payload in a hidden <semext-draftamo-data> child — hydrated by the bundle, 3D once the viewer publishes.",
    canonical: "https://semtext.dev/showcase/draftamo/",
    load_semtext_bundle: true

  @example ~S"""
  <sem-enhanced-document>
    <h1 data-kind="title">TRD Unity-parity 3D UML workspace</h1>

    <p>The real 13-node / 14-edge document from the drafts app, one copy of the data, native v1 JSON:</p>

    <semext-draftamo-diagram kind="uml-class" label="TRD Unity-parity 3D UML workspace">
      <semext-draftamo-data>{"v":1,"kind":"uml-class","label":"TRD Unity-parity 3D UML workspace","nodes":[{"id":"root","label":"RobotDraftModel"},{"id":"pkg-authoring","label":"Authoring Core"},{"id":"pkg-uml3d","label":"Uml3D Scene"},{"id":"pkg-ai","label":"Drafting Agents"},{"id":"uml-scene","label":"Uml3DScene"},{"id":"uml-node","label":"UmlNode3D"},{"id":"uml-edge","label":"UmlEdge3D"},{"id":"camera-rig","label":"UmlCameraRig"},{"id":"node-shape","label":"Uml3DNodeShape"},{"id":"diagram-model","label":"DiagramModel"},{"id":"patch-review","label":"PatchReviewService"},{"id":"plantuml-exporter","label":"PlantUmlExporter"},{"id":"model-store","label":"ModelStore"}],"edges":[{"from":"root","to":"pkg-authoring","label":"owns"},{"from":"root","to":"pkg-uml3d","label":"projects"},{"from":"root","to":"pkg-ai","label":"drafts"},{"from":"uml-scene","to":"uml-node","label":"creates"},{"from":"uml-scene","to":"uml-edge","label":"creates"},{"from":"uml-scene","to":"camera-rig","label":"delegates camera"},{"from":"uml-node","to":"node-shape","label":"builds mesh"},{"from":"diagram-model","to":"uml-scene","label":"renders as 3D"},{"from":"pkg-authoring","to":"diagram-model","label":"contains"},{"from":"pkg-authoring","to":"plantuml-exporter","label":"exports"},{"from":"patch-review","to":"diagram-model","label":"proposes patches"},{"from":"model-store","to":"diagram-model","label":"versions"},{"from":"uml-scene","to":"model-store","label":"loads document"},{"from":"plantuml-exporter","to":"model-store","label":"reads versions"}]}</semext-draftamo-data>
    </semext-draftamo-diagram>

    <sem-note variant="tip">Payload-only parses hydrate: the bundle reads the hidden
    <code>semext-draftamo-data</code> child, lays the graph out left-to-right, and
    renders it — and upgrades to the interactive 3D scene when the viewer bundle
    is reachable. With scripts off, the payload stays inert data.</sem-note>
  </sem-enhanced-document>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      lines: Highlighter.numbered_lines(@example),
      # raw source for ExampleViewer data-sem-html (template @example = state key)
      example: @example
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="draftamo" title="One document, native payload, hydrated diagram" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        Draftamo documents live as JSON — nodes, edges, 3D poses. SemText's{" "}
        <code class="font-mono">semext-draftamo-diagram</code> takes that
        document as-is: the native v1 payload rides in a hidden{" "}
        <code class="font-mono">semext-draftamo-data</code> child, and the
        reading bundle hydrates it. Here the real 13-node{" "}
        <code class="font-mono">holograph-m0-m1-walking-skeleton</code>{" "}
        document from the drafts app is authored exactly as the exporter
        emits it.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Render it: the bundle parses the payload (strict v1 —{" "}
          <code class="font-mono">{"{v, kind, nodes[{id,label}], edges[{from,to,label}]}"}</code>
          ), lays the graph out left-to-right by longest-path rank, and draws
          it. No parallel node list, no hand-maintained markup copy.
        </p>
        <ExampleViewer cid="example-viewer" id="draftamo" label="draftamo example" filename="draftamo.md" caption="authored SemText" lines={@lines} renderable={true} raw={@example} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            The native JSON is the source of truth — the exporter emits it,
            the element parses it, and the round trip
            (export → inline → parse) reproduces the same model.
          </li>
          <li>
            Hydration is one-way and fresh-parse only: a payload-only
            document hydrates; authored children win once present, so a hand
            edit to the markup is never silently overwritten mid-session.
          </li>
          <li>
            Progressive depth: the same markup renders 2D today and upgrades
            to the interactive 3D viewer when the viewer bundle publishes —
            the document never changes.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        The element's full contract — kinds, the hydration rule, the
        exporter — is on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          its reference page
        </a>
        ; other live documents are in the{" "}
        <a href="/showcase/" class="text-violet-soft underline-offset-4 hover:underline">
          showcase index
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
