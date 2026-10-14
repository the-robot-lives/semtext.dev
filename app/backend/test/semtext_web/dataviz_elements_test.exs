defmodule SemtextWeb.DatavizElementsTest do
  use SemtextWeb.ConnCase, async: true

  @moduletag :port_reference

  describe "GET /dataviz" do
    test "responds 200 with the showcase title and h1", %{conn: conn} do
      conn = get(conn, "/dataviz")
      body = html_response(conn, 200)

      assert body =~ "<title>Data visualizer — SemText showcase</title>"
      assert body =~ "Data visualizer"
    end

    test "carries both visualizer panes as escaped Sem attributes", %{conn: conn} do
      conn = get(conn, "/dataviz")
      body = html_response(conn, 200)

      # The authored markup travels attribute-escaped (Hologram escapes
      # every interpolation) — lossless for sem-html-boot.js to hydrate.
      assert body =~ "data-sem-html"
      assert body =~ "&lt;sem-data-visualizer id=&quot;dv-fleet&quot;&gt;"
      assert body =~ "&lt;sem-data-visualizer id=&quot;dv-ops&quot;&gt;"
      assert body =~ "data-views=&quot;all=*; operators=name, replicas&quot;"

      # Payload-leak rule (83c34cd): no raw </script> may ride in the
      # hydration payload. The authored blocks contain no script bytes at
      # all; assert the payload stays clean where the panes live.
      refute body =~ "dataviz-sem-leak"
    end

    test "loads the reading bundle chain in order", %{conn: conn} do
      conn = get(conn, "/dataviz")
      body = html_response(conn, 200)

      assert body =~ ~s(src="/dataviz/sem-html-boot.js")
      assert body =~ ~s(src="/dataviz/semtext-reading.js")
      assert body =~ ~s(href="/dataviz/vocabulary.css")

      boot = String.split(body, ~s(src="/dataviz/sem-html-boot.js")) |> hd()
      reading = String.split(body, ~s(src="/dataviz/semtext-reading.js")) |> hd()
      assert String.length(boot) < String.length(reading),
             "the hydration boot must be referenced before the deferred reading bundle"
    end

    test "deep links to the tag reference", %{conn: conn} do
      conn = get(conn, "/dataviz")
      body = html_response(conn, 200)

      assert body =~ ~s(href="/reference/sem-data-visualizer/")
    end
  end

  describe "GET /elements" do
    test "responds 200 with the redirect notice title and h1", %{conn: conn} do
      conn = get(conn, "/elements")
      body = html_response(conn, 200)

      assert body =~ "<title>Redirecting to the tag reference — SemText</title>"
      assert body =~ "The elements moved"
    end

    test "meta refresh points at /reference/", %{conn: conn} do
      conn = get(conn, "/elements")
      body = html_response(conn, 200)

      assert body =~ ~s(http-equiv="refresh")
      assert body =~ ~s(content="0; url=/reference/")
    end

    test "keeps the manual link for non-refreshing agents", %{conn: conn} do
      conn = get(conn, "/elements")
      body = html_response(conn, 200)

      assert body =~ ~s(href="/reference/")
      assert body =~ "Redirecting"
    end
  end
end
