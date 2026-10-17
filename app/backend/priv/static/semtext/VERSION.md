# SemText runtime — synced bundles

- stable: 0.9.1
- latest: 0.9.1
- this unversioned directory mirrors stable 0.9.1
- last sync: 2026-10-17T23:41:11.000Z (epoch 1792280471), source ../../../../../npl-enhanced-content/.claude/worktrees/semext-091-fixes/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
