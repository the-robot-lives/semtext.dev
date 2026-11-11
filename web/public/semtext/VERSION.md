# SemText runtime — synced bundles

- stable: 0.9.6
- latest: 0.9.6
- this unversioned directory mirrors stable 0.9.6
- last sync: 2026-11-11T03:44:02.000Z (epoch 1794368642), source ../../../../../npl-enhanced-content/.claude/worktrees/vendor-096/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
