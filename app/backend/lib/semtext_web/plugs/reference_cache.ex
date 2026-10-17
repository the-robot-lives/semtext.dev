defmodule SemtextWeb.Plugs.ReferenceCache do
  @moduledoc """
  Reference-section caching (design v2 §2.3): the /reference pages are
  generated artifacts rebuilt on deploy, so browsers may serve them for
  5 minutes and refresh them in the background (stale-while-revalidate)
  for a day. GET/HEAD on /reference and /reference/:element only — the
  API scopes are untouched.
  """

  @behaviour Plug

  @impl true
  def init(opts), do: opts

  @impl true
  def call(%Plug.Conn{method: m} = conn, _opts) when m in ["GET", "HEAD"] do
    case conn.path_info do
      ["reference" | _] ->
        # CSS/image-safe: the section is static; the render panes'
        # hydration is idempotent, so a stale page is harmless.
        Plug.Conn.put_resp_header(
          conn,
          "cache-control",
          "public, max-age=300, stale-while-revalidate=86400"
        )

      _ ->
        conn
    end
  end

  def call(conn, _opts), do: conn
end
