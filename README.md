# semtext.dev

**Repo:** https://github.com/the-robot-lives/semtext.dev

Stub repo for the semtext.dev domain — reserved, no application yet.

Part of the [The Robot Lives](https://therobotlives.com) portfolio.

## What

The consolidated SemText product repo: the Next.js landing (`landing/`), the
format code + showcase (`site/`, `demo/`, `spec/`, `src/`, `themes/`), and the
hydrated Hologram application under `app/` (Phoenix backend `:semtext` serving
`semtext.dev` and `proposals.semtext.dev` via one image). CI builds
`sha-*` images; the chart lives at `app/helm/semtext`.

## Why

Home of the SemText format — spec, vocabulary, validators, bundles, showcase,
and the proposal pipeline that feeds new elements (GitHub Discussions sync,
moderation). Infra (DNS, TLS, ArgoCD app) lives in `trl-infra`.

## Getting Started

Landing/showcase: root `package.json` scripts + `node bin/semtext-view.mjs`
for rendering documents. Hologram app: `cd app && make init && make build &&
make run` (see `app/README.md`).

## Web Component Evaluation

A rubric-driven program that grades web components (tobor-kit, the styleguide
frontend) on eight weighted dimensions — API clarity, rendering + zero-JS
fallback, accessibility, docs, tests, convention fit, CSS-variable theming,
packaging — on a 100-point scale mapped to letter grades (A ≥ 90 … F < 50).

- **Rubric** (SemText document, `rubric_version` v1):
  `web/public/spec/web-component-evaluator.sem.html` — dimensions, criteria,
  review-fragment schema, and the manifest/review rendering example.
- **Eval prompts**: `manifest/tobor-kit.eval.md` and
  `manifest/styleguide-eval.md` — one per source repo; each grades one
  component per run and appends one YAML review fragment to the run file
  (default `components/review.yaml` in the evaluated repo).
- **Manifest**: each evaluated repo holds `components/manifest.yaml` — the
  read-only inventory of gradeable component tags. Graders never edit it.
- **Venues**: `evalnomi` (hosted eval lane), `subagent` (delegated reviewer),
  `script` (deterministic checks). **Branches**: `prod` (origin/main),
  `stage`, `dev` (develop), `oob` (experiments; findings never gate the
  listed slices).

Anything authored as `.sem.html` for this program must pass
`node bin/semtext-validate.mjs <file>` from the repo root.

### Viewing documents — `semtext-view`

`node bin/semtext-view.mjs <file.html | file.md>` renders a SemText document
with the vendored bundle so elements actually display:

- **Serve** (interactive): `node bin/semtext-view.mjs <file> --serve [--port N]`
  — mounts `/semtext/*` from `web/public/semtext/` (the vendored bundle is
  served, never rebuilt), the document plus its sibling assets from its own
  directory, and prints the full clickable `http://127.0.0.1:PORT/<file>` URL.
- **Stdout** (default): `node bin/semtext-view.mjs <file>` — prints the
  assembled HTML to stdout; pipe-friendly.
- **Markdown input**: wrapped in a minimal `<sem-md>` scaffold page (title
  from the filename) and served identically — e.g. view the eval prompts in
  `manifest/` without hand-writing a shell page.

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
`/demo/`, `/spec/` (root `Dockerfile` + `nginx.conf`). The Hologram app's chart is `app/helm/semtext` (the legacy root `helm/semtext`
Next.js chart was deleted 2026-10-17). `app-ci.yml` builds
`ops.noizu.com/semtext.dev/app:sha-*` and commits the chart tag bump;
ArgoCD auto-syncs (never helm-upgrade for release). The npl-enhanced-content
repo remains the historical record; it is not deleted.
