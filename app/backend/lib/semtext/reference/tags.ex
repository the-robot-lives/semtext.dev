defmodule Semtext.Reference.Tags do
  @moduledoc """
  Shared element inventory for the /reference section (mechanical port of
  `web/data/reference-tags.ts`): the generated index plus the hand-authored
  supplement, one flat sorted list, and the slug/href helpers every consumer
  (index, element pages, sitemap) shares so the paths cannot drift.

  `Semtext.Reference.Elements` is generated upstream — never hand-edit it.
  `Semtext.Reference.Glossary` supplements the elements the generator cannot
  emit (see its header). A `npl-enhanced-content` subtree pull + `mix
  semtext.gen_reference` + rebuild is the whole refresh path.

  COPY LAYER (round-2, thread 858cc161): the generated summaries/descriptions
  read like changelog notes (Lit file paths, BDD contracts, resolved-question
  flags). `priv/data/description-overrides.json` carries the hand-authored
  plain-language copy for every tag — `"tag-name": [summary, description]` —
  applied HERE at consolidation, so index cards, element pages and everything
  else reading this module show it. `mix semtext.export_elements` applies the
  same file to the public /data/elements.json search index. Edit the JSON,
  rebuild, re-export; never edit the generated files.
  """

  alias Semtext.Reference.{Bundles, Elements, Glossary}

  @typedoc "One element record; see Elements for the shape."
  @type tag :: map()

  @spec_version Elements.spec_version()

  @overrides_path Path.expand("../../../priv/data/description-overrides.json", __DIR__)
  @external_resource @overrides_path
  # Module-body attributes cannot call this module's own functions (the
  # nested-Norm pattern in Elements/Glossary exists for the same reason),
  # so the decode is inlined here.
  @overrides (case File.exists?(@overrides_path) do
                true ->
                  @overrides_path |> File.read!() |> Jason.decode!() |> Map.fetch!("overrides")

                false ->
                  %{}
              end)

  # Apply the copy layer, then sort. A tag without an override fails the
  # build — new elements must ship plain-language copy, not stale generated
  # prose. An overlay name matching no tag fails too (rename/typo guard).
  @raw_tags Enum.sort(Elements.all() ++ Glossary.all(), &(&1.name <= &2.name))

  @unknown_overrides Map.keys(@overrides) -- Enum.map(@raw_tags, & &1.name)
  :ok =
    case @unknown_overrides do
      [] -> :ok
      extra -> raise ArgumentError, "description-overrides.json names unknown tags: #{inspect(extra)}"
    end

  @all_tags Enum.map(@raw_tags, fn t ->
              case Map.fetch(@overrides, t.name) do
                # JSON shape: "tag-name": [summary, description]
                {:ok, [s, d]} ->
                  %{t | summary: s, description: d}

                :error ->
                  raise ArgumentError,
                        "description-overrides.json has no entry for tag #{t.name}"
              end
            end)

  @by_name Map.new(@all_tags, fn t -> {t.name, t} end)

  @sem_tags Enum.filter(@all_tags, &(&1.family == :sem))
  @npl_tags Enum.filter(@all_tags, &(&1.family == :npl))

  @doc "Spec version the generated half of the inventory was built from."
  def spec_version, do: @spec_version

  @doc "Every element, generated and hand-authored, sorted by name."
  @spec all_tags() :: [tag()]
  def all_tags, do: @all_tags

  @doc "The element record by tag name (generated + glossary), or nil."
  @spec get(String.t()) :: tag() | nil
  def get(name) when is_binary(name), do: Map.get(@by_name, name)

  @doc "SemText family elements (`sem-*` root vocabulary, incl. glossary)."
  @spec sem_tags() :: [tag()]
  def sem_tags, do: @sem_tags

  @doc "NPL family elements (`npl-*` display renders of NPL prompt blocks)."
  @spec npl_tags() :: [tag()]
  def npl_tags, do: @npl_tags

  @doc "Which shipped JS file(s) provide a tag, or nil if the map predates it."
  @spec bundles_for(String.t()) :: map() | nil
  def bundles_for(name), do: Bundles.for_tag(name)

  @doc """
  Class-form alias wiring (bundles.json's aliasRuntime): the extra bundle
  file class-form (`div.sem-<tag>`) examples need. Empty until that ships.
  """
  @spec alias_runtime() :: %{optional(atom()) => String.t()}
  def alias_runtime, do: Bundles.alias_runtime()

  @doc "Schema fields the generator could not find, per tag (map tag => list)."
  @spec gap_missing() :: %{optional(String.t()) => [String.t()]}
  def gap_missing, do: Elements.gaps()

  @doc "The missing-field list for one tag (empty list when none)."
  @spec gap_missing_for(String.t()) :: [String.t()]
  def gap_missing_for(name), do: Elements.missing_for(name)

  @doc """
  URL slug for an element page: `/reference/<slug>`. Every tag name is
  lowercase ASCII with hyphens (XML names, lowercase by convention), so the
  slug IS the name; the normalisation below is a guard — a future name that
  ever needed rewriting raises here at build/compile time instead of shipping
  a broken link.
  """
  @spec tag_slug(String.t()) :: String.t()
  def tag_slug(name) do
    slug =
      name
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9]+/, "-")
      |> String.replace(~r/^-+|-+$/, "")

    if slug != name do
      raise ArgumentError, "tag name is not URL-safe as-is: #{name} -> #{slug}"
    end

    slug
  end

  @doc "Canonical href of an element's own page."
  @spec tag_href(String.t()) :: String.t()
  def tag_href(name), do: "/reference/#{tag_slug(name)}"

  @doc "The element a slug belongs to, or nil."
  @spec tag_by_slug(String.t()) :: tag() | nil
  def tag_by_slug(slug), do: Enum.find(@all_tags, &(tag_slug(&1.name) == slug))

  @doc """
  The full runtime payload one ExampleViewer needs for a tag, precomputed for
  the SSR data attribute the island bridge reads: files to load (bundle
  files, then lazy chunks, then class-form alias files), each with its script
  type, plus the theme CSS links. Mirrors the Next ExampleViewer's
  loadFiles/bootElementRuntime derivation exactly.
  """
  @spec viewer_spec(tag() | nil, String.t(), boolean()) :: map()
  def viewer_spec(nil, _code, _class_form), do: %{"renderable" => false, "files" => []}

  def viewer_spec(tag_record, code, class_form) do
    b = bundles_for(tag_record.name)
    renderable = (b && (b.shipped || b.css_only)) == true
    entries = (b && b.bundles) || []
    files = Enum.map(entries, & &1.file)
    lazy_covered = "semtext-lazy.js" in files

    # Keep the lazy loader (it drives pane hydration), drop every other
    # -lazy.js loader (npl-lazy.js has no off switch and would document-scan),
    # then add every chunk the map names, then class-form alias files.
    load_files =
      Enum.filter(files, &(&1 == "semtext-lazy.js" or not String.ends_with?(&1, "-lazy.js")))

    chunks = entries |> Enum.map(& &1.chunk) |> Enum.reject(&is_nil/1)

    alias_files =
      if class_form do
        alias_runtime()
        |> Map.values()
        |> Enum.reject(&(&1 == nil or &1 in files))
      else
        []
      end

    all = Enum.uniq(load_files ++ chunks ++ alias_files)

    %{
      "renderable" => renderable,
      "lazy" => lazy_covered,
      "classForm" => class_form,
      "files" => Enum.map(all, &%{"src" => "/semtext/" <> &1, "type" => script_type(&1)}),
      "themeCss" => [
        "/semtext/themes/_vocabulary.css",
        "/semtext/themes/minimal-tech-light.css"
      ]
    }
  end

  @doc """
  Module-vs-classic script type, ported from the Next loadScript rule: lazy
  loaders and everything under a chunks directory are module builds; IIFE
  bundles (full bundles, shell) are classic. Retired 0.9.0 artifacts - the
  standalone fallback tier was folded into the one bundle - type as `nil`.
  """
  @spec script_type(String.t()) :: String.t() | nil
  @retired_bundles MapSet.new(["semtext-fallback.js"])

  def script_type(file) do
    cond do
      MapSet.member?(@retired_bundles, file) -> nil
      String.ends_with?(file, "-lazy.js") or file =~ ~r{(^|/)[a-z-]*chunks/} -> "module"
      true -> "classic"
    end
  end
end
