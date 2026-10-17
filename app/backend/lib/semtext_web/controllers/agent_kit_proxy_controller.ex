defmodule SemtextWeb.AgentKitProxyController do
  @moduledoc """
  Read-only live-fetch lookups against the agent-kit service
  (vocabulary epic Phase 5; contract overview in `Semtext.LiveProxy`).

  The embed chrome enriches embedded ticket/board/persona cards with live
  status/title data. Credentials (the agent-kit MCP API key and the JWT it
  brokers into) live server-side ONLY — no client request ever carries one,
  and no response ever echoes one. Responses are normalized whitelists, not
  passthroughs (see `Semtext.LiveProxy.AgentKit`).

  Upstream trouble is fail-soft (stay-cached contract) via
  `SemtextWeb.LiveProxyResponse`; params are validated locally first so
  garbage never reaches the upstream.
  """

  use SemtextWeb, :controller

  alias Semtext.LiveProxy.AgentKit
  alias SemtextWeb.LiveProxyResponse

  @org_regex ~r/^[a-z0-9][a-z0-9-]{0,63}$/
  # Six ticket types share one schema; the human key is PREFIX-NNN with a
  # 1-6 char uppercase-alnum prefix and a 3+ digit number.
  @ticket_key_regex ~r/^[A-Z0-9]{1,6}-\d{3,}$/

  # GET /api/v1/agent-kit/tickets/:org/:project/:key
  def ticket(conn, %{"org" => org, "project" => project, "key" => key}) do
    with :ok <- validate(org, "organization slug", @org_regex),
         :ok <- validate(project, "project slug", @org_regex),
         :ok <- validate(key, "ticket key", @ticket_key_regex) do
      case AgentKit.ticket(org, project, key) do
        {:ok, payload} -> json(conn, payload)
        {:error, reason} -> LiveProxyResponse.render_error(conn, reason)
      end
    else
      {:invalid, msg} -> LiveProxyResponse.fail_soft(conn, :invalid_request, msg)
    end
  end

  # GET /api/v1/agent-kit/personas/:org
  def personas(conn, %{"org" => org} = params) do
    with :ok <- validate(org, "organization slug", @org_regex) do
      case AgentKit.personas(org, params["project"]) do
        {:ok, payload} -> json(conn, payload)
        {:error, reason} -> LiveProxyResponse.render_error(conn, reason)
      end
    else
      {:invalid, msg} -> LiveProxyResponse.fail_soft(conn, :invalid_request, msg)
    end
  end

  # GET /api/v1/agent-kit/boards/:org
  def boards(conn, %{"org" => org} = params) do
    with :ok <- validate(org, "organization slug", @org_regex) do
      case AgentKit.boards(org, params["project"]) do
        {:ok, payload} -> json(conn, payload)
        {:error, reason} -> LiveProxyResponse.render_error(conn, reason)
      end
    else
      {:invalid, msg} -> LiveProxyResponse.fail_soft(conn, :invalid_request, msg)
    end
  end

  # -- plumbing ------------------------------------------------------------

  defp validate(value, label, regex) do
    if Regex.match?(regex, String.trim(value || "")) do
      :ok
    else
      {:invalid, "#{label} does not match #{inspect(regex.source)}"}
    end
  end
end
