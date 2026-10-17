# DEPRECATED legacy chart

This chart (`helm/semtext`, the Next.js `web` image) no longer deploys. ArgoCD
tracks `app/helm/semtext` (the Hologram app), and its image tag is bumped by
`.github/workflows/app-ci.yml`. The bump step that used to edit this chart's
`values.yaml` was removed from `ci.yml` on 2026-10-17 because it raced the real
bump. Kept for history only; do not edit or deploy.
