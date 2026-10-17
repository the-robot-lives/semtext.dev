defmodule SemtextWeb.GithubWebhookControllerTest do
  @moduledoc """
  Endpoint-level webhook receiver tests (host proposals.semtext.dev):
  constant-time signature gate, 503 when unconfigured, problem+json errors,
  202 + Oban enqueue, and replayed deliveries answering `duplicate: true`
  (dedupe via the Oban unique index). An enqueued tracked event runs inline,
  so this also proves the endpoint → queue → worker → port path.
  """

  use SemtextWeb.ConnCase
  use Semtext.Github.FakePortSetup

  import Plug.Conn

  alias Semtext.Github.FakePort
  alias Semtext.Github.InstallationToken

  @host "proposals.semtext.dev"
  @path "/api/v1/webhooks/github"
  @secret "test-webhook-secret"
  @base_gh_key {__MODULE__, :base_gh}
  @reply_key {__MODULE__, :reply}

  setup do
    InstallationToken.clear()
    base_gh = Application.get_env(:semtext, Semtext.Github, [])
    :persistent_term.put(@base_gh_key, base_gh)

    Application.put_env(
      :semtext,
      Semtext.Github,
      Keyword.merge(base_gh,
        webhook_secret: @secret,
        app_id: "123",
        app_private_key: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1),
        installation_id: "456",
        repository_owner: "noizu-labs-ml",
        repository_name: "npl-enhanced-content",
        http_client: __MODULE__.StubClient,
        proposals_port: Semtext.Github.FakePort
      )
    )

    :persistent_term.put(@reply_key, {:ok, 200, stats_response()})

    on_exit(fn ->
      InstallationToken.clear()
      :persistent_term.erase(@reply_key)
      :persistent_term.erase(@base_gh_key)

      if base_gh == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base_gh)
      end
    end)

    conn = %{Phoenix.ConnTest.build_conn() | host: @host}
    {:ok, conn: conn}
  end

  defp stats_response do
    %{
      "data" => %{
        "repository" => %{
          "discussion" => %{
            "id" => "D_live",
            "url" => "https://github.com/x/y/discussions/4",
            "comments" => %{"totalCount" => 2},
            "reactionGroups" => []
          }
        }
      }
    }
  end

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.Github.Client

    # The installation-token mint is canned healthy: the configured reply
    # describes the GraphQL exchange only.
    @token_reply {:ok, 201, %{"token" => "ghs_test", "expires_at" => "2099-01-01T00:00:00Z"}}

    @impl true
    def post(url, _headers, _body) do
      if String.contains?(to_string(url), "/access_tokens") do
        @token_reply
      else
        case :persistent_term.get({SemtextWeb.GithubWebhookControllerTest, :reply}, {:ok, 500, "no reply"}) do
          fun when is_function(fun, 0) -> fun.()
          reply -> reply
        end
      end
    end
  end

  # Posts the delivery with a signature computed over `signed_body` while the
  # request actually carries `wire_body` — identical by default (valid), or
  # different for tamper tests.
  defp deliver(conn, event, payload, opts \\ []) do
    delivery_id =
      Keyword.get(opts, :delivery_id, "dlv-" <> Integer.to_string(System.unique_integer([:positive])))

    raw = Jason.encode!(payload)
    signed_body = Keyword.get(opts, :signed_body, raw)
    wire_body = Keyword.get(opts, :wire_body, raw)
    sig = Semtext.Github.Webhook.signature(@secret, signed_body)

    conn
    |> put_req_header("content-type", "application/json")
    |> put_req_header("x-github-delivery", delivery_id)
    |> put_req_header("x-github-event", event)
    |> maybe_sig(Keyword.get(opts, :drop_signature), sig)
    |> post(@path, wire_body)
  end

  defp maybe_sig(conn, true, _sig), do: conn
  defp maybe_sig(conn, _drop, sig), do: put_req_header(conn, "x-hub-signature-256", sig)

  test "ping answers 202 with a ping marker", %{conn: conn} do
    conn = deliver(conn, "ping", %{"zen" => "Keep it simple."})

    assert json_response(conn, 202) == %{"ok" => true, "ping" => true}
  end

  test "valid tracked delivery is accepted and applied inline (endpoint → queue → worker → port)", %{
    conn: conn
  } do
    pid = "55555555-5555-5555-5555-555555555555"
    FakePort.seed_target(pid)
    FakePort.put_discussion_link(pid, %{node_id: "D_live", discussion_number: 4, url: "u"})

    conn =
      deliver(conn, "discussion_comment", %{
        "action" => "created",
        "discussion" => %{"node_id" => "D_live", "number" => 4},
        "repository" => %{"full_name" => "noizu-labs-ml/npl-enhanced-content"}
      })

    assert json_response(conn, 202) == %{"ok" => true}

    # Oban testing: :inline — the job already ran inside the request.
    assert FakePort.link(pid).comment_count == 2
  end

  test "replayed delivery answers duplicate: true (202, still success for GitHub)", %{conn: conn} do
    payload = %{"action" => "created"}

    assert json_response(deliver(conn, "installation", payload, delivery_id: "dlv-replay-same"), 202)["ok"]

    replay = deliver(conn, "installation", payload, delivery_id: "dlv-replay-same")
    body = json_response(replay, 202)

    assert body["ok"] == true
    assert body["duplicate"] == true
  end

  test "tampered body → 401 problem invalid-signature", %{conn: conn} do
    conn =
      deliver(conn, "ping", %{"zen" => "x"}, wire_body: ~s({"zen":"x","tampered":true}))

    assert conn.status == 401
    assert problem_type(conn) =~ "invalid-signature"
  end

  test "missing signature header → 401 problem", %{conn: conn} do
    conn = deliver(conn, "ping", %{"zen" => "x"}, drop_signature: true)

    assert conn.status == 401
    assert problem_type(conn) =~ "invalid-signature"
  end

  test "missing delivery id → 400 problem", %{conn: conn} do
    raw = Jason.encode!(%{"zen" => "x"})
    sig = Semtext.Github.Webhook.signature(@secret, raw)

    conn =
      conn
      |> put_req_header("content-type", "application/json")
      |> put_req_header("x-github-event", "ping")
      |> put_req_header("x-hub-signature-256", sig)
      |> post(@path, raw)

    assert conn.status == 400
    assert problem_type(conn) =~ "missing-delivery-id"
  end

  test "missing event header → 400 problem", %{conn: conn} do
    raw = Jason.encode!(%{"zen" => "x"})
    sig = Semtext.Github.Webhook.signature(@secret, raw)

    conn =
      conn
      |> put_req_header("content-type", "application/json")
      |> put_req_header("x-github-delivery", "dlv-no-event")
      |> put_req_header("x-hub-signature-256", sig)
      |> post(@path, raw)

    assert conn.status == 400
    assert problem_type(conn) =~ "missing-event"
  end

  test "non-JSON payload → 400 bad-payload problem", %{conn: conn} do
    raw = "this is not json"
    sig = Semtext.Github.Webhook.signature(@secret, raw)

    conn =
      conn
      |> put_req_header("content-type", "text/plain")
      |> put_req_header("x-github-delivery", "dlv-bad")
      |> put_req_header("x-github-event", "ping")
      |> put_req_header("x-hub-signature-256", sig)
      |> post(@path, raw)

    assert conn.status == 400
    assert problem_type(conn) =~ "bad-payload"
  end

  test "webhook not configured → 503 problem (GitHub retries later)", %{conn: conn} do
    base = :persistent_term.get(@base_gh_key, [])

    Application.put_env(:semtext, Semtext.Github, Keyword.merge(base, webhook_secret: nil))

    conn = deliver(conn, "ping", %{"zen" => "y"})

    assert conn.status == 503
    assert problem_type(conn) =~ "webhook-not-configured"
  end

  defp problem_type(conn) do
    conn |> json_response(conn.status) |> Map.fetch!("type")
  end
end
