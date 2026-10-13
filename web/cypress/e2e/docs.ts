/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

const MENU_LINKS: Array<[string, string]> = [
  ["Elements", "/elements/"],
  ["Getting started", "/docs/#getting-started"],
  ["Sample docs", "/docs/#samples"],
  ["Add Ons", "/#addons"],
  ["Extend", "/#extend"],
  ["Scope", "/#scope"],
];

Given("I visit the docs page", () => {
  cy.visit("/docs/");
});

Then("the getting started section lists the theme sheets", () => {
  cy.get("section#getting-started")
    .scrollIntoView()
    .should("be.visible")
    .find("h2")
    .invoke("text")
    .should("match", /Getting started/i);
  // Theme keys are attributes on sem-property (rendered via CSS content,
  // not text), so assert the entries themselves.
  ["semtext.css", "minimal-tech-light", "your theme here"].forEach(
    (key) =>
      cy
        .get(`section#getting-started sem-property[key="${key}"]`)
        .scrollIntoView()
        .should("exist")
  );
  cy.get("section#getting-started .g-status").then(($statuses) => {
    const texts = [...$statuses].map((el) => (el.textContent ?? "").trim());
    expect(texts.filter((t) => t === "ships").length).to.be.at.least(2);
    expect(texts).to.include("planned");
  });
});

Then("the docs menu links to all six reference targets", () => {
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
  cy.get("h1").invoke("text").should("match", /Docs/i);
});

Then("the getting started section is shown", () => {
  cy.location("hash").should("eq", "#getting-started");
  cy.get("h2#getting-started-h").should("be.visible");
});

Then("the sample docs section is shown", () => {
  cy.location("hash").should("eq", "#samples");
  cy.get("h2#samples-h").should("be.visible");
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
