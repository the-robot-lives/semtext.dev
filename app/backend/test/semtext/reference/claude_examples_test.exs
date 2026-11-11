defmodule Semtext.Reference.ClaudeExamplesTest do
  @moduledoc """
  Data-layer tests for the per-tag "SemText — Claude example"
  (`priv/data/claude-examples.json`): every tag carries one, the
  hand-polished set covers the most-used tags, container-only tags ship
  with their container, the authoring conventions hold, the seeder is in
  sync, and every example passes `bin/semtext-validate.mjs`.
  """

  use ExUnit.Case, async: true

  alias Semtext.Reference.{CardData, ClaudeExamples, Tags}

  @repo_root Path.expand("../../../../..", __DIR__)
  @validator Path.join(@repo_root, "bin/semtext-validate.mjs")
  @seeder Path.join(@repo_root, "app/scripts/seed-claude-examples.mjs")

  # Most-used tags: these MUST be hand-polished (never a raw seed).
  @must_be_hand ~w(
    sem-tldr sem-summary sem-table sem-code sem-md sem-note sem-facts sem-fact
    sem-question sem-option sem-reference sem-references sem-procedure sem-step
    sem-runbook sem-changelog sem-changelogs sem-properties sem-property
    sem-details sem-detail sem-source sem-rubric sem-eval sem-reader agent
    sem-enhanced-document
  )

  # Tags that only live inside a container => the example includes it.
  @container_of %{
    "sem-reference" => "sem-references",
    "sem-step" => "sem-procedure",
    "sem-fact" => "sem-facts",
    "statement" => "sem-fact",
    "conclusion" => "sem-fact",
    "incorrect-statement" => "sem-fact",
    "sem-option" => "sem-question",
    "sem-property" => "sem-properties",
    "sem-detail" => "sem-details",
    "sem-changelog" => "sem-changelogs",
    "sem-faq" => "sem-faqs",
    "sem-guard-rail" => "sem-guard-rails",
    "sem-view" => "sem-views",
    "sem-event" => "sem-chronology",
    "sem-profile" => "sem-audiences",
    "sem-reader" => "sem-enhanced-document",
    "agent" => "sem-enhanced-document"
  }

  # Elements the validator's schema (spec/schema/semtext.schema.json) does
  # not know yet: the npl-* display family, sem-browser, and the Tier-1 quiz
  # demo pair. Their examples may only fail with unknown-element for these.
  defp schema_gap_element?(el),
    do: String.starts_with?(el, "npl-") or el in ~w(sem-browser sem-question sem-option)

  test "every tag carries a non-empty claude_example and a source" do
    for t <- Tags.all_tags() do
      assert is_binary(t.claude_example) and String.trim(t.claude_example) != "",
             "#{t.name} has no claude_example"

      assert t.claude_example_source in [:hand, :seed]
    end

    assert map_size(ClaudeExamples.all()) == length(Tags.all_tags())
  end

  test "the most-used tags are hand-polished" do
    hand = MapSet.new(ClaudeExamples.hand_polished())

    for name <- @must_be_hand do
      assert MapSet.member?(hand, name), "#{name} must be hand-polished"
    end

    assert MapSet.size(hand) >= 25
  end

  test "container-only tags ship inside their container" do
    for {tag, parent} <- @container_of do
      code = Tags.get(tag).claude_example
      assert code =~ "<#{parent}", "#{tag} example must include <#{parent}>"
      assert code =~ ~r/<#{tag}[\s>]/, "#{tag} example must use <#{tag}>"
    end
  end

  test "hand-polished examples follow the authoring conventions" do
    for name <- ClaudeExamples.hand_polished() do
      code = ClaudeExamples.get(name).code

      for bad <- ~w(<b> <strong> <i> <em> <br <pre <ul <ol) do
        refute code =~ bad, "#{name}: authoring conventions forbid #{bad}"
      end

      refute code =~ ~r/role="(list|listitem)"/, "#{name}: no role attributes on lists/steps"
    end
  end

  test "as_document wraps fragments once and keeps authored roots" do
    assert ClaudeExamples.as_document("<sem-tldr id=\"t\">x</sem-tldr>") =~
             "<sem-enhanced-document>\n<sem-tldr"

    doc = ClaudeExamples.as_document(Tags.get("agent").claude_example)
    assert length(String.split(doc, "<sem-enhanced-document")) == 2
  end

  test "card data tokenizes the example and carries a pane spec with the markup" do
    card = CardData.claude_example(Tags.get("sem-reference"))
    assert card.dom_id == "claude-sem-reference"
    assert card.line_count == length(card.lines)
    spec = card.spec_json |> String.replace("<\\/", "</") |> Jason.decode!()
    assert spec["html"] == Tags.get("sem-reference").claude_example
    assert spec["renderable"] == true
    assert spec["tag"] == "sem-reference"
    # No serialized string may carry a raw `</` (pageMountData script block).
    refute card.spec_json =~ "</"
    for l <- card.lines, [text, _] <- l.toks, do: refute(text =~ "</" and text != "</")
  end

  @tag :node
  test "the seeder is in sync (no stale seed entries, no missing tags)" do
    {out, code} = System.cmd("node", [@seeder, "--check"], stderr_to_stdout: true)
    assert code == 0, "seed-claude-examples.mjs --check: #{out}"
  end

  @tag :node
  @tag timeout: 120_000
  test "every claude example validates with bin/semtext-validate.mjs" do
    dir = Path.join(System.tmp_dir!(), "claude-examples-#{System.unique_integer([:positive])}")
    File.mkdir_p!(dir)

    try do
      for t <- Tags.all_tags() do
        File.write!(
          Path.join(dir, t.name <> ".html"),
          ClaudeExamples.as_document(t.claude_example)
        )
      end

      {out, _} =
        System.cmd("node", [@validator, "--format", "json", Path.join(dir, "*.html")],
          cd: @repo_root
        )

      report = Jason.decode!(out)
      assert length(report["files"]) == length(Tags.all_tags())

      problems =
        for f <- report["files"],
            d <- f["diagnostics"],
            not gap?(d),
            do: "#{Path.basename(f["file"])}: #{d["severity"]} #{d["rule"]} — #{d["message"]}"

      assert problems == [], Enum.join(problems, "\n")
    after
      File.rm_rf!(dir)
    end
  end

  defp gap?(%{"severity" => "error", "rule" => "unknown-element", "message" => msg}) do
    case Regex.run(~r/<([a-z0-9-]+)>/, msg) do
      [_, el] -> schema_gap_element?(el)
      _ -> false
    end
  end

  defp gap?(_), do: false
end
