#!/usr/bin/env node

/*
 * snap-tag.mjs — render-snapshot driver for ONE route, against EITHER side
 * of the semtext.dev replatform (Next.js landing-preview site or the
 * Hologram app). Port of web/scripts/snap/snap-tag.mjs (same discovery
 * contract, same capture guarantees); route-parameterized so it snapshots
 * any page, not only /reference/<tag>/.
 *
 *   node scripts/parity/snap-tag.mjs --base <url> --route <path> [--tag <slug>] [--dist <dir>] [--out <dir>]
 *   node scripts/parity/snap-tag.mjs --base <url> --tag highlight
 *   node scripts/parity/snap-tag.mjs --start-app            # managed Hologram dev server (see below)
 *   node scripts/parity/snap-tag.mjs --next-base            # reuse the landing-preview harness's managed next dev
 *   node scripts/parity/snap-tag.mjs --stop                 # stop managed servers this driver owns
 *
 * --route <path>  page to capture (default: /reference/<tag>/ when --tag is
 *                 given). --tag only names shots + the out dir when --route
 *                 is used directly.
 * --base <url>    REQUIRED for a capture run: render against this server.
 * --start-app     boot a private Hologram dev server (HOLOGRAM_START=1,
 *                 private MIX_BUILD_ROOT, free 127.0.0.1 port) from this
 *                 worktree's app/backend, print its base URL, and leave it
 *                 running for reuse. Pass it again when it is already up to
 *                 just print the URL. Pair with --route/--tag to capture in
 *                 the same invocation.
 * --next-base     resolve the landing-preview web harness's managed next dev
 *                 (same $TMPDIR state dir that harness uses) and print its
 *                 base URL; exits 3 when no harness server is running.
 * --stop          stop the managed Hologram server this driver started.
 *
 * A GAP is not a crash: when the base answers 404 for the route (not yet
 * ported on the Hologram side) the driver prints
 * `GAP: <route> — not served by <base>` and exits 3 WITHOUT capturing.
 *
 * Capture guarantees carried over from the original harness: no PNG under
 * 10x10 px is ever emitted (degenerate captures are retried against the
 * nearest laid-out ancestor, else recorded as failures in index.md); sticky
 * chrome is hidden for element/fullPage shots; animations and smooth
 * scrolling are neutralized; notes land in index.md.
 *
 * Exit codes: 0 ok · 1 capture failures · 2 usage · 3 base/route
 * unreachable (incl. the GAP case).
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
// app/ root of THIS worktree (…/app/scripts/parity → …/app)
const APP_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const APP_BACKEND = path.join(APP_ROOT, "backend");
// The read-only Next.js source of truth (never written to by this driver).
const NEXT_WEB_ROOT =
  process.env.PARITY_NEXT_WEB_ROOT ||
  "/Users/keithbrings/Work/Space/Noizu/Projects/semtext.dev/.claude/worktrees/landing-preview/web";
// npm root for cypress (binary + module live in app/e2e/node_modules)
const E2E_ROOT = path.join(APP_ROOT, "e2e");

const DEFAULT_OUT_ROOT =
  process.env.PARITY_OUT_ROOT ||
  "/Users/keithbrings/Work/Space/Noizu/.tmp/semtext-parity";
const MIN_PX = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage(code = 2) {
  console.error(
    "usage: snap-tag.mjs (--tag <slug> | --route <path>) --base <url> [--dist <dir>] [--out <dir>]\n" +
      "       snap-tag.mjs --start-app [--port-only]\n" +
      "       snap-tag.mjs --next-base\n" +
      "       snap-tag.mjs --stop"
  );
  process.exit(code);
}

/* ---- managed server plumbing (one instance per root, lockfile-guarded) ---- */

function stateDirFor(kind, root) {
  return path.join(
    os.tmpdir(),
    `semtext-parity-${kind}-${createHash("sha1").update(root).digest("hex").slice(0, 12)}`
  );
}

function readState(dir) {
  try {
    return {
      port: parseInt(readFileSync(path.join(dir, "port"), "utf8").trim(), 10) || null,
      pid: parseInt(readFileSync(path.join(dir, "pid"), "utf8").trim(), 10) || null,
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

async function managedAlive(dir) {
  const { port, pid } = readState(dir);
  if (!port || !pid) return null;
  if (!pidAlive(pid)) {
    rmSync(path.join(dir, "port"), { force: true });
    rmSync(path.join(dir, "pid"), { force: true });
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

function tailOf(file, chars = 400) {
  try {
    return readFileSync(file, "utf8").trim().slice(-chars).replace(/\n/g, " | ");
  } catch {
    return "no log";
  }
}

function killManaged(dir) {
  const { pid } = readState(dir);
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
  rmSync(dir, { recursive: true, force: true });
}

/**
 * Start (once) / reuse the private Hologram dev server for THIS worktree:
 * `HOLOGRAM_START=1 mix phx.server` in app/backend with a private
 * MIX_BUILD_ROOT (four P0 lanes compile concurrently — never share a build
 * root) on a free 127.0.0.1 port. DB env is passed through: point DB_PORT
 * at your disposable test container (semtext-p0-<lane>), never at a cluster
 * database. Default build root is /private/tmp/... NOT /tmp — the /tmp
 * symlink breaks Hologram's asset PathRegistry symlinks.
 */
async function ensureManagedApp() {
  const dir = stateDirFor("app-dev", APP_BACKEND);
  mkdirSync(dir, { recursive: true });

  let base = await managedAlive(dir);
  if (base) return { base, dir, started: false };

  const mixBin = path.join(APP_BACKEND, "mix");
  if (!existsSync(mixBin)) {
    console.error(`--start-app: ${mixBin} not found — is this the epic worktree?`);
    process.exit(3);
  }
  const buildRoot =
    process.env.MIX_BUILD_ROOT || "/private/tmp/semtext-hologram/parity-harness/_build";
  const port = await freePort();
  const logFd = openSync(path.join(dir, "dev.log"), "a");
  const child = spawn("mix", ["phx.server"], {
    cwd: APP_BACKEND,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      HOLOGRAM_START: "1",
      MIX_BUILD_ROOT: buildRoot,
      // Never let the managed server answer on a port another lane picked.
      PORT: String(port),
    },
  });
  child.unref();
  writeFileSync(path.join(dir, "pid"), String(child.pid));
  writeFileSync(path.join(dir, "port"), String(port));
  console.log(
    `snap: starting managed Hologram dev on http://127.0.0.1:${port} (pid ${child.pid}, build root ${buildRoot}, log ${path.join(dir, "dev.log")})`
  );

  const upDeadline = Date.now() + 180_000; // cold compile of the private build root
  while (Date.now() < upDeadline) {
    if (!pidAlive(child.pid)) {
      console.error(
        `mix phx.server exited during startup — log tail: ${tailOf(path.join(dir, "dev.log"))}`
      );
      process.exit(3);
    }
    if (await tcpUp(port)) return { base: `http://127.0.0.1:${port}`, dir, started: true };
    await sleep(1000);
  }
  console.error(`managed Hologram dev did not open port ${port} within 180s`);
  process.exit(3);
}

/** Resolve the landing-preview snap harness's managed next dev, if up. */
function nextHarnessBase() {
  const dir = path.join(
    os.tmpdir(),
    `semtext-snap-dev-${createHash("sha1").update(NEXT_WEB_ROOT).digest("hex").slice(0, 12)}`
  );
  const { port } = readState(dir);
  if (!port) {
    console.error(
      `no managed next dev for ${NEXT_WEB_ROOT} (${dir} has no port file) — start one with: cd ${NEXT_WEB_ROOT} && npm run snap:tag -- <tag> --out ${os.tmpdir()}/throwaway-snaps`
    );
    process.exit(3);
  }
  console.log(`http://127.0.0.1:${port}`);
  process.exit(0);
}

/* ---- args ---- */
const argv = process.argv.slice(2);
let tag = "";
let route = "";
let base = "";
let dist = "";
let out = "";
let startApp = false;
let stopOnly = false;
let nextBaseOnly = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--tag") tag = argv[++i] || usage();
  else if (a === "--route") route = argv[++i] || usage();
  else if (a === "--base") base = argv[++i] || usage();
  else if (a === "--dist") dist = argv[++i] || usage();
  else if (a === "--out") out = argv[++i] || usage();
  else if (a === "--start-app") startApp = true;
  else if (a === "--next-base") nextBaseOnly = true;
  else if (a === "--stop") stopOnly = true;
  else if (a === "--help" || a === "-h") usage(0);
  else if (a.startsWith("--")) {
    console.error(`unknown flag: ${a}`);
    usage();
  } else if (!tag) tag = a; // bare positional = tag (original harness habit)
  else usage();
}

if (stopOnly) {
  killManaged(stateDirFor("app-dev", APP_BACKEND));
  console.log("snap: managed servers stopped (if any were running)");
  process.exit(0);
}
if (nextBaseOnly) nextHarnessBase();

if (startApp) {
  const { base: appBase } = await ensureManagedApp();
  console.log(`snap: Hologram dev base: ${appBase}`);
  if (!tag && !route) process.exit(0); // --start-app alone just reports
  base = base || appBase;
}

if (!tag && !route) usage();
if (!base) {
  console.error("--base is required for a capture run (or use --start-app to boot one)");
  usage();
}
base = base.replace(/\/+$/, "");
if (!route) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) {
    console.error(`not a tag slug: "${tag}" (expected lowercase letters, digits, hyphens)`);
    process.exit(2);
  }
  route = `/reference/${tag}/`;
} else if (!tag) {
  tag = slugOf(route);
}
if (dist) {
  dist = path.resolve(dist);
  if (!existsSync(dist)) {
    console.error(`--dist directory does not exist: ${dist}`);
    process.exit(2);
  }
}

function slugOf(p, max = 28) {
  return (
    p
      .replace(/^\/+|\/+$/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max) || "root"
  );
}

out = path.resolve(out || path.join(DEFAULT_OUT_ROOT, "snaps", tag));
mkdirSync(out, { recursive: true });
rmSync(path.join(out, "notes.jsonl"), { force: true });
// The out dir is private to this run: clear stale contents so re-runs
// never produce "name (1).png" duplicates.
for (const entry of readdirSync(out, { withFileTypes: true })) {
  const p = path.join(out, entry.name);
  if (entry.isDirectory()) rmSync(p, { recursive: true, force: true });
  else rmSync(p, { force: true });
}

/* ---- preflight: the base must serve this route (else: GAP, not a crash) ---- */
const routeUrl = `${base}${route}`;
let html = "";
let preStatus = 0;
try {
  const res = await fetch(routeUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(120_000),
  });
  preStatus = res.status;
  html = await res.text();
} catch (err) {
  console.error(`preflight: cannot reach ${routeUrl}: ${err.message}`);
  process.exit(3);
}
if (preStatus === 404 || preStatus === 405) {
  console.error(`GAP: ${route} — not served by ${base} (status ${preStatus}); nothing to capture`);
  process.exit(3);
}
if (preStatus < 200 || preStatus >= 400) {
  console.error(`preflight: GET ${routeUrl} → ${preStatus}`);
  const snippet = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
  if (snippet) console.error(`preflight: page says: ${snippet}`);
  process.exit(3);
}
if (!html.includes("code-window")) {
  console.warn(
    `preflight note: ${routeUrl} carries no example figure — the run will capture full-page shots only`
  );
}

/* ---- run cypress (module + binary live in app/e2e) ---- */
if (!existsSync(path.join(E2E_ROOT, "node_modules", "cypress"))) {
  console.error(
    `cypress is not installed in ${E2E_ROOT} — run: cd ${E2E_ROOT} && npm ci`
  );
  process.exit(3);
}

process.env.SNAP_TAG = tag;
process.env.SNAP_ROUTE = route;
process.env.SNAP_BASE = base;
process.env.SNAP_OUT = out;
if (dist) process.env.SNAP_DIST = dist;
else delete process.env.SNAP_DIST;

const configFile = path.join(E2E_ROOT, "cypress.parity-snap.config.mjs");
const spec = path.join(E2E_ROOT, "cypress", "parity-snap", "snap.cy.ts");

const { createRequire } = await import("node:module");
const requireFromE2E = createRequire(path.join(E2E_ROOT, "package.json"));
const cypress = requireFromE2E("cypress");

// Cypress infers its project root from cwd: run from app/e2e so the
// absolute config/spec paths resolve and any relative asset paths land
// inside app/e2e (never in the worktree outside this lane's dirs).
process.chdir(E2E_ROOT);

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

/* ---- index.md manifest (identical contract to the original harness) ---- */
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
// image under MIN_PX in either dimension.
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
      msg: `${f}: degenerate capture ${size.w}x${size.h}px (< ${MIN_PX}px) — deleted, no image emitted`,
    });
    continue;
  }
  pngs.push({ file: f, ...size });
}

const rows = pngs.map(({ file, w, h }) => {
  const m = file.match(/-(\d+)\.png$/);
  const width = m ? m[1] : "?";
  const view = m ? file.slice(0, m.index) : file;
  return `| \`${file}\` | ${view} | ${width} | ${w}x${h} |`;
});

const now = new Date();
const index = [
  `# snaps — \`${tag}\` (\`${route}\`)`,
  "",
  `- captured: ${now.toLocaleString()} (local)`,
  `- base: ${base} — route ${route}`,
  `- bundle: ${dist ? `private --dist \`${dist}\`` : "shipped bundles at /semtext/"}`,
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
        failures: Array.isArray(result?.failures)
          ? result.failures.map((f) => f.message || f)
          : result?.failures,
      },
      null,
      2
    )}`
  );
}
const captureFails = notes.filter((n) => n.kind === "fail").length;

console.log(`snap:${tag} — ${pngs.length} PNG(s) → ${out}`);
for (const { file, w, h } of pngs) console.log(`  ${file} (${w}x${h})`);
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
