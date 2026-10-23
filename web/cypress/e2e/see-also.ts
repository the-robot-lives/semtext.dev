/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

/*
 * The component-evaluator rubric (web/public/spec/) is the integration
 * surface for sem-component / sem-see-also: five see-also cross-references
 * and two component cards, upgraded by the vendored bundle at
 * /semtext/latest/. Aligned with see-also.ts: the label anchor
 * (.sem-see-also-link) previews on hover and opens the shared modal shell
 * on click; a.sem-see-also-view is the new-tab View-all affordance;
 * #ref=<id> opens the named entry's modal once per page load.
 */

const RUBRIC = "/spec/web-component-evaluator.sem.html";

const linkFor = (label: string) =>
  cy
    .contains(".sem-see-also-link", label)
    .should("exist")
    .and("be.visible");

Given("I visit the component evaluator rubric", () => {
  cy.visit(RUBRIC);
});

Given(
  "I visit the component evaluator rubric with a ref deep link to {string}",
  (id: string) => {
    cy.visit(`${RUBRIC}#ref=${id}`);
  },
);

When("I hover the see-also {string}", (label: string) => {
  linkFor(label).trigger("mouseover");
});

When("I click the see-also {string}", (label: string) => {
  linkFor(label).click();
});

When("I press Escape", () => {
  cy.get("body").type("{esc}");
});

Then("a popover is shown with role tooltip", () => {
  cy.get(".sem-popover")
    .should("be.visible")
    .and("have.attr", "role", "tooltip");
});

Then("the popover names the target {string}", (title: string) => {
  cy.get(".sem-popover")
    .find(".sem-popover-term")
    .invoke("text")
    .should("contain", title);
});

Then("the popover is gone", () => {
  cy.get(".sem-popover").should("not.exist");
});

Then("a dialog is open titled with the target", () => {
  cy.get('[role="dialog"]')
    .should("be.visible")
    .and("have.attr", "aria-modal", "true");
});

Then("the dialog carries the target {string}", (heading: string) => {
  // The modal carries the target (a clone) — its heading names it.
  cy.get('[role="dialog"]').contains(heading).should("exist");
});

Then("the dialog is closed", () => {
  cy.get('[role="dialog"]').should("not.exist");
});

Then(
  "the see-also {string} offers a view-all link in a new tab",
  (label: string) => {
    linkFor(label)
      .closest(".sem-see-also")
      .find("a.sem-see-also-view")
      .should("have.attr", "target", "_blank");
  },
);
