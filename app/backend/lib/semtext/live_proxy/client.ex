defmodule Semtext.LiveProxy.Client do
  @moduledoc """
  One-pair behaviour for every outbound live-proxy HTTP call (house
  `Semtext.Github.Client` / `Semtext.FleetPush.Client` shape: raw verb,
  status + body back, NO client-level retries — a proxy for embed chrome
  fails soft into the embed's cache instead of retrying).

  Bodies: JSON responses arrive decoded by Req (map/integer), non-JSON pass
  through as binaries — callers treat them opaquely.
  """

  @callback get(url :: String.t(), headers :: [{String.t(), String.t()}]) ::
              {:ok, status :: pos_integer(), body :: term()} | {:error, term()}

  @callback post(url :: String.t(), headers :: [{String.t(), String.t()}], body :: binary()) ::
              {:ok, status :: pos_integer(), body :: term()} | {:error, term()}
end
