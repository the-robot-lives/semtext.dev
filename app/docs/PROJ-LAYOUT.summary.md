# Project Layout Summary — semtext app

```
app/
├── backend/                        # Phoenix 1.8 + Hologram app (:semtext) — see backend/docs/PROJ-LAYOUT.md
│   ├── lib/                        #   Semtext + SemtextWeb (contexts, entities, schema, auth, authz, hologram, proposals, github)
│   ├── config/                     #   Mix config (dev/test/prod/runtime)
│   ├── themes/                     #   Live theme YAML (runtime-discovered)
│   ├── db/                         #   Liquibase changelogs 000–031 + migration runner image
│   ├── priv/                       #   gettext, Ecto migrations, data/ (reference JSON), static assets
│   ├── test/                       #   ExUnit suites + parity tests + support cases
│   ├── docs/                       #   Backend layout/arch docs
│   ├── vendor/uuid_shim/           #   Vendored UUID shim
│   ├── Dockerfile · Dockerfile.dev
│   └── mix.exs
├── assets/                         # Design-system source
│   ├── theme-style-guide/          #   Canonical theme YAML
│   ├── site-css/                   #   Site-specific CSS
│   └── scripts/generate-css.ts     #   CSS generator (make regen)
├── design/                         # Design artifacts (themes/starter seed)
├── nginx/                          # Reverse proxy (nginx.conf, Dockerfile)
├── helm/semtext/                   # Helm chart (templates + values.yaml + live-dev lane)
├── sandbox/                        # Sandbox container config (supervisord, smb.conf, entrypoint)
├── scripts/                        # gen-env.sh, reference/search-tag generators, parity harness
├── e2e/                            # Cypress suite (home/docs/editor/proposals)
├── p1-ui/                          # Placeholder (empty)
├── docs/                           # PROJ-LAYOUT*, PROJ-ARCH*, PROJ-SCHEMA* + schema/, THREAT-MODEL*, SCAFFOLDING.md, feature notes
├── merge-notes.md                  # start-app → hologram-start-app port notes
├── CLAUDE.md · AGENTS.md · AGENT.md # Agent instructions (worktree + PR policy)
├── OBSERVABILITY.md                # OTel runbook
├── .env.example                    # Env template
├── .tool-versions                  # asdf/mise runtime versions
├── .dockerignore · .gitignore
├── .base-hydration.yaml            # Scaffold hydration manifest
├── docker-compose.yaml             # Base services (nginx, backend)
├── docker-compose.override.yaml    # Port overlay (8080)
├── docker-compose.dev.yaml         # Dev overrides (hot reload)
├── docker-compose.sandbox.yaml     # Sandbox overrides
├── docker-compose.ci.yml           # CI overrides
├── Dockerfile.sandbox              # Sandbox build
├── Makefile                        # Build + lifecycle
└── README.md                       # Start here
```
