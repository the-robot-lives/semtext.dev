defmodule SemtextWeb.Hologram.Pages.Proposals.HostGuard do
  @moduledoc """
  404 proposals pages everywhere but the proposals host.

  The proposals pages live in the one global Hologram route table, so
  `/p/:slug`, `/dashboard` and `/moderation` resolve through the MAIN
  site's Hologram router too. On the main host those paths previously
  404'd (no route); this middleware restores that parity — no
  duplicate-content routes leak onto semtext.dev (design v2 §3.1 keeps
  the hosts separate namespaces).

  Declared FIRST on every proposals page so it runs before auth gating
  and before commands: a forged command for a proposals page sent to the
  main host is stopped here as well.

  The allow-list is `config :semtext, :hosts` → `:proposals` (same list
  `SemtextWeb.Plugs.HostDispatch` dispatches on), so one config entry
  drives both the host split and this guard.
  """

  use Hologram.Middleware

  def call(server, _opts) do
    if proposals_host?(server.host) do
      server
    else
      %{server | status: 404, response_body: "not found"}
    end
  end

  defp proposals_host?(nil), do: false

  defp proposals_host?(host) do
    hosts = Application.get_env(:semtext, :hosts, [])
    bare_host = host |> String.split(":") |> List.first()
    bare_host in Keyword.get(hosts, :proposals, [])
  end
end
