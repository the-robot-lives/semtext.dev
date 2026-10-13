# semtext.dev

**Repo:** https://github.com/the-robot-lives/semtext.dev

Stub repo for the semtext.dev domain — reserved, no application yet.

Part of the [The Robot Lives](https://therobotlives.com) portfolio.

## What

Currently holds only project docs (`CLAUDE.md`, `AGENTS.md`) and this
README. No site, no build, no CI.

## Why

Reserves the semtext.dev domain within the portfolio so it can later host a
SemText-related product or landing page without a land grab. Infra (DNS,
TLS, eventual ArgoCD app) lives in `trl-infra`.

## Getting Started

Nothing to run. When an application lands, follow the portfolio
static-site or Hologram starter pattern (see sibling Brand repos, e.g.
`phpspec.org`) and add CI + a helm chart at that point.

## Consolidation (2026-10-13)

This repo now holds BOTH halves of semtext.dev:

- `landing/` — the Next.js landing (static export, `output: "export"`),
  from the `feat/landing-semtext-rewrite` revamp.
- `site/`, `demo/`, `spec/`, `src/`, `themes/`, `bin/`, `scripts/`, `test/`,
  root `package.json` — the SemText format code (format source, bundles,
  demos, standalone spec pages, validators, e2e suite), imported verbatim
  from **noizu-labs-ml/npl-enhanced-content @ 0d8a708** (main; content
  SHA fd4a166, PR #48 merge). Layout change on import: npl's `web/site`
  and `web/demo` are now root-level `site/` and `demo/`.

One image serves everything: landing at `/`, showcase under `/site/`,
`/demo/`, `/spec/` (root `Dockerfile` + `nginx.conf`). `helm/semtext` is
the production chart, imported unchanged from npl. CI builds
`ops.noizu.com/semtext.dev/web:sha-*` and commits the chart tag bump;
ArgoCD auto-syncs (never helm-upgrade for release). The npl-enhanced-content
repo remains the historical record; it is not deleted.
