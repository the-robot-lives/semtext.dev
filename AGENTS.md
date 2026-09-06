# semtext.dev

Stub repo — no application yet.

## Branch policy
- Default branch: `develop`. Every PR targets `develop`.
- `main` is CI/CD-only: automation performs all merges into `main`. Never merge to or push `main` by hand.
- All work happens on worktrees; never work directly on a shared checkout of `develop`.

## Deploy
Not wired up yet. When this becomes an app: GitHub Actions builds `sha-*` images, CI commits the helm tag bump, ArgoCD auto-syncs. See trl-infra `docs/arch/deployment.md`.
