/// <reference types="cypress" />

/*
 * Console guard: every scenario fails if the page emitted console.error
 * while it ran. Uncaught exceptions already fail Cypress scenarios by
 * default. (Browser-level resource errors — a missing favicon, say — do
 * not travel through console.error, so they stay out of scope here.)
 */

const consoleErrors: string[] = [];
let baselineCount = 0;

beforeEach(() => {
  baselineCount = consoleErrors.length;
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
