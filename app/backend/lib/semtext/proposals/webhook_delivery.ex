defmodule Semtext.Proposals.WebhookDelivery do
  @moduledoc """
  GitHub webhook delivery dedupe row (v1 §6): the webhook controller inserts
  the `X-GitHub-Delivery` id before processing; a unique violation means a
  replayed delivery and processing stops. Owned by the github-sync lane's
  controller logic — this module is the storage contract.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, Ecto.UUID, autogenerate: true}

  @type t :: %__MODULE__{}

  schema "github_webhook_deliveries" do
    field :delivery_id, :string
    field :event, :string

    timestamps(type: :utc_datetime_usec, updated_at: false)
  end

  def changeset(delivery, attrs) do
    delivery
    |> cast(attrs, [:delivery_id, :event])
    |> validate_required([:delivery_id])
    |> unique_constraint(:delivery_id, name: :uq_github_webhook_deliveries_delivery_id)
  end
end
