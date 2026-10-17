/**
 * /editor — the real editor bundle, browser-level (cutover spec the
 * site-editor lane deferred: pinning the placeholder would have died at
 * the bundle sync).
 *
 * Drives the documented surface end to end on ONE route:
 *   /editor?example=sem-note
 *     → the island bridge loads the vendored core + editor bundles
 *     → <sem-editor> mounts, the example opens through the §9.2 door
 *     → double-click enters a block edit (contenteditable)
 *     → the toolbar's Code radio flips data-mode to "code"
 *   and the page must do all of it with zero console errors (the editor
 *   hook contract is silent-failure for READERS; on the editor page the
 *   bundle actually loads, so any console error is a real defect).
 */

describe("/editor — the real editor bundle", () => {
  let consoleErrors: string[] = []

  beforeEach(() => {
    consoleErrors = []
    cy.visit("/editor?example=sem-note", {
      onBeforeLoad(win) {
        win.console.error = (...args: unknown[]) => {
          consoleErrors.push(args.map(String).join(" "))
        }
        win.addEventListener("unhandledrejection", (e) => {
          consoleErrors.push(`unhandledrejection: ${String(e.reason)}`)
        })
      },
    })
  })

  it("opens the sem-note example, edits inline, toggles code — no console errors", () => {
    // The bridge loads two bundles before the shell registers; give the
    // mount a generous window (defaultCommandTimeout is 10s per command).
    cy.get("sem-editor", { timeout: 20000 })
      .should("have.attr", "edit-mode")
      .and("have.attr", "data-mode", "wysiwyg")

    // The example opened through openDocument: the canvas renders the
    // real sem-note (registered by the core bundle, claimed by the editor).
    cy.get("sem-editor .sem-ed-canvas sem-note", { timeout: 20000 }).should("exist")
    cy.get("#editor-status").should("contain.text", "Opened the sem-note example")

    // Double-click edit: the descriptor path turns the block editable.
    cy.get("sem-editor .sem-ed-canvas sem-note").dblclick()
    cy.get("sem-editor .sem-ed-canvas sem-note [contenteditable]").should("exist")

    // Toggle code: the toolbar radiogroup flips the reflected mode.
    cy.get("sem-editor .sem-ed-mode").contains("Code").click()
    cy.get("sem-editor").should("have.attr", "data-mode", "code")

    // And back — the cycle is a real toggle, not a one-way switch.
    cy.get("sem-editor .sem-ed-mode").contains("Visual").click()
    cy.get("sem-editor").should("have.attr", "data-mode", "wysiwyg")

    // The whole walkthrough ran silent.
    cy.wrap(null).should(() => {
      expect(consoleErrors, "console errors on /editor").to.deep.eq([])
    })
  })
})
