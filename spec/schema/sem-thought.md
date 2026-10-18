# Schema — `sem-thought`

Contract per conventions.md v0.5. BDD source of truth for
`test/e2e/sem-thought.cy.js`. Changes here precede spec changes precede code.

## Authoring form

```html
<sem-thought type="observation">The draft pulls one fact per section — note the outline says two.</sem-thought>
<sem-thought type="tangent">This is where the R/W2 reader idea came from.</sem-thought>
```

Class-form alias (conventions Appendix A): `div.sem-thought[data-type]`, body
is the element's own content in both forms.

- `type`: `observation` | `reflection` | `assumption` | `mind-read` |
  `tangent` | `concern`. Optional — a `sem-thought` with no `type` is a
  plain bubble. **Unknown type**: not an authoring error; see Degradation.
- `id`, `kind`, `tags`, `audience` per global attribute catalog.

### The type set

Six tokens, fixed. Four are the NPL reasoning facets this vocabulary is the
document-shaped rendering target of (conventions §9): `observation`,
`reflection`, `assumption`, `mind-read` (the `<npl-mindread>` pump facet).
Two are the most narratively useful types of the `npl-thought` subtree this
element is the lightweight sibling of: `tangent` (associative aside) and
`concern` (flagged worry/risk). The subtree's remaining types
(`question`, `relation`, `affirmation`, `opportunity`, `aversion`,
`interest`, `eval`) are deliberate non-goals here: a display-only vocabulary
element earns a token only when a document needs to *qualify* prose with it,
and those are carried today by `kind`/`tags` or plain prose. Extending the
set is a schema change (semtext.schema.json `values`), never a runtime
lookup — the element and CSS are table-driven by the same list.

## What it is not

The less-configurable sibling of tobor-kit's rich `tobor-thought-bubble`:
**no `collapsed` state, no summary teaser, no ttl/toast/sound controls, no
events, no chrome.** Display-only means the element renders its content and
nothing else. A collapsible thought is `sem-reveal` territory; a collapsible
callout is `sem-note[collapsed]`. Adding a toggle here would pull a fallback
handler plus a `semtext.js` size-budget bump for behavior `sem-reveal`
already owns — declined for v1; revisit only if documents demonstrate the
need.

## Rendered form

- Upgraded: `<sem-thought>` itself (Lit `SemThought`). No shadow root; light
  DOM, content searchable. The component mirrors `type` to `data-type`
  (§2 spelling contract, `data-` wins), adds the class `sem-thought-<type`
  (the element's reserved `.sem-thought-*` namespace), sets `role="note`
  deferred past parse (never in a `sem-source` snapshot), and stamps
  `data-sem-upgraded`.
- Pre-upgrade / JS-off: the `:is(sem-thought, .sem-thought)` base in
  `themes/_vocabulary.css` — bubble box, type label via attribute selectors
  (both spellings from one rule, D10), CSS-only tail dots. No hide rule
  exists: every hide rule in the vocabulary is gated on a tier marker (D12),
  and this element hides nothing.
- Styling tokens: the bubble reads `--sem-thought-bg` (default
  `--sem-surface`), `--sem-thought-border` (default `--sem-border`) and a
  per-type accent `--sem-thought-<type` (default `--sem-accent`) — read in
  the vocabulary base, declared per palette in the theme file
  (`minimal-tech-light` ships all six). An un-themed document shows one
  uniform accent bubble per type, never a broken box.
- The tail is two CSS pseudo-element dots (`::after` circle + a `box-shadow`
  sibling), no SVG asset, no extra element.

## Degradation (unknown type)

On upgrade, an element whose `type` is not one of the six (either spelling,
case-insensitive) gets class `sem-thought-unknown`, an author-facing warning
(`SemThought` warn channel), and its content is **replaced by its own text**
(the `npl-thought` rule: never render structured markup an unknown type did
not promise). The write is deferred past parse (`afterParse`), so a
`sem-source` snapshot still shows the authored markup. The validator flags
an unknown token as a **warning**, not an error, for the same reason.
JS-off, an unknown-type bubble renders its full authored content unstyled by
type — the ordinary fail-open.

## Events

None.

## A11y contract

- `role="note"` present in DOM (authored or set on upgrade); docs may author
  it pre-set so machine readers see the role without JS.
- Type by accent color + the type label (`::before`, rendered from the
  attribute in both spellings); color is never the only signal — the label
  text carries the type name.

## Machine contract

- **Mints no record.** Display-only: like `sem-source`/`sem-reader`, the
  element contributes no entry to the record array; its text reaches
  consumers only as prose of an enclosing record (or not at all at top
  level, like any plain paragraph). Typed record extraction is a deliberate
  deferral until the type set settles — promoting it later is additive
  (new record type) and cannot break existing consumers.
- The degradation of an unknown type is text-preserving, so every
  extraction of the document — before, after, JS-off, JS-on — reads the
  same prose (the invariant holds trivially; nothing hides).
- `kind`/`tags` still qualify the bubble per the global catalog; an author
  who needs the thought in the record stream today wraps it in a record
  that mints (`sem-note`, `sem-fact`) or carries `kind`/`tags` on an
  ordinary element.
