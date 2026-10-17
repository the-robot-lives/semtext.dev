# SemText runtime — synced bundles

- stable: 0.7.1
- latest: 0.7.1
- this unversioned directory mirrors stable 0.7.1
- last sync: 2026-10-17T00:36:38.000Z (epoch 1792197398), source ../../../../../../../../../../../tmp/editor-src-071/dist

URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;
`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;
`/semtext/` (this directory) is the unversioned alias of stable.
Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.
