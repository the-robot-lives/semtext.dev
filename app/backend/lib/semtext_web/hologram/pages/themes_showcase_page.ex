defmodule SemtextWeb.Hologram.Pages.ThemesShowcasePage do
  @moduledoc """
  /themes/showcase/ — port of the Next site's
  `app/themes/showcase/page.tsx` (+ its `showcase-client.tsx` island):
  the same sample SemText document rendered once per shipped theme, each
  panel scoped by `data-sem-theme` on its wrapper. The sample is authored
  in the v0.6 forms (markdown sem-list lines, a pipe-table sem-table, flat
  inline and block sem-code) so the page doubles as a living demo of the
  consolidated `/semtext/latest/` bundle, which SiteLayout loads for this
  page (`latest_assets: true`).

  Unlike the Next client island — which injects the bundle on mount — the
  panels are static DOM themed by CSS alone (zero-JS safe); the only
  interactive part is the whole-page switcher (`ThemeSwitcher`), which
  writes `data-sem-theme` on `<html>`, the whole-document form, exactly
  as the island does.
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Components.Site.ThemeSwitcher
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/themes/showcase"
  layout SiteLayout,
    page_title: "Theme showcase — SemText",
    description:
      "All five shipped SemText themes rendering the same sample document side by side, with a one-attribute switcher: minimal-tech-light (default), nocturne-console, organic-warm, editorial-settings and newsprint.",
    canonical: "https://semtext.dev/themes/showcase/",
    latest_assets: true

  # Verbatim from THEMES in the Next showcase-client.tsx.
  @themes [
    %{slug: "minimal-tech-light", label: "minimal-tech-light", note: "default"},
    %{slug: "nocturne-console", label: "nocturne-console", note: "dark-first console"},
    %{slug: "organic-warm", label: "organic-warm", note: "warm paper"},
    %{slug: "editorial-settings", label: "editorial-settings", note: "magazine cool"},
    %{slug: "newsprint", label: "newsprint", note: "print-like serif"}
  ]

  def init(_params, component, _server) do
    put_state(component, themes: @themes)
  end

  def template do
    ~HOLO"""
    <div class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p class="g-eyebrow">Platform</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Theme showcase
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          One sample document, five themes, zero per-theme stylesheets: every
          panel below is the same markup under a{" "}
          <code class="font-mono">data-sem-theme</code> attribute, served
          from the consolidated{" "}
          <code class="font-mono">/semtext/latest/semtext.css</code> — the
          vocabulary base, the v0.6 structural additions and all five themes
          in one file. Switching a whole document is still one attribute on{" "}
          <code class="font-mono">&lt;html&gt;</code>; try the switcher.
        </p>

        <ThemeSwitcher cid="theme_switcher" themes={@themes} />

        <div class="mt-10 flex flex-col gap-10">
          {%for t <- @themes}
            <section aria-label={t.label <> " panel"}>
              <h2 class="text-lg font-semibold tracking-tight text-ink">
                <code class="font-mono">{t.label}</code>
                <span class="ml-2 text-sm font-normal text-ink-mute">{t.note}</span>
              </h2>
              <div
                data-sem-theme={t.slug}
                class="mt-3 rounded-xl border border-code-border p-6 sm:p-8"
              >
                <sem-enhanced-document>
                  <sem-note variant="tip">
                    Rotation is <sem-highlight>per session</sem-highlight>{" "}
                    — short-lived access, a refresh grant issues a new pair.
                  </sem-note>

                  <sem-list ordered="ordered">
                    1. Port-forward MinIO
                    2. Run migrations
                    - auth schema first
                    - then tokens
                    3. Cut release
                  </sem-list>

                  <sem-table controls="sort,filter" label="Token lifetimes">
                    | Token | Lifetime | Rotates |
                    | ----- | -------- | ------- |
                    | access | 15 min | no |
                    | refresh | 30 days | yes |
                  </sem-table>

                  <p>
                    Inline code is an element now:{" "}
                    <sem-code>npm run validate</sem-code>.
                  </p>

                  <sem-code lang="ts" filename="src/rotate.ts">
                    {"export function rotate(pair: Pair): Pair {\n  const next = mint();\n  retire(pair.refresh);\n  return next;\n}"}
                  </sem-code>

                  <sem-procedure>
                    <sem-step status="done">provision Infisical path</sem-step>
                    <sem-step status="current">port-forward MinIO</sem-step>
                    <sem-step>run migrations</sem-step>
                  </sem-procedure>

                  <sem-break></sem-break>

                  <p>
                    A thematic break above is authored as{" "}
                    <sem-code>&lt;sem-break&gt;</sem-code>, never{" "}
                    <sem-code>&lt;hr&gt;</sem-code>.
                  </p>
                </sem-enhanced-document>
              </div>
            </section>
          {/for}
        </div>
      </main>
    </div>
    """
  end
end
