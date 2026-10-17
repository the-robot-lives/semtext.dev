import type { Metadata } from "next";
import { ThemeShowcase } from "./showcase-client";

export const metadata: Metadata = {
  title: "Theme showcase — SemText",
  description:
    "All five shipped SemText themes rendering the same sample document side by side, with a one-attribute switcher: minimal-tech-light (default), nocturne-console, organic-warm, editorial-settings and newsprint.",
  alternates: { canonical: "https://semtext.dev/themes/showcase/" },
};

/*
 * The Theme Showcase — the same sample SemText markup under every shipped
 * theme (spec/conventions.md §6, v0.6). The samples are authored in the
 * v0.6 forms (markdown sem-list lines, a pipe-table sem-table, flat
 * sem-code) so the page doubles as a living demo of the consolidated
 * /semtext/latest/ bundle that carries all five themes in one stylesheet.
 */
export default function ThemeShowcasePage() {
  return (
    <div className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p className="g-eyebrow">Platform</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Theme showcase
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          One sample document, five themes, zero per-theme stylesheets: every
          panel below is the same markup under a{" "}
          <code className="font-mono">data-sem-theme</code> attribute, served
          from the consolidated{" "}
          <code className="font-mono">/semtext/latest/semtext.css</code> — the
          vocabulary base, the v0.6 structural additions and all five themes
          in one file. Switching a whole document is still one attribute on{" "}
          <code className="font-mono">&lt;html&gt;</code>; try the switcher.
        </p>
        <ThemeShowcase />
      </main>
    </div>
  );
}
