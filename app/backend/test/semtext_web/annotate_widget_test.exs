defmodule SemtextWeb.AnnotateWidgetTest do
  use SemtextWeb.ConnCase, async: true

  @script ~s(src="https://cdn.derobot.is/tobor-kit/latest/annotate.js")

  for path <- ["/integrations", "/themes", "/extend"] do
    test "SiteLayout page #{path} carries the annotate widget", %{conn: conn} do
      body = html_response(get(conn, unquote(path)), 200)
      assert body =~ ~s(<script type="module" #{@script})
      assert body =~ "<noizu-page-comments"
      refute body =~ ~r/<noizu-page-comments[^>]*\benabled\b/
      refute body =~ "components/page-comments/page-comments.js"
      assert body =~ ~s(site="semtext")
      assert body =~ ~s(api-base="https://annotate-srv.therobotlives.com")
    end
  end

  test "layout sources render the widget and load keep-location before the runtime" do
    for f <- ~w(site_layout.ex landing_layout.ex main_layout.ex) do
      src = File.read!(Path.expand("../../lib/semtext_web/hologram/layouts/#{f}", __DIR__))
      assert src =~ "<AnnotateWidget />", f
      {kl, _} = :binary.match(src, "/js/keep-location.js")
      {rt, _} = :binary.match(src, "<Hologram.UI.Runtime />")
      assert kl < rt, f
    end

    proposals =
      File.read!(Path.expand("../../lib/semtext_web/hologram/layouts/proposals_layout.ex", __DIR__))

    refute proposals =~ "AnnotateWidget"
  end

  test "keep-location.js is served statically", %{conn: conn} do
    assert get(conn, "/js/keep-location.js").status == 200
  end

  test "semtext sets no CSP header (nothing to extend)", %{conn: conn} do
    conn = get(conn, "/integrations")
    assert get_resp_header(conn, "content-security-policy") == []
  end

  describe "www -> apex redirect" do
    test "301 preserves path and query", %{conn: conn} do
      conn = get(%{conn | host: "www.semtext.dev"}, "/docs/x?tab=a&b=1")
      assert conn.status == 301
      assert get_resp_header(conn, "location") == ["https://semtext.dev/docs/x?tab=a&b=1"]
    end

    test "301 on root and static assets", %{conn: conn} do
      c1 = get(%{conn | host: "www.semtext.dev"}, "/")
      assert get_resp_header(c1, "location") == ["https://semtext.dev/"]
      c2 = get(%{conn | host: "WWW.semtext.dev"}, "/css/app.css")
      assert c2.status == 301
    end

    test "apex is not redirected", %{conn: conn} do
      conn = get(%{conn | host: "semtext.dev"}, "/health")
      assert conn.status == 200
    end
  end

  test "sitemap, robots and llms point at the apex, never www or example.com" do
    for f <- ~w(sitemap.xml site.xml robots.txt llms.txt llm.txt) do
      body = File.read!(Path.expand("../../priv/static/#{f}", __DIR__))
      refute body =~ "example.com", f
      refute body =~ "www.semtext.dev", f
    end

    assert File.read!(Path.expand("../../priv/static/sitemap.xml", __DIR__)) =~
             "https://semtext.dev/"
  end
end
