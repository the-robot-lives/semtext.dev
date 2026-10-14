import Config

config :seed_helper,
  repo: Semtext.Repo

config :smart_token,
  repo: Semtext.Repo

config :semtext, Semtext.Repo,
  types: Semtext.PostgrexTypes,
  migration_primary_key: [name: :id, type: :uuid]

config :semtext,
  ecto_repos: [Semtext.Repo],
  generators: [timestamp_type: :utc_datetime]

config :semtext, SemtextWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: SemtextWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Semtext.PubSub

config :noizu_sendgrid,
  api_key: System.get_env("SENDGRID_API_KEY") || "SG.dev-placeholder"

config :semtext, :mail_from, {"Semtext", "noreply@semtext.dev"}

# Trace correlation: SemtextWeb.Plugs.OtelLoggerMetadata (endpoint) reads the
# active span and sets :trace_id/:span_id logger metadata; the allowlist below
# renders them. Mirrors start-app.
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :trace_id, :span_id]

config :phoenix, :json_library, Jason

# Plug options in endpoint.ex are evaluated at compile time, so plugs that
# need boot-time values read them inside init/1; runtime init mode makes that
# init run when the endpoint serves instead of when it compiles. This is what
# lets SemtextWeb.Plugs.Session pick up the per-boot session signing salt
# from runtime.exs instead of a literal committed here.
config :phoenix, :plug_init_mode, :runtime

config :semtext, :redis, uri: "redis://localhost:6379/0", key_prefix: "semtext:"

config :semtext, Semtext.Guardian,
  issuer: "semtext",
  secret_key: "dev-secret-key-change-in-production"

# SSO feature flags (all disabled by default, enabled via runtime env vars)
config :ueberauth, Ueberauth, providers: []

config :semtext, :oidc_enabled, false
config :semtext, :saml_enabled, false
config :semtext, :google_enabled, false
config :semtext, :facebook_enabled, false
config :semtext, :github_enabled, false
config :semtext, :linkedin_enabled, false
# Retired as an access control (register open, app gated): signup never needs
# an invite and Semtext.Auth.InviteGate holds gated accounts regardless of this
# value. Still parsed from SSO_REQUIRE_INVITE for zero env churn; unused.
config :semtext, :sso_require_invite, false
config :semtext, :sso_domains, %{}
config :semtext, :sso_auto_approve_domains, []
config :semtext, :sso_domain_policies, %{}

config :junit_formatter,
  report_file: "results.xml"

# Rate limiting
config :hammer,
  backend: {Hammer.Backend.ETS, [expiry_ms: 60_000 * 60, cleanup_interval_ms: 60_000 * 10]}

# Background jobs
config :semtext, Oban,
  repo: Semtext.Repo,
  queues: [mailer: 10, default: 10, cleanup: 5, fleet_push: 1],
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    {Oban.Plugins.Cron,
     crontab: [
       {"0 */6 * * *", Semtext.Workers.CleanupWorker},
       # Fleet dashboard (fleet.noizu.com) daily metrics push. No-ops at
       # runtime when FLEET_INGEST_KEY is unset.
       {"5 9 * * *", Semtext.FleetPush}
     ]}
  ]

# Fleet metrics push — see Semtext.FleetPush. runtime.exs overlays url/key
# from FLEET_INGEST_URL / FLEET_INGEST_KEY. A fresh scaffold ships the
# MetricsProvider.Nil provider (all metrics nil => "not reporting" on the
# dashboard); sites implement a real provider and point metrics_provider at it.
config :semtext, Semtext.FleetPush,
  url: "https://fleet.noizu.com/api/v1/ingest/metrics",
  source: "semtext",
  metrics_provider: Semtext.FleetPush.MetricsProvider.Nil,
  http_client: Semtext.FleetPush.ReqClient

# Feature flags
config :semtext, :feature_flags, %{
  email_verification: true,
  webhooks: false,
  file_uploads: false,
  # Design v2 D4 — GitHub login is open to any GitHub-authenticated user: the
  # InviteGate stops holding accounts (every signup lands :active). Invite
  # redemption endpoints stay for admins, but nothing is gated behind them.
  general_release: true
}

# Host-based dispatch (design v2 §3.1) — one endpoint, three kinds of host.
# `www` falls through to the main router (apex canonicalization is an SEO
# concern owned by the landing lane / ingress, not the dispatch plug).
# `probe_paths` pass through on UNKNOWN hosts only: k8s probes and the
# migrate Job hit the pod IP directly and must reach HealthController.
config :semtext, :hosts,
  main: ["semtext.dev", "www.semtext.dev", "localhost", "127.0.0.1"],
  proposals: ["proposals.semtext.dev"],
  probe_paths: ["/health"]

# i18n
config :semtext, SemtextWeb.Gettext, default_locale: "en"

import_config "#{config_env()}.exs"
