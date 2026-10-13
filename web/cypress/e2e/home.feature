Feature: Landing page
  The semtext.dev home page: the SemText headline, the hero render
  toggle, the scope section with its showcase menu of planned
  integrations, and the add-ons carousel — add-on cards carry no
  planned/live status labels.

  Scenario: Home page loads with the SemText headline
    When I visit the landing page
    Then the SemText headline is visible
    And the hero window shows the authored source by default

  Scenario: The hero render toggle switches Source to Rendered and back
    When I visit the landing page
    Then the hero "Render" toggle renders the SemText snippet
    And the hero "Source" toggle returns to the authored markup

  Scenario: The scope section is present
    When I visit the landing page
    Then the scope section explains what SemText is not

  Scenario: Add Ons section lists six cards with no status chips
    When I visit the landing page
    Then the Add Ons section lists six add-on cards

  Scenario: Showcase integrations are marked planned
    When I visit the landing page
    Then the showcase menu lists every integration marked planned
