defmodule Semtext.Test.Auth do
  @moduledoc """
  Test-env session stub (design §2 contract) for ExUnit and Cypress.

  - `Semtext.Test.Auth.login_as(conn, user)` — signs a user into a
    `Phoenix.ConnTest` conn exactly like the GitHub callback (Guardian access
    token in the session cookie). Use in ConnCase tests.
  - `Semtext.Test.Auth.login_as_server(server, user)` — same for a Hologram
    server map (page/command tests).
  - `POST /auth/test/login` — the dev/test-only route (compile-gated, see
    `SemtextWeb.TestAuthController`).

  The functions here are safe by construction in prod: the conn/server
  helpers only run inside a test process's sandbox, and the route cannot
  compile without an explicit opt-in config flag.
  """

  alias Semtext.Guardian

  @doc "Sign `user` into a Plug conn (session cookie), like the GitHub callback."
  # <REMOVED UUID HERE> login_as :: auto-generated pointer for public function login_as
  def login_as(conn, user, claims \\ %{}) do
    {:ok, session} = create_session(user)
    {:ok, token, _} = Guardian.encode_and_sign(session, claims, token_type: "access", ttl: {1, :hour})
    Plug.Conn.put_session(conn, :access_token, token)
  end

  @doc "Sign `user` into a Hologram server map (page/command tests)."
  # <REMOVED UUID HERE> login_as_server :: auto-generated pointer for public function login_as_server
  def login_as_server(server, user, claims \\ %{}) do
    {:ok, session} = create_session(user)
    {:ok, token, _} = Guardian.encode_and_sign(session, claims, token_type: "access", ttl: {1, :hour})

    server
    |> Hologram.Server.put_session(:access_token, token)
    |> Hologram.Server.put_user_id(user.id)
  end

  @doc "Resolve the target user for the test login route (`github_login` | `user_id`)."
  # <REMOVED UUID HERE> resolve_user :: auto-generated pointer for public function resolve_user
  def resolve_user(%{"github_login" => login}) when is_binary(login) and login != "" do
    import Ecto.Query, only: [from: 2]

    case Semtext.Repo.one(
           from u in Semtext.Schema.Users.User,
             where: u.github_login == ^login,
             where: u.status != :deleted,
             limit: 1
         ) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  def resolve_user(%{"user_id" => id}) when is_binary(id) and id != "" do
    case Semtext.Repo.get(Semtext.Schema.Users.User, id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  def resolve_user(_params), do: {:error, :missing}

  defp create_session(user) do
    %Semtext.Users.Sessions.UserSession{
      user: {:ref, Semtext.Users.User, user.id},
      status: :active,
      details: %{auth_method: "test_stub"}
    }
    |> Semtext.EntityRepo.create(Noizu.Context.system())
  end
end
