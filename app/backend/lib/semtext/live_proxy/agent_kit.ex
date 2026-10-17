defmodule Semtext.LiveProxy.AgentKit do
  @moduledoc """
  Upstream client for the agent-kit service (vocabulary epic Phase 5):
  read-only ticket / persona / board lookups behind `GET /api/v1/agent-kit/*`.

  ## Auth — the McpApiKey → JWT bootstrap exchange

  The agent-kit API's documented bootstrap flow for keyed clients is
  `POST /api/mcp/token` (TokenController): present the raw MCP API key, get a
  short-lived bearer JWT minted for the key's owner (`token` /
  `expires_at` / `token_type: "Bearer"` in the response). This module performs
  that exchange per request — stateless, no token cache ("no caching layer
  beyond what exists") — and presents the minted JWT as
  `Authorization: Bearer` on every read. The raw key and the minted token are
  NEVER logged and NEVER serialized into a proxied response.

  Config (app env, wired from env vars in `config/runtime.exs`; dc →
  Infisical → chart env — same secret path as FLEET_INGEST_KEY):

      config :semtext, Semtext.LiveProxy.AgentKit,
        base_url: System.get_env("AGENT_KIT_API_URL"),   # e.g. https://<agent-kit-host>
        api_key: System.get_env("AGENT_KIT_API_KEY"),    # raw MCP API key
        http_client: Semtext.LiveProxy.ReqClient         # injectable for tests

  Blank/missing base_url or api_key ⇒ `{:error, :not_configured}` — the
  controller renders the 503 fail-soft body and the embed stays cached.

  ## Results

      {:ok, normalized_map}
      {:error, :not_configured}
      {:error, {:upstream_status, status}}   # any non-200 from agent-kit
      {:error, {:upstream_unreachable, reason}}  # timeout / transport

  Normalization is a FIELD WHITELIST, not a passthrough: upstream payloads
  are first-party but this response rides to visitor browsers, so only the
  enrichment fields the embed chrome consumes (status/title plus stable
  identifiers) are kept.
  """

  require Logger

  @token_path "/api/mcp/token"
  @org_base "/api/v1/organizations"

  @ticket_fields ~w(key title status priority ticket_type assignee stage_id queue_id project_id updated_at)
  @persona_fields ~w(id slug name role avatar status tags)
  @board_fields ~w(id slug name title kind status position)

  # -- public API ----------------------------------------------------------

  @doc """
  One ticket's status/title enrichment. `org` and `project` are slugs, `key`
  the human ticket key (`^[A-Z0-9]{1,6}-\\d{3,}` — validated upstream too;
  agent-kit's ticket show resolves the human key off the ticket UUID).
  """
  @spec ticket(String.t(), String.t(), String.t()) ::
          {:ok, map()} | {:error, term()}
  def ticket(org, project, key) do
    org = String.trim(org)
    project = String.trim(project)
    key = String.trim(key)

    with {:ok, headers} <- authorized_headers(),
         {:ok, status, body} <-
           get("#{base_url()}#{@org_base}/#{org}/tickets/#{key}", headers) do
      respond(status, body, fn %{"ticket" => t} when is_map(t) ->
        %{
          "ticket" => normalized_ticket(t, key, project),
          "organization" => org,
          "project" => project,
          "live" => true
        }
      end)
    end
  end

  @doc "Org persona directory (optionally narrowed with `project` slug)."
  @spec personas(String.t(), String.t() | nil) :: {:ok, map()} | {:error, term()}
  def personas(org, project \\ nil) do
    org = String.trim(org)

    with {:ok, headers} <- authorized_headers(),
         {:ok, status, body} <-
           get("#{base_url()}#{@org_base}/#{org}/personas#{query(project)}", headers) do
      respond(status, body, fn %{"personas" => list} when is_list(list) ->
        %{
          "personas" => Enum.map(list, &whitelist(&1, @persona_fields)),
          "organization" => org,
          "live" => true
        }
      end)
    end
  end

  @doc "Org ticket boards (optionally narrowed with `project` slug)."
  @spec boards(String.t(), String.t() | nil) :: {:ok, map()} | {:error, term()}
  def boards(org, project \\ nil) do
    org = String.trim(org)

    with {:ok, headers} <- authorized_headers(),
         {:ok, status, body} <-
           get("#{base_url()}#{@org_base}/#{org}/boards#{query(project)}", headers) do
      respond(status, body, fn %{"boards" => list} = payload when is_list(list) ->
        normalized = %{
          "boards" => Enum.map(list, &whitelist(&1, @board_fields)),
          "organization" => org,
          "live" => true
        }

        # Upstream ships the enum metadata the queue-board needs alongside.
        case payload do
          %{"methodologies" => m} when is_list(m) -> Map.put(normalized, "methodologies", m)
          _ -> normalized
        end
      end)
    end
  end

  # -- auth ----------------------------------------------------------------

  @doc """
  Exchanges the raw MCP API key for a short-lived bearer JWT
  (`POST /api/mcp/token`, the agent-kit bootstrap endpoint). Returns the
  `Authorization` header pair or a fail-soft error. Never logs key or token.
  """
  @spec authorized_headers() :: {:ok, [{String.t(), String.t()}]} | {:error, term()}
  def authorized_headers do
    key = cfg(:api_key) |> to_trimmed()

    if blank?(key) do
      {:error, :not_configured}
    else
      case http_client().post(
             "#{base_url()}#{@token_path}",
             [{"content-type", "application/json"}],
             Jason.encode!(%{key: key})
           ) do
        {:ok, 200, %{"token" => token}} when is_binary(token) and token != "" ->
          {:ok, [{"authorization", "Bearer " <> token}]}

        {:ok, status, _body} ->
          Logger.warning("LiveProxy.AgentKit: token exchange rejected (status=#{status})")
          {:error, {:upstream_status, status}}

        {:error, reason} ->
          Logger.warning("LiveProxy.AgentKit: token exchange unreachable")
          {:error, {:upstream_unreachable, reason}}
      end
    end
  end

  # -- plumbing ------------------------------------------------------------

  # Wraps client transport failures into the documented
  # `{:upstream_unreachable, reason}` shape (client errors pass raw).
  defp get(url, headers) do
    case http_client().get(url, headers) do
      {:ok, status, body} -> {:ok, status, body}
      {:error, reason} -> {:error, {:upstream_unreachable, reason}}
    end
  end

  defp respond(status, body, normalize) when status in 200..299 do
    case body do
      %{} = payload ->
        case normalize.(payload) do
          result when is_map(result) -> {:ok, result}
          _ -> {:error, {:upstream_body, :unexpected_shape}}
        end

      _ ->
        {:error, {:upstream_body, :not_json}}
    end
  end

  defp respond(status, _body, _normalize), do: {:error, {:upstream_status, status}}

  defp normalized_ticket(t, key, project) do
    t
    |> whitelist(@ticket_fields)
    |> Map.put_new("key", key)
    |> Map.put_new("project_id", project)
  end

  defp whitelist(item, fields) when is_map(item) do
    Map.take(item, fields)
  end

  defp whitelist(_item, _fields), do: %{}

  defp query(nil), do: ""
  defp query(project), do: "?project_id=" <> URI.encode_www_form(String.trim(project))

  defp base_url do
    cfg(:base_url) |> to_trimmed() |> String.replace_trailing("/", "")
  end

  defp to_trimmed(nil), do: nil
  defp to_trimmed(value) when is_binary(value), do: String.trim(value)
  defp to_trimmed(value), do: value

  defp blank?(nil), do: true
  defp blank?(""), do: true
  defp blank?(_), do: false

  defp cfg(key, default \\ nil) do
    Application.get_env(:semtext, __MODULE__, [])
    |> Keyword.get(key, default)
  end

  defp http_client, do: cfg(:http_client, Semtext.LiveProxy.ReqClient)
end
