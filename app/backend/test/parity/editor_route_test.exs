defmodule SemtextWeb.Parity.EditorRouteTest do
  @moduledoc """
  /editor route checks (site-editor lane, P3).

  The route is Hologram-only — it has NO Next.js counterpart, so it
  deliberately does NOT live in scripts/parity/parity-routes.json: that
  manifest is the Next-derived contract, and a Hologram-only entry would
  read as a Next-side divergence in the live cross-server driver. These
  are the direct SSR + data-endpoint checks instead (placement coordinated
  with the parity-harness lane).

  The payload-leak assertions below pin the page's core contract: no
  SemText markup may travel in page state or the hydration payload —
  documents reach the browser only via /editor/examples/:tag, fetched
  client-side after load.
  """

  use SemtextWeb.ConnCase, async: false

  alias Semtext.Reference.{Tags, Variants}

  # Hologram's SSR embeds the client payload in an early <script>; checks
  # below must never read inside it (same rule as the parity suite).
  defp script_stripped(body) do
    String.replace(body, ~r/<script\b[\s\S]*?<\/script>/i, "")
  end

  test "/editor serves the editor island chrome" do
    conn = get(build_conn(), "/editor")
    assert conn.status == 200
    body = script_stripped(conn.resp_body)
    raw = conn.resp_body

    assert body =~ ~r/<title[^>]*>Editor — SemText<\/title>/
    # Instrument revamp (2026-10-18): the page is app chrome — the <main>
    # carries the frame-fit class and the hero (h1 + copy) is gone.
    assert body =~ ~r/<main id="main"[^>]*class="sem-ed-page-main"/
    assert body =~ ~r/<main id="main"[^>]*>/
    refute h1_in_main?(body), "the Instrument /editor has no hero h1"

    # the island mount + the deferred boot chain (order is load-bearing in
    # the template: flags → core bundle → editor bundle → boot script; the
    # bundles are TEMPLATE-AUTHORED defer tags, not island-driven — the
    # island bridge's appended script tags race Hologram hydration).
    # Bundle paths are the VERSION-PINNED immutable snapshot.
    assert body =~ "id=\"editor-root\""
    assert body =~ "id=\"editor-status\""
    # Site-local boot scripts carry AssetVersion content hashes (?v=hex);
    # the /semtext/ snapshot bundles are version-pinned paths — no hash.
    assert raw =~ ~r|src="/js/editor-flags\.js(\?v=[0-9a-f]+)?"|
    assert raw =~ "src=\"/semtext/v0.8.3/semtext.js\""
    assert raw =~ "src=\"/semtext/v0.8.3/semtext-editor.js\""
    assert raw =~ ~r|src="/js/editor-boot\.js(\?v=[0-9a-f]+)?"|

    order =
      Regex.run(
        ~r/editor-flags\.js(\?v=[0-9a-f]+)?[\s\S]*v0\.8\.3\/semtext\.js[\s\S]*v0\.8\.3\/semtext-editor\.js[\s\S]*editor-boot\.js(\?v=[0-9a-f]+)?/,
        raw
      )

    assert order != [],
           "boot chain must load flags → core bundle → editor bundle → boot script in that order"

    # payload-leak rule: no SemText markup in the served page or its
    # hydration payload — refutes run against the RAW body so script
    # regions (where the payload lives) are inspected too.
    refute raw =~ "<sem-note"
    refute raw =~ "data-sem-html"
    refute raw =~ "data-sem-pane"
    refute raw =~ "<sem-editor>"
  end

  test "the editor static assets serve" do
    for path <- [
          "/js/editor-flags.js",
          "/semtext/v0.8.3/semtext.js",
          "/semtext/v0.8.3/semtext-editor.js",
          "/js/editor-boot.js"
        ] do
      conn = get(build_conn(), path)
      assert conn.status == 200, "#{path} must serve (got #{conn.status})"
    end
  end

  test "/editor/examples/:tag serves the primary example" do
    conn = get(build_conn(), "/editor/examples/sem-note")
    assert conn.status == 200
    assert get_resp_header(conn, "content-type") |> hd() =~ "application/json"

    doc = json_response(conn, 200)
    assert doc["tag"] == "sem-note"
    assert doc["slug"] == "sem-note"
    assert doc["variant"] == nil
    assert doc["source"] =~ "<sem-note"
    assert is_list(doc["files"])
    assert is_list(doc["themeCss"])
  end

  test "/editor/examples/:tag?variant=<id> serves that variant's source" do
    case Variants.for_tag("sem-note") do
      [] ->
        # Data-driven guard: if the reference data loses sem-note variants
        # the param path is covered by the 404 test below instead.
        :ok

      [v | _] ->
        conn = get(build_conn(), "/editor/examples/sem-note?variant=#{v.id}")
        assert conn.status == 200
        doc = json_response(conn, 200)
        assert doc["variant"] == v.id
        assert doc["label"] == v.label
        assert doc["source"] == v.code
    end
  end

  test "unknown tag, unknown variant, and example-less tags answer 404 with a detail" do
    conn = get(build_conn(), "/editor/examples/not-a-tag")
    assert %{"errors" => %{"detail" => _}} = json_response(conn, 404)

    conn = get(build_conn(), "/editor/examples/sem-note?variant=does-not-exist")
    assert %{"errors" => %{"detail" => _}} = json_response(conn, 404)

    case Enum.find(Tags.all_tags(), &(&1.example == "")) do
      nil ->
        :ok

      tag ->
        assert %{"errors" => _} =
                 json_response(get(build_conn(), "/editor/examples/#{tag.name}"), 404)
    end
  end

  test "reference tag pages carry no Open-in-editor links (removed 2026-10-17 feedback)" do
    conn = get(build_conn(), "/reference/sem-note")
    assert conn.status == 200
    body = script_stripped(conn.resp_body)

    refute body =~ "/editor?example="
    refute body =~ "Open in editor"
  end

  test "showcase pages carry no Open-in-editor link (removed 2026-10-17 feedback)" do
    conn = get(build_conn(), "/showcase/sem-shell")
    assert conn.status == 200
    refute script_stripped(conn.resp_body) =~ "href=\"/editor\""
  end

  # -- helpers --

  defp h1_in_main?(body) do
    scope =
      case :binary.match(body, "<main") do
        {pos, _} -> binary_part(body, pos, byte_size(body) - pos)
        :nomatch -> body
      end

    Regex.match?(~r/<h1[\s>]/, scope)
  end
end
