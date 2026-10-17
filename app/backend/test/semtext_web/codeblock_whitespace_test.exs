defmodule SemtextWeb.CodeBlockWhitespaceTest do
  @moduledoc """
  Regression: code windows are `white-space: pre`, so whitespace text nodes
  between the per-token <span>s rendered as line breaks (one character per
  line on the home page Quick start). Token spans must be adjacent.
  """
  use SemtextWeb.ConnCase, async: true

  # The text container of every code line: no whitespace-only text between its
  # child spans, and no leading/trailing whitespace inside it.
  defp line_texts(body) do
    Regex.scan(~r/<span class="(?:code-text|code-line-text|code-linetext)">(.*?)<\/span>\s*<\/div>/s, body)
    |> Enum.map(fn [_, inner] -> inner end)
  end

  defp assert_tight(body) do
    texts = line_texts(body)
    assert texts != [], "no code lines found"

    for inner <- texts do
      refute inner =~ ~r/<\/span>\s+<span/, "whitespace between token spans: #{inspect(inner)}"
      refute inner =~ ~r/\A\s/, "leading whitespace in code line: #{inspect(inner)}"
    end
  end

  test "home Quick start renders the <!doctype line as adjacent tokens", %{conn: conn} do
    body = html_response(get(conn, "/"), 200)
    assert_tight(body)

    [first | _] = line_texts(body)
    assert first =~ ~r/^<span>&lt;<\/span><span>!<\/span><span>d<\/span>/
    # Concatenated, the first line reads as one line of source.
    text = first |> String.replace(~r/<[^>]+>/, "") |> String.replace("&lt;", "<")
      |> String.replace("&gt;", ">")
    assert text == "<!doctype html>"
  end

  test "other code blocks on the site are tight too", %{conn: conn} do
    for path <- ["/reference", "/docs", "/themes", "/integrations", "/extend"] do
      conn = get(conn, path)

      if conn.status == 200 and conn.resp_body =~ "code-line" do
        assert_tight(conn.resp_body)
      end
    end
  end

  describe "reference/showcase code viewers (Site.CodeBody / ExampleViewer)" do
    test "highlighter tokens are always binaries (integer code points rendered as digits)" do
      for line <- SemtextWeb.Docs.Highlighter.tokenize_html("<h1>Rotation keys</h1>\nplain é text"),
          tok <- line do
        assert is_binary(tok.text), inspect(tok)
      end
    end

    test "showcase source pane shows the authored text, not code points", %{conn: conn} do
      body = html_response(get(conn, "/showcase/documentation"), 200)
      refute body =~ "8211111697116105111110"
      assert body =~ "<span>R</span><span>o</span><span>t</span>"
    end

    test "viewer containers are white-space: normal; only line text preserves whitespace" do
      css = File.read!(Path.expand("../../priv/static/css/semtext-site.css", __DIR__))
      [_, rule] = Regex.run(~r/\.code-content\{([^}]*)\}/, css)
      assert rule =~ "white-space:normal"
      refute rule =~ "pre-wrap"
      assert css =~ ~r/\.code-line-text,\.code-linetext\{[^}]*white-space:pre-wrap/
    end

    test "reference element source lines render tight", %{conn: conn} do
      for path <- ["/reference/sem-note/", "/reference/sem-facts/", "/reference/sem-enhanced-document/"] do
        body = html_response(get(conn, path), 200)
        refute body =~ ~r/<span class="code-line-text">\s/, path
        assert_tight(body)
      end
    end
  end
end
