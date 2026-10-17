defmodule Semtext.Proposals.RateLimit do
  @moduledoc """
  Postgres-backed approximate sliding-window rate limiting (docs/proposals/
  API.md §6). One `rate_limit_events` row per consumed token; a subject is
  over its bucket limit when the rows newer than `now - window` reach the
  limit. Two racing requests may both slip through — accepted at MVP scale.

  Buckets live in `Semtext.Proposals.rate_buckets/0` (contract). Rows older
  than the longest window + margin are pruned opportunistically on consume.
  """

  import Ecto.Query, warn: false

  alias Semtext.Proposals.RateLimitEvent
  alias Semtext.Repo

  @prune_horizon_seconds 25 * 60 * 60

  @type bucket :: :submit | :report | :fork | :read
  @type result :: :ok | {:error, {:limited, pos_integer()}}

  @doc """
  Check AND consume one token. `:ok` on success (row recorded);
  `{:error, {:limited, retry_after_seconds}}` when the bucket is exhausted.
  """
  @spec consume(bucket(), String.t()) :: result()
  def consume(bucket, subject) do
    cfg = bucket_config!(bucket)
    now = DateTime.utc_now()
    window_start = DateTime.add(now, -cfg.window_seconds, :second)

    count =
      Repo.one(
        from e in RateLimitEvent,
          where: e.bucket == ^to_string(bucket) and e.subject == ^subject,
          where: e.inserted_at > ^window_start,
          select: count()
      )

    if count >= cfg.limit do
      {:error, {:limited, retry_after(bucket, subject, now)}}
    else
      Repo.insert!(%RateLimitEvent{bucket: to_string(bucket), subject: subject, inserted_at: now})
      prune(now)
      :ok
    end
  end

  @doc "Record a token without checking (used by submit-then-record flows)."
  @spec record(bucket(), String.t()) :: :ok
  def record(bucket, subject) do
    Repo.insert!(%RateLimitEvent{
      bucket: to_string(bucket),
      subject: subject,
      inserted_at: DateTime.utc_now()
    })

    :ok
  end

  @doc """
  Seconds until the oldest in-window event leaves the window (≥ 1).
  For an exhausted bucket this is the `Retry-After` value.
  """
  @spec retry_after(bucket(), String.t(), DateTime.t() | nil) :: pos_integer()
  def retry_after(bucket, subject, now \\ DateTime.utc_now()) do
    cfg = bucket_config!(bucket)

    oldest =
      Repo.one(
        from e in RateLimitEvent,
          where: e.bucket == ^to_string(bucket) and e.subject == ^subject,
          order_by: [asc: e.inserted_at],
          limit: 1,
          select: e.inserted_at
      )

    case oldest do
      nil ->
        1

      ts ->
        ts
        |> DateTime.add(cfg.window_seconds, :second)
        |> DateTime.diff(now)
        |> max(1)
    end
  end

  @doc "Delete events past the prune horizon. Returns the row count removed."
  @spec prune(DateTime.t() | nil) :: integer()
  def prune(now \\ DateTime.utc_now()) do
    horizon = DateTime.add(now, -@prune_horizon_seconds, :second)

    {count, _} =
      Repo.delete_all(
        from e in RateLimitEvent,
          where: e.inserted_at < ^horizon
      )

    count
  end

  defp bucket_config!(bucket) do
    case Semtext.Proposals.rate_buckets()[bucket] do
      %{limit: limit, window_seconds: window} when is_integer(limit) and limit > 0 ->
        %{limit: limit, window_seconds: window}

      _ ->
        raise ArgumentError, "unknown rate-limit bucket: #{inspect(bucket)}"
    end
  end
end
