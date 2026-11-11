# AGENT-README

> Orientation for AI coding agents working in this repo. Human docs: README.md.

## Type

hologram+lit

## Purpose

Home of the SemText format — spec, vocabulary, validators, bundles, showcase, and the proposal pipeline. Consolidated product repo: the SemText format code + showcase at the root (`src/`, `site/`, `demo/`, `spec/`, `themes/`, reference source data in `data/`), and the hydrated Hologram application under `app/` (Phoenix backend `:semtext` serving `semtext.dev` and `proposals.semtext.dev`). The deployed site is the Hologram app; the legacy Next.js `web/` site was retired 2026-11-11.

## Stack

TypeScript, Lit 3 web components over a zero-JS fallback tier (no React), Vite/Vitest/Cypress for the format code; Elixir/Phoenix + Hologram for the `app/` backend (compilers include `:hologram`).

## Dev mode

```bash
npm run build                      # build format bundles (scripts/build.mjs + build-standalone.mjs)
npm run serve                      # vite preview on 4173
node bin/semtext-view.mjs <file> --serve   # render a SemText document with the vendored bundle
cd app && make init && make build && make run   # Hologram app (docker: nginx + Phoenix)
```

## Ports / URLs

- `http://127.0.0.1:4173` — vite preview (`npm run serve`, `--port 4173 --strictPort` per package.json)
- `:5585` — Hologram app backend dev (app/backend/config/dev.exs, `PORT` env)
- `:8080` — app nginx (`cd app && make run`, per app/README.md)

## Tests

```bash
npm test              # cypress e2e
npm run test:unit     # vitest
npm run validate      # node bin/semtext-validate.mjs over site/, demo/, spec/
```

## Gotchas

- Branch policy: default branch `develop`, every PR targets `develop`; `main` is release-triggered (CI/CD) — never push `main`.
- Anything authored as `.sem.html` must pass `node bin/semtext-validate.mjs <file>` from the repo root.
- `specVersion` in package.json is the format draft — bump it WITH the spec, not with releases (`version` is the package).
- `semtext-view --serve` mounts `/semtext/*` from `app/backend/priv/static/semtext/` — the vendored bundle is served, never rebuilt.
- Bundle sync: `node scripts/sync-bundles.mjs --from <npl-dist>` writes the one vendored tree (`app/backend/priv/static/semtext/`) and regenerates `data/bundles.json`; then `node scripts/build-latest.mjs` re-assembles the v0.6 `latest/` layer. Reference data refresh: `docs/reference-refresh.md`.
