# SemText runtime — synced bundles

- stable: 0.8.3
- latest: 0.8.3
- this unversioned directory mirrors stable 0.8.3
- last sync: 2026-10-18T00:00:00.000Z (0.8.3 refresh — exprRegex escaping contract), source ../../../../../../npl-enhanced-content/.claude/worktrees/editor-instrument/dist (stamp `dist/v0.8.3/`, 25 artifact groups)
- 0.8.2 carried the Instrument editor shell (semantic outline, docked inspector,
  status bar, labelled "Add block" pills); 0.8.3 = 0.8.2 + the terminal
  exprRegex backslash contract fix (CodeQL js/incomplete-sanitization,
  npl-enhanced-content#50). The /editor page pins /semtext/v0.8.3/;
  v0.8.2/v0.7.2 stay published for the immutable-snapshot rule.
- semtext-fallback.js is retired upstream; each snapshot carries the frozen
  legacy copy carried forward from v0.7.2.

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `web/scripts/sync-bundles.mjs` and `nginx.conf`.
