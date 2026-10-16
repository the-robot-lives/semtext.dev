defmodule SemtextWeb.AuthControllerTest do
  @moduledoc """
  GitHub-only auth surface (design v2 §4):

  - every legacy auth route (email/password, magic-link, OTP, password
    reset, email verification, refresh, register, SAML, OIDC, other OAuth
    providers) and every legacy Hologram auth page 404s;
  - `GET /auth/session` (RequireUser) answers the session cookie OR Bearer;
  - `POST /auth/logout` clears the session;
  - `GET /api/v1/auth/me` keeps its Bearer contract;
  - the GitHub callback writes a Guardian access token + GitHub claims into
    the session cookie (tested at the controller action with a fake
    `%Ueberauth.Auth{}` — no live GitHub call).
  """

  use SemtextWeb.ConnCase, async: false

  alias Semtext.Auth.CurrentUser
  alias SemtextWeb.SSOController

  @legacy_api_routes [
    {:post, "/api/v1/auth/register"},
    {:post, "/api/v1/auth/login"},
    {:post, "/api/v1/auth/refresh"},
    {:post, "/api/v1/auth/sso/exchange"},
    {:post, "/api/v1/auth/magic-link"},
    {:post, "/api/v1/auth/magic-link/verify"},
    {:post, "/api/v1/auth/otp-login"},
    {:post, "/api/v1/auth/otp-login/verify"},
    {:post, "/api/v1/auth/password-reset"},
    {:post, "/api/v1/auth/password-reset/verify"},
    {:post, "/api/v1/auth/verify-email/confirm"},
    {:post, "/api/v1/auth/verify-email"},
    {:get, "/auth/oidc"},
    {:get, "/auth/oidc/callback"},
    {:get, "/auth/google"},
    {:get, "/auth/google/callback"},
    {:get, "/auth/facebook"},
    {:get, "/auth/linkedin"}
  ]

  @legacy_pages [
    "/login",
    "/signup",
    "/forgot-password",
    "/auth/verify-email",
    "/auth/verify",
    "/auth/sso-callback"
  ]

  describe "removed auth routes 404" do
    test "API + provider routes are gone at the router AND function level", %{conn: conn} do
      for {verb, path} <- @legacy_api_routes do
        resp =
          case verb do
            :get -> get(conn, path)
            :post -> post(conn, path)
          end

        assert resp.status == 404, "#{verb} #{path} must 404 (got #{resp.status})"
      end
    end

    test "legacy Hologram auth pages are gone", %{conn: conn} do
      for path <- @legacy_pages do
        resp = get(conn, path)
        assert resp.status == 404, "#{path} must 404 (got #{resp.status})"
      end
    end

    test "SAML is gone (router forward removed, handler module deleted)" do
      refute Code.ensure_loaded?(SemtextWeb.SamlHandler)
      paths = SemtextWeb.Router |> Phoenix.Router.routes() |> Enum.map(& &1.path)
      refute Enum.any?(paths, &String.starts_with?(&1, "/sso/saml"))
    end

    test "SSOCode and TokenStore modules are deleted (no Redis in the auth path)" do
      refute Code.ensure_loaded?(Semtext.Auth.SSOCode)
      refute Code.ensure_loaded?(Semtext.Auth.TokenStore)
    end
  end

  describe "GET /auth/session (RequireUser)" do
    test "401 problem+json when anonymous", %{conn: conn} do
      resp =
        conn
        |> put_req_header("accept", "application/json")
        |> get("/auth/session")

      assert resp.status == 401
      assert get_resp_header(resp, "content-type") |> hd() |> String.starts_with?("application/problem+json")

      assert %{"status" => 401, "title" => "Unauthorized", "type" => "about:blank"} =
               json_response(resp, 401)
    end

    test "302 to the GitHub login when a page request is anonymous", %{conn: conn} do
      resp =
        conn
        |> put_req_header("accept", "text/html")
        |> get("/auth/session")

      assert resp.status == 302
      assert get_resp_header(resp, "location") == ["/auth/github"]
    end

    test "200 with the session-cookie transport", %{conn: conn} do
      %{user: user} = setup_user_and_token()
      conn = login_as(conn, user, %{"github_login" => "octocat", "avatar_url" => "https://example.com/a.png"})

      resp =
        conn
        |> put_req_header("accept", "application/json")
        |> get("/auth/session")

      assert %{"user" => u} = json_response(resp, 200)
      assert u["id"] == user.id
      assert u["github_login"] == "octocat"
      assert u["avatar_url"] == "https://example.com/a.png"
      assert u["trust_tier"] == 0
      assert u["role"] == "user"
    end

    test "200 with the Bearer transport too", %{conn: conn} do
      %{user: user, access_token: token} = setup_user_and_token()

      resp =
        conn
        |> authenticated_conn(token)
        |> put_req_header("accept", "application/json")
        |> get("/auth/session")

      assert %{"user" => u} = json_response(resp, 200)
      assert u["id"] == user.id
    end
  end

  describe "POST /auth/logout" do
    test "clears the session", %{conn: conn} do
      %{user: user} = setup_user_and_token()
      conn = login_as(conn, user)

      resp = post(conn, "/auth/logout")
      assert json_response(resp, 200) == %{"ok" => true}
      assert get_session(resp, :access_token) == nil
    end
  end

  describe "GET /api/v1/auth/me (Bearer contract kept)" do
    test "returns current user when authenticated", %{conn: conn} do
      %{user: user, access_token: token} = setup_user_and_token()

      body =
        conn
        |> authenticated_conn(token)
        |> get("/api/v1/auth/me")
        |> json_response(200)

      assert body["user"]["id"] == user.id
    end

    test "returns 401 without token", %{conn: conn} do
      assert conn |> get("/api/v1/auth/me") |> json_response(401)
    end
  end

  describe "GitHub callback" do
    # test.exs pins sso_open: false (scaffold gate tests); production ships
    # true (config.exs). These callback tests assert the production behavior —
    # flip it on and restore afterwards.
    setup do
      Application.put_env(:semtext, :sso_open, true)
      on_exit(fn -> Application.put_env(:semtext, :sso_open, false) end)
      :ok
    end

    test "upserts the user and writes token + claims into the session", %{conn: conn} do
      conn =
        conn
        |> session_conn()
        |> assign(:ueberauth_auth, github_auth("octocat"))

      conn = SSOController.oauth_callback(conn, %{"provider" => "github"})

      assert conn.status == 302
      assert conn.resp_headers |> get_header("location") == "/app"

      token = get_session(conn, :access_token)
      assert is_binary(token) and token != ""

      {:ok, claims} = Semtext.Guardian.decode_and_verify(token, %{"typ" => "access"})
      assert claims["github_login"] == "octocat"
      assert claims["avatar_url"] == "https://avatars.githubusercontent.com/u/1"

      assert {:ok, user} = CurrentUser.resolve(conn)
      assert user.github_login == "octocat"
      assert user.trust_tier == 0
      assert user.role == "user"
    end

    test "a second login with the same GitHub login reuses the row", %{conn: conn} do
      conn
      |> session_conn()
      |> assign(:ueberauth_auth, github_auth("octocat"))
      |> SSOController.oauth_callback(%{"provider" => "github"})

      build_conn()
      |> session_conn()
      |> assign(:ueberauth_auth, github_auth("octocat"))
      |> SSOController.oauth_callback(%{"provider" => "github"})

      import Ecto.Query, only: [from: 2]

      rows =
        Semtext.Repo.all(from u in Semtext.Schema.Users.User, where: u.github_login == "octocat")

      assert length(rows) == 1
    end

    test "ueberauth failure redirects with an error code", %{conn: conn} do
      conn =
        conn
        |> session_conn()
        |> assign(:ueberauth_failure, %Ueberauth.Failure{})
        |> SSOController.oauth_callback(%{"provider" => "github"})

      assert conn.status == 302
      assert conn.resp_headers |> get_header("location") =~ "auth_error=github_failed"
    end
  end

  # A conn with the endpoint's real session configured, so put_session works:
  # Plug.Session.call registers the cookie-store config (a fixed test
  # secret_key_base satisfies the cookie store), then fetch_session loads the
  # (empty) session into the conn.
  defp session_conn(conn) do
    conn
    |> Map.put(:secret_key_base, String.duplicate("t", 64))
    |> Plug.Session.call(SemtextWeb.Plugs.Session.init(nil))
    |> fetch_session()
  end

  defp github_auth(login) do
    %Ueberauth.Auth{
      provider: :github,
      uid: 1,
      info: %Ueberauth.Auth.Info{
        email: "octocat@example.com",
        first_name: "Octo",
        last_name: "Cat",
        nickname: login,
        image: "https://avatars.githubusercontent.com/u/1",
        name: "Octo Cat"
      }
    }
  end

  defp get_header(headers, name) do
    case List.keyfind(headers, name, 0) do
      {_, value} -> value
      nil -> nil
    end
  end
end
