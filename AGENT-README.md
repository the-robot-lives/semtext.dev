# AGENT-README

> Orientation for AI coding agents working in this repo. Human docs: README.md.

## Type

next.js+hologram

## Purpose

Home of the SemText format — spec, vocabulary, validators, bundles, showcase, and the proposal pipeline. Consolidated product repo: Next.js landing (`landing/`, static export), the SemText format code + showcase at the root, and the hydrated Hologram application under `app/` (Phoenix backend `:semtext` serving `semtext.dev` and `proposals.semtext.dev` via one image).

## Stack

TypeScript, Lit 3 web components over a zero-JS fallback tier (no React), Vite/Vitest/Cypress for the format code; Elixir/Phoenix + Hologram for the `app/` backend (compilers include `:hologram`).

## Dev mode

```bash
npm run build                      # build format bundles (scripts/build.mjs + build-standalone.mjs)
npm run serve                      # vite preview on 4173
node bin/semtext-view.mjs <file> --serve   # render a SemText document with the vendored bundle
cd landing && npm run dev          # Next.js landing
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
- `semtext-view --serve` mounts `/semtext/*` from `web/public/semtext/` — the vendored bundle is served, never rebuilt.
