defmodule SemtextWeb.Hologram.Pages.Proposals.Fields do
  @moduledoc """
  Server-side helpers that turn wizard/draft-editor state into the field
  map `Semtext.Proposals.create_and_submit/3` and `save_draft/2` expect
  (docs/proposals/API.md §5: element_tag, title, summary, motivation,
  options, example).

  The `/extend` wizard keeps its GitHub-issue shape (element name + one
  summary line); the proposal title derives from the tag the same way the
  drafted issue title does ("Vocabulary proposal: <tag>"), so both paths
  read consistently in review queues. Options come from the free-text
  "name — meaning" textarea and are parsed HERE (server-side, in the
  command) — the client never sees parsing logic (transpiler constraint:
  no regex on the client).

  Never transpiled: commands and page init only.
  """

  @max_options 100

  # Command params may arrive atom- or string-keyed depending on the
  # serializer hop; every read is belt-and-braces.

  @doc "Field map from `/extend` wizard state."
  def from_wizard(%{} = s) do
    tag = normalize_tag(fetch(s, :tag))
    title = String.trim(fetch(s, :title))

    title =
      if title == "" do
        "Vocabulary proposal: " <> tag
      else
        title
      end

    %{
      "element_tag" => tag,
      "title" => hydrate_safe(title),
      "summary" => hydrate_safe(trim(fetch(s, :summary))),
      "motivation" => hydrate_safe(trim(fetch(s, :motivation))),
      "options" => parse_options(hydrate_safe(fetch(s, :attrs))),
      "example" => hydrate_safe(trim(fetch(s, :example)))
    }
  end

  @doc "Field map from the dashboard draft-editor state (explicit title)."
  def from_draft(%{} = s) do
    options_text =
      case trim(fetch(s, :attrs)) do
        "" -> render_options(fetch(s, :options))
        text -> text
      end

    %{
      "element_tag" => normalize_tag(fetch(s, :element_tag)),
      "title" => hydrate_safe(trim(fetch(s, :title))),
      "summary" => hydrate_safe(trim(fetch(s, :summary))),
      "motivation" => hydrate_safe(trim(fetch(s, :motivation))),
      "options" => parse_options(options_text),
      "options_text" => options_text,
      "example" => hydrate_safe(trim(fetch(s, :example)))
    }
  end

  # Reverse-map stored option maps to the textarea rendering ("label — meaning").
  defp render_options(options) when is_list(options) do
    options
    |> Enum.map(fn
      %{label: label, meaning: meaning} ->
        option_line(hydrate_safe(to_string(label)), meaning && to_string(meaning))

      %{"label" => label, "meaning" => meaning} ->
        option_line(hydrate_safe(to_string(label)), meaning && to_string(meaning))

      %{"label" => label} ->
        hydrate_safe(to_string(label))

      _ ->
        nil
    end)
    |> Enum.reject(&(&1 == nil or &1 == ""))
    |> Enum.join("\n")
  end

  defp render_options(_), do: ""

  defp option_line(label, nil), do: label
  defp option_line(label, ""), do: label
  defp option_line(label, meaning), do: label <> " — " <> meaning

  @doc """
  Strip `<` from free text destined for Hologram component state.

  Hologram embeds server-seeded component state in the page's hydration
  payload as a JSON script block, and its JSON serialisation does not
  escape `/` — so a literal `</script>` in ANY seeded string breaks out
  of the payload (XSS on every reader). SSR text nodes are entity-encoded
  by the template engine, but the payload is not; the UI therefore never
  seeds a `<`. (Applies at display-seeding too, so API-created content is
  covered — see DetailPage/browse/dashboard seeding.)
  """
  def hydrate_safe(value) when is_binary(value), do: String.replace(value, "<", "")
  def hydrate_safe(value), do: value

  defp fetch(s, key) when is_atom(key) do
    case Map.get(s, key) do
      nil -> Map.get(s, Atom.to_string(key)) || ""
      v -> v
    end
  end

  defp fetch(s, key), do: Map.get(s, key) || ""

  @doc """
  Parse the options textarea: one option per line, `name — meaning`
  (em-dash per the placeholder), `name - meaning` (hyphen) tolerated,
  bare `name` allowed. Names are lowercased + trimmed; meaning may be nil.
  """
  def parse_options(nil), do: []
  def parse_options(attrs) when is_binary(attrs) do
    attrs
    |> String.split("\n")
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.take(@max_options)
    |> Enum.map(&parse_option_line/1)
  end

  defp parse_option_line(line) do
    {name, meaning} = split_option(line)

    name
    |> String.downcase()
    |> trim()
    |> option_map(meaning)
  end

  defp option_map("", _), do: nil

  defp option_map(name, meaning) do
    base = %{"label" => name}

    if is_binary(meaning) and String.trim(meaning) != "" do
      Map.put(base, "meaning", String.trim(meaning))
    else
      base
    end
  end

  defp split_option(line) do
    case String.split(line, " — ", parts: 2) do
      [name, meaning] -> {name, meaning}
      [_] -> split_hyphen(line)
    end
  end

  defp split_hyphen(line) do
    case String.split(line, " - ", parts: 2) do
      [name, meaning] -> {name, meaning}
      [name] -> {name, nil}
    end
  end

  # The wizard's shared normaliser already did this client-side (see
  # VocabScaffoldWizard.parse_namespace/1); repeat it server-side so a
  # forged command cannot smuggle a tag past the grammar check before the
  # changeset sees it.
  @doc "Lowercase, trim, strip trailing decoration; keep alphanumerics + dashes."
  def normalize_tag(raw) do
    raw
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9]+/, "-")
    |> String.trim("-")
  end

  defp trim(nil), do: ""
  defp trim(v) when is_binary(v), do: String.trim(v)
  defp trim(v), do: to_string(v)
end
