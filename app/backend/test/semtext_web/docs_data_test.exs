defmodule SemtextWeb.DocsDataTest do
  @moduledoc """
  Shape tests for the compile-time docs data modules behind the P0
  /docs, /showcase and header-search ports. The Next site's arrays are
  single sources of truth; these ports are the single sources here, so
  the tests pin shapes and cross-references (not copy — the parity
  harness owns copy-level diffing).
  """

  use ExUnit.Case, async: true

  alias SemtextWeb.Docs.{NavGroups, SearchIndex, Showcase}

  describe "SearchIndex" do
    test "groups match the Next search buckets" do
      assert SearchIndex.groups() == ["SemText elements", "NPL elements", "CLI commands"]
    end

    test "entries are complete and well-formed" do
      entries = SearchIndex.entries()
      assert length(entries) > 50

      for e <- entries do
        assert is_binary(e.title) and e.title != ""
        assert is_binary(e.group) and e.group in SearchIndex.groups()
        assert is_binary(e.href) and String.starts_with?(e.href, "/")
        assert is_binary(e.haystack)
      end
    end

    test "count mirrors entries" do
      assert SearchIndex.count() == length(SearchIndex.entries())
    end

    test "search finds tags and commands case-insensitively" do
      hits = SearchIndex.search("sem-note")
      assert hits != []
      assert Enum.any?(hits, &(&1.href == "/reference/sem-note/"))

      assert SearchIndex.search("SEM-NOTE") |> Enum.any?(&(&1.href == "/reference/sem-note/"))
      assert SearchIndex.search("") == []
    end

    test "combobox_index precomputes stable option rows" do
      payload = SearchIndex.combobox_index()
      assert payload.count == length(payload.rows)
      assert payload.rows != []

      for {o, i} <- Enum.with_index(payload.rows) do
        assert o.id == "header-search-o-#{i}"
        assert o.index == i
        assert o.group_id =~ "header-search-g-"
        assert Map.has_key?(o, :haystack)
      end
    end

    test "tag hrefs carry the trailing slash" do
      assert SearchIndex.tag_href("sem-note") == "/reference/sem-note/"
    end
  end

  describe "NavGroups" do
    test "default groups cover guides, reference and showcase" do
      groups = NavGroups.groups()
      assert groups != []

      titles = Enum.map(groups, & &1.title)
      assert "Guides" in titles
      assert "Showcase" in titles

      for g <- groups do
        assert g.items != [], "group #{g.title} has no items"

        for item <- g.items do
          assert is_binary(item.label) and item.label != ""
          assert is_binary(item.href)
          assert item.href == "" or String.starts_with?(item.href, "/") or
                   String.starts_with?(item.href, "http")
        end
      end
    end

    test "reference groups mirror the tag catalog" do
      refs = NavGroups.reference_groups()
      assert refs != []
      assert NavGroups.github_repo() =~ "npl-enhanced-content"
    end
  end

  describe "Showcase" do
    test "items list all nine slug pages" do
      slugs = Enum.map(Showcase.items(), & &1.slug)

      assert Enum.sort(slugs) ==
               Enum.sort(~w(claude-md documentation onboarding agent command skill data-viewer embedding sem-shell))
    end

    test "every item has a label, note and /showcase href" do
      for item <- Showcase.items() do
        assert is_binary(item.label) and item.label != ""
        assert is_binary(item.note) and item.note != ""
        assert String.starts_with?(item.href, "/showcase/")
      end
    end

    test "by_slug resolves and rejects unknown slugs" do
      assert %{} = Showcase.by_slug("command")
      assert Showcase.by_slug("command").slug == "command"
      assert Showcase.by_slug("nope") == nil
    end

    test "integrations are the four planned portfolio origins" do
      integrations = Showcase.integrations()
      assert length(integrations) == 4

      for i <- integrations do
        assert i.planned == true
        assert String.starts_with?(i.href, "http")
      end
    end
  end
end
