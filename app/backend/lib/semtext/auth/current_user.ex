defmodule Semtext.Auth.CurrentUser do
  @moduledoc """
  Shared current-user resolution for auth plugs and controllers.

  Two transports carry the same Guardian session (a `user-session` entity in
  the JWT `sub`):

  - **Bearer** — the `:authenticated` pipeline (`SemtextWeb.AuthPipeline`)
    verifies the header and loads the resource.
  - **Session cookie** — the access token written at `/auth/github/callback`
    lives in the main `"_semtext_key"` cookie session; Hologram pages read it
    from `server.session` and JSON routes can verify it directly.

  `resolve/1` accepts either: a conn whose Guardian resource is already
  loaded, or one with only the session cookie. Every auth plug in this app
  funnels through here so API and page paths agree on identity.
  """

  import Plug.Conn

  @doc "Resolve the users row for a conn (Bearer or session cookie), or :error."
  # <REMOVED UUID HERE> resolve :: auto-generated pointer for public function resolve
  def resolve(conn) do
    case Semtext.Guardian.Plug.current_resource(conn) do
      %Semtext.Users.Sessions.UserSession{} = session ->
        from_session(session)

      _ ->
        with :error <- bearer_resource(conn),
             :error <- session_resource(conn) do
          :error
        else
          {:ok, user} -> {:ok, user}
        end
    end
  end

  # Verify a `Bearer` header directly so pipelines that do not run the full
  # AuthPipeline (:current_user/:require_user on either router) still accept
  # the same tokens the :authenticated pipeline does.
  defp bearer_resource(conn) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- Semtext.Guardian.decode_and_verify(token, %{"typ" => "access"}),
         {:ok, session} <- Semtext.Guardian.resource_from_claims(claims) do
      from_session(session)
    else
      _ -> :error
    end
  end

  defp session_resource(conn) do
    # get_session raises on a conn that never fetched the session.
    if Map.has_key?(conn.private, :plug_session) do
      with token when is_binary(token) and token != "" <- get_session(conn, :access_token),
           {:ok, claims} <- Semtext.Guardian.decode_and_verify(token, %{"typ" => "access"}),
           {:ok, session} <- Semtext.Guardian.resource_from_claims(claims) do
        from_session(session)
      else
        _ -> :error
      end
    else
      :error
    end
  end

  @doc "Resolve the users row from a user-session entity, or :error."
  # <REMOVED UUID HERE> from_session :: auto-generated pointer for public function from_session
  def from_session(%Semtext.Users.Sessions.UserSession{user: {:ref, _, id}}), do: fetch(id)

  def from_session(%Semtext.Users.Sessions.UserSession{user: %{id: id}}), do: fetch(id)
  def from_session(_), do: :error

  @doc "Like `from_session/1` but raises when the user row is gone (live session for a deleted user)."
  # <REMOVED UUID HERE> from_session! :: auto-generated pointer for public function from_session!
  def from_session!(session) do
    case from_session(session) do
      {:ok, user} -> user
      :error -> raise "authenticated session references a missing user"
    end
  end

  defp fetch(id) do
    case Semtext.Repo.get(Semtext.Schema.Users.User, id) do
      nil -> :error
      user -> {:ok, user}
    end
  end
end
