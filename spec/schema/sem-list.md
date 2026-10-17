# Schema — `sem-list`

Contract per conventions.md v0.6. New in v0.6. Changes here precede spec
changes precede code.

## Scope semantics

An authored list. The element exists so a list is **one tag with plain
text lines** — the cheapest thing an author (or an agent emitting
markup) can produce — while the browser still renders a real, properly
nested `<ul>`/`<ol>`. It is the list counterpart of `sem-md`: markdown
sugar inside the element, real HTML out.

## Authoring form

```html
<sem-list ordered id="deploy-steps">
  1. Port-forward MinIO
  2. Run migrations
     - auth schema first
     - then tokens
  3. Cut release
</sem-list>

<sem-list>
  - httpOnly cookie
  - memory-scoped storage
</sem-list>
```

Class-form alias (conventions Appendix A spirit): `div.sem-list[data-ordered]` /
`div.sem-list[data-unordered]` around the same text lines.

- `ordered` / `unordered`: **bare boolean attribute**, exactly one,
  choosing `<ol>` vs `<ul>`. Absent ⇒ `unordered`. Both present is an
  authoring error; `data-ordered` / `data-unordered` are the alias
  spellings and follow the global dual-spelling rules.
- Content: **plain text lines only**. A line is one item:
  - `- item` / `* item` — unordered item;
  - `1. item` (any `\d+.`) — ordered item;
  - two leading spaces per extra nesting level indent the item one level
    deeper under the previous item (`Item 2.a` style sub-items are a
    nested list inside item 2);
  - blank lines separate but create nothing.
- Lines that start none of the markers continue the previous item's text.
- **Compat:** a `sem-list` whose children already are real `<ul>`/`<ol>`
  elements keeps parsing — the runtime leaves it untouched (an authored
  `<ul>`/`<ol>` child always wins over the text lines).

## Rendered form

### Extension layer (`semtext/latest/semtext.js`, v0.6 additions)

- Parses the text lines and builds real `<ul>`/`<ol>`/`<li>` as the
  element's children, then marks the element `data-sem-v06` (idempotent;
  a marked element is never re-parsed).
- Nesting deeper than the marker grammar implies is clamped to one level
  per two spaces, in document order.
- The element carries `data-sem-v06` once rendered.

### JS-off

- The source lines read as pre-wrapped text (the vocabulary base gives
  the element a block box; `white-space: pre-wrap` comes from the v0.6
  structural stylesheet), so the list is readable without any script.

## Events

None.

## A11y contract

- Real `<ul>`/`<ol>`/`<li>` — native list semantics, no roles needed.
- Ordered numbering is the browser's, so AT announces it.

## Machine contract

- **Mints nothing.** `sem-list` is an authoring wrapper: extraction
  treats it like ordinary content flow — the rendered `<li>` texts are
  plain text of the element, and a `kind`/`tags`-carrying list is the
  author's signal to mint it as a plain record under the §4 minting test
  of spec/extraction.md, exactly like any other plain HTML.
- No fields of its own; no recorded exception.
