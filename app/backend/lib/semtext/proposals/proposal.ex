defmodule Semtext.Proposals.Proposal do
  @moduledoc """
  A vocabulary proposal (design v1 §4, amended by v2 §5).

  Field list is a P1 cross-lane contract (LANE=data) — see
  `docs/proposals/API.md` for the HTTP/command shapes built on it.

  Notes:
  - `status` lifecycle: `draft → submitted → under_review → accepted/declined`,
    `accepted → merged`, `draft/submitted → withdrawn` (v1 §3.7).
  - `slug` is globally unique (citext, case-insensitive); `element_tag` is
    unique only among live (non-hidden) proposals via a partial index, so
    forks may re-use the tag.
  - `search` is a Postgres GENERATED tsvector column (tag + title + summary +
    motivation) — deliberately NOT an Ecto field; query it via fragments so
    the value is never selected/decoded.
  - `idempotency_key` is unique; replay-safe submit returns the original row.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, Ecto.UUID, autogenerate: true}
  @derive {Jason.Encoder,
           only: [
             :id,
             :slug,
             :element_tag,
             :title,
             :summary,
             :motivation,
             :options,
             :example,
             :status,
             :hidden_at,
             :inserted_at,
             :updated_at
           ]}

  @statuses [:draft, :submitted, :under_review, :accepted, :declined, :merged, :withdrawn]

  @type t :: %__MODULE__{}

  schema "proposals" do
    field :slug, :string
    field :element_tag, :string
    field :title, :string
    field :summary, :string
    field :motivation, :string
    field :options, {:array, :map}, default: []
    field :example, :string, default: ""

    field :status, Ecto.Enum, values: @statuses, default: :draft

    field :hidden_at, :utc_datetime_usec
    field :idempotency_key, :string

    belongs_to :submitter, Semtext.Schema.Users.User, type: Ecto.UUID
    belongs_to :current_version, Semtext.Proposals.ProposalVersion, type: Ecto.UUID
    belongs_to :forked_from_proposal, __MODULE__, type: Ecto.UUID
    belongs_to :forked_from_version, Semtext.Proposals.ProposalVersion, type: Ecto.UUID

    has_many :versions, Semtext.Proposals.ProposalVersion, foreign_key: :proposal_id
    has_one :discussion_link, Semtext.Proposals.DiscussionLink
    has_many :moderation_events, Semtext.Proposals.ModerationEvent
    has_many :reports, Semtext.Proposals.Report

    timestamps(type: :utc_datetime_usec)
  end

  @doc "All status values in lifecycle order."
  def statuses, do: @statuses

  @doc "The wizard's element-tag/slug grammar (v1 §7.2 NAME_RE)."
  def name_format, do: ~r/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

  @doc """
  Base changeset for create/edit. Validates the wizard field set and the
  per-submit size caps (v1 §5: example ≤ 64 KB; options ≤ 100 entries).
  """
  def changeset(proposal, attrs) do
    proposal
    |> cast(attrs, [
      :slug,
      :element_tag,
      :title,
      :summary,
      :motivation,
      :options,
      :example,
      :status,
      :idempotency_key,
      :submitter_id,
      :forked_from_proposal_id,
      :forked_from_version_id
    ])
    |> validate_required([:slug, :element_tag, :title, :summary, :motivation, :submitter_id])
    |> validate_format(:slug, name_format())
    |> validate_length(:slug, max: 64)
    |> validate_length(:element_tag, max: 64)
    |> validate_length(:title, max: 200)
    |> validate_length(:summary, max: 8_000)
    |> validate_length(:motivation, max: 8_000)
    |> validate_length(:example, max: 64 * 1024)
    |> validate_length(:options, max: 100)
    |> validate_inclusion(:status, @statuses)
    |> unique_constraint(:slug)
    |> unique_constraint(:idempotency_key)
    |> foreign_key_constraint(:submitter_id)
  end

  @doc "Changeset for the draft-editor field edits (never touches identity columns)."
  def edit_changeset(proposal, attrs) do
    cast(proposal, attrs, [:title, :summary, :motivation, :options, :example])
    |> validate_required([:title, :summary, :motivation])
    |> validate_length(:title, max: 200)
    |> validate_length(:summary, max: 8_000)
    |> validate_length(:motivation, max: 8_000)
    |> validate_length(:example, max: 64 * 1024)
    |> validate_length(:options, max: 100)
  end
end
