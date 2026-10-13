# semtext.dev

SemText — consolidated product repo. One nginx image: Next.js landing
(`landing/`, `output: 'export'`) at `/` and the SemText showcase
(`site/`, `demo/`, `spec/` built from the format code at the root) under
`/site/`, `/demo/`, `/spec/`. No backend.

## Branch policy

- Default branch: `develop`. Every PR targets `develop`.
- `main` is CI/CD-only: automation performs all merges into `main`. Never merge to or push `main` by hand.
- All work happens on worktrees; never work directly on a shared checkout of `develop`.

## Deploy

GitHub Actions builds `sha-*` images, CI commits the helm tag bump in
`helm/semtext/values.yaml`, ArgoCD auto-syncs. See trl-infra
`docs/arch/deployment.md`.

Never hand-edit the image tag for a release. Never push `main`.
