# semtext.dev

SemText — consolidated product repo. The deployed site is the **Elixir
Phoenix + Hologram** app under `app/backend` (landing, `/showcase/*`,
`/reference`, `/demo`, `/spec`), served by the `app/helm/semtext` chart.
The SemText format/runtime source lives in the `npl-enhanced-content/`
subtree; built bundles are vendored into `app/backend/priv/static/semtext/`
(the live tree) and `web/public/semtext/` (legacy). `web/` is the old
Next.js site (`landing/` + `site/`), kept for now but not the deployed
stack — retirement is an open owner decision. `mods/semtext` is a Claude
Code mod. Sync bundles with `web/scripts/sync-bundles.mjs --from <dist>`
(writes both vendored trees and asserts parity).

## Branch policy

- Default branch: `develop`. Every PR targets `develop`.
- `main` is release-triggered: a merge into `main` triggers CI/CD (image build → `bump-chart` → ArgoCD sync). Promotions land via `stage` → `main` PRs per the monorepo merge matrix.
- All work happens on worktrees; never work directly on a shared checkout of `develop`.

## Deploy

GitHub Actions builds `sha-*` images, CI commits the helm tag bump in
`app/helm/semtext/values.yaml`, ArgoCD auto-syncs. See trl-infra
`docs/arch/deployment.md`.

Never hand-edit the image tag for a release. Never push `main`.
