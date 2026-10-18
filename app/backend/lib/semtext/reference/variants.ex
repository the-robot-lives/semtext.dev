defmodule Semtext.Reference.Variants do
  @moduledoc """
  Extra authored examples per tag (compile-time load of
  `priv/data/example-variants.json`, converted from the hand-authored
  `web/data/reference-example-variants.ts`).

  The variants a tag's reference page shows alongside its primary example —
  a sem-note variant per `variant` value, a sem-facts example per view mode,
  a sem-details occluded/open pair, and so on. This file is the extension
  point the per-tag reviewers fill; the element page renders each in its own
  viewer under the primary example, in array order, with the label in the
  viewer chrome and a stable `#example-<id>` anchor.

  A variant whose example IS the tag's primary example is dropped by the
  page (never rendered twice); Markdown-authored variants are out of scope
  — only the primary sem-md example carries a pre-rendered HTML half.

  Reviewers keep editing the TS source; `mix semtext.gen_reference`
  reconverts it. Records:

      %{id: "quiz", label: "variant: quiz", note: "..." | nil,
        code: "<highlight ...>...", renderable: false | nil}
  """

  # ————— compile-time normalization —————
  # Nested helper module: module-body attributes cannot call the enclosing
  # module's own functions; cross-module calls compile (and run at compile
  # time, embedding the result).

  defmodule Norm do
    @moduledoc false

    def normalize(v) do
      %{
        id: v["id"],
        label: v["label"],
        note: v["note"],
        code: v["code"],
        renderable: v["renderable"]
      }
    end
  end

  @external_resource path = Path.expand("../../../priv/data/example-variants.json", __DIR__)
  {:ok, decoded} = path |> File.read!() |> Jason.decode()

  @variants Map.new(decoded, fn {name, list} -> {name, Enum.map(list, &Norm.normalize/1)} end)

  @doc "Every variant defined for one tag, in authored (array) order."
  @spec for_tag(String.t()) :: [map()]
  def for_tag(name) when is_binary(name), do: Map.get(@variants, name, [])

  @doc "Every tag name that defines at least one variant."
  @spec tag_names() :: [String.t()]
  def tag_names, do: Map.keys(@variants)
end
