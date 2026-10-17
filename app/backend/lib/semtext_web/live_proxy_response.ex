defmodule SemtextWeb.LiveProxyResponse do
  @moduledoc """
  THE fail-soft contract, in one place (`Semtext.LiveProxy` module doc has
  the prose). Every live-proxy controller renders upstream trouble through
  these helpers, and the embed chrome treats ANY non-200 (or any body with
  `live: false`) as "stay cached": render the last snapshot, never block
  the page, never surface an error to the visitor.

  | Status | `error` kind            | Meaning for the client            |
  |--------|-------------------------|-----------------------------------|
  | 400    | `invalid_request`       | bad params — do not retry         |
  | 404    | `not_found`             | upstream has no such object       |
  | 502    | `upstream_unavailable`  | upstream 5xx / timeout / transport |
  | 503    | `not_configured`        | proxy lacks upstream config (ops)  |
  """

  import Plug.Conn
  import Phoenix.Controller

  @spec fail_soft(Plug.Conn.t(), :invalid_request | :not_found | :upstream | :not_configured, String.t()) ::
          Plug.Conn.t()
  def fail_soft(conn, kind, detail \\ "")

  def fail_soft(conn, :invalid_request, detail) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "invalid_request", live: false, detail: detail})
  end

  def fail_soft(conn, :not_found, detail) do
    conn
    |> put_status(:not_found)
    |> json(%{error: "not_found", live: false, detail: detail})
  end

  def fail_soft(conn, :upstream, _detail) do
    # Deliberately terse: no upstream status/reason leaks into visitor-facing
    # bodies or logs (the service modules log what matters server-side).
    conn
    |> put_status(:bad_gateway)
    |> json(%{error: "upstream_unavailable", live: false})
  end

  def fail_soft(conn, :not_configured, _detail) do
    conn
    |> put_status(:service_unavailable)
    |> json(%{error: "not_configured", live: false})
  end

  @doc "Maps a service-layer error tuple to its fail-soft response."
  @spec render_error(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def render_error(conn, error) do
    case error do
      :not_configured -> fail_soft(conn, :not_configured)
      {:upstream_status, 404} -> fail_soft(conn, :not_found, "upstream object not found")
      {:upstream_status, _status} -> fail_soft(conn, :upstream)
      {:upstream_unreachable, _reason} -> fail_soft(conn, :upstream)
      {:upstream_body, _reason} -> fail_soft(conn, :upstream)
      _other -> fail_soft(conn, :upstream)
    end
  end
end
