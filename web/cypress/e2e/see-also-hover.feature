Feature: sem-see-also hover preview
  A see-also entry previews its target on hover, in the shared popover.

  Scenario: Hovering a rubric cross-reference shows the target preview
    Given I visit the component evaluator rubric
    When I hover the see-also "Review fragment schema"
    Then a popover is shown with role tooltip
    And the popover names the target "Review fragment schema"
    When I press Escape
    Then the popover is gone
