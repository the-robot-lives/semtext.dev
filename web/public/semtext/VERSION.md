# SemText runtime — synced bundles

- stable: 0.1.0
- latest: 0.1.0
- this unversioned directory mirrors stable 0.1.0
- last sync: 2026-10-16T17:21:04.000Z (epoch 1792171264), source ../../../../../npl-enhanced-content/.claude/worktrees/asset-versioning/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
