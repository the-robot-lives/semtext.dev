defmodule SemtextWeb.Hologram.Components.Site.HeaderSearch do
  @moduledoc """
  The header search box — port of the Next site's `components/search.tsx`.

  A Hologram combobox over the build-time index in
  `SemtextWeb.Docs.SearchIndex` (every SemText/NPL tag plus the CLI
  commands). The full index is computed server-side at init
  (`SearchIndex.combobox_index/0`) and shipped as component state; every
  keystroke filters client-side over plain data — no network, no service,
  same as the Next site's in-browser filter.

  ARIA 1.2 combobox pattern, as upstream: the input owns a collapsed/
  expanded listbox (aria-expanded / aria-controls), options carry
  role="option" + aria-selected inside role="group" containers, the
  active row is referenced with aria-activedescendant — focus never
  leaves the input while arrowing. Enter opens the active row (server
  command redirect, so arbitrary /reference/<tag>/ paths work); Escape
  closes, then clears. Rows are plain anchors with native hrefs, so the
  click path needs no JS.

  Deliberate deviations from the Next version: no outside-pointerdown
  close (navigation/Escape closes; noted in the lane report), and the
  "/"-anywhere shortcut lives in /js/site-chrome.js (plain DOM window
  keydown that skips inputs).

  Zero-JS: without scripts the combobox is hidden (`.no-js` on <html>,
  gated in site.css) and a plain "Search" link to /reference/ shows in
  the same slot — no layout shift, discoverable fallback.
  """

  use Hologram.Component

  @max_per_group 8
  @max_rows 24

  def init(_props, component, _server) do
    index = SemtextWeb.Docs.SearchIndex.combobox_index()

    put_state(component,
      index: index.rows,
      index_count: index.count,
      query: "",
      shown: "",
      open: false,
      active: -1,
      active_id: nil,
      rows: [],
      groups: []
    )
  end

  # — Actions (client) ————————————————————————————————

  def action(:update_query, params, component) do
    query = params.event.value
    rows = filter(component.state.index, query)

    component
    |> put_state(query: query, open: true)
    |> put_rows(rows)
  end

  def action(:open_list, _params, component) do
    put_state(component, :open, true)
  end

  def action(:close_list, _params, component) do
    put_state(component, :open, false)
  end

  def action(:arrow_down, _params, component) do
    if component.state.open and component.state.rows != [] do
      set_active(component, min(length(component.state.rows) - 1, component.state.active + 1))
    else
      # Mirrors upstream: first ArrowDown opens the list at row 0.
      set_active(put_state(component, :open, true), 0)
    end
  end

  def action(:arrow_up, _params, component) do
    if component.state.open and component.state.rows != [] do
      set_active(component, max(0, component.state.active - 1))
    else
      component
    end
  end

  def action(:move_home, _params, component) do
    if component.state.open and component.state.rows != [] do
      set_active(component, 0)
    else
      component
    end
  end

  def action(:move_end, _params, component) do
    if component.state.open and component.state.rows != [] do
      set_active(component, length(component.state.rows) - 1)
    else
      component
    end
  end

  def action(:hover_row, params, component) do
    set_active(component, params.index)
  end

  def action(:escape, _params, component) do
    if component.state.open do
      put_state(component, :open, false)
    else
      put_state(component, :query, "")
    end
  end

  def action(:open_active, _params, component) do
    rows = component.state.rows
    active = component.state.active

    if component.state.open and active >= 0 and active < length(rows) do
      row = Enum.at(rows, active)
      put_command(component, :open_entry, path: row.href)
    else
      component
    end
  end

  # — Commands (server) ———————————————————————————————

  def command(:open_entry, params, server) do
    Hologram.Server.put_redirect(server, params.path)
  end

  # — Client-side derivation (plain data ops only) ————————————

  defp filter(index_rows, query) do
    q = String.downcase(String.trim(query))

    if q == "" do
      []
    else
      cap_by_group(only_matching(index_rows, q), [], %{})
    end
  end

  defp only_matching(rows, q) do
    Enum.filter(rows, fn row ->
      String.contains?(row.haystack, q)
    end)
  end

  defp cap_by_group([], acc, _counts) do
    acc
  end

  defp cap_by_group(rows, acc, counts) do
    row = hd(rows)
    rest = tl(rows)
    per = Map.get(counts, row.group, 0)

    cond do
      per >= @max_per_group ->
        cap_by_group(rest, acc, counts)

      length(acc) >= @max_rows ->
        acc

      true ->
        cap_by_group(rest, acc ++ [row], Map.put(counts, row.group, per + 1))
    end
  end

  defp group_rows([], acc) do
    acc
  end

  defp group_rows(rows, acc) do
    label = hd(rows).group
    items = Enum.filter(rows, fn r -> r.group == label end)
    rest = Enum.filter(rows, fn r -> r.group != label end)
    gid = hd(items).group_id

    group_rows(rest, acc ++ [%{id: gid, label: label, items: items}])
  end

  defp put_rows(component, rows) do
    component
    |> put_state(rows: rows)
    |> put_state(groups: group_rows(rows, []))
    |> put_state(shown: String.trim(component.state.query))
    |> put_state(active: -1)
    |> put_state(active_id: nil)
  end

  defp set_active(component, active) do
    rows = component.state.rows

    active_id =
      if active >= 0 and active < length(rows) do
        row = Enum.at(rows, active)
        row.id
      else
        nil
      end

    put_state(component, active: active, active_id: active_id)
  end

  # — Template (renders from state only) ——————————————————————

  def row_class(active_id, row_id) do
    if active_id == row_id do
      "flex flex-col gap-0.5 px-4 py-2 text-sm bg-violet/20 text-ink"
    else
      "flex flex-col gap-0.5 px-4 py-2 text-sm text-ink-mute hover:bg-white/5"
    end
  end

  def template do
    ~HOLO"""
    <div class="sem-search relative hidden sm:block">
      <div class="sem-search-js relative" $click_outside="close_list">
        <label for="header-search-input" class="sr-only">Search tags and CLI commands</label>
        <input
          id="header-search-input"
          type="text"
          role="combobox"
          autocomplete="off"
          aria-expanded={if @open do "true" else "false" end}
          aria-controls="header-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={@active_id}
          placeholder="Search tags & CLI — press /"
          value={@query}
          $change="update_query"
          $focus="open_list"
          $key_down.arrow_down.prevent_default="arrow_down"
          $key_down.arrow_up.prevent_default="arrow_up"
          $key_down.home.prevent_default="move_home"
          $key_down.end.prevent_default="move_end"
          $key_down.enter.prevent_default="open_active"
          $key_down.escape="escape"
          class="w-44 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-ink placeholder:text-ink-faint focus:w-56 focus:border-white/40 focus:outline-none md:w-56 md:focus:w-72"
        />
        {%if @open and @shown != ""}
          <div class="sem-search-popup absolute right-0 top-full z-50 mt-2 w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-code-border bg-slateink-lift shadow-xl">
            {%if @rows == []}
              <p class="px-4 py-3 text-sm text-ink-mute" role="status">
                Nothing matches &ldquo;{@shown}&rdquo;. Tag names, summaries, options and CLI commands are all searched.
              </p>
            {%else}
              <ul id="header-search-listbox" role="listbox" aria-labelledby="header-search-input" class="sem-search-list max-h-[60vh] overflow-y-auto py-1">
                {%for g <- @groups}
                  <li role="group" aria-labelledby={g.id}>
                    <p id={g.id} class="px-4 pb-1 pt-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-faint">
                      {g.label}
                    </p>
                    <ul class="flex flex-col" role="presentation">
                      {%for row <- g.items}
                        <li role="presentation">
                          <a
                            role="option"
                            id={row.id}
                            href={row.href}
                            aria-selected={if @active_id == row.id do "true" else "false" end}
                            $mouse_move={action: :hover_row, index: row.index}
                            class={row_class(@active_id, row.id)}
                          >
                            <code class="font-mono text-[0.82rem] text-ink">{row.title}</code>
                            <span class="line-clamp-2 text-[0.8rem] leading-5">{row.hint}</span>
                          </a>
                        </li>
                      {/for}
                    </ul>
                  </li>
                {/for}
              </ul>
            {/if}
            <p class="border-t border-white/10 px-4 py-1.5 font-mono text-[0.62rem] text-ink-faint">
              {@index_count} entries indexed · ↑ ↓ move · Enter opens · Esc closes
            </p>
          </div>
        {/if}
      </div>
    </div>
    """
  end
end
