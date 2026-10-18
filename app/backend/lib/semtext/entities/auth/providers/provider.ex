defmodule Semtext.Auth.Providers.Provider do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Auth.Providers
  @sref "auth-provider"
  @persistence ecto_store(Semtext.Schema.Auth.Providers.Provider, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    field :title, nil, :string
    field :description, nil, :string
    field :settings, %{}, :any
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
