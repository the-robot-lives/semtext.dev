Feature: Docs and navigation
  The docs page, its CLI guide sections, and the docs menu. (Port of
  the landing-preview docs.feature to the Hologram replatform; routes
  the app does not serve yet are parity GAPs — skipped and recorded.)

  Scenario: CLI commands lists the terminal surfaces
    Given I visit the docs page
    Then the CLI commands section lists the semtext subcommands

  Scenario: The docs menu links resolve
    Given I visit the docs page
    Then the docs menu links to its reference targets
    When I follow the docs menu link "CLI commands"
    Then the CLI commands section is shown
    When I follow the docs menu link "Tag reference"
    Then I land on the tag reference
    When I follow the header link "Docs"
    Then I land on the docs page

  Scenario: The header links Reference and Docs
    Given I visit the landing page
    When I follow the header link "Reference"
    Then I land on the tag reference
    When I follow the header link "Docs"
    Then I land on the docs page
