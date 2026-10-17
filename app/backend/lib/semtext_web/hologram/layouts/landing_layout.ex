defmodule SemtextWeb.Hologram.Layouts.LandingLayout do
  @moduledoc """
  Landing shell (port of the Next.js root layout + Header + Footer).

  Owns the site chrome for the landing page only: head metadata (the same
  title/description/OG block as web/app/layout.tsx), the shipped element
  vocabulary + minimal-tech-light theme stylesheets, the skip link, the
  sticky header (brand, primary nav, search-as-link fallback, mobile menu),
  the footer token rail + links, and the landing script trio
  (`__semJsOff` + deferred SemText fallback + landing bootstrap).

  port-docs later unifies header/footer into shared components when it
  lands the docs shell; until then this layout is the landing-only copy of
  that chrome (deliberate duplication, see the port-landing report).

  Mobile menu state lives in its own HeaderMenu component; this layout
  carries no client state of its own.
  """
  use Hologram.Component

  alias SemtextWeb.Hologram.Components.AnnotateWidget
  alias SemtextWeb.Hologram.Components.Site.Footer

  alias SemtextWeb.Hologram.Components.Landing.HeaderMenu

  prop :page_title, :string, default: "SemText — one XHTML file, in place of Markdown"

  def template do
    ~HOLO"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{@page_title}</title>
        <meta
          name="description"
          content="SemText: one XHTML file that models read and write instead of Markdown. Readable as text as-is; opened in a browser, the same markup becomes working web components. Part of The Robot Lives portfolio."
        />
        <meta name="application-name" content="semtext" />
        <meta name="author" content="The Robot Lives" />
        <meta
          name="keywords"
          content="semtext, XHTML, Markdown replacement, AI prompts, structured documents, web components, Lit, The Robot Lives"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://semtext.dev/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="semtext" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content="https://semtext.dev/" />
        <meta property="og:title" content="SemText — one XHTML file, in place of Markdown" />
        <meta
          property="og:description"
          content="SemText: one XHTML file that models read and write instead of Markdown. Readable as text as-is; opened in a browser, the same markup becomes working web components. Part of The Robot Lives portfolio."
        />
        <meta
          property="og:image"
          content="https://semtext.dev/og.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="675" />
        <meta property="og:image:alt" content="SemText — one XHTML file, in place of Markdown." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SemText — one XHTML file, in place of Markdown" />
        <meta
          name="twitter:description"
          content="SemText: one XHTML file that models read and write instead of Markdown. Readable as text as-is; opened in a browser, the same markup becomes working web components. Part of The Robot Lives portfolio."
        />
        <meta name="twitter:image" content="https://semtext.dev/og.jpg" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="stylesheet" href="/css/landing.css" />
        <link rel="stylesheet" href="/semtext/themes/_vocabulary.css" />
        <link rel="stylesheet" href="/semtext/themes/minimal-tech-light.css" />
        <script src="/js/keep-location.js"></script>
        <Hologram.UI.Runtime />
        <script>
          window.__semJsOff = true;
        </script>
        <script defer="defer" src="/semtext/semtext-fallback.js"></script>
        <script defer="defer" src="/js/landing-bootstrap.js"></script>
      </head>
      <body class="docs-bg min-h-screen antialiased">
        <a class="skip-link" href="#main">Skip to docs</a>
        <header class="sticky top-0 z-40 border-b border-white/10 bg-slateink/85 backdrop-blur-md">
          <div class="mx-auto flex h-16 max-w-docs items-center justify-between gap-4 px-4 sm:px-6">
            <a
              href="/#main"
              class="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-tight text-ink sm:text-base"
            >
              <span class="brand-mark" aria-hidden="true">∑</span>
              <span>
                Sem<span class="text-violet-soft">Text</span>
              </span>
            </a>
            <nav aria-label="Primary" class="flex items-center gap-4 text-sm sm:gap-6">
              <a
                href="/#try"
                class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex"
              >
                See it work
              </a>
              <a
                href="/reference/"
                class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex"
              >
                Reference
              </a>
              <a
                href="/spec/semtext.html"
                class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex"
              >
                Spec
              </a>
              <a
                href="/#start"
                class="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex"
              >
                Get started
              </a>
              <a
                href="/reference/"
                class="hidden items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-ink-mute hover:border-white/40 hover:text-ink sm:flex"
                aria-label="Search the docs (opens the reference)"
              >
                <span aria-hidden="true">Search</span>
                <kbd
                  aria-hidden="true"
                  class="rounded border border-white/20 px-1 font-mono text-[0.65rem] text-ink-faint"
                >
                  /
                </kbd>
              </a>
              <a
                href="https://therobotlives.com"
                class="hidden min-h-11 items-center font-medium text-violet-soft underline-offset-4 hover:underline sm:inline-flex"
              >
                The Robot Lives
              </a>
              <HeaderMenu cid="header_menu" />
            </nav>
          </div>
        </header>
        <slot />
        <Footer />
        <AnnotateWidget />
      </body>
    </html>
    """
  end
end
