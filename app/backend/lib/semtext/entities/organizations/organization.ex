defmodule Semtext.Organizations.Organization do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Organizations
  @sref "organization"
  @persistence ecto_store(Semtext.Schema.Organizations.Organization, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    field :slug, nil, :string
    field :name, nil, :string
    field :settings, %{}, :map
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
