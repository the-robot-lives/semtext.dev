defmodule Semtext.Users.Sessions.UserSession do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Users.Sessions
  @sref "user-session"
  @persistence ecto_store(Semtext.Schema.Users.Sessions.UserSession, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    @config auto: true
    @store name: :user_id
    field :user, nil, Semtext.Users.UserReference
    @config auto: true
    @store name: :credential_id
    field :credential, nil, Semtext.Users.Credentials.UserCredentialReference

    field :status,
          nil,
          {:ecto, Semtext.Schema.Users.Sessions.UserSession.__schema__(:type, :status)}

    field :details, %{}, :map
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
