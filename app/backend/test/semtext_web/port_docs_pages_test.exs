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

    test "GET /extend keeps generated artifact code out of the payload (83c34cd class)", %{
      conn: conn
    } do
      # The scaffold wizard's generated demo.html contains a literal
      # </script>. If that string rides in component state, Hologram's
      # payload encoder embeds it raw, the payload <script> region closes
      # early and the browser throws a SyntaxError. State carries inputs
      # only; the artifacts render from build_files/2 as ESCAPED DOM.
      conn = get(conn, "/extend")
      body = html_response(conn, 200)

      # raw (unescaped) generated markup must appear nowhere in the response
      refute body =~ "<script src=\"./yelp-sem-lazy.js\">"
      refute body =~ "<!doctype html>"

      # the demo artifact still renders, escaped, inside the code window
      # (text-node escaping covers < > & — attribute quotes stay literal)
      assert body =~ "&lt;script src="
      assert body =~ "yelp-sem-lazy.js"
      assert body =~ "yelp-sem-manifest.json"
    end

    test "wizard namespace normaliser matches the Next regex, not a letter dedup", %{} do
      # Next: raw.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") — only
      # runs of INVALID characters collapse to one dash. A whole-list dedup
      # also ate legitimate doubled letters ("acme-tools" → "acme-tols"),
      # found typing in the live wizard.
      alias SemtextWeb.Hologram.Components.Site.VocabScaffoldWizard

      assert VocabScaffoldWizard.parse_namespace("acme-tools") == "acme-tools"
      assert VocabScaffoldWizard.parse_namespace("  My Tools! ") == "my-tools"
      # literal dashes are legal mid-name (only EDGE dashes are stripped)
      assert VocabScaffoldWizard.parse_namespace("a--b") == "a--b"
      assert VocabScaffoldWizard.parse_namespace("--x--") == "x"
      assert VocabScaffoldWizard.parse_namespace("") == ""
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
