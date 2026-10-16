import Config

config :semtext, Semtext.Repo,
  username: System.get_env("DB_USER", "semtext"),
  password: System.get_env("DB_PASS", "semtext_dev"),
  hostname: System.get_env("DB_HOST", "localhost"),
  database: System.get_env("DB_NAME", "semtext_dev"),
  port: String.to_integer(System.get_env("DB_PORT") || "5432"),
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :semtext, SemtextWeb.Endpoint,
  http: [
    ip:
      case System.get_env("PHX_IP") do
        nil -> {127, 0, 0, 1}
        ip_str -> ip_str |> String.to_charlist() |> :inet.parse_address() |> elem(1)
      end,
    port: String.to_integer(System.get_env("PORT") || "5585")
  ],
  check_origin: false,
  code_reloader: true,
  debug_errors: true

config :semtext, dev_routes: true

# Public app URL — Hologram UI is served by this Phoenix app (same host/port).
config :semtext, :frontend_url, System.get_env("FRONTEND_URL", "http://localhost:5585")

config :logger, :default_formatter, format: "[$level] $message\n"

config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime

config :noizu_sendgrid,
  sandbox_enable: true

# Dev-only login stub (POST /auth/test/login?github_login=...) for Cypress +
# manual testing. Compile-gated; prod config leaves it false.
config :semtext, :test_auth_login_route, true

# Multi-host split (P1): HostDispatch routes proposals.semtext.dev to the
# proposals router, and the pages' HostGuard allow-lists the same entry.
# E2E maps the name to 127.0.0.1 (app/e2e/cypress.config.ts E2E_HOSTS).
config :semtext, :hosts,
  proposals: ["proposals.semtext.dev"]

# Absolute origin of the proposals host (env SEMTEXT_PROPOSALS_ORIGIN).
# The /extend wizard's submit redirect lands here; point it at a
# host:port when the dev server does not serve on 443. Production
# config keeps the default https://proposals.semtext.dev.
config :semtext, :proposals_ui,
  origin: System.get_env("SEMTEXT_PROPOSALS_ORIGIN", "https://proposals.semtext.dev")
