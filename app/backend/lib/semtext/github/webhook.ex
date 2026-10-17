defmodule Semtext.Github.Webhook do
  @moduledoc """
  Inbound GitHub webhook verification + delivery envelope (v1 §6 "delivery
  hygiene").

    * `X-Hub-Signature-256` is `sha256=<hex HMAC-SHA256(secret, raw body)>`,
      compared in constant time (`Plug.Crypto.secure_compare`) BEFORE the
      payload is trusted;
    * `X-GitHub-Delivery` is the dedupe key (Oban unique job on
      `delivery_id` — replayed deliveries never process twice; the backing
      store is Oban's `oban_jobs` unique index, TTL-bounded by the 7-day
      Pruner, and the event handlers are idempotent re-writes of synced
      stats, so a replay is a no-op at every layer).
  """

  @typedoc "Normalized delivery, ready for the Oban worker args."
  @type delivery :: %{
          required(:delivery_id) => String.t(),
          required(:event) => String.t(),
          required(:action) => String.t() | nil,
          required(:payload) => map()
        }

  @doc """
  Verifies the signature header against the raw request body.

  Returns `:ok` or `{:error, :missing_signature | :malformed_signature |
  :bad_signature}`. Never leaks timing on the digest compare.
  """
  @spec verify_signature(secret :: String.t(), raw_body :: binary(), header :: String.t() | nil) ::
          :ok | {:error, :missing_signature | :malformed_signature | :bad_signature}
  def verify_signature(_secret, _raw_body, nil), do: {:error, :missing_signature}
  def verify_signature(_secret, _raw_body, []), do: {:error, :missing_signature}

  def verify_signature(secret, raw_body, [header | _]) when is_binary(header),
    do: verify_signature(secret, raw_body, header)

  def verify_signature(secret, raw_body, header) when is_binary(header) do
    case String.split(header, "=", parts: 2) do
      ["sha256", digest] -> compare(secret, raw_body, digest)
      _ -> {:error, :malformed_signature}
    end
  end

  def verify_signature(_secret, _raw_body, _other), do: {:error, :missing_signature}

  @doc "Hex HMAC-SHA256 of the raw body (`sha256=<hex>` form)."
  @spec signature(secret :: String.t(), raw_body :: binary()) :: String.t()
  def signature(secret, raw_body) do
    "sha256=" <> Base.encode16(:crypto.mac(:hmac, :sha256, secret, raw_body), case: :lower)
  end

  @doc """
  Normalizes headers + decoded payload into a `delivery` map.

  Unknown/absent actions are allowed (`action: nil` — e.g. `ping` has none).
  """
  @spec normalize(delivery_id :: String.t() | nil, event :: String.t() | nil, payload :: map()) ::
          {:ok, delivery()} | {:error, :missing_delivery_id | :missing_event | :bad_payload}
  def normalize(delivery_id, event, payload)

  def normalize(nil, _event, _payload), do: {:error, :missing_delivery_id}
  def normalize("", _event, _payload), do: {:error, :missing_delivery_id}
  def normalize(_id, nil, _payload), do: {:error, :missing_event}
  def normalize(_id, "", _payload), do: {:error, :missing_event}
  def normalize(_id, _event, payload) when not is_map(payload), do: {:error, :bad_payload}

  # Structs (e.g. %Plug.Conn.Unfetched{} on a pass-through content-type) are
  # maps to is_map/1 but are not decoded JSON payloads.
  def normalize(_id, _event, payload) when is_struct(payload), do: {:error, :bad_payload}

  def normalize(delivery_id, event, payload) when is_binary(delivery_id) and is_binary(event) do
    {:ok,
     %{
       delivery_id: delivery_id,
       event: event,
       action: Map.get(payload, "action"),
       payload: payload
     }}
  end

  def normalize(_id, _event, _payload), do: {:error, :missing_delivery_id}

  # -- plumbing -----------------------------------------------------------

  defp compare(secret, raw_body, digest) do
    expected = Base.encode16(:crypto.mac(:hmac, :sha256, secret, raw_body), case: :lower)

    if Plug.Crypto.secure_compare(expected, String.downcase(digest)) do
      :ok
    else
      {:error, :bad_signature}
    end
  end
end
