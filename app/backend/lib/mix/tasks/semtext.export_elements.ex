defmodule Mix.Tasks.Semtext.ExportElements do
  @moduledoc """
  Re-emit the public search index `priv/static/data/elements.json` with the
  hand-authored plain-language copy (thread 858cc161).

  The file is served at /data/elements.json and fetched by the reference
  search island. It is a copy of the generated `priv/data/elements.json`
  with `priv/data/description-overrides.json` applied — the SAME overlay
  `Semtext.Reference.Tags` applies for cards and element pages, so the
  search index and the site can never disagree. Upstream bundle syncs
  overwrite the copy; re-run this task after `mix semtext.gen_reference`.

  Usage:

      mix semtext.export_elements
  """

  use Mix.Task

  @shortdoc "Apply description overrides to the public /data/elements.json"

  @impl Mix.Task
  def run(_args) do
    backend = File.cwd!()
    source = Path.join(backend, "priv/data/elements.json")
    overrides_path = Path.join(backend, "priv/data/description-overrides.json")
    target = Path.join(backend, "priv/static/data/elements.json")

    doc = source |> File.read!() |> Jason.decode!()
    overrides = overrides_path |> File.read!() |> Jason.decode!() |> Map.fetch!("overrides")

    {tags, missing} =
      Enum.map_reduce(doc["tags"], [], fn tag, acc ->
        case Map.fetch(overrides, tag["name"]) do
          # JSON shape: "tag-name": [summary, description]
          {:ok, [s, d]} ->
            {Map.put(tag, "summary", s) |> Map.put("description", d), acc}

          :error ->
            {tag, [tag["name"] | acc]}
        end
      end)

    unless missing == [] do
      Mix.raise("description-overrides.json has no entry for: #{Enum.join(missing, ", ")}")
    end

    unknown = Map.keys(overrides) -- Enum.map(doc["tags"], & &1["name"])

    # Overrides for glossary-only tags (agent, statement, …) are legitimate:
    # they are absent from elements.json but applied site-side via
    # Semtext.Reference.Glossary. Anything unknown to BOTH sources is a
    # rename/typo.
    known = Enum.map(doc["tags"], & &1["name"]) ++ Enum.map(Semtext.Reference.Glossary.all(), & &1.name)
    unknown = Map.keys(overrides) -- known

    unless unknown == [] do
      Mix.raise("description-overrides.json names unknown tags: #{Enum.join(unknown, ", ")}")
    end

    doc = Map.put(doc, "tags", tags)

    File.mkdir_p!(Path.dirname(target))
    File.write!(target, Jason.encode!(doc) <> "\n")

    Mix.shell().info(
      "==> #{target} rewritten with #{map_size(overrides)} description overrides (source: #{source})"
    )
  end
end
