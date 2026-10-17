defmodule Semtext.Github.Client do
  @moduledoc """
  One-callback behaviour for every outbound GitHub HTTP call
  (house `Semtext.FleetPush.Client` shape: raw post, status + body back,
  NO client-level retries — retries are Oban's job).
  """

  @callback post(url :: String.t(), headers :: [{String.t(), String.t()}], body :: binary()) ::
              {:ok, status :: pos_integer(), body :: term()} | {:error, term()}
end
