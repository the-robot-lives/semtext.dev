defmodule Semtext.GithubOnlyLoginTest do
  use ExUnit.Case, async: true

  # Design v2 D4: GitHub is the only login provider at P0. The runtime config
  # hard-trims every other Ueberauth provider regardless of environment —
  # these assertions pin that contract so a future config change cannot
  # silently re-enable one.

  @disabled_providers [
    :google,
    :facebook,
    :linkedin,
    :oidc,
    :saml
  ]

  test "every non-GitHub Ueberauth provider is disabled" do
    for provider <- @disabled_providers do
      assert Application.get_env(:semtext, :"#{provider}_enabled") == false,
             "provider #{provider} must stay disabled (design v2 D4)"
    end
  end

  test "open signup is on (InviteGate stops holding accounts)" do
    flags = Application.get_env(:semtext, :feature_flags, [])
    assert flags[:general_release] == true
  end

  test "GitHub login routes exist on the site router (ueberauth via SSOController)" do
    paths = SemtextWeb.Router |> Phoenix.Router.routes() |> Enum.map(& &1.path)

    # Dynamic provider routes: GET /auth/github and GET /auth/github/callback.
    assert "/auth/:provider" in paths
    assert "/auth/:provider/callback" in paths
    # Provider discovery + token exchange for Hologram-side sessions.
    assert "/auth/sso/providers" in paths
  end

  # NOTE: the scaffold still ships /auth/register, /auth/magic-link and
  # /auth/password-reset routes (email+password login). P0 disables the
  # providers in config; route removal lands in P1 (design v2 D4) so the
  # dormant routes are intentionally not asserted here.
end
