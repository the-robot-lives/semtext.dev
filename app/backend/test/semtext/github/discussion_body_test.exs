defmodule Semtext.Github.DiscussionBodyTest do
  @moduledoc "Discussion title/body template (v1 §6): deep link, sections, fences, truncation."

  use ExUnit.Case, async: true

  alias Semtext.Github.DiscussionBody

  @target %{
    proposal_id: "11111111-1111-1111-1111-111111111111",
    slug: "sem-datalist",
    title: "A datalist element",
    element_tag: "sem-datalist",
    summary: "Renders a list.",
    motivation: "Lists are common.",
    options: [%{name: "kind", meaning: "inline | referenced"}],
    example: "<sem-datalist><li>one</li></sem-datalist>"
  }

  setup do
    base = Application.get_env(:semtext, Semtext.Github, [])

    on_exit(fn ->
      if base == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base)
      end
    end)

    :ok
  end

  test "title prefers `tag — heading`, falls back to heading then slug" do
    assert DiscussionBody.title(@target) == "sem-datalist — A datalist element"
    assert DiscussionBody.title(%{@target | element_tag: nil}) == "A datalist element"
    assert DiscussionBody.title(%{@target | element_tag: nil, title: nil}) == "sem-datalist"
  end

  test "body carries the deep link, quoted preamble, and all sections" do
    body = DiscussionBody.body(@target)

    assert body =~ "https://proposals.semtext.dev/p/sem-datalist"
    assert body =~ "## Element\n\n`sem-datalist`"
    assert body =~ "## Summary\n\nRenders a list."
    assert body =~ "## Motivation\n\nLists are common."
    assert body =~ "- **kind** — inline | referenced"
    assert body =~ "```html\n<sem-datalist><li>one</li></sem-datalist>\n```"
    assert body =~ "Status: **submitted**"
  end

  test "an example containing a fence gets a longer outer fence" do
    example = "intro\n```html\n<p>x</p>\n```\nend"
    body = DiscussionBody.body(%{@target | example: example})

    assert body =~ "````html\n#{example}\n````"
  end

  test "options render from string-keyed maps, tuples, and plain strings" do
    opts = [
      %{"name" => "a", "meaning" => "first"},
      {"b", "second"},
      "free form"
    ]

    body = DiscussionBody.body(%{@target | options: opts})

    assert body =~ "- **a** — first\n- **b** — second\n- free form"
  end

  test "nil/empty sections are omitted entirely" do
    body = DiscussionBody.body(%{@target | motivation: nil, options: [], example: ""})

    refute body =~ "## Motivation"
    refute body =~ "## Options"
    refute body =~ "## Example"
    assert body =~ "## Summary"
  end

  test "oversized sections are truncated with a marker (body stays postable)" do
    huge = String.duplicate("x", 50_000)
    body = DiscussionBody.body(%{@target | example: huge})

    assert body =~ "(truncated at 40000 bytes)"
    assert byte_size(body) < 45_000
  end
end
