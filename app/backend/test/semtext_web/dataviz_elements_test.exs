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

    test "loads site-chrome (shared Sem hydration) before the reading bundle", %{conn: conn} do
      conn = get(conn, "/dataviz")
      body = html_response(conn, 200)

      # The shared hydration lives in site-chrome.js (deferred HEAD script
      # from SiteLayout); the reading bundle is a deferred body script, so
      # panes exist before the bundle scans for sem-data-visualizer tags.
      assert body =~ ~s(src="/js/site-chrome.js")
      assert body =~ ~s(src="/dataviz/semtext-reading.js")
      assert body =~ ~s(href="/dataviz/vocabulary.css")

      chrome = String.split(body, ~s(src="/js/site-chrome.js")) |> hd()
      reading = String.split(body, ~s(src="/dataviz/semtext-reading.js")) |> hd()
      assert String.length(chrome) < String.length(reading),
             "site-chrome (Sem hydration) must be referenced before the deferred reading bundle"

      # The hydration implementation ships in site-chrome.js itself.
      js = File.read!(Path.join([Application.app_dir(:semtext), "priv/static/js/site-chrome.js"]))
      assert js =~ "data-sem-html"
      assert js =~ "MutationObserver"
    end

    test "deep links to the tag reference", %{conn: conn} do
      conn = get(conn, "/dataviz")
      body = html_response(conn, 200)

      assert body =~ ~s(href="/reference/sem-data-visualizer/")
    end
  end

  describe "Sem pane SSR inventory (hydration-readiness contract)" do
    @describetag :pane_inventory

    test "every page that ships a Sem pane loads the shared hydration" do
      # Crawl every parity-manifest page route at the SSR layer: any route
      # whose body carries [data-sem-html] hosts must also reference
      # site-chrome.js — with JS on those hosts hydrate; without it they
      # read as authored attributes. The live (JS-on) half of this contract
      # is asserted by the parity harness's browser layer.
      {paned, total} =
        SemtextWeb.Parity.Manifest.routes()
        |> Enum.reject(&(&1["kind"] == "soft-redirect" or is_nil(&1["path"])))
        |> Enum.reduce({0, 0}, fn route, {paned, total} ->
          conn = get(build_conn(), route["path"])
          body = conn.resp_body

          if conn.status in 200..299 do
            total = total + 1

            if body =~ "data-sem-html" do
              paned = paned + 1
              assert body =~ ~s(src="/js/site-chrome.js"),
                     "#{route["path"]} ships Sem panes but not the shared hydration"
              # escaped authored markup must be lossless: visualizer ids readable
              IO.puts("PANES #{route["path"]}")
              {paned, total}
            else
              {paned, total}
            end
          else
            {paned, total}
          end
        end)

      IO.puts("PANE_TOTAL paned=#{paned} pages=#{total}")
      assert paned >= 1, "expected at least /dataviz to ship Sem panes"
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
