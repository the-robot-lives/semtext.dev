defmodule SemtextWeb.AnnotateThreadsControllerTest do
  @moduledoc """
  Endpoint tests for the annotate thread-collection proxy
  (`/api/v1/annotate/threads?site=&page=`): verbatim JSON passthrough (the
  sanitize-nothing contract — visitor content is the EMBED's text-only
  rendering problem, not this route's), param validation, and the fail-soft
  contract. Upstream HTTP is a house StubClient
  (`Semtext.LiveProxy.Client` behaviour injected via app env).
  """

  use SemtextWeb.ConnCase

  alias Semtext.LiveProxy.Annotate

  @base_cfg_key {__MODULE__, :base_cfg}

  setup do
    base_cfg = Application.get_env(:semtext, Annotate, [])
    :persistent_term.put(@base_cfg_key, base_cfg)

    Application.put_env(
      :semtext,
      Annotate,
      Keyword.merge(base_cfg,
        base_url: "https://annotate.test/api/v1",
        http_client: __MODULE__.StubClient
      )
    )

    __MODULE__.StubClient.reset()

    on_exit(fn ->
      :persistent_term.erase(@base_cfg_key)

      if base_cfg == [] do
        Application.delete_env(:semtext, Annotate)
      else
        Application.put_env(:semtext, Annotate, base_cfg)
      end
    end)

    conn = Phoenix.ConnTest.build_conn()
    {:ok, conn: conn}
  end

  describe "GET /api/v1/annotate/threads" do
    test "happy path: verbatim passthrough of visitor content (sanitize nothing)", %{conn: conn} do
      threads = %{
        "threads" => [
          %{
            "id" => "t1",
            "body" => "<script>alert('xss')</script> & <b>bold</b>",
            "author" => "visitor<script>",
            "page_title" => "Docs — /intro"
          }
        ],
        "next_cursor" => nil
      }

      __MODULE__.StubClient.put_reply({:ok, 200, threads})

      conn = get(conn, "/api/v1/annotate/threads?site=semtext&page=/docs/intro")

      assert json_response(conn, 200) == threads
      # the route is a passthrough: hostile-looking visitor strings ride
      # verbatim; rendering them as text is the embed's contract
      assert hd(json_response(conn, 200)["threads"])["body"] ==
               "<script>alert('xss')</script> & <b>bold</b>"

      assert __MODULE__.StubClient.last_url() ==
               "https://annotate.test/api/v1/threads?site=semtext&page=%2Fdocs%2Fintro"
    end

    test "missing site → 400, upstream never called", %{conn: conn} do
      conn = get(conn, "/api/v1/annotate/threads?page=/docs/intro")
      assert %{"error" => "invalid_request", "live" => false} = json_response(conn, 400)
      assert __MODULE__.StubClient.last_url() == nil
    end

    test "missing page → 400", %{conn: conn} do
      conn = get(conn, "/api/v1/annotate/threads?site=semtext")
      assert %{"error" => "invalid_request", "live" => false} = json_response(conn, 400)
    end

    test "page must be site-relative (start with /) → 400", %{conn: conn} do
      conn = get(conn, "/api/v1/annotate/threads?site=semtext&page=https://evil.example")
      assert %{"error" => "invalid_request", "live" => false} = json_response(conn, 400)
      assert __MODULE__.StubClient.last_url() == nil
    end

    test "invalid site slug → 400", %{conn: conn} do
      conn = get(conn, "/api/v1/annotate/threads?site=Not_A_Slug&page=/x")
      assert %{"error" => "invalid_request", "live" => false} = json_response(conn, 400)
    end

    test "upstream 500 → 502 fail-soft", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 500, %{"error" => "boom"}})

      conn = get(conn, "/api/v1/annotate/threads?site=semtext&page=/x")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end

    test "upstream transport failure → 502 fail-soft", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:error, :econnrefused})

      conn = get(conn, "/api/v1/annotate/threads?site=semtext&page=/x")
      assert %{"error" => "upstream_unavailable", "live" => false} = json_response(conn, 502)
    end

    test "upstream 404 → 404 not_found (stay-cached)", %{conn: conn} do
      __MODULE__.StubClient.put_reply({:ok, 404, %{"error" => "unknown site"}})

      conn = get(conn, "/api/v1/annotate/threads?site=ghost&page=/x")
      assert %{"error" => "not_found", "live" => false} = json_response(conn, 404)
    end
  end

  # -- stub ----------------------------------------------------------------

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.LiveProxy.Client

    @reply_key {__MODULE__, :reply}
    @url_key {__MODULE__, :url}

    def reset do
      :persistent_term.put(@reply_key, {:ok, 200, %{}})
      :persistent_term.put(@url_key, nil)
    end

    def put_reply(reply), do: :persistent_term.put(@reply_key, reply)
    def last_url, do: :persistent_term.get(@url_key, nil)

    @impl Semtext.LiveProxy.Client
    def get(url, _headers) do
      :persistent_term.put(@url_key, url)
      :persistent_term.get(@reply_key)
    end

    @impl Semtext.LiveProxy.Client
    def post(_url, _headers, _body), do: {:ok, 200, %{}}
  end
end
