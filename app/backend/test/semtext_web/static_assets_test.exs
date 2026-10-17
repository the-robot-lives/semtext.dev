defmodule SemtextWeb.StaticAssetsTest do
  use SemtextWeb.ConnCase

  # Vendored SemText runtime bundles (priv/static/semtext) must serve at
  # /semtext/** — same artefacts the Next.js site ships (design v2 §2.2) —
  # and the island bridge at /js/semtext-island.js.

  test "the island bridge is served", %{conn: conn} do
    conn = get(conn, "/js/semtext-island.js")
    assert conn.status == 200
    assert conn.resp_body =~ "SemtextIsland"
  end

  test "vendored SemText bundles are served under /semtext/", %{conn: conn} do
    conn = get(conn, "/semtext/semtext-manifest.json")
    assert conn.status == 200
  end

  test "a vendored JS chunk resolves (bundle dir wired, not just the manifest)", %{conn: conn} do
    root = Path.join([Application.app_dir(:semtext), "priv", "static", "semtext"])
    [js | _] = root |> File.ls!() |> Enum.filter(&String.ends_with?(&1, ".js"))

    conn = get(conn, "/semtext/" <> js)
    assert conn.status == 200
  end
end
