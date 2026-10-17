defmodule Semtext.Versioned.Descriptions.DescriptionReference do
  use Noizu.Entity.ReferenceBehaviour,
    identifier_type: :uuid,
    entity: Semtext.Versioned.Descriptions.Description
end
