defmodule SemtextWeb.Hologram.Pages.ShowcaseSemShellPage do
  @moduledoc """
  /showcase/sem-shell/ — port of the Next site's
  `app/showcase/sem-shell/page.tsx`: the interactive terminal element, a
  POSIX-style shell over a virtual file system, with the integrity rule
  for remote plugins. Ships in a bundle this site does not carry, so the
  example stays in source view and the copy says so.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/sem-shell"
  layout SiteLayout,
    page_title: "sem-shell — SemText showcase",
    description:
      "The interactive terminal element: a POSIX-style shell over a virtual file system, the demo commands, and the integrity rule for remote plugins.",
    canonical: "https://semtext.dev/showcase/sem-shell/"

  @example ~S"""
  <sem-shell></sem-shell>

  <!-- a bare terminal, wired by the host page to remote plugin manifests -->
  <sem-terminal plugins="https://cdn.example.com/semtext/plugins/manifest.json#sha256-BASE64DIGEST"></sem-terminal>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      lines: Highlighter.numbered_lines(@example)
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="sem-shell" title="sem-shell: the document, interactive" groups={@groups} sections={[%{id: "example", label: "The markup"}, %{id: "plugins", label: "Plugins and the integrity rule"}, %{id: "status", label: "Status"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        Some documents want a prompt, not a page.{" "}
        <code class="font-mono">sem-shell</code> is a terminal element
        preconfigured with two plugins — a POSIX-style command set
        (<code class="font-mono">ls</code>,{" "}
        <code class="font-mono">cat</code>,{" "}
        <code class="font-mono">grep</code>, pipes, redirects) and the
        demo commands (<code class="font-mono">semtext</code>,{" "}
        <code class="font-mono">open</code>) — running over a virtual
        file system. Useful-stuff documents: a browsable snapshot of a
        repo, a workshop where the reader runs the commands they just read.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The markup
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          One empty element boots the shell; a bare{" "}
          <code class="font-mono">sem-terminal</code> is the same
          terminal without the bundled plugins, for hosts that wire their
          own.
        </p>
        <ExampleViewer cid="example-viewer" id="sem-shell" label="sem-shell example" filename="sem-shell.md" caption="authored SemText" lines={@lines} renderable={false} />
      </section>

      <section id="plugins" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Plugins and the integrity rule
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          The two bundled manifests mount locally — no fetch. A remote plugin
          is opt-in per element via the{" "}
          <code class="font-mono">plugins</code> attribute, and every URL
          must carry an integrity hash: a plugin from an absolute{" "}
          <code class="font-mono">https</code> URL without one is refused
          before any network request, the refusal printed as a stderr line
          and recorded on the terminal's load errors.
        </p>
      </section>

      <section id="status" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Status
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          The element ships in <code class="font-mono">semtext-js-shell.js</code>{" "}
          (an IIFE exposing the global{" "}
          <code class="font-mono">SemTextShell</code>; the build manifest
          maps both <code class="font-mono">sem-shell</code> and{" "}
          <code class="font-mono">sem-terminal</code> to it) — a bundle
          kept out of the core on purpose, since the shell is agent and demo
          tooling, not document vocabulary. This site does not carry that
          bundle yet, so the example above stays in source view rather than
          pretending to render.
        </p>
      </section>

      <ShowcaseFooter>
        The terminal itself — playback, the flashcard TUI, the command set —
        is built in{" "}
        <a href="https://github.com/noizu-labs-ml/npl-enhanced-content" class="text-violet-soft underline-offset-4 hover:underline">
          noizu-labs-ml/npl-enhanced-content
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
