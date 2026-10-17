# Schema — `sem-references` / `sem-reference`

Contract per conventions.md v0.6. BDD source of truth for
`test/e2e/sem-references.cy.js`. Changes here precede spec changes
precede code.

## Scope semantics

A numbered list of works or notes the prose cites. Each `sem-reference`
is one citable entry carrying a `cite` locator; **inline citations are
plain anchors** (`<a href="#refs-rfc-6749">`) and mint nothing. The
element exists because a reference needs a field a `<li>` cannot carry
(`cite`) and because backlinks and hover previews are reading
affordances that need JS.

## Authoring form

```html
<p>Rotate refresh tokens per use<a href="#refs-rfc-6749">[1]</a>.</p>

<sem-references id="refs" kind="bibliography">
  <sem-reference cite="https://www.rfc-editor.org/rfc/rfc6749">
    The OAuth 2.0 Authorization Framework, §10.4.
  </sem-reference>
  <sem-reference cite="RFC 6749">A short-label note; same slug rule.</sem-reference>
</sem-references>
```

Class-form alias (conventions Appendix A): `div.sem-references[data-kind]` › `div.sem-reference[data-cite]`.
Parameters are read as `data-<name>` first, then bare `<name>`.

- `kind`: `footnotes` | `bibliography` (free token; these two get
  distinct styling). Optional.
- `sem-reference`:
  - `cite` (**required**, v0.6): the locator — a path or URL. This is
    the canonical authoring form; the element exists to carry it.
  - `href` (optional): accepted as a compat alias of `cite` for
    pre-v0.6 documents; when both are present `cite` wins for the
    auto-id and the external link uses whichever is a URL. Not authored
    in new documents.
  - `id` (optional, **not authored** in new documents): the citation
    target. The AUTO-ID rule materializes it at runtime (below), so an
    author never makes one up.
  - Text = the reference's description.
- Inline citation: any `<a href="#<reference-id>">` outside the references
  container. Its text is the author's (`[1]`, `¹`, a name) — the vocabulary
  does not renumber authored citation text. An author citing an
  auto-id'd reference composes the anchor from the AUTO-ID rule below.

### AUTO-ID rule (v0.6, normative)

For a `sem-reference` with `cite` and no authored `id`, the runtime (and
any consumer applying the same pure function) materializes:

```
id = <block-id> + "-" + slug(cite)
```

- `<block-id>` is the parent `sem-references` block's `id`, defaulting
  to `refs` when the block has none.
- `slug(cite)`: lowercase the string, then replace every run of
  non-alphanumeric characters with a single `-`, then strip leading and
  trailing `-`. `Projects/github-tools/docs/gh-wait.md` (under block
  `refs`) → `refs-projects-github-tools-docs-gh-wait-md`.
  `RFC 6749` → `refs-rfc-6749`.
- An authored `id` always wins; the runtime never overwrites one.
- The function is pure, so a machine consumer can compose citation
  anchors from `cite` without running the document.

## Rendered form

### All tiers (CSS)

- Entries are numbered by CSS counter (`::before`), 1-based in DOM order.
- The `:target` entry is highlighted (deep-linking from a citation works
  with no script).
- `kind="bibliography"` uses a hanging indent; `kind="footnotes"` a
  compact list.

### Fallback (reading bundle)

- Every citing anchor gets the runtime class `.sem-references-ref` and a
  hover / focus **preview popover** (`src/shared/popover.ts`) showing the
  reference's text; `Esc` closes it; the anchor still navigates on click.
- Every cited reference gets `.sem-references-backlinks` appended: one
  `<a>` per citing anchor, `aria-label="Back to citation N"`, pointing at
  that anchor (which is given an id when it has none).
- A reference with a URL locator (`cite` or `href`, whichever is a URL)
  gets `.sem-references-link`, an external link to it, appended.
- The container carries `data-sem-fallback` once wired.

### Upgraded (Lit `SemReferences`)

- Thin wrapper: claims `data-sem-upgraded`, clears `data-sem-fallback`,
  then calls the bundle's enhance function once its `sem-reference`
  children exist. Idempotent per anchor and per reference.

### JS-off

- Numbered list, `:target` highlight, no backlinks, no popover.
- Print: each reference with a URL locator shows `(url)` after its text —
  inside the references block only, never at the citation.

## Events

None.

## A11y contract

- List presentation comes from the element's box; `role="list"` /
  `role="listitem"` may be authored but are **optional** (v0.6 — same
  rule as `sem-procedure`).
- Backlinks carry `aria-label="Back to citation N"`.
- The preview is `role="tooltip"`; while shown, the citing anchor carries
  `aria-describedby` pointing at it; `Esc` dismisses; it opens on focus as
  well as hover, so keyboard users get it too.
- The citation anchor remains an ordinary link: preview never replaces
  navigation.

## Machine contract

- Container: `fields: {}`, `text: ""`.
- `sem-reference` yields `fields: { href, cite, ordinal }` — attribute
  strings (`""` when absent) and the positional 1-based ordinal — with
  `text` = the reference prose.
- `.sem-references-backlinks`, `.sem-references-link` and the popover are
  chrome: skipped entirely. `.sem-references-ref` is a runtime class on an
  authored anchor and is ignored.
- Inline citations mint no record.
