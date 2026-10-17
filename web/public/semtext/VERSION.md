# SemText runtime — synced bundles

- stable: 0.7.2
- latest: 0.7.2 + semtext.dev v0.6 assembly (see below)
- this unversioned directory mirrors stable 0.7.2
- last sync: 2026-10-17T11:57:44.000Z (epoch 1792238264), source ../../../../../npl-enhanced-content/.claude/worktrees/runtime-072/dist
- v0.6 assembly (2026-10-18): `latest/semtext.css` = vocabulary base +
  `_default` + `_v06` + all five themes (consolidated);
  `latest/semtext.js` = vendored 0.7.2 `semtext.js` verbatim +
  `runtime/semtext-v06.js` extension (global `SemTextV06`). Built by
  `scripts/build-latest.mjs`; re-run it after any sync-bundles refresh.

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
