defmodule Semtext.Organizations.Membership do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Organizations.Memberships
  @sref "membership"
  @persistence ecto_store(Semtext.Schema.Organizations.Membership, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    @config auto: false
    @store name: :organization_id
    field :organization, nil, Semtext.Organizations.OrganizationReference
    @config auto: false
    @store name: :user_id
    field :user, nil, Semtext.Users.UserReference
    field :role, nil, :string
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
