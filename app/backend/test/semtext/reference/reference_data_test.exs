defmodule Semtext.Reference.ReferenceDataTest do
  @moduledoc """
  Data-layer tests for the reference section's generated + supplement
  inventory (Elements, Glossary, Bundles, Variants, Buckets, Tags, SemMd).
  Pure compile-time data — no DB, no endpoint.
  """

  use ExUnit.Case, async: true

  alias Semtext.Reference.{
    Buckets,
    Bundles,
    Elements,
    Glossary,
    Nav,
    SemMd,
    Tags,
    Tokenize,
    Variants
  }

  describe "inventory" do
    test "counts match the generated half + supplement" do
      assert length(Elements.all()) == 54
      assert length(Glossary.all()) == 7
      assert length(Tags.sem_tags()) == 41
      assert length(Tags.npl_tags()) == 20
      assert length(Tags.all_tags()) == 61
      assert Elements.declared_count() == 54
    end

    test "all_tags is sorted by name" do
      names = Enum.map(Tags.all_tags(), & &1.name)
      assert names == Enum.sort(names)
    end

    test "the generator found every declared field (no gaps)" do
      assert Elements.gaps() == %{}
      assert Tags.gap_missing_for("sem-note") == []
    end

    test "every tag carries a source ref" do
      for t <- Tags.all_tags() do
        assert is_binary(t.source) and t.source != "",
               "tag #{t.name} has no source"
      end
    end

    test "spec version is present" do
      assert Tags.spec_version() =~ ~r/^\d+\.\d+$/
    end
  end

  describe "slugs and lookups" do
    test "the slug is the name for every tag (guard holds)" do
      for t <- Tags.all_tags() do
        assert Tags.tag_slug(t.name) == t.name
        assert Tags.tag_href(t.name) == "/reference/#{t.name}"
      end
    end

    test "slug round-trips through tag_by_slug" do
      for t <- Tags.all_tags() do
        assert Tags.tag_by_slug(t.name).name == t.name
      end
    end

    test "unknown lookups return nil" do
      assert Tags.tag_by_slug("no-such-tag") == nil
      assert Tags.get("no-such-tag") == nil
    end

    test "get/1 finds generated and glossary entries alike" do
      assert Tags.get("sem-note").name == "sem-note"
      assert Tags.get("sem-md").name == "sem-md"
    end
  end

  describe "buckets" do
    test "seven buckets cover every SemText tag exactly once" do
      buckets = Buckets.buckets()
      assert length(buckets) == 7

      covered =
        buckets |> Enum.flat_map(& &1.tags) |> Enum.map(& &1.name) |> Enum.uniq()

      sem_names = Tags.sem_tags() |> Enum.map(& &1.name) |> Enum.sort()
      assert Enum.sort(covered) == sem_names
    end

    test "bucket_of resolves labels" do
      assert Buckets.bucket_of("sem-note").label == "Prose & code"
      assert Buckets.bucket_of("no-such-tag") == nil
    end
  end

  describe "bundles" do
    test "every shipped tag lists at least one bundle file" do
      for t <- Tags.all_tags() do
        b = Bundles.for_tag(t.name)

        if b && b.shipped do
          assert b.bundles != [], "shipped tag #{t.name} lists no files"
        end
      end
    end

    test "sem-note ships lazy" do
      b = Bundles.for_tag("sem-note")
      assert b.shipped
      files = Enum.map(b.bundles, & &1.file)
      assert "semtext-lazy.js" in files
      refute "semtext-fallback.js" in files
    end

    test "alias_runtime loads (class-form alias map)" do
      assert is_map(Tags.alias_runtime())
    end
  end

  describe "variants" do
    test "variants load for the tags the variants file covers" do
      assert Variants.for_tag("sem-facts") != []
      assert Variants.for_tag("no-such-tag") == []
      assert Variants.tag_names() != []
    end

    test "every variant references a known tag" do
      names = MapSet.new(Tags.all_tags(), & &1.name)

      for name <- Variants.tag_names() do
        assert MapSet.member?(names, name), "variant file covers unknown tag #{name}"
      end
    end
  end

  describe "viewer spec" do
    test "shipped tag: keeps the lazy loader, adds the chunk, types modules" do
      spec = Tags.viewer_spec(Tags.get("sem-note"), "x", false)
      srcs = Enum.map(spec["files"], & &1["src"])

      assert "/semtext/semtext-lazy.js" in srcs
      refute "/semtext/semtext-fallback.js" in srcs
      assert Enum.any?(srcs, &(&1 =~ ~r{/chunks/}))
      assert hd(spec["files"])["type"] == "module"
      assert spec["renderable"]
      assert spec["lazy"]
    end

    test "unknown tag degrades to a non-renderable spec" do
      spec = Tags.viewer_spec(nil, "x", false)
      assert spec["renderable"] == false
      assert spec["files"] == []
    end

    test "script type: chunks and lazy loaders are modules, full bundles classic" do
      assert Tags.script_type("semtext-lazy.js") == "module"
      assert Tags.script_type("chunks/sem-note.js") == "module"
      assert Tags.script_type("semtext.js") == "classic"
      assert Tags.script_type("semtext-fallback.js") == nil
    end
  end

  describe "tokenizer" do
    test "lines carry line numbers and [text, class] pairs" do
      lines = Tokenize.html_lines("<sem-note variant=\"warning\">x</sem-note>")
      assert length(lines) == 1
      line = hd(lines)
      assert line.n == 1
      assert [[text, class] | _] = line.toks
      assert text =~ "<sem-note"
      assert class == "tok-kw"
    end

    test "unknown tags tokenize as type, comments as tok-cmt" do
      [line] = Tokenize.html_lines("<foreign-tag> <!-- note -->")
      assert Enum.any?(line.toks, &(&1 == ["<foreign-tag>", "tok-type"]))
      assert Enum.any?(line.toks, &(&1 == ["<!-- note -->", "tok-cmt"]))
    end
  end

  describe "nav" do
    test "groups follow the docs sidebar contract" do
      groups = Nav.groups()
      titles = Enum.map(groups, & &1.title)

      assert hd(titles) == "Guides"
      assert "Reference" in titles
      assert "NPL elements" in titles
      # 2 fixed + 7 buckets + 1 family
      assert length(groups) == 10
    end

    test "every nav item carries its filter payload and a real href" do
      for group <- Nav.groups(), item <- group.items do
        assert is_map_key(item, :data_ref)
        assert String.starts_with?(item.href, "/")
      end
    end
  end

  describe "sem-md" do
    test "the hand-authored render stays in sync with the generated example" do
      assert SemMd.source() == Elements.get("sem-md").example
      assert SemMd.source() =~ ~r{^<sem-md}
    end

    test "the render carries both views of the block" do
      rendered = SemMd.rendered()
      assert rendered =~ "ref-md-static"
      assert rendered =~ "<sem-md"
      assert rendered =~ "Token lifetimes"
    end
  end
end
