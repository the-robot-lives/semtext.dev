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

    test "GET /themes/showcase", %{conn: conn} do
      conn = get(conn, "/themes/showcase")
      body = html_response(conn, 200)
      assert body =~ "Theme showcase"
      assert body =~ "https://semtext.dev/themes/showcase/"

      # one themed panel per shipped theme, scoped on its wrapper
      for slug <- ~w(minimal-tech-light nocturne-console organic-warm editorial-settings newsprint) do
        assert body =~ "data-sem-theme=\"#{slug}\""
      end

      # the consolidated latest bundle is what themes the panels
      assert body =~ "/semtext/latest/semtext.css"
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
        # the section marker the page renders. ExampleViewer pages use
        # id="example-<slug>"; the onboarding island page (#153) owns its
        # section directly with the plain id="example" anchor.
        if unquote(slug) == "onboarding" do
          assert body =~ ~s(id="example")
        else
          assert body =~ ~s(id="example-#{unquote(slug)}")
        end
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

  # The renderable showcase pages seed the raw example source into page
  # state (`example: @example`) and render it into `data-sem-html`, which
  # site-chrome.js hydrates. State rides Hologram's payload <script>
  # region: a literal </script in an example would close that region
  # early and SyntaxError the whole page (83c34cd / 62a3b06 leak class).
  describe "showcase hydration payload safety" do
    @renderable_slugs ~w(agent claude-md command data-viewer documentation onboarding skill)

    test "no showcase @example source contains </script bytes (seed scan)" do
      # All showcase pages, present and future: the hazard is killed at
      # the seed, before it can ride state, the hydration attribute, or
      # the source column. Case-insensitive: </SCRIPT also terminates a
      # script element.
      pages = Path.wildcard("lib/semtext_web/hologram/pages/showcase_*_page.ex")

      # 9 of the 10 showcase files carry an @example (the index has none) —
      # pins the glob against silent drift.
      with_examples =
        for page <- pages,
            source = File.read!(page),
            blocks =
              Regex.scan(~r/@example ~S"""(.*?)"""/s, source, capture: :all_but_first)
              |> List.flatten(),
            blocks != [] do
          {page, blocks}
        end

      assert length(with_examples) >= 9

      for {page, blocks} <- with_examples do
        for block <- blocks do
          refute String.downcase(block) =~ "</script",
                 "#{page} @example contains </script — it would ride page state " <>
                   "into the Hologram payload and terminate the bootstrap <script> early"
        end
      end
    end

    test "renderable pages ship balanced script tags with the hydration payload", %{conn: conn} do
      # Body-level belt: any raw </script that reaches the SSR body — a
      # hydration attribute, an unescaped payload, a future encoder
      # regression — unbalances the page's script tags (SSR currently
      # Jason-escapes "/" in the payload region, so the seed hazard is
      # neutralized there; this guards the whole document regardless of
      # which layer regresses). Scan as a tag-state machine: depth must
      # never go negative and must end at zero.
      #
      # Payload carriers differ by page (SEMTEX-013, #153): most panes
      # still ship their markup in the `data-sem-html` attribute; the
      # onboarding page boots through the island bridge — its pane spec
      # (`data-sem-pane`) carries the authored markup and `wire: true`,
      # and `reference_assets` loads semtext-lazy.js. Each page must ship
      # ONE of the two carriers; the tag-balance scan runs regardless.
      for slug <- @renderable_slugs do
        body = html_response(get(conn, "/showcase/#{slug}"), 200)

        if slug == "onboarding" do
          assert body =~ "data-sem-pane",
                 "/showcase/onboarding: no island pane spec — the render pane cannot boot"

          assert body =~ "semtext-lazy.js",
                 "/showcase/onboarding: island assets missing — the pane would stay un-upgraded"
        else
          assert body =~ "data-sem-html="
        end

        depth =
          Regex.scan(~r/<\/?script\b/i, body)
          |> List.flatten()
          |> Enum.reduce(0, fn tag, d ->
            if String.downcase(tag) =~ "</" do
              assert d > 0, "/showcase/#{slug}: </script> with no open <script> — payload broken"
              d - 1
            else
              d + 1
            end
          end)

        assert depth == 0, "/showcase/#{slug}: unclosed <script> — payload truncated"
      end
    end
  end
end
