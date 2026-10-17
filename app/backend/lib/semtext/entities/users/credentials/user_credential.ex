defmodule Semtext.Users.Credentials.UserCredential do
  use Noizu.Entities
  @vsn 1.0
  @repo Semtext.Users.Credentials
  @sref "user-credential"
  @persistence ecto_store(Semtext.Schema.Users.Credentials.UserCredential, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    @config auto: false
    @store name: :user_id
    field :user, nil, Semtext.Users.UserReference
    @config auto: true
    @store name: :auth_provider_id
    field :auth_provider, nil, Semtext.Auth.Providers.ProviderReference
    @config auto: true
    @store name: :description_id
    field :description, nil, Semtext.Versioned.Descriptions.DescriptionReference

    field :status,
          nil,
          {:ecto, Semtext.Schema.Users.Credentials.UserCredential.__schema__(:type, :status)}

    field :settings, %{}, :map
    field :state, %{}, :map
    field :fingerprint, nil, :string
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
