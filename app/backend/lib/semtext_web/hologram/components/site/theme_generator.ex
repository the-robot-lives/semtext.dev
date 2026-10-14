defmodule SemtextWeb.Hologram.Components.Site.ThemeGenerator do
  @moduledoc """
  The theme generator — port of the Next site's `components/theme-generator.tsx`:
  pick a name, a font and three colors; the generator writes the complete
  theme file (token layer only, light and dark variants) for you.

  Client-transpile constraints shape two things (per the design brief):
  the hex math is regex-free (manual digit parsing, integer-only
  arithmetic — `div(6 * v + 1025, 10)` is exact `round(v + (255 - v) * 0.4)`
  and friends), and there is no `<dialog>` interop: the panel is a
  stateful overlay with `$click_outside` on the panel body doing the
  backdrop-click job. Download uses a plain anchor with a `data:` URL and
  the `download` attribute (no Blob code needed); copy goes through the
  Hologram JS interop. Known deviations are listed in the lane report.
  """

  use Hologram.Component

  @defaults %{bg: "#ffffff", text: "#1e293b", accent: "#2563eb", font: "system-ui"}

  def init(_props, component, _server) do
    colors = @defaults
    name = "my-theme"
    css = generate_css(name, colors)

    put_state(component,
      open: false,
      copy_status: "idle",
      theme_name: name,
      bg: colors.bg,
      text: colors.text,
      accent: colors.accent,
      font: colors.font,
      css: css,
      css_url: css_data_url(css),
      file_name: "semtext-theme-" <> name <> ".css"
    )
  end

  # -- actions ----------------------------------------------------------------

  def action(:open_dialog, _params, component) do
    put_state(component, :open, true)
  end

  def action(:close_dialog, _params, component) do
    put_state(component, %{open: false, copy_status: "idle"})
  end

  def action(:set_name, params, component) do
    name = sanitize_name(params.value)
    css = generate_css(name, colors_from(component.state))

    put_state(component,
      theme_name: name,
      css: css,
      css_url: css_data_url(css),
      file_name: "semtext-theme-" <> name <> ".css"
    )
  end

  def action(:set_bg, params, component) do
    set_color(component, :bg, params.value)
  end

  def action(:set_text, params, component) do
    set_color(component, :text, params.value)
  end

  def action(:set_accent, params, component) do
    set_color(component, :accent, params.value)
  end

  def action(:set_font, params, component) do
    set_color(component, :font, params.value)
  end

  defp set_color(component, key, value) do
    colors = colors_from(component.state) |> Map.put(key, value)
    css = generate_css(component.state.theme_name, colors)

    put_state(component, %{
      key => value,
      css: css,
      css_url: css_data_url(css)
    })
  end

  defp colors_from(state) do
    %{bg: state.bg, text: state.text, accent: state.accent, font: state.font}
  end

  def command(:copy, _params, component, _server) do
    Hologram.JS.exec("navigator.clipboard.writeText(" <> js_string(component.state.css) <> ")")
    put_state(component, :copy_status, "copied")
  end

  # Escape an Elixir string into a double-quoted JS string literal (client
  # builds the clipboard call). Also <-escapes `<` so generated CSS can
  # never smuggle a `</script>` sequence through an inline handler.
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

  # -- name / url helpers ------------------------------------------------------

  # Next: value.replace(/\s+/g, "-").toLowerCase() — regex is not available
  # in client-transpiled code, so whitespace runs are collapsed manually
  # (space-split is the 99% case for a theme name field).
  defp sanitize_name(raw) do
    raw
    |> String.downcase()
    |> String.split(" ", trim: true)
    |> Enum.join("-")
  end

  defp css_data_url(css) do
    "data:text/css;charset=utf-8," <> url_encode(css)
  end

  # The binary clause must be guarded: unguarded it also matches lists
  # (clause order) and recursed into String.graphemes(list) — a
  # FunctionClauseError at SSR. A grapheme list encodes directly.
  defp url_encode(css) when is_binary(css) do
    url_encode(String.graphemes(css))
  end

  defp url_encode([g | rest]) when is_list(rest), do: enc_grapheme(g) <> url_encode(rest)
  defp url_encode([]), do: ""

  defp enc_grapheme("%"), do: "%25"
  defp enc_grapheme("\""), do: "%22"
  defp enc_grapheme("#"), do: "%23"
  defp enc_grapheme(" "), do: "%20"
  defp enc_grapheme("\n"), do: "%0A"
  defp enc_grapheme("\r"), do: "%0D"
  defp enc_grapheme(g), do: g

  # -- color math (regex-free, integer-only, client-transpilable) --------------
  #
  # The Next generator used hexToRgb/rgbToHex with regex + Math.round. All
  # three derivations are exact in integer arithmetic:
  #   round(v + (255 - v) * 0.4) = (6v + 1025) div 10
  #   round(v * 0.6)             = (6v + 5)    div 10
  #   round(v + (255 - v) * 0.2) = (8v + 515)  div 10

  def generate_dark_variant(hex), do: map_channels(hex, :lighten)
  def generate_surface(hex), do: map_channels(hex, :plus20)
  def generate_muted(hex), do: map_channels(hex, :soften)
  def generate_border(hex), do: map_channels(hex, :border_up)

  defp map_channels(nil, _op), do: nil

  defp map_channels(hex, op) do
    case hex_to_rgb(hex) do
      {r, g, b} ->
        rgb_to_hex({channel_op(op, r), channel_op(op, g), channel_op(op, b)})

      _ ->
        hex
    end
  end

  defp channel_op(:lighten, v), do: div(6 * v + 1025, 10)
  defp channel_op(:soften, v), do: div(6 * v + 5, 10)
  defp channel_op(:border_up, v), do: div(8 * v + 515, 10)
  defp channel_op(:plus20, v) when v <= 235, do: v + 20
  defp channel_op(:plus20, _v), do: 255

  # `input type=color` values are always `#rrggbb`; the length checks just
  # keep a hand-typed value from crashing the panel.
  def hex_to_rgb(hex) do
    hex2 = if String.length(hex) == 6 do
      "#" <> hex
    else
      hex
    end

    if String.length(hex2) == 7 and String.slice(hex2, 0, 1) == "#" do
      r = hex_pair_to_int(hex2, 1)
      g = hex_pair_to_int(hex2, 3)
      b = hex_pair_to_int(hex2, 5)

      if r < 0 or g < 0 or b < 0 do
        nil
      else
        {r, g, b}
      end
    else
      nil
    end
  end

  defp hex_pair_to_int(s, at) do
    hi = digit_value(String.slice(s, at, 1))
    lo = digit_value(String.slice(s, at + 1, 1))

    if hi < 0 or lo < 0 do
      -1
    else
      hi * 16 + lo
    end
  end

  defp digit_value("0"), do: 0
  defp digit_value("1"), do: 1
  defp digit_value("2"), do: 2
  defp digit_value("3"), do: 3
  defp digit_value("4"), do: 4
  defp digit_value("5"), do: 5
  defp digit_value("6"), do: 6
  defp digit_value("7"), do: 7
  defp digit_value("8"), do: 8
  defp digit_value("9"), do: 9
  defp digit_value("a"), do: 10
  defp digit_value("b"), do: 11
  defp digit_value("c"), do: 12
  defp digit_value("d"), do: 13
  defp digit_value("e"), do: 14
  defp digit_value("f"), do: 15
  defp digit_value(_), do: -1

  def rgb_to_hex({r, g, b}) do
    "#" <> int_to_hex(r) <> int_to_hex(g) <> int_to_hex(b)
  end

  defp int_to_hex(v) do
    hex_digit(div(v, 16)) <> hex_digit(rem(v, 16))
  end

  defp hex_digit(0), do: "0"
  defp hex_digit(1), do: "1"
  defp hex_digit(2), do: "2"
  defp hex_digit(3), do: "3"
  defp hex_digit(4), do: "4"
  defp hex_digit(5), do: "5"
  defp hex_digit(6), do: "6"
  defp hex_digit(7), do: "7"
  defp hex_digit(8), do: "8"
  defp hex_digit(9), do: "9"
  defp hex_digit(10), do: "a"
  defp hex_digit(11), do: "b"
  defp hex_digit(12), do: "c"
  defp hex_digit(13), do: "d"
  defp hex_digit(14), do: "e"
  defp hex_digit(15), do: "f"

  # -- the theme file ----------------------------------------------------------
  # 1:1 with generateCSSContent in the Next component: same selectors, same
  # token lines, same derived-color calls. `<>` chains (no interpolation) so
  # the same function transpiles for the client actions.

  def generate_css(name, colors) do
    bg = colors.bg
    text = colors.text
    accent = colors.accent

    dark_bg = generate_dark_variant(bg)
    dark_text = generate_dark_variant(text)
    dark_accent = generate_dark_variant(accent)

    surface = generate_surface(bg)
    muted = generate_muted(text)
    border = generate_border(bg)

    dark_surface = generate_dark_variant(surface)
    dark_muted = generate_dark_variant(muted)
    dark_border = generate_dark_variant(border)

    sel = "[data-sem-theme=\"" <> name <> "\"]"
    dark_sel = sel <> "[data-color-mode=\"dark\"]"
    media_sel = sel <> ":not([data-color-mode=\"light\"])"

    "/* SemText — theme: " <> name <> "\n" <>
      "   Token layer only. Structural/component rules live in semtext.css.\n" <>
      "   A new theme is a copy of this file with new --sem-* values.\n" <>
      "   Dark mode is auto-generated; edit the light block above to customize. */\n" <>
      "\n" <>
      sel <> " {\n" <>
      "  color-scheme: light;\n" <>
      "  --sem-bg: " <> bg <> "; --sem-surface: " <> surface <> "; --sem-fg: " <> text <> ";\n" <>
      "  --sem-muted: " <> muted <> "; --sem-border: " <> border <> "; --sem-accent: " <> accent <> ";\n" <>
      "  --sem-accent-fg: " <> bg <> ";\n" <>
      "  --sem-note-info: " <> accent <> "; --sem-note-tip: " <> accent <> ";\n" <>
      "  --sem-note-warning: " <> accent <> "; --sem-note-danger: " <> accent <> ";\n" <>
      "  --sem-correct: " <> accent <> "; --sem-wrong: " <> accent <> "; --sem-occluded: " <> muted <> ";\n" <>
      "}\n" <>
      "\n" <>
      dark_sel <> " {\n" <>
      dark_block(dark_sel, dark_bg, dark_surface, dark_text, dark_muted, dark_border, dark_accent) <>
      "}\n" <>
      "\n" <>
      "@media (prefers-color-scheme: dark) {\n" <>
      "  " <> media_sel <> " {\n" <>
      indent_lines(
        dark_block(media_sel, dark_bg, dark_surface, dark_text, dark_muted, dark_border, dark_accent)
      ) <>
      "  }\n" <>
      "}\n"
  end

  defp dark_block(sel, dark_bg, dark_surface, dark_text, dark_muted, dark_border, dark_accent) do
    "  color-scheme: dark;\n" <>
      "  --sem-bg: " <> dark_bg <> "; --sem-surface: " <> dark_surface <> "; --sem-fg: " <> dark_text <> ";\n" <>
      "  --sem-muted: " <> dark_muted <> "; --sem-border: " <> dark_border <> "; --sem-accent: " <> dark_accent <> ";\n" <>
      "  --sem-accent-fg: " <> dark_bg <> ";\n" <>
      "  --sem-note-info: " <> dark_accent <> "; --sem-note-tip: " <> dark_accent <> ";\n" <>
      "  --sem-note-warning: " <> dark_accent <> "; --sem-note-danger: " <> dark_accent <> ";\n" <>
      "  --sem-correct: " <> dark_accent <> "; --sem-wrong: " <> dark_accent <> "; --sem-occluded: " <> dark_muted <> ";\n"
  end

  defp indent_lines(block) do
    # Add two spaces to every line but the first (it is prefixed at the call site).
    String.replace(block, "\n", "\n  ")
  end

  # -- template ------------------------------------------------------------------

  def template do
    ~HOLO"""
    <div>
      <p class="no-js-only mt-8 text-sm leading-relaxed text-ink-mute">
        Want your own look? The theme file format is documented in the{" "}
        <a href="/spec/semtext.html#s6" class="text-violet-soft underline-offset-4 hover:underline">
          theme conventions section of the spec
        </a>
        .
      </p>

      <p class="js-only mt-8 text-sm leading-relaxed text-ink-mute">
        Want your own look? Pick colors and a font — the generator writes the theme file.
      </p>
      <button
        type="button"
        class="js-only mt-3 inline-flex items-center gap-2 rounded bg-violet px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        $click="open_dialog"
      >
        Open theme generator
      </button>

      {%if @open}
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-generator-title"
            class="mx-auto my-[7vh] w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-code-border bg-slateink-lift p-6 text-left text-ink"
            $click_outside="close_dialog"
            $key_down.escape.prevent_default="close_dialog"
          >
            <div class="flex items-start justify-between gap-4">
              <h3 id="theme-generator-title" class="text-xl font-semibold tracking-tight text-ink">
                Theme generator
              </h3>
              <button
                type="button"
                class="shrink-0 rounded border border-code-border px-3 py-1.5 text-sm font-semibold text-ink-mute hover:text-ink"
                $click="close_dialog"
              >
                Close
              </button>
            </div>
            <p class="mt-2 text-sm text-ink-mute">
              The output is a complete theme file: one stylesheet, light and dark variants, ready to drop next to your document.
            </p>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label for="theme-name" class="block text-sm font-mono text-violet-soft">Theme name</label>
                <input
                  id="theme-name"
                  type="text"
                  value={@theme_name}
                  placeholder="my-theme"
                  class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-code-gray"
                  $change="set_name"
                />
              </div>

              <div>
                <label for="theme-font" class="block text-sm font-mono text-violet-soft">Font family</label>
                <select
                  id="theme-font"
                  value={@font}
                  class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-white"
                  $change="set_font"
                >
                  <option value="system-ui">system-ui</option>
                  <option value="Georgia, serif">Georgia (serif)</option>
                  <option value="ui-monospace, monospace">Monospace</option>
                  <option value="sans-serif">Sans-serif</option>
                </select>
              </div>

              <div>
                <label for="theme-bg" class="block text-sm font-mono text-violet-soft">Background color</label>
                <input
                  id="theme-bg"
                  type="color"
                  value={@bg}
                  class="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
                  $change="set_bg"
                />
              </div>

              <div>
                <label for="theme-text" class="block text-sm font-mono text-violet-soft">Text color</label>
                <input
                  id="theme-text"
                  type="color"
                  value={@text}
                  class="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
                  $change="set_text"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="theme-accent" class="block text-sm font-mono text-violet-soft">Accent color</label>
                <input
                  id="theme-accent"
                  type="color"
                  value={@accent}
                  class="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
                  $change="set_accent"
                />
              </div>
            </div>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded bg-violet px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                $click={command: :copy}
              >
                {%if @copy_status == "copied"}
                  ✓ Copied
                {%else}
                  Copy CSS
                {/if}
              </button>
              <a
                href={@css_url}
                download={@file_name}
                class="inline-flex items-center gap-2 rounded border border-violet px-4 py-2 text-sm font-semibold text-violet-soft hover:brightness-110"
              >
                Download
              </a>
            </div>

            <details class="mt-4">
              <summary class="cursor-pointer text-sm font-mono text-violet-soft hover:text-violet">
                Preview generated CSS
              </summary>
              <pre class="mt-3 max-h-64 overflow-y-auto rounded border border-code-border bg-slate-950 p-3 font-mono text-xs text-code-gray">{@css}</pre>
            </details>
          </div>
        </div>
      {/if}
    </div>
    """
  end
end
