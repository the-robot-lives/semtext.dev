import type { Metadata } from "next";
import { ExampleViewer } from "@/components/example-viewer";
import {
  ShowcaseFooter,
  ShowcaseFrame,
} from "@/components/showcase-page";

export const metadata: Metadata = {
  title: "Embedding — SemText showcase",
  description:
    "Reusing one document's sections inside another: the sem-embed contract — source, a selected block, a card mode. Catalogued by the spec; renderer not yet shipped.",
  alternates: { canonical: "https://semtext.dev/showcase/embedding/" },
};

/*
 * sem-embed is catalogued in the spec's tag catalog (spec/conventions.md)
 * but its renderer is not yet implemented in any tier — so this page is
 * honest about that: the example stays in source view, and the copy says
 * exactly what exists today.
 */

const EXAMPLE = `<h2>Shared glossary</h2>
<p>Definitions are written once and embedded where they are read —
never copied between documents:</p>

<sem-embed source="../glossary.sem.html"></sem-embed>

<!-- one block of the source, by its id -->
<sem-embed source="../glossary.sem.html#f-oidc"></sem-embed>

<!-- the same block, presented as a card -->
<sem-embed source="../glossary.sem.html#f-oidc" mode="card"></sem-embed>`;

export default function EmbeddingShowcasePage() {
  return (
    <ShowcaseFrame
      slug="embedding"
      title="One source of truth, embedded where it is read"
      lede={
        <>
          The moment a definition is copied into a second document, the two
          copies drift. SemText&apos;s{" "}
          <code className="font-mono">sem-embed</code> points at the other
          document instead — a whole document, one block by id, or a block in
          a presentation mode — so the glossary entry, the procedure, the
          fact exists once and renders wherever it is read.
        </>
      }
      sections={[
        { id: "example", label: "The contract" },
        { id: "status", label: "Status" },
      ]}
    >
      <section id="example" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          The contract
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Three forms: a whole source document, a{" "}
          <code className="font-mono">#section-id</code> into it, and a{" "}
          <code className="font-mono">mode</code> for how the block presents.
          This example stays in source view — see the status note below.
        </p>
        <ExampleViewer name="embedding" code={EXAMPLE} renderable={false} />
      </section>

      <section id="status" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Status
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          The element is catalogued by the spec and its contract is written,
          but no shipped tier renders it yet — this page deliberately does
          not fake a render. Until a tier wires it, an embedded reference
          reads as its authored markup, which is a record, not a broken
          page.
        </p>
      </section>

      <ShowcaseFooter>
        The element&apos;s attributes are on its{" "}
        <a href="/reference/sem-embed/" className="text-violet-soft underline-offset-4 hover:underline">
          reference page
        </a>
        , sourced from the spec&apos;s tag catalog.
      </ShowcaseFooter>
    </ShowcaseFrame>
  );
}
