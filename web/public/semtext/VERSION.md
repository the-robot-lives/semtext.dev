# SemText runtime — synced bundles

- stable: 0.9.0
- latest: 0.9.0 + semtext.dev v0.6 assembly (see below)
- this unversioned directory mirrors stable 0.9.0
- last sync: 2026-10-18 (0.9.0 — SemText fallback tier removed upstream; the
  vanilla handlers ship inside the one semtext.js bundle as `src/vanilla/`,
  no standalone semtext-fallback.js), source
  ../../../../../npl-enhanced-content/.claude/worktrees/feat-annotate-r2-runtime/dist
- v0.6 assembly (2026-10-18, restored after merge displacement, rebased on
  0.9.0): `latest/semtext.css` =
  0.9.0 vocabulary base + `_default` + `_v06` + all five themes
  (minimal-tech-light, nocturne-console, organic-warm, editorial-settings,
  newsprint — consolidated); `latest/semtext.js` = vendored 0.9.0
  `semtext.js` verbatim + `runtime/semtext-v06.js` extension (global
  `SemTextV06`). Built by `scripts/build-latest.mjs`; re-run it after any
  sync-bundles refresh.

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
