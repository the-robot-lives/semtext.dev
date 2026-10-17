defmodule Semtext.Github.Webhook.BodyReader do
  @moduledoc """
  `Plug.Parsers` `body_reader` that retains the RAW request body for webhook
  paths, so `X-Hub-Signature-256` can be verified byte-exactly after the
  endpoint's JSON parser has consumed the stream.

  Wired in `lib/semtext_web/endpoint.ex`:

      plug Plug.Parsers,
        parsers: [:urlencoded, :multipart, :json],
        pass: ["*/*"],
        json_decoder: Phoenix.json_library(),
        body_reader: {Semtext.Github.Webhook.BodyReader, :read, []}

  Only `/api/v1/webhooks/**` requests accumulate the raw copy — every other
  request keeps the default zero-extra-memory behaviour. Read the cached copy
  with `raw_body/1`.
  """

  @raw_key :semtext_github_raw_body

  @doc false
  def read(conn, opts) do
    case Plug.Conn.read_body(conn, opts) do
      {:ok, body, conn} -> {:ok, body, store(conn, body)}
      {:more, body, conn} -> {:more, body, store(conn, body)}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "The raw (unparsed) request body, when this request was captured."
  @spec raw_body(Plug.Conn.t()) :: binary() | nil
  def raw_body(%Plug.Conn{private: private}) do
    case Map.get(private, @raw_key) do
      chunks when is_list(chunks) -> chunks |> Enum.reverse() |> IO.iodata_to_binary()
      _ -> nil
    end
  end

  defp store(conn, chunk) do
    if capture?(conn) do
      existing = Map.get(conn.private, @raw_key, [])
      Plug.Conn.put_private(conn, @raw_key, [chunk | existing])
    else
      conn
    end
  end

  defp capture?(%Plug.Conn{path_info: path_info}) do
    match?(["api", "v1", "webhooks" | _], path_info)
  end
end
