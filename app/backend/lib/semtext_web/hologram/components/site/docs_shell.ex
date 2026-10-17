defmodule SemtextWeb.Hologram.Components.Site.DocsShell do
  @moduledoc """
  The docs shell — sticky sidebar + main column (+ optional examples
  rail), port of `DocsShell` in the Next site's `components/docs-shell.tsx`.

  Everything arrives as props (computed server-side by the page's init
  and passed down), because Hologram re-renders templates on the client
  and the `SemtextWeb.Docs.*` data modules are server-only. `groups` is
  the nav inventory (see `SemtextWeb.Docs.NavGroups.groups/0`), `sections`
  the page's own "On this page" anchors, `examples` the optional right
  rail of pre-rendered SemText blocks (`%{title: _, href: _, html: _}`).

  `data_ref` on a sidebar link is the string the reference index's filter
  box matches against (port-reference lane's page); links without it are
  never hidden by that filter — same contract as upstream.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Site.Sem

  prop :active, :string, required: true
  prop :groups, :list, required: true
  prop :sections, :list, default: []
  prop :examples, :list, default: []

  def nav_link_class(key, active) do
    if key == active do
      "g-nav-link is-active"
    else
      "g-nav-link"
    end
  end

  def template do
    ~HOLO"""
    <div class="mx-auto flex w-full max-w-docs gap-10 px-4 pb-24 pt-12 sm:px-6">
      <aside class="hidden w-52 shrink-0 lg:block">
        <nav aria-label="Docs" class="docs-nav sticky top-24 flex flex-col gap-7">
          {%for group <- @groups}
            <div>
              <p class="g-nav-title">{group.title}</p>
              <ul class="mt-1.5 flex flex-col" role="list">
                {%for item <- group.items}
                  <li>
                    <a
                      href={item.href}
                      data-ref={item.data_ref}
                      aria-current={if item.key == @active do "page" else nil end}
                      class={nav_link_class(item.key, @active)}
                    >
                      {item.label}
                    </a>
                  </li>
                {/for}
              </ul>
            </div>
          {/for}
          {%if @sections != []}
            <div>
              <p class="g-nav-title">On this page</p>
              <ul class="mt-1.5 flex flex-col" role="list">
                {%for s <- @sections}
                  <li>
                    <a href={"#" <> s.id} class="g-nav-link">{s.label}</a>
                  </li>
                {/for}
              </ul>
            </div>
          {/if}
        </nav>
      </aside>
      <div class="min-w-0 flex-1">
        <slot />
      </div>
      {%if @examples != []}
        <aside aria-label="Examples" class="mt-14 w-full shrink-0 border-t border-white/10 pt-10 lg:mt-0 lg:w-72 lg:border-t-0 lg:pt-0">
          <div class="flex flex-col gap-6 lg:sticky lg:top-24">
            {%for ex <- @examples}
              <div class="sem-rail-item flex flex-col gap-2">
                {%if ex.title != ""}
                  <p class="g-nav-title">{ex.title}</p>
                {/if}
                <Sem html={ex.html} />
                {%if ex.href != ""}
                  <a href={ex.href} class="g-nav-link">Open page →</a>
                {/if}
              </div>
            {/for}
          </div>
        </aside>
      {/if}
    </div>
    """
  end
end
