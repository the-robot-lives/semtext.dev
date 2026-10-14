#!/usr/bin/env node

/*
 * parity-check.mjs — live route parity: Next.js site vs the Hologram app.
 *
 *   node scripts/parity/parity-check.mjs --next <url> --app <url> [--out <dir>] [--manifest <path>]
 *   node scripts/parity/parity-check.mjs --next http://127.0.0.1:3100 --app http://127.0.0.1:4100
 *
 * For every manifest route (static pages + one row per /reference/<tag>)
 * both sides are fetched and compared. Verdicts:
 *
 *   PASS      the app serves the route; title/h1/key text match the manifest
 *             (or, where the manifest has no pinned expectation, match the
 *             live Next side).
 *   GAP       the app does not serve the route (404/405) — a route not yet
 *             ported. Reported, NEVER a failure: the harness runs to
 *             completion against whatever routes exist.
 *   FAIL      the app serves the route but diverges (wrong title, wrong h1,
 *             missing key text, 5xx crash). Crashes are loud, never silent.
 *   MISMATCH  the NEXT side itself deviates from the manifest (the site
 *             moved under us) — regenerate the manifest; never counted
 *             against the Hologram app.
 *
 * Screenshots are NOT taken here — run scripts/parity/snap-tag.mjs against
 * each base, then scripts/parity/snap-diff.mjs on the two output dirs.
 *
 * Exit codes: 0 PASS/GAP only · 1 any FAIL/ERROR row · 2 usage · 3 a base is
 * unreachable (nothing compared).
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST = path.join(SCRIPT_DIR, "parity-routes.json");
const DEFAULT_OUT_ROOT =
  process.env.PARITY_OUT_ROOT ||
  "/Users/keithbrings/Work/Space/Noizu/.tmp/semtext-parity";

const argv = process.argv.slice(2);
let nextBase = "";
let appBase = "";
let out = "";
let manifestPath = DEFAULT_MANIFEST;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--next") nextBase = argv[++i] || usage();
  else if (a === "--app") appBase = argv[++i] || usage();
  else if (a === "--out") out = argv[++i] || usage();
  else if (a === "--manifest") manifestPath = argv[++i] || usage();
  else if (a === "--help" || a === "-h") usage(0);
  else usage();
}
function usage(code = 2) {
  console.error(
    "usage: parity-check.mjs --next <base-url> --app <base-url> [--out <dir>] [--manifest <path>]"
  );
  process.exit(code);
}
if (!nextBase || !appBase) usage();
nextBase = nextBase.replace(/\/+$/, "");
appBase = appBase.replace(/\/+$/, "");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
out = path.resolve(
  out ||
    path.join(
      DEFAULT_OUT_ROOT,
      `check-${new Date().toISOString().replace(/[:.]/g, "-")}`
    )
);
mkdirSync(out, { recursive: true });

const FETCH_TIMEOUT = 30_000;

/**
 * Normalized page fetch. Next.js serves trailing-slash URLs; the Hologram
 * app serves extensionless paths — try the manifest path as-is, then the
 * de-slashed form, so the convention difference never shows up as a GAP.
 * Redirects are followed; `finalPath` is where we actually landed.
 */
async function fetchPage(base, routePath) {
  const candidates = [routePath];
  const deSlashed = routePath.replace(/\/+$/, "") || "/";
  if (deSlashed !== routePath) candidates.push(deSlashed);
  let last = null;
  for (const p of candidates) {
    let res;
    try {
      res = await fetch(base + p, {
        redirect: "follow",
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });
    } catch (err) {
      return { status: -1, html: "", finalPath: p, error: err.message };
    }
    const html = await res.text();
    const finalPath = new URL(res.url).pathname;
    last = { status: res.status, html, finalPath };
    if (res.ok) return last;
  }
  return last;
}

function clean(s) {
  return (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** title + first h1 + flattened text of a rendered page. */
function extract(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return {
    title: clean(title?.[1]),
    h1: clean(h1?.[1]),
    text: clean(html),
  };
}

/** The "route not ported" signatures: 404 unknown route, 405 a catch-all
 * answered with the wrong verb. A 5xx on ANY route stays a FAIL — crashes
 * must be loud, never papered over as gaps. */
function isGapStatus(status) {
  return status === 404 || status === 405;
}

/** Preflight: an unreachable base means nothing can be compared. */
async function preflight(base) {
  try {
    const res = await fetch(base + "/health", {
      signal: AbortSignal.timeout(10_000),
    });
    return res.status > 0; // any HTTP answer means the host is up
  } catch {
    try {
      const res = await fetch(base + "/", {
        signal: AbortSignal.timeout(10_000),
      });
      return res.status > 0;
    } catch {
      return false;
    }
  }
}

if (!(await preflight(nextBase))) {
  console.error(`parity: next base unreachable: ${nextBase}`);
  process.exit(3);
}
if (!(await preflight(appBase))) {
  console.error(`parity: app base unreachable: ${appBase}`);
  process.exit(3);
}

/** Expand the manifest into one concrete route per row. */
function expandRoutes() {
  const list = [];
  for (const route of manifest.routes) {
    if (route.kind === "template") {
      for (const tag of manifest.referenceTags) {
        list.push({
          path: `/reference/${tag}/`,
          kind: "page",
          owner: route.owner,
          title: route.title.replaceAll("<{tag}>", `<${tag}>`),
          h1: route.h1.replaceAll("<{tag}>", `<${tag}>`),
          keyText: route.keyText,
          tag,
        });
      }
    } else {
      list.push(route);
    }
  }
  return list;
}

const rows = [];
for (const route of expandRoutes()) {
  const next = await fetchPage(nextBase, route.path);
  const app = await fetchPage(appBase, route.path);

  const row = {
    path: route.path,
    owner: route.owner || "unassigned",
    next: { status: next.status, ...extract(next.html) },
    app: { status: app.status, ...extract(app.html) },
    verdict: "PASS",
    reasons: [],
  };

  if (next.status === -1 || app.status === -1) {
    row.verdict = "ERROR";
    row.reasons.push(
      `${next.status === -1 ? "next" : "app"} fetch failed: ${next.error || app.error}`
    );
    rows.push(row);
    continue;
  }

  if (next.status < 200 || next.status >= 400) {
    row.verdict = "MISMATCH";
    row.reasons.push(`Next side answered ${next.status} — site moved? regenerate the manifest`);
    rows.push(row);
    continue;
  }

  if (isGapStatus(app.status)) {
    row.verdict = "GAP";
    row.reasons.push(`Hologram app answered ${app.status} — route not ported yet`);
    rows.push(row);
    continue;
  }

  if (app.status < 200 || app.status >= 400) {
    row.verdict = "FAIL";
    row.reasons.push(
      `Hologram app answered ${app.status} (a crash on a ported route is loud, never silent)`
    );
    rows.push(row);
    continue;
  }

  // Both 200. The /elements soft-redirect page may be honored either as a
  // meta refresh (static-export parity) or a server redirect (finalPath).
  if (route.kind === "soft-redirect") {
    const target = route.redirectTarget;
    if (app.finalPath === target.replace(/\/+$/, "") || app.finalPath === target) {
      row.reasons.push("soft-redirect honored via server redirect");
    } else if (/http-equiv=["']?refresh/i.test(app.html)) {
      row.reasons.push("soft-redirect honored via meta refresh");
    } else {
      row.verdict = "FAIL";
      row.reasons.push(`no redirect to ${target} (neither meta refresh nor server redirect)`);
    }
    rows.push(row);
    continue;
  }

  // Title parity: manifest pins it; else live-next equality.
  if (route.title) {
    if (row.app.title !== route.title) {
      if (row.app.title === row.next.title) {
        row.verdict = "MISMATCH";
        row.reasons.push(
          `manifest title stale (both sides "${row.app.title}") — regenerate the manifest`
        );
      } else {
        row.verdict = "FAIL";
        row.reasons.push(`title "${row.app.title}" != expected "${route.title}"`);
      }
    }
  } else if (row.next.title && row.app.title !== row.next.title) {
    row.verdict = "FAIL";
    row.reasons.push(`title "${row.app.title}" != Next "${row.next.title}" (no manifest pin)`);
  }

  // h1 parity: manifest pins a distinctive prefix; else live-next prefix.
  if (row.verdict === "PASS") {
    const want = (route.h1 || "").replace(/…$/, "");
    const gotH1 = row.app.h1;
    if (want && !gotH1.startsWith(want)) {
      if (row.next.h1 && !row.next.h1.startsWith(want) && gotH1.startsWith(row.next.h1.slice(0, want.length))) {
        row.verdict = "MISMATCH";
        row.reasons.push(`manifest h1 stale (both sides "${gotH1}") — regenerate the manifest`);
      } else {
        row.verdict = "FAIL";
        row.reasons.push(`h1 "${gotH1}" does not start with "${want}"`);
      }
    } else if (!want && row.next.h1 && !gotH1.startsWith(row.next.h1.slice(0, 24))) {
      row.verdict = "FAIL";
      row.reasons.push(`h1 "${gotH1}" != Next "${row.next.h1}" (no manifest pin)`);
    }
  }

  // Key text: every pinned substring must appear somewhere on the app page.
  if (row.verdict === "PASS") {
    for (const needle of route.keyText || []) {
      if (!row.app.text.includes(needle)) {
        row.verdict = "FAIL";
        row.reasons.push(`key text missing on app page: "${needle}"`);
      }
    }
  }

  rows.push(row);
}

/* ---- summary ---- */
const counts = { PASS: 0, FAIL: 0, GAP: 0, MISMATCH: 0, ERROR: 0 };
for (const r of rows) counts[r.verdict] += 1;
const refGaps = rows.filter((r) => r.verdict === "GAP" && r.tag).length;

const results = {
  generatedAt: new Date().toISOString(),
  next: nextBase,
  app: appBase,
  manifest: manifestPath,
  counts,
  rows,
};
writeFileSync(path.join(out, "parity-results.json"), JSON.stringify(results, null, 2));

/* ---- markdown report ---- */
const esc = (s) => String(s || "").replace(/\|/g, "\\|");
const md = [
  `# Route parity — Next.js → Hologram`,
  "",
  `- run: ${results.generatedAt}`,
  `- next: ${nextBase}`,
  `- app: ${appBase}`,
  `- verdicts: ${counts.PASS} PASS · ${counts.GAP} GAP · ${counts.FAIL} FAIL · ${counts.MISMATCH} MISMATCH` +
    (counts.ERROR ? ` · ${counts.ERROR} ERROR` : ""),
  counts.GAP
    ? `- gaps: ${counts.GAP - refGaps} top-level route(s), ${refGaps} reference tag page(s) — not ported yet (informational, not a failure)`
    : "- gaps: none — every Next route is served by the Hologram app",
  "",
  "| route | verdict | next (status · title) | app (status · title) | detail |",
  "|---|---|---|---|---|",
  ...rows.map(
    (r) =>
      `| \`${r.path}\` | ${r.verdict} | ${r.next.status} · ${esc(r.next.title) || "—"} | ${r.app.status} · ${esc(r.app.title) || "—"} | ${esc(r.reasons.join("; ")) || "—"} |`
  ),
  "",
].join("\n");
writeFileSync(path.join(out, "parity-report.md"), md);

/* ---- console summary (worst rows only) ---- */
console.log(
  `parity: ${counts.PASS} PASS · ${counts.GAP} GAP · ${counts.FAIL} FAIL · ${counts.MISMATCH} MISMATCH` +
    (counts.ERROR ? ` · ${counts.ERROR} ERROR` : "")
);
for (const r of rows) {
  if (r.verdict === "FAIL" || r.verdict === "ERROR")
    console.log(`  FAIL ${r.path}: ${r.reasons.join("; ")}`);
}
const gaps = rows.filter((r) => r.verdict === "GAP");
if (gaps.length) {
  const shown = gaps.slice(0, 12).map((r) => r.path);
  console.log(
    `  GAP (${gaps.length}): ${shown.join(", ")}${gaps.length > shown.length ? `, +${gaps.length - shown.length} more` : ""}`
  );
}
for (const r of rows) {
  if (r.verdict === "MISMATCH") console.log(`  MISMATCH ${r.path}: ${r.reasons.join("; ")}`);
}
console.log(`report: ${path.join(out, "parity-report.md")}`);

process.exit(counts.FAIL + counts.ERROR > 0 ? 1 : 0);
