defmodule Semtext.Proposals.ModerationEvent do
  @moduledoc """
  Append-only audit row for every moderation action and status change
  (v1 §3.7). Never updated or deleted — corrections are new events.
  Exactly one of `actor_user_id` / `actor_system` names the actor.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, Ecto.UUID, autogenerate: true}

  @type t :: %__MODULE__{}

  @events [:status_change, :hide, :unhide, :report, :spam_flag, :lock_discussion, :claim]

  schema "moderation_events" do
    field :event, Ecto.Enum, values: @events
    field :from_status, Ecto.Enum, values: Semtext.Proposals.Proposal.statuses()
    field :to_status, Ecto.Enum, values: Semtext.Proposals.Proposal.statuses()
    field :reason, :string
    field :actor_system, :string

    belongs_to :actor_user, Semtext.Schema.Users.User, type: Ecto.UUID
    belongs_to :proposal, Semtext.Proposals.Proposal, type: Ecto.UUID

    timestamps(type: :utc_datetime_usec, updated_at: false)
  end

  def events, do: @events

  def changeset(event, attrs) do
    event
    |> cast(attrs, [
      :proposal_id,
      :actor_user_id,
      :actor_system,
      :event,
      :from_status,
      :to_status,
      :reason
    ])
    |> validate_required([:proposal_id, :event])
    |> validate_length(:reason, max: 2_000)
    |> foreign_key_constraint(:proposal_id)
  end
end
