defmodule Semtext.Github.DiscussionBody do
  @moduledoc """
  Builds the GitHub Discussion title + markdown body from a
  `Semtext.Github.Port.sync_target` (design v1 §6 template).

  The DB stays the canonical record; the discussion body is a snapshot plus
  the deep link — never rewritten afterwards (edits bump versions in P2 and
  the deep link always serves current).

  Sections are defensively truncated (GitHub bodies cap out around 64k; a
  hostile 60k "example" must not break `createDiscussion`), and proposal text
  is inserted verbatim as *markdown data* — this repo never parses it back,
  so no sanitization is required here.
  """

  @section_limit 40_000

  @spec title(Semtext.Github.Port.sync_target()) :: String.t()
  def title(%{slug: slug} = target) do
    tag = target[:element_tag]
    heading = target[:title]

    cond do
      is_binary(tag) and tag != "" and is_binary(heading) and heading != "" ->
        "#{tag} — #{heading}"

      is_binary(heading) and heading != "" ->
        heading

      true ->
        slug
    end
  end

  @spec body(Semtext.Github.Port.sync_target()) :: String.t()
  def body(%{slug: slug} = target) do
    link = "#{Semtext.Github.proposals_base_url()}/p/#{slug}"

    [
      "> Submitted via [proposals.semtext.dev/p/#{slug}](#{link}) — fork it, run it in the",
      "> playground, and react to vote. Status: **submitted**.",
      "",
      section("Element", element_block(target)),
      section("Summary", target[:summary]),
      section("Motivation", target[:motivation]),
      section("Options", options_block(target[:options])),
      section("Example", code_block(target[:example]))
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.join("\n")
  end

  # -- plumbing -----------------------------------------------------------

  defp section(_name, nil), do: nil
  defp section(_name, ""), do: nil

  defp section(name, content) do
    "## #{name}\n\n#{truncate(content, @section_limit)}"
  end

  defp element_block(target) do
    case target[:element_tag] do
      tag when is_binary(tag) and tag != "" -> "`#{tag}`"
      _ -> nil
    end
  end

  defp options_block(nil), do: nil
  defp options_block([]), do: nil
  defp options_block(options) when is_map(options), do: options_block(Map.to_list(options))

  defp options_block(options) when is_list(options) do
    options
    |> Enum.map(fn
      %{name: name, meaning: meaning} -> option_line(name, meaning)
      %{name: name} = opt -> option_line(name, Map.get(opt, :value) || "")
      %{"name" => name, "meaning" => meaning} -> option_line(name, meaning)
      %{"name" => name} = opt -> option_line(name, Map.get(opt, "value") || "")
      {name, meaning} when is_binary(name) -> option_line(name, meaning)
      [name, meaning] -> option_line(name, meaning)
      other when is_binary(other) -> "- #{other}"
      other -> "- #{inspect(other)}"
    end)
    |> Enum.join("\n")
  end

  defp options_block(other), do: "- #{inspect(other)}"

  defp option_line(name, nil), do: "- **#{name}**"
  defp option_line(name, meaning) when meaning == "", do: "- **#{name}**"
  defp option_line(name, meaning), do: "- **#{name}** — #{meaning}"

  # The example renders as a fenced code block (default ``` fence); a proposal
  # example that itself contains a fence gets a longer outer fence so the
  # block stays intact.
  defp code_block(nil), do: nil
  defp code_block(""), do: nil

  defp code_block(example) do
    example = truncate(String.trim_trailing(example), @section_limit)
    fence = longest_fence(example) <> "```"

    "#{fence}html\n#{example}\n#{fence}"
  end

  defp longest_fence(example) do
    ~r/^`{3,}/m
    |> Regex.scan(example)
    |> List.flatten()
    |> Enum.map(&String.length/1)
    |> case do
      [] -> ""
      lens -> String.duplicate("`", Enum.max(lens))
    end
  end

  defp truncate(text, limit) when is_binary(text) and byte_size(text) <= limit, do: text

  defp truncate(text, limit) do
    String.slice(text, 0, limit) <> "\n\n…(truncated at #{limit} bytes)"
  end
end
