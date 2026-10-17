defmodule SemtextWeb.FooterTest do
  use SemtextWeb.ConnCase, async: true

  defp footer(body) do
    [_, rest] = String.split(body, "<footer", parts: 2)
    [footer, _] = String.split(rest, "</footer>", parts: 2)
    footer
  end

  for path <- ["/", "/integrations", "/themes", "/reference"] do
    test "footer on #{path}: no draft wording, new copyright, no marquee, brand", %{conn: conn} do
      conn = get(conn, unquote(path))
      body = html_response(conn, 200)
      f = footer(body)

      refute String.downcase(f) =~ "draft"
      refute f =~ "token-rail"
      refute f =~ "sem-note"
      refute f =~ "no build step"
      assert f =~ "© 2026 Noizu Labs, Inc."
      refute f =~ "© 2026 semtext"
      refute f =~ "Noizu Prompt Lingua"
      refute f =~ "SemText ·"
      assert f =~ "<noizu-footer-brand"
      assert f =~ "components/footer-brand/noizu-footer-brand.js"
      for label <- ~w(Format\ spec Extraction\ contract Repository Vocabulary Lit\ views Reading) do
        refute f =~ label
      end

      refute f =~ "<ul"
      refute f =~ "<a "
      assert length(String.split(body, "<footer")) == 2
    end
  end

  test "token-rail marquee CSS is gone from served stylesheets" do
    for f <- ~w(semtext-site.css landing.css) do
      css = File.read!(Path.expand("../../priv/static/css/#{f}", __DIR__))
      refute css =~ "token-rail", f
    end
  end

  test "home FAQ no longer calls SemText a draft spec", %{conn: conn} do
    body = html_response(get(conn, "/"), 200)
    refute String.downcase(body) =~ "draft spec"
    assert body =~ "SemText is a published spec with a reference implementation"
  end
end
