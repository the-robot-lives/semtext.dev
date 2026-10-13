Feature: Elements glossary walkthrough
  A slow, watchable video tour: the landing page sections, the hero
  snippet rendering live, then the elements glossary — pills, detail
  panels, the table view, and search.

  Scenario: Walk through the elements glossary
    Given I start on the landing page
    When I tour the landing page
    And I render the hero snippet live
    And I open the elements glossary
    And I browse the glossary pills
    And I open several element panels
    And I switch to the table view
    And I filter the glossary by search
    Then the walkthrough is complete
