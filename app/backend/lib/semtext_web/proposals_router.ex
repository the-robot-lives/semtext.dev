defmodule SemtextWeb.ProposalsRouter do
  @moduledoc """
  〚📦:f7f5127a-7784-5148-8ce5-d6bce647c845〛 SemtextWeb.ProposalsRouter :: Proposals-host router (proposals.semtext.dev) — SSR pages, GitHub OAuth, inbound webhook receiver; own session.

  Router for the `proposals.semtext.dev` host (design v2 §3.1).

  Dispatched by `SemtextWeb.Plugs.HostDispatch` before the Hologram router,
  so proposals pages are a completely separate route namespace from the
  main site. P1 (ui lane): the proposals Hologram pages are served here
  through `SemtextWeb.Hologram.Pages.Proposals.PageRelay` — `/`,
  `/p/:slug`, `/dashboard` and `/moderation` get real SSR via
  `Hologram.Controller.handle_initial_page_request/2`, and `/hologram/*`
  (commands, subsequent page requests, realtime) forwards to the stock
  `Hologram.Router` (explicit routes: `forward/3` would strip the prefix).
  Because Hologram pages register globally, the ui lane's `HostGuard`
  page middleware 404s any main-host resolution of these paths.

  The proposals host has its OWN session (host-only cookies), so the auth
  entry points are forwarded here as well: GitHub OAuth + logout, plus the
  compile-gated `/auth/test/login` Cypress stub — same controllers the
  main host's `/auth/*` scopes mount (auth lane).

  The transitional JSON stubs for `/` and `/p/:slug` were replaced by the
  pages (takeover coordinated in the P1 report); `/health` and the GitHub
  webhook receiver stay.
  """
  use Phoenix.Router

  alias SemtextWeb.Plugs.{CurrentUser, RequireUser, RequireModerator}

  # Same auth pipelines as the main router (shared plugs, P1 auth lane; the
  # endpoint-level SemtextWeb.Plugs.Session configures the cookie store):
  # :current_user assigns :current_user (nil when anon) without gating;
  # :require_user gates on the session cookie or a Bearer token;
  # :require_moderator additionally requires users.role == "moderator".
  pipeline :current_user do
    plug :fetch_session
    plug CurrentUser
  end

  pipeline :require_user do
    plug :fetch_session
    plug CurrentUser
    plug RequireUser
  end

  pipeline :require_moderator do
    plug :fetch_session
    plug CurrentUser
    plug RequireUser
    plug RequireModerator
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  # Session fetch for the auth scopes (same shape as the main router's
  # :session; controllers write the cookie-backed Guardian token).
  pipeline :session do
    plug :fetch_session
  end

  # ── Proposals Hologram pages (ui lane, P1) ─────────────────────
  # No pipeline: identity flows through each page's middleware chain
  # (HostGuard / RequireAuth / ModeratorGate) and the session cookie is
  # already established at the endpoint; CSRF tokens are ensured inside
  # handle_initial_page_request.

  scope "/", SemtextWeb do
    pipe_through []

    get "/", Hologram.Pages.Proposals.PageRelay, :browse
    get "/p/:slug", Hologram.Pages.Proposals.PageRelay, :detail
    get "/dashboard", Hologram.Pages.Proposals.PageRelay, :dashboard
    get "/moderation", Hologram.Pages.Proposals.PageRelay, :moderation
  end

  # Hologram runtime plumbing on the proposals host (path-keyed; the stock
  # router resolves pages from its global table and commands from POSTs).
  scope "/", SemtextWeb do
    pipe_through []

    get "/hologram/ping", Hologram.Pages.Proposals.PageRelay, :hologram
    get "/hologram/sse", Hologram.Pages.Proposals.PageRelay, :hologram
    post "/hologram/sse/handshake", Hologram.Pages.Proposals.PageRelay, :hologram
    get "/hologram/websocket", Hologram.Pages.Proposals.PageRelay, :hologram
    post "/hologram/command", Hologram.Pages.Proposals.PageRelay, :hologram
    post "/hologram/page/:module", Hologram.Pages.Proposals.PageRelay, :hologram
  end

  # ── Auth on the proposals host (host-only sessions, design §3.1) ──
  # The same SSO/logout controllers the main host mounts; the GitHub OAuth
  # app must allow this callback host (infra request, P1 report).

  scope "/auth", SemtextWeb do
    pipe_through [:session]

    get "/github", SSOController, :oauth_request
    get "/github/callback", SSOController, :oauth_callback
    post "/logout", AuthController, :logout
  end

  if Application.compile_env(:semtext, :test_auth_login_route, false) do
    scope "/auth/test", SemtextWeb do
      pipe_through [:session]

      post "/login", TestAuthController, :login
      get "/login", TestAuthController, :login
    end
  end

  # ── Non-page surfaces ────────────────────────────────────────────

  scope "/", SemtextWeb do
    pipe_through :api

    get "/health", ProposalsHomeController, :health

    # GitHub App webhook receiver (design v1 §6; LANE=github-sync).
    post "/api/v1/webhooks/github", GithubWebhookController, :receive
  end

  # API surface for signed-in users (design §8; populated by the proposals
  # data lane — pipelines are the auth lane's contract with it).
  scope "/api/v1/proposals", SemtextWeb do
    pipe_through [:api, :current_user]
  end

  # Moderation-only surface (P1: review queues land with the data lane).
  scope "/api/v1/moderation", SemtextWeb do
    pipe_through [:api, :require_moderator]
  end
end
