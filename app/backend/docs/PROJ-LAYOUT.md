# Project Layout — semtext/backend

Phoenix 1.8 + Hologram app — OTP app **`:semtext`** (`Semtext` / `SemtextWeb`). Start-app platform scaffold (users, orgs, PBAC, media, SSO, workers, consent) hydrated for semtext.dev (2026-10-14) plus the product surfaces: proposals domain, GitHub sync, reference/docs/showcase/editor Hologram pages, agent-kit/annotate/driver proxy lanes. One Phoenix host serves both `semtext.dev` and `proposals.semtext.dev` (no separate frontend).

Plain tree: [`PROJ-LAYOUT.summary.md`](PROJ-LAYOUT.summary.md). Arch: [`PROJ-ARCH.md`](PROJ-ARCH.md).

```
backend/
├── lib/
│   ├── semtext.ex
│   ├── semtext/                        # domain core
│   │   ├── application.ex · repo.ex · entity_repo.ex · redis.ex · release.ex
│   │   ├── guardian.ex · mailer.ex · feature_flags.ex · storage.ex
│   │   ├── driver.ex · live_proxy.ex · observability.ex · fleet_push.ex
│   │   ├── events.ex · proposals.ex     # facades
│   │   ├── auth/                        # smart_token, SSO, token_store
│   │   ├── authz/                       # policy_evaluator, uuids
│   │   ├── driver/                      # spec test driver
│   │   ├── entities/                    # users, orgs, media, projects, authz, versioned, providers
│   │   ├── events/                      # webhook_handler
│   │   ├── github/                      # App auth, GraphQL client, ports/adapters, webhook body reader
│   │   ├── hologram/                    # Hologram runtime helpers (auth, etc.)
│   │   ├── live_proxy/                  # live-fetch proxy
│   │   ├── media/                       # transform pipeline
│   │   ├── observability/               # OTel plumbing
│   │   ├── proposals/                   # entities, queries, rate_limit
│   │   ├── protocols/
│   │   ├── reference/                   # reference-page data
│   │   ├── schema/                      # Ecto schemas (mirror entities) + cookie_consent
│   │   ├── style_guide/                 # design-system components
│   │   ├── test/                        # test support
│   │   └── workers/                     # cleanup, email, github discussion/webhook (Oban)
│   ├── semtext_web.ex
│   ├── semtext_web/
│   │   ├── endpoint.ex · router.ex · proposals_router.ex · telemetry.ex · gettext.ex
│   │   │                                # proposals_router = proposals.semtext.dev host (own session)
│   │   ├── controllers/                 # auth, sso, org, media, admin, consent, pbac, proposals,
│   │   │                                #   github_webhook, agent_kit_proxy, annotate_threads, driver,
│   │   │                                #   editor_example, media_serve, health, test_auth
│   │   ├── docs/                        # highlighter, nav_groups, search_index, showcase
│   │   ├── hologram/                    # pages (main + proposals/), components, layouts, middleware
│   │   ├── plugs/                       # host_dispatch, session, auth pipeline, RBAC, rate_limit, cors, otel
│   │   └── channels/                    # user_socket, org_channel
│   ├── mix/tasks/liquibase.update.ex    # `mix liquibase.update`
│   └── supports/                        # ecto, event, migration, jason encoder, types
├── config/                              # config/dev/test/prod/runtime.exs
├── themes/                              # theme CSS sources (style-guide, swiss, sumi-e, cyberpunk)
├── db/
│   ├── changelog/                       # 000–031 + db.changelog-master.yaml
│   ├── liquibase.properties
│   └── Dockerfile                       # Migration runner image
├── priv/
│   ├── data/                            # reference elements/bundles/search data (JSON)
│   ├── gettext/
│   ├── repo/
│   │   ├── migrations/                  # smart_token, Oban
│   │   └── seeds.exs · seeds/           # env seeds + auth_providers/
│   └── static/                          # css/, js/, data/, dataviz/, demo/, semtext/ (editor island)
├── test/
│   ├── semtext/ · semtext_web/          # auth + controller + lane tests
│   ├── parity/                          # SSR parity tests vs the pre-replatform Next.js routes
│   ├── otel_disabled_test.exs
│   └── support/                         # conn_case, data_case, leak_scan
├── vendor/uuid_shim/                    # vendored UUID compatibility shim
├── docs/                                # PROJ-LAYOUT* · PROJ-ARCH*
├── Dockerfile · Dockerfile.dev
├── mix.exs · mix.lock                   # app: :semtext
└── .tool-versions
```

## Key Files Requiring Setup

| File | Action |
|------|--------|
| `.env` | DB URL, Guardian secret, SSO (via root `make init`) |
| `.tool-versions` | `asdf install` / `mise install` |

## Mix Aliases

| Command | Purpose |
|---------|---------|
| `mix setup` | deps → ecto create/migrate → seeds |
| `mix ecto.reset` | Drop → create → migrate → seeds |
| `mix test` | Quiet DB create → `liquibase.update` → ecto.migrate → tests |
| `mix liquibase.update` | Apply canonical Liquibase changelog to Repo DB |

## Notable Dependencies

- **Phoenix 1.8** + **Bandit**
- **Guardian** + **bcrypt_elixir** · **smart_token** · **openid_connect** / **samly** / **ueberauth_github** (GitHub OAuth)
- **jose** (GitHub App JWT) · **req** (HTTP client)
- **noizu_labs_entities** · **GenAI** · **Syn** · **Redix** · **Hammer**
- **PostGIS / pgvector / geo** · **Oban** · **ex_aws** / **vix** (media)
- **:tobor_kit_hologram** (monorepo path dep — Lit → Hologram component mirror)
- **OpenTelemetry** stack · **logger_json**
