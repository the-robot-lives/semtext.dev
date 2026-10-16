defmodule Semtext.Proposals.Report do
  @moduledoc """
  An unauthenticated (Turnstile-gated) or authenticated abuse report against
  a proposal (v2 §5: reports are first-class rows; a matching
  `moderation_events` `report` event is appended alongside each one).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, Ecto.UUID, autogenerate: true}

  @type t :: %__MODULE__{}

  @reasons [:spam, :harassment, :other]
  @statuses [:open, :resolved, :dismissed]

  schema "proposal_reports" do
    field :reason, Ecto.Enum, values: @reasons, default: :other
    field :details, :string
    field :status, Ecto.Enum, values: @statuses, default: :open

    belongs_to :proposal, Semtext.Proposals.Proposal, type: Ecto.UUID
    belongs_to :reporter, Semtext.Schema.Users.User, type: Ecto.UUID

    timestamps(type: :utc_datetime_usec)
  end

  def reasons, do: @reasons
  def statuses, do: @statuses

  def changeset(report, attrs) do
    report
    |> cast(attrs, [:proposal_id, :reporter_id, :reason, :details, :status])
    |> validate_required([:proposal_id])
    |> validate_length(:details, max: 4_000)
    |> foreign_key_constraint(:proposal_id)
  end
end
