defmodule Semtext.Github.InstallationToken do
  @moduledoc """
  Installation access token minting + cache (design v1 §6 "installation token
  cache").

  Tokens are cached in `:persistent_term` until 60s before GitHub's
  `expires_at` (tokens live ~1h). A 401 from GitHub clears the cache so the
  next call re-mints (rotated/revoked token recovery).
  """

  require Logger

  @pt_key {__MODULE__, :token}
  @refresh_margin_seconds 60

  @doc """
  A valid installation access token, minted on demand.

  Errors are classified `{kind, reason}` with `kind ∈ :transient | :permanent`
  (see `Semtext.Github.Errors`):
    * 401 → `:permanent` — the App JWT was rejected (bad/rotated key); a
      retry cannot succeed until the key is fixed
    * 404 / 422 → `:permanent` — installation id wrong or app uninstalled
    * 403 / 429 / 5xx / transport → `:transient`
  """
  @spec get() :: {:ok, String.t()} | {:error, {:transient | :permanent, term()}}
  def get do
    case :persistent_term.get(@pt_key, :miss) do
      {token, expires_at} = cached ->
        if token_fresh?(expires_at) do
          {:ok, token}
        else
          refresh(cached)
        end

      :miss ->
        refresh(nil)
    end
  end

  @doc "Drops the cached token (next `get/0` re-mints)."
  @spec clear() :: :ok
  def clear do
    :persistent_term.erase(@pt_key)
    :ok
  end

  # -- plumbing -----------------------------------------------------------

  defp refresh(_stale) do
    installation_id = Semtext.Github.cfg(:installation_id)

    with {:ok, jwt} <- Semtext.Github.AppAuth.jwt(),
         url = Semtext.Github.api_base() <> "/app/installations/#{installation_id}/access_tokens",
         {:ok, status, body} <-
           Semtext.Github.client().post(url, auth_headers(jwt), Jason.encode!(%{})) do
      case status do
        201 -> store(body)
        401 -> {:error, {:permanent, :app_auth_rejected}}
        404 -> {:error, {:permanent, :installation_not_found}}
        422 -> {:error, {:permanent, {:installation_rejected, status}}}
        s when s in [403, 429] -> {:error, {:transient, {:rate_limited, s}}}
        s -> {:error, {:transient, {:github_status, s}}}
      end
    else
      # Transport-level failure (timeout, connrefused, …) — classified
      # transient so Oban retries; a raw reason must never leak to callers.
      {:error, reason} -> {:error, Semtext.Github.Errors.classify_http({:error, reason})}
    end
  end

  defp store(%{"token" => token, "expires_at" => expires_at} = _body)
       when is_binary(token) and token != "" do
    expires =
      case DateTime.from_iso8601(to_string(expires_at)) do
        {:ok, dt, _} -> dt
        _ -> DateTime.add(DateTime.utc_now(), 3000, :second)
      end

    :persistent_term.put(@pt_key, {token, expires})
    {:ok, token}
  end

  defp store(_other) do
    Logger.error("github_installation_token: unexpected token response shape")
    {:error, {:transient, :unexpected_token_response}}
  end

  defp token_fresh?(expires_at), do: DateTime.compare(expires_at, min_age()) == :gt

  defp min_age, do: DateTime.add(DateTime.utc_now(), @refresh_margin_seconds, :second)

  defp auth_headers(jwt) do
    [
      {"authorization", "Bearer " <> jwt},
      {"accept", "application/vnd.github+json"},
      {"content-type", "application/json"}
    ]
  end
end
