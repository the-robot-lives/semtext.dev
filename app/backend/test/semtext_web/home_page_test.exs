defmodule SemtextWeb.HomePageTest do
  use SemtextWeb.ConnCase

  test "GET / renders the P0 smoke page via SSR", %{conn: conn} do
    conn = get(conn, "/")
    assert conn.status == 200

    body = html_response(conn, 200)
    assert body =~ "semtext.dev (Hologram)"
  end
end
