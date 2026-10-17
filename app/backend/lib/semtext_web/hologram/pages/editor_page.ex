defmodule SemtextWeb.Hologram.Pages.EditorPage do
  @moduledoc """
  /editor — the SemText document editor island (site-editor lane, P3 of the
  npl-enhanced-content editor build; see that repo's docs/editor/EDITOR.md
  for the element contract this page wires against).

  The page hosts `<sem-editor>` as a JS island: Hologram SSR renders only
  the chrome (heading, mount point, status line, script tags). The document
  itself NEVER travels in page state or the hydration payload (the
  payload-leak rule from the 83c34cd lesson — no SemText HTML in page
  state). Documents are fetched client-side by /js/editor-boot.js:

    ?example=<tag>    the tag's authored reference example, served by
                      GET /editor/examples/<tag> (add &variant=<id> for a
                      named variant)
    ?src=<path-or-url>a same-origin path or an http(s) URL; VFS keys arrive
                      with the sem-shell integration

  The editor bundles are the vendored /semtext/ artifacts, loaded as
  template-authored deferred scripts in load-bearing order (the way the
  spec repo's own web/demo/editor.html does — driving them through the
  island bridge's appended script tags races Hologram hydration):
  /js/editor-flags.js pins the page boot switches first (nothing
  auto-wires), the VERSION-PINNED /semtext/v0.7.2/semtext.js registers
  the core vocabulary the canvas renders (immutable snapshot — same
  pinned base the static site's editor served; cache-stable across
  bundle syncs), and the REAL /semtext/v0.7.2/semtext-editor.js (§9.2
  surface: SemTextEditor.createDocument/tryParse + openDocument,
  Visual/Code/Split modes reflected as data-mode). /js/editor-boot.js
  fetches the document and opens it.
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/editor"

  layout SiteLayout,
    page_title: "Editor — SemText",
    description:
      "The SemText document editor: open a reference example or any .sem.html document, edit in WYSIWYG or code view.",
    canonical: "https://semtext.dev/editor/"

  # init/3 (server-only) computes the content-hashed URLs for the two
  # site-owned scripts: Plug.Static's heuristic caching serves stale
  # copies of edited files, so the tags must carry the ?v= hash. The
  # /semtext/v0.7.2/ bundles are version-pinned paths — no hash needed.
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
    <div class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p class="g-eyebrow">Platform</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Editor
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          One HTML file, editable in place. Open any element&apos;s{" "}
          <a
            class="underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
            href="/reference/"
          >
            reference example
          </a>{" "}
          with <code class="font-mono">?example=&lt;tag&gt;</code>, or a
          document with{" "}
          <code class="font-mono">?src=&lt;path-or-url&gt;</code> — the page
          itself never holds the document: it is fetched after load and
          edited locally, in WYSIWYG or code view. The preview never
          executes: scripts are neutralised before anything renders.
        </p>

        <section aria-label="Document editor" class="mt-8">
          <div id="editor-root">
            <p id="editor-status" class="text-sm leading-6 text-ink-mute" aria-live="polite">
              The editor is a JavaScript island — loading…
            </p>
            <noscript>
              <p class="text-sm leading-6 text-ink-mute">
                The editor needs JavaScript. With scripts off every document
                still reads: each element&apos;s authored form is documented in
                the reference.
              </p>
            </noscript>
          </div>
        </section>
      </main>
      <link rel="stylesheet" href="/semtext/v0.7.2/semtext.css" />
      <script defer src={@flags_js}></script>
      <script defer src="/semtext/v0.7.2/semtext.js"></script>
      <script defer src="/semtext/v0.7.2/semtext-editor.js"></script>
      <script defer src={@boot_js}></script>
    </div>
    """
  end
end
