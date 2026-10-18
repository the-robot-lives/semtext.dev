# semtext — Claude Code mod

Claude Code mod that detects SemText (`sem-*`) documents open in Claude Code and
renders them specially: inline annotation, a live outline pane, and document
validation. Registers the `/semtext` command.

## Layout

- `.claude-plugin/plugin.json` — plugin manifest (name `semtext`, types entrypoint)
- `.claude-plugin/types/` — vendored Claude Code API type bundles (gitignored
  in the dev-mods source; force-added here so the mod is self-contained)
- `hooks/hooks.json` + `hooks/register.tsx` — hook module registration and the
  SemText detection / rendering logic
- `types/index.d.ts` — mod-facing type entrypoint
- `tests/semtext.test.tsx` — plugin tests (`claude plugin test`)

## Development

- Load locally: `claude --plugin-dir claude-mods/semtext` (or keep a copy under
  the `~/.claude/dev-mods` dev-mods folder and load it from there).
- Validate: `claude plugin validate claude-mods/semtext`
- Test: `claude plugin test claude-mods/semtext`
- Hooks hot-reload in dev-mods sessions; re-validate after edits.

Marketplace packaging is planned (not yet published to a plugin marketplace).
