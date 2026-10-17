# Schema — `sem-section`

Contract per conventions.md v0.6. New in v0.6. Changes here precede spec
changes precede code.

## Scope semantics

A block wrapper for a section of the document. It gives authors a
first-class structural block **inside** the root wrapper — grouped
content, a divider between adjacent sections, and a `kind`/`tags` anchor
for a whole region — without dragging in `<section>`'s article-outline
semantics or any behaviour.

## Authoring form

```html
<sem-section kind="setup">
  <h2 data-kind="title">Setup</h2>
  …
</sem-section>
<sem-section kind="verify">
  …
</sem-section>
```

Class-form alias: `div.sem-section[data-kind]`.

- No parameters of its own; the global catalog (`id`, `kind`, `tags`,
  `audience`) applies.
- Any flow content is valid inside, including other `sem-*` elements and
  nested `sem-section`s.

## Rendered form

### All tiers (CSS)

- A block box; the v0.6 structural stylesheet draws a **divider between
  two adjacent `sem-section` siblings**
  (`+` combinator — a top border on the later section), so a run of
  sections reads as separated chapters with no authored rule.
- Nothing is hidden, ever; no tier marker gates anything here.

### JS-off

Identical — the element is pure structure and CSS.

## Events

None.

## Machine contract

- **Mints nothing.** The wrapper is transparent: extraction descends
  into it as if it were not there (the `sem-source` rule, minus the
  chrome), so a document extracts identically with and without
  `sem-section` wrappers.
- It is a **scope, not content**, like the root wrapper — but unlike the
  root wrapper it may nest and may carry `kind`/`tags`; a
  `kind`/`tags`-carrying section mints as a plain record under the §4
  minting test of spec/extraction.md.
