defmodule SemtextWeb.Plugs.HostDispatchTest do
  use SemtextWeb.ConnCase

  @proposals_host "proposals.semtext.dev"

  test "main host falls through to the site router", %{conn: conn} do
    conn = get(%{conn | host: "www.example.com"}, "/health")
    assert json_response(conn, 200)["status"] == "ok"
    assert conn.assigns[:semtext_host] == :main
  end

  test "apex host falls through to the site router", %{conn: conn} do
    conn = get(%{conn | host: "semtext.dev"}, "/health")
    assert json_response(conn, 200)["status"] == "ok"
  end

  test "proposals host dispatches to the proposals router", %{conn: conn} do
    conn = get(%{conn | host: @proposals_host}, "/")
    body = json_response(conn, 200)

    assert conn.assigns[:semtext_host] == :proposals
    assert body["service"] == "semtext-proposals"
    assert body["status"] == "skeleton"
  end

  test "proposals detail stub reports not_implemented", %{conn: conn} do
    conn = get(%{conn | host: @proposals_host}, "/p/some-slug")
    body = json_response(conn, 404)

    assert body["error"] == "not_implemented"
    assert body["slug"] == "some-slug"
  end

  test "proposals host never reaches Hologram page routes", %{conn: conn} do
    # A Hologram page route (the smoke page) must 404 on the proposals host.
    # It would return HTML if Hologram.Router ever saw the conn.
    conn = get(%{conn | host: @proposals_host}, "/reference")

    assert conn.status == 404
    refute get_resp_header(conn, "content-type") |> List.first() |> String.contains?("html")
  end

  test "unknown host is a 404 with no catch-all", %{conn: conn} do
    conn = get(%{conn | host: "evil.example.com"}, "/reference")

    assert conn.status == 404
    assert conn.resp_body == "not found"
    refute conn.assigns[:semtext_host]
  end

  test "unknown host still answers configured probe paths (k8s probes hit the pod IP)", %{
    conn: conn
  } do
    conn = get(%{conn | host: "10.0.4.7"}, "/health")
    assert json_response(conn, 200)["status"] == "ok"
    assert conn.assigns[:semtext_host] == :probe
  end

  test "host headers carrying ports dispatch the same", %{conn: conn} do
    conn = get(%{conn | host: "#{@proposals_host}:4000"}, "/")
    assert json_response(conn, 200)["service"] == "semtext-proposals"
  end
end
