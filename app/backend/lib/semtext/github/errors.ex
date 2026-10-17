defmodule Semtext.Github.Errors do
  @moduledoc """
  Failure classification for the GitHub sync (v1 §6 retry semantics):

    * `:transient` — an outage/rate limit/stale token; Oban retries with
      backoff and the proposal's chip stays `pending`
    * `:permanent` — a payload/credential/installation problem that retrying
      cannot fix; the chip flips to `failed` and the manual retry action
      re-enqueues after remediation
  """

  @type kind :: :transient | :permanent
  @type classified :: {:transient | :permanent, term()}

  @doc """
  Classifies a raw HTTP result from `Semtext.Github.Client`.
  """
  @spec classify_http({:ok, pos_integer(), term()} | {:error, term()}) :: classified()
  def classify_http({:error, reason}), do: {:transient, {:transport, reason}}

  def classify_http({:ok, status, _body}) when status in 200..299,
    do: raise(ArgumentError, "classify_http/1 is for failures only, got #{status}")

  def classify_http({:ok, 404, _body}), do: {:permanent, :not_found}
  def classify_http({:ok, 400, _body}), do: {:permanent, {:bad_request, 400}}
  def classify_http({:ok, status, _body}) when status in [401, 403, 429], do: {:transient, {:rejected, status}}

  def classify_http({:ok, status, _body}), do: {:transient, {:github_status, status}}

  @doc """
  Classifies a GraphQL top-level `errors` list. GitHub error objects carry a
  `type` (e.g. `"NOT_FOUND"`, `"FORBIDDEN"`, `"RATE_LIMITED"`); anything that
  is clearly rate-limiting is transient, everything else is a permanent
  input/permission error (retrying `createDiscussion` with the same category
  id cannot succeed).
  """
  @spec classify_graphql([map()]) :: classified()
  def classify_graphql(errors) when is_list(errors) do
    types = errors |> Enum.map(&Map.get(&1, "type")) |> Enum.reject(&is_nil/1)
    messages = errors |> Enum.map(&Map.get(&1, "message")) |> Enum.reject(&is_nil/1)

    cond do
      Enum.any?(types, &(&1 == "RATE_LIMITED")) or rate_limited?(messages) ->
        {:transient, {:graphql_rate_limited, hd(messages) || "rate limited"}}

      Enum.any?(types, &(&1 in ["NOT_FOUND", "FORBIDDEN", "INSUFFICIENT_SCOPES", "UNAUTHORIZED"])) ->
        {:permanent, {:graphql, Enum.join(types, ",")}}

      true ->
        {:permanent, {:graphql, hd(messages) || "unknown GraphQL error"}}
    end
  end

  def classify_graphql(other), do: {:permanent, {:graphql, inspect(other)}}

  defp rate_limited?(messages),
    do: Enum.any?(messages, &String.contains?(String.downcase(&1), "rate limit"))
end
