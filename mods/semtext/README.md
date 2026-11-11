# semtext mod (Claude Code)

A Claude Code plugin that detects SemText (`sem-*`), NPL pump tags (`npl-*`)
and Trinity friction markers (`WEDGE`/`SHADOW`/`CRITIC`/`WEEGO`) in tool
output and assistant answers, then renders them in a dedicated viewer pane:
glyphed file-tree outline, box-drawn frames per kind, breadcrumbs, and a
quiz/flashcard runner.

## Layout

- `hooks/render.tsx` — pure layer: glyph vocabulary, drawing helpers, viewer
  reducers, the per-kind render registry (`RENDERERS`), and the expanded
  view's content plan (`expandedPlan`/`expandedRoleOf`).
- `hooks/register.tsx` — the parser (`parseSemText`), ingestion hooks, and the
  pane renderer (expanded / compact outline / section focus / quiz modes).
- `tests/semtext.test.tsx` — the test suite.
- `docs/` — author-facing references written as SemText documents:
  - `render-reference.html` — full vocabulary audit: per-tag parse/render
    table, view modes, truncation caps, defect ledger (fixed vs open).
  - `tui-design.html` — the intended TUI presentation per component class,
    with rationale (states, glyphs, dim/bold rules, nesting).
  - `tui-screens.html` — expected pane screens as ASCII mockups, marked
    current vs target.

## Commands

```bash
claude plugin test mods/semtext      # test suite (run from repo root)
claude plugin validate mods/semtext  # plugin manifest check
node bin/semtext-validate.mjs mods/semtext/docs/*.html   # docs vocabulary check
```

The docs are ordinary SemText documents: they render in the pane itself and
pass the repo validator. Any change that makes real pane output diverge from
a `current` screen in tui-screens.html must update the screen in the same PR.

## Vocabulary notes

- The parser lowercases tag names; markdown-escaped Trinity markers
  (`\<WEDGE\>`) are detected and parsed like bare ones.
- The NPL family gets implied end tags (a friction marker opening closes the
  still-open marker), because model output emits them unclosed. Everything
  else keeps strict nesting (nested `sem-section` is legal).
- Card renderers consume their children (the content feeds them), except the
  NPL block renderer, whose children re-plan below the card.
- Unknown `sem-*` names still parse and render (generic flow) — they only
  earn a warning row in the pane header.
