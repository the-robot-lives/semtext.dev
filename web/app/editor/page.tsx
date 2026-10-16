import type { Metadata } from "next";
import {
  EditorIsland,
  type EditorExample,
  type EditorVariantExample,
} from "@/components/editor-island";
import { EXAMPLE_VARIANTS } from "@/data/reference-example-variants";
import {
  ALL_TAGS,
  tagSlug,
} from "@/data/reference-tags";

export const dynamic = "force-static";

/*
 * The SemText editor, its own page (static export): a client island that
 * mounts <sem-editor> from the shipped semtext-editor.js bundle. The
 * document is chosen client-side from the query string (?example=<tag>,
 * ?src=<same-origin path>, else the starter doc) — a static export has no
 * searchParams at build time. This server component only bakes the
 * reference examples (data/elements.json + the variants supplement) into
 * the page payload and renders the chrome around the island.
 */

export const metadata: Metadata = {
  title: "SemText editor",
  description:
    "Edit a SemText document in place: a WYSIWYG canvas and a code view over the same document model, with the element vocabulary one insert away.",
  alternates: { canonical: "https://semtext.dev/editor/" },
};

/** The primary example per tag slug, only for tags that have one. */
const EXAMPLES: Record<string, EditorExample> = Object.fromEntries(
  ALL_TAGS.flatMap((t) =>
    t.example
      ? [[tagSlug(t.name), { name: t.name, example: t.example }] as [string, EditorExample]]
      : [],
  ),
);

/** The labelled variants per tag slug (the reference pages' extra examples). */
const VARIANTS: Record<string, EditorVariantExample[]> = Object.fromEntries(
  Object.entries(EXAMPLE_VARIANTS)
    .map(([tag, list]) => [
      tagSlug(tag),
      list.map((v) => ({ id: v.id, label: v.label, code: v.code })),
    ])
    .filter(([, list]) => (list as EditorVariantExample[]).length > 0),
);

export default function EditorPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-[110rem] px-4 pb-24 pt-12 sm:px-6">
      <p className="g-eyebrow">SemText · Editor</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        SemText editor
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-ink-mute">
        One document, two views: the WYSIWYG canvas and the code view are
        projections of the same model. Edit in either, insert any element from
        the vocabulary, export the XHTML when you are done — everything stays
        in your browser.
      </p>
      <div className="mt-6">
        <EditorIsland examples={EXAMPLES} variants={VARIANTS} />
      </div>
    </main>
  );
}
