# SemText runtime — synced bundles

- stable: 0.7.0
- latest: 0.7.0
- this unversioned directory mirrors stable 0.7.0
- last sync: 2026-10-16T18:06:20.000Z (epoch 1792173980), source ../../../../../npl-enhanced-content/.claude/worktrees/version-0-7/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
