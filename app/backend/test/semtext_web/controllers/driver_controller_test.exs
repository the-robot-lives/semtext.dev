defmodule SemtextWeb.DriverControllerTest do
  @moduledoc """
  Endpoint tests for the Phase 6 driver mock (`POST /api/v1/driver/run`,
  `GET /api/v1/driver/runs/:id`): request validation (each invalid field →
  400 structured JSON, no job created), full lifecycle (create → poll →
  terminal), determinism (same script_ref ⇒ identical results), unknown-run
  404, the shared `proxy_read` rate limit (config + wired burst — no sleep
  test), and the always-`mock` mode marker. No Bypass, no new deps: the
  simulation is in-process (`Semtext.Driver.MockRunner`), driven through the
  house ConnCase.
  """

  use SemtextWeb.ConnCase

  @run_path "/api/v1/driver/run"
  @ref "cypress/e2e/smoke.cy.js"

  describe "POST /api/v1/driver/run — validation" do
    test "valid cypress run → 201 queued envelope, mode mock, no finished_at", %{conn: conn} do
      conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => @ref})

      assert %{"id" => id, "suite" => "cypress", "script_ref" => @ref, "target" => nil} =
               json_response(conn, 201)

      assert Regex.match?(~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, id)
      assert json_response(conn, 201)["state"] == "queued"
      assert json_response(conn, 201)["started_at"] == nil
      assert json_response(conn, 201)["results"] == []
      assert json_response(conn, 201)["mode"] == "mock"
      refute Map.has_key?(json_response(conn, 201), "finished_at")
    end

    test "valid cucumber run with target → 201, target echoed", %{conn: conn} do
      conn =
        post(conn, @run_path, %{
          "suite" => "cucumber",
          "script_ref" => "https://example.test/features/login.feature",
          "target" => "https://staging.example.test"
        })

      body = json_response(conn, 201)
      assert body["suite"] == "cucumber"
      assert body["target"] == "https://staging.example.test"
      assert body["mode"] == "mock"
    end

    test "unknown suite → 400 structured error", %{conn: conn} do
      conn = post(conn, @run_path, %{"suite" => "playwright", "script_ref" => @ref})

      assert %{"error" => "invalid_request", "errors" => %{"suite" => [msg]}} =
               json_response(conn, 400)

      assert msg =~ "cypress"
      assert msg =~ "cucumber"
    end

    test "missing suite → 400", %{conn: conn} do
      conn = post(conn, @run_path, %{"script_ref" => @ref})

      assert %{"error" => "invalid_request", "errors" => %{"suite" => _}} =
               json_response(conn, 400)
    end

    test "non-string suite → 400", %{conn: conn} do
      conn = post(conn, @run_path, %{"suite" => 42, "script_ref" => @ref})
      assert %{"errors" => %{"suite" => _}} = json_response(conn, 400)
    end

    test "missing script_ref → 400", %{conn: conn} do
      conn = post(conn, @run_path, %{"suite" => "cypress"})
      assert %{"errors" => %{"script_ref" => _}} = json_response(conn, 400)
    end

    test "blank script_ref (empty and whitespace) → 400", %{conn: conn} do
      for ref <- ["", "   "] do
        conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => ref})
        assert %{"errors" => %{"script_ref" => _}} = json_response(conn, 400)
      end
    end

    test "script_ref that is neither path nor URL, or not a string → 400", %{conn: conn} do
      conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => "justafile"})
      assert %{"errors" => %{"script_ref" => [msg]}} = json_response(conn, 400)
      assert msg =~ "path or URL"

      conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => 123})
      assert %{"errors" => %{"script_ref" => _}} = json_response(conn, 400)
    end

    test "invalid target, and a non-object body → 400", %{conn: conn} do
      # raw JSON array body — Phoenix parses non-object JSON params to %{}, so
      # the endpoint answers the per-field 400; the non-map guard itself is
      # covered by the direct context assert below.
      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(@run_path, "[1, 2, 3]")

      assert %{"error" => "invalid_request", "errors" => errors} = json_response(conn, 400)
      assert errors != %{}

      assert {:error, %{"body" => ["must be a JSON object"]}} =
               Semtext.Driver.create_run([1, 2, 3])

      conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => @ref, "target" => ""})
      assert %{"errors" => %{"target" => _}} = json_response(conn, 400)

      conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => @ref, "target" => 42})
      assert %{"errors" => %{"target" => _}} = json_response(conn, 400)
    end
  end

  describe "GET /api/v1/driver/runs/:id" do
    test "full lifecycle: create → poll → terminal with consistent results", %{conn: conn} do
      conn = post(conn, @run_path, %{"suite" => "cypress", "script_ref" => @ref})
      assert %{"id" => id} = json_response(conn, 201)

      run = poll_until_terminal(conn, id)

      assert run["state"] in ["passed", "failed"]
      refute is_nil(run["started_at"])
      refute is_nil(run["finished_at"])
      assert run["mode"] == "mock"

      checks = run["results"]
      assert length(checks) in 3..6

      assert Enum.all?(checks, fn c ->
               is_binary(c["name"]) and c["status"] in ["passed", "failed"] and
                 is_integer(c["duration_ms"]) and c["duration_ms"] >= 0
             end)

      statuses = Enum.map(checks, & &1["status"])

      if run["state"] == "passed" do
        refute "failed" in statuses
      else
        assert Enum.count(statuses, &(&1 == "failed")) >= 1
      end
    end

    test "determinism: same script_ref ⇒ identical results and state", %{conn: conn} do
      assert %{"id" => id1} =
               post(conn, @run_path, %{"suite" => "cypress", "script_ref" => @ref})
               |> json_response(201)

      assert %{"id" => id2} =
               post(conn, @run_path, %{"suite" => "cypress", "script_ref" => @ref})
               |> json_response(201)

      refute id1 == id2

      run1 = poll_until_terminal(conn, id1)
      run2 = poll_until_terminal(conn, id2)

      assert run1["results"] == run2["results"]
      assert run1["state"] == run2["state"]
      assert length(run1["results"]) == length(Semtext.Driver.MockRunner.plan(@ref))
    end

    test "unknown run id → 404 JSON", %{conn: conn} do
      conn = get(conn, "/api/v1/driver/runs/00000000-0000-0000-0000-000000000000")
      assert %{"error" => "not_found"} = json_response(conn, 404)
    end

    test "mode field is always mock, at terminal too", %{conn: conn} do
      assert %{"id" => id, "mode" => "mock"} =
               post(conn, @run_path, %{"suite" => "cucumber", "script_ref" => @ref})
               |> json_response(201)

      run = poll_until_terminal(conn, id)
      assert run["mode"] == "mock"
    end
  end

  describe "rate limiting" do
    test "driver routes share the proxy_read 60/min limit — config + wired burst, no sleeps", %{
      conn: conn
    } do
      # Config level: the exact pattern the Phase 5 proxy routes reuse.
      assert %{action: :proxy_read, limit: 60, period: 60_000} =
               SemtextWeb.Plugs.RateLimit.init(action: :proxy_read)

      # Wiring level: burst 61 invalid POSTs through the real pipeline on a
      # throwaway unique IP (rerun-safe — no bucket history), no sleeps.
      n = System.unique_integer([:positive])
      burst = %{conn | remote_ip: {10, rem(n, 256), rem(div(n, 256), 256), 7}}

      statuses =
        for _ <- 1..61 do
          conn = post(burst, @run_path, %{"suite" => "nope", "script_ref" => "x"})
          conn.status
        end

      assert List.last(statuses) == 429
      assert Enum.uniq(statuses) |> Enum.sort() |> Enum.any?(&(&1 == 400))
      assert Enum.count(statuses, &(&1 == 400)) in 1..60
    end

    test "429 body is the shared rate-limit JSON with retry-after", %{conn: conn} do
      n = System.unique_integer([:positive])
      burst = %{conn | remote_ip: {10, rem(n, 256), rem(div(n, 256), 256), 9}}

      conn =
        1..61
        |> Enum.reduce(burst, fn _, conn -> post(conn, @run_path, %{"suite" => "nope"}) end)

      assert conn.status == 429
      assert ["60"] = Plug.Conn.get_resp_header(conn, "retry-after")
      assert %{"error" => "Too many requests. Try again later."} = json_response(conn, 429)
    end
  end

  describe "Semtext.Driver.MockRunner.plan/1" do
    test "deterministic, 3..6 checks, and both terminal states are reachable" do
      plan = Semtext.Driver.MockRunner.plan(@ref)
      assert plan == Semtext.Driver.MockRunner.plan(@ref)
      assert length(plan) in 3..6
      assert Enum.all?(plan, &(&1.status in [:passed, :failed] and is_binary(&1.name)))

      outcomes =
        for i <- 1..40 do
          "cypress/e2e/spec-#{i}.cy.js"
          |> Semtext.Driver.MockRunner.plan()
          |> Enum.any?(&(&1.status == :failed))
        end

      assert true in outcomes
      assert false in outcomes
    end
  end

  # -- helpers --------------------------------------------------------------

  defp poll_until_terminal(conn, id, tries \\ 50)

  defp poll_until_terminal(_conn, id, 0), do: flunk("run #{id} never reached a terminal state")

  defp poll_until_terminal(conn, id, tries) do
    run = get(conn, "/api/v1/driver/runs/#{id}") |> json_response(200)

    if run["state"] in ["passed", "failed"] do
      run
    else
      Process.sleep(5)
      poll_until_terminal(conn, id, tries - 1)
    end
  end
end
