# SemText runtime — synced bundles

- stable: 0.8.3
- latest: 0.8.3 + semtext.dev v0.6 assembly (see below)
- this unversioned directory mirrors stable 0.8.3
- last sync: 2026-10-17T18:59:38.000Z (epoch 1792263578), source ../../../../../npl-enhanced-content/.claude/worktrees/feat-annotate-r2-runtime/dist
- v0.6 assembly (2026-10-18, restored after merge displacement): `latest/semtext.css` =
  0.8.3 vocabulary base + `_default` + `_v06` + all five themes
  (minimal-tech-light, nocturne-console, organic-warm, editorial-settings,
  newsprint — consolidated); `latest/semtext.js` = vendored 0.8.3
  `semtext.js` verbatim + `runtime/semtext-v06.js` extension (global
  `SemTextV06`). Built by `scripts/build-latest.mjs`; re-run it after any
  sync-bundles refresh.

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
