import type { Metadata } from "next";
import { ExampleViewer } from "@/components/example-viewer";
import {
  ShowcaseFooter,
  ShowcaseFrame,
} from "@/components/showcase-page";

export const metadata: Metadata = {
  title: "sem-shell — SemText showcase",
  description:
    "The interactive terminal element: a POSIX-style shell over a virtual file system, the demo commands, and the integrity rule for remote plugins.",
  alternates: { canonical: "https://semtext.dev/showcase/sem-shell/" },
};

/*
 * sem-shell / sem-terminal ship in dist/semtext-js-shell.js (global
 * SemTextShell; the build manifest maps both tags to that artifact) — a
 * bundle this site does not carry in public/semtext/ yet, so the example
 * stays in source view and the copy says so. Everything stated here is
 * from src/shell/sem-shell.ts and src/js-shell.ts in
 * noizu-labs-ml/npl-enhanced-content.
 */

const EXAMPLE = `<sem-shell></sem-shell>

<!-- a bare terminal, wired by the host page to remote plugin manifests -->
<sem-terminal plugins="https://cdn.example.com/semtext/plugins/manifest.json#sha256-BASE64DIGEST"></sem-terminal>`;

export default function SemShellShowcasePage() {
  return (
    <ShowcaseFrame
      slug="sem-shell"
      title="sem-shell: the document, interactive"
      lede={
        <>
          Some documents want a prompt, not a page.{" "}
          <code className="font-mono">sem-shell</code> is a terminal element
          preconfigured with two plugins — a POSIX-style command set
          (<code className="font-mono">ls</code>,{" "}
          <code className="font-mono">cat</code>,{" "}
          <code className="font-mono">grep</code>, pipes, redirects) and the
          demo commands (<code className="font-mono">semtext</code>,{" "}
          <code className="font-mono">open</code>) — running over a virtual
          file system. Useful-stuff documents: a browsable snapshot of a
          repo, a workshop where the reader runs the commands they just read.
        </>
      }
      sections={[
        { id: "example", label: "The markup" },
        { id: "plugins", label: "Plugins and the integrity rule" },
        { id: "status", label: "Status" },
      ]}
    >
      <section id="example" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          The markup
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          One empty element boots the shell; a bare{" "}
          <code className="font-mono">sem-terminal</code> is the same
          terminal without the bundled plugins, for hosts that wire their
          own.
        </p>
        <ExampleViewer name="sem-shell" code={EXAMPLE} renderable={false} />
      </section>

      <section id="plugins" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Plugins and the integrity rule
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          The two bundled manifests mount locally — no fetch. A remote plugin
          is opt-in per element via the{" "}
          <code className="font-mono">plugins</code> attribute, and every URL
          must carry an integrity hash: a plugin from an absolute{" "}
          <code className="font-mono">https</code> URL without one is refused
          before any network request, the refusal printed as a stderr line
          and recorded on the terminal&apos;s load errors.
        </p>
      </section>

      <section id="status" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Status
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          The element ships in <code className="font-mono">semtext-js-shell.js</code>{" "}
          (an IIFE exposing the global{" "}
          <code className="font-mono">SemTextShell</code>; the build manifest
          maps both <code className="font-mono">sem-shell</code> and{" "}
          <code className="font-mono">sem-terminal</code> to it) — a bundle
          kept out of the core on purpose, since the shell is agent and demo
          tooling, not document vocabulary. This site does not carry that
          bundle yet, so the example above stays in source view rather than
          pretending to render.
        </p>
      </section>

      <ShowcaseFooter>
        The terminal itself — playback, the flashcard TUI, the command set —
        is built in{" "}
        <a
          href="https://github.com/noizu-labs-ml/npl-enhanced-content"
          className="text-violet-soft underline-offset-4 hover:underline"
        >
          noizu-labs-ml/npl-enhanced-content
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
  );
}
