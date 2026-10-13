import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";
import { ExampleViewer } from "@/components/example-viewer";
import { SemMdExample } from "@/components/sem-md-example";
import { REFERENCE_SEM_MD_RENDERED } from "@/components/sem-md-rendered";
import type {
  TagAttr,
  TagRecord,
} from "@/data/reference-glossary";
import {
  ALL_TAGS,
  GAP_MISSING,
  NPL_TAGS,
  SEM_TAGS,
  SPEC_VERSION,
  tagBySlug,
  tagHref,
  tagSlug,
} from "@/data/reference-tags";

export const dynamic = "force-static";

/*
 * One page per element, generated at build time from data/elements.json
 * plus the hand-authored supplement (data/reference-glossary.ts via
 * data/reference-tags.ts). Pure server render: the only client islands are
 * the example viewers, which degrade to static source views without
 * JavaScript — the page is fully static HTML in the export.
 */

export function generateStaticParams() {
  return ALL_TAGS.map((t) => ({ element: tagSlug(t.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ element: string }>;
}): Promise<Metadata> {
  const { element } = await params;
  const t = tagBySlug(element);
  if (!t) return {};
  const description =
    t.summary || t.description || `SemText reference for the <${t.name}> element.`;
  return {
    title: `<${t.name}> — SemText reference`,
    description,
    alternates: { canonical: `https://semtext.dev/reference/${element}/` },
  };
}

export default async function ReferenceElementPage({
  params,
}: {
  params: Promise<{ element: string }>;
}) {
  const { element } = await params;
  const t = tagBySlug(element);
  if (!t) notFound();

  const semTags = SEM_TAGS;
  const nplTags = NPL_TAGS;

  const familyGroup = (title: string, tags: TagRecord[]) => ({
    title,
    items: tags.map((tag) => ({
      key: `ref-${tag.name}`,
      label: tag.name,
      href: tagHref(tag.name),
      dataRef: tag.name.toLowerCase(),
    })),
  });

  const groups = [
    { title: "Guides", items: [{ key: "cli", label: "CLI commands", href: "/docs/", dataRef: undefined }] },
    {
      title: "Reference",
      items: [{ key: "reference", label: "Tag reference", href: "/reference/", dataRef: undefined }],
    },
    familyGroup("SemText elements", semTags),
    familyGroup("NPL elements", nplTags),
  ];

  return (
    <DocsShell active={`ref-${t.name}`} groups={groups}>
      <main id="main">
        <p className="g-eyebrow">Reference · {t.family === "sem" ? "SemText" : "NPL"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          <code className="font-mono">&lt;{t.name}&gt;</code>
        </h1>
        <ElementBody tag={t} />
      </main>
    </DocsShell>
  );
}

/*
 * The section body, one page's worth of the former /reference/ tag
 * sections (same field presentation, own URL now).
 */
function ElementBody({ tag: t }: { tag: TagRecord }) {
  const missing = GAP_MISSING.get(t.name) ?? [];
  const gapNote = missing.includes("summary") || missing.includes("description");

  return (
    <>
      <p className="mt-3 max-w-3xl text-xs font-normal uppercase tracking-wide text-ink-faint">
        <span className="rounded-full border border-white/15 px-2.5 py-1">
          {t.family === "sem" ? "SemText element" : "NPL element"}
        </span>
      </p>

      {t.summary ? (
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink">{t.summary}</p>
      ) : gapNote ? (
        <p className="mt-4 max-w-3xl text-sm italic leading-6 text-ink-faint">
          The schema file does not state a summary for this tag
          {missing.length ? ` (missing: ${missing.join(", ")})` : ""} — see the
          normative schema for the contract.
        </p>
      ) : null}

      {t.description && t.description !== t.summary ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">{t.description}</p>
      ) : null}

      {t.optionsIn ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          Shares its schema with{" "}
          <a href={tagHref(t.optionsIn)} className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70">
            <code className="font-mono">&lt;{t.optionsIn}&gt;</code>
          </a>{" "}
          — the option bullets below belong to that element&apos;s contract.
        </p>
      ) : null}

      {t.attributes.length > 0 ? (
        <div className="mt-5 max-w-3xl overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-xs uppercase tracking-wide text-ink-faint">
                <th scope="col" className="py-2 pr-4 font-medium">Option</th>
                <th scope="col" className="py-2 pr-4 font-medium">Required</th>
                <th scope="col" className="py-2 pr-4 font-medium">Type · values</th>
                <th scope="col" className="py-2 pr-4 font-medium">Default</th>
                <th scope="col" className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {t.attributes.map((a) => (
                <AttrRow key={a.name} a={a} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 max-w-3xl text-sm leading-6 text-ink-mute">
          {t.attributes.length === 0 && missing.includes("attributes")
            ? "The schema file states no options for this tag."
            : "No options beyond the global attribute catalog are stated for this tag."}
        </p>
      )}

      {t.children.length > 0 ? (
        <div className="mt-5 max-w-3xl">
          <p className="g-nav-title">Children</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm leading-6 text-ink-mute" role="list">
            {t.children.map((c) => (
              <li key={c.name}>
                <code className="font-mono text-ink">&lt;{c.name}&gt;</code>
                {c.note ? <span className="ml-2">{c.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {t.example ? (
        t.name === "sem-md" ? (
          /* The one example that IS Markdown: a Render/Source toggle over
             the same authored block, like the landing's view control.
             Render (the default) renders the table — statically for the
             zero-JS export, live via the chunks/sem-md.js upgrade once
             the lazy loader hydrates this example. */
          <div className="mt-5 max-w-3xl">
            <SemMdExample
              source={t.example}
              renderedHtml={REFERENCE_SEM_MD_RENDERED}
              chromeLabel="sem-md — the authored block, rendered"
            />
          </div>
        ) : (
          /* The example is authored HTML: it goes to the viewer raw and is
             escaped exactly once, at render (React text interpolation).
             Toggle: every SemText element whose example the fallback tier
             renders — sem-reader renders inert and sem-md has its
             Render/Source view above, and the NPL components have no
             browser vocabulary. */
          <ExampleViewer
            name={t.name}
            code={t.example}
            renderable={t.family === "sem" && t.name !== "sem-reader"}
          />
        )
      ) : (
        <p className="mt-5 max-w-3xl text-sm italic leading-6 text-ink-faint">
          The schema file states no authoring example for this tag.
        </p>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        Source:{" "}
        <code className="font-mono">{t.source}</code>
      </p>

      <p className="mt-10 text-sm">
        <a
          href="/reference/"
          className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
        >
          ← All tags in the reference
        </a>
      </p>

      <p className="mt-6 max-w-3xl text-xs leading-5 text-ink-faint">
        Generated from the normative schema files of spec v{SPEC_VERSION}
        {" "}(<code className="font-mono">spec/schema/sem-*.md</code>,{" "}
        <code className="font-mono">spec/schema/npl/*.md</code>) so the page
        cannot drift from the spec; eight elements the schema files do not
        cover come from the spec&apos;s tag catalog. Fields a source does not
        state stay empty and the page says so.
      </p>
    </>
  );
}

function attrType(a: TagAttr): string {
  const parts: string[] = [];
  if (a.type) parts.push(a.type);
  if (a.allowedValues.length) parts.push(a.allowedValues.map((v) => `\`${v}\``).join(" | "));
  return parts.join(" · ");
}

function defaultText(a: TagAttr): string {
  if (a.default === null) return "—";
  if (a.default === "") return "(empty)";
  return a.default;
}

function requiredText(a: TagAttr): string {
  if (a.required === true) return "yes";
  if (a.required === false) return "no";
  return "—";
}

function AttrRow({ a }: { a: TagAttr }) {
  return (
    <tr className="border-b border-white/5 align-top">
      <td className="py-2 pr-4 font-mono text-ink">{a.name}</td>
      <td className="py-2 pr-4 text-ink-mute">{requiredText(a)}</td>
      <td className="py-2 pr-4 font-mono text-ink-mute">
        {attrType(a) || "—"}
      </td>
      <td className="py-2 pr-4 font-mono text-ink-mute">{defaultText(a)}</td>
      <td className="py-2 leading-6 text-ink-mute">{a.description || "—"}</td>
    </tr>
  );
}
