/// <reference types="cypress" />

import { defineConfig } from "cypress";
import esbuild from "esbuild";
import {
  addCucumberPreprocessorPlugin,
} from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";

/*
 * BDD (Gherkin) e2e suite for the static landing export. Cypress is driven
 * by @badeball/cypress-cucumber-preprocessor: .feature specs live under
 * cypress/e2e with their step definitions alongside, and videos are
 * recorded for every spec (gitignored — copy out what you want to keep).
 *
 * @bahmutov/cypress-esbuild-plugin has been unpublished from npm, so the
 * small esbuild bundler it used to provide is inlined here: bundle each
 * spec with esbuild, with the preprocessor's plugin compiling .feature
 * imports. The site under test is the plain static export served by any
 * dumb file server (see `npm run build` -> out/, trailingSlash URLs).
 */

const SITE_URL = process.env.CYPRESS_baseUrl ?? "http://127.0.0.1:4180";

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
      return config;
    },
  },
});
