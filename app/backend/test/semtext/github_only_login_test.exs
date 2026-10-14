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

  setup context do
    # Open-signup contract tests need the shipped flag value (config.exs
    # ships general_release: true); test.exs pins false so the scaffold
    # gate-machinery suite keeps its invite-only semantics. Flip locally.
    if context[:open_signup] do
      Application.put_env(:semtext, :feature_flags, %{general_release: true})
      on_exit(fn -> Application.put_env(:semtext, :feature_flags, %{general_release: false}) end)
    end

    :ok
  end

  @tag :open_signup
  test "shipped default is open signup: a fresh signup is active with no invite (design v2 D4)" do
    # Under the shipped flag value the gate is off entirely...
    refute Semtext.Auth.InviteGate.enabled?()

    # ...and the ONE signup rule returns :active for any new principal,
    # GitHub SSO or otherwise — InviteGate never holds accounts in P0.
    assert Semtext.Auth.InviteGate.signup_status("new@user.dev", :github, nil) == :active
    assert Semtext.Auth.InviteGate.signup_status("new@user.dev", nil, nil) == :active
  end

  test "config.exs ships general_release: true (test.exs re-pins it for gate tests)" do
    # config/config.exs is the shipped truth; test.exs intentionally hides it
    # (see the comment there), so pin the file content directly.
    shipped = File.read!(Path.expand("../../config/config.exs", __DIR__))
    assert shipped =~ ~r/general_release:\s*true/
  end

  test "GitHub login routes exist on the site router (ueberauth via SSOController)" do
    paths = SemtextWeb.Router |> Phoenix.Router.routes() |> Enum.map(& &1.path)

    # Dynamic provider routes: GET /auth/github and GET /auth/github/callback.
    assert "/auth/:provider" in paths
    assert "/auth/:provider/callback" in paths
    # Provider discovery + token exchange for Hologram-side sessions.
    assert "/api/v1/auth/sso/providers" in paths
    assert "/api/v1/auth/sso/exchange" in paths
  end

  # NOTE: the scaffold still ships /auth/register, /auth/magic-link and
  # /auth/password-reset routes (email+password login). P0 disables the
  # providers in config; route removal lands in P1 (design v2 D4) so the
  # dormant routes are intentionally not asserted here.
end
