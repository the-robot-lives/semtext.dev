# semtext.dev

SemText — consolidated product repo. The deployed site is the **Elixir
Phoenix + Hologram** app under `app/backend` (landing, `/showcase/*`,
`/reference`, `/demo`, `/spec`), served by the `app/helm/semtext` chart.
The SemText format/runtime source lives in the `npl-enhanced-content/`
subtree; built bundles are vendored into the ONE bundle tree,
`app/backend/priv/static/semtext/`. The legacy Next.js `web/` site was
retired 2026-11-11 (owner-approved): its sync tooling now lives in
`scripts/` and its reference source data in `data/`. `mods/semtext` is a
Claude Code mod. Sync bundles with `scripts/sync-bundles.mjs --from <dist>`
(writes the vendored tree and regenerates `data/bundles.json`).

## Branch policy

- Default branch: `develop`. Every PR targets `develop`.
- `main` is release-triggered: a merge into `main` triggers CI/CD (image build → `bump-chart` → ArgoCD sync). Promotions land via `stage` → `main` PRs per the monorepo merge matrix.
- All work happens on worktrees; never work directly on a shared checkout of `develop`.

## Deploy

GitHub Actions builds `sha-*` images, CI commits the helm tag bump in
`app/helm/semtext/values.yaml`, ArgoCD auto-syncs. See trl-infra
`docs/arch/deployment.md`.

Never hand-edit the image tag for a release. Never push `main`.
