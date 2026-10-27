# Architecture Summary — semtext app

Two-container Docker stack: Phoenix 1.8 + Hologram backend (single `:semtext` app — `Semtext` / `SemtextWeb` — serving `~HOLO` pages, the `/api/v1/*` JSON API, and the proposals host) and nginx reverse proxy; Postgres/Redis on a shared external Docker network (host port 8080 via compose override). Product app of the semtext.dev repo, hydrated from the `hologram-start-app` scaffold (2026-10-14). Deployable via Docker Compose (local) or `helm/semtext` (Kubernetes/ArgoCD).

## Components

- **nginx** — reverse proxy: `/socket` and `/` → backend, `/otel/` → OTLP collector
- **backend** — Phoenix 1.8 JSON API + Hologram pages/commands; Guardian JWT (API), Hologram session (UI)
- **Hologram UI (main host)** — home, docs, reference (index/per-element/all-tags), editor island, showcase suite, style guide, admin/org dashboards
- **Proposals host** — `proposals.semtext.dev`, own router/session (`ProposalsRouter`), GitHub OAuth login, browse/dashboard/moderation pages
- **Proposals domain + GitHub sync** — `Semtext.Proposals` context; `Semtext.Github` (App JWT, GraphQL v4, inbound webhook receiver, Oban workers)
- **PBAC engine** — groups + scoped memberships + JSONB policies, evaluated in-database (PL/pgSQL); `/policies/check|explain` API
- **Workers/events** — Oban (cleanup, email, github discussion/webhook) + outbound webhooks
- **Media pipeline** — upload/transform, variants cache, short-id + visibility
- **Proxy lanes** — agent-kit, annotate threads, driver, live-fetch proxy
- **Style-guide CSS** — YAML themes → generated CSS; app owns the Hologram design-system components
- **helm/semtext/** — K8s chart: deployment, migrate-job, ingress (semtext.dev + www + proposals), HPA/PDB, live-dev lane

## Request Routing

nginx forwards `/socket` (WebSocket) and `/` to the backend on :4000. `SemtextWeb.Plugs.HostDispatch` splits by Host **before** the routers: main host → `SemtextWeb.Router` (`/api/v1/*`, `/health`, `/auth/*`, `/sso/*`, `/media/:short_id`), static (`/themes/*`, `/twp/*`), `Hologram.Router` (pages); proposals host → `ProposalsRouter` (SSR pages, `/auth/github`, `POST /api/v1/webhooks/github`). Cookies are host-only — the hosts never share sessions. Plugs: auth pipelines, CORS, Hammer rate limiting, OTel metadata.

## Auth & SSO

JWT (Guardian) for API clients; the Hologram UI keeps tokens in the Phoenix session. Email/password, magic-link/smart tokens, and SSO via OIDC (Authentik default). `SSO_DOMAINS` maps email domains to providers; `SSO_AUTO_APPROVE_DOMAINS` bypasses manual approval. New registrations can require admin approval (`pending` status). Proposals host uses GitHub OAuth with moderator gating (`users.role == "moderator"`).

## Schema Management

Dual-track: Liquibase YAML changelogs (000–031) are canonical — auth/users/orgs/PBAC/media/webhooks/projects/consent/proposals+GitHub — applied via `make migrate`/`mix liquibase.update`; Ecto migrations cover smart_token and Oban tables. PBAC permission checks run in Postgres stored procedures (deny-overrides-allow, wildcard/template matching).

## Design System

`assets/theme-style-guide/` canonical YAML + `backend/themes/theme-*/` runtime themes → `@noizu/styleguide` → generated CSS in `backend/priv/static/themes/`. Hologram components map 1:1 to styleguide React primitives using semantic classes. Interactive viewer at `/styleguide` and `/styleguide/tailwind-plus`. Path dep `:tobor_kit_hologram` (Lit → Hologram component-kit mirror) with a browser smoke page at `/tk-smoke`.

## Deployment

Local: `make init` → `make build` → `make run`; dev mode `make run-dev` (`mix holo` sets `HOLOGRAM_START=1` — pages 404 without it). Kubernetes: `helm/semtext` via ArgoCD auto-sync with pre-deploy migrate Job, Infisical-sourced secrets/TLS (`semtext-dev-tls`; live-dev lane `dev.semtext.dev` + `semtext-live-dev-tls`), HPA/PDB. Releases are git-driven: merge to product `main` → CI builds `sha-*` images → `bump-chart` → Argo syncs.

## Technology Stack

UI: Hologram ~> 0.10 | API: Phoenix 1.8, Bandit | DB: PostgreSQL (PostGIS, pgvector) + Liquibase | Cache: Redis | Jobs: Oban | Auth: Guardian JWT + smart_token + OIDC/SAML SSO + GitHub OAuth | Design: @noizu/styleguide | Observability: OpenTelemetry + logger_json | Proxy: Nginx | Orchestration: Docker Compose + Helm (ArgoCD) | Registry: ops.noizu.com | Secrets: Infisical | Build: Make + shell

## Key Decisions

- Two-container split — UI is Elixir in the same OTP app; no separate frontend
- One backend, two hosts — `HostDispatch` before routing; host-only cookies keep main-site and proposals sessions disjoint
- External shared network — projects share infra, isolated by DB/Redis credentials
- In-database PBAC — policy evaluation in PL/pgSQL for consistent enforcement across API and UI
- Dual-track schema — Liquibase canonical (000–031), Ecto app-level (smart_token, Oban)
- Runtime config injection — one image, all environments (env files / Helm ConfigMap+Secrets)
- Pluggable SSO — env-var-driven provider + approval policy
- HOLOGRAM_START gate — dev router disables pages unless explicitly enabled (test suite unaffected via `Hologram.Test.setup()`)
