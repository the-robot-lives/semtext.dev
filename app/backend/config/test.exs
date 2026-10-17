import Config

config :semtext, Semtext.Repo,
  username: System.get_env("DB_USER", "semtext"),
  password: System.get_env("DB_PASS", "semtext_dev"),
  hostname: System.get_env("DB_HOST", "localhost"),
  database: "#{System.get_env("DB_NAME", "semtext")}_test#{System.get_env("MIX_TEST_PARTITION")}",
  port: String.to_integer(System.get_env("DB_PORT") || "5432"),
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

config :semtext, SemtextWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false

config :noizu_sendgrid,
  sandbox_enable: true

config :logger, level: :warning

# This app IS the Hologram site (design v2 D1): pages must SSR in tests (the
# smoke test pins GET /). Hologram keeps its runtime (page resolver +
# supervision tree) OFF in :dev/:test unless HOLOGRAM_START=1 — the starter's
# convention so a plain `mix phx.server` serves the API only. Set it HERE:
# config/test.exs is evaluated at loadconfig, BEFORE the supervision tree
# boots (a mix.exs hook runs at :dev mixfile-load time — too early and too
# flaky; test_helper.exs runs after boot — too late). Prod/docker set the
# variable in the chart + compose. Works for `mix test` and `mix test
# --cover` (CI) alike.
System.put_env("HOLOGRAM_START", "1")

config :phoenix, :plug_init_mode, :runtime

config :semtext, Oban, testing: :inline

# The scaffold gate-machinery suite (InviteGate/AuthController/InviteToken/
# UserSocket/RequireInvite/RequireAuth) asserts invite-only behavior and
# needs the gate ON to exercise it. The SHIPPED default is open signup —
# `general_release: true` in config/config.exs (design v2 D4, pinned there).
# NOTE: feature_flags is a MAP (config.exs ships %{...}) — InviteGate reads
# it with Map.get; never pin a keyword list here. Tests that need
# open-signup semantics flip the flag locally and restore
# (see Semtext.GithubOnlyLoginTest).
config :semtext, :feature_flags, %{general_release: false}

# Phoenix.ConnTest defaults to host "www.example.com"; the host-dispatch plug
# must treat it as the main site or every existing controller test 404s.
config :semtext, :hosts,
  main: ["www.example.com", "localhost", "127.0.0.1"],
  proposals: ["proposals.semtext.dev"],
  probe_paths: ["/health"]

# Minimum bcrypt cost in test: every login/invite path hashes, and the default
# cost (12) dominates the suite. Never copy this into dev/prod config.
config :bcrypt_elixir, log_rounds: 4

# Hermetic tests: strip live-provider credentials from the OS env BEFORE
# config/runtime.exs reads them (mix test evaluates this file first, in the
# same VM), so a developer's shell key can never make a test call a real
# provider. CI never sets these; this keeps local runs equal to CI.
for key <-
      ~w(SENDGRID_API_KEY OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY MISTRAL_API_KEY
         GROQ_API_KEY ZAI_API_KEY DASHSCOPE_API_KEY AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
         OIDC_CLIENT_SECRET GOOGLE_CLIENT_SECRET FACEBOOK_CLIENT_SECRET GITHUB_CLIENT_SECRET
         AGENT_KIT_API_URL AGENT_KIT_API_KEY ANNOTATE_API_URL
         DATABASE_URL) do
  System.delete_env(key)
end

# config.exs already captured SENDGRID_API_KEY at load time; pin a dummy.
config :noizu_sendgrid, api_key: "SG.test-placeholder"

# ── P1 auth lane pins ────────────────────────────────────────────────────
# config.exs ships sso_open: true (github-only, design v2 §4); pin it FALSE
# here so the SSODomains domain-policy gate tests keep their semantics. Tests
# that need open logins flip it locally with Application.put_env.
config :semtext, :sso_open, false
# Session lifetime is irrelevant to tests (tokens are minted per-test); keep
# it short so any accidental real-TTL dependency fails loudly.
config :semtext, :session_ttl, {1, :hour}
# Compile the dev/test login-stub route into the router (prod never sets this).
config :semtext, :test_auth_login_route, true
