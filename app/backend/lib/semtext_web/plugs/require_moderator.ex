defmodule SemtextWeb.Plugs.RequireModerator do
  @moduledoc """
  `require_role(:moderator)` — gates the moderation surface (queue, hide/
  restore, report triage) to users with `role = "moderator"` on the users row.
  Platform admins (`users.admin`) pass as superusers.

  Grant: `mix semtext.grant_moderator <github_login>` (revoke with `--revoke`).
  Must run AFTER authentication is established (`SemtextWeb.Plugs.RequireUser`
  or the Guardian `:authenticated` pipeline). JSON → `403` problem+json;
  pages → `302` home, same split as `RequireUser`.
  """

  @behaviour Plug
  import Plug.Conn

  @impl true
  # <REMOVED UUID HERE> init :: auto-generated pointer for public function init
  def init(opts), do: Keyword.get(opts, :mode, :auto)

  @impl true
  # <REMOVED UUID HERE> call :: auto-generated pointer for public function call
  # Accepts either the normalized mode from init/1 (pipelines) or raw opts.
  def call(conn, opts) when is_list(opts), do: call(conn, init(opts))

  def call(conn, mode) when is_atom(mode) do
    user = Map.get(conn.assigns, :current_user)

    with %{} <- user,
         true <- moderator?(user) do
      assign(conn, :moderator_user, user)
    else
      _ -> deny(conn, mode)
    end
  end

  # <REMOVED UUID HERE> moderator? :: auto-generated pointer for public function moderator?
  def moderator?(%{} = user) do
    Map.get(user, :admin, false) == true or Map.get(user, :role, "user") == "moderator"
  end

  defp deny(conn, :api), do: problem_json(conn)
  defp deny(conn, :page), do: redirect_home(conn)

  defp deny(conn, :auto) do
    if html_request?(conn), do: redirect_home(conn), else: problem_json(conn)
  end

  defp html_request?(conn) do
    conn
    |> get_req_header("accept")
    |> List.first("")
    |> String.contains?("text/html")
  end

  defp problem_json(conn) do
    body =
      Jason.encode!(%{
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Moderator access required"
      })

    conn
    |> put_resp_content_type("application/problem+json")
    |> send_resp(403, body)
    |> halt()
  end

  defp redirect_home(conn) do
    conn
    |> put_resp_header("location", "/")
    |> send_resp(302, "")
    |> halt()
  end
end
