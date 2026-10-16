defmodule SemtextWeb.ProposalsRouter do
  @moduledoc """
  Router for the `proposals.semtext.dev` host (design v2 §3.1).

  Dispatched by `SemtextWeb.Plugs.HostDispatch` before the Hologram router,
  so proposals pages are a completely separate route namespace from the
  main site. P0 is a skeleton only: the browse/detail/dashboard Hologram
  pages and the `/api/v1/*` proposals API arrive in P1 (design §5, §8).
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

  scope "/", SemtextWeb do
    pipe_through :api

    get "/", ProposalsHomeController, :index
    get "/p/:slug", ProposalsHomeController, :show
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
