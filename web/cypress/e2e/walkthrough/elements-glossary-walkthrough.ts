/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { ELEMENTS } from "../../../app/elements/data";

/*
 * Deliberately paced for the recorded walkthrough video: every action is
 * followed by a beat so a person watching the recording can follow along.
 */

const BEAT = 700;
const PANELS = ["sem-note", "sem-facts", "sem-details", "sem-code", "sem-table"];
const HERO = 'figure.code-window[aria-label="A SemText document fragment"]';

function entry(name: string) {
  const found = ELEMENTS.find((e) => e.name === name);
  if (!found) {
    throw new Error(`unknown catalog element: ${name}`);
  }
  return found;
}

Given("I start on the landing page", () => {
  cy.visit("/");
  cy.wait(BEAT);
});

When("I tour the landing page", () => {
  ["#try", "#tiers", "#reading", "#start", "#surface", "#scope", "#addons"].forEach(
    (id) => {
      cy.get(id).scrollIntoView({ duration: 400 });
      cy.wait(BEAT);
    }
  );
});

When("I render the hero snippet live", () => {
  cy.get(HERO).scrollIntoView({ duration: 300 });
  cy.get(`${HERO} .code-chrome`)
    .contains("button", "Render")
    .click();
  cy.get(`${HERO} div[data-sem-theme]`).should("be.visible");
  cy.wait(1200);
  cy.get(`${HERO} .code-chrome`)
    .contains("button", "Source")
    .click();
  cy.get(`${HERO} pre`).should("be.visible");
  cy.wait(BEAT);
});

When("I open the elements glossary", () => {
  cy.get("header").contains("a", "Elements").click();
  cy.location("pathname").should("eq", "/elements/");
  cy.wait(1000);
});

When("I browse the glossary pills", () => {
  cy.get(".g-pillgrid").scrollIntoView({ duration: 400 });
  cy.get(".g-pillgrid .g-pill").should("have.length", ELEMENTS.length);
  cy.wait(BEAT);
});

When("I open several element panels", () => {
  PANELS.forEach((name) => {
    const e = entry(name);
    cy.get(`.g-pillgrid label.g-pill[for="g-el-${e.id}"]`)
      .scrollIntoView({ duration: 250 })
      .click();
    cy.get(`section#g-panel-${e.id}`)
      .scrollIntoView({ duration: 300 })
      .should("be.visible");
    cy.wait(BEAT);
  });
});

When("I switch to the table view", () => {
  cy.get('label[for="gview-table"]').click();
  cy.get(".g-table").scrollIntoView({ duration: 400 }).should("be.visible");
  cy.get(".g-table tbody tr").should("have.length", ELEMENTS.length);
  cy.wait(1200);
});

When("I filter the glossary by search", () => {
  cy.get("#g-search").scrollIntoView({ duration: 300 }).type("quiz", { delay: 120 });
  cy.get('.g-table tbody tr[data-g*="quiz"]').should("be.visible");
  cy.wait(1200);
  cy.get("#g-search").clear();
  cy.get(".g-table tbody tr:not([hidden])").should("have.length", ELEMENTS.length);
  cy.wait(800);
  cy.get("#g-search").type("token", { delay: 120 });
  cy.get("body").should("have.class", "g-searching");
  cy.wait(1200);
  cy.get("#g-search").clear();
  cy.wait(BEAT);
});

Then("the walkthrough is complete", () => {
  cy.get(".g-table tbody tr:not([hidden])").should(
    "have.length",
    ELEMENTS.length
  );
});
