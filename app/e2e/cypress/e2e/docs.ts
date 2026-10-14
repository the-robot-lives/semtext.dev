/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { visitOrGap, whenServed } from "../support/parity";

/*
 * Port of the landing-preview docs steps to the Hologram replatform
 * (parity-harness lane), aligned with the docs page as it stands in the
 * landing-preview export: left sidebar (Docs nav) links Docs / CLI
 * commands / per-tag reference rows / showcase rows / Integrations /
 * Extend / Themes; the header carries Reference (not Docs). Sections on
 * the docs page: cli-commands and showcase.
 *
 * Trailing-slash note: the Next.js static export serves /docs/ directory
 * URLs; the Hologram app serves /docs. Location assertions accept BOTH —
 * the URL convention is not the parity surface.
 */

// [label, href] pairs verified against the landing-preview docs sidebar.
const MENU_LINKS: Array<[string, string]> = [
  ["Docs", "/docs/"],
  ["CLI commands", "/docs/#cli-commands"],
  ["Integrations", "/integrations/"],
  ["Extend", "/extend/"],
  ["Themes", "/themes/"],
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
        cy
          .get(`a[href="${href}"]`)
          .should("have.length", 1)
          .and("contain", label)
      );
    });
  });
});

When("I follow the docs menu link {string}", (label: string) => {
  whenServed(() => {
    const entry = MENU_LINKS.find(([l]) => l === label);
    const nav = () => cy.get('nav[aria-label="Docs"]');
    // "CLI commands" exists twice in the nav (absolute + in-page anchor),
    // so match by the mapped href when the label is known.
    if (entry) nav().find(`a[href="${entry[1]}"]`).click();
    else nav().contains("a", label).click();
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

Then("I land on the landing page try section", () => {
  whenServed(() => {
    cy.location("pathname").should("match", /\/(index\.html)?$/);
    cy.get("section#try h2").should("exist");
  });
});
