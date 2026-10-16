defmodule Semtext.Proposals.ProposalVersion do
  @moduledoc """
  Immutable snapshot version N of a proposal's fields + file set (v1 §4).
  P1 writes version 1 at submit; edits bump versions in P2 (versions table is
  built now for P2-readiness per v2 §5).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, Ecto.UUID, autogenerate: true}

  @type t :: %__MODULE__{}

  schema "proposal_versions" do
    field :version, :integer
    field :title, :string
    field :summary, :string
    field :motivation, :string
    field :options, {:array, :map}, default: []
    field :example, :string, default: ""
    field :files, :map, default: %{}
    field :files_sha256, :string
    belongs_to :created_by, Semtext.Schema.Users.User, type: Ecto.UUID

    belongs_to :proposal, Semtext.Proposals.Proposal, type: Ecto.UUID

    timestamps(type: :utc_datetime_usec, updated_at: false)
  end

  @doc "Snapshot changeset; `files_sha256` must be supplied precomputed (sha256 of canonical files JSON)."
  def changeset(version, attrs) do
    version
    |> cast(attrs, [
      :proposal_id,
      :version,
      :title,
      :summary,
      :motivation,
      :options,
      :example,
      :files,
      :files_sha256,
      :created_by_id
    ])
    |> validate_required([:proposal_id, :version, :title, :summary, :motivation, :files_sha256])
    |> validate_number(:version, greater_than: 0)
    |> unique_constraint([:proposal_id, :version], name: :uq_proposal_versions_proposal_version)
  end

  @doc "Canonical JSON for a file set — the input to `files_sha256`."
  def canonical_files(%{} = files) do
    files
    |> Enum.sort_by(fn {path, _} -> path end)
    |> Jason.encode!()
  end
end
