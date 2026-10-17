# SemText runtime — synced bundles

- stable: 0.9.0
- latest: 0.9.0
- this unversioned directory mirrors stable 0.9.0
- last sync: 2026-10-17T22:29:36.000Z (epoch 1792276176), source ../../../../../npl-enhanced-content/.claude/worktrees/absorb-src/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
