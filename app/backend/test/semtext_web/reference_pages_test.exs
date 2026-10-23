defmodule SemtextWeb.ReferencePagesTest do
  @moduledoc """
  Page-level tests for the /reference section: index render, one element
  page's key sections, the sem-md special case, the unknown-slug body and
  the cache header. Exercises the Hologram pages through the endpoint.
  """

  use SemtextWeb.ConnCase, async: true

  @moduletag :reference_pages

  describe "GET /reference" do
    setup %{conn: conn}, do: {:ok, conn: get(conn, "/reference")}

    test "responds 200", %{conn: conn} do
      assert conn.status == 200
    end

    test "renders the intro, filter and count", %{conn: conn} do
      body = html_response(conn, 200)
      assert body =~ "Tag reference"
      assert body =~ "ref-search"
      assert body =~ "ref-count"
      assert body =~ "Filter tags"
    end

    test "renders every bucket label and the NPL family", %{conn: conn} do
      body = html_response(conn, 200)

      for label <- ["Prose & code", "Document & structure", "Facts & recall", "NPL elements"] do
        assert body =~ label
      end
    end

    test "renders one card per element with the filter payload", %{conn: conn} do
      body = html_response(conn, 200)
      assert body =~ "data-ref-tag=\"sem-note\""
      assert body =~ "data-ref-tag=\"sem-enhanced-document\""
      assert body =~ "data-ref-tag=\"npl-cot\""
      # Current generated data has no schema gaps — the "No summary stated"
      # gap-note path is defensive only (see reference_data_test's gaps test).
      refute body =~ "No summary stated"
    end

    test "loads the reference assets", %{conn: conn} do
      body = html_response(conn, 200)
      assert body =~ "/css/reference.css"
      assert body =~ "/js/semtext-island.js"
    end

    test "sends the section cache header", %{conn: conn} do
      assert get_resp_header(conn, "cache-control") == [
               "public, max-age=300, stale-while-revalidate=86400"
             ]
    end
  end

  describe "GET /reference/sem-note" do
    setup %{conn: conn}, do: {:ok, conn: get(conn, "/reference/sem-note")}

    test "responds 200 with the element title", %{conn: conn} do
      assert conn.status == 200
      body = html_response(conn, 200)
      assert body =~ "<title>&lt;sem-note&gt; — SemText reference</title>"
      assert body =~ "&lt;sem-note&gt;"
      assert body =~ "SemText element"
    end

    test "renders the options table", %{conn: conn} do
      body = html_response(conn, 200)
      assert body =~ "ref-attrs"
      assert body =~ "variant"
    end

    test "renders the example section with a viewer pane payload", %{conn: conn} do
      body = html_response(conn, 200)
      assert body =~ "example-primary"
      assert body =~ "data-sem-pane"
      assert body =~ "/semtext/chunks/sem-note.js"
    end

    test "no shipped-runtime provenance line (removed, thread f6f3477a)", %{conn: conn} do
      body = html_response(conn, 200)
      refute body =~ "Shipped runtime:"
    end
  end

  describe "GET /reference/sem-md" do
    test "renders the static render + authored element", %{conn: conn} do
      conn = get(conn, "/reference/sem-md")
      body = html_response(conn, 200)

      assert body =~ "ref-md-static"
      assert body =~ "ref-md-static-label"
      assert body =~ "Token lifetimes"
      assert body =~ "<sem-md"
      assert body =~ "sem-md.md"
    end
  end

  # Regression: the semext-sig-traces authored example embeds a
  # `<script type="application/json">…</script>` block, and Hologram
  # serializes component props/state into the pageMountData <script>
  # block without escaping `</` — the literal close-tag inside the
  # example ended the state script early and dumped serialized state
  # (componentRegistry: Type.map(…)…) onto the rendered page.
  describe "GET /reference/semext-sig-traces (pageMountData integrity)" do
    setup %{conn: conn}, do: {:ok, conn: get(conn, "/reference/semext-sig-traces")}

    test "responds 200 with the viewer, pane payload and authored source", %{conn: conn} do
      assert conn.status == 200
      body = html_response(conn, 200)
      assert body =~ "example-primary"
      assert body =~ "data-sem-pane"
      assert body =~ "checkout-traces"
      # the authored inner script block still reaches the pane payload
      assert body =~ "application/json"
    end

    test "serialized state script is never terminated early", %{conn: conn} do
      body = html_response(conn, 200)
      offset = elem(:binary.match(body, "pageMountData"), 0)
      tail = binary_part(body, offset, byte_size(body) - offset)
      close = elem(:binary.match(tail, "</script>"), 0)
      # The first close-tag after pageMountData must be the state script's
      # own — the emitted state runs to completion before it.
      assert binary_part(tail, 0, close) =~ "subReceiptDrops"
    end
  end

  describe "GET /reference/<unknown>" do
    test "renders the not-found body", %{conn: conn} do
      conn = get(conn, "/reference/definitely-not-a-tag")
      assert conn.status == 200
      body = html_response(conn, 200)
      assert body =~ "Not found"
    end
  end

  describe "canonical links" do
    test "index canonical carries the trailing slash", %{conn: conn} do
      conn = get(conn, "/reference")

      assert html_response(conn, 200) =~
               ~s(rel="canonical" href="https://semtext.dev/reference/")
    end

    test "element canonical falls back to the section canonical", %{conn: conn} do
      # Hologram layout props are compile-time constants (page state is not
      # addressable in layouts — renderer TODO) — per-element canonicals need
      # a SiteLayout change; flagged in the lane report.
      conn = get(conn, "/reference/sem-note")

      assert html_response(conn, 200) =~
               ~s(href="https://semtext.dev/reference/")
    end
  end

  describe "cache scope" do
    test "non-reference paths are not cached", %{conn: conn} do
      conn = get(conn, "/api/v1/config/features")
      # 200 or 404 both fine — the assertion is the header's absence.
      assert get_resp_header(conn, "cache-control") != [
               "public, max-age=300, stale-while-revalidate=86400"
             ]
    end
  end
end
