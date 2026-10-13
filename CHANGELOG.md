# Changelog

Dated work log — newest first, one line per landed change.

## 2026-10-13

- feat(web): cache-bust `?v=` on every SemText bundle URL — `web/scripts/gen-version.mjs` (wired as `prebuild`) hashes everything served under `public/semtext/` plus `public/dataviz/semtext-reading.js` and emits `lib/semtext-version.ts` (`SEMTEXT_VERSION`, 16 hex, deterministic, rotates on any artifact change); home/docs/dataviz script tags and the hero / try-views / example-viewer / sem-md lazy injections all load `…js?v=${SEMTEXT_VERSION}`, and the vendored `public/semtext/semtext-lazy.js` carries a documented local patch forwarding its own `?v=` on to every chunk it imports (see its `VERSION.md`). Verified: `npm run build` green, prerendered HTML and client chunks ship `?v=43d9…`/`.concat` on every bundle src, no bare bundle URLs in built output. Branch `feat/cache-bust` (local, based on `integration/landing-preview`).
