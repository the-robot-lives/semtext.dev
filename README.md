# semtext.dev

Semantic text processing for developers — parse, embed, and query
meaning-aware text. A static landing page for **semtext**.

Part of [The Robot Lives](https://therobotlives.com) portfolio.

## Stack

- Next.js 15 App Router, `output: 'export'` (no backend)
- nginx Alpine image (`ops.noizu.com/semtext.dev/web:sha-*`)
- Helm chart `helm/semtext` wrapping the vendored `static-site` subchart

## Local

```bash
cd web
npm ci
npm run dev    # http://localhost:3000
npm run build  # writes web/out
```

## Deploy

PRs target `develop`. `main` is CI/CD-only.

GitHub Actions (`.github/workflows/ci.yml`) on `main`:

1. `next build` static export
2. Push `sha-<7>` image to `ops.noizu.com`
3. Bot commits the helm tag bump (`[skip ci]`)
4. ArgoCD auto-syncs (wired in `trl-infra`)
