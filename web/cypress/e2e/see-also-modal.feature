Feature: sem-see-also click modal
  Clicking a see-also entry opens the referenced section in the shared
  modal shell; Escape returns to the page.

  Scenario: Clicking a rubric cross-reference opens the target in a dialog
    Given I visit the component evaluator rubric
    When I click the see-also "Review fragment schema"
    Then a dialog is open titled with the target
    And the dialog carries the target "Review fragment schema"
    When I press Escape
    Then the dialog is closed

  Scenario: View all opens the target in a new tab
    Given I visit the component evaluator rubric
    Then the see-also "Review fragment schema" offers a view-all link in a new tab
