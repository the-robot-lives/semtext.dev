defmodule SemtextWeb.PortDocsPagesTest do
  @moduledoc """
  SSR smoke for the port-docs lane's pages: /integrations, /themes,
  /extend, /showcase and the nine showcase slugs. Anchors are the h1 /
  section markers / canonical URLs these modules render — copy-level
  parity is the parity harness's job.
  """

  use SemtextWeb.ConnCase, async: true

  describe "top-level ported pages" do
    test "GET /integrations", %{conn: conn} do
      conn = get(conn, "/integrations")
      assert html_response(conn, 200) =~ "Documents that do more than read"
      assert conn.resp_body =~ "hookup planned"
      assert conn.resp_body =~ "https://semtext.dev/integrations/"
    end

    test "GET /themes", %{conn: conn} do
      conn = get(conn, "/themes")
      body = html_response(conn, 200)
      assert body =~ "Themes"
      assert body =~ "https://semtext.dev/themes/"
    end

    test "GET /extend", %{conn: conn} do
      conn = get(conn, "/extend")
      body = html_response(conn, 200)
      assert body =~ "Extend the vocabulary"
      assert body =~ "vocab_scaffold_wizard"
      assert body =~ "vocab_proposal_wizard"
      assert body =~ "https://semtext.dev/extend/"
    end

    test "GET /showcase (index)", %{conn: conn} do
      conn = get(conn, "/showcase")
      body = html_response(conn, 200)
      assert body =~ "One format, real jobs"
      assert body =~ "https://semtext.dev/showcase/"
      # one card per slug page, hrefs into /showcase/<slug>/
      assert body =~ "/showcase/claude-md/"
      assert body =~ "/showcase/data-viewer/"
    end
  end

  describe "showcase slug pages" do
    @slugs ~w(claude-md documentation onboarding agent command skill data-viewer embedding sem-shell)

    for slug <- @slugs do
      test "GET /showcase/#{slug}", %{conn: conn} do
        conn = get(conn, "/showcase/#{unquote(slug)}")
        assert conn.status == 200
        body = html_response(conn, 200)
        # the ExampleViewer section marker this page's viewer renders
        assert body =~ ~s(id="example-#{unquote(slug)}")
        assert body =~ "https://semtext.dev/showcase/#{unquote(slug)}/"
      end
    end

    test "renderable pages expose the render pane; source-only pages do not", %{conn: conn} do
      renderable = html_response(get(conn, "/showcase/command/"), 200)
      assert renderable =~ "data-sem-render-note"

      source_only = html_response(get(conn, "/showcase/sem-shell/"), 200)
      assert source_only =~ ~s(id="example-sem-shell")
    end
  end
end
