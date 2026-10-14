defmodule SemtextWeb.Hologram.Pages.ReferenceElementPage do
  @moduledoc """
  /reference/:element — one page per element (port of the Next site's
  `app/reference/[element]/page.tsx`): eyebrow, title, summary/gap note,
  deduped description, shared-schema line, the options table, children,
  the Example section (primary authored example + every variant, each with
  a viewer island), the shipped-runtime line, the source ref and the back
  link.

  All derivation (variant dedupe, description dedupe, attr rows, the
  runtime line, viewer specs and the Copy/Save JS snippets) runs
  server-side in init and lands in state as plain data — the template only
  interpolates state, because the client re-renders it and cannot call the
  server-only data modules (and regex must never transpile). Token lists
  are `[[text, class], ...]` pairs; the template reads them with Enum.at.

  KNOWN GAP (flagged for the cutover): an unknown slug renders the
  not-found body with a 200 status — the Next site 404s via notFound().
  """

  use Hologram.Page

  alias Semtext.Reference.{Buckets, Nav, SemMd, Tags, Tokenize, Variants}
  alias SemtextWeb.Hologram.Components.ExampleViewer
  alias SemtextWeb.Hologram.Components.SemMdExample
  alias SemtextWeb.Hologram.Components.Site.DocsShell
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/reference/:element"

  param :element, :string

  layout SiteLayout,
    page_title: "SemText reference",
    description: "SemText reference: options, children and an authored example.",
    canonical: "https://semtext.dev/reference/",
    reference_assets: true

  def init(%{element: slug}, component, _server) do
    case Tags.tag_by_slug(slug) do
      nil ->
        # Unknown slug: not-found body (renders with a 200 — flagged).
        put_state(component, found: false, groups: Nav.groups(), slug: slug)

      tag ->
        init_found(tag, component)
    end
  end

  defp init_found(tag, component) do
    t = tag.name
    missing = Tags.gap_missing_for(t)
    gap_note = "summary" in missing or "description" in missing

    b = Tags.bundles_for(t)
    # cssOnly counts as renderable: the shipped theme CSS paints the
    # authored example, so the render pane mounts.
    renderable = (b != nil and b.shipped) or (b != nil and b.css_only)

    render_note =
      if tag.family == :npl do
        "Render is available once the npl bundle ships."
      else
        "No shipped runtime for this element — the authored example renders as plain HTML."
      end

    variants = dedupe_variants(Variants.for_tag(t), tag.example)

    put_state(component,
      found: true,
      groups: Nav.groups(),
      slug: tag_slug(tag),
      name: t,
      family_label: if(tag.family == :sem, do: "SemText", else: "NPL"),
      family_pill: if(tag.family == :sem, do: "SemText element", else: "NPL element"),
      bucket_label: bucket_label(t) || "",
      summary: tag.summary,
      gap_note: gap_note,
      missing: missing,
      description: dedupe_description(tag.description, tag.summary) || "",
      options_in: tag.options_in || "",
      options_in_href: options_in_href(tag),
      attr_rows: attr_rows(tag.attributes),
      has_attrs: tag.attributes != [],
      no_options_note: no_options_note(missing),
      children: tag.children,
      has_children: tag.children != [],
      has_examples: tag.example != "" or variants != [],
      is_sem_md: t == "sem-md",
      primary: primary_block(tag, renderable, render_note),
      variants: Enum.map(variants, &variant_block(&1, tag, renderable, render_note)),
      runtime: runtime_line(t, tag.family, b),
      source_ref: tag.source
    )
  end

  defp tag_slug(tag), do: Tags.tag_slug(tag.name)

  defp options_in_href(tag) do
    if tag.options_in in [nil, ""], do: "", else: Tags.tag_href(tag.options_in)
  end

  # ————— derivation (port of the TS helpers) —————

  # A variant whose example IS the primary example (whitespace-normalised
  # comparison) is the same figure and is not rendered twice.
  defp dedupe_variants(variants, primary) do
    if primary == "" do
      variants
    else
      key = normalize_ws(primary)
      Enum.reject(variants, &(normalize_ws(&1.code) == key))
    end
  end

  defp normalize_ws(s), do: s |> String.replace(~r/\s+/, " ") |> String.trim()

  # The generator's description usually restates the summary verbatim, so
  # a leading duplicate of the summary — or of its first sentence — is
  # stripped; when nothing survives, the paragraph is dropped. Prefix-exact
  # on trimmed strings; otherwise the description is untouched.
  defp dedupe_description(description, summary) do
    body = String.trim(description || "")
    s = String.trim(summary || "")

    cond do
      body == "" ->
        nil

      s != "" and String.starts_with?(body, s) ->
        rest(body, s)

      s != "" ->
        lead = first_sentence(s)

        if lead != "" and String.starts_with?(body, lead) do
          rest(body, lead)
        else
          body
        end

      true ->
        body
    end
  end

  defp rest(body, prefix) do
    body
    |> String.slice(String.length(prefix)..-1//1)
    |> String.trim()
    |> case do
      "" -> nil
      other -> other
    end
  end

  defp first_sentence(s) do
    case Regex.run(~r/[\s\S]*?[.!?](?=\s|$)/, s) do
      [m] -> m
      _ -> s
    end
  end

  defp bucket_label(name) do
    case Buckets.bucket_of(name) do
      nil -> nil
      b -> b.label
    end
  end

  defp no_options_note(missing) do
    if "attributes" in missing do
      "The schema file states no options for this tag."
    else
      "No options beyond the global attribute catalog are stated for this tag."
    end
  end

  # One options-table row (TS AttrRow): type + allowed values, default
  # rendering ("—" for null, "(empty)" for ""), required tri-state.
  defp attr_rows(attributes) do
    for a <- attributes do
      %{
        name: a.name,
        required: required_text(a.required),
        type: attr_type(a),
        default: default_text(a.default),
        description: if(a.description == "", do: "—", else: a.description)
      }
    end
  end

  defp required_text(true), do: "yes"
  defp required_text(false), do: "no"
  defp required_text(_), do: "—"

  defp attr_type(a) do
    type_part = if a.type == "", do: nil, else: a.type

    values_part =
      if a.allowed_values == [],
        do: nil,
        else: Enum.map_join(a.allowed_values, " | ", &("`" <> &1 <> "`"))

    [type_part, values_part]
    |> Enum.reject(&is_nil/1)
    |> Enum.join(" · ")
  end

  defp default_text(nil), do: "—"
  defp default_text(""), do: "(empty)"
  defp default_text(other), do: other

  # ————— example blocks —————

  defp primary_block(tag, renderable, render_note) do
    if tag.example == "" do
      nil
    else
      if tag.name == "sem-md" do
        %{
          kind: :sem_md,
          anchor: "primary",
          chrome_label: SemMd.chrome_label(),
          lines: example_lines(SemMd.source()),
          spec_json: Jason.encode!(sem_md_spec()),
          copy_js: copy_js(SemMd.source(), "sem-md.md"),
          save_js: save_js(SemMd.source(), "sem-md.md", "text/markdown")
        }
      else
        %{
          kind: :viewer,
          anchor: "primary",
          code: tag.example,
          lines: Tokenize.html_lines(tag.example),
          renderable: renderable,
          render_note: render_note,
          spec_json: viewer_spec_json(tag, tag.example),
          aria_label: "Authored #{tag.name} example",
          chrome_label: "",
          filename: "#{tag.name}.html",
          copy_js: copy_js(tag.example, "#{tag.name}.html"),
          save_js: save_js(tag.example, "#{tag.name}.html", "text/html;charset=utf-8")
        }
      end
    end
  end

  defp example_lines(source) do
    source
    |> String.replace_suffix("\n", "")
    |> String.split("\n")
    |> Enum.with_index(1)
    |> Enum.map(fn {text, n} -> %{n: n, text: text} end)
  end

  # The sem-md example hydrates through the lazy loader scoped to THIS
  # pane only (wire: false — page-driven hydration, never the document
  # scan); the chunk arrives and upgrades the authored element in place.
  defp sem_md_spec do
    %{
      "files" => [%{"src" => "/semtext/semtext-lazy.js", "type" => "module"}],
      "lazy" => true,
      "wire" => false
    }
  end

  defp variant_block(v, tag, renderable, render_note) do
    %{
      id: v.id,
      code: v.code,
      label: v.label,
      note: v.note || "",
      anchor: v.id,
      lines: Tokenize.html_lines(v.code),
      renderable: if(is_boolean(v.renderable), do: v.renderable, else: renderable),
      render_note: render_note,
      spec_json: viewer_spec_json(tag, v.code),
      aria_label: "Authored #{tag.name} example — #{v.label}",
      chrome_label: v.label,
      filename: "#{tag.name}-#{v.id}.html",
      copy_js: copy_js(v.code, "#{tag.name}-#{v.id}.html"),
      save_js: save_js(v.code, "#{tag.name}-#{v.id}.html", "text/html;charset=utf-8")
    }
  end

  defp viewer_spec_json(tag, code) do
    Tags.viewer_spec(tag, code, false)
    |> Map.put("html", code)
    |> Map.put("wire", true)
    |> Jason.encode!()
  end

  # Prebuilt snippets (the client never needs Jason). Copy goes through the
  # clipboard API; save builds a Blob download.
  defp copy_js(code, _filename) do
    "navigator.clipboard.writeText(" <> Jason.encode!(code) <> ")"
  end

  defp save_js(code, filename, mime) do
    "var b=new Blob([" <>
      Jason.encode!(code) <>
      "],{type:\"" <>
      mime <>
      "\"}),u=URL.createObjectURL(b),a=document.createElement(\"a\");" <>
      "a.href=u;a.download=" <>
      Jason.encode!(filename) <>
      ";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)"
  end

  # ————— shipped-runtime line (TS RuntimeLine) —————

  defp runtime_line(_t, _family, nil), do: nil

  defp runtime_line(t, family, b) do
    cond do
      family == :npl ->
        %{kind: :npl}

      b.css_only and not b.shipped ->
        %{kind: :css_only}

      not b.shipped ->
        %{kind: :none}

      true ->
        files = b.bundles || []
        lazy = Enum.find(files, &(&1.file == "semtext-lazy.js"))
        chunk = lazy && String.replace_prefix(lazy.detail, "loads ", "")
        fallback? = Enum.any?(files, &(&1.file == "semtext-fallback.js"))
        # The fallback tier IS the listed bundle on fallback-only tags —
        # say it once ("semtext-fallback.js enhancement tier").
        already_listed = is_nil(chunk) and files != [] and hd(files).file == "semtext-fallback.js"

        %{
          kind: :shipped,
          shared_with: b.shared_with,
          chunk: chunk,
          first_file: if(files != [], do: hd(files).file, else: nil),
          fallback:
            cond do
              fallback? and already_listed -> :fallback_only
              fallback? -> :fallback
              true -> nil
            end
        }
    end
  end

  # ————— template —————
  # Template references STATE ONLY (plus transpilable Enum/Kernel calls) —
  # the client re-renders it and cannot reach the server-only data modules.

  def template do
    ~HOLO"""
    <DocsShell active={"ref-" <> @slug} groups={@groups}>
      <main id="main">
        {%if @found}
          <p class="g-eyebrow">Reference · {@family_label}{%if @bucket_label != ""} · {@bucket_label}{/if}</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            <code class="font-mono">&lt;{@name}&gt;</code>
          </h1>
          <p class="mt-3 max-w-3xl text-xs font-normal uppercase tracking-wide text-ink-faint">
            <span class="ref-family-pill">{@family_pill}</span>
          </p>

          {%if @summary != ""}
            <p class="mt-4 max-w-3xl text-base leading-7 text-ink">{@summary}</p>
          {%else}
            {%if @gap_note}
              <p class="mt-4 max-w-3xl text-sm italic leading-6 text-ink-faint">
                The schema file does not state a summary for this tag{%if @missing != []} (missing: {Enum.join(@missing, ", ")}){/if} — see the normative schema for the contract.
              </p>
            {/if}
          {/if}

          {%if @description != ""}
            <p class="mt-2 max-w-3xl text-sm leading-6 text-ink-mute">{@description}</p>
          {/if}

          {%if @options_in != ""}
            <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
              Shares its schema with{" "}
              <a href={@options_in_href} class="ref-inline-link"><code class="font-mono">&lt;{@options_in}&gt;</code></a>{" "}
              — the option bullets below belong to that element's contract.
            </p>
          {/if}

          {%if @has_attrs}
            <div class="ref-attrs-wrap mt-5">
              <table class="ref-attrs">
                <thead>
                  <tr>
                    <th scope="col">Option</th>
                    <th scope="col">Required</th>
                    <th scope="col">Type · values</th>
                    <th scope="col">Default</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {%for row <- @attr_rows}
                    <tr>
                      <td class="ref-attr-name">{row.name}</td>
                      <td class="ref-attr-req">{row.required}</td>
                      <td class="ref-attr-type">{if row.type != "" do row.type else "—" end}</td>
                      <td class="ref-attr-type">{row.default}</td>
                      <td class="ref-attr-desc">{row.description}</td>
                    </tr>
                  {/for}
                </tbody>
              </table>
            </div>
          {%else}
            <p class="mt-5 max-w-3xl text-sm leading-6 text-ink-mute">{@no_options_note}</p>
          {/if}

          {%if @has_children}
            <div class="mt-5 max-w-3xl">
              <p class="g-nav-title">Children</p>
              <ul class="ref-children" role="list">
                {%for c <- @children}
                  <li>
                    <code class="font-mono">&lt;{c.name}&gt;</code>{%if c.note != ""}<span class="ref-child-note">{c.note}</span>{/if}
                  </li>
                {/for}
              </ul>
            </div>
          {/if}

          {%if @has_examples}
            <section aria-labelledby="example-h" class="mt-8">
              <h2 id="example-h" class="g-nav-title">Example</h2>
              {%if @primary}
                <div id="example-primary" class="mt-3">
                  {%if @is_sem_md}
                    <SemMdExample
                      cid="example-sem-md"
                      anchor={@primary.anchor}
                      chrome_label={@primary.chrome_label}
                      lines={@primary.lines}
                      spec_json={@primary.spec_json}
                      copy_js={@primary.copy_js}
                      save_js={@primary.save_js}
                    />
                  {%else}
                    <ExampleViewer
                      cid="example-primary"
                      anchor={@primary.anchor}
                      code={@primary.code}
                      lines={@primary.lines}
                      renderable={@primary.renderable}
                      render_note={@primary.render_note}
                      spec_json={@primary.spec_json}
                      aria_label={@primary.aria_label}
                      chrome_label={@primary.chrome_label}
                      filename={@primary.filename}
                      copy_js={@primary.copy_js}
                      save_js={@primary.save_js}
                    />
                  {/if}
                </div>
              {/if}
              {%for v <- @variants}
                <div id={"example-" <> v.id} class="mt-8">
                  <p class="g-nav-title">{v.label}</p>
                  {%if v.note != ""}
                    <p class="mt-1 text-sm leading-6 text-ink-mute">{v.note}</p>
                  {/if}
                  <div class="mt-3">
                    <ExampleViewer
                      cid={"example-" <> v.anchor}
                      anchor={v.anchor}
                      code={v.code}
                      lines={v.lines}
                      renderable={v.renderable}
                      render_note={v.render_note}
                      spec_json={v.spec_json}
                      aria_label={v.aria_label}
                      chrome_label={v.chrome_label}
                      filename={v.filename}
                      copy_js={v.copy_js}
                      save_js={v.save_js}
                    />
                  </div>
                </div>
              {/for}
            </section>
          {%else}
            <p class="mt-5 max-w-3xl text-sm italic leading-6 text-ink-faint">
              The schema file states no authoring example for this tag.
            </p>
          {/if}

          {%if @runtime}
            <p class="ref-runtime mt-4 max-w-3xl text-xs leading-5 text-ink-faint">
              Shipped runtime: {runtime_body(@runtime)}
            </p>
          {/if}

          <p class="mt-4 text-xs text-ink-faint">
            Source: <code class="font-mono">{@source_ref}</code>
          </p>

          <p class="mt-10 text-sm">
            <a href="/reference/" class="ref-inline-link">← All tags in the reference</a>
          </p>
        {%else}
          <p class="g-eyebrow">Reference</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink">Not found</h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
            Nothing answers to “{@slug}”. <a href="/reference/" class="ref-inline-link">Browse every tag in the reference</a>.
          </p>
        {/if}
      </main>
    </DocsShell>
    """
  end

  # Rendered into an attr value via template interpolation below —
  # plain string, built from the precomputed runtime map.
  def runtime_body(%{kind: :npl}) do
    "not in the shipped site bundles — the npl-* namespace ships upstream as npl.js / npl-lazy.js + npl-chunks/, not copied into public/semtext/"
  end

  def runtime_body(%{kind: :css_only}) do
    "none — the shipped theme CSS (themes/_vocabulary.css) paints the authored example"
  end

  def runtime_body(%{kind: :none}) do
    "none — the authored example renders as plain HTML"
  end

  def runtime_body(%{kind: :shipped} = r) do
    parts =
      [
        if(r.shared_with, do: "same runtime as <" <> r.shared_with <> ">: ", else: nil),
        cond do
          r.chunk -> "semtext-lazy.js loads " <> r.chunk
          r.first_file -> r.first_file
          true -> nil
        end,
        runtime_fallback_text(r.fallback)
      ]
      |> Enum.reject(&is_nil/1)

    Enum.join(parts, " · ")
  end

  defp runtime_fallback_text(:fallback_only), do: "semtext-fallback.js enhancement tier"
  defp runtime_fallback_text(:fallback), do: "semtext-fallback.js enhancement tier"
  defp runtime_fallback_text(_), do: nil
end
