defmodule Semtext.Reference.CardData do
  @moduledoc """
  Server-side builder for the per-card "SemText — Claude example" block
  (`SemtextWeb.Hologram.Components.Reference.ClaudeExample`): tokenized
  lines for the static code block and the render-pane spec JSON for the
  island bridge. Pages call it in init/3 and hand the map down as props —
  the component template only interpolates, because Hologram re-renders it
  client-side and cannot reach these server-only modules.

  The render pane spec is `Tags.viewer_spec/3` plus the example markup, so
  the pane boots whatever bundles.json says provides the tag TODAY. A
  vendor bump that ships a new handler (e.g. a real `sem-reference`
  runtime) only changes bundles.json + the vendored files; the next
  `mix semtext.gen_reference` + rebuild upgrades every card's render with
  no code change here.
  """

  alias Semtext.Reference.{Tags, Tokenize}

  @doc """
  The prebuilt Claude-example payload for one tag record.

  `tokens: false` (the index: 115 cards) ships plain lines (`plain_lines`,
  bare strings) instead of highlight tokens — every prop rides in the
  client's serialized page state, and per-token spans for every card
  would multiply the index payload several times over. The element page
  header (one card) keeps full highlighting (`lines`).
  """
  @spec claude_example(map(), keyword()) :: map()
  def claude_example(tag, opts \\ []) do
    code = tag.claude_example
    highlight = Keyword.get(opts, :tokens, true)
    b = Tags.bundles_for(tag.name)
    shipped = b != nil and (b.shipped or b.css_only)

    spec =
      Tags.viewer_spec(tag, code, false)
      |> Map.put("html", code)
      |> Map.put("wire", true)
      # The pane renders even without a shipped runtime: the authored
      # markup then shows as plain HTML + theme CSS (honest degradation).
      |> Map.put("renderable", true)

    %{
      name: tag.name,
      dom_id: dom_id(tag.name),
      source: Atom.to_string(tag.claude_example_source),
      highlight: highlight,
      lines: if(highlight, do: script_safe_lines(Tokenize.html_lines(code)), else: []),
      plain_lines: if(highlight, do: [], else: plain_lines(code)),
      spec_json: spec |> Jason.encode!() |> script_safe(),
      shipped: shipped,
      line_count: length(String.split(code, "\n"))
    }
  end

  # Plain lines (index): each line is a list of bare string segments — the
  # leanest shape in Hologram's serialized state. Only a literal `</script`
  # can end the pageMountData block early (HTML script-data state; the
  # semext-* snapshots carry inline JSON scripts), so just those lines are
  # split at `</` — the segments concatenate back byte-identically.
  defp plain_lines(code) do
    code
    |> String.split("\n")
    |> Enum.map(fn line ->
      if line =~ ~r{</script}i do
        line |> String.split("</") |> Enum.intersperse("</") |> Enum.reject(&(&1 == ""))
      else
        [line]
      end
    end)
  end

  # Tag names are [a-z0-9-] (Tags.tag_slug guards it) — safe as id parts.
  defp dom_id(name), do: "claude-" <> name

  # Hologram serializes props/state into the pageMountData <script> block
  # without escaping `</` (see ReferenceElementPage): split tokens at `</`
  # so no serialized string carries the raw sequence; `<\/` in JSON decodes
  # to `/`, invisible to behaviour.
  defp script_safe(binary), do: String.replace(binary, "</", "<\\/")

  defp script_safe_lines(lines) do
    Enum.map(lines, fn %{toks: toks} = line ->
      %{line | toks: Enum.flat_map(toks, &script_safe_tok/1)}
    end)
  end

  defp script_safe_tok([text, class]) do
    if String.contains?(text, "</") do
      text
      |> String.split("</")
      |> Enum.intersperse("</")
      |> Enum.reject(&(&1 == ""))
      |> Enum.map(&[&1, class])
    else
      [[text, class]]
    end
  end
end
