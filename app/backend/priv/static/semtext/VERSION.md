# SemText runtime — synced bundles

- stable: 0.7.2
- latest: 0.7.2
- this unversioned directory mirrors stable 0.7.2
- last sync: 2026-10-17T11:57:44.000Z (epoch 1792238264), source ../../../../../npl-enhanced-content/.claude/worktrees/runtime-072/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
