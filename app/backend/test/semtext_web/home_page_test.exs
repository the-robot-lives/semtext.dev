defmodule SemtextWeb.HomePageTest do
  use SemtextWeb.ConnCase

  # `/` — the ported landing page (port-landing lane). SSR assertions cover
  # the zero-JS contract: sections present, tablist hidden pre-hydration,
  # hydration-gated chrome (aria-roledescription) absent, Sem blocks shipped
  # as authored markup.

  test "GET / renders the landing page via SSR", %{conn: conn} do
    conn = get(conn, "/")
    assert conn.status == 200

    body = html_response(conn, 200)
    assert body =~ "One XHTML file"
    assert body =~ "in place of Markdown"
  end

  test "the page title and meta ship in the layout", %{conn: conn} do
    body =
      conn
      |> get("/")
      |> html_response(200)

    assert body =~ "SemText — one XHTML file, in place of Markdown"
    assert body =~ "og:title"
    assert body =~ "canonical"
  end

  test "all landing sections are present", %{conn: conn} do
    body =
      conn
      |> get("/")
      |> html_response(200)

    for id <- ["try", "reading", "start", "surface", "scope", "addons", "extend"] do
      assert body =~ "id=\"#{id}\""
    end
  end

  test "hero window: source pre present, pills absent pre-hydration", %{conn: conn} do
    body =
      conn
      |> get("/")
      |> html_response(200)

    assert body =~ "A SemText document fragment"
    assert body =~ "auth-notes.xhtml"
    # The Source/Render pills are hydration-gated chrome.
    refute body =~ "aria-pressed"
  end

  test "try views: tablist hidden pre-hydration, panels visible, no roledescription", %{
    conn: conn
  } do
    body =
      conn
      |> get("/")
      |> html_response(200)

    assert body =~ "role=\"tablist\""
    assert body =~ "hidden"
    assert body =~ "try-tab-code"
    assert body =~ "demo/example-deck.sem.html"
    # Carousel/generator chrome only exists after hydration dispatch.
    refute body =~ "aria-roledescription"
  end

  test "code windows and Sem blocks ship authored markup", %{conn: conn} do
    body =
      conn
      |> get("/")
      |> html_response(200)

    assert body =~ "figure class=\"code-window\""
    assert body =~ "<sem-note variant=\"info\">"
    assert body =~ "<sem-reveal summary=\"Why not Markdown?\" collapsed"
    assert body =~ "<sem-procedure kind=\"submission\""
    assert body =~ "data-sem-theme=\"minimal-tech-light\""
  end

  test "showcase menu lists every showcase doc and integration", %{conn: conn} do
    body =
      conn
      |> get("/")
      |> html_response(200)

    assert body =~ "showcase-menu"
    assert body =~ "/showcase/claude-md/"
    assert body =~ "therobotlearns.com"
    assert body =~ "g-status"
  end

  test "landing statics are served", %{conn: conn} do
    for path <- [
          "/demo/example-deck.sem.html",
          "/spec/semtext.html",
          "/js/landing-bootstrap.js",
          "/css/landing.css"
        ] do
      conn = get(conn, path)
      assert conn.status == 200, path
    end
  end
end
