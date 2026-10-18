defmodule SemtextWeb.Plugs.RequireUser do
  @moduledoc """
  Enforces authentication for any route, over either transport (Bearer or
  session cookie — see `Semtext.Auth.CurrentUser`).

  Response shape depends on the request, or on opts when given:

  - JSON/API (`mode: :api`, or an `Accept` header that does not want HTML) →
    `401` **problem+json** (`application/problem+json`):
    `{"type","title","status","detail"}` — the proposals API error contract.
  - Pages (`mode: :page`, or an HTML `Accept`) → `302` to `/auth/github`
    (the only login path, design v2 §4).
  """

  @behaviour Plug
  import Plug.Conn

  @login_path "/auth/github"

  @impl true
  # <REMOVED UUID HERE> init :: auto-generated pointer for public function init
  def init(opts), do: Keyword.get(opts, :mode, :auto)

  @impl true
  # <REMOVED UUID HERE> call :: auto-generated pointer for public function call
  def call(conn, mode) do
    case Semtext.Auth.CurrentUser.resolve(conn) do
      {:ok, user} ->
        assign(conn, :current_user, user)

      :error ->
        deny(conn, mode)
    end
  end

  defp deny(conn, :api), do: problem_json(conn)
  defp deny(conn, :page), do: redirect_to_login(conn)

  defp deny(conn, :auto) do
    if html_request?(conn), do: redirect_to_login(conn), else: problem_json(conn)
  end

  defp html_request?(conn) do
    conn
    |> get_req_header("accept")
    |> List.first("")
    |> String.contains?("text/html")
  end

  defp problem_json(conn) do
    body =
      Jason.encode!(%{
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required"
      })

    conn
    |> put_resp_content_type("application/problem+json")
    |> send_resp(401, body)
    |> halt()
  end

  defp redirect_to_login(conn) do
    conn
    |> put_resp_header("location", @login_path)
    |> send_resp(302, "")
    |> halt()
  end
end
