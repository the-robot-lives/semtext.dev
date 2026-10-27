# Architecture Summary — semtext/backend

Phoenix 1.8 + Hologram backend (Elixir 1.20 / OTP 29, OTP app `:semtext`) with Bandit HTTP server. One host serves the JSON API, the isomorphic Hologram UI, and the proposals virtual host. Hydrated from the `hologram-start-app` scaffold (2026-10-14).

**Auth:** Guardian JWT (Bearer) for API clients; session-cookie auth (host-only) for the Hologram UI; GitHub OAuth on the proposals host; smart tokens (magic link); OIDC/SAML SSO via Authentik; bcrypt password hashing; invite gating + admin-approval registration.

**Data:** PostgreSQL with UUID PKs, PostGIS, pgvector. Custom Postgrex types module. Liquibase owns the canonical schema (000–031); Ecto migrations cover smart_token + Oban only.

**Supervision tree:** Telemetry → Repo → Migrator → DNSCluster → PubSub → Endpoint (+ Oban workers: cleanup, email, GitHub discussion/webhook).

**Routing:** `SemtextWeb.Plugs.HostDispatch` splits hosts before any router. Main host (`SemtextWeb.Router`): `/health`, public + authenticated + org-role-pipelined `/api/v1/*` (consent, users, media, invites, orgs/projects/roles, groups/memberships/policies incl. `check`/`explain`, admin, agent-kit/annotate/driver proxies, editor examples), `/media/:short_id`, `/socket`, Hologram pages, dev LiveDashboard. Proposals host (`SemtextWeb.ProposalsRouter`, own session): browse/detail/dashboard/moderation SSR pages, `/auth/github`, `POST /api/v1/webhooks/github`.

**Contexts:** `Semtext.Users/Organizations/Projects/Media/Authz` (entities), `Semtext.Proposals`, `Semtext.Github`, `Semtext.Auth.*`, `Semtext.Media.Transform`, `Semtext.Events.WebhookHandler`.

**Deployment:** Multi-stage Docker (`elixir:1.20.1-otp-29-slim` → OTP release `rel/semtext`), runs as `nobody`, health check `/health`, chart `../helm/semtext` (ArgoCD + migrate Job). Requires `DATABASE_URL`, `SECRET_KEY_BASE`, `SESSION_SIGNING_SALT`, `PHX_HOST` (prod raises on missing signing secrets).
