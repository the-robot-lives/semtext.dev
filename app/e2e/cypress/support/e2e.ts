/// <reference types="cypress" />
import "./parity";

/*
 * Console guard (ported from the landing-preview suite): every scenario
 * fails if the page emitted console.error while it ran. Uncaught exceptions
 * already fail Cypress scenarios by default. Browser-level resource errors
 * (a missing favicon, say) do not travel through console.error and stay out
 * of scope.
 *
 * Gap-aware: when the parity guard skipped a scenario because its route is
 * not served by the Hologram app yet, nothing was visited and there are no
 * console errors to police — the afterEach assertion short-circuits.
 */

const consoleErrors: string[] = [];
let baselineCount = 0;

beforeEach(() => {
  baselineCount = consoleErrors.length;
});

after(() => {
  // Run summary: every parity gap recorded this run (route not served yet),
  // printed from the node process so it lands in the cypress CLI output.
  cy.task("paritySummary").then((count) => {
    const n = count as number;
    if (n > 0) {
      cy.log(`PARITY: ${n} gap(s) recorded — see .parity/gaps.jsonl`);
    }
  });
});

Cypress.on("window:before:load", (win) => {
  win.console.error = (...args: unknown[]) => {
    consoleErrors.push(args.map((a) => String(a)).join(" "));
  };
});

afterEach(() => {
  const fresh = consoleErrors.slice(baselineCount);
  expect(fresh, "console emitted no errors on this page").to.deep.equal([]);
});
