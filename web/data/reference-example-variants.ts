/*
 * Extra authored examples per tag: the view modes and variants a tag's
 * reference page shows alongside its primary example — a `sem-note`
 * variant per `variant` value, a `sem-facts` example per `view-as` mode,
 * a `sem-details` occluded/open pair, and so on.
 *
 * This file is the extension point the per-tag reviewers fill: add one
 * entry per variant; the element page renders each in its own viewer under
 * the primary example, in array order, with the label in the viewer chrome
 * and a stable `#example-<id>` anchor. The mechanism ships empty — no
 * invented content.
 *
 * `renderable: false` pins a variant to Source-only when the fallback tier
 * does not render that shape; omitted, it inherits the tag family's
 * default. Markdown-authored variants are out of scope here — the sem-md
 * Render path is per-block and only the primary sem-md example carries a
 * pre-rendered HTML half.
 */

export interface ExampleVariant {
  /** Anchor-safe id, unique within the tag's page (`#example-<id>`). */
  id: string;
  /** Variant label, shown above the viewer (e.g. "variant: warning"). */
  label: string;
  /** Optional one-line note under the label. */
  note?: string;
  /** The authored example (SemText/HTML, source view + optional Render). */
  code: string;
  /** Pin to Source-only when the fallback tier does not render this shape. */
  renderable?: boolean;
}

export const EXAMPLE_VARIANTS: Record<string, ExampleVariant[]> = {
  "npl-directive": [
    {
      id: "prefix",
      label: 'variant: kind="prefix"',
      note: "The prefix form of the source grammar — the ➤ arrow renders between glyph and instruction.",
      code: '<npl-directive glyph="⚡" kind="prefix">cite sources</npl-directive>',
    },
    {
      id: "minimal",
      label: "variant: minimal",
      note: "Glyph and instruction only — no qualifier, no elaboration.",
      code: '<npl-directive glyph="🔒">never print secret values</npl-directive>',
    },
  ],
  "npl-example": [
    {
      id: "default-label",
      label: "variant: default label",
      note: "With no label authored, the resolved label is the tag name — the default renders the same generated label element first, then the authored children untouched.",
      code: "<npl-example>authored children ride with the default label</npl-example>",
    },
  ],
};
