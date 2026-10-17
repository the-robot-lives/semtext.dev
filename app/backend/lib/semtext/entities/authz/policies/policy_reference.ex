defmodule Semtext.Authz.Policies.PolicyReference do
  use Noizu.Entity.ReferenceBehaviour,
    identifier_type: :uuid,
    entity: Semtext.Authz.Policies.Policy
end
