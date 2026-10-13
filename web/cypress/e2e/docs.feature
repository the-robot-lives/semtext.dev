Feature: Docs and navigation
  The docs page, its getting-started themes, and the docs menu.

  Scenario: Getting started lists the themes
    Given I visit the docs page
    Then the getting started section lists the theme sheets

  Scenario: The docs menu links resolve
    Given I visit the docs page
    Then the docs menu links to all six reference targets
    When I follow the docs menu link "Getting started"
    Then the getting started section is shown
    When I follow the docs menu link "Sample docs"
    Then the sample docs section is shown
    When I follow the docs menu link "Elements"
    Then I land on the elements glossary
    When I follow the docs menu link "Getting started"
    Then the getting started section is shown
    When I follow the docs menu link "Scope"
    Then I land on the landing page scope section

  Scenario: The header links Elements and Docs
    Given I visit the landing page
    When I follow the header link "Elements"
    Then I land on the elements glossary
    When I follow the header link "Docs"
    Then I land on the docs page
