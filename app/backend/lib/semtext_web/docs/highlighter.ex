defmodule SemtextWeb.Docs.Highlighter do
  @moduledoc """
  HTML/SemText syntax highlighting, ported 1:1 from `tokenizeHTML` in the
  Next site's `components/code-viewer.tsx`.

  SERVER-ONLY module: pages call `tokenize_html/1` during init and pass
  the resulting token lines into templates as plain data (Hologram
  re-renders templates on the client, so template expressions must never
  call into this module). Regex is fine here — this never transpiles.

  Token types map to the site CSS: "kw" | "str" | "type" | "cmt" |
  "default" (renders as `tok-<type>`; "default" carries no class).
  """

  @type token :: %{text: String.t(), type: String.t()}

  @keywords ~w(doctype html head meta link title script body sem-enhanced-document sem-note sem-facts sem-fact h1)

  @tag_name_re ~r|^</?(\w+(?:-\w+)*)|

  @doc "Tokenize HTML/SemText source into per-line token lists."
  @spec tokenize_html(String.t()) :: [[token()]]
  def tokenize_html(code) do
    code
    |> String.split("\n")
    |> Enum.map(&tokenize_line/1)
  end

  @doc """
  Tokenize and number in one step: `%{number:, tokens:}` rows — the shape
  `Site.CodeBody` renders (line numbers + `tok-<type>` spans).
  """
  @spec numbered_lines(String.t()) :: [%{number: pos_integer(), tokens: [token()]}]
  def numbered_lines(code) do
    code
    |> tokenize_html()
    |> Enum.with_index(1)
    |> Enum.map(fn {tokens, n} -> %{number: n, tokens: tokens} end)
  end

  defp tokenize_line(line) do
    tok(line, 0, [])
    |> Enum.reverse()
  end

  # — single scanner, mirrors the TS while-loop ————————————————————

  defp tok(line, pos, acc) when pos >= byte_size(line) do
    acc
  end

  defp tok(line, pos, acc) do
    rest = binary_part(line, pos, byte_size(line) - pos)

    cond do
      # Comment: <!-- ... --> (an unclosed comment runs to end of line)
      String.starts_with?(rest, "<!--") ->
        {text, len} = through(rest, "-->")
        tok(line, pos + len, [%{text: text, type: "cmt"} | acc])

      # Tag opening/closing: <tag ...> (but NOT <!...>, which falls through
      # to the default single-glyph path exactly as upstream)
      String.starts_with?(rest, "<") and not String.starts_with?(rest, "<!") ->
        {text, len} = through(rest, ">")
        tok(line, pos + len, [%{text: text, type: tag_type(text)} | acc])

      # Quoted attribute string
      String.starts_with?(rest, "\"") ->
        {text, len} = quoted(rest)
        tok(line, pos + len, [%{text: text, type: "str"} | acc])

      # Whitespace run
      true ->
        n = ws_len(rest, 0)

        if n == 0 do
          # Default fallback: consume ONE code point — UTF-8 astral chars
          # (emoji in authored examples) must stay one token (upstream keeps
          # UTF-16 astral chars whole for the same reason).
          <<glyph::utf8, _::binary>> = rest
          # `glyph` is an integer code point: it MUST be re-encoded to a
          # binary, or the token text renders as its decimal code ("R" -> "82").
          text = <<glyph::utf8>>
          tok(line, pos + byte_size(text), [%{text: text, type: "default"} | acc])
        else
          tok(line, pos + n, [%{text: binary_part(rest, 0, n), type: "default"} | acc])
        end
    end
  end

  # Consumes up to and including `stop`, or the whole rest when `stop`
  # never occurs. Returns {text, consumed_length}.
  defp through(rest, stop) do
    case String.split(rest, stop, parts: 2) do
      [before, _after] ->
        len = byte_size(before) + byte_size(stop)
        {binary_part(rest, 0, len), len}

      [_only] ->
        {rest, byte_size(rest)}
    end
  end

  # A quote-led run through its closing quote (searched from offset 1),
  # or the whole rest when unterminated — mirrors upstream's
  # indexOf('"', pos + 1).
  defp quoted(rest) do
    body = binary_part(rest, 1, byte_size(rest) - 1)

    case String.split(body, "\"", parts: 2) do
      [before, _after] ->
        len = 1 + byte_size(before) + 1
        {binary_part(rest, 0, len), len}

      [_only] ->
        {rest, byte_size(rest)}
    end
  end

  defp ws_len(rest, n) when n < byte_size(rest) do
    case :binary.at(rest, n) do
      c when c == ?\s or c == ?\t or c == ?\n or c == ?\r -> ws_len(rest, n + 1)
      _ -> n
    end
  end

  defp ws_len(_rest, n), do: n

  defp tag_type(tag) do
    name =
      case Regex.run(@tag_name_re, tag) do
        [_, name] -> String.downcase(name)
        _ -> ""
      end

    if name in @keywords or String.starts_with?(name, "sem-") do
      "kw"
    else
      "type"
    end
  end
end
