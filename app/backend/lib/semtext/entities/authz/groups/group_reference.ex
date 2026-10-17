defmodule Semtext.Authz.Groups.GroupReference do
  use Noizu.Entity.ReferenceBehaviour,
    identifier_type: :uuid,
    entity: Semtext.Authz.Groups.Group
end
