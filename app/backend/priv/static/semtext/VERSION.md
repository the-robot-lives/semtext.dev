# SemText runtime — synced bundles

- stable: 0.8.2
- latest: 0.8.2
- this unversioned directory mirrors stable 0.8.2
- last sync: 2026-10-18T00:00:00.000Z (editor instrument release), source ../../../../../../npl-enhanced-content/.claude/worktrees/editor-instrument/dist (stamp `dist/v0.8.2/`, 25 artifact groups)
- 0.8.2 carries the Instrument editor shell (semantic outline, docked inspector,
  status bar, labelled "Add block" pills) — the /editor page pins
  /semtext/v0.8.2/; v0.7.2 stays published for the immutable-snapshot rule.
- semtext-fallback.js is retired upstream; each snapshot carries the frozen
  legacy copy carried forward from v0.7.2.

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `web/scripts/sync-bundles.mjs` and `nginx.conf`.
