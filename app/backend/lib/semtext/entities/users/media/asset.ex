defmodule Semtext.Users.Media.Asset do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Users.Media
  @sref "user-media"
  @persistence ecto_store(Semtext.Schema.Users.Media.Asset, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    @config auto: false
    @store name: :user_id
    field :user, nil, Semtext.Users.UserReference
    @config auto: true
    @store name: :media_id
    field :media, nil, Semtext.Media.AssetReference
    @config auto: true
    @store name: :description_id
    field :description, nil, Semtext.Versioned.Descriptions.DescriptionReference

    field :media_type,
          nil,
          {:ecto, Semtext.Schema.Users.Media.Asset.__schema__(:type, :media_type)}

    field :settings, %{}, :map
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
