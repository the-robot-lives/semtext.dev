import { ALL_TAGS, NPL_TAGS, SEM_TAGS, tagHref } from "@/data/reference-tags";

/*
 * Build-time search index for the header search box. Plain TS: everything
 * here is computed from web/data/* plus the CLI command list at module
 * load — no network, no service, and nothing the client bundle does not
 * already ship as static strings. components/search.tsx filters this list
 * in the browser.
 */

export type SearchGroup = "SemText elements" | "NPL elements" | "CLI commands";

/** Sidebar order of the result groups. */
export const SEARCH_GROUPS: SearchGroup[] = [
  "SemText elements",
  "NPL elements",
  "CLI commands",
];

export interface SearchEntry {
  key: string;
  group: SearchGroup;
  /** Primary label shown in the result row (the tag or the command line). */
  title: string;
  /** One-line explanation shown under the title. */
  hint: string;
  /** Lowercased text the query is matched against: title, hint, summary,
   *  description, attribute names and descriptions, child names. */
  haystack: string;
  href: string;
}

/*
 * The CLI commands, mirroring the "CLI commands" section of app/docs/page.tsx
 * (the CLI reference lives there today). Keep the two lists in agreement —
 * the docs page owns the prose; this list exists so search can deep-link it.
 * Every entry points at that section's anchor; per-command heading ids are
 * a cross-lane request (nav lane report, 2026-10-14).
 */
export interface CliCommandEntry {
  command: string;
  summary: string;
  href: string;
}

export const CLI_COMMANDS: CliCommandEntry[] = [
  {
    command: "semtext doc.semtext.html",
    summary:
      "Read a document raw — prints the authored HTML in the terminal: sections, facts, steps, readable as plain text.",
    href: "/docs/#cli-commands",
  },
  {
    command: "semtext tui doc.semtext.html",
    summary:
      "Interactive terminal UI — navigate sections, flip flashcards, run quizzes, inspect structured records.",
    href: "/docs/#cli-commands",
  },
  {
    command: "semtext --render doc.semtext.html",
    summary:
      "Render for agents — a plain-text representation designed for language models, to stdout.",
    href: "/docs/#cli-commands",
  },
  {
    command: "semtext extract [--format yaml|json] doc.semtext.html",
    summary:
      "Extract structured records — facts, steps, properties, references — as YAML or JSON.",
    href: "/docs/#cli-commands",
  },
  {
    command: "semtext validate doc.semtext.html",
    summary:
      "Check a document — reports structural issues; exits 0 when the document is valid.",
    href: "/docs/#cli-commands",
  },
  {
    command: "semtext --version",
    summary: "Print the CLI and vocabulary version.",
    href: "/docs/#cli-commands",
  },
];

function tagEntry(name: string, group: SearchGroup): SearchEntry {
  const t = ALL_TAGS.find((tag) => tag.name === name)!;
  const hint = t.summary || t.description;
  const haystack = [
    t.name,
    hint,
    t.description,
    ...t.attributes.map((a) => `${a.name} ${a.description}`),
    ...t.children.map((c) => c.name),
    t.family === "sem" ? "semtext tag element" : "npl prompt tag element",
  ]
    .join(" ")
    .toLowerCase();
  return { key: `search-${t.name}`, group, title: t.name, hint, haystack, href: tagHref(t.name) };
}

const TAG_ENTRIES: SearchEntry[] = [
  ...SEM_TAGS.map((t) => tagEntry(t.name, "SemText elements")),
  ...NPL_TAGS.map((t) => tagEntry(t.name, "NPL elements")),
];

const CLI_ENTRIES: SearchEntry[] = CLI_COMMANDS.map((c) => ({
  key: `search-cli-${c.command}`,
  group: "CLI commands",
  title: c.command,
  hint: c.summary,
  haystack: `${c.command} cli command ${c.summary}`.toLowerCase(),
  href: c.href,
}));

/** Every searchable row, in sidebar group order. */
export const SEARCH_ENTRIES: SearchEntry[] = [...TAG_ENTRIES, ...CLI_ENTRIES];

/** Case-insensitive substring search over the index. */
export function searchEntries(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchEntry[] = [];
  for (const group of SEARCH_GROUPS) {
    for (const e of SEARCH_ENTRIES) {
      if (e.group === group && e.haystack.includes(q)) hits.push(e);
    }
  }
  return hits;
}
