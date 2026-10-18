defmodule Semtext.Organizations.InviteTokens do
  @moduledoc """
  Repo for Semtext.Organizations.InviteToken
  """
  alias Semtext.Organizations.InviteToken, as: Entity
  use Noizu.Repo
  def_repo(entity: Entity)
end
