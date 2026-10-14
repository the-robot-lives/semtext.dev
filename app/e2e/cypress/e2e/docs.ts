/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { visitOrGap, whenServed } from "../support/parity";

/*
 * Port of the landing-preview docs steps to the Hologram replatform
 * (parity-harness lane). Aligned with the docs page as rebuilt by the
 * left-sidebar layout: nav groups Guides/Reference/Showcase/Platform,
 * sections cli-commands and showcase. The Reference group points at the
 * tag reference; showcase rows point at the external showcase origin, so
 * the menu assertions check hrefs without following them.
 *
 * Trailing-slash note: the Next.js static export serves /docs/ directory
 * URLs; the Hologram app serves /docs. Location assertions accept BOTH —
 * the URL convention is not the parity surface.
 */

const MENU_LINKS: Array<[string, string]> = [
  ["CLI commands", "/docs/"],
  ["Tag reference", "/reference/"],
  ["Add Ons", "/#addons"],
  ["Extend", "/#extend"],
  ["Scope", "/#scope"],
];

const CLI_SUBCOMMANDS = [
  "doc.semtext.html",
  "semtext tui",
  "semtext --render",
  "semtext extract",
  "semtext validate",
];

Given("I visit the docs page", () => {
  visitOrGap("/docs/", "docs.feature");
});

Then("the CLI commands section lists the semtext subcommands", () => {
  whenServed(() => {
    cy.get("section#cli-commands")
      .scrollIntoView()
      .should("be.visible")
      .find("h2")
      .invoke("text")
      .should("match", /CLI commands/i);
    CLI_SUBCOMMANDS.forEach((cmd) =>
      cy
        .get("section#cli-commands")
        .contains("code", cmd)
        .scrollIntoView()
        .should("exist")
    );
    // The showcase section renders live showcase rows as sem-properties.
    cy.get("section#showcase sem-property").should("have.length.at.least", 3);
  });
});

Then("the docs menu links to its reference targets", () => {
  whenServed(() => {
    cy.get('nav[aria-label="Docs"]').within(() => {
      MENU_LINKS.forEach(([label, href]) =>
        cy.contains("a", label).should("have.attr", "href", href)
      );
    });
  });
});

When("I follow the docs menu link {string}", (label: string) => {
  whenServed(() => {
    cy.get('nav[aria-label="Docs"]').contains("a", label).click();
  });
});

When("I follow the header link {string}", (label: string) => {
  whenServed(() => {
    cy.get("header").contains("a", label).click();
  });
});

Then("I land on the tag reference", () => {
  whenServed(() => {
    cy.location("pathname").should("match", /\/reference\/?$/);
    cy.get("h1").invoke("text").should("match", /Every tag/i);
  });
});

Then("I land on the docs page", () => {
  whenServed(() => {
    cy.location("pathname").should("match", /\/docs\/?$/);
    cy.get("h1").invoke("text").should("match", /Documentation/i);
  });
});

Then("the CLI commands section is shown", () => {
  whenServed(() => {
    cy.get("section#cli-commands").should("be.visible");
  });
});

Then("I land on the landing page scope section", () => {
  whenServed(() => {
    cy.location("pathname").should("match", /\/(index\.html)?$/);
    cy.location("hash").should("eq", "#scope");
    cy.get("section#scope h2").should("exist");
  });
});

Then("I land on the landing page add-ons section", () => {
  whenServed(() => {
    cy.location("pathname").should("match", /\/(index\.html)?$/);
    cy.location("hash").should("eq", "#addons");
    cy.get("section#addons h2").should("exist");
  });
});

Then("I land on the landing page extend section", () => {
  whenServed(() => {
    cy.location("pathname").should("match", /\/(index\.html)?$/);
    cy.location("hash").should("eq", "#extend");
    cy.get("section#extend h2").should("exist");
  });
});
