import { defineConfig } from "cypress";
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/*
 * Cypress config for the parity render-snapshot harness
 * (scripts/parity/snap-tag.mjs drives this config; it exports the SNAP_*
 * env below before starting the run). Direct use for debugging:
 *
 *   SNAP_TAG=highlight SNAP_ROUTE=/reference/highlight/ \
 *   SNAP_BASE=http://127.0.0.1:4100 SNAP_OUT=/tmp/snaps \
 *   npx cypress run --config-file cypress.parity-snap.config.mjs \
 *     --spec cypress/parity-snap/snap.cy.ts
 *
 * Everything it writes (screenshots, notes) lands under SNAP_OUT, so
 * concurrent runs on different routes never touch a shared path. It never
 * writes into the repo's cypress/ folders.
 */

const tag = process.env.SNAP_TAG || "";
const route = process.env.SNAP_ROUTE || (tag ? `/reference/${tag}/` : "/");
const base = process.env.SNAP_BASE || "http://127.0.0.1:4100";
const dist = process.env.SNAP_DIST || "";
const out = process.env.SNAP_OUT || path.resolve("cypress/parity-snap/.out", tag || "default");

const CONTENT_TYPES = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".html": "text/html",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Recursively read a dist tree into { relative/posix/path: { body, type } }. */
function readDistTree(rootDir) {
  const map = {};
  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(full, relPath);
      } else if (entry.isFile()) {
        const size = statSync(full).size;
        if (size > MAX_FILE_BYTES) continue; // text assets only; never inline binaries
        map[relPath] = {
          body: readFileSync(full, "utf8"),
          type: CONTENT_TYPES[path.extname(entry.name)] || "application/octet-stream",
        };
      }
    }
  };
  walk(rootDir, "");
  return map;
}

export default defineConfig({
  e2e: {
    baseUrl: base,
    specPattern: "cypress/parity-snap/**/*.cy.ts",
    supportFile: false,
    video: false,
    screenshotOnRunFailure: false,
    trashAssetsBeforeRuns: true,
    screenshotsFolder: out,
    // Keep every Cypress write inside the run's private out dir.
    videosFolder: path.join(out, ".videos"),
    downloadsFolder: path.join(out, ".downloads"),
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 20000,
    retries: { runMode: 0, openMode: 0 },
    env: { snap: { tag, route, base, dist, out } },
    setupNodeEvents(on, config) {
      on("task", {
        /** Read a private dist dir; null when missing/unreadable. */
        snapReadDist(distDir) {
          if (!distDir || !existsSync(distDir) || !statSync(distDir).isDirectory()) {
            return null;
          }
          return readDistTree(distDir);
        },
        /** Append a run note (warnings, dist-intercept counters) for index.md. */
        snapNote(note) {
          appendFileSync(path.join(out, "notes.jsonl"), `${JSON.stringify(note)}\n`);
          return null;
        },
      });
      return config;
    },
  },
});
