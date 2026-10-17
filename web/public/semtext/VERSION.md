# SemText runtime — synced bundles

- stable: 0.8.3
- latest: 0.8.3
- this unversioned directory mirrors stable 0.8.3
- last sync: 2026-10-17T18:59:38.000Z (epoch 1792263578), source ../../../../../npl-enhanced-content/.claude/worktrees/feat-annotate-r2-runtime/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
