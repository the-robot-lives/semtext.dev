# semtext — Claude Code mod

Claude Code mod that detects SemText (`sem-*`) documents open in Claude Code and
renders them specially. v0.3: what was inline annotation + a flat outline is now
a full interactive viewer. Registers the `/semtext` command (toggles the pane).

## Surfaces

- **Inline annotation** — `sem-*` blocks annotated in place; toast on detection
  (`SemText detected: N elements — <source>`).
- **Outline pane** (`semtext-outline`) — file-tree style outline with the mod's
  glyph vocabulary per kind (📌 note, ⚠ warning, 🧭 procedure, ▦ table, ⌨ code,
  ❓ facts, 🃏 flashcards, 💡 reveal, 🔑 property, 🗂 properties, 👁 views …),
  element counts, unknown-tag warnings, dimmed depth rows, `(+N)` overflow.
- **Section viewer** — box-drawn frames per `sem-*` kind: prose and code bodies,
  tables rendered as `rows × cols`, reveals/notes/views as tabbed fact sets.
- **Quiz + flashcard runners** — shuffled options, grading on first pick only
  (second presses and flashcards never grade), running score, progress meters.
- **Navigation** — focus a section from the outline, `back` returns to outline;
  breadcrumbs through nested sections.

Width adapts to the pane's `bodyColumns`, falling back to the viewport and then
a 72-column assumption with truncation. Color goes through theme keys plus
`dimColor` — no hardcoded ANSI.

## Layout

- `.claude-plugin/plugin.json` — plugin manifest (`semtext` 0.3.0, types entrypoint)
- `.claude-plugin/types/` — vendored Claude Code API type bundles (gitignored
  in the dev-mods source; force-added here so the mod is self-contained)
- `hooks/hooks.json` + `hooks/register.tsx` — module registration, SemText
  detection, the pane/command wiring
- `hooks/render.tsx` — pure viewer reducers and the per-kind render registry
  (incl. the `GLYPHS` table)
- `types/index.d.ts` — mod-facing type entrypoint
- `assets/screens/` — 12 design captures of every surface (outline, section
  viewer, quiz/flashcards, toast, status band/pubsub) — the visual contract
- `tests/semtext.test.tsx` — plugin tests

## Development

- Load locally: `claude --plugin-dir claude-mods/semtext`, or keep the folder
  under `~/.claude/dev-mods/` — hooks hot-reload in dev-mods sessions.
- Validate / test: `claude plugin validate claude-mods/semtext`,
  `claude plugin test claude-mods/semtext`.
- Type checking uses the repo-root `tsconfig.json` plus the vendored
  `.claude-plugin/types/` bundles — no npm install needed.

Marketplace packaging is planned (not yet published to a plugin marketplace).
