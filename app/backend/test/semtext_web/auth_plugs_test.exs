defmodule SemtextWeb.AuthPlugsTest do
  @moduledoc """
  P1 auth lane enforcement surfaces:

  - `SemtextWeb.Plugs.RequireUser` — 401 problem+json for API requests,
    302 to `/auth/github` for page requests, pass when a user is resolved;
  - `SemtextWeb.Plugs.RequireModerator` — 403/302 unless
    `users.role == "moderator"` (or admin);
  - `Semtext.Auth.Roles.set_moderator/2` + the `mix semtext.grant_moderator`
    wrapper — grants and revokes via the role column;
  - `Semtext.Test.Auth` — the design §2 login stub, including the
    compile-gated `POST /auth/test/login` route (present in test config).
  """

  use SemtextWeb.ConnCase, async: false

  alias SemtextWeb.Plugs.{RequireModerator, RequireUser}

  defp anon_conn(mode, accept) do
    build_conn()
    |> Map.put(:secret_key_base, String.duplicate("t", 64))
    |> Plug.Session.call(SemtextWeb.Plugs.Session.init(nil))
    |> fetch_session()
    |> put_req_header("accept", accept)
    |> RequireUser.call(mode)
  end

  describe "RequireUser" do
    test "passes a resolved user through", %{conn: conn} do
      %{user: user} = setup_user_and_token()
      conn = login_as(conn, user)

      conn =
        conn
        |> SemtextWeb.Plugs.CurrentUser.call([])
        |> RequireUser.call(:auto)

      refute conn.halted
      assert conn.assigns.current_user.id == user.id
    end

    test "401 problem+json for an anonymous API request" do
      conn = anon_conn(:api, "application/json")

      assert conn.status == 401
      assert conn.halted
      assert get_resp_header(conn, "content-type") |> hd() |> String.starts_with?("application/problem+json")
      assert %{"status" => 401, "title" => "Unauthorized"} = json_response(conn, 401)
    end

    test "302 to /auth/github for an anonymous page request" do
      conn = anon_conn(:page, "text/html")

      assert conn.status == 302
      assert get_resp_header(conn, "location") == ["/auth/github"]
    end

    test "auto mode sends an anonymous page browser to the login and an API client a 401" do
      assert anon_conn(:auto, "text/html").status == 302
      assert anon_conn(:auto, "application/json").status == 401
    end
  end

  describe "RequireModerator" do
    test "passes a moderator and assigns :moderator_user", %{conn: conn} do
      %{user: user} = user_with_role("moderator")
      conn = login_as(conn, user)

      conn =
        conn
        |> SemtextWeb.Plugs.CurrentUser.call([])
        |> RequireUser.call(:auto)
        |> RequireModerator.call([])

      refute conn.halted
      assert conn.assigns.moderator_user.id == user.id
    end

    test "403 problem+json for a plain user on an API request", %{conn: conn} do
      %{user: user} = setup_user_and_token()
      conn = login_as(conn, user)

      conn =
        conn
        |> put_req_header("accept", "application/json")
        |> SemtextWeb.Plugs.CurrentUser.call([])
        |> RequireUser.call(:auto)
        |> RequireModerator.call([])

      assert conn.status == 403
      assert conn.halted
      assert %{"status" => 403, "title" => "Forbidden"} = json_response(conn, 403)
    end

    test "302 home for a plain user on a page request", %{conn: conn} do
      %{user: user} = setup_user_and_token()
      conn = login_as(conn, user)

      conn =
        conn
        |> put_req_header("accept", "text/html")
        |> SemtextWeb.Plugs.CurrentUser.call([])
        |> RequireUser.call(:auto)
        |> RequireModerator.call([])

      assert conn.status == 302
      assert get_resp_header(conn, "location") == ["/"]
    end

    test "an admin flag also satisfies the moderator check", %{conn: conn} do
      %{user: user} = user_with_role("user", admin: true)
      conn = login_as(conn, user)

      conn =
        conn
        |> SemtextWeb.Plugs.CurrentUser.call([])
        |> RequireUser.call(:auto)
        |> RequireModerator.call([])

      refute conn.halted
    end
  end

  describe "moderator role grant" do
    test "set_moderator grants by github_login and reverts to user", %{conn: _conn} do
      %{user: user} = setup_user_and_token()
      login = "mod#{System.unique_integer([:positive])}"

      {:ok, user} =
        user
        |> Ecto.Changeset.change(github_login: login)
        |> Semtext.Repo.update()

      assert {:ok, mod} = Semtext.Auth.Roles.set_moderator(login, true)
      assert mod.id == user.id and mod.role == "moderator"
      assert Semtext.Repo.get!(Semtext.Schema.Users.User, user.id).role == "moderator"

      assert {:ok, plain} = Semtext.Auth.Roles.set_moderator(login, false)
      assert plain.role == "user"
    end

    test "set_moderator on an unknown login is :not_found" do
      assert Semtext.Auth.Roles.set_moderator("definitely-not-#{System.unique_integer([:positive])}", true) ==
               {:error, :not_found}
    end

    test "the mix task wrapper exits non-zero on an unknown login" do
      # Run in-process with the quiet shell (the test VM has no real CLI).
      previous = Mix.shell()
      Mix.shell(Mix.Shell.Process)

      code =
        try do
          Mix.Task.run("semtext.grant_moderator", ["definitely-not-#{System.unique_integer([:positive])}"])
          0
        catch
          :exit, {:shutdown, 1} -> 1
          :exit, code when is_integer(code) -> code
        after
          Mix.shell(previous)
          Mix.Task.clear()
        end

      assert code != 0
    end
  end

  describe "test login stub" do
    test "the route answers when the flag is on (test config)", %{conn: conn} do
      %{user: user} = setup_user_and_token()
      {:ok, user} = Ecto.Changeset.change(user, github_login: "stubuser") |> Semtext.Repo.update()

      conn = post(conn, "/auth/test/login?github_login=stubuser")

      assert conn.status == 302
      token = get_session(conn, :access_token)
      assert is_binary(token) and token != ""
      assert {:ok, resolved} = Semtext.Auth.CurrentUser.resolve(conn)
      assert resolved.id == user.id
    end

    test "the route is compiled in under test config (config.exs default is false)" do
      # config.exs ships :test_auth_login_route false; test.exs raises it —
      # so the route exists here and cannot exist in a default build.
      assert Application.get_env(:semtext, :test_auth_login_route) == true

      paths = SemtextWeb.Router |> Phoenix.Router.routes() |> Enum.map(& &1.path)
      assert "/auth/test/login" in paths
    end
  end

  defp user_with_role(role, opts \\ []) do
    %{user: user} = ctx = setup_user_and_token()

    {:ok, user} =
      user
      |> Ecto.Changeset.change([role: role] ++ opts)
      |> Semtext.Repo.update()

    %{ctx | user: user}
  end
end
