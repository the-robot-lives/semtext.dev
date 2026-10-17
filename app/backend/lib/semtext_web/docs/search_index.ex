defmodule SemtextWeb.Docs.SearchIndex do
  @moduledoc """
  Build-time search index behind the header search combobox, plus the tag
  inventory the docs-shell sidebar's reference groups render.

  Port of the Next site's `web/data/search-index.ts` (components/search.tsx
  filters this list in the browser — the same filter runs client-side in
  `SemtextWeb.Hologram.Components.Site.HeaderSearch`).

  Data source: `priv/data/docs/search-tags.json` — see the `$comment` in
  that file. Long-term this module reads the compile-time reference data
  modules the port-reference lane generates from the npl-enhanced-content
  subtree; the JSON is the interim single source so the docs surface ships
  without coupling to the reference lane's commit order.

  The CLI command list mirrors the "CLI commands" section of the docs page
  (`SemtextWeb.Hologram.Pages.DocsPage`) exactly — that page owns the
  prose; this list exists so search can deep-link it.
  """

  @external_resource "priv/data/docs/search-tags.json"
  @search_tags_file "priv/data/docs/search-tags.json"

  @raw (case File.read(@search_tags_file) do
          {:ok, body} -> Jason.decode!(body)
          _ -> %{"tags" => [], "buckets" => []}
        end)

  @typedoc "Search group name, in sidebar result order."
  @type group :: String.t()

  @type entry :: %{
          required(:key) => String.t(),
          required(:group) => group(),
          required(:title) => String.t(),
          required(:hint) => String.t(),
          required(:haystack) => String.t(),
          required(:href) => String.t()
        }

  @type tag :: %{
          required(:name) => String.t(),
          required(:family) => String.t(),
          required(:summary) => String.t(),
          required(:description) => String.t(),
          required(:attributes) => [%{name: String.t(), description: String.t()}],
          required(:children) => [String.t()]
        }

  @doc "Sidebar order of the result groups."
  @spec groups() :: [group()]
  def groups, do: ["SemText elements", "NPL elements", "CLI commands"]

  @doc "The CLI commands (mirrors the docs page's CLI reference section)."
  @spec cli_commands() :: [%{command: String.t(), summary: String.t(), href: String.t()}]
  def cli_commands do
    [
      %{
        command: "semtext doc.semtext.html",
        summary:
          "Read a document raw — prints the authored HTML in the terminal: sections, facts, steps, readable as plain text.",
        href: "/docs/#cli-commands"
      },
      %{
        command: "semtext tui doc.semtext.html",
        summary:
          "Interactive terminal UI — navigate sections, flip flashcards, run quizzes, inspect structured records.",
        href: "/docs/#cli-commands"
      },
      %{
        command: "semtext --render doc.semtext.html",
        summary:
          "Render for agents — a plain-text representation designed for language models, to stdout.",
        href: "/docs/#cli-commands"
      },
      %{
        command: "semtext extract [--format yaml|json] doc.semtext.html",
        summary:
          "Extract structured records — facts, steps, properties, references — as YAML or JSON.",
        href: "/docs/#cli-commands"
      },
      %{
        command: "semtext validate doc.semtext.html",
        summary:
          "Check a document — reports structural issues; exits 0 when the document is valid.",
        href: "/docs/#cli-commands"
      },
      %{
        command: "semtext --version",
        summary: "Print the CLI and vocabulary version.",
        href: "/docs/#cli-commands"
      }
    ]
  end

  @doc "Every tag (generated + hand-authored glossary), sorted by name."
  @spec tags() :: [tag()]
  def tags do
    @raw["tags"]
    |> Enum.map(fn t ->
      %{
        name: t["name"],
        family: t["family"],
        summary: t["summary"],
        description: t["description"],
        attributes:
          Enum.map(t["attributes"] || [], fn a ->
            %{name: a["name"], description: a["description"] || ""}
          end),
        children: Enum.map(t["children"] || [], & &1)
      }
    end)
    |> Enum.sort_by(& &1.name)
  end

  @doc "Every SemText-family tag (family == \"sem\"), sorted by name."
  @spec sem_tags() :: [tag()]
  def sem_tags, do: Enum.filter(tags(), &(&1.family == "sem"))

  @doc "Every NPL-family tag (family == \"npl\"), sorted by name."
  @spec npl_tags() :: [tag()]
  def npl_tags, do: Enum.filter(tags(), &(&1.family == "npl"))

  @doc """
  Reference buckets (editorial grouping, display order): id, label,
  description and the ordered tag names per bucket. INTERIM data — see the
  moduledoc.
  """
  @spec buckets() :: [%{id: String.t(), label: String.t(), description: String.t(), tags: [String.t()]}]
  def buckets do
    Enum.map(@raw["buckets"], fn b ->
      %{id: b["id"], label: b["label"], description: b["description"], tags: b["tags"]}
    end)
  end

  @doc "Canonical href of an element's reference page (slug IS the name)."
  @spec tag_href(String.t()) :: String.t()
  def tag_href(name), do: "/reference/#{name}/"

  @doc """
  Every searchable row, in sidebar group order: one entry per tag
  (SemText elements first, then NPL elements) then the CLI commands.
  """
  @spec entries() :: [entry()]
  def entries do
    tag_entries =
      for t <- tags() do
        hint = if t.summary == "", do: t.description, else: t.summary
        group = if t.family == "sem", do: "SemText elements", else: "NPL elements"

        haystack =
          Enum.join(
            [
              t.name,
              hint,
              t.description,
              Enum.map(t.attributes, fn a -> "#{a.name} #{a.description}" end),
              t.children,
              family_note(t.family)
            ]
            |> List.flatten(),
            " "
          )
          |> String.downcase()

        %{
          key: "search-#{t.name}",
          group: group,
          title: t.name,
          hint: hint,
          haystack: haystack,
          href: tag_href(t.name)
        }
      end

    cli_entries =
      for c <- cli_commands() do
        %{
          key: "search-cli-#{c.command}",
          group: "CLI commands",
          title: c.command,
          hint: c.summary,
          haystack: String.downcase("#{c.command} cli command #{c.summary}"),
          href: c.href
        }
      end

    tag_entries ++ cli_entries
  end

  defp family_note("sem"), do: "semtext tag element"
  defp family_note(_), do: "npl prompt tag element"

  @doc "Case-insensitive substring search over the index, in group order."
  @spec search(String.t()) :: [entry()]
  def search(query) do
    q = query |> String.trim() |> String.downcase()

    if q == "" do
      []
    else
      Enum.filter(entries(), &String.contains?(&1.haystack, q))
    end
  end

  @doc "Entry count (search popup footer text)."
  @spec count() :: non_neg_integer()
  def count, do: length(entries())

  @doc """
  Precomputed combobox payload for `HeaderSearch` (server-side, at init):
  stable option ids, group dom ids and pre-downcased haystacks. Ships to
  the client as component state, so the client-side actions never need
  this module (or regex) at runtime — plain data ops only.
  """
  @spec combobox_index() :: %{rows: [map()], count: non_neg_integer()}
  def combobox_index do
    rows =
      entries()
      |> Enum.with_index(fn entry, i ->
        entry
        |> Map.put(:id, "header-search-o-#{i}")
        |> Map.put(:index, i)
        |> Map.put(:group_id, "header-search-g-" <> slug_group(entry.group))
      end)

    %{rows: rows, count: length(rows)}
  end

  defp slug_group(name) do
    name
    |> String.downcase()
    |> String.replace(~r/[^a-z]+/, "-")
    |> String.trim("-")
  end
end
