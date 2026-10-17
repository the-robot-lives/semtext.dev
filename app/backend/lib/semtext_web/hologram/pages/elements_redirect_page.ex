defmodule SemtextWeb.Hologram.Pages.ElementsRedirectPage do
  @moduledoc """
  /elements — port of the Next site's `app/elements/page.tsx`: the retired
  elements-glossary route. Its entries live on /reference now; this route
  remains only as a static redirect for old links — a meta refresh plus a
  manual link, so it works from any host (nginx also 301s the path; the
  page is the fallback for hosts that cannot). The `<meta http-equiv>`
  renders in the body exactly as the Next page ships it (React 19 hoists
  it into `<head>`; browsers honor it from either place).
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/elements"

  layout SiteLayout,
    page_title: "Redirecting to the tag reference — SemText",
    description: "The elements glossary has moved to the tag reference at /reference/.",
    canonical: "https://semtext.dev/reference/"

  def init(_params, component, _server), do: component

  def template do
    ~HOLO"""
    <main id="main" class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <meta http-equiv="refresh" content="0; url=/reference/" />
      <p class="g-eyebrow">Reference</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        The elements moved
      </h1>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        The elements glossary is now part of the{" "}
        <a href="/reference/" class="font-mono text-violet-soft underline-offset-4 hover:underline">
          tag reference
        </a>
        . Redirecting…
      </p>
    </main>
    """
  end
end
