Feature: sem-see-also deep link
  #ref=<see-also-id> opens the named entry's modal once per page load,
  alongside the #dv= scheme.

  Scenario: A #ref= hash opens the named see-also's modal
    Given I visit the component evaluator rubric with a ref deep link to "sa-fragment-bands"
    Then a dialog is open titled with the target
    And the dialog carries the target "Score-to-grade bands"
