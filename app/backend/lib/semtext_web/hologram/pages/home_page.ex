defmodule SemtextWeb.Hologram.Pages.HomePage do
  @moduledoc """
  P0 smoke page at `/` — proves the hydrated Hologram app serves the site root.

  Placeholder for the real landing page: the port-landing lane replaces this
  template with the Next.js landing sections at parity (design v2 §2.1). The
  route, layout, and module name stay stable so ingress cutover rules do not
  change.
  """
  use Hologram.Page

  alias SemtextWeb.Hologram.Layouts.MainLayout

  route "/"
  layout MainLayout, page_title: "semtext.dev (Hologram)"

  def init(_params, component, _server) do
    put_state(component, :ready, true)
  end

  def template do
    ~HOLO"""
    <main class="content">
      <h1>semtext.dev (Hologram)</h1>
      <p>
        Elixir replatform skeleton — hydrated from the house Hologram starter.
        The Next.js site is still the live origin; routes are cut over
        one-by-one behind this app (design v2 §2.6).
      </p>
    </main>
    """
  end
end
