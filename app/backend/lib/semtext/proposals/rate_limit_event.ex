defmodule Semtext.Proposals.RateLimitEvent do
  @moduledoc """
  One row per consumed rate-limit token (approximate sliding window: a
  subject is over its limit when the rows newer than `now - window` reach
  the limit). Insert-only; rows older than the longest window are pruned
  opportunistically. See `Semtext.Proposals.RateLimit`.
  """

  use Ecto.Schema

  @primary_key {:id, Ecto.UUID, autogenerate: true}

  @type t :: %__MODULE__{}

  schema "rate_limit_events" do
    field :bucket, :string
    field :subject, :string

    timestamps(type: :utc_datetime_usec, updated_at: false)
  end
end
