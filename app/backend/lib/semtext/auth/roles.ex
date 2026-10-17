defmodule Semtext.Auth.Roles do
  @moduledoc """
  `require_role(:moderator)` membership (design v2 §4): the `users.role`
  column is the single source of truth; `SemtextWeb.Plugs.RequireModerator`
  reads it. This module is the only writer.

  Grant/revoke: `mix semtext.grant_moderator <github_login> [--revoke]`
  (a thin wrapper over `set_moderator/2`).
  """

  alias Semtext.Repo
  alias Semtext.Schema.Users.User

  import Ecto.Query, only: [from: 2]

  @doc """
  Set (or clear) the site moderator role for the user with the given GitHub
  login. Returns `{:ok, user}` or `{:error, :not_found}`.
  """
  # <REMOVED UUID HERE> set_moderator :: auto-generated pointer for public function set_moderator
  def set_moderator(login, moderator?) when is_binary(login) and login != "" do
    role = if moderator?, do: "moderator", else: "user"
    login = String.trim(login)

    case Repo.one(
           from u in User,
             where: u.github_login == ^login,
             where: u.status != :deleted,
             limit: 1
         ) do
      nil ->
        {:error, :not_found}

      user ->
        user
        |> Ecto.Changeset.change(role: role)
        |> Repo.update()
    end
  end

  def set_moderator(_, _), do: {:error, :not_found}
end
