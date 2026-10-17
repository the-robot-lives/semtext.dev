defmodule Semtext.Authz.ScopedMemberships.ScopedMembershipReference do
  use Noizu.Entity.ReferenceBehaviour,
    identifier_type: :uuid,
    entity: Semtext.Authz.ScopedMemberships.ScopedMembership
end
