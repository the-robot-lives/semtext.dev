defmodule SemtextWeb.Plugs.CanonicalHost do
  @moduledoc """
  Permanent (301) redirect of alias hosts to the canonical apex, preserving
  path and query string (`https://www.semtext.dev/a?b=1` ->
  `https://semtext.dev/a?b=1`). The URL fragment never reaches the server;
  browsers re-attach it to a 301 target on their own.

  Mounted FIRST in `SemtextWeb.Endpoint` (before Plug.Static) so static assets
  and every route redirect too. Host-matched only: pod-internal health probes
  arrive with the pod IP as Host and are untouched.

  Config: `config :semtext, :canonical_host, from: [...], to: "https://..."`.
  Missing config = no-op.
  """
  @behaviour Plug
  import Plug.Conn

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    cfg = Application.get_env(:semtext, :canonical_host, [])
    from = Keyword.get(cfg, :from, [])
    to = Keyword.get(cfg, :to)

    if is_binary(to) and String.downcase(conn.host || "") in from do
      query = if conn.query_string in [nil, ""], do: "", else: "?" <> conn.query_string

      conn
      |> put_resp_header("location", to <> conn.request_path <> query)
      |> put_resp_header("cache-control", "public, max-age=3600")
      |> send_resp(:moved_permanently, "")
      |> halt()
    else
      conn
    end
  end
end
