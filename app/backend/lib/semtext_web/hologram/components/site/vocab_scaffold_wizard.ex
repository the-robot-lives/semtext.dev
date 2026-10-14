defmodule SemtextWeb.Hologram.Components.Site.VocabScaffoldWizard do
  @moduledoc """
  Step-by-step scaffold for a third-party vocabulary namespace — port of
  `VocabScaffoldWizard` in the Next site's `components/extend-wizard.tsx`:
  a CSS base, one light-DOM custom element per entry, a manifest, a
  hosted-lazy loader (the spec §7 "Hosted lazy" contract applied to a
  foreign namespace), and a demo page.

  All generation is regex-free Elixir that transpiles to the client (the
  design brief's constraint): names are validated by grapheme cases, the
  five artifacts are built with `<>` chains, and the generated code renders
  through the shared `Site.CodeWindow` chrome as plain lines (token
  highlighting of generated CSS/JS is cosmetic and skipped; noted in the
  lane report).
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.CodeWindow

  def init(_props, component, _server) do
    ns = parse_namespace("yelp-sem")
    tags = parse_elements("org-chart\nsystem-status", ns)

    put_state(component,
      ns_raw: "yelp-sem",
      elements_raw: "org-chart\nsystem-status",
      namespace: ns,
      tags: tags,
      files: build_files(ns, tags)
    )
  end

  # -- actions -----------------------------------------------------------------

  def action(:set_ns, params, component) do
    recompute(component, params.value, component.state.elements_raw)
  end

  def action(:set_elements, params, component) do
    recompute(component, component.state.ns_raw, params.value)
  end

  defp recompute(component, ns_raw, elements_raw) do
    ns = parse_namespace(ns_raw)
    tags = parse_elements(elements_raw, ns)

    files =
      if ns != "" and tags != [] do
        build_files(ns, tags)
      else
        []
      end

    put_state(component, %{
      ns_raw: ns_raw,
      elements_raw: elements_raw,
      namespace: ns,
      tags: tags,
      files: files
    })
  end

  # -- name parsing (regex-free) -------------------------------------------------

  @doc """
  Lowercase, trim, hyphen-normalise; "" when nothing usable remains. Next:
  `raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")`.
  """
  def parse_namespace(raw) do
    raw
    |> String.trim()
    |> String.downcase()
    |> String.graphemes()
    |> to_dashes()
    |> Enum.dedup()
    |> strip_dashes_front()
    |> strip_dashes_back()
    |> Enum.join("")
  end

  defp to_dashes(chars), do: to_dashes(chars, [])

  defp to_dashes([], acc), do: Enum.reverse(acc)

  defp to_dashes([g | rest], acc) do
    if ns_char?(g) do
      to_dashes(rest, [g | acc])
    else
      to_dashes(rest, ["-" | acc])
    end
  end

  defp strip_dashes_front(["-" | rest]), do: strip_dashes_front(rest)
  defp strip_dashes_front(list), do: list

  defp strip_dashes_back(list), do: Enum.reverse(strip_dashes_front(Enum.reverse(list)))

  defp ns_char?("0"), do: true
  defp ns_char?("1"), do: true
  defp ns_char?("2"), do: true
  defp ns_char?("3"), do: true
  defp ns_char?("4"), do: true
  defp ns_char?("5"), do: true
  defp ns_char?("6"), do: true
  defp ns_char?("7"), do: true
  defp ns_char?("8"), do: true
  defp ns_char?("9"), do: true
  defp ns_char?("-"), do: true
  defp ns_char?("a"), do: true
  defp ns_char?("b"), do: true
  defp ns_char?("c"), do: true
  defp ns_char?("d"), do: true
  defp ns_char?("e"), do: true
  defp ns_char?("f"), do: true
  defp ns_char?("g"), do: true
  defp ns_char?("h"), do: true
  defp ns_char?("i"), do: true
  defp ns_char?("j"), do: true
  defp ns_char?("k"), do: true
  defp ns_char?("l"), do: true
  defp ns_char?("m"), do: true
  defp ns_char?("n"), do: true
  defp ns_char?("o"), do: true
  defp ns_char?("p"), do: true
  defp ns_char?("q"), do: true
  defp ns_char?("r"), do: true
  defp ns_char?("s"), do: true
  defp ns_char?("t"), do: true
  defp ns_char?("u"), do: true
  defp ns_char?("v"), do: true
  defp ns_char?("w"), do: true
  defp ns_char?("x"), do: true
  defp ns_char?("y"), do: true
  defp ns_char?("z"), do: true
  defp ns_char?(_), do: false

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

  defp all_ns_chars?([]), do: true
  defp all_ns_chars?([g | rest]), do: ns_char?(g) and all_ns_chars?(rest)

  @doc """
  Lowercase, trim, hyphen-normalise each line; skip empties and invalid
  names; prefix with the namespace unless the tag already carries it;
  keep first occurrence, order preserved.
  """
  def parse_elements(raw, ns) do
    raw
    |> String.split("\n")
    |> collect_tags(ns, [])
    |> Enum.reverse()
  end

  defp collect_tags([], _ns, acc), do: acc

  defp collect_tags([line | rest], ns, acc) do
    name = parse_namespace(line)

    if name != "" and valid_element_name?(name) do
      tag = prefix_ns(name, ns)
      acc = if Enum.member?(acc, tag), do: acc, else: [tag | acc]
      collect_tags(rest, ns, acc)
    else
      collect_tags(rest, ns, acc)
    end
  end

  defp prefix_ns(name, ns) do
    if String.starts_with?(name, ns <> "-") do
      name
    else
      ns <> "-" <> name
    end
  end

  # `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` after normalisation: the normaliser has
  # already lowercased, collapsed runs and stripped edge dashes, so what is
  # left to check is a leading letter and every char in [a-z0-9-].
  defp valid_element_name?(name) do
    case String.graphemes(name) do
      [] -> false
      [first | rest] -> leading_az?(first) and all_ns_chars?(rest)
    end
  end

  defp pascal(tag) do
    tag |> String.split("-") |> pascal_parts()
  end

  defp pascal_parts([]), do: ""
  defp pascal_parts([part | rest]), do: String.capitalize(part) <> pascal_parts(rest)

  # -- the five artifacts --------------------------------------------------------

  def build_files(ns, tags) do
    css = %{
      name: ns <> ".css",
      code: css_code(ns, tags)
    }

    element_files =
      Enum.map(tags, fn tag ->
        %{name: "elements/" <> tag <> ".js", code: element_code(ns, tag)}
      end)

    manifest = %{name: ns <> "-manifest.json", code: manifest_code(tags)}
    loader = %{name: ns <> "-lazy.js", code: loader_code(ns, tags)}
    demo = %{name: "demo.html", code: demo_code(ns, tags)}

    Enum.map([css | element_files] ++ [manifest, loader, demo], fn f ->
      %{
        name: f.name,
        code: f.code,
        lines: plain_lines(f.code)
      }
    end)
  end

  defp css_code(ns, tags) do
    "/* " <> ns <> ".css — vocabulary base for the " <> ns <> " namespace.\n" <>
      " * One rule per element: a block box before any definition, so the\n" <>
      " * document presents before (and without) the loader — the same\n" <>
      " * presentation-without-script contract as the core's semtext.css\n" <>
      " * (spec/conventions.md §6).\n" <>
      " */\n" <>
      css_rules(tags) <>
      "\n/* Tokens a host theme can override. */\n" <>
      ":root {\n" <>
      "  --" <> ns <> "-accent: #7c3aed;\n" <>
      "  --" <> ns <> "-surface: #0f172a;\n" <>
      "  --" <> ns <> "-ink: #e2e8f0;\n" <>
      "}"
  end

  defp css_rules([]), do: ""
  defp css_rules([tag]), do: tag <> ":not(:defined) { display: block; }\n"
  defp css_rules([tag | rest]), do: tag <> ":not(:defined) { display: block; }\n" <> css_rules(rest)

  defp element_code(_ns, tag) do
    class = "Sem" <> pascal(tag)

    "/* elements/" <> tag <> ".js — the <" <> tag <> "> element.\n" <>
      " * Light DOM on purpose: the authored content stays searchable, copyable\n" <>
      " * and extractable — the same rule the core vocabulary follows\n" <>
      " * (spec/conventions.md §4 rule 5).\n" <>
      " */\n" <>
      "class " <> class <> " extends HTMLElement {\n" <>
      "  connectedCallback() {\n" <>
      "    if (this.dataset.upgraded) return;\n" <>
      "    this.dataset.upgraded = \"true\";\n" <>
      "    // Read the authored children and render the widget in place.\n" <>
      "    // this.querySelector(...) / this.textContent ...\n" <>
      "  }\n" <>
      "}\n" <>
      "\n" <>
      "customElements.define(\"" <> tag <> "\", " <> class <> ");"
  end

  defp manifest_code(tags) do
    "{\n" <> manifest_entries(tags) <> "\n}"
  end

  defp manifest_entries([]), do: ""

  defp manifest_entries([tag]) do
    "  \"" <> tag <> "\": \"./elements/" <> tag <> ".js\""
  end

  defp manifest_entries([tag | rest]) do
    "  \"" <> tag <> "\": \"./elements/" <> tag <> ".js\",\n" <> manifest_entries(rest)
  end

  defp loader_code(ns, tags) do
    "/* " <> ns <> "-lazy.js — namespace loader for the " <> ns <> " vocabulary.\n" <>
      " * The spec's \"Hosted lazy\" contract (spec/conventions.md §7) applied to a\n" <>
      " * foreign namespace: scan the document for this namespace's tags, import\n" <>
      " * only the chunks those tags need, mark what upgraded, and report a\n" <>
      " * failed chunk as a role=\"alert\" note beside its elements — never only in\n" <>
      " * the console. Components not on the page never download.\n" <>
      " */\n" <>
      "const MANIFEST = {\n" <>
      loader_manifest(tags) <>
      "};\n" <>
      "\n" <>
      "const MARK = \"data-" <> ns <> "-upgraded\";\n" <>
      "\n" <>
      "function reportFailure(tag, error, first) {\n" <>
      "  const note = document.createElement(\"p\");\n" <>
      "  note.setAttribute(\"role\", \"alert\");\n" <>
      "  note.style.whiteSpace = \"pre-wrap\";\n" <>
      "  note.textContent = tag + \": upgrade failed — \" + error.message;\n" <>
      "  first.parentNode.insertBefore(note, first);\n" <>
      "}\n" <>
      "\n" <>
      "async function upgrade(root) {\n" <>
      "  root = root || document;\n" <>
      "  for (const tag of Object.keys(MANIFEST)) {\n" <>
      "    const found = root.querySelectorAll(tag);\n" <>
      "    if (found.length === 0) continue;\n" <>
      "    try {\n" <>
      "      await import(MANIFEST[tag]);\n" <>
      "      for (const el of found) el.setAttribute(MARK, \"\");\n" <>
      "    } catch (error) {\n" <>
      "      reportFailure(tag, error, found[0]);\n" <>
      "    }\n" <>
      "  }\n" <>
      "}\n" <>
      "\n" <>
      "if (document.readyState === \"loading\") {\n" <>
      "  document.addEventListener(\"DOMContentLoaded\", function () { upgrade(); });\n" <>
      "} else {\n" <>
      "  upgrade();\n" <>
      "}"
  end

  defp loader_manifest([]), do: ""
  defp loader_manifest([tag | rest]) do
    "  \"" <> tag <> "\": \"./elements/" <> tag <> ".js\",\n" <> loader_manifest(rest)
  end

  defp demo_code(ns, tags) do
    "<!doctype html>\n" <>
      "<html lang=\"en\">\n" <>
      "<head>\n" <>
      "  <meta charset=\"utf-8\">\n" <>
      "  <title>" <> ns <> " demo</title>\n" <>
      "  <link rel=\"stylesheet\" href=\"./" <> ns <> ".css\">\n" <>
      "  <!-- The loader scans and imports only what this page uses.\n" <>
      "       Server-hosted only: dynamic import needs a server, so this page\n" <>
      "       is not the portable single-file form (spec/conventions.md §7). -->\n" <>
      "  <script src=\"./" <> ns <> "-lazy.js\"></script>\n" <>
      "</head>\n" <>
      "<body>\n" <>
      demo_body(tags) <>
      "\n</body>\n" <>
      "</html>"
  end

  defp demo_body([]), do: ""

  defp demo_body([tag]) do
    "  <" <> tag <> ">\n    …authored content…\n  </" <> tag <> ">"
  end

  defp demo_body([tag | rest]) do
    "  <" <> tag <> ">\n    …authored content…\n  </" <> tag <> ">\n\n" <> demo_body(rest)
  end

  # -- rendering -------------------------------------------------------------------

  defp plain_lines(code) do
    code |> String.split("\n") |> numbered(1)
  end

  defp numbered([], _n), do: []

  defp numbered([line | rest], n) do
    [%{number: n, tokens: [%{text: line, type: "plain"}]} | numbered(rest, n + 1)]
  end

  # -- template ---------------------------------------------------------------------

  def template do
    ~HOLO"""
    <div>
      <div class="no-js-only text-sm leading-relaxed text-ink-mute">
        The generator needs JavaScript. The shape it produces is the spec's
        hosted-lazy contract (
        <code class="font-mono">spec/conventions.md</code>
        §7): a CSS base, one light-DOM element per tag, a manifest, and a
        loader that imports only the chunks the page uses.
      </div>

      <div class="js-only">
        <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
          <div>
            <label for="wiz-ns" class="block font-mono text-sm text-violet-soft">
              Namespace prefix
            </label>
            <input
              id="wiz-ns"
              type="text"
              value={@ns_raw}
              placeholder="yelp-sem"
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_ns"
            />
          </div>
          <div>
            <label for="wiz-elements" class="block font-mono text-sm text-violet-soft">
              Elements — one per line
            </label>
            <textarea
              id="wiz-elements"
              rows="3"
              placeholder="org-chart"
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_elements"
            >{@elements_raw}</textarea>
          </div>
        </div>
        <p class="mt-2 font-mono text-xs leading-5 text-ink-faint">
          Tags are validated as custom-element names and prefixed with the
          namespace unless they already carry it.
          {%if @tags != []}
            {" "}Currently:{%for t <- @tags}<code class="font-mono">&lt;{t}&gt; </code>{/for}
          {/if}
        </p>

        {%if @files == []}
          <p class="mt-6 max-w-3xl rounded-md border border-white/15 px-4 py-3 text-sm text-ink-mute" role="status">
            Name a namespace and at least one valid element to generate the
            scaffold.
          </p>
        {%else}
          <div class="mt-6 flex max-w-3xl flex-col gap-4">
            {%for f <- @files}
              <CodeWindow lines={f.lines} filename={f.name} caption="generated" label={"Generated " <> f.name} class="" />
            {/for}
          </div>
        {/if}
      </div>
    </div>
    """
  end
end
