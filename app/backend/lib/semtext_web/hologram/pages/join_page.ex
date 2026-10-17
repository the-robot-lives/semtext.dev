defmodule SemtextWeb.Hologram.Pages.JoinPage do
  @moduledoc """
  `/join/:token` — an invite link's landing page.

  Resolves the token server-side (validity oracle, same rules as
  `InviteTokenController.lookup/2`), shows who you're joining, then hands off:
  the GitHub button carries `?invite=` so the token survives the IdP
  round-trip. (P1 github-only: there is no password signup form.)
  """
  use Hologram.Page

  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Layouts.MainLayout

  route "/join/:token"
  layout MainLayout, page_title: "Join"

  def init(params, component, _server) do
    catalog = Auth.sso_catalog()
    token = Map.get(params, "token") || Map.get(params, :token) || ""

    component =
      put_state(component,
        token: token,
        status: "checking",
        organization_name: "",
        role: "",
        loading: false,
        sso_providers: catalog.providers
      )

    put_command(component, :lookup, token: token)
  end

  def template do
    ~HOLO"""
    <div class="content">
      <h1 class="sg-page-title">Join</h1>

      {%if @status == "checking"}
        <p class="app-muted">Checking your invite…</p>
      {/if}

      {%if @status == "invalid"}
        <p class="sg-error" role="alert">
          This invite link is invalid or has expired. Ask your inviter for a new one.
        </p>
        <p><a href="/" class="btn btn-outline">Back to home</a></p>
      {/if}

      {%if @status == "valid"}
        {%if @organization_name != ""}
          <p class="sg-auth__invite-note">
            You've been invited to join <strong>{@organization_name}</strong>
            as <strong>{@role}</strong>.
          </p>
        {/if}

        {%if @sso_providers != []}
          <div class="sg-stack">
            {%for provider <- @sso_providers}
              <a href={Auth.sso_invite_path(provider, @token)} class="btn btn-black">
                {Auth.sso_label(provider)}
              </a>
            {/for}
          </div>
        {/if}
      {/if}
    </div>
    """
  end

  # -- actions ----------------------------------------------------------------

  def action(:invite_ok, params, component) do
    put_state(component,
      status: "valid",
      organization_name: params.organization_name || "",
      role: params.role || "viewer"
    )
  end

  def action(:invite_invalid, _params, component),
    do: put_state(component, :status, "invalid")

  # -- commands ---------------------------------------------------------------

  # Same validity-oracle exposure as the REST lookup route, and this command
  # bypasses the router's rate-limit pipeline — Hammer guard applies here too.
  def command(:lookup, params, server) do
    with {:allow, _} <-
           Hammer.check_rate("invite_lookup:#{server.ip}", 60_000, 10),
         {:ok, invite} <- Semtext.Organizations.find_active_invite_by_raw_token(params.token) do
      put_action(server, :invite_ok,
        organization_name: Semtext.Organizations.organization_name(invite.organization_id),
        role: invite.role || "viewer"
      )
    else
      _ -> put_action(server, :invite_invalid, %{})
    end
  end
end
