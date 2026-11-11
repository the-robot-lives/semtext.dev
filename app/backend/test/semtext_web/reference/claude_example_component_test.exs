defmodule SemtextWeb.Reference.ClaudeExampleComponentTest do
  @moduledoc """
  Hologram render tests for the per-card Claude-example block and the
  TagCard that hosts it: collapsed (index default), expanded (page-wide
  switch), always-on (element page header), the static code block, the
  JS-shell hook and the accessibility contract.
  """

  use ExUnit.Case, async: true

  alias Hologram.Server
  alias Hologram.Template.Renderer
  alias Hologram.Template.Renderer.Env
  alias Semtext.Reference.{CardData, Tags}
  alias SemtextWeb.Hologram.Components.Reference.{ClaudeExample, TagCard}

  defp example(name), do: CardData.claude_example(Tags.get(name))

  defp render(module, props) do
    props_dom =
      [{"cid", [text: "under-test"]}] ++
        Enum.map(props, fn {k, v} -> {Atom.to_string(k), [expression: {v}]} end)

    {html, _components, _server} =
      Renderer.render_dom({:component, module, props_dom, []}, %Env{}, %Server{})

    html
  end

  describe "ClaudeExample collapsed (index default)" do
    setup do
      {:ok, html: render(ClaudeExample, example: example("sem-step"))}
    end

    test "renders the labelled static code block as a real pre/code", %{html: html} do
      assert html =~ "SemText — Claude example"
      assert html =~ ~s(<pre class="ref-claude-code" id="claude-sem-step-code"><code>)
      assert html =~ ~s(<span class="ref-claude-line">)
      # The container ships with the child-only tag.
      assert html =~ "sem-procedure"
    end

    test "mounts no live pane until expanded", %{html: html} do
      refute html =~ "data-sem-pane"
      assert html =~ ~s(aria-expanded="false")
      assert html =~ ~s(aria-controls="claude-sem-step-render")
      assert html =~ ~s(class="ref-claude is-code")
    end

    test "carries the pending JS-shell hook and its TODO comment", %{html: html} do
      assert html =~ ~s(data-sem-shell="pending")
      assert html =~ "<!-- js-shell: TODO"
    end

    test "copy and toggle are real buttons", %{html: html} do
      assert html =~ ~s(aria-label="Copy the sem-step Claude example")
      assert html =~ ~r/<button type="button" class="ref-action ref-claude-toggle/
    end
  end

  describe "ClaudeExample expanded via the page-wide switch" do
    setup do
      {:ok, html: render(ClaudeExample, example: example("sem-step"), show_render: true)}
    end

    test "mounts a deferred, spec-carrying render pane", %{html: html} do
      assert html =~ ~s(id="claude-sem-step-pane")
      assert html =~ "data-sem-pane="
      assert html =~ ~s(data-sem-defer="visible")
      assert html =~ ~s(aria-expanded="true")
      assert html =~ "ref-render-placeholder"
    end

    test "shows the view pills with aria-pressed", %{html: html} do
      assert html =~ ~s(class="ref-claude is-both")
      assert html =~ ~s(aria-pressed="true")
      assert html =~ ~s(aria-pressed="false")
    end
  end

  describe "ClaudeExample always-on (element page header)" do
    setup do
      {:ok, html: render(ClaudeExample, example: example("sem-tldr"), always_on: true)}
    end

    test "mounts the pane at SSR, not deferred, without a toggle", %{html: html} do
      assert html =~ ~s(id="claude-sem-tldr-pane")
      refute html =~ "data-sem-defer"
      refute html =~ "aria-expanded"
    end
  end

  describe "TagCard" do
    setup do
      t = Tags.get("sem-note")

      card = %{
        name: t.name,
        family: t.family,
        family_label: Tags.family_label(t.family),
        summary: t.summary,
        gap_note: false,
        href: Tags.tag_href(t.name),
        data_ref: "sem-note",
        claude: CardData.claude_example(t)
      }

      {:ok, card: card}
    end

    test "is an article with the name as the link and the Claude block", %{card: card} do
      html = render(TagCard, card: card)
      assert html =~ ~s(<article data-ref-tag="sem-note")
      assert html =~ ~s(<a href="/reference/sem-note" class="ref-card-link">)
      assert html =~ ~s(data-claude-example="sem-note")
      refute html =~ "data-sem-pane"
    end

    test "passes the show-render switch through", %{card: card} do
      html = render(TagCard, card: card, show_render: true)
      assert html =~ ~s(id="claude-sem-note-pane")
    end
  end
end
