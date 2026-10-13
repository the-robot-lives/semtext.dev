#!/usr/bin/env node

/*
 * snap-tag.mjs — render-snapshot driver for one reference tag.
 *
 *   npm run snap:tag -- <tag> [--base <url>] [--dist <dir>] [--out <dir>]
 *   npm run snap:tag -- --stop        # stop the harness-managed dev server
 *
 * Captures PNGs of every example on /reference/<tag>/ in every view it
 * exposes (Source / Render pills + the rendered element's own mode
 * controls), at 1280 and 390 CSS px, dark theme (the site is dark-only),
 * plus one full-page shot per width. Writes an index.md manifest next to
 * the PNGs.
 *
 * Base URL. By default the harness renders the CURRENT worktree source:
 * it starts (once per worktree, on demand, lockfile-guarded) a private
 * `next dev` on a free 127.0.0.1 port and reuses it across runs. The
 * python server on :3000 serves the pre-built static export (web/out)
 * and can be stale — never the default. Pass --base <url> to render
 * against something else instead (the managed server is then untouched).
 *
 * Concurrency: every run owns its --out dir (default is per-tag); the
 * managed dev server is a single shared instance per worktree (starting
 * one per run would race on .next/), guarded by an atomic mkdir lock in
 * $TMPDIR/semtext-snap-dev-<worktree-hash>/. N runs on different tags
 * are safe side by side. Cypress clears the screenshots folder at run
 * start — never point --out at a directory other runs share.
 *
 * Output guarantees: no PNG under 10×10 px is ever emitted — degenerate
 * captures (collapsed / display:contents hosts) are retried against the
 * nearest laid-out ancestor and, failing that, recorded as a capture
 * failure in index.md instead.
 *
 * Exit codes: 0 ok · 1 capture failures · 2 usage · 3 base unreachable.
 *
 * Must run from web/ (npm guarantees it). See README.md for --dist and
 * the bundle sync recipe.
 */

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import os from "node:os";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DEFAULT_OUT_ROOT =
  process.env.SNAP_OUT_ROOT ||
  "/Users/keithbrings/Work/Space/Noizu/.tmp/semtext-docs-overhaul/snaps";
const MIN_PX = 10; // never emit an image smaller than this in either dimension

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage(code = 2) {
  console.error(
    "usage: npm run snap:tag -- <tag> [--base <url>] [--dist <dir>] [--out <dir>]\n" +
      "       npm run snap:tag -- --stop"
  );
  process.exit(code);
}

/* ---- managed dev server (one per worktree, lockfile-guarded) ---- */

const STATE_DIR = path.join(
  os.tmpdir(),
  `semtext-snap-dev-${createHash("sha1").update(WEB_ROOT).digest("hex").slice(0, 12)}`
);
const PORT_FILE = path.join(STATE_DIR, "port");
const PID_FILE = path.join(STATE_DIR, "pid");
const LOG_FILE = path.join(STATE_DIR, "dev.log");
const LOCK_DIR = path.join(STATE_DIR, "lock");
// Private distDir for the managed dev server (next.config.ts honours this
// env): concurrent `next dev` instances in one worktree clobber each
// other's .next/routes-manifest.json, so the harness server never shares
// the default .next with anyone else's.
const SNAP_DIST_DIR = path.join(SCRIPT_DIR, ".next-snap");

function readState() {
  try {
    return {
      port: parseInt(readFileSync(PORT_FILE, "utf8").trim(), 10) || null,
      pid: parseInt(readFileSync(PID_FILE, "utf8").trim(), 10) || null,
    };
  } catch {
    return { port: null, pid: null };
  }
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function tcpUp(port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const sock = net.connect({ host: "127.0.0.1", port });
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => done(true));
    sock.once("timeout", () => done(false));
    sock.once("error", () => done(false));
  });
}

/** Is the recorded managed server alive? Cleans up stale state. */
async function managedAlive() {
  const { port, pid } = readState();
  if (!port || !pid) return null;
  if (!pidAlive(pid)) {
    rmSync(PORT_FILE, { force: true });
    rmSync(PID_FILE, { force: true });
    return null;
  }
  return (await tcpUp(port)) ? `http://127.0.0.1:${port}` : null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

function killManaged() {
  const { pid } = readState();
  if (pid && pidAlive(pid)) {
    try {
      process.kill(-pid, "SIGTERM"); // detached group leader
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        /* gone */
      }
    }
  }
  rmSync(STATE_DIR, { recursive: true, force: true });
}

/**
 * Ensure the worktree's managed `next dev` is up; return its base URL.
 * First caller spawns it under an atomic mkdir lock; concurrent callers
 * wait for the recorded port instead of starting a second server (two
 * dev servers on one worktree would corrupt .next/).
 */
async function ensureManagedDev() {
  mkdirSync(STATE_DIR, { recursive: true });

  let base = await managedAlive();
  if (base) return base;

  const deadline = Date.now() + 240_000; // cold next dev + first compile
  let lockHeld = false;
  while (Date.now() < deadline) {
    try {
      mkdirSync(LOCK_DIR); // atomic acquire
      writeFileSync(path.join(LOCK_DIR, "pid"), String(process.pid));
      lockHeld = true;
      break;
    } catch {
      // Someone else holds the lock: break it if clearly stale, else wait.
      try {
        const ageMs = Date.now() - statSync(LOCK_DIR).mtimeMs;
        if (ageMs > 300_000) {
          rmSync(LOCK_DIR, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue; // lock vanished; retry acquire
      }
      await sleep(1000);
      base = await managedAlive();
      if (base) return base;
    }
  }
  if (!lockHeld) {
    throw new Error(
      `timed out waiting for another snap run to start the managed dev server (state: ${STATE_DIR})`
    );
  }

  try {
    // Re-check under the lock — a previous holder may have just finished.
    base = await managedAlive();
    if (base) return base;

    const nextBin = path.join(WEB_ROOT, "node_modules", ".bin", "next");
    if (!existsSync(nextBin)) {
      throw new Error(
        `${nextBin} not found — cannot manage a dev server; pass --base <url> instead`
      );
    }
    const port = await freePort();
    const logFd = openSync(LOG_FILE, "a");
    const child = spawn(nextBin, ["dev", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: WEB_ROOT,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: {
        ...process.env,
        BROWSER: "none",
        NEXT_TELEMETRY_DISABLED: "1",
        // Next joins distDir onto the project dir, so it must be relative.
        SNAP_NEXT_DIST_DIR: path.relative(WEB_ROOT, SNAP_DIST_DIR),
      },
    });
    child.unref();
    writeFileSync(PID_FILE, String(child.pid));
    writeFileSync(PORT_FILE, String(port));
    console.log(
      `snap: started managed next dev on http://127.0.0.1:${port} (pid ${child.pid}, log ${LOG_FILE})`
    );

    const upDeadline = Date.now() + 120_000;
    while (Date.now() < upDeadline) {
      if (!pidAlive(child.pid)) {
        throw new Error(
          `next dev exited during startup — see ${LOG_FILE} (tail: ` +
            `${tailOf(LOG_FILE)})`
        );
      }
      if (await tcpUp(port)) return `http://127.0.0.1:${port}`;
      await sleep(500);
    }
    throw new Error(`next dev did not open port ${port} within 120s — see ${LOG_FILE}`);
  } finally {
    if (lockHeld) rmSync(LOCK_DIR, { recursive: true, force: true });
  }
}

function tailOf(file, chars = 400) {
  try {
    return readFileSync(file, "utf8").trim().slice(-chars).replace(/\n/g, " | ");
  } catch {
    return "no log";
  }
}

/* ---- args ---- */
const argv = process.argv.slice(2);
let tag = "";
let base = "";
let dist = "";
let out = "";
let stopOnly = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--base") base = argv[++i] || usage();
  else if (a === "--dist") dist = argv[++i] || usage();
  else if (a === "--out") out = argv[++i] || usage();
  else if (a === "--stop") stopOnly = true;
  else if (a === "--help" || a === "-h") usage(0);
  else if (a.startsWith("--")) {
    console.error(`unknown flag: ${a}`);
    usage();
  } else if (!tag) tag = a;
  else usage();
}

if (stopOnly) {
  killManaged();
  console.log("snap: managed dev server stopped (if one was running)");
  process.exit(0);
}

if (!tag) usage();
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) {
  console.error(`not a tag slug: "${tag}" (expected lowercase letters, digits, hyphens)`);
  process.exit(2);
}
if (dist) {
  dist = path.resolve(dist);
  if (!existsSync(dist)) {
    console.error(`--dist directory does not exist: ${dist}`);
    process.exit(2);
  }
}
out = path.resolve(out || path.join(DEFAULT_OUT_ROOT, tag));
mkdirSync(out, { recursive: true });
rmSync(path.join(out, "notes.jsonl"), { force: true });
// The out dir is private to this run: clear stale contents so re-runs
// never produce "name (1).png" duplicates.
for (const entry of readdirSync(out, { withFileTypes: true })) {
  const p = path.join(out, entry.name);
  if (entry.isDirectory()) rmSync(p, { recursive: true, force: true });
  else rmSync(p, { force: true });
}

/* ---- resolve base ---- */
let managed = false;
if (base) {
  base = base.replace(/\/+$/, "");
} else {
  try {
    base = await ensureManagedDev();
    managed = true;
  } catch (err) {
    console.error(`snap: cannot provide a render server: ${err.message}`);
    process.exit(3);
  }
}

/* ---- preflight: the base must serve this tag's page ---- */
const pageUrl = `${base}/reference/${tag}/`;
let html = "";
try {
  // Generous timeout: on the managed dev server this request triggers the
  // route's first compile.
  const res = await fetch(pageUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(180_000),
  });
  html = await res.text();
  // 404 detection is STATUS-based only. Dev-mode pages embed the not-found
  // boundary text in every RSC flight payload, so body-substring sniffing
  // false-positives on valid 200 renders (verified by the highlight lane).
  if (res.status === 404 || (res.ok && html.includes("<title>404"))) {
    console.error(`preflight: ${pageUrl} served a 404 page — unknown tag "${tag}"?`);
    process.exit(3);
  }
  if (!res.ok) {
    console.error(`preflight: GET ${pageUrl} → ${res.status} ${res.statusText}`);
    const snippet = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
    if (snippet) console.error(`preflight: page says: ${snippet}`);
    if (managed) console.error(`preflight: dev server log: ${LOG_FILE}`);
    process.exit(3);
  }
} catch (err) {
  console.error(`preflight: cannot reach ${pageUrl}: ${err.message}`);
  if (managed) console.error(`preflight: dev server log tail: ${tailOf(LOG_FILE)}`);
  process.exit(3);
}
if (!html.includes("code-window")) {
  console.warn(
    `preflight note: ${pageUrl} carries no example figure — the run will capture full-page shots only`
  );
}

/* ---- run cypress ---- */
process.env.SNAP_TAG = tag;
process.env.SNAP_BASE = base;
process.env.SNAP_OUT = out;
if (dist) process.env.SNAP_DIST = dist;
else delete process.env.SNAP_DIST;

const configFile = path.join(SCRIPT_DIR, "cypress.config.mjs");
const spec = path.join(SCRIPT_DIR, "e2e", "snap.cy.ts");

const cypress = (await import("cypress")).default;
let result;
try {
  result = await cypress.run({
    configFile,
    spec,
    browser: "electron",
    headless: true,
    quiet: true,
  });
} catch (err) {
  console.error(`cypress failed to start: ${err.message}`);
  process.exit(1);
}

if (process.env.SNAP_DEBUG && result) {
  console.error(
    `[snap-debug] status=${result.status} totalFailed=${result.totalFailed} totalPassed=${result.totalPassed} keys=${Object.keys(result).join(",")}`
  );
}

/* ---- index.md manifest ---- */
// Cypress nests run-time screenshots under <screenshotsFolder>/<spec name>/;
// flatten one level so the out dir is exactly <png...> + index.md.
for (const entry of readdirSync(out, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const sub = path.join(out, entry.name);
  for (const f of readdirSync(sub)) {
    if (f.endsWith(".png")) {
      writeFileSync(path.join(out, f), readFileSync(path.join(sub, f)));
    }
  }
  rmSync(sub, { recursive: true, force: true });
}

const notes = [];
const notesFile = path.join(out, "notes.jsonl");
if (existsSync(notesFile)) {
  for (const line of readFileSync(notesFile, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      notes.push(JSON.parse(line));
    } catch {
      notes.push({ kind: "warn", msg: line });
    }
  }
  rmSync(notesFile, { force: true });
}

// Hard output gate: read each PNG's IHDR dimensions; delete and record any
// image under MIN_PX in either dimension (belt and braces over the in-page
// layout guard — nothing degenerate ever reaches a reviewer's vision model).
function pngSize(file) {
  const buf = readFileSync(file);
  if (
    buf.length < 24 ||
    buf.readUInt32BE(0) !== 0x89504e47 ||
    buf.toString("latin1", 12, 16) !== "IHDR"
  )
    return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const pngs = [];
for (const f of readdirSync(out).filter((f) => f.endsWith(".png")).sort()) {
  const full = path.join(out, f);
  const size = pngSize(full);
  if (!size) {
    rmSync(full, { force: true });
    notes.push({ kind: "fail", msg: `${f}: not a readable PNG — deleted, no image emitted` });
    continue;
  }
  if (size.w < MIN_PX || size.h < MIN_PX) {
    rmSync(full, { force: true });
    notes.push({
      kind: "fail",
      msg: `${f}: degenerate capture ${size.w}×${size.h}px (< ${MIN_PX}px) — deleted, no image emitted`,
    });
    continue;
  }
  pngs.push({ file: f, ...size });
}

const rows = pngs.map(({ file, w, h }) => {
  const m = file.match(/^(.+)-(\d+)\.png$/);
  const width = m ? m[2] : "?";
  const view = m ? m[1] : file;
  return `| \`${file}\` | ${view} | ${width} | ${w}×${h} |`;
});

const now = new Date();
const index = [
  `# snaps — \`${tag}\``,
  "",
  `- captured: ${now.toLocaleString()} (local)`,
  `- base: ${base}${managed ? " (harness-managed next dev, current worktree source)" : ""} — page /reference/${tag}/`,
  `- bundle: ${dist ? `private --dist \`${dist}\`` : "shipped `web/public/semtext/`"}`,
  `- widths: ${[...new Set(pngs.map((p) => (p.file.match(/-(\d+)\.png$/) || [, "?"])[1]))].join(", ")} · theme: dark (site chrome is dark-only)`,
  `- files: ${pngs.length}`,
  "",
  "| file | view | width | px |",
  "|---|---|---|---|",
  ...rows,
  "",
  "## Notes",
  ...(notes.length ? notes.map((n) => `- **${n.kind}**: ${n.msg}`) : ["- none"]),
  "",
].join("\n");
writeFileSync(path.join(out, "index.md"), index);

const failed = result?.totalFailed ?? 0;
const runOk =
  !!result && (result.status === "finished" || result.status === undefined) && failed === 0;
if (!runOk && failed === 0) {
  console.error(
    `cypress run reported status "${result?.status}": ${JSON.stringify(
      {
        message: result?.message,
        failures: (result?.failures || []).map((f) => f.message || f),
      },
      null,
      2
    )}`
  );
}
const captureFails = notes.filter((n) => n.kind === "fail").length;

console.log(`snap:${tag} — ${pngs.length} PNG(s) → ${out}`);
for (const { file, w, h } of pngs) console.log(`  ${file} (${w}×${h})`);
if (notes.length) {
  console.log("notes:");
  for (const n of notes) console.log(`  [${n.kind}] ${n.msg}`);
}
console.log(`index: ${path.join(out, "index.md")}`);
if (!runOk || failed > 0 || captureFails > 0) {
  if (failed > 0) console.error(`${failed} capture step(s) failed`);
  if (captureFails > 0) console.error(`${captureFails} capture(s) failed the output gate`);
  process.exit(1);
}
process.exit(0);
