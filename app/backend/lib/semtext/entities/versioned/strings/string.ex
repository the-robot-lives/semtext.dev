defmodule Semtext.Versioned.Strings.String do
  use Noizu.Entities

  @vsn 1.0
  @repo Semtext.Versioned.Strings
  @sref "versioned-string"
  @persistence ecto_store(Semtext.Schema.Versioned.Strings.String, Semtext.Repo)
  use Noizu.Entity.Store.Ecto.EntityProtocol.Behaviour

  def_entity do
    id(:uuid)
    field :content, nil, :string
    field :time_stamp, nil, Noizu.Entity.TimeStamp
  end

  use Semtext.Support.NoizuJasonEncoder
end
