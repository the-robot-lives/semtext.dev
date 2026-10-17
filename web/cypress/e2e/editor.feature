Feature: The SemText editor page
  The /editor page: a client island mounting <sem-editor> from the shipped
  semtext-editor.js bundle over a starter document, a reference example
  (?example=<tag>), and the Open-in-editor deep links from the reference.

  Scenario: The editor loads with the starter document
    When I visit the editor page
    Then the editor is mounted with the starter document

  Scenario: An example parameter loads that tag's reference example
    When I visit the editor with the example parameter "sem-note"
    Then the editor shows the "MinIO port-forward" note

  Scenario: Double-click edits text in place
    When I visit the editor page
    When I double-click the first canvas paragraph and type "EDITOR-TOKEN"
    Then the canvas contains "EDITOR-TOKEN"

  Scenario: The Code view shows the document source
    When I visit the editor with the example parameter "sem-note"
    When I switch the editor to the Code view
    Then the code pane shows "<sem-note"

  Scenario: Open in editor from the reference lands on the editor
    Given I visit the sem-note reference page
    When I follow the "Open in editor" link
    Then I land on the editor with the example "sem-note"

  Scenario: Width captures
    When I visit the editor with the example parameter "sem-note"
    Then I capture the editor at the desktop width
    And I capture the editor at the mobile width
