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
end
