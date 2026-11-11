# Project Layout Summary — semtext/backend

```
backend/
├── lib/
│   ├── semtext.ex
│   ├── semtext/                    # auth, authz, driver, entities, events, github, hologram,
│   │                               #   live_proxy, media, observability, proposals, protocols,
│   │                               #   reference, schema, style_guide, workers
│   ├── semtext_web/                # router + proposals_router, controllers, docs, hologram, plugs, channels
│   ├── mix/tasks/liquibase.update.ex
│   └── supports/
├── config/
├── themes/                         # theme CSS sources
├── db/changelog/                   # Liquibase 000–031
├── priv/                           # data/ (reference JSON), repo/ (migrations, seeds), static/, gettext/
├── test/                           # semtext · semtext_web · parity · support
├── vendor/uuid_shim/
├── docs/
├── Dockerfile · Dockerfile.dev
└── mix.exs                         # :semtext
```

See [PROJ-LAYOUT.md](PROJ-LAYOUT.md).
