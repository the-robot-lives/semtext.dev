/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { ELEMENTS } from "../../app/elements/data";

/*
 * The expected catalog IS the app's own reviewable data file
 * (app/elements/data.ts), imported read-only — the suite can never drift
 * from the glossary it asserts against.
 */

function entry(name: string) {
  const found = ELEMENTS.find((e) => e.name === name);
  if (!found) {
    throw new Error(`unknown catalog element: ${name}`);
  }
  return found;
}

Given("I visit the elements glossary", () => {
  cy.visit("/elements/");
});

Then("every catalog element appears in the pill grid", () => {
  cy.get(".g-pillgrid .g-pill").should("have.length", ELEMENTS.length);
  cy.get(".g-pillgrid .g-pill").each(($pill, i) =>
    expect($pill.find("code").text()).to.eq(ELEMENTS[i].name)
  );
});

Then("every catalog element appears in the table view", () => {
  cy.get(".g-table tbody tr").should("have.length", ELEMENTS.length);
  cy.get(".g-table tbody tr").each(($row, i) =>
    expect($row.find("td").first().text()).to.contain(ELEMENTS[i].name)
  );
});

Then("every catalog element has a detail panel", () => {
  ELEMENTS.forEach((e) =>
    cy
      .get(`section#g-panel-${e.id}`)
      .scrollIntoView()
      .should("exist")
      .and("have.attr", "aria-label", e.name)
  );
});

When("I select the {string} pill", (name: string) => {
  cy.get(`.g-pillgrid label.g-pill[for="g-el-${entry(name).id}"]`).click();
});

Then("the {string} panel is displayed", (name: string) => {
  const e = entry(name);
  cy.get(`input#g-el-${e.id}`).should("be.checked");
  cy.get(`section#g-panel-${e.id}`)
    .scrollIntoView()
    .should("be.visible")
    .and("contain", name);
});

Then("the {string} pill is marked active", (name: string) => {
  cy.get(`.g-pillgrid label.g-pill[for="g-el-${entry(name).id}"]`).should(
    "have.class",
    "is-active"
  );
});

Then(
  "the {string} panel is displayed and the {string} panel is hidden",
  (shown: string, hidden: string) => {
    cy.get(`section#g-panel-${entry(shown).id}`)
      .scrollIntoView()
      .should("be.visible");
    cy.get(`section#g-panel-${entry(hidden).id}`).should("not.be.visible");
  }
);

When("I switch to the table view", () => {
  cy.get('label[for="gview-table"]').click();
});

Then("all elements are listed in the table", () => {
  cy.get("input#gview-table").should("be.checked");
  cy.get(".g-table").scrollIntoView().should("be.visible");
  cy.get(".g-table tbody tr").should("have.length", ELEMENTS.length);
  cy.get(".g-pillgrid").should("not.be.visible");
});

When("I search for {string}", (query: string) => {
  cy.get("#g-search").type(query);
});

Then("only matching elements remain visible", () => {
  cy.get("body").should("have.class", "g-searching");
  cy.get('.g-table tbody tr[data-g*="quiz"]').should("be.visible");
  cy.get('.g-table tbody tr:not([data-g*="quiz"])').should("be.hidden");
  cy.get('.g-pillgrid .g-pill:not([data-g*="quiz"])').should("be.hidden");
});

Then("the view switches to the table while searching", () => {
  cy.get("input#gview-table").should("be.checked");
  cy.get(".g-table").should("be.visible");
});

When("I clear the search", () => {
  cy.get("#g-search").clear();
});

Then("every element is visible again", () => {
  cy.get("body").should("not.have.class", "g-searching");
  cy.get(".g-table tbody tr:not([hidden])").should(
    "have.length",
    ELEMENTS.length
  );
  cy.get(".g-pillgrid .g-pill:not([hidden])").should(
    "have.length",
    ELEMENTS.length
  );
});
