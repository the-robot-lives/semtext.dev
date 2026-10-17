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

/*
 * Host mappings for the multi-host replatform (proposals lane, P1): the
 * dev server serves several hosts on one port, and specs address them by
 * NAME (cookies are host-scoped, so proposals.semtext.dev must resolve).
 * E2E_HOSTS="proposals.semtext.dev=127.0.0.1,other.test=127.0.0.1" —
 * comma list of name=ip pairs; the named hosts must be allow-listed in
 * the backend's `config :semtext, :hosts` for the dev server to answer
 * them (test.exs/dev config).
 */
function parseHosts(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const map: Record<string, string> = {};
  for (const pair of raw.split(",")) {
    const [name, ip] = pair.split("=");
    if (name && ip) map[name.trim()] = ip.trim();
  }
  return map;
}

const E2E_HOSTS = parseHosts(process.env.E2E_HOSTS);

/*
 * Proposals-spec inputs (P1 ui lane). Both FAIL the spec when absent —
 * never skip: `proposalsTestLogin` is the github_login of an existing dev
 * user for the /auth/test/login stub; `proposalsModLogin` is a second dev
 * user granted users.role = 'moderator'.
 */
const PROPOSALS_TEST_LOGIN = process.env.E2E_PROPOSALS_TEST_LOGIN ?? "";
const PROPOSALS_MOD_LOGIN = process.env.E2E_PROPOSALS_MOD_LOGIN ?? "";
/*
 * Origin overrides for non-80 dev ports. Cypress `hosts` maps NAME→IP and
 * keeps the URL's port, so a dev server on :5585 needs the port IN the
 * origin, not in the hosts map: E2E_PROPOSALS_ORIGIN=http://proposals.semtext.dev:5585.
 * Empty (default) = the production hosts on port 80.
 */
const PROPOSALS_ORIGIN = process.env.E2E_PROPOSALS_ORIGIN ?? "";
const MAIN_ORIGIN = process.env.E2E_MAIN_ORIGIN ?? "";

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
    hosts: E2E_HOSTS,
    env: {
      proposalsTestLogin: PROPOSALS_TEST_LOGIN,
      proposalsModLogin: PROPOSALS_MOD_LOGIN,
      proposalsOrigin: PROPOSALS_ORIGIN,
      mainOrigin: MAIN_ORIGIN,
    },
    // Gherkin parity scenarios (.feature, cucumber-preprocessed) plus plain
    // Cypress specs (.cy.ts — e.g. sem-hydration.cy.ts).
    specPattern: "cypress/e2e/**/*.{feature,cy.ts}",
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
