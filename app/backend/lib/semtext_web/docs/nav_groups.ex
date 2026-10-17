defmodule SemtextWeb.Docs.NavGroups do
  @moduledoc """
  The docs-shell sidebar's navigation groups (port of `GROUPS` in the Next
  site's `components/docs-shell.tsx`).

  Guides / Showcase / Platform / Project are hand groups here, as upstream.
  The reference groups come from `SemtextWeb.Docs.SearchIndex` (buckets +
  the NPL family) — INTERIM: the bucket data lives in
  `priv/data/docs/search-tags.json` until the port-reference lane's
  `Semtext.Reference.*` compile-time modules land, at which point
  `reference_groups/0` should read those instead and the interim JSON's
  bucket half is retired (see the port-docs lane report).
  """

  alias SemtextWeb.Docs.{SearchIndex, Showcase}

  @type nav_item :: %{key: String.t(), label: String.t(), href: String.t(), data_ref: String.t() | nil}
  @type nav_group :: %{title: String.t(), items: [nav_item()]}

  @github_repo "https://github.com/noizu-labs-ml/npl-enhanced-content"

  @doc "GitHub repo the spec lives in (footer + sidebar)."
  @spec github_repo :: String.t()
  def github_repo, do: @github_repo

  @doc """
  The sidebar's reference groups: one group per reference bucket (in the
  bucket module's validated display order), then the NPL elements family.
  """
  @spec reference_groups() :: [nav_group()]
  def reference_groups do
    bucket_groups =
      for bucket <- SearchIndex.buckets() do
        %{
          title: bucket.label,
          items:
            for name <- bucket.tags do
              %{key: "ref-#{name}", label: name, href: SearchIndex.tag_href(name), data_ref: String.downcase(name)}
            end
        }
      end

    npl_group = %{
      title: "NPL elements",
      items:
        for t <- SearchIndex.npl_tags() do
          %{key: "ref-#{t.name}", label: t.name, href: SearchIndex.tag_href(t.name), data_ref: String.downcase(t.name)}
        end
    }

    bucket_groups ++ [npl_group]
  end

  @doc "The full default sidebar (Guides, reference groups, Showcase, Platform, Project)."
  @spec groups() :: [nav_group()]
  def groups do
    [
      %{
        title: "Guides",
        items: [
          %{key: "docs", label: "Docs", href: "/docs/", data_ref: nil},
          %{key: "cli", label: "CLI commands", href: "/docs/#cli-commands", data_ref: nil},
          %{key: "editor", label: "Try the editor →", href: "/editor/", data_ref: nil}
        ]
      }
      | reference_groups()
    ] ++
      [
        %{
          title: "Showcase",
          items:
            for d <- Showcase.items() do
              %{key: "showcase-#{d.slug}", label: d.label, href: d.href, data_ref: nil}
            end
        },
        %{
          title: "Platform",
          items: [
            %{key: "integrations", label: "Integrations", href: "/integrations/", data_ref: nil},
            %{key: "extend", label: "Extend", href: "/extend/", data_ref: nil},
            %{key: "themes", label: "Themes", href: "/themes/", data_ref: nil}
          ]
        },
        %{
          title: "Project",
          items: [%{key: "github", label: "GitHub", href: @github_repo, data_ref: nil}]
        }
      ]
  end
end
