defmodule SemtextWeb.ProposalsRouter do
  @moduledoc """
  Router for the `proposals.semtext.dev` host (design v2 §3.1).

  Dispatched by `SemtextWeb.Plugs.HostDispatch` before the Hologram router,
  so proposals pages are a completely separate route namespace from the
  main site. P0 is a skeleton only: the browse/detail/dashboard Hologram
  pages and the `/api/v1/*` proposals API arrive in P1 (design §5, §8).
  """
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", SemtextWeb do
    pipe_through :api

    get "/", ProposalsHomeController, :index
    get "/p/:slug", ProposalsHomeController, :show
    get "/health", ProposalsHomeController, :health
  end
end
