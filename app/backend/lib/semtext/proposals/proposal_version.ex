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
    |> validate_change(:files, &validate_file_set/2)
    |> unique_constraint([:proposal_id, :version], name: :uq_proposal_versions_proposal_version)
  end

  @max_files 20
  @max_file_bytes 256 * 1024
  @max_total_bytes 1024 * 1024

  # v1 §5 caps: relative-safe paths, ≤ 20 files, ≤ 256 KB each, ≤ 1 MB total.
  defp validate_file_set(:files, files) when is_map(files) do
    total =
      files
      |> Enum.reduce(0, fn {_path, content}, acc ->
        acc + (is_binary(content) && byte_size(content) || 0)
      end)

    files
    |> Enum.flat_map(fn
      {path, content} when is_binary(path) and is_binary(content) ->
        path_error(path) ++
          if byte_size(content) > @max_file_bytes,
            do: [files: "file #{path} exceeds #{@max_file_bytes} bytes"],
            else: []

      {path, _} ->
        [files: "file #{inspect(path)} must be a path => binary string pair"]
    end)
    |> then(fn errors ->
      if total > @max_total_bytes,
        do: errors ++ [files: "total file size exceeds #{@max_total_bytes} bytes"],
        else: errors
    end)
    |> then(fn errors ->
      if map_size(files) > @max_files,
        do: errors ++ [files: "more than #{@max_files} files"],
        else: errors
    end)
  end

  defp validate_file_set(:files, _other), do: [files: "must be a map of path => content"]

  defp path_error(path) do
    cond do
      byte_size(path) == 0 -> [files: "file path must not be empty"]
      String.starts_with?(path, "/") -> [files: "file path #{path} must be relative"]
      String.contains?(path, "..") -> [files: "file path #{path} must not contain .."]
      true -> []
    end
  end

  @doc "Canonical JSON for a file set — the input to `files_sha256`."
  def canonical_files(%{} = files) do
    files
    |> Enum.sort_by(fn {path, _} -> path end)
    |> Jason.encode!()
  end
end
