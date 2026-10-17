defmodule Semtext.Media.Asset do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Media
  @sref "media-asset"
  @persistence ecto_store(Semtext.Schema.Media.Asset, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    field :media_type, nil, {:ecto, Semtext.Schema.Media.Asset.__schema__(:type, :media_type)}
    field :file_type, nil, {:ecto, Semtext.Schema.Media.Asset.__schema__(:type, :file_type)}
    field :file, nil, :string
    field :short_id, nil, :string
    field :visibility, "private", :string
    field :owner_type, nil, :string
    field :owner_id, nil, :uuid
    field :flagged, nil, :boolean
    field :settings, %{}, :map
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
