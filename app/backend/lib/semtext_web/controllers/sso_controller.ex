defmodule SemtextWeb.SSOController do
  use SemtextWeb, :controller

  # Ueberauth's request phase HALTS (302 to GitHub) before the controller
  # action runs, so the invite stash must happen in a plug declared BEFORE
  # `plug Ueberauth`. Anything in the `oauth_request/2` action body is dead
  # code on the request phase — it only runs if a configured strategy does
  # not redirect.
  plug :prepare_oauth when action in [:oauth_request]
  plug Ueberauth when action in [:oauth_request, :oauth_callback]

  @moduledoc """
  GitHub-only login (design v2 §4).

  The callback upserts the user (`Semtext.Auth.SSO.authenticate_sso/2`),
  issues a Guardian access token **with the GitHub avatar/login as claims**,
  and writes it straight into the main `_semtext_key` session cookie the
  Hologram pages read. No SSO code exchange, no separate SSO cookie, no
  refresh-token store — P1 sessions are cookie/DB-only and Redis is out of
  the auth path entirely.
  """

  alias Semtext.Guardian
  alias Semtext.Hologram.Auth, as: HoloAuth
  alias Semtext.Auth.CurrentUser

  # <REMOVED UUID HERE> providers :: auto-generated pointer for public function providers
  def providers(conn, _params) do
    providers =
      []
      |> maybe_add(:github_enabled, "github")

    json(conn, %{
      providers: providers,
      domains: Semtext.Auth.SSODomains.providers_map(),
      domain_policies: Semtext.Auth.SSODomains.public_policies(),
      sso_open: Semtext.Auth.SSODomains.open?(),
      # Register open, app gated: an invite is never required to sign up
      # (Semtext.Auth.InviteGate); kept for client compatibility.
      invite_required: false
    })
  end

  # ── GitHub OAuth (Ueberauth) ──────────────────────────────────

  # <REMOVED UUID HERE> oauth_request :: auto-generated pointer for public function oauth_request
  # Reached only when a configured strategy does NOT redirect on its request
  # phase. Ueberauth's github strategy is an OAuth redirect strategy, so in
  # practice Ueberauth halts before this runs; the invite was already stashed
  # by `prepare_oauth`. A 404 keeps a future pass-through strategy from
  # silently rendering nothing.
  def oauth_request(conn, _params), do: send_resp(conn, :not_found, "")

  # <REMOVED UUID HERE> oauth_callback :: auto-generated pointer for public function oauth_callback
  def oauth_callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    handle_sso_callback(conn, %{
      email: auth.info.email,
      name: %{first: auth.info.first_name || "", last: auth.info.last_name || ""},
      uid: to_string(auth.uid),
      sub: to_string(auth.uid),
      login: auth.info.nickname,
      avatar_url: auth.info.image,
      invite_token: take_stashed_invite(conn)
    })
  end

  def oauth_callback(%{assigns: %{ueberauth_failure: _}} = conn, _params) do
    redirect_with_error(conn, "github_failed")
  end

  # ── Helpers ──────────────────────────────────────────────────

  defp handle_sso_callback(conn, attrs) do
    conn = clear_sso_session(conn)

    case Semtext.Auth.SSO.authenticate_sso(:github, attrs) do
      {:ok, session} ->
        user = CurrentUser.from_session!(session)
        claims = %{"github_login" => attrs[:login], "avatar_url" => attrs[:avatar_url]}

        {:ok, access_token, _} =
          Guardian.encode_and_sign(session, claims, token_type: "access", ttl: session_ttl())

        conn
        |> put_session(:access_token, access_token)
        |> redirect(to: HoloAuth.post_auth_path(HoloAuth.serialize_user(user, claims)))

      {:error, :user_not_provisioned} ->
        redirect_with_error(conn, "not_provisioned")

      {:error, reason} when reason in [:invalid_token, :invite_exhausted] ->
        redirect_with_error(conn, "invalid_invite")

      {:error, :sso_not_allowed} ->
        redirect_with_error(conn, "sso_unavailable")

      {:error, _} ->
        redirect_with_error(conn, "github_failed")
    end
  end

  defp redirect_with_error(conn, error) do
    conn
    |> clear_sso_session()
    |> redirect(to: "/?auth_error=" <> URI.encode_www_form(error))
  end

  # The stashed invite token rides the flow's lifecycle: cleared once the
  # callback resolves (success or failure).
  defp clear_sso_session(conn) do
    delete_session(conn, :sso_invite_token)
  end

  # Stashes the invite BEFORE `plug Ueberauth` runs: the request phase
  # redirects+halts (see Ueberauth.Strategies.Helpers.redirect!/2), so an
  # invite placed anywhere after it — including an action body — is dropped
  # before it reaches the IdP round-trip.
  defp prepare_oauth(conn, _opts), do: stash_invite_token(conn, conn.params)

  # An invite presented as `?invite=<raw token>` on the provider entry URL
  # survives the GitHub redirect round-trip in the signed session cookie.
  # Never logged, never echoed; consumed by the callback via take_stashed_invite/1.
  defp stash_invite_token(conn, params) do
    case params["invite"] do
      token when is_binary(token) and token != "" ->
        put_session(conn, :sso_invite_token, token)

      _ ->
        conn
    end
  end

  defp take_stashed_invite(conn) do
    get_session(conn, :sso_invite_token)
  end

  # Cookie-session lifetime (P1: no refresh tokens — see the moduledoc).
  defp session_ttl, do: Application.get_env(:semtext, :session_ttl, {7, :day})

  defp maybe_add(list, flag, name) do
    if Application.get_env(:semtext, flag), do: [name | list], else: list
  end
end
