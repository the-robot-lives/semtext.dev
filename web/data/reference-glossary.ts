/*
 * Hand-authored supplement to data/elements.json.
 *
 * data/elements.json is generated (scripts/build-elements-index.mjs in
 * noizu-labs-ml/npl-enhanced-content) from spec/schema/sem-*.md and
 * spec/schema/npl/*.md — never edit that file by hand. These eight
 * elements are documented in the spec (root conventions and the sem-facts
 * family) but have no schema file of their own, so the generator cannot
 * emit them.
 *
 * Their content moved verbatim from the retired /elements/ glossary page
 * (app/elements/data.ts), which was itself sourced from the spec's §5 tag
 * catalog and spec/schema/semtext.schema.json. Options listed here are
 * exactly the ones the glossary stated — nothing invented. Entries whose
 * source gave no options carry attributes: [] and the page says so, the
 * same way it marks generated gaps. Where the glossary marked an element
 * `validated: false` (not yet in the validator's schema) that status is
 * kept in the description.
 *
 * The shared Tag* types live here so the page and this supplement cannot
 * drift apart.
 */

export type TagFamily = "sem" | "npl";

export interface TagAttr {
  name: string;
  required: boolean | null;
  type: string;
  allowedValues: string[];
  default: string | null;
  description: string;
}

export interface TagChild {
  name: string;
  note: string;
}

export interface TagRecord {
  name: string;
  family: TagFamily;
  source: string;
  summary: string;
  description: string;
  attributes: TagAttr[];
  children: TagChild[];
  example: string;
  optionsIn?: string;
}

const attr = (
  name: string,
  type: string,
  required: boolean | null = null,
): TagAttr => ({
  name,
  required,
  type,
  allowedValues: [],
  default: null,
  description: "",
});

export const GLOSSARY_TAGS: TagRecord[] = [
  {
    name: "sem-enhanced-document",
    family: "sem",
    source: "spec/conventions.md",
    summary: "Required root wrapper; delimits extraction scope.",
    description:
      "Exactly one per document when the vocabulary is used. Plain HTML inside stays ordinary HTML; extraction scopes to the wrapper when present, otherwise to <body>.",
    attributes: [
      attr("role", 'landmark, e.g. "main"'),
      attr("audience", "document default reader profile"),
      attr("id · kind · tags", "global attributes"),
    ],
    children: [],
    example: `<sem-enhanced-document>
  <h1 data-kind="title">Auth notes</h1>
  <sem-note variant="tip">Ordinary HTML and sem-* elements mix freely inside.</sem-note>
</sem-enhanced-document>`,
  },
  {
    name: "agent",
    family: "sem",
    source: "spec/conventions.md",
    summary: "Document-level metadata aimed at a model: name, bio, instructions.",
    description:
      "The tag form is bare <agent> (Appendix A maps it to div.sem-agent); extraction names the record type sem-agent. Inert to the browser, a record to the extractor.",
    attributes: [
      attr("name", "bare semantic child — the agent's name"),
      attr("bio", "bare semantic child — one-line persona"),
      attr("instructions", "bare semantic child — agent-facing rules"),
      attr("id · kind · tags", "global attributes"),
    ],
    children: [],
    example: `<agent>
  <name>SemText Guide</name>
  <bio>Answers questions about SemText from the facts on the page.</bio>
  <instructions>Answer only from sem-fact records; cite ids.</instructions>
</agent>`,
  },
  {
    name: "statement",
    family: "sem",
    source: "spec/schema/sem-facts.md",
    summary: "Fact part — the prompt side of a sem-fact.",
    description: "Bare semantic child of sem-fact; any inline content.",
    attributes: [],
    children: [],
    example: `<sem-fact id="g-f-oidc" kind="concept">
  <statement>OIDC tokens travel in the Authorization header</statement>
  <conclusion>Resource servers validate the bearer token on every call.</conclusion>
</sem-fact>`,
  },
  {
    name: "conclusion",
    family: "sem",
    source: "spec/schema/sem-facts.md",
    summary: "Fact part — the citable takeaway extraction returns.",
    description:
      "Bare semantic child of sem-fact; any inline content. Conclusions are verbatim-citable assertions; distractors never are.",
    attributes: [],
    children: [],
    example: `<sem-fact id="g-f-oidc2" kind="concept">
  <statement>OIDC tokens travel in the Authorization header</statement>
  <conclusion>Resource servers validate the bearer token on every call.</conclusion>
</sem-fact>`,
  },
  {
    name: "sem-distractor",
    family: "sem",
    source: "spec/schema/sem-facts.md",
    summary: "Explicit wrong candidate for quiz view; never extracted as a claim.",
    description:
      "Child of sem-fact; quiz view only. Up to 3 distractors win over sibling conclusions when the quiz builds its options; with scripts off they render labelled, hidden by nothing.",
    attributes: [],
    children: [],
    example: `<sem-fact id="g-f-storage" kind="anti-pattern">
  <statement>JWTs belong in memory or httpOnly cookies</statement>
  <conclusion>localStorage is readable by any script on the page.</conclusion>
  <sem-distractor>localStorage is fine if the token is short-lived.</sem-distractor>
</sem-fact>`,
  },
  {
    name: "sem-embed",
    family: "sem",
    source: "spec/conventions.md",
    summary: "Embed another SemText document, or one block of it.",
    description:
      "Renderer not yet implemented (spec/schema embed contract); the element is catalogued, not yet wired in any tier, and the validator's schema does not know it yet.",
    attributes: [
      attr(
        "source",
        "referenced document (required); may carry #section-id",
        true,
      ),
      attr("view", "selected block id inside the source"),
      attr("mode", 'e.g. "card"'),
    ],
    children: [],
    example: `<sem-embed source="../glossary.sem.html"></sem-embed>
<sem-embed source="../other.sem.html#section-id"></sem-embed>
<sem-embed source="../glossary.sem.html" view="g-jwt" mode="card"></sem-embed>`,
  },
  {
    name: "sem-question",
    family: "sem",
    source: "spec/conventions.md",
    summary: "Quiz block (Tier 1 demo element).",
    description:
      "Children: a prompt and sem-option candidates. Tier-1 demo element — no tier ships a handler yet, and the validator's schema does not know it yet.",
    attributes: [attr("type", '"mc" — multiple choice')],
    children: [],
    example: `<sem-question type="mc">
  <p data-kind="prompt">Which header carries the OIDC token?</p>
  <sem-option correct>Authorization</sem-option>
  <sem-option>Cookie</sem-option>
</sem-question>`,
  },
  {
    name: "sem-option",
    family: "sem",
    source: "spec/conventions.md",
    summary: "Quiz answer candidate; correct marks the right one.",
    description:
      "Sugar: ✅ / ✗ prefixes mark correct / distractor options. Tier-1 demo element — the validator's schema does not know it yet.",
    attributes: [attr("correct", "flag — the right answer")],
    children: [],
    example: `<sem-question type="mc">
  <p data-kind="prompt">Which header carries the OIDC token?</p>
  <sem-option correct>Authorization</sem-option>
  <sem-option>Cookie</sem-option>
</sem-question>`,
  },
];
