defmodule Semtext.Users.Credentials.UserCredentialReference do
  use Noizu.Entity.ReferenceBehaviour,
    identifier_type: :uuid,
    entity: Semtext.Users.Credentials.UserCredential
end
