#!/usr/bin/env node
/*
 * seed-claude-examples.mjs — seed/refresh app/backend/priv/data/claude-examples.json
 * (the per-tag "SemText — Claude example" every /reference card shows).
 *
 * For every tag in priv/data/elements.json plus the glossary supplement
 * (lib/semtext/reference/glossary.ex):
 *   - an entry with "source": "hand" is kept verbatim (hand-polished);
 *   - otherwise the entry is (re)generated from the tag's spec example,
 *     normalised to the sem-text-author conventions, with "source": "seed".
 * Entries naming tags that no longer exist are dropped (and listed).
 * Then every example is validated with bin/semtext-validate.mjs (wrapped in
 * a minimal <sem-enhanced-document>) and the result is summarised.
 *
 * Runs WITHOUT compiling the Elixir app on purpose: Semtext.Reference.Tags
 * fails the build when a tag has no example, so after a subtree pull adds a
 * tag this script is the way back to a green build.
 *
 * Usage:  node app/scripts/seed-claude-examples.mjs [--check]
 *   --check  write nothing; exit 1 when the file is missing a tag or a
 *            seed entry is stale.
 * (`mix semtext.gen_reference --seed-claude-examples` runs it too.)
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backend = resolve(here, "..", "backend");
const repoRoot = resolve(here, "..", "..");
const privData = join(backend, "priv", "data");
const outPath = join(privData, "claude-examples.json");
const check = process.argv.includes("--check");

// ————— tag inventory —————
const elements = JSON.parse(readFileSync(join(privData, "elements.json"), "utf8"));
const tags = new Map(elements.tags.map((t) => [t.name, t.example || ""]));

// Glossary supplement: Norm.tag("name", ... example: ~S""" ... """
const glossarySrc = readFileSync(join(backend, "lib", "semtext", "reference", "glossary.ex"), "utf8");
for (const m of glossarySrc.matchAll(/Norm\.tag\("([^"]+)"[\s\S]*?example: ~S"""\n([\s\S]*?)\n\s*"""/g)) {
  tags.set(m[1], m[2]);
}

// ————— normalisation (sem-text-author conventions) —————
// Presentation roles / ARIA the runtime derives are dropped (procedures,
// lists, properties and meters need none in authored source); <strong>/<b>
// become <highlight>; <em>/<i> become the *text* sugar; common indent goes.
export function normalize(code) {
  let s = code.replace(/\r\n/g, "\n");
  s = s.replace(/\s+role="(list|listitem|definition|meter|tabpanel)"/g, "");
  s = s.replace(/\s+aria-(label|valuemin|valuemax|valuenow)="[^"]*"/g, "");
  s = s.replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "<highlight>$2</highlight>");
  s = s.replace(/<(em|i)>([\s\S]*?)<\/\1>/g, "*$2*");
  // An element whose attributes were all stripped may now end in " >"/newline.
  s = s.replace(/[ \t]*\n[ \t]*>/g, ">").replace(/ +>/g, ">");
  return dedent(s).trim();
}

function dedent(s) {
  const lines = s.split("\n");
  const indents = lines.filter((l) => l.trim() !== "").map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min).replace(/\s+$/, "")).join("\n");
}

// ————— merge —————
let current = { examples: {} };
try {
  current = JSON.parse(readFileSync(outPath, "utf8"));
} catch {
  /* first run */
}
const prev = current.examples || {};
const out = {};
let hand = 0;
let seeded = 0;
let stale = 0;
const missingExample = [];

for (const name of [...tags.keys()].sort()) {
  const rec = prev[name];
  if (rec && rec.source === "hand") {
    out[name] = rec;
    hand++;
    continue;
  }
  const code = normalize(tags.get(name) || "");
  if (code === "") {
    missingExample.push(name);
    continue;
  }
  const next = { source: "seed", code: code.split("\n") };
  if (!rec || JSON.stringify(rec) !== JSON.stringify(next)) stale++;
  out[name] = next;
  seeded++;
}
const dropped = Object.keys(prev).filter((n) => !tags.has(n));

if (missingExample.length) {
  console.error(`no spec example to seed (hand-author these): ${missingExample.join(", ")}`);
}

if (check) {
  const bad = stale + missingExample.length + dropped.length;
  console.log(`claude-examples: ${hand} hand, ${seeded} seed, ${stale} stale, ${dropped.length} dropped`);
  process.exit(bad ? 1 : 0);
}

const doc = {
  $comment: [
    "Per-tag 'SemText — Claude example' for the /reference cards (Semtext.Reference.ClaudeExamples).",
    "source=hand: hand-polished, never touched by the seeder. source=seed: regenerated from the",
    "spec example by app/scripts/seed-claude-examples.mjs. Every tag MUST have an entry (build fails).",
  ],
  examples: out,
};
writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
console.log(
  `claude-examples: ${hand} hand-polished, ${seeded} seeded (${stale} changed)` +
    (dropped.length ? `, dropped ${dropped.join(", ")}` : "") +
    ` -> ${outPath}`,
);

// ————— validate —————
const dir = mkdtempSync(join(tmpdir(), "claude-examples-"));
try {
  for (const [name, rec] of Object.entries(out)) {
    const code = rec.code.join("\n");
    const body = code.includes("<sem-enhanced-document")
      ? code
      : `<sem-enhanced-document>\n${code}\n</sem-enhanced-document>`;
    writeFileSync(
      join(dir, `${name}.html`),
      `<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><title>${name}</title></head><body>\n${body}\n</body></html>\n`,
    );
  }
  let raw;
  try {
    raw = execFileSync("node", [join(repoRoot, "bin", "semtext-validate.mjs"), "--format", "json", join(dir, "*.html")], {
      encoding: "utf8",
    });
  } catch (e) {
    raw = e.stdout;
  }
  const report = JSON.parse(raw);
  const byFile = report.files
    .map((f) => [f.file.split("/").pop().replace(/\.html$/, ""), f.diagnostics])
    .filter(([, d]) => d.length);
  console.log(`validator: ${report.totals.errors} errors, ${report.totals.warnings} warnings`);
  for (const [name, diags] of byFile) {
    const summary = [...new Set(diags.map((d) => `${d.severity}:${d.rule}`))].join(", ");
    console.log(`  ${name}: ${summary}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
