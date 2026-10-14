defmodule Semtext.Authz.Groups.Group do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Authz.Groups
  @sref "authz-group"
  @persistence ecto_store(Semtext.Schema.Authz.Group, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    field :name, nil, :string
    field :display_name, nil, :string
    field :description, nil, :string
    field :is_system, true, :boolean
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
