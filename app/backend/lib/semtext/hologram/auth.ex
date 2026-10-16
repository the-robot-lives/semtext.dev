defmodule Semtext.Hologram.Auth do
  @moduledoc """
  Server-side auth helpers for Hologram pages/commands.

  GitHub-only login (design v2 §4): `SemtextWeb.SSOController` upserts the
  user at `/auth/github/callback` and writes a Guardian access token into the
  main session cookie; pages read identity through this module. There is no
  refresh token and no server-side token store — the signed cookie session is
  the whole state (P1 decision; documented in the auth lane report). The JSON
  API keeps Bearer tokens for the existing `:authenticated` routes.
  """

  alias Semtext.Guardian
  alias Semtext.Organizations

  @type user_map :: map()
  @type org_map :: map()

  @doc "Current serialized user from the Hologram session, or nil."
  # <REMOVED UUID HERE> current_user :: Current serialized user from the Hologram session, or nil.
  def current_user(server) do
    case load_session_user(server) do
      {:ok, user, _orgs, claims} -> serialize_user(user, claims)
      _ -> nil
    end
  end

  @doc "Current user + organizations from the Hologram session."
  # <REMOVED UUID HERE> current_user_and_orgs :: Current user + organizations from the Hologram session.
  def current_user_and_orgs(server) do
    case load_session_user(server) do
      {:ok, user, orgs, claims} -> {serialize_user(user, claims), orgs}
      _ -> {nil, []}
    end
  end

  @doc "Clear the auth token from the Hologram session."
  # <REMOVED UUID HERE> logout :: Clear the auth token from the Hologram session.
  def logout(server) do
    server
    |> Hologram.Server.delete_session(:access_token)
    |> Hologram.Server.delete_user_id()
  end

  @invite_required_path "/auth/invite-required"

  @doc "The invite interstitial path (PATTERN.md `INVITE_REQUIRED_PATH`)."
  def invite_required_path, do: @invite_required_path

  @doc """
  True when the serialized user must stay at the invite interstitial. The
  server-computed `invite_required` flag is authoritative (admin and
  general-release exemptions applied); a map without it falls back to the
  gated statuses. Runs client-side too (transpiled), so plain map access only.
  """
  def user_needs_invite?(user) when is_map(user) do
    case Map.get(user, :invite_required) do
      flag when is_boolean(flag) ->
        flag

      _ ->
        Map.get(user, :status) in [:pending, :waitlist, :unverified, "pending", "waitlist", "unverified"]
    end
  end

  def user_needs_invite?(_), do: false

  @doc """
  Post-auth destination after the GitHub callback.

  - held by the invite gate → `/auth/invite-required`
  - otherwise → `/app` (dashboard)
  """
  # <REMOVED UUID HERE> post_auth_path :: Post-auth destination after the GitHub callback.
  def post_auth_path(user) when is_map(user) do
    if user_needs_invite?(user), do: @invite_required_path, else: "/app"
  end

  def post_auth_path(_), do: "/app"

  @doc """
  Redeem an invite for the signed-in Hologram user. Hologram commands bypass
  the router's rate-limit pipeline, so the same Hammer guard the REST redeem
  route gets (5/min per IP) is applied here.

  Returns `{:ok, serialized_user}` or `{:error, code}` with `code` one of
  `"invalid"`, `"used"`, `"rate_limited"`, `"unauthenticated"`, `"empty"`,
  `"failure"` (the `<noizu-invite-gate>` error codes).
  """
  def redeem_invite(server, raw_token, ip \\ nil) do
    token = optional_string(raw_token)
    ip = ip || Map.get(server, :ip) || "unknown"

    with {:token, token} when is_binary(token) <- {:token, token},
         {:allow, _} <- Hammer.check_rate("invite_redeem:#{inspect(ip)}", 60_000, 5),
         {:ok, user, _orgs, _claims} <- load_session_user(server),
         {:ok, _invite} <- Semtext.Auth.InviteGate.redeem(user, token) do
      {:ok, user} = Semtext.Users.get_user(user.id, Noizu.Context.system())
      {:ok, serialize_user(user)}
    else
      {:token, _} -> {:error, "empty"}
      {:deny, _} -> {:error, "rate_limited"}
      :error -> {:error, "unauthenticated"}
      {:error, :invalid_token} -> {:error, "invalid"}
      {:error, :invite_exhausted} -> {:error, "used"}
      _ -> {:error, "failure"}
    end
  end

  @doc "User-facing copy for a failed redeem (PATTERN.md `inviteRedeemErrorMessage`)."
  def invite_error_message("invalid"), do: "That invite code is invalid or has expired. Check it and try again."
  def invite_error_message("used"), do: "That invite code has already been used."
  def invite_error_message("rate_limited"), do: "Too many attempts. Wait a minute and try again."
  def invite_error_message("unauthenticated"), do: "Your session has ended. Log in again to redeem your invite."
  def invite_error_message("empty"), do: "Enter your invite code."
  def invite_error_message(_), do: "Could not redeem the invite. Try again."

  @doc "SSO providers enabled for this deployment. GitHub only (design v2 §4)."
  # <REMOVED UUID HERE> sso_catalog :: SSO providers enabled for this deployment. GitHub only (design v2 §4).
  def sso_catalog do
    providers =
      []
      |> maybe_add(:github_enabled, "github")

    %{
      providers: providers,
      domains: Semtext.Auth.SSODomains.providers_map(),
      domain_policies: Semtext.Auth.SSODomains.public_policies(),
      # GitHub-only + open domain policy: no invite is ever required to sign up.
      invite_required: false,
      sso_open: Semtext.Auth.SSODomains.open?()
    }
  end

  # <REMOVED UUID HERE> sso_path :: auto-generated pointer for public function sso_path
  def sso_path("github"), do: "/auth/github"

  # SSO entry URL carrying an invite across the IdP round-trip. Empty/blank
  # tokens get the plain path.
  def sso_invite_path("github", token) when is_binary(token) do
    if String.trim(token) == "" do
      sso_path("github")
    else
      sso_path("github") <> "?invite=" <> URI.encode_www_form(token)
    end
  end

  def sso_invite_path(provider, _token), do: sso_path(provider)

  # <REMOVED UUID HERE> sso_label :: auto-generated pointer for public function sso_label
  def sso_label("github"), do: "Sign in with GitHub"

  # <REMOVED UUID HERE> serialize_user :: auto-generated pointer for public function serialize_user
  @doc "Serialize a user for Hologram state / API responses. `claims` carries the GitHub avatar/login from the token."
  def serialize_user(user, claims \\ %{})

  def serialize_user(user, claims) when is_map(user) do
    admin? =
      Map.get(user, :admin, false) == true or Map.get(user, :is_admin, false) == true

    role = Map.get(user, :role) || "user"

    %{
      id: user.id,
      email: user.email,
      user_name: user.user_name,
      handle: user.handle,
      mobile_phone: Map.get(user, :mobile_phone),
      github_login: Map.get(user, :github_login) || claims["github_login"] || claims[:github_login],
      avatar_url: claims["avatar_url"] || claims[:avatar_url],
      trust_tier: Map.get(user, :trust_tier, 0),
      role: role,
      is_moderator: role == "moderator" or admin?,
      status: user.status,
      verified: user.verified,
      profile_completed_at: Map.get(user, :profile_completed_at),
      profile_complete: !!Map.get(user, :profile_completed_at),
      requires_profile_completion: !Map.get(user, :profile_completed_at),
      is_admin: admin?,
      admin: admin?,
      # Authoritative routing flag (admin + general-release exemptions applied).
      invite_required: Semtext.Auth.InviteGate.required?(user)
    }
  end

  def serialize_user(_, _), do: nil

  # ── private ──────────────────────────────────────────────────

  defp load_session_user(server) do
    token = Hologram.Server.get_session(server, :access_token)

    with true <- is_binary(token) and token != "",
         {:ok, claims} <- Guardian.decode_and_verify(token, %{"typ" => "access"}),
         {:ok, session} <- Guardian.resource_from_claims(claims) do
      user = resolve_user_from_session(session)
      orgs = Organizations.list_user_organizations(user.id)
      {:ok, user, orgs, claims}
    else
      _ -> :error
    end
  end

  @doc "Issue an access token for an existing user session entity (GitHub callback)."
  # <REMOVED UUID HERE> issue_tokens_from_session :: Issue an access token for an existing user session entity (GitHub callback).
  def issue_tokens_from_session(server, session, claims \\ %{}) do
    with {:ok, access_token, _} <-
           Guardian.encode_and_sign(session, claims,
             token_type: "access",
             ttl: Application.get_env(:semtext, :session_ttl, {7, :day})
           ) do
      user = resolve_user_from_session(session)
      orgs = Organizations.list_user_organizations(user.id)

      server =
        server
        |> Hologram.Server.put_session(:access_token, access_token)
        |> Hologram.Server.put_user_id(user.id)

      {:ok, server, serialize_user(user, claims), orgs}
    end
  end

  defp resolve_user_from_session(%Semtext.Users.Sessions.UserSession{} = session) do
    case session.user do
      {:ref, _, id} ->
        {:ok, user} = Semtext.Users.get_user(id, Noizu.Context.system())
        user

      %Semtext.Users.User{} = user ->
        user
    end
  end

  defp optional_string(value) when is_binary(value) do
    value = String.trim(value)
    if value == "", do: nil, else: value
  end

  defp optional_string(_), do: nil

  defp maybe_add(list, flag, name) do
    if Application.get_env(:semtext, flag, false), do: list ++ [name], else: list
  end
end
