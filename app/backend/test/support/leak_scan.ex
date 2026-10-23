defmodule SemtextWeb.TestSupport.LeakScan do
  @moduledoc """
  HTML5 script-data scan used by the reference-page leak regression tests.

  Collapsed WHATWG §13.2.5 state machine (§13.2.6.4 "script data" family):
  `</script` closes the element unless inside a double-escaped region
  (opened by `<!--` then `<script`); `-->` unwinds one escaping level.
  Returns the text a browser would render OUTSIDE script elements —
  serialized-state markers found there mean a payload escaped its script
  boundary (the pageMountData leak class).
  """

  @spec leaked_text(String.t()) :: String.t()
  def leaked_text(html) do
    leak_at(html, String.downcase(html), 0, :data, false, false, [])
  end

  defp leak_at(orig, lower, i, :data, _esc, _dbl, acc) do
    scope = {i, byte_size(lower) - i}

    open =
      [:binary.match(lower, "<script", scope: scope), :binary.match(lower, "<!--", scope: scope)]
      |> Enum.reject(&(&1 == :nomatch))
      |> Enum.sort_by(fn {pos, _} -> pos end)
      |> List.first()

    case open do
      nil ->
        acc
        |> Enum.reverse()
        |> Enum.join()
        |> Kernel.<>(binary_part(orig, i, byte_size(orig) - i))

      {pos, _} ->
        text = binary_part(orig, i, pos - i)

        if binary_part(lower, pos, 4) == "<!--" do
          # real comment outside scripts — skip past its close, render nothing
          rest =
            case :binary.match(lower, "-->", scope: {pos, byte_size(lower) - pos}) do
              {cpos, _} -> cpos + 3
              :nomatch -> byte_size(orig)
            end

          leak_at(orig, lower, rest, :data, false, false, [text | acc])
        else
          leak_at(orig, lower, pos + 7, :script, false, false, [text | acc])
        end
    end
  end

  defp leak_at(orig, lower, i, :script, esc, dbl, acc) do
    scope = {i, byte_size(lower) - i}

    next =
      [
        {"</script", :binary.match(lower, "</script", scope: scope)},
        {"<script", :binary.match(lower, "<script", scope: scope)},
        {"<!--", :binary.match(lower, "<!--", scope: scope)},
        {"-->", :binary.match(lower, "-->", scope: scope)}
      ]
      |> Enum.flat_map(fn
        {_tok, :nomatch} -> []
        {tok, {pos, _len}} -> [{pos, tok}]
      end)
      |> Enum.sort()
      |> List.first()

    case next do
      nil ->
        # unterminated script — nothing after it is rendered text
        acc |> Enum.reverse() |> Enum.join()

      {pos, tok} ->
        cond do
          tok == "</script" and dbl ->
            leak_at(orig, lower, pos + 8, :script, true, false, acc)

          tok == "</script" ->
            leak_at(orig, lower, pos + 8, :data, false, false, acc)

          tok == "<script" and esc and not dbl ->
            leak_at(orig, lower, pos + 7, :script, true, true, acc)

          tok == "<script" ->
            leak_at(orig, lower, pos + 7, :script, esc, dbl, acc)

          tok == "<!--" ->
            leak_at(orig, lower, pos + 4, :script, true, dbl, acc)

          tok == "-->" and dbl ->
            leak_at(orig, lower, pos + 4, :script, true, false, acc)

          tok == "-->" and esc ->
            leak_at(orig, lower, pos + 4, :script, false, false, acc)

          true ->
            leak_at(orig, lower, pos + 4, :script, esc, dbl, acc)
        end
    end
  end
end
