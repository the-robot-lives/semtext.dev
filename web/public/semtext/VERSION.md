# SemText runtime — synced bundles

- stable: 0.9.4
- latest: 0.9.4
- this unversioned directory mirrors stable 0.9.4
- last sync: 2026-10-18T16:33:47.000Z (epoch 1792341227), source ../../../../../npl-enhanced-content/.claude/worktrees/vendor-094/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
