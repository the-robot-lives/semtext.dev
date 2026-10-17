defmodule Semtext.LiveProxy.ReqClient do
  @moduledoc """
  Default `Semtext.LiveProxy.Client` built on Req.

  `retry: false` — the proxy answers fail-soft immediately; the embed's
  cached-first contract is the retry strategy. `receive_timeout` is 5s
  (not the 15s the job-runner clients use): these calls sit inside a page
  embed's fetch, and hanging 15s on a slow upstream is exactly what the
  fail-soft contract exists to prevent.
  """

  @behaviour Semtext.LiveProxy.Client

  @impl Semtext.LiveProxy.Client
  def get(url, headers) do
    case Req.get(url, headers: headers, receive_timeout: 5_000, retry: false) do
      {:ok, %Req.Response{status: status, body: body}} -> {:ok, status, body}
      {:error, error} -> {:error, error}
    end
  end

  @impl Semtext.LiveProxy.Client
  def post(url, headers, body) do
    case Req.post(url, headers: headers, body: body, receive_timeout: 5_000, retry: false) do
      {:ok, %Req.Response{status: status, body: body}} -> {:ok, status, body}
      {:error, error} -> {:error, error}
    end
  end
end
