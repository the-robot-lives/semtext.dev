defmodule SemtextWeb.Hologram.Middleware.RequireAuth do
  @moduledoc """
  Redirect unauthenticated visitors to GitHub login (the only login path),
  and hold invite-gated
  users (`Semtext.Auth.InviteGate`) at `/auth/invite-required`.

  Runs before a page renders AND before each of the page's commands, so a
  gated user can neither see nor drive an app page. Pages a gated user may
  still reach (the interstitial itself, profile, complete-registration)
  declare `middleware RequireAuth, invite: :exempt`.
  """
  use Hologram.Middleware

  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.InviteRequiredPage

  # <REMOVED UUID HERE> call :: auto-generated pointer for public function call
  def call(server, opts) do
    case Auth.current_user(server) do
      nil ->
        Hologram.Server.put_redirect(server, "/auth/github")

      user ->
        if Keyword.get(opts, :invite) != :exempt and Auth.user_needs_invite?(user) do
          Hologram.Server.put_redirect(server, InviteRequiredPage)
        else
          Hologram.Server.put_stash(server, :current_user, user)
        end
    end
  end
end
