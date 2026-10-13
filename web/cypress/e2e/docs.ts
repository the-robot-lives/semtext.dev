/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

/*
 * Aligned with the docs page as rebuilt by 06125e5 (left-sidebar layout):
 * nav groups Guides/Reference/Showcase/Platform, sections cli-commands and
 * showcase. Showcase rows point at the external showcase origin, so the
 * menu assertions check hrefs without following them.
 */
const MENU_LINKS: Array<[string, string]> = [
  ["CLI commands", "/docs/"],
  ["Elements", "/elements/"],
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
  cy.visit("/docs/");
});

Then("the CLI commands section lists the semtext subcommands", () => {
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

Then("the docs menu links to its reference targets", () => {
  cy.get('nav[aria-label="Docs"]').within(() => {
    MENU_LINKS.forEach(([label, href]) =>
      cy.contains("a", label).should("have.attr", "href", href)
    );
  });
});

When("I follow the docs menu link {string}", (label: string) => {
  cy.get('nav[aria-label="Docs"]').contains("a", label).click();
});

When("I follow the header link {string}", (label: string) => {
  cy.get("header").contains("a", label).click();
});

Then("I land on the elements glossary", () => {
  cy.location("pathname").should("eq", "/elements/");
  cy.get("h1").invoke("text").should("match", /The elements/i);
});

Then("I land on the docs page", () => {
  cy.location("pathname").should("eq", "/docs/");
  cy.get("h1").invoke("text").should("match", /Documentation/i);
});

Then("the CLI commands section is shown", () => {
  cy.get("section#cli-commands").should("be.visible");
});

Then("I land on the landing page scope section", () => {
  cy.location("pathname").should("eq", "/");
  cy.location("hash").should("eq", "#scope");
  cy.get("section#scope h2").should("exist");
});

Then("I land on the landing page add-ons section", () => {
  cy.location("pathname").should("eq", "/");
  cy.location("hash").should("eq", "#addons");
  cy.get("section#addons h2").should("exist");
});

Then("I land on the landing page extend section", () => {
  cy.location("pathname").should("eq", "/");
  cy.location("hash").should("eq", "#extend");
  cy.get("section#extend h2").should("exist");
});
