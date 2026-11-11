/// <reference types="cypress" />

/**
 * Reference cards — per-card custom renders + static SemText Claude-example
 * code blocks (feature/reference-cards-claude-examples).
 *
 *   - /reference: every card shows its "SemText — Claude example" code
 *     block; renders are collapsed (no live Claude pane) until asked for.
 *   - the per-card "Live render" toggle mounts a pane the island bridge
 *     fills with the authored markup (deferred until visible);
 *   - the page-wide "Show renders" switch expands every card;
 *   - /reference/<tag>: the Claude example renders live ABOVE Example.
 *
 * Run: cd app/e2e && PARITY_APP_BASE=http://127.0.0.1:<port> npx cypress run
 *        --spec cypress/e2e/reference-cards.cy.ts
 */

// Hologram swaps in its client-rendered DOM once its runtime has started;
// clicking before that hits the SSR node and detaches mid-command. Wait for
// the runtime to finish initiating (it deletes the pending-actions queue).
function visitHydrated(path: string) {
  cy.visit(path);
  cy.window({ timeout: 20000 }).should((win) => {
    const h = (win as unknown as { Hologram?: Record<string, unknown> }).Hologram;
    expect(h && typeof h.dispatchAction === "function" && !("_pendingJsInteropActions" in h)).to.equal(true);
  });
}

describe("reference cards: Claude examples + custom renders", () => {
  it("index: every card carries a static Claude-example code block, renders collapsed", () => {
    cy.visit("/reference");
    cy.get("main article[data-ref-tag]").then(($cards) => {
      cy.get("main article[data-ref-tag] pre.ref-claude-code").should("have.length", $cards.length);
    });
    cy.get("main article[data-ref-tag] figure.ref-claude figcaption")
      .first()
      .should("contain.text", "SemText — Claude example");
    cy.get("main [data-sem-shell='pending']").should("exist");
    cy.get("main .ref-claude-pane").should("not.exist");
    cy.get("#ref-show-renders").should("have.attr", "aria-pressed", "false");
  });

  it("index: the card toggle renders that card live", () => {
    visitHydrated("/reference");
    cy.get("article[data-ref-tag='sem-note'] .ref-claude-toggle")
      .should("have.attr", "aria-expanded", "false")
      .click();
    cy.get("article[data-ref-tag='sem-note'] .ref-claude-toggle").should(
      "have.attr",
      "aria-expanded",
      "true"
    );
    cy.get("#claude-sem-note-pane").scrollIntoView();
    // The bridge replaced the placeholder with the authored markup.
    cy.get("#claude-sem-note-pane sem-note", { timeout: 10000 }).should("exist");
    cy.get("#claude-sem-note-pane .ref-render-placeholder").should("not.exist");
    // Other cards stay collapsed.
    cy.get("#claude-sem-tldr-pane").should("not.exist");
  });

  it("index: the show-renders switch expands every card", () => {
    visitHydrated("/reference");
    cy.get("#ref-show-renders").click().should("have.attr", "aria-pressed", "true");
    cy.get("main article[data-ref-tag]").then(($cards) => {
      cy.get("main .ref-claude-pane").should("have.length", $cards.length);
    });
    cy.get("#claude-sem-tldr-pane").scrollIntoView();
    cy.get("#claude-sem-tldr-pane sem-tldr", { timeout: 10000 }).should("exist");
  });

  it("element page: the Claude example renders live above Example", () => {
    cy.visit("/reference/sem-procedure");
    cy.get("#claude-example-h").should("contain.text", "SemText — Claude example");
    cy.get("#claude-example pre.ref-claude-code").should("contain.text", "<sem-procedure");
    cy.get("#claude-sem-procedure-pane sem-step", { timeout: 10000 }).should("exist");
    cy.get("#claude-example").then(($claude) => {
      cy.get("#example-h").then(($example) => {
        // DOCUMENT_POSITION_FOLLOWING: Example comes after the Claude block.
        expect($claude[0].compareDocumentPosition($example[0]) & 4).to.equal(4);
      });
    });
  });
});
