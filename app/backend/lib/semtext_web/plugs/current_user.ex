defmodule SemtextWeb.Plugs.CurrentUser do
  @moduledoc """
  Assigns `:current_user` (the users row) for any authenticated request —
  Bearer or session cookie (`Semtext.Auth.CurrentUser.resolve/1`). Unauthed
  requests pass through with a nil assign; pair with `RequireUser` to enforce.
  """

  @behaviour Plug
  import Plug.Conn

  @impl true
  # <REMOVED UUID HERE> init :: auto-generated pointer for public function init
  def init(opts), do: opts

  @impl true
  # <REMOVED UUID HERE> call :: auto-generated pointer for public function call
  def call(conn, _opts) do
    case Semtext.Auth.CurrentUser.resolve(conn) do
      {:ok, user} -> assign(conn, :current_user, user)
      :error -> assign(conn, :current_user, nil)
    end
  end
end
