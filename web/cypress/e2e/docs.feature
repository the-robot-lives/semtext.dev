Feature: Docs and navigation
  The docs page, its CLI guide sections, and the docs menu.

  Scenario: CLI commands lists the terminal surfaces
    Given I visit the docs page
    Then the CLI commands section lists the semtext subcommands

  Scenario: The docs menu links resolve
    Given I visit the docs page
    Then the docs menu links to its reference targets
    When I follow the docs menu link "CLI commands"
    Then the CLI commands section is shown
    When I follow the docs menu link "Elements"
    Then I land on the elements glossary
    When I follow the header link "Docs"
    Then I land on the docs page

  Scenario: The header links Elements and Docs
    Given I visit the landing page
    When I follow the header link "Elements"
    Then I land on the elements glossary
    When I follow the header link "Docs"
    Then I land on the docs page
