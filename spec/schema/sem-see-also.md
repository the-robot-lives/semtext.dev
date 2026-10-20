# Schema — `sem-see-also`

A related-reference entry: ONE target this document already contains (a
section or a `sem-component` card) or a file beside it, offered as a link
with a hover preview, a click-to-open modal, and a "View all" affordance
into a new tab. Rubric cross-references are the motivating surface
(item 9); the shared modal shell (shared/modal.ts) was factored out of
the data-visualizer Expand viewer for exactly this element.

Changes here precede spec changes precede code.

## Scope semantics

The authored children are the label (and the JS-off record: the target
reference as plain text when the script is off). The upgrade wraps the
label in the link anchor, appends the View-all affordance, and wires the
preview + modal — idempotent on chrome markers, so the Lit component and
the bundle scan may run in either order.

## Authoring form

```html
<sem-see-also id="sa-bands" reference="section" target="#bands">Score bands</sem-see-also>

<sem-see-also id="sa-waitlist" reference="component" target="noizu-waitlist">Waitlist card</sem-see-also>

<sem-see-also id="sa-manifest" reference="file" target="components/manifest.yaml" preview="file">The manifest</sem-see-also>
```

Class-form alias (Appendix A): `<div class="sem-see-also">…</div>`.

## Attributes

| attr | form | notes |
|---|---|---|
| `reference` | token, default `section` | what `target` names: `section` (an id), `component` (a manifest tag resolved against `sem-component` cards), `file` (a path) |
| `target` | required text | the address: id/`#id`, component tag, or file path |
| `href` | text | optional explicit View-all URL overriding the target-derived link |
| `preview` | token, default `tldr` | `tldr` clones the target's summary (its `sem-tldr`, else heading + first paragraph; a component card's head); `file` shows the authored text as the description of the named path |
| `insert-as` | token, default `link` | `link` renders the anchor row; `inline` embeds the target's content in place (authored children stay as the label) |

## Behavior

- **Hover/focus** — a preview in the shared popover (`sem-popover`, the
  glossary surface; WCAG 1.4.13 dismissible/hoverable).
- **Click** — the target opens in the shared modal shell
  (`role="dialog"`, Escape, focus trap); a CLONE, so the document never
  moves. Never intercepts modified clicks (cmd/ctrl/shift) — those are
  the user's navigation.
- **View all (`↗`)** — `target="_blank"`; the escape hatch for real
  context. The preview and modal never hide this navigation.
- **Deep link** — `#ref=<see-also-id>` (the `&`-joined hash form,
  alongside `#dv=`) opens the named entry's modal once per page load.

A `reference="section"|"component"` target that resolves to nothing
warns (`dangling-fragment` in the validator; console at runtime).

## Extraction

`buildSeeAlso` fields: `reference`, `target`, `preview`, `insert-as`;
`text` is the authored label.

## Tests

BDD: hover `test/e2e/sem-see-also-hover.cy.js`, modal
`test/e2e/sem-see-also-modal.cy.js`, deep link
`test/e2e/sem-see-also-deep-link.cy.js` (upstream); BDD feature files
under `web/cypress/` cover the rubric integration.
