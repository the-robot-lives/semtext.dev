"use client";

import { useEffect, useRef, useState } from "react";

interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  font: string;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function generateDarkVariant(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  // Lighten for dark mode by shifting toward 255
  const factor = 0.4;
  return rgbToHex(
    Math.round(r + (255 - r) * factor),
    Math.round(g + (255 - g) * factor),
    Math.round(b + (255 - b) * factor)
  );
}

function generateCSSContent(
  name: string,
  colors: ThemeColors
): string {
  const darkBg = generateDarkVariant(colors.bg);
  const darkText = generateDarkVariant(colors.text);
  const darkAccent = generateDarkVariant(colors.accent);

  // Derive surface, muted, border from primary colors
  const bgRgb = hexToRgb(colors.bg);
  const textRgb = hexToRgb(colors.text);
  const accentRgb = hexToRgb(colors.accent);

  const surface = bgRgb
    ? rgbToHex(
        Math.min(255, bgRgb[0] + 20),
        Math.min(255, bgRgb[1] + 20),
        Math.min(255, bgRgb[2] + 20)
      )
    : colors.bg;

  const muted = textRgb
    ? rgbToHex(
        Math.round(textRgb[0] * 0.6),
        Math.round(textRgb[1] * 0.6),
        Math.round(textRgb[2] * 0.6)
      )
    : colors.text;

  const border = bgRgb
    ? rgbToHex(
        Math.round(bgRgb[0] + (255 - bgRgb[0]) * 0.2),
        Math.round(bgRgb[1] + (255 - bgRgb[1]) * 0.2),
        Math.round(bgRgb[2] + (255 - bgRgb[2]) * 0.2)
      )
    : colors.bg;

  const accentFg = colors.bg;

  return `/* SemText — theme: ${name}
   Token layer only. Structural/component rules live in semtext.css.
   A new theme is a copy of this file with new --sem-* values.
   Dark mode is auto-generated; edit the light block above to customize. */

[data-sem-theme="${name}"] {
  color-scheme: light;
  --sem-bg: ${colors.bg}; --sem-surface: ${surface}; --sem-fg: ${colors.text};
  --sem-muted: ${muted}; --sem-border: ${border}; --sem-accent: ${colors.accent};
  --sem-accent-fg: ${accentFg};
  --sem-note-info: ${colors.accent}; --sem-note-tip: ${colors.accent};
  --sem-note-warning: ${colors.accent}; --sem-note-danger: ${colors.accent};
  --sem-correct: ${colors.accent}; --sem-wrong: ${colors.accent}; --sem-occluded: ${muted};
}

[data-sem-theme="${name}"][data-color-mode="dark"] {
  color-scheme: dark;
  --sem-bg: ${darkBg}; --sem-surface: ${generateDarkVariant(surface)}; --sem-fg: ${darkText};
  --sem-muted: ${generateDarkVariant(muted)}; --sem-border: ${generateDarkVariant(border)}; --sem-accent: ${darkAccent};
  --sem-accent-fg: ${darkBg};
  --sem-note-info: ${darkAccent}; --sem-note-tip: ${darkAccent};
  --sem-note-warning: ${darkAccent}; --sem-note-danger: ${darkAccent};
  --sem-correct: ${darkAccent}; --sem-wrong: ${darkAccent}; --sem-occluded: ${generateDarkVariant(muted)};
}

@media (prefers-color-scheme: dark) {
  [data-sem-theme="${name}"]:not([data-color-mode="light"]) {
    color-scheme: dark;
    --sem-bg: ${darkBg}; --sem-surface: ${generateDarkVariant(surface)}; --sem-fg: ${darkText};
    --sem-muted: ${generateDarkVariant(muted)}; --sem-border: ${generateDarkVariant(border)}; --sem-accent: ${darkAccent};
    --sem-accent-fg: ${darkBg};
    --sem-note-info: ${darkAccent}; --sem-note-tip: ${darkAccent};
    --sem-note-warning: ${darkAccent}; --sem-note-danger: ${darkAccent};
    --sem-correct: ${darkAccent}; --sem-wrong: ${darkAccent}; --sem-occluded: ${generateDarkVariant(muted)};
  }
}`;
}

export function ThemeGenerator() {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [colors, setColors] = useState<ThemeColors>({
    bg: "#ffffff",
    text: "#1e293b",
    accent: "#2563eb",
    font: "system-ui",
  });
  const [themeName, setThemeName] = useState("my-theme");
  const [cssOutput, setCssOutput] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const css = generateCSSContent(themeName, colors);
    setCssOutput(css);
  }, [colors, themeName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssOutput);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([cssOutput], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `semtext-theme-${themeName}.css`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  /*
   * The generator opens in a native <dialog> via showModal(): the browser
   * owns focus trapping and Escape. `close` fires for the Close button,
   * backdrop clicks and Escape alike, so one listener returns focus to
   * the opener button (bound imperatively — not every React version
   * forwards the dialog `close` event).
   */
  useEffect(() => {
    // The dialog only enters the DOM once mounted flips true, so re-run on it.
    const dialog = dialogRef.current;
    if (!mounted || !dialog) return;
    const handleClose = () => openerRef.current?.focus();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [mounted]);

  const openGenerator = () => dialogRef.current?.showModal();

  const closeGenerator = () => dialogRef.current?.close();

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Clicks on the ::backdrop target the <dialog> itself; the panel body
    // is a child that fills it, so clicks inside never match.
    if (e.target === dialogRef.current) dialogRef.current?.close();
  };

  // No JS: the opener can never open the dialog, so render neither it nor
  // the generator — just point at the theme docs in the spec.
  if (!mounted) {
    return (
      <p className="mt-8 text-sm leading-relaxed text-ink-mute">
        Want your own look? The theme file format is documented in the{" "}
        <a
          href="/spec/semtext.html#s6"
          className="text-violet-soft underline-offset-4 hover:underline"
        >
          theme conventions section of the spec
        </a>
        .
      </p>
    );
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={openGenerator}
        className="mt-8 inline-flex items-center gap-2 rounded bg-violet px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
      >
        Open theme generator
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="theme-generator-title"
        onClick={handleDialogClick}
        className="max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-code-border bg-slateink-lift p-0 text-left text-ink [&::backdrop]:bg-slate-950/70"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h3
              id="theme-generator-title"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              Theme generator
            </h3>
            <button
              type="button"
              onClick={closeGenerator}
              className="shrink-0 rounded border border-code-border px-3 py-1.5 text-sm font-semibold text-ink-mute hover:text-ink"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-sm text-ink-mute">
            Create a new theme by choosing colors and a font. The generator
            outputs a complete CSS file with light and dark variants.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-mono text-violet-soft">
                Theme name
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-code-gray"
                placeholder="my-theme"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-violet-soft">
                Font family
              </label>
              <select
                value={colors.font}
                onChange={(e) => setColors({ ...colors, font: e.target.value })}
                className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-white"
              >
                <option value="system-ui">system-ui</option>
                <option value="Georgia, serif">Georgia (serif)</option>
                <option value="ui-monospace, monospace">Monospace</option>
                <option value="sans-serif">Sans-serif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-mono text-violet-soft">
                Background color
              </label>
              <input
                type="color"
                value={colors.bg}
                onChange={(e) => setColors({ ...colors, bg: e.target.value })}
                className="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-violet-soft">
                Text color
              </label>
              <input
                type="color"
                value={colors.text}
                onChange={(e) => setColors({ ...colors, text: e.target.value })}
                className="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-mono text-violet-soft">
                Accent color
              </label>
              <input
                type="color"
                value={colors.accent}
                onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                className="mt-2 h-10 w-full rounded border border-code-border cursor-pointer"
              />
            </div>
          </div>

          {cssOutput && (
            <>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded bg-violet px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  {copyStatus === "copied" ? "✓ Copied" : "Copy CSS"}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded border border-violet px-4 py-2 text-sm font-semibold text-violet-soft hover:brightness-110"
                >
                  Download
                </button>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-mono text-violet-soft hover:text-violet">
                  Preview generated CSS
                </summary>
                <pre className="mt-3 max-h-64 overflow-y-auto rounded border border-code-border bg-slate-950 p-3 font-mono text-xs text-code-gray">
                  {cssOutput}
                </pre>
              </details>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
