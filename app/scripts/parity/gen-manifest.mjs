#!/usr/bin/env node

/*
 * gen-manifest.mjs — regenerate the route parity manifest from the live
 * Next.js site (the source of truth the Hologram replatform must match).
 *
 *   node scripts/parity/gen-manifest.mjs --next <base-url> [--manifest <path>]
 *   node scripts/parity/gen-manifest.mjs --from <web-out-dir> [--manifest <path>]
 *   node scripts/parity/gen-manifest.mjs --next http://127.0.0.1:<port>   # e.g. the snap harness's managed next dev
 *
 * For every route already listed in the manifest this fetches the Next.js
 * page and refreshes title + first <h1>; routes never LOSE their entry here
 * (a dropped Next route should be removed deliberately, by editing the
 * manifest), but NEW top-level Next routes are not auto-discovered — add the
 * entry once by hand, then this keeps title/h1 honest.
 *
 * --from reads static-export index.html files instead of a live server
 * (same extraction, no server needed; out/ can lag the working tree).
 *
 * Exit codes: 0 ok · 1 some routes failed to refresh (manifest still written,
 * failures noted in $comment) · 2 usage · 3 cannot reach base / dir.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST = path.join(SCRIPT_DIR, "parity-routes.json");

const argv = process.argv.slice(2);
let nextBase = "";
let fromDir = "";
let manifestPath = DEFAULT_MANIFEST;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--next") nextBase = argv[++i] || usage();
  else if (a === "--from") fromDir = argv[++i] || usage();
  else if (a === "--manifest") manifestPath = argv[++i] || usage();
  else if (a === "--help" || a === "-h") usage(0);
  else usage();
}
function usage(code = 2) {
  console.error(
    "usage: gen-manifest.mjs --next <base-url> [--manifest <path>]\n" +
      "       gen-manifest.mjs --from <web-out-dir> [--manifest <path>]"
  );
  process.exit(code);
}
if (!nextBase === !fromDir) {
  console.error("exactly one of --next <url> or --from <dir> is required");
  usage();
}
if (nextBase) nextBase = nextBase.replace(/\/+$/, "");
if (fromDir) fromDir = path.resolve(fromDir);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

function cleanHtml(s) {
  // Decode first, then strip script regions (decoded payloads included),
  // then drop remaining tags — text extraction only, never a sink.
  return stripScripts((s || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&"))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** title + first h1 from a rendered Next page. */
// Hologram SSR (and any page embedding code samples in scripts) can carry
// literal markup bytes inside <script> payloads — never extract from those.
function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "");
}

function extract(html) {
  const visible = stripScripts(html);
  const title = visible.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  // the page h1 lives inside <main> on both sides; scoping keeps payload
  // residue or chrome-level headings out of the seed
  const mainScope = visible.match(/<main\b[\s\S]*<\/main>/i);
  const h1Scope = mainScope ? mainScope[0] : visible;
  const h1 = h1Scope.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return {
    title: cleanHtml(title?.[1]) || null,
    h1: cleanHtml(h1?.[1]) || null,
  };
}

const failures = [];
let refreshed = 0;

for (const route of manifest.routes) {
  if (route.kind === "template") continue; // tags refreshed via referenceTags below
  const urlPath = route.path === "/" ? "/" : route.path;
  let html = "";
  try {
    if (nextBase) {
      const res = await fetch(nextBase + urlPath, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      html = await res.text();
    } else {
      const file = path.join(fromDir, urlPath, "index.html");
      if (!existsSync(file)) throw new Error(`no static export at ${file}`);
      html = readFileSync(file, "utf8");
    }
  } catch (err) {
    failures.push(`${route.path}: ${err.message}`);
    continue;
  }
  const { title, h1 } = extract(html);
  let changed = [];
  if (title && title !== route.title) {
    route.title = title;
    changed.push("title");
  }
  if (h1) {
    // The manifest pins a distinctive PREFIX of the h1 (h1s can carry
    // trailing punctuation), so only refresh when the current prefix no
    // longer matches the live h1 at all.
    if (!(h1.startsWith(route.h1.replace(/[…]$/, "")) || route.h1.startsWith(h1))) {
      route.h1 = h1.length > 48 ? `${h1.slice(0, 45)}…` : h1;
      changed.push("h1");
    }
  }
  if (changed.length) {
    console.log(`${route.path}: ${changed.join(" + ")} → ${JSON.stringify({ title: route.title, h1: route.h1 })}`);
    refreshed++;
  }
}

manifest.generatedAt = new Date().toISOString().slice(0, 10);
manifest.generatedFrom = nextBase
  ? `live Next.js site at ${nextBase} (${new Date().toISOString()})`
  : `static export ${fromDir} (${new Date().toISOString()})`;
manifest.$comment = [
  ...manifest.$comment.slice(0, 4),
  ...(failures.length ? [`REFRESH FAILURES (entries kept as-was): ${failures.join(" · ")}`] : []),
];

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `manifest: ${manifestPath} — ${refreshed} route(s) changed, ${failures.length} refresh failure(s)`
);
process.exit(failures.length ? 1 : 0);
