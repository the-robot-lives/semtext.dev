# semtext.dev

SemText product repo. The deployed site is the Elixir Phoenix + Hologram
app under `app/backend` (chart `app/helm/semtext`). The legacy Next.js
`web/` site was retired 2026-11-11; the SemText format code + showcase
live at the root (`src/`, `site/`, `demo/`, `spec/`, `themes/`).

## Branch policy

- Default branch: `develop`. Every PR targets `develop`.
- `main` is release-triggered: a merge into `main` triggers CI/CD (image build → `bump-chart` → ArgoCD sync). Promotions land via `stage` → `main` PRs per the monorepo merge matrix.
- All work happens on worktrees; never work directly on a shared checkout of `develop`.

## Deploy

GitHub Actions builds `sha-*` images, CI commits the helm tag bump in
`app/helm/semtext/values.yaml`, ArgoCD auto-syncs. See trl-infra
`docs/arch/deployment.md`.

Never hand-edit the image tag for a release. Never push `main`.
