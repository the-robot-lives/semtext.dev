/*
 * Editorial grouping of the SemText element reference, derived from the
 * spec (spec/schema/*.md in noizu-labs-ml/npl-enhanced-content): every
 * bucket is one job a reader hires the elements for, and every SemText tag
 * appears in exactly one bucket. The module validates that coverage at
 * import time — a tag added to the spec without a bucket here, a rename,
 * or a duplicate assignment throws at build instead of shipping a page
 * that silently drops (or doubles) an element.
 *
 * NPL tags are not bucketed: they are one display family (renders of NPL
 * prompt blocks) and keep their own single group. Consumers (the reference
 * index, tag pages, the docs sidebar) render REFERENCE_BUCKETS in order;
 * BUCKET_BY_TAG answers "which bucket is this tag in".
 *
 * Companion and alias names (a schema file's non-primary tags: `sem-detail`
 * vs `sem-details`, the `statement`/`conclusion` fact parts) sit next to
 * their primary — they share one contract, so a reader scanning a bucket
 * sees the whole family together.
 */

import type { TagRecord } from "@/data/reference-glossary";
import { SEM_TAGS } from "@/data/reference-tags";

export interface ReferenceBucket {
  /** Stable id — used for anchors and keys, never displayed as prose. */
  id: string;
  label: string;
  description: string;
  /** Ordered: primary/container tag first, then companions and aliases. */
  tags: TagRecord[];
}

const BUCKET_DEFS: Array<Omit<ReferenceBucket, "tags"> & { names: string[] }> = [
  {
    id: "document",
    label: "Document & structure",
    description:
      "The root wrapper, reading chrome, audience declarations and document-level metadata that frame a SemText document.",
    names: [
      "sem-enhanced-document",
      "sem-reader",
      "sem-audiences",
      "sem-profile",
      "sem-site-tree",
      "sem-file-tree",
      "agent",
    ],
  },
  {
    id: "prose",
    label: "Prose & code",
    description:
      "Content blocks beyond plain HTML — Markdown bodies, callouts and source listings with provenance.",
    names: ["sem-md", "sem-note", "sem-code", "sem-browser"],
  },
  {
    id: "disclosure",
    label: "Disclosure & views",
    description:
      "The same content under different reading interactions — occluded detail, Q→A reveal, markup flip, perspective tabs.",
    names: [
      "sem-details",
      "sem-detail",
      "highlight",
      "sem-reveal",
      "sem-source",
      "sem-views",
      "sem-view",
    ],
  },
  {
    id: "recall",
    label: "Facts & recall",
    description:
      "Assertable statement/conclusion pairs — the citable unit — with the quiz candidates and distractors built on them.",
    names: [
      "sem-facts",
      "sem-fact",
      "statement",
      "conclusion",
      "incorrect-statement",
      "sem-question",
      "sem-option",
    ],
  },
  {
    id: "data",
    label: "Data & tables",
    description:
      "Authored tables and the data-visualizer's named buckets, joins and editable queries.",
    names: [
      "sem-table",
      "sem-data-visualizer",
      "sem-data-source",
      "sem-data-join",
      "sem-data-query",
    ],
  },
  {
    id: "sequence",
    label: "Sequences & progress",
    description:
      "Ordered, status-annotated content — timelines, procedures and completion meters.",
    names: [
      "sem-chronology",
      "sem-event",
      "sem-procedure",
      "sem-step",
      "sem-progress",
      "sem-workflow",
    ],
  },
  {
    id: "definitions",
    label: "Definitions & citations",
    description:
      "Closed key/value assertions, the numbered works the prose cites, and the self-describing vocabulary cards (tag/attribute/API definitions).",
    names: [
      "sem-properties",
      "sem-property",
      "sem-references",
      "sem-reference",
      "sem-tag-def",
      "sem-tag-attr",
      "sem-api-call",
      "sem-api-param",
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge & guides",
    description:
      "Standalone knowledge artifacts — knowledge bases, FAQs, howtos, runbooks, troubleshooting guides, plans, requirements, changelogs, assessments and guard rails — the document containers the vocabulary epic absorbed from upstream.",
    names: [
      "sem-kb",
      "sem-faqs",
      "sem-faq",
      "sem-howto",
      "sem-runbook",
      "sem-tsgs",
      "sem-tsg",
      "sem-philosophy",
      "sem-plan",
      "sem-requirement",
      "sem-changelogs",
      "sem-changelog",
      "sem-tldr",
      "sem-summary",
      "sem-eval",
      "sem-rubric",
      "sem-threat-model",
      "sem-mockup",
      "sem-guard-rails",
      "sem-guard-rail",
    ],
  },
];

const byName = new Map(SEM_TAGS.map((t) => [t.name, t]));

function resolveBuckets(): ReferenceBucket[] {
  const seen = new Set<string>();
  const buckets = BUCKET_DEFS.map(({ names, ...b }) => {
    const tags: TagRecord[] = [];
    for (const name of names) {
      const t = byName.get(name);
      if (!t) {
        throw new Error(
          `reference-buckets: "${name}" is not a SemText tag in the inventory — rename or drop it`,
        );
      }
      if (seen.has(name)) {
        throw new Error(`reference-buckets: "${name}" is assigned to two buckets`);
      }
      seen.add(name);
      tags.push(t);
    }
    return { ...b, tags };
  });
  const missing = SEM_TAGS.filter((t) => !seen.has(t.name)).map((t) => t.name);
  if (missing.length) {
    throw new Error(
      `reference-buckets: SemText tags with no bucket: ${missing.join(", ")}`,
    );
  }
  return buckets;
}

/** The SemText reference, grouped for a reader, in display order. */
export const REFERENCE_BUCKETS: ReferenceBucket[] = resolveBuckets();

/** The bucket a SemText tag belongs to (NPL tags are not bucketed). */
export function bucketOf(name: string): ReferenceBucket | undefined {
  return REFERENCE_BUCKETS.find((b) => b.tags.some((t) => t.name === name));
}
