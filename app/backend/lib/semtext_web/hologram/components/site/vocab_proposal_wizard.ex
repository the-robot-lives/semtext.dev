defmodule SemtextWeb.Hologram.Components.Site.VocabProposalWizard do
  @moduledoc """
  Drafts a vocabulary proposal and opens it as a prefilled GitHub issue on
  noizu-labs-ml/npl-enhanced-content — port of `VocabProposalWizard` in the
  Next site's `components/extend-wizard.tsx`. (Submit target per the
  docs-overhaul brief; pending a user decision on the final target.)

  The markdown body is built with plain Elixir (client-transpilable); the
  URL encoding goes through `Hologram.JS.eval("encodeURIComponent(...)")`
  with the payload escaped into a JS string literal (regex-free constraint).
  The name normaliser is shared with the scaffold wizard
  (`VocabScaffoldWizard.parse_namespace/1`) — one implementation, no drift.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.VocabScaffoldWizard

  @issue_base "https://github.com/noizu-labs-ml/npl-enhanced-content/issues/new"

  def init(_props, component, _server) do
    put_state(component,
      name: "",
      summary: "",
      motivation: "",
      attrs: "",
      example: "",
      tag: "",
      ready: false,
      issue_url: ""
    )
  end

  # -- actions ------------------------------------------------------------------

  def action(:set_name, params, component), do: recompute(component, %{name: params.value})
  def action(:set_summary, params, component), do: recompute(component, %{summary: params.value})

  def action(:set_motivation, params, component),
    do: recompute(component, %{motivation: params.value})

  def action(:set_attrs, params, component), do: recompute(component, %{attrs: params.value})
  def action(:set_example, params, component), do: recompute(component, %{example: params.value})

  defp recompute(component, changed) do
    s = Map.merge(component.state, changed)
    tag = VocabScaffoldWizard.parse_namespace(s.name)

    ready =
      valid_tag?(tag) and String.trim(s.summary) != "" and String.trim(s.motivation) != ""

    issue_url =
      if ready do
        @issue_base <>
          "?title=" <> encode_uri("Vocabulary proposal: " <> tag) <>
          "&body=" <> encode_uri(body(s, tag))
      else
        ""
      end

    put_state(component, %{tag: tag, ready: ready, issue_url: issue_url})
  end

  # `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` + must contain a hyphen (custom-element
  # rule). The shared normaliser has already lowercased, collapsed dash runs
  # and stripped the edges, so what is left is: non-empty, leading letter,
  # carries a dash.
  defp valid_tag?(tag) do
    case String.graphemes(tag) do
      [] -> false
      [first | _] -> leading_az?(first) and String.contains?(tag, "-")
    end
  end

  defp leading_az?("a"), do: true
  defp leading_az?("b"), do: true
  defp leading_az?("c"), do: true
  defp leading_az?("d"), do: true
  defp leading_az?("e"), do: true
  defp leading_az?("f"), do: true
  defp leading_az?("g"), do: true
  defp leading_az?("h"), do: true
  defp leading_az?("i"), do: true
  defp leading_az?("j"), do: true
  defp leading_az?("k"), do: true
  defp leading_az?("l"), do: true
  defp leading_az?("m"), do: true
  defp leading_az?("n"), do: true
  defp leading_az?("o"), do: true
  defp leading_az?("p"), do: true
  defp leading_az?("q"), do: true
  defp leading_az?("r"), do: true
  defp leading_az?("s"), do: true
  defp leading_az?("t"), do: true
  defp leading_az?("u"), do: true
  defp leading_az?("v"), do: true
  defp leading_az?("w"), do: true
  defp leading_az?("x"), do: true
  defp leading_az?("y"), do: true
  defp leading_az?("z"), do: true
  defp leading_az?(_), do: false

  defp body(s, tag) do
    Enum.join(
      [
        "## Element",
        "`" <> tag <> "`",
        "",
        "## Summary",
        String.trim(s.summary),
        "",
        "## Motivation",
        String.trim(s.motivation),
        "",
        "## Options",
        opts_or_none(s.attrs),
        "",
        "## Example",
        "```html",
        String.trim(s.example),
        "```",
        "",
        "— drafted on semtext.dev/extend/"
      ],
      "\n"
    )
  end

  defp opts_or_none(attrs) do
    trimmed = String.trim(attrs)

    if trimmed == "" do
      "_(none proposed)_"
    else
      trimmed
    end
  end

  # encodeURIComponent via JS interop; the payload is escaped into a JS
  # string literal first. This runs client-side only (in the action), so the
  # server-side pass-through is never hit.
  defp encode_uri(s) do
    Hologram.JS.eval("encodeURIComponent(" <> js_string(s) <> ")")
  end

  defp js_string(s) do
    "\"" <> js_esc(String.graphemes(s)) <> "\""
  end

  defp js_esc([]), do: ""
  defp js_esc(["\\" | rest]), do: "\\\\" <> js_esc(rest)
  defp js_esc(["\"" | rest]), do: "\\\"" <> js_esc(rest)
  defp js_esc(["\n" | rest]), do: "\\n" <> js_esc(rest)
  defp js_esc(["\r" | rest]), do: "\\r" <> js_esc(rest)
  defp js_esc(["\t" | rest]), do: "\\t" <> js_esc(rest)
  defp js_esc(["<" | rest]), do: "\\u003C" <> js_esc(rest)
  defp js_esc([g | rest]), do: g <> js_esc(rest)

  # -- template ------------------------------------------------------------------

  def template do
    ~HOLO"""
    <div>
      <div class="no-js-only text-sm leading-relaxed text-ink-mute">
        The proposal drafter needs JavaScript. Proposals are vocabulary
        additions to the SemText spec — the element's name, what it is, why
        it cannot be authored with the existing vocabulary, its options, and
        a worked example.
      </div>

      <div class="js-only">
        <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
          <div>
            <label for="prop-name" class="block font-mono text-sm text-violet-soft">
              Element name
            </label>
            <input
              id="prop-name"
              type="text"
              value={@name}
              placeholder="yelp-sem-review-summary"
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_name"
            />
          </div>
          <div>
            <label for="prop-summary" class="block font-mono text-sm text-violet-soft">
              One-line summary
            </label>
            <input
              id="prop-summary"
              type="text"
              value={@summary}
              placeholder="A roll-up of review scores with per-source counts."
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_summary"
            />
          </div>
          <div class="sm:col-span-2">
            <label for="prop-motivation" class="block font-mono text-sm text-violet-soft">
              Why the existing vocabulary cannot express it
            </label>
            <textarea
              id="prop-motivation"
              rows="3"
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_motivation"
            >{@motivation}</textarea>
          </div>
          <div class="sm:col-span-2">
            <label for="prop-attrs" class="block font-mono text-sm text-violet-soft">
              Options — one per line, <code>name — meaning</code>
            </label>
            <textarea
              id="prop-attrs"
              rows="2"
              placeholder={"source — where the scores come from\nkind — summary | histogram"}
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_attrs"
            >{@attrs}</textarea>
          </div>
          <div class="sm:col-span-2">
            <label for="prop-example" class="block font-mono text-sm text-violet-soft">
              Worked example
            </label>
            <textarea
              id="prop-example"
              rows="4"
              placeholder={"<yelp-sem-review-summary source=\"yelp\" kind=\"summary\">\n  4.2 across 3,140 reviews\n</yelp-sem-review-summary>"}
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_example"
            >{@example}</textarea>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          {%if @ready}
            <a
              href={@issue_url}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Open the drafted proposal as a GitHub issue
            </a>
          {%else}
            <span class="font-mono text-xs text-ink-faint" role="status">
              Name, summary and motivation make the draft openable.
            </span>
          {/if}
          <a
            href="https://github.com/noizu-labs-ml/npl-enhanced-content/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
          >
            Blank issue instead
          </a>
        </div>
        <p class="mt-2 font-mono text-[0.68rem] leading-5 text-ink-faint">
          Opens a prefilled issue on noizu-labs-ml/npl-enhanced-content — the
          spec's repository. Very long examples may exceed the URL limit; the
          draft is also reproducible by hand from the fields above.
        </p>
      </div>
    </div>
    """
  end
end
