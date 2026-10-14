/// <reference types="cypress" />

import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { visitOrGap, whenServed } from "../support/parity";

/*
 * Port of the landing-preview home steps to the Hologram replatform.
 * Selector contract unchanged — the port-landing lane must reproduce these
 * exact hooks (scaffold.md "Parity selectors contract"). Every step body is
 * wrapped in whenServed(): when the landing route is a parity GAP the steps
 * log `PARITY GAP (skipped)` and pass; once the route serves they assert
 * for real.
 */

/*
 * The hero window is the code-window with this aria-label; the landing
 * page carries several other code-windows, so never match them all.
 */
const HERO = 'figure.code-window[aria-label="A SemText document fragment"]';

When("I visit the landing page", () => {
  visitOrGap("/", "home.feature");
});

Then("the SemText headline is visible", () => {
  whenServed(() => {
    cy.title().should("contain", "SemText");
    cy.get("h1")
      .should("be.visible")
      .invoke("text")
      .should("match", /One XHTML file/i);
    cy.contains("header a", "SemText").should("be.visible");
  });
});

Then("the hero window shows the authored source by default", () => {
  whenServed(() => {
    cy.get(HERO)
      .scrollIntoView()
      .should("be.visible")
      .find("pre > code")
      .should("be.visible")
      .and("contain", "<sem-note");
    cy.get(`${HERO} div[data-sem-theme]`).should("exist").and("not.be.visible");
  });
});

Then("the hero {string} toggle renders the SemText snippet", (toggle: string) => {
  whenServed(() => {
    cy.get(`${HERO} .code-chrome`)
      .contains("button", toggle)
      .should("have.attr", "aria-pressed", "false")
      .click();
    cy.get(`${HERO} div[data-sem-theme]`).should("be.visible");
    // The fallback bundle wires the deck inside the pane.
    cy.get(`${HERO} div[data-sem-theme] sem-facts`).should(
      "have.attr",
      "data-sem-fallback"
    );
    cy.get(`${HERO} .code-chrome`)
      .contains("button", toggle)
      .should("have.attr", "aria-pressed", "true");
    cy.get(`${HERO} pre`).should("not.be.visible");
  });
});

Then("the hero {string} toggle returns to the authored markup", (toggle: string) => {
  whenServed(() => {
    cy.get(`${HERO} .code-chrome`)
      .contains("button", toggle)
      .click();
    cy.get(`${HERO} pre > code`)
      .should("be.visible")
      .and("contain", "<sem-note");
    cy.get(`${HERO} div[data-sem-theme]`).should("not.be.visible");
    cy.get(`${HERO} .code-chrome`)
      .contains("button", toggle)
      .should("have.attr", "aria-pressed", "true");
  });
});

Then("the scope section explains what SemText is not", () => {
  whenServed(() => {
    cy.get("section#scope")
      .scrollIntoView()
      .should("be.visible")
      .find("h2")
      .invoke("text")
      .should("match", /What it is not/i);
    cy.get("section#scope sem-note").should("have.length.at.least", 3);
  });
});

Then("the Add Ons section lists six add-on cards", () => {
  whenServed(() => {
    cy.get("section#addons")
      .scrollIntoView()
      .should("be.visible")
      .find("h2")
      .invoke("text")
      .should("match", /Add Ons/i);
    // Cards, not status chips: the add-on section carries no planned/live
    // labels — each add-on gets its real logic as it is built.
    cy.get("section#addons article").should("have.length", 6);
    cy.get("section#addons b.g-status").should("have.length", 0);
  });
});

Then("the showcase menu lists every integration marked planned", () => {
  whenServed(() => {
    const integrations = [
      "The Robot Learns",
      "The Robot Plans",
      "The Robot Knows",
      "Draftamo",
    ];
    cy.get("section#scope details.showcase-menu summary").click();
    // Locate the Integrations list by its heading — the page may carry
    // more showcase menus than the scope section's.
    cy.contains("section#scope .showcase-menu-panel p.g-nav-title", "Integrations")
      .next("ul")
      .should(($ul) => {
        const rows = $ul.find("li");
        expect(rows.length).to.eq(integrations.length);
        rows.each((_, li) => {
          const rowText = li.textContent ?? "";
          integrations.forEach((name) => {
            if (rowText.includes(name)) expect(rowText).to.contain("planned");
          });
          // No integration may carry a "live" status pill.
          const status = li.querySelector("b.g-status");
          if (status) expect(status.textContent?.trim()).to.eq("planned");
        });
      });
  });
});
