#!/usr/bin/env node

/**
 * semtext-view — View a SemText document (.html or .md) with the vendored
 * SemText bundle available, so custom elements actually render.
 *
 * Usage:
 *   semtext-view <file.html | file.md>            # print the assembled HTML to stdout
 *   semtext-view <file.html | file.md> --serve    # serve it at a local URL
 *   semtext-view <file> --serve --port 4321       # fixed port
 *
 * How it works (no build step, zero dependencies):
 *   - `.md` input is wrapped in a minimal scaffold page (title from the
 *     filename) whose body is one authored <sem-md> element.
 *   - `.html` input is served as authored; if it references no SemText
 *     bundle, the vendored `/semtext/latest/` tags are injected after <head>.
 *   - `--serve` mounts a tiny static server where `/semtext/*` maps to the
 *     vendored bundle (`web/public/semtext/` in a checkout, `dist/` in an
 *     installed package) and the document — plus its sibling assets — is
 *     served from its own directory, so root-absolute references like
 *     `/semtext/latest/semtext.js` just work.
 *   - Without `--serve`, the assembled HTML goes to stdout (pipe-friendly);
 *     logs go to stderr.
 */

import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, "..");

const VERSION = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
})();

// ─── CLI parsing ────────────────────────────────────────────────────────────

function printHelp() {
  const out = `semtext-view v${VERSION} — view a SemText document (.html or .md) with elements rendering

USAGE:
  semtext-view <file.html | file.md> [options]

ARGUMENTS:
  <file>              Path to a SemText .html/.htm document or a Markdown .md file.

OPTIONS:
  --serve             Start a local static server (default: print HTML to stdout).
  --port <number>     Port for --serve (default: auto-pick a free port).
  --help, -h          Show this help.
  --version, -v       Show version.

EXAMPLES:
  semtext-view web/public/spec/web-component-evaluator.sem.html --serve
  semtext-view manifest/tobor-kit.eval.md
  semtext-view notes.md --serve --port 4321
`;
  process.stdout.write(out);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let serve = false;
  let port = null;
  let file = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") return { action: "help" };
    if (a === "--version" || a === "-v") return { action: "version" };
    if (a === "--serve") { serve = true; continue; }
    if (a === "--port" || a.startsWith("--port=")) {
      const raw = a.includes("=") ? a.split("=")[1] : args[++i];
      const n = Number.parseInt(raw, 10);
      if (!raw || raw.startsWith("-") || Number.isNaN(n) || n < 1 || n > 65535) {
        return { action: "error", message: `Error: --port requires a port number 1-65535 (got "${raw ?? ""}")` };
      }
      port = n;
      continue;
    }
    if (a.startsWith("-")) return { action: "error", message: `Error: Unknown option: ${a}` };
    if (file === null) { file = a; continue; }
    return { action: "error", message: "Error: Exactly one input file is expected." };
  }

  if (!file) return { action: "error", message: null };
  return { action: "view", file, serve, port };
}

// ─── Bundle resolution ──────────────────────────────────────────────────────

/**
 * Vendored bundle root: a checkout serves web/public/semtext/ (versioned
 * trees + latest/ alias, never rebuilt here); an installed package serves
 * the shipped dist/ build. Returns {root, kind} or null.
 */
function resolveBundleDir() {
  const vendored = path.join(PKG_ROOT, "web", "public", "semtext");
  if (fs.existsSync(path.join(vendored, "latest", "semtext.js"))) {
    return { root: vendored, kind: "vendored" };
  }
  const dist = path.join(PKG_ROOT, "dist");
  if (fs.existsSync(path.join(dist, "semtext.js"))) {
    return { root: dist, kind: "dist" };
  }
  return null;
}

/**
 * Resolve a /semtext/<rest> request against the bundle root. The shipped
 * tags point at /semtext/latest/…; under vendored/ that directory exists,
 * under dist/ we fall back to the unpackaged file names.
 */
function resolveBundleFile(bundle, rest) {
  const decoded = decodeURIComponent(rest);
  const candidates = [path.resolve(bundle.root, decoded)];
  if (decoded.startsWith("latest/")) {
    candidates.push(path.resolve(bundle.root, decoded.slice("latest/".length)));
  }
  for (const c of candidates) {
    if (c === bundle.root || c.startsWith(bundle.root + path.sep)) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
  }
  return null;
}

// ─── Document assembly ──────────────────────────────────────────────────────

const BUNDLE_CSS = "/semtext/latest/semtext.css";
const BUNDLE_JS = "/semtext/latest/semtext.js";

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function titleFromFilename(file) {
  return path.basename(file).replace(/\.(html?|md|markdown)$/i, "");
}

function scaffoldFromMarkdown(md, title) {
  if (/<\/sem-md/i.test(md)) {
    fail(`Error: ${title} contains a literal "</sem-md" sequence and cannot be wrapped in a sem-md scaffold.`);
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — semtext-view</title>
  <link rel="stylesheet" href="${BUNDLE_CSS}">
  <script src="${BUNDLE_JS}" defer></script>
  <style>
    body { margin: 0 auto; max-width: 60rem; padding: 1.25rem 1.5rem 4rem;
           font-family: system-ui, -apple-system, sans-serif; line-height: 1.55; }
  </style>
</head>
<body>
<sem-md label="${escapeHtml(title)}" view-as="rendered" controls="toggle">
${md}
</sem-md>
</body>
</html>
`;
}

/**
 * Assemble the served/printable HTML for an input file.
 * .md → scaffold page; .html → as authored, with the bundle tags injected
 * only when the document references no SemText bundle itself.
 */
function assembleHtml(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const title = titleFromFilename(inputPath);

  if (ext === ".md" || ext === ".markdown") {
    return scaffoldFromMarkdown(fs.readFileSync(inputPath, "utf-8"), title);
  }

  let html = fs.readFileSync(inputPath, "utf-8");
  if (!/semtext(?:\.min)?\.js\b/.test(html)) {
    const tags = `<link rel="stylesheet" href="${BUNDLE_CSS}">\n<script src="${BUNDLE_JS}" defer></script>\n`;
    const head = html.match(/<head[^>]*>/i);
    if (head) {
      html = html.replace(head[0], `${head[0]}\n${tags}`);
    } else {
      html = `${tags}${html}`;
    }
    log(`note: injected ${BUNDLE_JS} (document referenced no SemText bundle)`);
  }
  return html;
}

// ─── Static server ──────────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
};

function mimeType(p) {
  return MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
}

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function safeStatic(root, decodedRel) {
  const resolved = path.resolve(root, "." + decodedRel);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  if (!fs.existsSync(resolved)) return null;
  if (fs.statSync(resolved).isFile()) return resolved;
  return null;
}

function startServer(inputPath, html, bundle, port) {
  const docDir = path.dirname(path.resolve(inputPath));
  const docName = path.basename(path.resolve(inputPath));
  const docPath = `/${docName}`;

  const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    } catch {
      send(res, 400, "Bad Request\n", "text/plain; charset=utf-8");
      return;
    }

    // The document itself.
    if (pathname === docPath) {
      send(res, 200, html, "text/html; charset=utf-8");
      return;
    }
    // Root redirects to the document so the printed URL is the entry point.
    if (pathname === "/") {
      res.writeHead(302, { Location: docPath });
      res.end();
      return;
    }
    // Vendored SemText bundle (versioned trees + latest/ alias).
    if (pathname.startsWith("/semtext/")) {
      if (!bundle) {
        send(res, 404, "SemText bundle not found in this checkout/package.\n", "text/plain; charset=utf-8");
        return;
      }
      const file = resolveBundleFile(bundle, pathname.slice("/semtext/".length));
      if (!file) {
        send(res, 404, "Not Found\n", "text/plain; charset=utf-8");
        return;
      }
      send(res, 200, fs.readFileSync(file), mimeType(file));
      return;
    }
    // Sibling assets from the document's own directory.
    const sibling = safeStatic(docDir, pathname);
    if (sibling) {
      send(res, 200, fs.readFileSync(sibling), mimeType(sibling));
      return;
    }
    send(res, 404, "Not Found\n", "text/plain; charset=utf-8");
  });

  server.listen(port || 0, "127.0.0.1", () => {
    const actual = server.address().port;
    log(`serving ${inputPath}`);
    log(`bundle:  ${bundle ? `${bundle.kind} (${bundle.root})` : "NOT FOUND — elements will not render"}`);
    console.log(`http://127.0.0.1:${actual}${docPath}`);
    log("Press Ctrl+C to stop");
  });

  server.on("error", (err) => {
    fail(`Error: server failed to start: ${err.message}`);
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stderr.write(`semtext-view: ${msg}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function main() {
  const parsed = parseArgs(process.argv);

  if (parsed.action === "help") { printHelp(); return; }
  if (parsed.action === "version") { console.log(`semtext-view v${VERSION}`); return; }
  if (parsed.action === "error") {
    if (parsed.message) fail(parsed.message);
    printHelp();
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(parsed.file);
  if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
    fail(`Error: input file not found: ${inputPath}`);
    return;
  }

  const html = assembleHtml(inputPath);

  if (!parsed.serve) {
    process.stdout.write(html);
    return;
  }

  const bundle = resolveBundleDir();
  if (!bundle) {
    log("warning: no SemText bundle found (expected web/public/semtext/ in a checkout, or dist/ after npm run build)");
  }
  startServer(inputPath, html, bundle, parsed.port);
}

main();
