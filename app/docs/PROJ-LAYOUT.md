# Project Layout — semtext app

<!-- 〚📁:4efc0d7a-b182-5c64-862f-382f9f19568b〛 PROJ-LAYOUT :: Navigable map of the app/ subtree — backend, assets, nginx, helm, docs, compose. -->

Hydrated product app of the [semtext.dev](https://github.com/the-robot-lives/semtext.dev) repo (scaffold origin: `hologram-start-app`, hydrated 2026-10-14). Two-container Docker stack: **Phoenix 1.8 + Hologram backend** (single OTP app `:semtext` — `Semtext` / `SemtextWeb` — serving `~HOLO` pages, the `/api/v1/*` JSON API, and the proposals subdomain) and **nginx reverse proxy**, orchestrated by Make + docker-compose, against shared Postgres/Redis on a shared Docker network. No separate frontend; UI is Elixir (Hologram ~> 0.10).

One backend serves two hosts via `SemtextWeb.Plugs.HostDispatch` (host-only cookies): `semtext.dev` (showcase, docs, reference, editor, styleguide) and `proposals.semtext.dev` (proposal pipeline + moderation, own router/session).

Design system: **@noizu/styleguide** YAML themes → CSS. This app owns the design-system Hologram components and the interactive style-guide viewer (`/styleguide`).

```
app/
├── backend/                        # Phoenix + Hologram app (:semtext) → [backend/docs/PROJ-LAYOUT.md](../backend/docs/PROJ-LAYOUT.md)
│   ├── lib/                        #   Semtext + SemtextWeb (contexts, entities, schema, auth, authz, hologram pages/components, proposals, github)
│   ├── config/                     #   Mix config per environment (+ runtime.exs)
│   ├── themes/                     #   Live theme YAML (theme-style-guide, theme-swiss, theme-sumi-e, theme-cyberpunk) — discovered at runtime
│   ├── db/                         #   Liquibase schema management → [PROJ-SCHEMA.md](PROJ-SCHEMA.md)
│   │   ├── changelog/              #     Versioned YAML changesets (000–031) + db.changelog-master.yaml
│   │   ├── liquibase.properties    #     Liquibase connection config
│   │   └── Dockerfile              #     Liquibase migration runner image
│   ├── priv/                       #   gettext, Ecto migrations (smart_token, Oban), data/ (reference + bundles JSON), static/ (theme CSS, tobor-kit CSS, semtext editor island)
│   ├── test/                       #   ExUnit suites (auth, controllers, parity) + support cases
│   ├── docs/                       #   Backend PROJ-LAYOUT* / PROJ-ARCH*
│   ├── vendor/uuid_shim/           #   Vendored UUID compatibility shim
│   ├── Dockerfile · Dockerfile.dev #   Production / hot-reload dev builds
│   └── mix.exs                     #   Deps + aliases (`mix liquibase.update`, `mix test`)
├── assets/                         # Design-system source of truth
│   ├── theme-style-guide/          #   Canonical theme YAML (vars, palettes, typography, glyphs, snippets, …)
│   ├── site-css/                   #   Site-specific CSS
│   └── scripts/generate-css.ts     #   CSS generator (Node side of @noizu/styleguide; `make regen`)
├── design/                         # Design artifacts → [design/README.md](../design/README.md)
│   └── themes/starter/             #   Starter theme seed (branding, meta, vars)
├── nginx/                          # Reverse proxy
│   ├── nginx.conf                  #   Routes: /socket → backend (WS), /otel/ → collector, / → backend (Hologram pages + API)
│   └── Dockerfile                  #   Nginx container build
├── helm/semtext/                   # Helm chart (deployment, service, ingress for semtext.dev + proposals.semtext.dev, migrate-job, HPA, PDB, configmap, secrets, TLS; values-live-dev.yaml live-dev lane)
│   ├── Chart.yaml · values.yaml    #   Chart metadata + defaults
│   └── templates/                  #   K8s manifests
├── sandbox/                        # Sandbox container config (supervisord, smb.conf, entrypoint)
├── scripts/
│   ├── gen-env.sh                  #   Generates .env files with secrets for all services (`make init`)
│   ├── gen-reference.mjs · gen-search-tags.mjs  # Reference/search-tag data generators
│   └── parity/                     # Hologram-replatform parity harness (routes manifest, snap/diff)
├── e2e/                            # Cypress suite (home/docs/editor/proposals BDD, parity-ported)
├── p1-ui/                          # Placeholder (proposals UI design lane, currently empty)
├── docs/                           # Root documentation
│   ├── PROJ-LAYOUT.md              #   This file
│   ├── PROJ-LAYOUT.summary.md      #   Tree-only quick reference
│   ├── PROJ-ARCH.md                #   Architecture documentation
│   ├── PROJ-ARCH.summary.md        #   Architecture quick reference
│   ├── PROJ-SCHEMA.md              #   Persistence + config artifact documentation
│   ├── schema/                     #   Per-domain schema breakdowns
│   ├── THREAT-MODEL.md             #   Security threat model
│   ├── SCAFFOLDING.md              #   How the template hydrates into a new project (historical)
│   ├── COOKIE-CONSENT.md           #   Consent feature notes
│   ├── cypress-attributes.md       #   data-* test hooks reference
│   └── frontend-reference/         #   Porting notes from the React start-app (auth, design-system)
├── merge-notes.md                  # Notes from the start-app → hologram-start-app port
├── CLAUDE.md · AGENTS.md · AGENT.md # Agent instructions (worktree + PR policy)
├── OBSERVABILITY.md                # OTel/observability runbook
├── .env.example                    # Environment template — copy and configure (`make init` automates)
├── .tool-versions                  # asdf/mise versions (Elixir, Erlang, Java for Liquibase)
├── .dockerignore · .gitignore      # Build/git hygiene
├── .base-hydration.yaml            # Scaffold hydration manifest (scaffold-time variable mapping)
├── docker-compose.yaml             # Base service definitions (nginx, backend)
├── docker-compose.override.yaml    # Port overlay — unique host port (8080) for this project
├── docker-compose.dev.yaml         # Dev overrides (hot reload, volume mounts)
├── docker-compose.sandbox.yaml     # Sandbox lane overrides
├── docker-compose.ci.yml           # CI overrides
├── Dockerfile.sandbox              # Sandbox container build
├── Makefile                        # Build + lifecycle commands
└── README.md                       # Start here (stack, pages, quick start)
```

## Key Files Requiring Setup

| File | Action |
|------|--------|
| `.env` | Run `make init` to generate from `.env.example` with real secrets |
| `.tool-versions` | Run `mise install` or `asdf install` (Elixir, Erlang, Java for Liquibase) |
| `backend/themes/*` | Duplicate a theme dir to add a theme (auto-discovered at runtime) |

## Make Targets

| Command | Purpose |
|---------|---------|
| `make init` | Generate `.env` + `backend/.env` with secrets |
| `make build` | Build Docker images (backend, nginx) |
| `make run` | Start all containers via docker-compose |
| `make run-dev` / `run-dev-d` | Dev mode (hot reload; `mix holo` sets `HOLOGRAM_START=1`) |
| `make regen` | Regenerate design-system CSS from theme YAML |
| `make migrate` | Apply Liquibase changelog (docker sidecar or host CLI) |
| `make clean` | Remove containers, volumes, and local images |

## Network Architecture

Backend and nginx join a shared external Docker network where shared Postgres and Redis run (compose override maps host port 8080 → nginx :80). Nginx listens on `$PORT` (default 8080): `/socket` (WebSocket upgrade) and `/` (Hologram pages + `/api/v1/*` JSON) proxy to the single Phoenix backend on :4000; `/otel/` proxies to the OTLP collector. Deployment parity exists via the `helm/semtext` chart (ArgoCD-managed) with a live-dev lane (`values-live-dev.yaml`, `dev.semtext.dev`). Production ingress terminates TLS (`semtext-dev-tls`) for `semtext.dev`, `www.semtext.dev`, and `proposals.semtext.dev`.
