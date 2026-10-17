import Config

if System.get_env("PHX_SERVER") do
  config :semtext, SemtextWeb.Endpoint, server: true
end

# Secret material for dev/test: prefer an injected value (.env) and otherwise
# generate a strong one per boot. No literal secret_key_base or signing salt
# may be committed in this scaffold — see README/.env.example. Sessions do not
# survive a restart when the fallback fires; that is intentional, do not "fix"
# it with a literal.
#
# In :prod both variables are REQUIRED and fail fast — see the prod block
# below. A per-boot key in prod would rotate sessions on every restart and
# diverge between replicas; a missing variable must fail the boot loudly.
secret_key_base =
  System.get_env("SECRET_KEY_BASE") ||
    :crypto.strong_rand_bytes(48) |> Base.encode64() |> binary_part(0, 64)

# Plug options are evaluated at compile time, so the session salt is read at
# runtime by SemtextWeb.Plugs.Session.init/1 from app env (see config.exs:
# :plug_init_mode, :runtime).
session_signing_salt =
  System.get_env("SESSION_SIGNING_SALT") ||
    :crypto.strong_rand_bytes(24) |> Base.encode16(case: :lower) |> binary_part(0, 48)

config :semtext, SemtextWeb.Endpoint,
  secret_key_base: secret_key_base,
  session_signing_salt: session_signing_salt

config :semtext, :redis,
  uri: System.get_env("REDIS_URL") || "redis://localhost:6379/0",
  key_prefix: System.get_env("REDIS_KEY_PREFIX", "semtext:")

parse_sso_domains = fn
  nil ->
    %{}

  "" ->
    %{}

  value ->
    value
    |> String.split(~r/[;\s]+/, trim: true)
    |> Enum.reduce(%{}, fn entry, acc ->
      case String.split(entry, ["=", ":"], parts: 2) do
        [domain, providers] ->
          provider_list =
            providers
            |> String.split(",", trim: true)
            |> Enum.map(&String.trim/1)
            |> Enum.reject(&(&1 == ""))

          Map.put(acc, domain |> String.trim() |> String.downcase(), provider_list)

        _ ->
          acc
      end
    end)
end

parse_domain_list = fn
  nil ->
    []

  "" ->
    []

  value ->
    value
    |> String.split(~r/[,\s;]+/, trim: true)
    |> Enum.map(&(&1 |> String.trim() |> String.downcase()))
    |> Enum.reject(&(&1 == ""))
    |> Enum.uniq()
end

build_sso_domain_policies = fn domains, auto_approve_domains ->
  auto_approve = MapSet.new(auto_approve_domains)

  domains
  |> Enum.into(%{}, fn {domain, providers} ->
    {domain,
     %{
       providers: providers,
       auto_approve: MapSet.member?(auto_approve, "*") || MapSet.member?(auto_approve, domain)
     }}
  end)
end

# ── OpenTelemetry ────────────────────────────────────────────────
# House conventions: trl-infra monorepo docs/observability/OTEL-CONVENTIONS.md.
# Everything below is keyed off OTEL_EXPORTER_OTLP_ENDPOINT: unset (dev,
# test, chart with observability.enabled=false) ⇒ the SDK starts disabled
# (no tracer provider, no processors, no exporter, zero connection
# attempts). Otherwise the default batch processor would export to
# http://localhost:4318 and retry forever, spamming deploy logs with
# failed_connect errors.
if otel_endpoint = System.get_env("OTEL_EXPORTER_OTLP_ENDPOINT") do
  config :opentelemetry_exporter,
    otlp_protocol: Semtext.Observability.protocol(System.get_env("OTEL_EXPORTER_OTLP_PROTOCOL")),
    otlp_endpoint: otel_endpoint

  otel_resource =
    Semtext.Observability.resource_env_keys()
    |> Map.new(fn key ->
      {key, System.get_env(key)}
    end)
    |> Semtext.Observability.resource_attributes()
    |> Map.put_new(
      "service.version",
      Application.spec(:semtext, :vsn) |> to_string()
    )

  config :opentelemetry,
    span_processor: :batch,
    sampler:
      Semtext.Observability.sampler_spec(
        System.get_env("OTEL_TRACES_SAMPLER", "parentbased_traceidratio"),
        System.get_env("OTEL_TRACES_SAMPLER_ARG", "1.0")
      ),
    resource: otel_resource

  # Metrics leg (Semtext.Observability.Metrics): one periodic reader exporting
  # over OTLP. The exporter reads OTEL_EXPORTER_OTLP_ENDPOINT itself and appends
  # v1/metrics; the resource (service.name/namespace/version) comes from the
  # same env the traces resource uses, so metrics land on the same service.
  config :opentelemetry_experimental,
    readers: [
      %{
        module: :otel_metric_reader,
        config: %{
          export_interval_ms: 30_000,
          exporter: {:otel_exporter_metrics_otlp, %{}}
        }
      }
    ]
else
  # OTel disabled (no OTLP endpoint): start the SDK with sdk_disabled so no
  # tracer provider / span processors start — and keep the metrics app
  # disabled too, so no meter provider/reader ever comes up.
  config :opentelemetry, sdk_disabled: true
  config :opentelemetry_experimental, sdk_disabled: true
end

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://user:pass@host/database
      """

  config :semtext, Semtext.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  session_signing_salt =
    System.get_env("SESSION_SIGNING_SALT") ||
      raise """
      environment variable SESSION_SIGNING_SALT is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "example.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :semtext, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  guardian_secret =
    System.get_env("GUARDIAN_SECRET_KEY") ||
      raise """
      environment variable GUARDIAN_SECRET_KEY is missing.
      You can generate one by calling: mix guardian.gen.secret
      """

  config :semtext, Semtext.Guardian,
    issuer: "semtext",
    secret_key: guardian_secret

  config :semtext, :frontend_url, System.get_env("FRONTEND_URL")

  if sendgrid_key = System.get_env("SENDGRID_API_KEY") do
    config :noizu_sendgrid, api_key: sendgrid_key
  end

  config :semtext,
         :mail_from,
         {System.get_env("MAIL_FROM_NAME", "Semtext"),
          System.get_env("MAIL_FROM_ADDRESS", "noreply@semtext.dev")}

  # ── Storage (S3/MinIO) ──────────────────────────────────────────
  if s3_bucket = System.get_env("S3_BUCKET") do
    config :semtext, Semtext.Storage,
      bucket: s3_bucket,
      region: System.get_env("S3_REGION", "us-east-1"),
      host: System.get_env("S3_ENDPOINT"),
      scheme: System.get_env("S3_SCHEME", "https://"),
      access_key_id: System.get_env("AWS_ACCESS_KEY_ID"),
      secret_access_key: System.get_env("AWS_SECRET_ACCESS_KEY")

    config :ex_aws,
      access_key_id: System.get_env("AWS_ACCESS_KEY_ID"),
      secret_access_key: System.get_env("AWS_SECRET_ACCESS_KEY"),
      region: System.get_env("S3_REGION", "us-east-1"),
      s3: [
        scheme: System.get_env("S3_SCHEME", "https://"),
        host: System.get_env("S3_ENDPOINT"),
        region: System.get_env("S3_REGION", "us-east-1")
      ]
  end

  # ── SSO: OIDC + SAML removed (design v2 §4 github-only) ─────────
  # The OIDC/SAML env-gated config blocks, the Samly config, the /sso/saml
  # route forward and SemtextWeb.SAMLHandler were all deleted with their
  # routes. A stray OIDC_*/SAML_* env var can no longer re-enable them.

  # ── SSO: Social OAuth (each enabled when *_CLIENT_ID is set) ──
  # Retired: no longer an access control (see config.exs). Parsed for zero env
  # churn only — signup status comes from Semtext.Auth.InviteGate.signup_status/3.
  config :semtext, :sso_require_invite, System.get_env("SSO_REQUIRE_INVITE", "true") == "true"
  sso_domains = parse_sso_domains.(System.get_env("SSO_DOMAINS"))
  sso_auto_approve_domains = parse_domain_list.(System.get_env("SSO_AUTO_APPROVE_DOMAINS"))
  config :semtext, :sso_domains, sso_domains
  config :semtext, :sso_auto_approve_domains, sso_auto_approve_domains

  config :semtext,
         :sso_domain_policies,
         build_sso_domain_policies.(sso_domains, sso_auto_approve_domains)

  # Google/Facebook OAuth removed (design v2 §4 github-only) — the env-gated
  # ueberauth registrations were deleted with their routes.

  oauth_providers = []

  oauth_providers =
    if gh_id = System.get_env("GITHUB_CLIENT_ID") do
      config :ueberauth, Ueberauth.Strategy.Github.OAuth,
        client_id: gh_id,
        client_secret: System.get_env("GITHUB_CLIENT_SECRET")

      config :semtext, :github_enabled, true
      # Design v2 D4 scopes: identity + email (noreply emails acceptable).
      [{:github, {Ueberauth.Strategy.Github, [default_scope: "read:user user:email"]}}
       | oauth_providers]
    else
      oauth_providers
    end

  # LinkedIn SSO disabled — ueberauth_linkedin has incompatible oauth2 dep
  # oauth_providers =
  #   if li_id = System.get_env("LINKEDIN_CLIENT_ID") do
  #     config :ueberauth, Ueberauth.Strategy.LinkedIn.OAuth,
  #       client_id: li_id,
  #       client_secret: System.get_env("LINKEDIN_CLIENT_SECRET")
  #     config :semtext, :linkedin_enabled, true
  #     [{:linkedin, {Ueberauth.Strategy.LinkedIn, [default_scope: "r_liteprofile r_emailaddress"]}} | oauth_providers]
  #   else
  #     oauth_providers
  #   end

  if oauth_providers != [] do
    config :ueberauth, Ueberauth, providers: oauth_providers
  end

  # ── Design v2 D4: GitHub is the ONLY login provider ─────────────
  # The scaffold enables a provider whenever its client-id env var is set. On
  # semtext.dev a stray env var must never resurrect a retired provider, so
  # the non-GitHub flags are forced off here regardless of environment. The
  # `*_enabled` keys are what SSOController.providers/0 and the Hologram auth
  # helpers render from; GitHub stays gated on GITHUB_CLIENT_ID above (the
  # chart maps pod env GITHUB_CLIENT_ID ← Infisical key SEMTEXT_GITHUB_CLIENT_ID).
  # dc/Infisical carries only GitHub's login keys:
  #   services.semtext.github_client_id / services.semtext.github_client_secret
  #   → Infisical SEMTEXT_GITHUB_CLIENT_ID / SEMTEXT_GITHUB_CLIENT_SECRET
  # Email+password, magic-link and OTP login routes are removed with the
  # providers in P1 (design §4); until then no env is shipped for them.
  config :semtext, :google_enabled, false
  config :semtext, :facebook_enabled, false
  config :semtext, :linkedin_enabled, false
  config :semtext, :oidc_enabled, false
  config :semtext, :saml_enabled, false

  # GitHub-only domain policy (design v2 §4): open — any email may sign in
  # with GitHub and signups auto-approve. SSO_DOMAINS/SAML-style per-domain
  # gating is gone from the shipped surface; SSO_OPEN=false re-enables the
  # (config-carried) policy machinery if it is ever needed again. test.exs
  # pins sso_open: false for the gate tests — not overridden here.
  if config_env() != :test do
    config :semtext, :sso_open, System.get_env("SSO_OPEN", "true") == "true"
  end

  # Fleet dashboard (fleet.noizu.com) daily metrics push. Unset/blank
  # FLEET_INGEST_KEY ⇒ the worker logs once and no-ops; nothing is pushed.
  config :semtext, Semtext.FleetPush,
    url: System.get_env("FLEET_INGEST_URL", "https://fleet.noizu.com/api/v1/ingest/metrics"),
    key: System.get_env("FLEET_INGEST_KEY")

  # GitHub App sync (design v1 §6): proposal Discussion creation + webhook
  # ingestion. Distinct secret set from the OAuth login app above — never
  # merged (design v2 §4). dc → Infisical → chart env:
  #   services.semtext.github_app_id             → SEMTEXT_GITHUB_APP_ID
  #   services.semtext.github_app_private_key    → SEMTEXT_GITHUB_APP_PRIVATE_KEY (PEM, \n-escaped OK)
  #   services.semtext.github_webhook_secret     → SEMTEXT_GITHUB_WEBHOOK_SECRET
  #   services.semtext.github_installation_id    → SEMTEXT_GITHUB_INSTALLATION_ID
  #   services.semtext.github_repository_id      → SEMTEXT_GITHUB_REPOSITORY_ID (GraphQL node id)
  #   services.semtext.github_discussion_category_id → SEMTEXT_GITHUB_DISCUSSION_CATEGORY_ID
  # Unset keys stay nil ⇒ Semtext.Github.enabled?/0 is false, sync jobs cancel
  # cleanly, and the webhook endpoint 503s — never a half-configured sync.
  github_env = fn name ->
    case System.get_env(name) do
      nil -> nil
      value -> if String.trim(value) == "", do: nil, else: String.trim(value)
    end
  end

  gh_cfg = Application.get_env(:semtext, Semtext.Github, [])

  config :semtext, Semtext.Github,
    app_id: github_env.("SEMTEXT_GITHUB_APP_ID"),
    app_private_key: github_env.("SEMTEXT_GITHUB_APP_PRIVATE_KEY"),
    webhook_secret: github_env.("SEMTEXT_GITHUB_WEBHOOK_SECRET"),
    installation_id: github_env.("SEMTEXT_GITHUB_INSTALLATION_ID"),
    repository_id: github_env.("SEMTEXT_GITHUB_REPOSITORY_ID"),
    repository_owner: github_env.("SEMTEXT_GITHUB_REPOSITORY_OWNER") || gh_cfg[:repository_owner],
    repository_name: github_env.("SEMTEXT_GITHUB_REPOSITORY_NAME") || gh_cfg[:repository_name],
    discussion_category_id: github_env.("SEMTEXT_GITHUB_DISCUSSION_CATEGORY_ID"),
    proposals_base_url: github_env.("SEMTEXT_PROPOSALS_BASE_URL") || gh_cfg[:proposals_base_url]

  config :semtext, SemtextWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base,
    session_signing_salt: session_signing_salt
end
