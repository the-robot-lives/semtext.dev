defmodule SemtextWeb.AuthController do
  use SemtextWeb, :controller

  @moduledoc """
  GitHub-only auth surface (design v2 §4). Register/login/refresh, the
  magic-link / OTP / password-reset flows and email verification were all
  removed at the function level with their routes (github-only tests 404
  each one). What remains:

  - `GET  /auth/session` — current user for the session cookie (or Bearer
    via the `:authenticated` pipeline), RequireUser-protected.
  - `POST /auth/logout` — clear the session cookie token.
  - `GET  /auth/me` — legacy Bearer current-user (existing API clients).
  """

  alias Semtext.Auth.CurrentUser
  alias Semtext.Hologram.Auth, as: HoloAuth
  alias Semtext.Organizations

  # <REMOVED UUID HERE> session_user :: auto-generated pointer for public function session_user
  def session_user(conn, _params) do
    with user when is_map(user) <- Map.get(conn.assigns, :current_user),
         claims = session_claims(conn) do
      json(conn, %{user: HoloAuth.serialize_user(user, claims)})
    else
      _ -> conn |> put_status(:unauthorized) |> json(%{error: "Authentication required"})
    end
  end

  # <REMOVED UUID HERE> logout :: auto-generated pointer for public function logout
  def logout(conn, _params) do
    conn
    |> configure_session(renew: true)
    |> delete_session(:access_token)
    |> json(%{ok: true})
  end

  # <REMOVED UUID HERE> me :: auto-generated pointer for public function me
  def me(conn, _params) do
    session = Semtext.Guardian.Plug.current_resource(conn)
    user = CurrentUser.from_session!(session)
    orgs = Organizations.list_user_organizations(user.id)
    claims = session_claims(conn)

    conn
    |> put_status(:ok)
    |> json(%{user: HoloAuth.serialize_user(user, claims), organizations: orgs})
  end

  defp session_claims(conn) do
    # Bearer-only requests (the :authenticated pipeline) never fetch the
    # session — get_session would raise; treat it as no session claims.
    if Map.has_key?(conn.private, :plug_session) do
      case get_session(conn, :access_token) do
        token when is_binary(token) and token != "" ->
          case Semtext.Guardian.decode_and_verify(token, %{"typ" => "access"}) do
            {:ok, claims} -> claims
            _ -> %{}
          end

        _ ->
          %{}
      end
    else
      %{}
    end
  end
end
