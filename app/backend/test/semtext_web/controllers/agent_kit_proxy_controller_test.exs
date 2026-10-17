defmodule SemtextWeb.AgentKitProxyControllerTest do
  @moduledoc """
  Endpoint tests for the read-only agent-kit live-fetch proxy
  (`/api/v1/agent-kit/*`): happy-path normalization (whitelist — upstream
  extras never reach the visitor), param validation, and the fail-soft
  contract (not-configured 503, upstream 5xx/404/transport → structured
  stay-cached bodies). Upstream HTTP is a house StubClient
  (`Semtext.LiveProxy.Client` behaviour injected via app env) — no socket,
  no Bypass.
  """

  use SemtextWeb.ConnCase

  alias Semtext.LiveProxy.AgentKit

  @base_cfg_key {__MODULE__, :base_cfg}

  setup do
    base_cfg = Application.get_env(:semtext, AgentKit, [])
    :persistent_term.put(@base_cfg_key, base_cfg)

    Application.put_env(
      :semtext,
      AgentKit,
      Keyword.merge(base_cfg,
        base_url: "https://agent-kit.test",
        api_key: "test-mcp-api-key",
        http_client: __MODULE__.StubClient
      )
    )

    __MODULE__.StubClient.reset()

    on_exit(fn ->
      :persistent_term.erase(@base_cfg_key)

      if base_cfg == [] do
        Application.delete_env(:semtext, AgentKit)
      else
        Application.put_env(:semtext, AgentKit, base_cfg)
      end
    end)

    conn = Phoenix.ConnTest.build_conn()
    {:ok, conn: conn}
  end

  describe "GET /api/v1/agent-kit/tickets/:org/:project/:key" do
    test "happy path: normalized whitelist envelope, live: true", %{conn: conn} do
      __MODULE__.StubClient.put_reply(
        {:ok, 200,
         %{
           "ticket" => %{
             "key" => "ABC-123",
             "title" => "Ship the proxy",
             "status" => "open",
             "priority" => "high",
             "ticket_type" => "task",
             "assignee" => "dev-1",
             "stage_id" => "stg_1",
             "queue_id" => "q1",
             "project_id" => "proj",
             "updated_at" => "2026-10-18T00:00:00Z",
             # upstream extras that must NOT ride to the visitor
             "description" => "internal body",
             "custom_fields" => %{"internal" => true},
             "reporter" => "someone"
           },
           "links" => %{"outgoing" => [], "incoming" => []}
         }}
      )

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ABC-123")

      assert %{"ticket" => ticket, "organization" => "the-org", "project" => "proj", "live" => true} =
               json_response(conn, 200)

      assert ticket["key"] == "ABC-123"
      assert ticket["title"] == "Ship the proxy"
      assert ticket["status"] == "open"
      assert ticket["priority"] == "high"

      # whitelist, not passthrough
      refute Map.has_key?(ticket, "description")
      refute Map.has_key?(ticket, "custom_fields")
      refute Map.has_key?(ticket, "reporter")
      refute Map.has_key?(json_response(conn, 200), "links")

      # upstream path is org + human key (agent-kit resolves key → UUID)
      assert __MODULE__.StubClient.last_url() == "https://agent-kit.test/api/v1/organizations/the-org/tickets/ABC-123"
    end

    test "invalid ticket key (lowercase, short digits) → 400, upstream never called", %{conn: conn} do
      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/abc-12")
      assert %{"error" => "invalid_request", "live" => false} = json_response(conn, 400)
      assert __MODULE__.StubClient.last_url() == nil
    end

    test "invalid org slug → 400, upstream never called", %{conn: conn} do
      conn = get(conn, "/api/v1/agent-kit/tickets/Bad_Org/proj/ABC-123")
      assert %{"error" => "invalid_request", "live" => false} = json_response(conn, 400)
      assert __MODULE__.StubClient.last_url() == nil
    end

    test "not configured (no api key) → 503 fail-soft, upstream never called", %{conn: conn} do
      Application.put_env(:semtext, AgentKit, http_client: __MODULE__.StubClient)

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ABC-123")
      assert %{"error" => "not_configured", "live" => false} = json_response(conn, 503)
      assert __MODULE__.StubClient.last_url() == nil
    end

    test "token exchange rejected → 502 upstream_unavailable", %{conn: conn} do
      __MODULE__.StubClient.put_token_reply({:ok, 401, %{"error" => "invalid or expired API key"}})

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ABC-123")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end

    test "upstream 500 → 502 fail-soft", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 500, %{"error" => "boom"}})

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ABC-123")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end

    test "upstream 404 → 404 not_found (stay-cached)", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 404, %{"error" => "not found"}})

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ZZZ-999")
      assert %{"error" => "not_found", "live" => false} = json_response(conn, 404)
    end

    test "upstream transport failure → 502 fail-soft", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:error, :timeout})

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ABC-123")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end

    test "upstream 200 with non-JSON body → 502 fail-soft", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 200, "<html>gateway</html>"})

      conn = get(conn, "/api/v1/agent-kit/tickets/the-org/proj/ABC-123")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end
  end

  describe "GET /api/v1/agent-kit/personas/:org" do
    test "happy path: persona whitelist, live: true", %{conn: conn} do
      __MODULE__.StubClient.put_reply(
        {:ok, 200,
         %{
           "personas" => [
             %{"id" => "p1", "slug" => "dev-1", "name" => "Dev One", "role" => "Engineer",
              "status" => "active", "email" => "secret@example.com", "journal" => "private"}
           ]
         }}
      )

      conn = get(conn, "/api/v1/agent-kit/personas/the-org")
      assert %{"personas" => [persona], "live" => true} = json_response(conn, 200)
      assert persona["slug"] == "dev-1"
      assert persona["name"] == "Dev One"
      refute Map.has_key?(persona, "email")
      refute Map.has_key?(persona, "journal")
    end

    test "upstream 503 → 502 fail-soft", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 503, %{"error" => "down"}})

      conn = get(conn, "/api/v1/agent-kit/personas/the-org")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end
  end

  describe "GET /api/v1/agent-kit/boards/:org" do
    test "happy path: boards whitelist + methodologies passthrough", %{conn: conn} do
      __MODULE__.StubClient.put_reply(
        {:ok, 200,
         %{
           "boards" => [%{"id" => "b1", "slug" => "triage", "title" => "Triage", "secret" => "x"}],
           "methodologies" => ["kanban"]
         }}
      )

      conn = get(conn, "/api/v1/agent-kit/boards/the-org")
      assert %{"boards" => [board], "methodologies" => ["kanban"], "live" => true} =
               json_response(conn, 200)

      assert board["slug"] == "triage"
      refute Map.has_key?(board, "secret")
    end

    test "?project= narrows the upstream query", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 200, %{"boards" => []}})

      conn = get(conn, "/api/v1/agent-kit/boards/the-org?project=proj")
      assert json_response(conn, 200)["live"] == true
      assert __MODULE__.StubClient.last_url() == "https://agent-kit.test/api/v1/organizations/the-org/boards?project_id=proj"
    end
  end

  # -- stub ----------------------------------------------------------------

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.LiveProxy.Client

    @token_key {__MODULE__, :token}
    @reply_key {__MODULE__, :reply}
    @url_key {__MODULE__, :url}

    def reset do
      :persistent_term.put(@token_key, {:ok, 200, %{"token" => "test-jwt", "token_type" => "Bearer"}})
      :persistent_term.put(@reply_key, {:ok, 200, %{}})
      :persistent_term.put(@url_key, nil)
    end

    def put_token_reply(reply), do: :persistent_term.put(@token_key, reply)
    def put_reply(reply), do: :persistent_term.put(@reply_key, reply)
    def last_url, do: :persistent_term.get(@url_key, nil)

    @impl Semtext.LiveProxy.Client
    def get(url, _headers) do
      :persistent_term.put(@url_key, url)
      :persistent_term.get(@reply_key)
    end

    @impl Semtext.LiveProxy.Client
    def post(_url, _headers, _body) do
      :persistent_term.get(@token_key)
    end
  end
end
