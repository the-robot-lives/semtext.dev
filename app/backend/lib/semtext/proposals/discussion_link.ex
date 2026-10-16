defmodule Semtext.Proposals.DiscussionLink do
  @moduledoc """
  1:1 proposal -> GitHub Discussion sync cache (v1 §6, amended v2 §5).

  `state` is the visible truth for the sync chip:
    - `pending` — creation queued/retrying; proposal stays fully visible
    - `ok`      — discussion exists (`url` set), counts sync via webhooks
    - `failed`  — retries exhausted / unrecoverable; manual retry resets to pending
    - `removed` — discussion deleted on GitHub (webhook-set); recreated ONLY by
      the moderator `recreate_discussion/1` action — never auto-recreated
  `attempts` + `last_error` carry the retry story (v2 drops v1's `paused`).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, Ecto.UUID, autogenerate: true}

  @type t :: %__MODULE__{}

  @states [:pending, :ok, :failed, :removed]

  schema "discussion_links" do
    field :repo, :string
    field :discussion_number, :integer
    field :node_id, :string
    field :url, :string
    field :category, :string

    field :state, Ecto.Enum, values: @states, default: :pending
    field :attempts, :integer, default: 0
    field :comment_count, :integer, default: 0
    field :reactions, :map, default: %{}
    field :last_synced_at, :utc_datetime_usec
    field :last_error, :string

    belongs_to :proposal, Semtext.Proposals.Proposal, type: Ecto.UUID

    timestamps(type: :utc_datetime_usec)
  end

  def states, do: @states

  def changeset(link, attrs) do
    link
    |> cast(attrs, [
      :proposal_id,
      :repo,
      :discussion_number,
      :node_id,
      :url,
      :category,
      :state,
      :attempts,
      :comment_count,
      :reactions,
      :last_synced_at,
      :last_error
    ])
    |> validate_required([:proposal_id, :repo, :state])
    |> validate_number(:attempts, greater_than_or_equal_to: 0)
    |> unique_constraint(:proposal_id, name: :discussion_links_proposal_id_key)
    |> unique_constraint([:repo, :discussion_number], name: :uq_discussion_links_repo_number)
  end
end
