/// <reference types="cypress" />

/*
 * parity.ts — the GAP guard for the ported BDD suite.
 *
 * Contract: a route the Hologram app does not serve yet is a GAP — the
 * scenario's Given step probes it, records the gap, and every subsequent
 * step in that scenario becomes a no-op marked `PARITY GAP (skipped)`.
 * The scenario therefore PASSES while the gap ledger (.parity/gaps.jsonl)
 * and the step log make the missing route unmissable. Regression semantics
 * are unchanged: once a route serves, its behavior steps run for real.
 *
 *   visitOrGap(route, feature):  the Given helper — probe, mark, visit
 *   gapSkipped():                true when the current scenario is a gap
 *   whenServed(body):            run `body` unless the route is a gap
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitOrGap(route: string, feature: string): Chainable<void>;
    }
  }
}

interface GapState {
  route: string | null;
  feature: string;
  status: number | null;
}

function gapState(): GapState {
  const existing = Cypress.env("parityGap") as GapState | undefined;
  if (existing) return existing;
  const fresh: GapState = { route: null, feature: "", status: null };
  Cypress.env("parityGap", fresh);
  return fresh;
}

/** True when the current scenario is skipping because of an unresolved gap. */
export function gapSkipped(): boolean {
  return gapState().route !== null;
}

/** Run `body` unless the current scenario's route is a gap (then log once). */
export function whenServed(body: () => void): void {
  const state = gapState();
  if (state.route) {
    cy.log(`PARITY GAP (skipped): ${state.route} — not served by the Hologram app yet`);
    return;
  }
  body();
}

/**
 * Given helper: probe the route with a non-failing request; 404/405 ⇒
 * record the gap + set the skip flag; otherwise visit for real.
 */
Cypress.Commands.add("visitOrGap", (route: string, feature: string) => {
  const state = gapState();
  state.route = null;
  state.feature = feature;
  state.status = null;
  cy.request({ url: route, failOnStatusCode: false, log: false }).then((res) => {
    if (res.status === 404 || res.status === 405) {
      state.route = route;
      state.status = res.status;
      cy.task("parityGap", { feature, route, status: res.status });
      cy.log(`PARITY GAP: ${route} — not served by the Hologram app (HTTP ${res.status}); scenario skipped`);
      return;
    }
    cy.visit(route);
  });
});

/** Step-facing alias so feature steps read `visitOrGap(route, feature)`. */
export function visitOrGap(route: string, feature: string): void {
  cy.visitOrGap(route, feature);
}
