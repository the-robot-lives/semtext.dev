defmodule Semtext.GithubOnlyLoginTest do
  @moduledoc """
  Design v2 §4 (P1): GitHub is the ONLY login path.

  - every non-GitHub provider is config-disabled at runtime (D4);
  - the domain policy is OPEN (`:sso_open` — any email, auto-approve);
  - every legacy route (email/password, magic-link, OTP, reset, verify,
    refresh, SAML, OIDC, other OAuth) and legacy auth page 404s;
  - the moderator grant surface exists (`users.role` + mix task).
  """

  use SemtextWeb.ConnCase, async: false

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
             "provider #{provider} must stay disabled (design v2 §4)"
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
  test "shipped default is open signup: a fresh signup is active with no invite (design v2 §4)" do
    refute Semtext.Auth.InviteGate.enabled?()

    assert Semtext.Auth.InviteGate.signup_status("new@user.dev", :github, nil) == :active
    assert Semtext.Auth.InviteGate.signup_status("new@user.dev", nil, nil) == :active
  end

  test "config.exs ships general_release: true and sso_open: true (test.exs re-pins both)" do
    shipped = File.read!(Path.expand("../../config/config.exs", __DIR__))
    assert shipped =~ ~r/general_release:\s*true/
    assert shipped =~ ~r/:sso_open,\s*true/
  end

  test "SSODomains is open under the shipped flag and closed under the test pin" do
    # test.exs pin in force during the suite:
    refute Semtext.Auth.SSODomains.open?()
    refute Semtext.Auth.SSODomains.sso_available?("anyone@example.com", :github)

    Application.put_env(:semtext, :sso_open, true)
    on_exit(fn -> Application.put_env(:semtext, :sso_open, false) end)

    assert Semtext.Auth.SSODomains.open?()
    assert Semtext.Auth.SSODomains.sso_available?("anyone@example.com", :github)
    assert Semtext.Auth.SSODomains.auto_approve?("anyone@example.com", :github)
  end

  test "GitHub routes exist, explicit and exclusive (no provider catch-all)" do
    paths = SemtextWeb.Router |> Phoenix.Router.routes() |> Enum.map(& &1.path)

    assert "/auth/github" in paths
    assert "/auth/github/callback" in paths
    assert "/auth/logout" in paths
    assert "/auth/session" in paths
    assert "/api/v1/auth/sso/providers" in paths

    # The old catch-all + exchange are gone.
    refute "/auth/:provider" in paths
    refute "/auth/:provider/callback" in paths
    refute "/api/v1/auth/sso/exchange" in paths
  end

  test "any other provider path 404s", %{conn: conn} do
    for path <- [
          "/auth/google",
          "/auth/facebook",
          "/auth/linkedin",
          "/auth/oidc",
          "/sso/saml/auth/signin"
        ] do
      assert get(conn, path).status == 404, "#{path} must 404"
    end
  end

  test "the moderator grant surface exists" do
    assert Code.ensure_loaded?(Mix.Tasks.Semtext.GrantModerator)
    assert function_exported?(SemtextWeb.Plugs.RequireModerator, :call, 2)

    schema_fields = Semtext.Schema.Users.User.__schema__(:fields)
    assert :github_login in schema_fields
    assert :trust_tier in schema_fields
    assert :role in schema_fields
  end

  test "the legacy email/password + SMS surfaces are removed at the FUNCTION level" do
    Code.ensure_loaded!(SemtextWeb.AuthController)
    Code.ensure_loaded!(Semtext.Hologram.Auth)

    for {mod, fun} <- [
          {SemtextWeb.AuthController, :register},
          {SemtextWeb.AuthController, :login},
          {SemtextWeb.AuthController, :refresh},
          {SemtextWeb.AuthController, :request_magic_link},
          {SemtextWeb.AuthController, :verify_magic_link},
          {SemtextWeb.AuthController, :request_otp_login},
          {SemtextWeb.AuthController, :verify_otp_login},
          {SemtextWeb.AuthController, :request_password_reset},
          {SemtextWeb.AuthController, :verify_password_reset},
          {SemtextWeb.AuthController, :verify_email},
          {SemtextWeb.AuthController, :send_verification},
          {Semtext.Hologram.Auth, :login},
          {Semtext.Hologram.Auth, :register},
          {SemtextWeb.SSOController, :oidc_init},
          {SemtextWeb.SSOController, :oidc_callback},
          {SemtextWeb.SSOController, :exchange}
        ] do
      refute function_exported?(mod, fun, 2), "#{inspect(mod)}.#{fun}/2 must be removed"
    end
  end
end
