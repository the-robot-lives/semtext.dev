# semtext — Claude Code mod

Claude Code mod that detects SemText (`sem-*`) documents in Claude Code and renders
them specially — inline annotation plus a full interactive viewer. `/semtext` toggles the pane.

## Surfaces

- **Inline annotation + toast** — `sem-*` blocks annotated in place; on
  detection, `SemText detected: N elements — <source>`.
- **Outline pane** (`semtext-outline`) — file-tree outline using the mod's
  glyph vocabulary per kind (📌 ⚠ 🧭 ▦ ⌨ ❓ 🃏 💡 🔑 🗂 👁 …, see `GLYPHS`
  in `hooks/render.tsx`), element counts, unknown-tag warnings, `(+N)` overflow.
- **Section viewer** — box-drawn frames per `sem-*` kind: prose/code bodies,
  tables as `rows × cols`, reveals/notes/views as tabbed fact sets; breadcrumbs.
- **Quiz + flashcard runners** — shuffled options, grading on first pick only
  (second presses and flashcards never grade), running score, progress meters.

Width adapts to `bodyColumns` (then the viewport, then 72 cols, truncated); color
uses theme keys + `dimColor` — no hardcoded ANSI.

## Layout

- `.claude-plugin/plugin.json` — manifest (`semtext` 0.3.0); `.claude-plugin/types/`
  — vendored Claude Code API bundles (force-added past the dev-mods gitignore so
  the mod is self-contained)
- `hooks/hooks.json` + `hooks/register.tsx` — registration, SemText detection,
  pane/command wiring; `hooks/render.tsx` — pure viewer reducers + per-kind
  render registry
- `types/index.d.ts` — mod-facing type entrypoint
- `assets/screens/` — 12 design captures of every surface (outline, viewer,
  quiz/flashcards, toast, status) — the visual contract
- `tests/semtext.test.tsx` — plugin tests

## Development

- Load: `claude --plugin-dir claude-mods/semtext`, or keep the folder under `~/.claude/dev-mods/` (hooks hot-reload there).
- `claude plugin validate claude-mods/semtext` · `claude plugin test claude-mods/semtext`.
- Types resolve via repo-root `tsconfig.json` + the vendored bundles — no npm install.

Marketplace packaging is planned (not yet published to a plugin marketplace).
