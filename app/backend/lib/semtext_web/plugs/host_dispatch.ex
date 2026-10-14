defmodule SemtextWeb.Plugs.HostDispatch do
  @moduledoc """
  Design v2 §3.1 — one Phoenix endpoint, host-based dispatch.

  Mounted in `SemtextWeb.Endpoint` BEFORE `Hologram.Router` and
  `SemtextWeb.Router`, so the proposals host and unknown hosts never reach
  Hologram page routes at all:

  | Host                              | Dispatch                                   |
  |-----------------------------------|--------------------------------------------|
  | `semtext.dev`, `www.semtext.dev`  | falls through to Hologram + main router    |
  | `proposals.semtext.dev`           | `SemtextWeb.ProposalsRouter`, halts        |
  | anything else                     | 404 (no catch-all), except probe paths     |

  The one exception to the unknown-host 404 is `probe_paths` (`/health`):
  Kubernetes liveness/readiness probes and the migrate Job hit the pod
  directly, where the Host header is the pod IP, not a site host. Those pass
  through to the main router so the existing `HealthController` answers. This
  is pod-internal plumbing only — public ingress never sends unknown hosts
  (cloudflareOnly ingress in the chart).

  Host mapping comes from `config :semtext, :hosts` (`main:` / `proposals:`
  host lists + `probe_paths`). Cookies stay host-only per design §3.1: this
  plug never touches session config, and `play.semtext.dev` has no router
  entry at all by construction.
  """
  @behaviour Plug

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    case dispatch_kind(normalize_host(conn.host), path(conn), hosts_config()) do
      :main ->
        Plug.Conn.assign(conn, :semtext_host, :main)

      :proposals ->
        conn
        |> Plug.Conn.assign(:semtext_host, :proposals)
        |> SemtextWeb.ProposalsRouter.call([])
        |> Plug.Conn.halt()

      :probe ->
        Plug.Conn.assign(conn, :semtext_host, :probe)

      :unknown ->
        # halt() is load-bearing: without it the Hologram/Phoenix routers
        # still run on the already-sent conn and the Plug.Router 404
        # fall-through resets it (test-visible status nil).
        conn
        |> Plug.Conn.send_resp(:not_found, "not found")
        |> Plug.Conn.halt()
    end
  end

  # An unknown host is a 404 unless the request is a pod-internal health probe
  # (see module doc). Both branches below return before Hologram.Router.
  # Config is a keyword list (`config :semtext, :hosts, main: [...], ...`) —
  # never a map, so access goes through Keyword.get.
  defp dispatch_kind(host, path, config) do
    cond do
      host in Keyword.get(config, :proposals, []) -> :proposals
      host in Keyword.get(config, :main, []) -> :main
      path in Keyword.get(config, :probe_paths, []) -> :probe
      true -> :unknown
    end
  end

  # Host headers may carry a port (dev servers, pod-internal hits).
  defp normalize_host(host) when is_binary(host) do
    host
    |> String.split(":")
    |> List.first()
    |> String.downcase()
  end

  defp normalize_host(nil), do: ""

  defp path(%Plug.Conn{path_info: path_info}), do: "/" <> Enum.join(path_info, "/")

  defp hosts_config, do: Application.get_env(:semtext, :hosts, [])
end
