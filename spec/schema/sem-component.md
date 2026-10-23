# Schema — `sem-component`

One card per entry of a component registry — the `components/manifest.yaml`
vocabulary (tag, name, description, source, type, status, labels) rendered
as a SemText record instead of a table row. The component-eval rubric's
component inventory is the motivating surface (item 9): graders cite
components by card, visualizers query the same data as YAML, and the
`sem-see-also` `reference="component"` form resolves against these cards.

Changes here precede spec changes precede code.

## Scope semantics

A card is a RECORD: `record: true`, one per component. The authored
children are the description — the JS-off record — and the upgrade
prepends a header (tag, name, status) and appends a meta footer (type,
source, labels) WITHOUT moving the authored DOM. Headless: no colors, no
inline styles — the card shape is vocabulary CSS over `.sem-component*`
classes, every visual knob a `--sem-component-*` variable with a default.

## Authoring form

```html
<sem-component id="c-waitlist" tag="noizu-waitlist"
  name="Waitlist" type="form" status="live"
  source="src/components/waitlist/noizu-waitlist.ts"
  labels="auth,edge">
  Collects waitlist signups against the Authentik edge.
</sem-component>
```

Class-form alias (Appendix A): `<div class="sem-component">…</div>` — the
same dual-form contract as every `sem-*` element; the runtime mirrors the
tag onto `data-sem-component-tag` for class-form parity.

## Attributes

| attr | form | notes |
|---|---|---|
| `tag` | required token | the manifest tag; the card's key |
| `name` | text | display name; defaults to the tag in the rendered head |
| `source` | text | implementation path, as in the manifest |
| `type` | text | free text carrying the manifest's type vocabulary; rendered as the card's type chip |
| `status` | token | manifest status vocabulary — `planned` `wip` `live` `deprecated`; unknown is an error |
| `labels` | flaglist | free labels, rendered as chips |

The authored children carry the description; there is no separate
description attribute.

## Rendered form

Enhanced: `div.sem-component-head` (a `<code>` tag, the name, a status
chip) prepended; `div.sem-component-meta` (type, source path, label list)
appended; authored children untouched between them. `role="article"` and
an `aria-label` ("`<name>` component card") name the card for AT. JS-off:
the authored children alone are the record; the chrome is generated.

## Extraction

`buildComponent` fields: `tag`, `name`, `type`, `status`, `labels[]`,
`source`; `text` is the authored description. The card reads
identically with the script on or off.

## Tests

BDD: `test/e2e/sem-component.cy.js` (upstream); the rubric fixture at
`web/public/spec/web-component-evaluator.sem.html` is the integration
surface.
