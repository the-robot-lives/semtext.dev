defmodule SemtextWeb.Hologram.Components.Auth.UserMenu do
  @moduledoc """
  Header login/avatar menu (design v2 §4) — the single auth UI for the site
  and proposals layouts.

  Signed out: a "Sign in with GitHub" button (the only login path). Signed
  in: the GitHub avatar + login, and a Log out command that clears the
  session cookie and hard-navigates home.

  Self-contained on purpose: `init/2` resolves the current user from the
  session server-side, so any layout drops in `<Auth.UserMenu cid=... />`
  without threading user state through pages (port lanes never need to know
  about auth). Stateful component — always render with an explicit `cid`.
  """

  use Hologram.Component
  use Hologram.JS

  alias Semtext.Hologram.Auth

  def template do
    ~HOLO"""
    <div class="sg-user-menu">
      {%if @user}
        <details class="sg-user-menu__details">
          <summary class="sg-user-menu__trigger" aria-label="Account menu">
            {%if @user.avatar_url}
              <img class="sg-user-menu__avatar" src={@user.avatar_url} alt="" width="24" height="24" />
            {%else}
              <span class="sg-user-menu__avatar sg-user-menu__avatar--initials">{initials(@user)}</span>
            {/if}
            <span class="sg-user-menu__login">{@user.github_login || @user.user_name}</span>
          </summary>
          <div class="sg-user-menu__panel">
            <a class="sg-user-menu__item" href="/app">Dashboard</a>
            <button type="button" class="sg-user-menu__item sg-user-menu__logout" data-cy="logout" $click={:logout}>Log out</button>
          </div>
        </details>
      {%else}
        {%if @github_enabled}
          <a class="btn btn-outline btn-sm" href={Auth.sso_path("github")} data-cy="login-github">
            {Auth.sso_label("github")}
          </a>
        {%else}
          <span class="btn btn-outline btn-sm sg-user-menu__login-disabled" data-cy="login-disabled" aria-disabled="true">
            Sign in coming soon
          </span>
        {/if}
      {/if}
    </div>
    """
  end

  # <REMOVED UUID HERE> init :: auto-generated pointer for public function init
  def init(_props, component, server) do
    # `github_enabled` is computed server-side (Application env is not
    # client-transpilable) and ships in the hydration payload as a plain
    # boolean — with GITHUB_CLIENT_ID unset the menu renders the disabled
    # "Sign in coming soon" state instead of a link that would dead-end
    # on the unmounted /auth/github route.
    put_state(
      component,
      user: Auth.current_user(server),
      github_enabled: Application.get_env(:semtext, :github_enabled, false)
    )
  end

  # Client action → server command (MainLayout `command(:logout)` pattern):
  # clear the session cookie, hard-redirect home.
  # <REMOVED UUID HERE> action :: auto-generated pointer for public function action
  def action(:logout, _params, component) do
    put_command(component, :user_menu_logout)
  end

  # <REMOVED UUID HERE> command :: auto-generated pointer for public function command
  def command(:user_menu_logout, _params, server) do
    server
    |> Auth.logout()
    |> Hologram.Server.put_redirect("/")
  end

  defp initials(%{} = user) do
    source = user[:github_login] || user[:user_name] || user[:handle] || "?"

    source
    |> to_string()
    |> String.slice(0, 2)
    |> String.upcase()
  end
end
