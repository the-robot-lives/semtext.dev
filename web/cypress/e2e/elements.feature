Feature: Elements glossary
  The /elements/ reference: catalog completeness, pill navigation,
  the table view, and search.

  Scenario: Every catalog element is listed
    Given I visit the elements glossary
    Then every catalog element appears in the pill grid
    And every catalog element appears in the table view
    And every catalog element has a detail panel

  Scenario: The pill grid selects an element and updates the panel
    Given I visit the elements glossary
    When I select the "sem-note" pill
    Then the "sem-note" panel is displayed
    And the "sem-note" pill is marked active
    When I select the "sem-facts" pill
    Then the "sem-facts" panel is displayed and the "sem-note" panel is hidden

  Scenario: The table view lists all elements
    Given I visit the elements glossary
    When I switch to the table view
    Then all elements are listed in the table

  Scenario: Search narrows the list
    Given I visit the elements glossary
    When I search for "quiz"
    Then only matching elements remain visible
    And the view switches to the table while searching
    When I clear the search
    Then every element is visible again
