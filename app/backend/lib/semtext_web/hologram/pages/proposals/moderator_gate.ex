defmodule SemtextWeb.Hologram.Pages.Proposals.ModeratorGate do
  @moduledoc """
  Require an authenticated moderator (users.role == "moderator", admin
  counts) for the moderation page — page render AND its commands (Hologram
  middleware runs before both).

  Anonymous visitors go to GitHub login; signed-in non-moderators go back
  to browse. Mirrors the auth lane's `RequireAuth`/`RequireAdmin` pair;
  local because the proposals host cannot redirect to `/app` (a main-host
  path) — the fallbacks stay inside the proposals namespace.
  """

  use Hologram.Middleware

  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.Moderators

  def call(server, _opts) do
    case Auth.current_user(server) do
      nil ->
        Hologram.Server.put_redirect(server, "/auth/github")

      user ->
        if Moderators.moderator?(user) do
          Hologram.Server.put_stash(server, :current_user, user)
        else
          Hologram.Server.put_redirect(server, "/")
        end
    end
  end
end
