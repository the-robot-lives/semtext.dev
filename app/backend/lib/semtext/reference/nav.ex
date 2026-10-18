defmodule Semtext.Reference.Nav do
  @moduledoc """
  The reference sidebar's nav inventory (mechanical port of the `groups`
  builder both Next reference pages share): Guides, Reference, the job
  buckets, and the display families (SemText extensions, Agent Kit, NPL) —
  every element link carrying the `data-ref` string the index filter
  narrows against.

  Shape (consumed by `Site.DocsShell`): `[%{title: ..., items: [%{key,
  label, href, data_ref}]}]`. Server-only: computed in page init and passed
  down as props.
  """

  alias Semtext.Reference.{Buckets, Tags}

  @doc "The full nav inventory; `with_data` controls the filter payload."
  @spec groups() :: [map()]
  def groups do
    [
      %{
        title: "Guides",
        items: [
          %{key: "cli", label: "CLI commands", href: "/docs/", data_ref: ""},
          %{key: "editor", label: "Try the editor →", href: "/editor/", data_ref: ""}
        ]
      },
      %{
        title: "Reference",
        items: [
          %{key: "reference", label: "Tag reference", href: "/reference/", data_ref: ""},
          %{key: "reference-all", label: "All tags", href: "/reference/all", data_ref: ""}
        ]
      },
      Enum.map(Buckets.buckets(), &bucket_group/1),
      family_group("SemText extensions", Tags.semext_tags()),
      family_group("Agent Kit elements", Tags.agent_kit_tags()),
      family_group("NPL elements", Tags.npl_tags())
    ]
    |> List.flatten()
  end

  defp bucket_group(bucket) do
    %{
      title: bucket.label,
      items: Enum.map(bucket.tags, &tag_item/1)
    }
  end

  defp family_group(title, tags) do
    %{title: title, items: Enum.map(tags, &tag_item/1)}
  end

  # TS: dataRef = `${t.name} ${t.summary}`.toLowerCase() — tag name plus
  # summary words, the two things the filter box matches.
  defp tag_item(t) do
    %{
      key: "ref-" <> t.name,
      label: t.name,
      href: Tags.tag_href(t.name),
      data_ref: String.downcase("#{t.name} #{t.summary}")
    }
  end
end
