#!/usr/bin/env node

/*
 * snap-diff.mjs — compare two snap output dirs (same route captured on the
 * Next.js side and the Hologram side) into a per-shot pixel-diff report.
 *
 *   node scripts/parity/snap-diff.mjs <dirNext> <dirApp> [--out <dir>] [--threshold 0.1]
 *
 * Cross-implementation renders are never pixel-identical (different UI
 * frameworks): the diff percentages are REVIEW EVIDENCE for a human/vision
 * pass, not a pass/fail gate — the report ranks shots by divergence so the
 * worst offenders are reviewed first. Pairs by PNG filename; shots missing
 * from either side are listed (a missing side is usually a GAP: the route
 * or a view was not ported).
 *
 * Output: <out>/diff-report.md + diff PNGs (red = divergent pixels).
 * Exit codes: 0 ok · 1 usage · 3 an input dir is missing.
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const E2E_ROOT = path.join(APP_ROOT, "e2e");

const DEFAULT_OUT_ROOT =
  process.env.PARITY_OUT_ROOT ||
  "/Users/keithbrings/Work/Space/Noizu/.tmp/semtext-parity";

const argv = process.argv.slice(2);
const positional = [];
let out = "";
let threshold = 0.1;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") out = argv[++i] || usage();
  else if (a === "--threshold") threshold = parseFloat(argv[++i]) || usage();
  else if (a === "--help" || a === "-h") usage(0);
  else positional.push(a);
}
function usage(code = 2) {
  console.error("usage: snap-diff.mjs <dirNext> <dirApp> [--out <dir>] [--threshold 0.1]");
  process.exit(code);
}
if (positional.length !== 2) usage();
const [dirNext, dirApp] = positional.map((p) => path.resolve(p));
for (const d of [dirNext, dirApp]) {
  if (!existsSync(d) || !statSync(d).isDirectory()) {
    console.error(`not a directory: ${d}`);
    process.exit(3);
  }
}
out = path.resolve(out || path.join(DEFAULT_OUT_ROOT, "diff"));
mkdirSync(out, { recursive: true });

const requireFromE2E = createRequire(path.join(E2E_ROOT, "package.json"));
const { PNG } = requireFromE2E("pngjs");
const pixelmatch = requireFromE2E("pixelmatch").default || requireFromE2E("pixelmatch");

function pngsOf(dir) {
  return readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
}

function readPng(file) {
  return PNG.sync.read(readFileSync(file));
}

const nextPngs = pngsOf(dirNext);
const appPngs = pngsOf(dirApp);
const names = [...new Set([...nextPngs, ...appPngs])];

const rows = [];
for (const name of names) {
  const a = nextPngs.includes(name) ? path.join(dirNext, name) : null;
  const b = appPngs.includes(name) ? path.join(dirApp, name) : null;
  if (!a || !b) {
    rows.push({ name, verdict: "MISSING", detail: `${!a ? "next" : "app"} side has no shot` });
    continue;
  }
  try {
    const imgA = readPng(a);
    const imgB = readPng(b);
    if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
      rows.push({
        name,
        verdict: "SIZE-DIFF",
        detail: `next ${imgA.width}x${imgA.height} vs app ${imgB.width}x${imgB.height}`,
      });
      continue;
    }
    const diff = new PNG({ width: imgA.width, height: imgA.height });
    const diverged = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, {
      threshold,
    });
    const pct = (100 * diverged) / (imgA.width * imgA.height);
    const diffPng = path.join(out, `diff-${name}`);
    writeFileSync(diffPng, PNG.sync.write(diff));
    copyFileSync(a, path.join(out, `next-${name}`));
    copyFileSync(b, path.join(out, `app-${name}`));
    rows.push({ name, verdict: pct < 1 ? "MATCH" : pct < 10 ? "CLOSE" : "DIVERGENT", detail: `${pct.toFixed(2)}% pixels differ` });
  } catch (err) {
    rows.push({ name, verdict: "ERROR", detail: err.message });
  }
}

const counts = {};
for (const r of rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;

const rank = { DIVERGENT: 0, "SIZE-DIFF": 1, MISSING: 2, ERROR: 3, CLOSE: 4, MATCH: 5 };
rows.sort((x, y) => (rank[x.verdict] ?? 9) - (rank[y.verdict] ?? 9));

const md = [
  `# Snap diff — Next vs Hologram`,
  "",
  `- next: ${dirNext}`,
  `- app: ${dirApp}`,
  `- shots: ${rows.length} — ${counts.MATCH || 0} MATCH · ${counts.CLOSE || 0} CLOSE · ${counts.DIVERGENT || 0} DIVERGENT · ${counts["SIZE-DIFF"] || 0} SIZE-DIFF · ${counts.MISSING || 0} MISSING`,
  "- percentages are review evidence (cross-framework renders are never pixel-identical), not a gate.",
  "",
  "| shot | verdict | detail |",
  "|---|---|---|",
  ...rows.map((r) => `| \`${r.name}\` | ${r.verdict} | ${r.detail} |`),
  "",
].join("\n");
writeFileSync(path.join(out, "diff-report.md"), md);

console.log(`snap-diff: ${rows.length} shot(s) — ${counts.MATCH || 0} MATCH · ${counts.CLOSE || 0} CLOSE · ${counts.DIVERGENT || 0} DIVERGENT · ${counts["SIZE-DIFF"] || 0} SIZE-DIFF · ${counts.MISSING || 0} MISSING`);
console.log(`report: ${path.join(out, "diff-report.md")}`);
