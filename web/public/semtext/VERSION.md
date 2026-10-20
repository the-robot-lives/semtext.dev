# SemText runtime — synced bundles

- stable: 0.9.5
- latest: 0.9.5
- this unversioned directory mirrors stable 0.9.5
- last sync: 2026-10-20T18:06:48.000Z (epoch 1792519608), source ../../../../../npl-enhanced-content/.claude/worktrees/feat-sem-component-see-also/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
