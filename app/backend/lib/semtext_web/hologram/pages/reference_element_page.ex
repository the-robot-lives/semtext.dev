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
    reference_assets: true,
    # The definition card below is authored vocabulary (<sem-tag-def>):
    # the page-level stable bundle upgrades it in the browser.
    load_semtext_bundle: true

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
      # Per-tag <title>/og:title. Hologram merges page state into layout
      # props (build_layout_props_dom), so this overrides SiteLayout's
      # static page_title — matching the Next export's "<tag> — SemText
      # reference" (SSR escapes the angle brackets for us).
      page_title: "<#{t}> — SemText reference",
      family_label: Tags.family_label(tag.family),
      family_pill: Tags.family_pill(tag.family),
      bucket_label: bucket_label(t) || "",
      summary: tag.summary,
      gap_note: gap_note,
      missing: missing,
      description: dedupe_description(tag.description, tag.summary) || "",
      options_in: tag.options_in || "",
      options_in_href: options_in_href(tag),
      # The self-describing definition card (<sem-tag-def>): raw attribute
      # fields for the authored markup, the bucket id as its group token,
      # and the derived PromptLingo docs link on NPL conventions.
      tag_attrs: tag_attrs(tag.attributes),
      group: group_token(t),
      promptlingo_href: promptlingo_href(tag),
      no_options_note: no_options_note(missing),
      children: tag.children,
      has_children: tag.children != [],
      has_examples: tag.example != "" or variants != [],
      is_sem_md: t == "sem-md",
      primary: primary_block(tag, renderable, render_note),
      variants: Enum.map(variants, &variant_block(&1, tag, renderable, render_note)),
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

  # Raw attribute fields for the authored <sem-tag-attr> markup — nil omits
  # the attribute entirely (Hologram renders nil-valued attributes as
  # absent), so optional rows stay clean and `required` only appears when
  # the schema marks it required.
  defp tag_attrs(attributes) do
    for a <- attributes do
      %{
        name: a.name,
        type: if(a.type == "", do: nil, else: a.type),
        required: a.required,
        default: a.default,
        allowed:
          if(a.allowed_values == [],
            do: nil,
            else: Enum.join(a.allowed_values, ",")
          ),
        description: a.description
      }
    end
  end

  # The definition card's group token: the reference bucket id.
  defp group_token(name) do
    case Buckets.bucket_of(name) do
      nil -> nil
      b -> b.id
    end
  end

  # Data-driven PromptLingo docs link (verified live 2026-10-18):
  # promptlingo.dev serves /reference/<tag> for every npl-* convention;
  # sem-* tags have no PromptLingo page and get no link.
  defp promptlingo_href(tag) do
    if tag.family == :npl, do: "https://promptlingo.dev/reference/#{tag.name}", else: ""
  end


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
          save_js: save_js(tag.example, "#{tag.name}.html", "text/html;charset=utf-8"),
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

  # /editor deep links (site-editor lane): the editor island fetches the
  # same compile-time source back through /editor/examples/:tag. Tag names
  # are [a-z0-9-] by construction, so no escaping is needed.

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

          {%if @gap_note}
            <p class="mt-4 max-w-3xl text-sm italic leading-6 text-ink-faint">
              The schema file does not state a summary for this tag{%if @missing != []} (missing: {Enum.join(@missing, ", ")}){/if} — see the normative schema for the contract.
            </p>
          {/if}

          {%if @promptlingo_href != ""}
            <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
              <a href={@promptlingo_href} class="ref-inline-link">PromptLingo reference ↗</a>
            </p>
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

          <div class="ref-attrs-wrap mt-5 max-w-3xl">
            <sem-tag-def tag={@name} group={@group}>
              {@summary}
              {@description}
              {%for a <- @tag_attrs}
                <sem-tag-attr name={a.name} type={a.type} required={a.required} default={a.default} allowed={a.allowed}>{a.description}</sem-tag-attr>
              {/for}
            </sem-tag-def>
          </div>

          {%if @tag_attrs == []}
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

          <p class="mt-4 text-xs text-ink-faint">
            Source: <code class="font-mono">{@source_ref}</code>
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
end
