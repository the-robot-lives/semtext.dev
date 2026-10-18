defmodule Semtext.Reference.Tokenize do
  @moduledoc """
  HTML source highlighting for the reference viewers — a faithful port of
  the Next site's `tokenizeHTML` (web/components/code-viewer.tsx): comment
  spans, tags (keyword vs type), double-quoted attribute strings, whitespace
  runs, and the one-code-point default step so astral characters (emoji in
  authored examples) stay single tokens.

  Runs server-side only (page `init/3` — the token lists travel to the
  client as state); the Hologram client never transpiles this module, so
  regex use here is safe. The Next site ships it to the browser with the
  same ASCII-ish rules; the outputs match because the rules are the same,
  not the implementation.

  Output: one map per line — `%{n: line_number, toks: [[text, class], ...]}`
  with `""` for unclassified tokens (mirrors the TS `tok-${type}` skip).
  """

  @kw_tags MapSet.new([
             "doctype",
             "html",
             "head",
             "meta",
             "link",
             "title",
             "script",
             "body",
             "sem-enhanced-document",
             "sem-note",
             "sem-facts",
             "sem-fact",
             "h1"
           ])

  @spec html_lines(String.t()) :: [map()]
  def html_lines(code) do
    code
    |> String.split("\n")
    |> Enum.with_index(1)
    |> Enum.map(fn {line, n} -> %{n: n, toks: line_tokens(line)} end)
  end

  # ————— per-line tokenizer (order mirrors the TS while-loop) —————

  defp line_tokens(line), do: line_tokens(line, [])

  defp line_tokens("", acc), do: Enum.reverse(acc)

  # comment: "<!--" ... "-->" (or end of line)
  defp line_tokens("<!--" <> _ = line, acc) do
    {text, rest} = take_from(line, "-->", 4)
    line_tokens(rest, [[text, "tok-cmt"] | acc])
  end

  # "<" + "!" that is not "<!--" (e.g. <!DOCTYPE): one-char default step,
  # exactly like the TS falls through
  defp line_tokens("<!" <> _ = line, acc) do
    {glyph, rest} = one_step(line)
    line_tokens(rest, [[glyph, ""] | acc])
  end

  # tag opening/closing: to ">" inclusive (or end of line)
  defp line_tokens("<" <> _ = line, acc) do
    {text, rest} = take_from(line, ">", 1)
    line_tokens(rest, [[text, tag_class(text)] | acc])
  end

  # double-quoted string: to the next quote inclusive (or end of line)
  defp line_tokens(<<?", _::binary>> = line, acc) do
    {text, rest} = take_from(line, "\"", 1)
    line_tokens(rest, [[text, "tok-str"] | acc])
  end

  # whitespace run
  defp line_tokens(line, acc) do
    case Regex.run(~r/\A\s+/, line) do
      [ws] ->
        rest = String.replace_prefix(line, ws, "")
        line_tokens(rest, [[ws, ""] | acc])

      nil ->
        {glyph, rest} = one_step(line)
        line_tokens(rest, [[glyph, ""] | acc])
    end
  end

  # ————— helpers —————

  defp one_step(line) do
    <<glyph::utf8, rest::binary>> = line
    {<<glyph::utf8>>, rest}
  end

  # Consume `skip` bytes (all our openers are ASCII) then everything through
  # the next `needle` (inclusive), or the rest of the line when absent.
  defp take_from(line, needle, skip) do
    rest = binary_part(line, skip, byte_size(line) - skip)

    case :binary.match(rest, needle) do
      {pos, len} ->
        total = skip + pos + len
        {binary_part(line, 0, total), binary_part(line, total, byte_size(line) - total)}

      :nomatch ->
        {line, ""}
    end
  end

  # Keyword if the tag name is one of the well-known HTML/SemText names or
  # any sem-* element; everything else is a "type" (foreign/unknown tag).
  defp tag_class(content) do
    named? =
      case Regex.run(~r{^</?(\w+(?:-\w+)*)}, content) do
        [_, name] ->
          MapSet.member?(@kw_tags, String.downcase(name)) or String.starts_with?(name, "sem-")

        nil ->
          false
      end

    if named?, do: "tok-kw", else: "tok-type"
  end
end
