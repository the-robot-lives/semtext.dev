/// <reference types="cypress" />

import { When } from "@badeball/cypress-cucumber-preprocessor";

/*
 * Steps shared across feature files. Everything under
 * cypress/support/step_definitions/ is loaded for every feature, so only
 * genuinely shared steps belong here.
 */

When("I visit the landing page", () => {
  cy.visit("/");
});
