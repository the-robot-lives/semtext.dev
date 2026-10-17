defmodule SemtextWeb.TestAuthController do
  use SemtextWeb, :controller

  @moduledoc """
  Dev/test-only login stub (design §2 contract; Cypress + manual dev).

  `POST|GET /auth/test/login?github_login=<login>` signs that user in exactly
  like the GitHub callback does (Guardian access token into the session
  cookie) and redirects to `/`. The route is compiled ONLY when
  `config :semtext, :test_auth_login_route` is true (config.exs default
  `false`; dev.exs + test.exs opt in), and the action double-checks the flag
  at runtime, so it can never answer in a prod release even if a build were
  misconfigured.
  """

  alias Semtext.Test.Auth, as: TestAuth

  def login(conn, params) do
    unless Application.get_env(:semtext, :test_auth_login_route, false) do
      send_resp(conn, :not_found, "")
    else
      case TestAuth.resolve_user(params) do
        {:ok, user} ->
          claims = %{"github_login" => user.github_login}
          conn = TestAuth.login_as(conn, user, claims)
          redirect(conn, to: "/")

        {:error, :missing} ->
          conn
          |> put_status(:bad_request)
          |> json(%{error: "github_login or user_id required"})

        {:error, :not_found} ->
          conn |> put_status(:not_found) |> json(%{error: "no such user"})
      end
    end
  end
end
