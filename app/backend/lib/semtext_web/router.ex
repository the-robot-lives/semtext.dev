defmodule SemtextWeb.Router do
  @moduledoc """
  〚📦:87d06606-48c9-573b-aa5b-389e9dca48b7〛 SemtextWeb.Router :: Main-host router (semtext.dev) — /api/v1 JSON, auth/SSO, media, PBAC scopes, proxy lanes, Hologram pages.
  """
  use SemtextWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug SemtextWeb.AuthPipeline
  end

  # Session-cookie auth (GitHub callback writes the access token into the
  # main `_semtext_key` cookie — design v2 §4). GitHub OAuth + logout + the
  # session-current-user route run through this; Hologram pages already have
  # the session fetched at the endpoint.
  pipeline :session do
    plug :fetch_session
  end

  # Resolve `:current_user` from Bearer OR session cookie; pair with
  # RequireUser/RequireModerator to enforce (proposals host uses these too).
  pipeline :current_user do
    plug :fetch_session
    plug SemtextWeb.Plugs.CurrentUser
  end

  pipeline :require_user do
    plug :fetch_session
    plug SemtextWeb.Plugs.CurrentUser
    plug SemtextWeb.Plugs.RequireUser
  end

  pipeline :require_moderator do
    plug :fetch_session
    plug SemtextWeb.Plugs.CurrentUser
    plug SemtextWeb.Plugs.RequireUser
    plug SemtextWeb.Plugs.RequireModerator
  end

  pipeline :rate_limited_auth do
    plug SemtextWeb.Plugs.RateLimit, action: :auth
  end

  pipeline :rate_limited_sensitive do
    plug SemtextWeb.Plugs.RateLimit, action: :auth_sensitive
  end

  pipeline :rate_limited_proxy do
    plug SemtextWeb.Plugs.RateLimit, action: :proxy_read
  end

  pipeline :org_viewer do
    plug SemtextWeb.Plugs.RequireRole, role: "viewer"
  end

  pipeline :org_editor do
    plug SemtextWeb.Plugs.RequireRole, role: "editor"
  end

  pipeline :org_admin do
    plug SemtextWeb.Plugs.RequireRole, role: "admin"
  end

  pipeline :org_owner do
    plug SemtextWeb.Plugs.RequireRole, role: "owner"
  end

  pipeline :admin do
    plug SemtextWeb.Plugs.RequireAdmin
  end

  scope "/", SemtextWeb do
    pipe_through :api
    get "/health", HealthController, :index
  end

  scope "/api/v1", SemtextWeb do
    pipe_through [:api, :rate_limited_auth]
    get "/consent/cookies", ConsentController, :show
    put "/consent/cookies", ConsentController, :update
    get "/auth/sso/providers", SSOController, :providers
    get "/invites/lookup", InviteTokenController, :lookup
    get "/config/features", ConfigController, :features
  end

  scope "/api/v1", SemtextWeb do
    pipe_through [:api, :authenticated]
    get "/auth/me", AuthController, :me
    get "/users/me", UserController, :show
    patch "/users/me", UserController, :update
    post "/users/me/complete-registration", UserController, :complete_registration
    resources "/organizations", OrganizationController, only: [:index, :create, :show]
    post "/media/presign", MediaController, :presign
    post "/media/download", MediaController, :download
    post "/media/register", MediaController, :register
  end

  # Redeem an invite as a signed-in user (the /auth/invite-required
  # interstitial and /join for existing accounts). Exempt from the invite gate
  # (SemtextWeb.Plugs.RequireInvite) and rate-limited: it is a token oracle.
  scope "/api/v1", SemtextWeb do
    pipe_through [:api, :rate_limited_sensitive, :authenticated]
    post "/invites/redeem", InviteTokenController, :redeem
  end

  scope "/api/v1/organizations/:org_id", SemtextWeb do
    pipe_through [:api, :authenticated, :org_admin]
    resources "/members", MembershipController, only: [:index, :create, :update, :delete]
    resources "/invites", InviteTokenController, only: [:index, :create, :delete]
    get "/invites/:id/redemptions", InviteTokenController, :redemptions
  end

  scope "/api/v1/admin", SemtextWeb do
    pipe_through [:api, :authenticated, :admin]
    get "/users", AdminController, :list_users
    get "/users/:id", AdminController, :show_user
    post "/users/:id/approve", AdminController, :approve_user
    get "/organizations", AdminController, :list_organizations
    get "/organizations/:id", AdminController, :show_organization
  end

  # Media serving (public/conditional auth — checked inline in controller)
  scope "/media", SemtextWeb do
    pipe_through [:api]
    get "/:short_id", MediaServeController, :show
    get "/:short_id/*filename", MediaServeController, :show
  end

  # Read-only live-fetch proxy (vocabulary epic Phase 5 — contract + route
  # table in Semtext.LiveProxy): agent-kit lookups + annotate thread
  # collections for the embed chrome. Public-ish GETs: no auth (data is
  # org-public or already-public; upstream credentials are server-side
  # only), proxy_read rate limit. Fail-soft on any upstream trouble —
  # clients treat non-200 / live:false as "stay cached".
  scope "/api/v1/agent-kit", SemtextWeb do
    pipe_through [:api, :rate_limited_proxy]
    get "/tickets/:org/:project/:key", AgentKitProxyController, :ticket
    get "/personas/:org", AgentKitProxyController, :personas
    get "/boards/:org", AgentKitProxyController, :boards
  end

  scope "/api/v1/annotate", SemtextWeb do
    pipe_through [:api, :rate_limited_proxy]
    get "/threads", AnnotateThreadsController, :index
  end

  # Driver mock backend (vocabulary epic Phase 6 — contract in Semtext.Driver):
  # POST /run enqueues a simulated cypress/cucumber run, GET /runs/:id polls
  # it to terminal. Same posture as the Phase 5 live-fetch proxies above: no
  # auth (nothing sensitive — every payload is `mode: "mock"`, only a script
  # ref is accepted, nothing logged), shared `proxy_read` rate limit. The
  # real runner is a follow-up lane.
  scope "/api/v1/driver", SemtextWeb do
    pipe_through [:api, :rate_limited_proxy]
    post "/run", DriverController, :create
    get "/runs/:id", DriverController, :show
  end

  # Editor island data (site-editor lane): the /editor page's client-side
  # document feed — one tag's authored reference example (+ the pane spec),
  # fetched after load so no document markup ever rides in page state.
  # Public read of compile-time reference data; params are lookup keys only.
  scope "/editor", SemtextWeb do
    pipe_through :api
    get "/examples/:tag", EditorExampleController, :show
  end

  # GitHub OAuth — the only login path (design v2 §4). The endpoint's main
  # session cookie carries the access token the Hologram pages read; there is
  # no separate SSO cookie and no server-side token store. Email/password,
  # magic-link, OTP, SAML and every other OAuth provider were removed at the
  # router AND function level (github-only tests 404 each old route).
  scope "/auth", SemtextWeb do
    pipe_through [:session]
    get "/github", SSOController, :oauth_request
    get "/github/callback", SSOController, :oauth_callback
    post "/logout", AuthController, :logout
  end

  scope "/auth", SemtextWeb do
    pipe_through [:require_user]
    get "/session", AuthController, :session_user
  end

  # PBAC v2: Groups & Memberships (authenticated, read-only)
  scope "/api/v1", SemtextWeb do
    pipe_through [:api, :authenticated]

    get "/groups", GroupController, :index
    get "/groups/:id", GroupController, :show
    get "/groups/:id/policies", GroupController, :policies

    get "/memberships/me", AuthzMembershipController, :my_memberships
    get "/memberships/organizations/:org_id", AuthzMembershipController, :org_members
    get "/memberships/projects/:project_id", AuthzMembershipController, :project_members

    get "/policies/me", PolicyController, :my_policies
    post "/policies/check", PolicyController, :check
    post "/policies/explain", PolicyController, :explain
  end

  # PBAC v2: Projects (authenticated, permission-checked per action)
  scope "/api/v1/organizations/:org_id", SemtextWeb do
    pipe_through [:api, :authenticated]

    resources "/projects", ProjectController, only: [:index, :create, :show, :update, :delete]

    scope "/projects/:project_id" do
      post "/archive", ProjectController, :archive
      post "/unarchive", ProjectController, :unarchive
      post "/leave", ProjectController, :leave
      get "/members", ProjectController, :members
      post "/members", ProjectController, :add_member
      patch "/members/:member_user_id", ProjectController, :update_member
      delete "/members/:member_user_id", ProjectController, :remove_member
    end
  end

  # PBAC v2: Custom Roles (authenticated, permission-checked per action)
  scope "/api/v1/organizations/:org_id", SemtextWeb do
    pipe_through [:api, :authenticated]

    resources "/roles", CustomRoleController, only: [:index, :create, :show, :update, :delete]

    scope "/roles/:role_id" do
      get "/permissions", CustomRoleController, :show
      post "/permissions", CustomRoleController, :add_permission
      delete "/permissions/:permission_id", CustomRoleController, :remove_permission
    end
  end

  # PBAC v2: Policy admin (admin only)
  scope "/api/v1", SemtextWeb do
    pipe_through [:api, :authenticated, :admin]

    resources "/policies", PolicyController, only: [:index, :create, :show, :update, :delete]
    post "/users/:user_id/policies", PolicyController, :attach_to_user
    delete "/users/:user_id/policies/:policy_id", PolicyController, :detach_from_user
  end

  if Application.compile_env(:semtext, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]
      live_dashboard "/dashboard", metrics: SemtextWeb.Telemetry
    end
  end

  # Test-env login stub (design §2 contract): POST /auth/test/login with
  # `github_login=` (or `user_id=`) signs that user in — Cypress + manual dev
  # use. Gated at COMPILE time on :test_auth_login_route (config.exs default
  # false; dev.exs/test.exs set true), so it can never compile into a prod
  # release, and the controller itself no-ops to 404 unless the flag is also
  # set at runtime.
  if Application.compile_env(:semtext, :test_auth_login_route, false) do
    scope "/auth/test", SemtextWeb do
      pipe_through [:session]
      post "/login", TestAuthController, :login
      get "/login", TestAuthController, :login
    end
  end
end
