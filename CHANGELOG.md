# CHANGELOG

## 2026-10-13
- Consolidated the SemText format code from noizu-labs-ml/npl-enhanced-content @ 0d8a708 (main, content fd4a166): spec/, src/, site/ (ex web/site), demo/ (ex web/demo), themes/, bin/, scripts/, test/, root package.json, helm/semtext — the flat production chart, byte-identical render to what prod runs (#3).
- Landing revamp moved from web/ to landing/ (feat/landing-semtext-rewrite @ 91df7bc, Next.js static export preserved). One image via root Dockerfile: landing at /, showcase under /site/, /demo/, /spec/; nginx.conf adds /_next/static/ immutable caching (#3).
- CI merged: landing typecheck+build lane + showcase unit/sharded-e2e lanes; main build-push sha-* + chart bump; publish-cdn carried over dormant (CDN_PUBLISH unset here, MinIO secrets absent) (#3).
- develop→stage promotion resolved the develop/stage divergence: stage's landing-era web/ copy and vendored static-site subchart superseded by develop's consolidated content; AGENTS/CLAUDE.md keep the live branch policy, refreshed for the new layout (#5).
- Released stage→main (#6): CI published ops.noizu.com/semtext.dev/web:sha-f8f4eb8 and committed the chart bump (ec1d87d). ArgoCD still tracks npl-enhanced-content — cutover pending an operator-created repo credential for this private repo.
