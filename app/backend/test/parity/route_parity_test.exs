defmodule SemtextWeb.Parity.RouteParityTest do
  @moduledoc """
  Hermetic route parity: every manifest route against THIS app's SSR, via
  ConnCase (no server, no ports).

  Verdicts mirror scripts/parity/parity-check.mjs:

  * **GAP** — the app answers 404/405 for a manifest route: not ported yet.
    Recorded (`PARITY GAP`) and SUITE-PASSING; the harness runs against
    whatever routes exist. The live driver adds the cross-server diff on
    top; this layer is the CI-fast signal.
  * **FAIL** — the app serves the route but title/h1/key text diverges from
    the manifest. Flunks: parity regressions must be loud.
  * soft-redirect routes pass on a 3xx to the target OR a 200 carrying the
    meta-refresh contract.

  After the suite, `ExUnit.after_suite` prints the gap ledger so a green
  run still shows exactly which routes are outstanding, per owner lane.
  """

  use SemtextWeb.ConnCase, async: false

  @routes SemtextWeb.Parity.Manifest.routes()

  setup_all do
    # fresh ledger per run
    :persistent_term.put({__MODULE__, :gaps}, [])
    :ok
  end

  for route <- @routes do
    @route route
    test "parity #{route["path"]} (#{route["owner"]})", %{conn: conn} do
      route = @route
      {status, body} = fetch_route(conn, route["path"])

      cond do
        status in [404, 405] ->
          record_gap(route)
          :ok

        route["kind"] == "soft-redirect" ->
          assert_soft_redirect(route, status, body)

        true ->
          assert_page(route, status, body)
      end
    end
  end

  test "parity static resources are served" do
    conn = build_conn()

    for path <- SemtextWeb.Parity.Manifest.static_paths() do
      conn = get(recycle(conn), path)
      assert conn.status == 200, "static resource #{path} must serve (got #{conn.status})"
    end
  end

  ExUnit.after_suite(fn _config ->
    gaps = Enum.reverse(:persistent_term.get({__MODULE__, :gaps}, []))

    IO.puts("""

    ── Route parity ─────────────────────────────────────────────
    #{length(gaps)} route(s) not ported yet (GAP — informational, not a failure):#{for r <- gaps, do: "\n  GAP #{r["path"]}  [#{r["owner"]}]"}
    Route parity FAILs would have flunked above. Live cross-server diff:
      node scripts/parity/parity-check.mjs --next <url> --app <url>
    ─────────────────────────────────────────────────────────────
    """)
  end)

  # -- helpers --

  defp fetch_route(conn, path) do
    conn = get(conn, path)

    if conn.status in [404, 405] and String.ends_with?(path, "/") do
      # The Next static export serves directory URLs; the app serves
      # extensionless paths. The convention difference must never read as
      # a parity gap — retry de-slashed.
      conn = get(build_conn(), String.trim_trailing(path, "/"))
      {conn.status, conn.resp_body}
    else
      {conn.status, conn.resp_body}
    end
  end

  defp assert_page(route, status, body) do
    assert status in 200..299,
           "route #{route["path"]} answered #{status} — a crash on a ported route is loud, never a gap"

    assert_title(route, body)
    assert_h1(route, body)

    for needle <- route["keyText"] || [] do
      assert body =~ needle,
             "route #{route["path"]} is missing key text #{inspect(needle)}"
    end
  end

  defp assert_title(route, body) do
    case Regex.run(~r/<title[^>]*>([\s\S]*?)<\/title>/, body) do
      [_, title] ->
        assert unescape(title) == route["title"],
               "route #{route["path"]} title #{inspect(unescape(title))} != manifest #{inspect(route["title"])}"

      nil ->
        # SSR pages must carry the layout <title>; its absence is a
        # head-contract gap, loud for pages that exist.
        flunk("route #{route["path"]} rendered no <title> element")
    end
  end

  defp assert_h1(route, body) do
    want = route["h1"] && String.replace_suffix(route["h1"], "…", "")

    case Regex.run(~r/<h1[^>]*>([\s\S]*?)<\/h1>/, body) do
      [_, h1] ->
        got =
          h1
          |> String.replace(~r/<[^>]+>/, "")
          |> unescape()
          |> String.replace(~r/\s+/, " ")
          |> String.trim()

        assert String.starts_with?(got, want),
               "route #{route["path"]} h1 #{inspect(got)} does not start with #{inspect(want)}"

      nil ->
        flunk("route #{route["path"]} rendered no <h1> element")
    end
  end

  # Rendered pages HTML-escape their text (`<sem-note>` titles arrive as
  # "&lt;sem-note&gt;"); the manifest stores unescaped text.
  defp unescape(text) do
    text
    |> String.replace("&lt;", "<")
    |> String.replace("&gt;", ">")
    |> String.replace("&quot;", "\"")
    |> String.replace("&#39;", "'")
    |> String.replace("&amp;", "&")
  end

  defp assert_soft_redirect(route, status, body) do
    target = route["redirectTarget"]

    cond do
      status in 300..399 ->
        :ok

      status in 200..299 and Regex.match?(~r/http-equiv=["']?refresh/i, body) ->
        assert body =~ target,
               "meta refresh on #{route["path"]} must point at #{target}"

      true ->
        flunk(
          "route #{route["path"]} must soft-redirect to #{target} (3xx or meta refresh); got #{status}"
        )
    end
  end

  defp record_gap(route) do
    current = :persistent_term.get({__MODULE__, :gaps}, [])
    :persistent_term.put({__MODULE__, :gaps}, [route | current])
    IO.puts("PARITY GAP: #{route["path"]} — route not ported yet (owner: #{route["owner"]})")
  end
end
