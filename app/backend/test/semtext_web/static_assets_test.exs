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

  # The shell's lazy chunks must travel with the bundle: every file the shell
  # manifest names, all ten command-package chunks, and the wasm worker. These
  # were never vendored before, so nano / jq / awk / git / … failed on the live
  # site (sem-shell finish-line §1.4). This guard fails if a future sync drops
  # them again.
  test "the shell manifest files and every lazy chunk are served", %{conn: conn} do
    root = Path.join([Application.app_dir(:semtext), "priv", "static", "semtext"])

    manifest =
      root |> Path.join("semtext-js-shell-manifest.json") |> File.read!() |> Jason.decode!()

    for {_tag, file} <- manifest do
      assert File.exists?(Path.join(root, file)), "shell manifest file missing: #{file}"
      assert get(conn, "/semtext/" <> file).status == 200, "#{file} not served"
    end

    for pkg <- ~w(fs text jq awk diff git net archive hello wasm) do
      file = "semtext-pkg-#{pkg}.js"
      assert File.exists?(Path.join(root, file)), "package chunk missing: #{file}"
      assert get(conn, "/semtext/" <> file).status == 200, "#{file} not served"
    end

    assert File.exists?(Path.join(root, "worker-wasm.js")), "wasm worker missing"
    assert get(conn, "/semtext/worker-wasm.js").status == 200
  end
end
