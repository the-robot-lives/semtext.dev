/// <reference types="cypress" />

import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

/*
 * Steps for the /editor page (cypress/e2e/editor.feature). The editor is a
 * client island over the shipped semtext-editor.js bundle; the canvas is the
 * frame's [aria-label="Visual view"] region and the boot status line is
 * [data-testid="editor-status"].
 */

const ISLAND = '[data-testid="editor-island"]';
const HOST = '[data-testid="sem-editor-host"]';
const CANVAS = `${HOST} [aria-label="Visual view"]`;
const MODE_GROUP = `${HOST} [role="radiogroup"][aria-label="View mode"]`;

function visitEditor(query = "") {
  cy.visit(`/editor/${query}`);
  // The island boots after two script loads + openDocument; gate every
  // scenario on the status line switching from "Loading…" to a verdict.
  cy.get('[data-testid="editor-status"]', { timeout: 20000 }).should(
    "contain",
    "Editing",
  );
}

When("I visit the editor page", () => visitEditor());

When('I visit the editor with the example parameter {string}', (tag: string) =>
  visitEditor(`?example=${tag}`),
);

Then("the editor is mounted with the starter document", () => {
  cy.get(ISLAND).should("exist");
  cy.get('[data-testid="editor-nojs"]').should("be.hidden");
  cy.get(HOST).should("exist");
  cy.get(CANVAS)
    .should("be.visible")
    .and("contain", "A SemText document, live")
    .and("contain", "One XHTML file that models read and write");
});

Then('the editor shows the {string} note', (fragment: string) => {
  cy.get(CANVAS).should("contain", fragment);
});

When('I double-click the first canvas paragraph and type {string}', (token: string) => {
  // The note's body slot: dblclick its center lands on the rendered
  // .sem-note-body div (the npl demo recipe — sem-note carries the pilot
  // descriptor's text slots).
  cy.get(`${CANVAS} sem-note`).first().dblclick();
  cy.get(`${CANVAS} .sem-ed-slot-editing`)
    .should("exist")
    .focused()
    .type(`{selectall}${token}{enter}`);
});

Then("the canvas contains {string}", (text: string) => {
  cy.get(CANVAS).should("contain", text);
});

When("I switch the editor to the Code view", () => {
  cy.get(`${MODE_GROUP} button`).contains("Code").click();
});

Then("the code pane shows {string}", (fragment: string) => {
  cy.get(`${HOST} textarea`).should(($el) => {
    const value = $el.val();
    expect(String(value)).to.contain(fragment);
  });
});

Given("I visit the sem-note reference page", () => {
  cy.visit("/reference/sem-note/");
});

When('I follow the "Open in editor" link', () => {
  cy.contains("a", "Open in editor").first().click();
});

Then('I land on the editor with the example {string}', (tag: string) => {
  cy.location("pathname").should("eq", "/editor/");
  cy.location("search").should("eq", `?example=${tag}`);
  cy.get('[data-testid="editor-status"]', { timeout: 20000 }).should(
    "contain",
    `Editing the <${tag}> reference example`,
  );
  cy.get(CANVAS).should("contain", "MinIO port-forward");
});

Then("I capture the editor at the desktop width", () => {
  cy.viewport(1280, 900);
  cy.get(HOST).should("be.visible");
  cy.screenshot("editor-1280", { capture: "viewport" });
});

Then("I capture the editor at the mobile width", () => {
  cy.viewport(390, 844);
  cy.get("header").should("be.visible");
  cy.get(HOST).should("be.visible");
  cy.screenshot("editor-390", { capture: "viewport" });
});
