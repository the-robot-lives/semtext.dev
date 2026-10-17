defmodule Semtext.Organizations.MembershipReference do
  use Noizu.Entity.ReferenceBehaviour,
    identifier_type: :uuid,
    entity: Semtext.Organizations.Membership
end
