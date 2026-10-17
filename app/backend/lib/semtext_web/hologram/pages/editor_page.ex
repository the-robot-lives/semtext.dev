defmodule SemtextWeb.Hologram.Pages.EditorPage do
  @moduledoc """
  /editor — the SemText document editor island (Instrument shell; site
  revamp direction 1 "Instrument", runtime v0.9.0 — see npl-enhanced-content
  docs/editor/EDITOR.md §5 for the element contract this page wires
  against).

  The page is APP CHROME ONLY: no hero, no copy block — the `<sem-editor>`
  Instrument frame fills the viewport below the site header (footer
  dropped via the layout's `hide_footer`). Hologram SSR renders the mount
  point, the boot status line and the script tags. The document itself
  NEVER travels in page state or the hydration payload (the payload-leak
  rule from the 83c34cd lesson — no SemText HTML in page state). Documents
  are fetched client-side by /js/editor-boot.js:

    ?example=<tag>    the tag's authored reference example, served by
                      GET /editor/examples/<tag> (add &variant=<id> for a
                      named variant)
    ?src=<path-or-url>a same-origin path or an http(s) URL; VFS keys arrive
                      with the sem-shell integration
    ?view=1           read-only example view (the shell disables its edit
                      verbs; the boot passes readonly: true)

  The editor bundles are the vendored /semtext/ artifacts, loaded as
  template-authored deferred scripts in load-bearing order (the way the
  spec repo's own web/demo/editor.html does — driving them through the
  island bridge's appended script tags races Hologram hydration):
  /js/editor-flags.js pins the page boot switches first (nothing
  auto-wires), the VERSION-PINNED /semtext/v0.9.1/semtext.js registers
  the core vocabulary the canvas renders (immutable snapshot — same
  pinned base the static site's editor served; cache-stable across
  bundle syncs), and the REAL /semtext/v0.9.1/semtext-editor.js (§9.2
  surface: SemTextEditor.createDocument/tryParse + openDocument, the
  Instrument frame: semantic outline, docked inspector, status bar,
  Visual/Code/Split). /js/editor-boot.js fetches the document and opens
  it.
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/editor"

  layout SiteLayout,
    page_title: "Editor — SemText",
    description:
      "The SemText document editor: open a reference example or any .sem.html document, edit in WYSIWYG or code view.",
    canonical: "https://semtext.dev/editor/",
    og_image: "/og-editor-0.8.2.jpg",
    hide_footer: true

  # init/3 (server-only) computes the content-hashed URLs for the two
  # site-owned scripts: Plug.Static's heuristic caching serves stale
  # copies of edited files, so the tags must carry the ?v= hash. The
  # /semtext/v0.9.1/ bundles are version-pinned paths — no hash needed.
  # Plain strings only — no document markup in state (payload-leak rule).
  # The template also authors the editor's chrome prerequisites from the
  # spec repo's web/demo/editor.html: the semtext.css link (toolbar and
  # canvas styling — without it the chrome renders as bare text) and the
  # display:block default; the <sem-editor-code slot="code-view"> child
  # the Code pane slots into is ensured by /js/editor-boot.js mount().
  def init(_params, component, _server) do
    put_state(component,
      flags_js: SemtextWeb.AssetVersion.url("js/editor-flags.js"),
      boot_js: SemtextWeb.AssetVersion.url("js/editor-boot.js")
    )
  end

  def template do
    ~HOLO"""
    <div class="sem-ed-page">
      <main id="main" class="sem-ed-page-main">
        <div id="editor-root">
          <p id="editor-status" class="sem-ed-boot" aria-live="polite">
            Loading the editor…
          </p>
          <noscript>
            <p class="sem-ed-boot">
              The editor needs JavaScript. With scripts off every document
              still reads: each element&apos;s authored form is documented in
              the <a href="/reference/">reference</a>.
            </p>
          </noscript>
        </div>
      </main>
      <link rel="stylesheet" href="/semtext/v0.9.1/semtext.css" />
      <script defer src={@flags_js}></script>
      <script defer src="/semtext/v0.9.1/semtext.js"></script>
      <script defer src="/semtext/v0.9.1/semtext-editor.js"></script>
      <script defer src={@boot_js}></script>
    </div>
    """
  end
end
