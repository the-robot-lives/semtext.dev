defmodule SemtextWeb.Hologram.Components.Landing.CodeViewer do
  @moduledoc """
  Shared code window with HTML highlighting, line numbers and Copy/Save
  (port of Next.js `components/code-viewer.tsx`).

  The tokenizer runs once in `init/3` — server-side during SSR; the token
  stream hydrates as serialized state, exactly like the Next.js build whose
  static export shipped the highlighted markup. The template renders only
  precomputed `%{num, toks}` rows, so no string logic is client-reachable.

  Copy/Save need script, so the buttons are chrome-only affordances over a
  static page: the actions hand the source text to `/js/landing-bootstrap.js`
  helpers (`SemtextLanding.copyText/saveText`) via Hologram.JS, escaped with
  the payload-safe js_string/1 escaper (83c34cd class: the doc example
  contains literal `<...>` markup, which must never ride unescaped in the
  inline payload — and unlike the first port there is no hidden textarea
  duplicating it into the SSR DOM, where it broke the harness's
  data-sem-theme count parity). No-op during SSR.
  Deviations from the Next.js port (noted in the lane report): the copy
  status never auto-reverts (the 2s revert needs a timer, which is only
  expressible on bindings), and the Save button label does not flip to
  "↓ Saving" (same reason).
  """

  use Hologram.Component

  @keyword_tags ~w(doctype html head meta link title script body h1 sem-enhanced-document sem-note sem-facts sem-fact)

  @doc_html """
  <!doctype html>
  <html lang="en" data-sem-theme="minimal-tech-light">
  <head>
    <meta charset="utf-8" />
    <title>Auth notes</title>
    <link rel="stylesheet" href="https://cdn.semtext.dev/v0/semtext.css" />
    <link rel="stylesheet" href="https://cdn.semtext.dev/v0/semtext-theme-minimal-tech-light.css" />
    <script defer src="https://cdn.semtext.dev/v0/semtext.js"></script>
  </head>
  <body>
  <sem-enhanced-document>

    <h1 data-kind="title">Auth notes</h1>

    <sem-note variant="warning">
      Refresh tokens rotate per use — each exchange retires the last one.
    </sem-note>

    <sem-facts view-as="flashcards">
      <sem-fact id="f-jwt" kind="concept">
        <statement>JWTs rotate per session</statement>
        <conclusion>Short-lived access tokens; the refresh grant issues a new pair.</conclusion>
        <incorrect-statement>Store the token in localStorage for durability.</incorrect-statement>
      </sem-fact>
    </sem-facts>

  </sem-enhanced-document>
  </body>
  </html>
  """

  prop :code, :string, default: @doc_html
  prop :filename, :string, default: "doc.html"
  prop :caption, :string, default: "minimal SemText document"
  prop :label, :string, default: "A minimal SemText document"
  prop :dom_id, :string, default: "code-viewer-text"
  prop :mime_type, :string, default: "text/html"

  def code_text, do: String.trim_trailing(@doc_html)

  def code_lines, do: tokenize(code_text())

  def init(props, component, _server) do
    code = code_text()

    put_state(component,
      filename: props.filename,
      caption: props.caption,
      label: props.label,
      dom_id: props.dom_id,
      mime_type: props.mime_type,
      copy_status: "idle",
      download_status: "idle"
    )
  end

  # NB: the token <span>s are emitted with NO whitespace between them (and none
  # inside .code-text). .code-line/.code-text are white-space:pre, so template
  # indentation between spans renders as a line break per token.
  def template do
    ~HOLO"""
    <figure class="code-window mt-8" aria-label={@label}>
      <div class="code-chrome">
        <span class="dot live" aria-hidden="true"></span>
        <span class="min-w-0 flex-1 truncate" title={@filename <> " · " <> @caption}>
          {@filename} · {@caption}
        </span>
        <button
          type="button"
          $click={action: :copy_code}
          aria-label="Copy code"
          title={if @copy_status == "copied" do "Copied" else "Copy" end}
          class="ml-2 text-xs text-violet-soft hover:text-violet-soft hover:brightness-110"
        >
          {if @copy_status == "copied" do "✓ Copied" else "Copy" end}
        </button>
        <button
          type="button"
          $click={action: :save_code}
          aria-label={"Save " <> @filename}
          title="Download"
          class="ml-2 text-xs text-violet-soft hover:text-violet-soft hover:brightness-110"
        >
          Save
        </button>
      </div>
      <div class="code-content">
        {%for line <- code_lines()}
          <div class="code-line">
            <span class="code-ln" aria-hidden="true">{line.num}</span>
            <span class="code-text">{%for tok <- line.toks}<span class={if tok.cls == "" do nil else tok.cls end}>{tok.text}</span>{/for}</span>
          </div>
        {/for}
      </div>
    </figure>
    """
  end

  # -- actions -----------------------------------------------------------

  def action(:copy_code, _params, component) do
    Hologram.JS.exec(
      "window.SemtextLanding && SemtextLanding.copyText(" <> js_string(code_text()) <> ")"
    )

    put_state(component, copy_status: "copied")
  end

  def action(:save_code, _params, component) do
    Hologram.JS.exec(
      "window.SemtextLanding && SemtextLanding.saveText(" <>
        js_string(code_text()) <>
        ", " <>
        js_string(component.state.filename) <>
        ", " <>
        js_string(component.state.mime_type) <>
        ")"
    )

    put_state(component, download_status: "downloading")
  end

  # Payload-safe JS string literal (83c34cd class): the doc example embeds
  # literal `<` markup, which must be <-escaped so it can never close a
  # script region. Same escaper as VocabProposalWizard's encode_uri path.
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

  # -- tokenizer (server-side only; init/3 never runs on the client for
  #    SSR'd components, the token stream hydrates as serialized state) ---

  defp tokenize(code) do
    code
    |> String.split("\n")
    |> Enum.with_index(1)
    |> Enum.map(fn {line, idx} ->
      %{num: Integer.to_string(idx), toks: tokenize_line(line)}
    end)
  end

  defp tokenize_line(line) do
    Enum.reverse(tokenize_rest(line, []))
  end

  defp tokenize_rest("", acc), do: acc

  # Comment: <!-- ... --> (unterminated keeps the remainder)
  defp tokenize_rest(rest, acc) do
    if String.starts_with?(rest, "<!--") do
      case String.split(rest, "-->", parts: 2) do
        [seg, tail] ->
          tokenize_rest(tail, [%{text: seg <> "-->", cls: "tok-cmt"} | acc])

        [seg] ->
          tokenize_rest("", [%{text: seg, cls: "tok-cmt"} | acc])
      end
    else
      cond do
        # Tag opening/closing: < ... > (a bare "<!" never reaches here —
        # "<!--" is handled above and "<!doctype" keeps its "<" as default
        # text just like the Next.js tokenizer, which excludes pos+1 == "!")
        String.at(rest, 0) == "<" and String.at(rest, 1) != "!" ->
          tag_branch(rest, acc)

        String.at(rest, 0) == "\"" ->
          case String.split(rest, "\"", parts: 2) do
            [seg, tail] ->
              tokenize_rest(tail, [%{text: seg <> "\"", cls: "tok-str"} | acc])

            [seg] ->
              tokenize_rest("", [%{text: seg, cls: "tok-str"} | acc])
          end

        leading_ws(rest) > 0 ->
          n = leading_ws(rest)
          text = String.slice(rest, 0, n)
          tokenize_rest(String.slice(rest, n..-1//1), [%{text: text, cls: ""} | acc])

        true ->
          glyph = String.slice(rest, 0, 1)
          tokenize_rest(String.slice(rest, 1..-1//1), [%{text: glyph, cls: ""} | acc])
      end
    end
  end

  defp tag_branch(rest, acc) do
    {content, tail} =
      case String.split(rest, ">", parts: 2) do
        [seg, t] -> {seg <> ">", t}
        [seg] -> {seg, ""}
      end

    name = tag_name(content)
    down = String.downcase(name)

    cls =
      if Enum.member?(@keyword_tags, down) or String.starts_with?(name, "sem-") do
        "tok-kw"
      else
        "tok-type"
      end

    tokenize_rest(tail, [%{text: content, cls: cls} | acc])
  end

  # Tag name from "<tag ..." / "</tag ...": leading angle (and slash) then
  # the run of [a-zA-Z0-9-] characters — the Next.js regex's \w+(?:-\w+)*
  # accepts the same strings (it stops at whitespace, "/" or ">").
  defp tag_name(content) do
    content
    |> String.trim_leading("<")
    |> String.trim_leading("/")
    |> String.graphemes()
    |> Enum.take_while(&name_char?/1)
    |> Enum.join("")
  end

  defp name_char?(c) do
    (c >= "a" and c <= "z") or (c >= "A" and c <= "Z") or (c >= "0" and c <= "9") or c == "-"
  end

  defp leading_ws(rest) do
    rest
    |> String.graphemes()
    |> Enum.take_while(&(&1 in [" ", "\t", "\n", "\r"]))
    |> Enum.count()
  end
end
