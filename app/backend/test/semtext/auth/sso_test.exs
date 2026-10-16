defmodule Semtext.Auth.SSOTest do
  use Semtext.DataCase

  alias Semtext.Schema.Auth.Providers.Provider
  alias Semtext.Schema.Users.User

  setup do
    previous_domains = Application.get_env(:semtext, :sso_domains)
    previous_auto_approve = Application.get_env(:semtext, :sso_auto_approve_domains)
    previous_policies = Application.get_env(:semtext, :sso_domain_policies)
    previous_require_invite = Application.get_env(:semtext, :sso_require_invite)

    Application.put_env(:semtext, :sso_domains, %{})
    Application.put_env(:semtext, :sso_auto_approve_domains, [])
    Application.put_env(:semtext, :sso_domain_policies, %{})
    # Legacy auto-provision tests opt out explicitly; gate tests set true.
    Application.put_env(:semtext, :sso_require_invite, false)

    on_exit(fn ->
      Application.put_env(:semtext, :sso_domains, previous_domains)
      Application.put_env(:semtext, :sso_auto_approve_domains, previous_auto_approve)
      Application.put_env(:semtext, :sso_domain_policies, previous_policies)
      Application.put_env(:semtext, :sso_require_invite, previous_require_invite)
    end)
  end

  test "auto-provisioned SSO users are pending until profile completion" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: false)
    email = "sso-#{System.unique_integer([:positive])}@example.com"

    assert {:ok, session} =
             Semtext.Auth.SSO.authenticate_sso(:github, %{
               email: email,
               name: %{first: "Ada", last: "Lovelace"},
               sub: "github-#{System.unique_integer([:positive])}"
             })

    assert {:ref, Semtext.Users.User, user_id} = session.user

    user = Semtext.Repo.get!(User, user_id)
    assert user.email == email
    assert user.status == :pending
    assert user.verified == true
    assert user.profile_completed_at == nil
    assert user.mobile_phone == nil
  end

  test "auto-approved SSO domain creates active incomplete users" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: true)
    email = "sso-approved-#{System.unique_integer([:positive])}@example.com"

    assert {:ok, session} =
             Semtext.Auth.SSO.authenticate_sso("github", %{
               email: email,
               name: %{first: "Ada", last: "Lovelace"},
               sub: "github-approved-#{System.unique_integer([:positive])}"
             })

    assert {:ref, Semtext.Users.User, user_id} = session.user

    user = Semtext.Repo.get!(User, user_id)
    assert user.status == :active
    assert user.approved_at
    assert user.profile_completed_at == nil
  end

  test "SSO is rejected when the email domain has no policy (github-only, sso_open pinned off)" do
    ensure_provider!("GitHub", "GitHub OAuth")
    # example.com allows GitHub, but this identity is on a domain with NO
    # policy — with :sso_open false (test pin) the gate rejects it.
    set_sso_policy("example.com", ["github"], auto_approve: true)

    assert {:error, :sso_not_allowed} =
             Semtext.Auth.SSO.authenticate_sso(:github, %{
               email: "sso-disabled-#{System.unique_integer([:positive])}@unmapped.example",
               name: %{first: "Ada", last: "Lovelace"},
               sub: "github-disabled-#{System.unique_integer([:positive])}"
             })
  end

  # ── register open, app gated (Semtext.Auth.InviteGate) ────────────────────

  test "register open: unknown SSO identity without an invite is created :pending (both flag values)" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: false)

    for flag <- [true, false] do
      Application.put_env(:semtext, :sso_require_invite, flag)
      email = "gated-#{flag}-#{System.unique_integer([:positive])}@example.com"

      assert {:ok, session} =
               Semtext.Auth.SSO.authenticate_sso(:github, %{
                 email: email,
                 name: %{first: "Ada", last: "Lovelace"},
                 sub: "github-gated-#{System.unique_integer([:positive])}"
               })

      assert {:ref, Semtext.Users.User, user_id} = session.user
      user = Semtext.Repo.get!(User, user_id)
      assert user.status == :pending
      assert user.approved_at == nil
      assert Semtext.Auth.InviteGate.required?(user)
    end
  end

  test "register open: auto-approve SSO domain is :active for both flag values" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: true)

    for flag <- [true, false] do
      Application.put_env(:semtext, :sso_require_invite, flag)
      email = "auto-#{flag}-#{System.unique_integer([:positive])}@example.com"

      assert {:ok, session} =
               Semtext.Auth.SSO.authenticate_sso(:github, %{
                 email: email,
                 sub: "github-auto-#{System.unique_integer([:positive])}"
               })

      assert {:ref, Semtext.Users.User, user_id} = session.user
      user = Semtext.Repo.get!(User, user_id)
      assert user.status == :active
      refute Semtext.Auth.InviteGate.required?(user)
    end
  end

  test "existing pending SSO account still gets a session (the gate holds it, not login)" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: false)
    email = "repeat-#{System.unique_integer([:positive])}@example.com"
    attrs = %{email: email, sub: "github-repeat-#{System.unique_integer([:positive])}"}

    assert {:ok, _} = Semtext.Auth.SSO.authenticate_sso(:github, attrs)
    assert {:ok, session} = Semtext.Auth.SSO.authenticate_sso(:github, attrs)
    assert {:ref, Semtext.Users.User, user_id} = session.user
    assert Semtext.Repo.get!(User, user_id).status == :pending
  end

  test "an invalid invite token is rejected without provisioning" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: true)
    email = "gated-bad-#{System.unique_integer([:positive])}@example.com"

    assert {:error, :invalid_token} =
             Semtext.Auth.SSO.authenticate_sso(:github, %{
               email: email,
               invite_token: "definitely-not-a-real-token",
               sub: "github-gated-bad-#{System.unique_integer([:positive])}"
             })

    assert Semtext.Repo.get_by(User, email: email) == nil
  end

  test "valid invite provisions an active member and is redeemed" do
    ensure_provider!("GitHub", "GitHub OAuth")
    set_sso_policy("example.com", ["github"], auto_approve: false)
    email = "invited-#{System.unique_integer([:positive])}@example.com"

    org =
      Semtext.Repo.insert!(%Semtext.Schema.Organizations.Organization{
        slug: "invite-org-#{System.unique_integer([:positive])}",
        name: "Invite Org"
      })

    {:ok, invite, raw_token} =
      Semtext.Organizations.create_invite_token(%{
        organization_id: org.id,
        email: email,
        role: "member",
        starts_at: DateTime.add(DateTime.utc_now(), -60, :second),
        expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        max_uses: 1
      })

    assert {:ok, session} =
             Semtext.Auth.SSO.authenticate_sso(:github, %{
               email: email,
               invite_token: raw_token,
               name: %{first: "Ada", last: "Lovelace"},
               sub: "github-invited-#{System.unique_integer([:positive])}"
             })

    assert {:ref, Semtext.Users.User, user_id} = session.user

    # Invited identities are active + approved immediately (inviter vouches).
    user = Semtext.Repo.get!(User, user_id)
    assert user.status == :active
    assert user.approved_at

    # Membership at the inviter's chosen role, not a default viewer bump.
    assert {:ok, %{role: "member"}} =
             Semtext.Authz.authorize(user_id, "organization", org.id, "member")

    # The invite is consumed exactly once.
    token_schema = Semtext.Schema.Organizations.InviteToken
    consumed = Semtext.Repo.get!(token_schema, invite.id)
    assert consumed.uses == 1
    assert consumed.status == "accepted"

    # A second SSO hit with the same (now exhausted) token is a plain login
    # for the existing user, not a re-redemption.
    assert {:ok, _} =
             Semtext.Auth.SSO.authenticate_sso(:github, %{
               email: email,
               invite_token: raw_token,
               sub: "github-invited-#{System.unique_integer([:positive])}"
             })

    assert Semtext.Repo.get!(token_schema, invite.id).uses == 1
  end

  defp ensure_provider!(title, description) do
    id = UUID.uuid5(:oid, "Semtext.Schema.Auth.Providers.Provider@#{title}")

    Semtext.Repo.insert!(
      %Provider{id: id, title: title, description: description},
      on_conflict: :nothing,
      conflict_target: :id
    )
  end

  defp set_sso_policy(domain, providers, opts) do
    Application.put_env(:semtext, :sso_domain_policies, %{
      domain => %{providers: providers, auto_approve: Keyword.get(opts, :auto_approve, false)}
    })
  end
end
