defmodule Semtext.Github.ReqClient do
  @moduledoc """
  Default `Semtext.Github.Client` built on Req.

  `retry: false` — retries are Oban's job, not the HTTP client's.
  JSON bodies are decoded by Req when the response content-type is JSON;
  non-JSON bodies pass through as binaries (callers treat bodies opaquely
  apart from GraphQL's `%{"errors" => ...}` maps).
  """

  @behaviour Semtext.Github.Client

  @impl Semtext.Github.Client
  def post(url, headers, body) do
    case Req.post(url, headers: headers, body: body, receive_timeout: 15_000, retry: false) do
      {:ok, %Req.Response{status: status, body: body}} -> {:ok, status, body}
      {:error, error} -> {:error, error}
    end
  end
end
