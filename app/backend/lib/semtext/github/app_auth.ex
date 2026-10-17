defmodule Semtext.Github.AppAuth do
  @moduledoc """
  GitHub App authentication JWT (RS256).

  Signed with the App's private key, claimed as the App itself (`iss` = app
  id); exchanged for installation access tokens by
  `Semtext.Github.InstallationToken`. GitHub caps the JWT lifetime at 10
  minutes — we mint 9-minute tokens skewed 60s into the past for clock drift.
  """

  require Logger

  @skew_seconds 60
  @lifetime_seconds 540

  @doc """
  Mints a fresh App JWT.

  The private key comes from config (`:app_private_key`) and may be either a
  PEM with real newlines or a single-line env var with `\\n` escapes (the
  Infisical → chart env path flattens PEMs).
  """
  @spec jwt() :: {:ok, String.t()} | {:error, term()}
  def jwt do
    with {:ok, jwk} <- key_jwk() do
      claims = %{
        "iat" => System.system_time(:second) - @skew_seconds,
        "exp" => System.system_time(:second) - @skew_seconds + @lifetime_seconds,
        "iss" => app_id()
      }

      # JOSE 1.11: sign/3 yields a JWS map pair; JOSE.JWS.compact/1 flattens
      # it to the wire token ({_modules, binary}).
      {_meta, token} =
        jwk
        |> JOSE.JWT.sign(%{"alg" => "RS256", "typ" => "JWT"}, claims)
        |> JOSE.JWS.compact()

      {:ok, token}
    end
  end

  @doc "The configured App id as a string (JWT `iss`)."
  @spec app_id() :: String.t()
  def app_id, do: to_string(Semtext.Github.cfg(:app_id))

  # -- plumbing -----------------------------------------------------------

  defp key_jwk do
    case normalize_pem(Semtext.Github.cfg(:app_private_key)) do
      nil ->
        {:error, :app_private_key_not_configured}

      pem ->
        # from_pem/1 yields a %JOSE.JWK{} on success (kty = {:jose_jwk_kty_rsa,
        # keytuple}) and a bare [] on a parse failure — never a raise.
        jwk = JOSE.JWK.from_pem(pem)

        if is_map(jwk) and match?({:jose_jwk_kty_rsa, _}, jwk.kty) do
          {:ok, jwk}
        else
          Logger.error("github_app: app private key is not a parseable RSA PEM")
          {:error, :app_private_key_invalid}
        end
    end
  end

  defp normalize_pem(nil), do: nil
  defp normalize_pem(""), do: nil

  defp normalize_pem(pem) when is_binary(pem) do
    if String.contains?(pem, "\\n") do
      String.replace(pem, "\\n", "\n")
    else
      pem
    end
  end
end
