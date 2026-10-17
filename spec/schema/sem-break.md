# Schema — `sem-break`

Contract per conventions.md v0.6. New in v0.6. Changes here precede spec
changes precede code.

## Scope semantics

An EMPTY visual divider — the `<hr>` replacement. A thematic break in the
prose that carries no content and no semantics beyond "a break here".
`<hr>` is never authored (conventions §3.1; the validator warns); the
runtime and CSS render `sem-break` as the rule.

## Authoring form

```html
…end of part one.
<sem-break></sem-break>
Part two begins.
```

Self-closing spelling (`<sem-break/>`) is the same element in XHTML
serialization. Class-form alias: `div.sem-break`.

- **Must be empty.** Any authored child or text is an authoring error —
  content belongs outside the break.
- No parameters; not even the global catalog earns its keep here (an
  `id` on a divider mints nothing and anchors nothing).

## Rendered form

### All tiers (CSS)

- The v0.6 structural stylesheet renders the element as a horizontal
  rule (`border-top` on a block box, generous vertical margin) in every
  tier, with no script involved.
- Themes tune it via the standard tokens (`--sem-border`).

### JS-off

Identical.

## Events

None.

## Machine contract

- **Mints nothing.** An empty element with no content contributes no
  record and no text; extraction skips it.
- Authored `<hr>` remains valid input (compat) but is an authoring
  warning; it mints a plain record only under the §4 minting test, as
  any plain HTML does.
