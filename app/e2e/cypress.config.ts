/// <reference types="cypress" />
import { defineConfig } from "cypress";
import esbuild from "esbuild";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

/*
 * BDD (Gherkin) parity suite for the Hologram replatform of semtext.dev.
 * Port of the landing-preview web/cypress.config.ts (same preprocessor
 * stack, same feature files) with one parity-specific addition: every
 * feature declares the route it needs, and a route the Hologram app does
 * not serve yet is a GAP — the scenario is skipped and recorded, never
 * failed. The harness runs against whatever routes exist.
 *
 *   cd app/e2e && npm ci
 *   PARITY_APP_BASE=http://127.0.0.1:4100 npx cypress run
 *
 * The server under test: HOLOGRAM_START=1 mix phx.server (or
 * `node ../scripts/parity/snap-tag.mjs --start-app` to boot a managed one).
 * Gap notes accumulate in .parity/gaps.jsonl; the run summary prints them.
 */

const SITE_URL = process.env.PARITY_APP_BASE ?? "http://127.0.0.1:4100";
const GAP_DIR = path.resolve(".parity");
const GAP_FILE = path.join(GAP_DIR, "gaps.jsonl");
mkdirSync(GAP_DIR, { recursive: true });

function createBundler(plugins: esbuild.Plugin[]) {
  return (file: { filePath: string; outputPath: string }) =>
    esbuild
      .build({
        entryPoints: [file.filePath],
        outfile: file.outputPath,
        bundle: true,
        format: "cjs",
        plugins,
        sourcemap: "inline",
        logLevel: "silent",
      })
      .then(() => file.outputPath);
}

export default defineConfig({
  e2e: {
    baseUrl: SITE_URL,
    specPattern: "cypress/e2e/**/*.feature",
    supportFile: "cypress/support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    downloadsFolder: "cypress/downloads",
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler([createEsbuildPlugin(config)]));
      on("task", {
        /** Record a parity gap (route not ported yet). Informational. */
        parityGap(entry: { feature: string; route: string; status?: number }) {
          appendFileSync(
            GAP_FILE,
            JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n"
          );
          return null;
        },
        /** Read + clear the gap ledger, printing the run summary. */
        paritySummary() {
          if (!existsSync(GAP_FILE)) return 0;
          const lines = readFileSync(GAP_FILE, "utf8")
            .split("\n")
            .filter((l) => l.trim());
          if (lines.length) {
            console.log(
              `\nPARITY GAPS (${lines.length} route(s) not served by the Hologram app yet — informational):`
            );
            for (const line of lines) {
              const e = JSON.parse(line);
              console.log(`  GAP ${e.route} (${e.feature}, HTTP ${e.status})`);
            }
          }
          writeFileSync(GAP_FILE, "");
          return lines.length;
        },
      });
      return config;
    },
  },
});
