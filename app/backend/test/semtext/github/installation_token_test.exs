defmodule Semtext.Github.InstallationTokenTest do
  @moduledoc """
  Installation token mint + persistent_term cache: cached until 60s before
  expiry, re-minted after expiry, 401/404/422 classified permanent,
  403/429/5xx/transport transient. Drives the client seam via a StubClient
  (FleetPush-test pattern).
  """

  use ExUnit.Case, async: false

  alias Semtext.Github.InstallationToken

  @calls_key {__MODULE__, :calls}
  @reply_key {__MODULE__, :reply}
  @base_cfg_key {__MODULE__, :base_cfg}

  setup do
    InstallationToken.clear()
    :persistent_term.put(@calls_key, [])

    base = Application.get_env(:semtext, Semtext.Github, [])
    :persistent_term.put(@base_cfg_key, base)

    Application.put_env(
      :semtext,
      Semtext.Github,
      Keyword.merge(base,
        app_id: "123",
        app_private_key: valid_pem(),
        installation_id: "456",
        http_client: __MODULE__.StubClient
      )
    )

    :persistent_term.put(@reply_key, fn _url, _headers, _body -> {:ok, 201, token_response()} end)

    on_exit(fn ->
      InstallationToken.clear()
      :persistent_term.erase(@calls_key)
      :persistent_term.erase(@reply_key)
      :persistent_term.erase(@base_cfg_key)

      if base == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base)
      end
    end)

    :ok
  end

  defp valid_pem, do: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1)

  defp token_response(expires_in \\ 3600) do
    %{
      "token" => "ghs_test_" <> Integer.to_string(System.unique_integer([:positive])),
      "expires_at" => DateTime.add(DateTime.utc_now(), expires_in, :second) |> DateTime.to_iso8601()
    }
  end

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.Github.Client

    @impl true
    def post(url, headers, body) do
      key = {Semtext.Github.InstallationTokenTest, :calls}
      :persistent_term.put(key, [{url, headers, body} | :persistent_term.get(key, [])])

      fun = :persistent_term.get({Semtext.Github.InstallationTokenTest, :reply}, fn _, _, _ -> {:ok, 201, %{"token" => "ghs_x", "expires_at" => "2030-01-01T00:00:00Z"}} end)
      fun.(url, headers, body)
    end
  end

  defp calls, do: :persistent_term.get(@calls_key, [])
  defp set_reply(fun), do: :persistent_term.put(@reply_key, fun)

  test "mints, caches, and reuses until near expiry" do
    assert {:ok, token} = InstallationToken.get()
    assert [{url, headers, _body}] = calls()
    assert url == "https://api.github.com/app/installations/456/access_tokens"
    assert headers |> Enum.map(fn {k, v} -> {String.downcase(k), v} end) |> Map.new() |> Map.get("authorization") =~ "Bearer ey"

    # Cached — no second mint.
    assert {:ok, ^token} = InstallationToken.get()
    assert length(calls()) == 1

    # Near expiry (inside the 60s margin) — re-mints. Rewind the STORED
    # expiry: swapping the stub reply cannot age an already-cached token.
    :persistent_term.put({Semtext.Github.InstallationToken, :token}, {token, DateTime.add(DateTime.utc_now(), 30, :second)})

    assert {:ok, token2} = InstallationToken.get()
    assert token2 != token
    assert length(calls()) == 2
  end

  test "carries a bearer App JWT minted from the configured key" do
    InstallationToken.get()

    [{_url, headers, _body}] = calls()
    assert [{"authorization", "Bearer " <> jwt}, _, _] = headers

    # The signature itself is AppAuthTest's job — here we pin which claims
    # (and only that they were actually serialized into the bearer token).
    assert %{fields: %{"iss" => "123", "exp" => exp, "iat" => iat}} = JOSE.JWT.peek(jwt)
    assert exp - iat in 540..601
  end

  test "401 → permanent (bad app key), cache cleared" do
    set_reply(fn _, _, _ -> {:ok, 401, "bad credentials"} end)

    assert {:error, {:permanent, :app_auth_rejected}} = InstallationToken.get()
  end

  test "404 → permanent (installation gone)" do
    set_reply(fn _, _, _ -> {:ok, 404, "not found"} end)

    assert {:error, {:permanent, :installation_not_found}} = InstallationToken.get()
  end

  test "422 → permanent (bad installation id)" do
    set_reply(fn _, _, _ -> {:ok, 422, "unprocessable"} end)

    assert {:error, {:permanent, {:installation_rejected, 422}}} = InstallationToken.get()
  end

  test "403/429/5xx/transport → transient" do
    set_reply(fn _, _, _ -> {:ok, 403, "rate limited"} end)
    assert {:error, {:transient, {:rate_limited, 403}}} = InstallationToken.get()

    set_reply(fn _, _, _ -> {:ok, 500, "boom"} end)
    assert {:error, {:transient, {:github_status, 500}}} = InstallationToken.get()

    set_reply(fn _, _, _ -> {:error, :econnrefused} end)
    assert {:error, {:transient, {:transport, :econnrefused}}} = InstallationToken.get()
  end

  test "malformed success body → transient (retry may see a sane response)" do
    set_reply(fn _, _, _ -> {:ok, 201, %{"nope" => true}} end)

    assert {:error, {:transient, :unexpected_token_response}} = InstallationToken.get()
  end
end
