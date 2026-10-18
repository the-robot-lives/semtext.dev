defmodule Semtext.Github.AppAuthTest do
  @moduledoc """
  App JWT minting: claims shape (RS256, iss = app id, ≤10 min lifetime), the
  `\\n`-escaped PEM path (chart env flattens PEMs), and failure surfaces.
  """

  use ExUnit.Case, async: false

  import ExUnit.CaptureLog

  @base_cfg_key {__MODULE__, :base_cfg}

  setup do
    base = Application.get_env(:semtext, Semtext.Github, [])
    :persistent_term.put(@base_cfg_key, base)

    on_exit(fn ->
      :persistent_term.erase(@base_cfg_key)

      if base == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base)
      end
    end)

    :ok
  end

  defp with_key(pem, app_id \\ "12345") do
    base = :persistent_term.get(@base_cfg_key, [])

    Application.put_env(
      :semtext,
      Semtext.Github,
      Keyword.merge(base, app_id: app_id, app_private_key: pem)
    )
  end

  defp rsa_pem do
    JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1)
  end

  test "mints an RS256 JWT claiming the app id with a ≤10-minute window" do
    jwk = JOSE.JWK.generate_key({:rsa, 2048})
    with_key(JOSE.JWK.to_pem(jwk) |> elem(1), "98765")

    assert {:ok, token} = Semtext.Github.AppAuth.jwt()
    assert is_binary(token)

    assert {true, %JOSE.JWT{fields: fields}, _jws} = JOSE.JWT.verify(jwk, token)
    assert fields["iss"] == "98765"
    assert fields["exp"] - fields["iat"] in 540..601
    assert fields["iat"] <= System.system_time(:second)
  end

  test "verifies against an independent key object (tampered token fails)" do
    jwk = JOSE.JWK.generate_key({:rsa, 2048})
    other = JOSE.JWK.generate_key({:rsa, 2048})
    with_key(JOSE.JWK.to_pem(jwk) |> elem(1))

    assert {:ok, token} = Semtext.Github.AppAuth.jwt()
    assert {true, _, _} = JOSE.JWT.verify(jwk, token)
    assert {false, _, _} = JOSE.JWT.verify(other, token)
  end

  test "accepts a \\n-escaped single-line PEM (env-var flattening)" do
    pem = rsa_pem()
    flat = String.replace(pem, "\n", "\\n")
    with_key(flat)

    assert {:ok, token} = Semtext.Github.AppAuth.jwt()
    assert byte_size(token) > 100
  end

  test "errors when the key is not configured" do
    base = :persistent_term.get(@base_cfg_key, [])
    Application.put_env(:semtext, Semtext.Github, Keyword.merge(base, app_id: "1", app_private_key: nil))

    assert {:error, :app_private_key_not_configured} = Semtext.Github.AppAuth.jwt()
  end

  test "errors (logged, not raised) on a non-RSA / garbage PEM" do
    assert capture_log(fn ->
             with_key("definitely not a pem")
             assert {:error, :app_private_key_invalid} = Semtext.Github.AppAuth.jwt()
           end) =~ "not a parseable RSA PEM"
  end

  test "numeric app ids are stringified into iss" do
    with_key(rsa_pem(), 42_000)
    assert Semtext.Github.AppAuth.app_id() == "42000"
  end
end
