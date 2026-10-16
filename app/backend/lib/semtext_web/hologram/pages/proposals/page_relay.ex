defmodule SemtextWeb.Hologram.Pages.Proposals.PageRelay do
  @moduledoc """
  Bridges the proposals host's Phoenix router to the proposals Hologram
  pages (design v2 §3.1: `HostDispatch` halts into `ProposalsRouter`
  BEFORE the Hologram router, so the pages need an explicit relay).

  - `:browse` / `:detail` / `:dashboard` / `:moderation` — direct dispatch
    through `Hologram.Controller.handle_initial_page_request/2`, giving
    each proposals path a REAL initial SSR (full page render with layout,
    middleware chain, params) without a route-table entry on `/`. Route
    params are re-derived inside from `__route__` vs the request path
    (`/p/foo-bar` → `slug: "foo-bar"`), so `/` and `/p/:slug` both render
    exactly like a router-served page.
  - `:hologram` — everything else under `/hologram/*` (command posts,
    subsequent page requests, realtime pings/handshakes) is forwarded to
    the stock `Hologram.Router`, whose path-keyed table already knows the
    proposals pages (they are registered globally; off-host resolution is
    impossible because HostDispatch 404s unknown hosts and `HostGuard`
    404s main-host hits).

  Why not `forward "/hologram", Hologram.Router`: Phoenix.Router.forward
  strips the matched prefix, so the forwarded path no longer matches the
  Hologram route table. Explicit routes preserve the full path.

  Plain module (Phoenix only needs `Mod.action(conn, params)`), so it
  stays inside the ui lane's owned directory.
  """

  alias SemtextWeb.Hologram.Pages.Proposals.{
    BrowsePage,
    DashboardPage,
    DetailPage,
    ModerationPage
  }

  # Phoenix dispatch bridge: the router calls `init/1` at compile time and
  # `call/2` at request time; forward to the named action with conn params.
  def init(action), do: action

  def call(conn, action), do: apply(__MODULE__, action, [conn, conn.params])

  def browse(conn, _params), do: initial(conn, BrowsePage)
  def detail(conn, _params), do: initial(conn, DetailPage)
  def dashboard(conn, _params), do: initial(conn, DashboardPage)
  def moderation(conn, _params), do: initial(conn, ModerationPage)

  def hologram(conn, _params) do
    Hologram.Router.call(conn, [])
  end

  defp initial(conn, page_module) do
    Hologram.Controller.handle_initial_page_request(conn, page_module)
  end
end
