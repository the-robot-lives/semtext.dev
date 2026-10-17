defmodule SemtextWeb.Hologram.Components.Landing.ThemeGenerator do
  @moduledoc """
  Theme generator (port of Next.js `components/theme-generator.tsx`).

  Without JS: a pointer to the theme conventions section of the spec — the
  opener, dialog and controls render only after hydration (the bootstrap
  dispatches `on_hydrated`). After hydration the native `<dialog>` is
  opened/closed via `showModal()`/`close()` through Hologram.JS; the
  browser owns focus trapping and Escape, and `/js/landing-bootstrap.js`
  adds the two listeners the Next.js version wired imperatively (backdrop
  click closes; the dialog `close` event refocuses the opener).

  The CSS generator is a faithful port of `generateCSSContent` restricted
  to the client-transpilable subset: `<>` concatenation, `:erlang.round`,
  `Integer.to_string/2`, `byte_size/1`, binary pattern matching and
  multi-clause dispatch — no regex, no Enum, no Keyword. The hex parser
  assumes `#rrggbb` (the `type="color"` inputs always send that shape);
  an invalid byte parses as 0, where the Next.js `null` path degraded to
  the input string.

  Deviations (lane report): the text input syncs on `change` (per-keystroke
  `$input` is not in this Hologram build's event set); whitespace in the
  theme name becomes one dash per whitespace char (not one per run); the
  copy status does not auto-revert after 2s (timers are binding-only).
  """

  use Hologram.Component

  def init(_props, component, _server) do
    put_state(component,
      hydrated: false,
      name: "my-theme",
      bg: "#ffffff",
      text: "#1e293b",
      accent: "#2563eb",
      font: "system-ui",
      copy: "idle",
      css: ""
    )
  end

  def template do
    ~HOLO"""
    <div>
      {%if @hydrated}
        <p class="mt-8 text-sm leading-relaxed text-ink-mute">
          Want your own look? Pick colors and a font — the generator writes
          the theme file.
        </p>
        <button
          type="button"
          id="theme-generator-opener"
          $click={action: :open_dialog}
          class="mt-3 inline-flex items-center gap-2 rounded bg-violet px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Open theme generator
        </button>
        <dialog
          id="theme-generator-dialog"
          aria-labelledby="theme-generator-title"
          class="max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-code-border bg-slateink-lift p-0 text-left text-ink"
        >
          <div class="p-6">
            <div class="flex items-start justify-between gap-4">
              <h3 id="theme-generator-title" class="text-xl font-semibold tracking-tight text-ink">
                Theme generator
              </h3>
              <button
                type="button"
                $click={action: :close_dialog}
                class="shrink-0 rounded border border-code-border px-3 py-1.5 text-sm font-semibold text-ink-mute hover:text-ink"
              >
                Close
              </button>
            </div>
            <p class="mt-2 text-sm text-ink-mute">
              The output is a complete theme file: one stylesheet, light and
              dark variants, ready to drop next to your document.
            </p>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label for="theme-name" class="block text-sm font-mono text-violet-soft">Theme name</label>
                <input
                  id="theme-name"
                  type="text"
                  value={@name}
                  placeholder="my-theme"
                  $change={action: :set_name}
                  class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-code-gray"
                />
              </div>
              <div>
                <label for="theme-font" class="block text-sm font-mono text-violet-soft">Font family</label>
                <select
                  id="theme-font"
                  $change={action: :set_font}
                  class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-white"
                >
                  <option value="system-ui" selected={@font == "system-ui"}>system-ui</option>
                  <option value="Georgia, serif" selected={@font == "Georgia, serif"}>Georgia (serif)</option>
                  <option value="ui-monospace, monospace" selected={@font == "ui-monospace, monospace"}>Monospace</option>
                  <option value="sans-serif" selected={@font == "sans-serif"}>Sans-serif</option>
                </select>
              </div>
              <div>
                <label for="theme-bg" class="block text-sm font-mono text-violet-soft">Background color</label>
                <input
                  id="theme-bg"
                  type="color"
                  value={@bg}
                  $change={action: :set_bg}
                  class="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
                />
              </div>
              <div>
                <label for="theme-text" class="block text-sm font-mono text-violet-soft">Text color</label>
                <input
                  id="theme-text"
                  type="color"
                  value={@text}
                  $change={action: :set_text}
                  class="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="theme-accent" class="block text-sm font-mono text-violet-soft">Accent color</label>
                <input
                  id="theme-accent"
                  type="color"
                  value={@accent}
                  $change={action: :set_accent}
                  class="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
                />
              </div>
            </div>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                $click={action: :copy_css}
                class="inline-flex items-center gap-2 rounded bg-violet px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                {if @copy == "copied" do "✓ Copied" else "Copy CSS" end}
              </button>
              <button
                type="button"
                $click={action: :download_css}
                class="inline-flex items-center gap-2 rounded border border-violet px-4 py-2 text-sm font-semibold text-violet-soft hover:brightness-110"
              >
                Download
              </button>
            </div>
            <details class="mt-4">
              <summary class="cursor-pointer text-sm font-mono text-violet-soft hover:text-violet">
                Preview generated CSS
              </summary>
              <pre id="theme-generator-css" class="mt-3 max-h-64 overflow-y-auto rounded border border-code-border bg-slate-950 p-3 font-mono text-xs text-code-gray">{@css}</pre>
            </details>
          </div>
        </dialog>
      {%else}
        <p class="mt-8 text-sm leading-relaxed text-ink-mute">
          Want your own look? The theme file format is documented in the
          <a href="/spec/semtext.html#s6" class="text-violet-soft underline-offset-4 hover:underline">
            theme conventions section of the spec
          </a>
          .
        </p>
      {/if}
    </div>
    """
  end

  # -- actions (client-transpilable: no Enum, no regex, no Keyword) ------

  def action(:on_hydrated, _params, component) do
    s = component.state
    css = generate_css(s.name, s.bg, s.text, s.accent)
    put_state(component, hydrated: true, css: css)
  end

  def action(:set_name, params, component) do
    s = component.state
    name = sanitize_name(params.event.value)
    css = generate_css(name, s.bg, s.text, s.accent)
    put_state(component, name: name, css: css)
  end

  def action(:set_font, params, component) do
    put_state(component, font: params.event.value)
  end

  def action(:set_bg, params, component) do
    s = component.state
    bg = params.event.value
    css = generate_css(s.name, bg, s.text, s.accent)
    put_state(component, bg: bg, css: css)
  end

  def action(:set_text, params, component) do
    s = component.state
    text = params.event.value
    css = generate_css(s.name, s.bg, text, s.accent)
    put_state(component, text: text, css: css)
  end

  def action(:set_accent, params, component) do
    s = component.state
    accent = params.event.value
    css = generate_css(s.name, s.bg, s.text, accent)
    put_state(component, accent: accent, css: css)
  end

  def action(:open_dialog, _params, _component) do
    Hologram.JS.exec("document.getElementById('theme-generator-dialog').showModal()")
  end

  def action(:close_dialog, _params, _component) do
    Hologram.JS.exec("document.getElementById('theme-generator-dialog').close()")
  end

  def action(:copy_css, _params, component) do
    Hologram.JS.exec("window.SemtextLanding && SemtextLanding.copyFrom('theme-generator-css')")
    put_state(component, copy: "copied")
  end

  def action(:download_css, _params, component) do
    Hologram.JS.exec(
      "window.SemtextLanding && SemtextLanding.saveFrom('theme-generator-css', 'semtext-theme-" <>
        component.state.name <>
        ".css', 'text/css')"
    )
  end

  # -- CSS generator (port of generateCSSContent; client-safe subset) ----

  defp generate_css(name, bg, text, accent) do
    dark_bg = lighten(bg)
    dark_text = lighten(text)
    dark_accent = lighten(accent)

    surface = derive_surface(bg)
    muted = derive_muted(text)
    border = derive_border(bg)

    dark_surface = lighten(surface)
    dark_muted = lighten(muted)
    dark_border = lighten(border)

    header(name) <>
      light_block(name, bg, text, accent, surface, muted, border) <>
      dark_block(name, dark_bg, dark_text, dark_accent, dark_surface, dark_muted, dark_border) <>
      media_block(name, dark_bg, dark_text, dark_accent, dark_surface, dark_muted, dark_border)
  end

  defp header(name) do
    "/* SemText — theme: " <>
      name <>
      "\n   Token layer only. Structural/component rules live in semtext.css." <>
      "\n   A new theme is a copy of this file with new --sem-* values." <>
      "\n   Dark mode is auto-generated; edit the light block above to customize. */\n\n"
  end

  defp light_block(name, bg, text, accent, surface, muted, border) do
    "[data-sem-theme=\"" <>
      name <>
      "\"] {\n" <>
      "  color-scheme: light;\n" <>
      "  --sem-bg: " <>
      bg <>
      "; --sem-surface: " <>
      surface <>
      "; --sem-fg: " <>
      text <>
      ";\n" <>
      "  --sem-muted: " <>
      muted <>
      "; --sem-border: " <>
      border <>
      "; --sem-accent: " <>
      accent <>
      ";\n" <>
      "  --sem-accent-fg: " <>
      bg <>
      ";\n" <>
      "  --sem-note-info: " <>
      accent <>
      "; --sem-note-tip: " <>
      accent <>
      ";\n" <>
      "  --sem-note-warning: " <>
      accent <>
      "; --sem-note-danger: " <>
      accent <>
      ";\n" <>
      "  --sem-correct: " <>
      accent <>
      "; --sem-wrong: " <>
      accent <>
      "; --sem-occluded: " <>
      muted <>
      ";\n" <>
      "}\n\n"
  end

  defp dark_block(name, bg, text, accent, surface, muted, border) do
    "[data-sem-theme=\"" <>
      name <>
      "\"][data-color-mode=\"dark\"] {\n" <>
      "  color-scheme: dark;\n" <>
      "  --sem-bg: " <>
      bg <>
      "; --sem-surface: " <>
      surface <>
      "; --sem-fg: " <>
      text <>
      ";\n" <>
      "  --sem-muted: " <>
      muted <>
      "; --sem-border: " <>
      border <>
      "; --sem-accent: " <>
      accent <>
      ";\n" <>
      "  --sem-accent-fg: " <>
      bg <>
      ";\n" <>
      "  --sem-note-info: " <>
      accent <>
      "; --sem-note-tip: " <>
      accent <>
      ";\n" <>
      "  --sem-note-warning: " <>
      accent <>
      "; --sem-note-danger: " <>
      accent <>
      ";\n" <>
      "  --sem-correct: " <>
      accent <>
      "; --sem-wrong: " <>
      accent <>
      "; --sem-occluded: " <>
      muted <>
      ";\n" <>
      "}\n\n"
  end

  defp media_block(name, bg, text, accent, surface, muted, border) do
    "@media (prefers-color-scheme: dark) {\n" <>
      "  " <>
      dark_selector(name) <>
      " {\n" <>
      "    color-scheme: dark;\n" <>
      "    --sem-bg: " <>
      bg <>
      "; --sem-surface: " <>
      surface <>
      "; --sem-fg: " <>
      text <>
      ";\n" <>
      "    --sem-muted: " <>
      muted <>
      "; --sem-border: " <>
      border <>
      "; --sem-accent: " <>
      accent <>
      ";\n" <>
      "    --sem-accent-fg: " <>
      bg <>
      ";\n" <>
      "    --sem-note-info: " <>
      accent <>
      "; --sem-note-tip: " <>
      accent <>
      ";\n" <>
      "    --sem-note-warning: " <>
      accent <>
      "; --sem-note-danger: " <>
      accent <>
      ";\n" <>
      "    --sem-correct: " <>
      accent <>
      "; --sem-wrong: " <>
      accent <>
      "; --sem-occluded: " <>
      muted <>
      ";\n" <>
      "  }\n" <>
      "}"
  end

  defp dark_selector(name) do
    "[data-sem-theme=\"" <> name <> "\"]:not([data-color-mode=\"light\"])"
  end

  # -- color math ---------------------------------------------------------

  # generateDarkVariant: lighten by shifting each channel 40% toward 255.
  defp lighten(hex) do
    {r, g, b} = parse_hex(hex)

    rgb_to_hex(
      round_px(r + (255 - r) * 0.4),
      round_px(g + (255 - g) * 0.4),
      round_px(b + (255 - b) * 0.4)
    )
  end

  # Surface: bg shifted 20 points up, clamped at 255.
  defp derive_surface(hex) do
    {r, g, b} = parse_hex(hex)
    rgb_to_hex(cap(r + 20), cap(g + 20), cap(b + 20))
  end

  # Muted: text at 60%.
  defp derive_muted(hex) do
    {r, g, b} = parse_hex(hex)
    rgb_to_hex(round_px(r * 0.6), round_px(g * 0.6), round_px(b * 0.6))
  end

  # Border: bg shifted 20% toward 255.
  defp derive_border(hex) do
    {r, g, b} = parse_hex(hex)

    rgb_to_hex(
      round_px(r + (255 - r) * 0.2),
      round_px(g + (255 - g) * 0.2),
      round_px(b + (255 - b) * 0.2)
    )
  end

  defp round_px(x) do
    :erlang.round(x)
  end

  defp cap(x) do
    if x > 255 do
      255
    else
      x
    end
  end

  defp parse_hex(<<"#", rest::binary>>) do
    parse_hex(rest)
  end

  defp parse_hex(hex) do
    {pair(hex, 0), pair(hex, 2), pair(hex, 4)}
  end

  defp pair(bin, offset) do
    <<a>> = :erlang.binary_part(bin, offset, 1)
    <<b>> = :erlang.binary_part(bin, offset + 1, 1)
    hex_digit(a) * 16 + hex_digit(b)
  end

  defp hex_digit(?0), do: 0
  defp hex_digit(?1), do: 1
  defp hex_digit(?2), do: 2
  defp hex_digit(?3), do: 3
  defp hex_digit(?4), do: 4
  defp hex_digit(?5), do: 5
  defp hex_digit(?6), do: 6
  defp hex_digit(?7), do: 7
  defp hex_digit(?8), do: 8
  defp hex_digit(?9), do: 9
  defp hex_digit(?a), do: 10
  defp hex_digit(?b), do: 11
  defp hex_digit(?c), do: 12
  defp hex_digit(?d), do: 13
  defp hex_digit(?e), do: 14
  defp hex_digit(?f), do: 15
  defp hex_digit(?A), do: 10
  defp hex_digit(?B), do: 11
  defp hex_digit(?C), do: 12
  defp hex_digit(?D), do: 13
  defp hex_digit(?E), do: 14
  defp hex_digit(?F), do: 15
  defp hex_digit(_), do: 0

  defp rgb_to_hex(r, g, b) do
    "#" <> hex2(r) <> hex2(g) <> hex2(b)
  end

  defp hex2(i) do
    s = Integer.to_string(i, 16)

    if byte_size(s) == 1 do
      "0" <> s
    else
      s
    end
  end

  # -- name sanitizer (value.replace(/\s+/g, "-").toLowerCase()) ---------
  # Char-wise: each whitespace char becomes "-", everything else is
  # lowercased (a run of whitespace yields multiple dashes — cosmetic
  # deviation noted in the module doc).

  defp sanitize_name(""), do: ""

  defp sanitize_name(<<ch::utf8, rest::binary>>) do
    sanitize_char(ch) <> sanitize_name(rest)
  end

  defp sanitize_char(32), do: "-"
  defp sanitize_char(9), do: "-"
  defp sanitize_char(10), do: "-"
  defp sanitize_char(13), do: "-"
  defp sanitize_char(ch), do: String.downcase(<<ch::utf8>>)
end
