defmodule SemtextWeb.Hologram.Pages.Proposals.BrowsePage do
  @moduledoc """
  Proposals browse/search — the landing page of `proposals.semtext.dev`
  (design §4). SSR-first: search/tag/sort/pagination are plain GET form +
  link mechanics reading `?q=&tag=&sort=&after=`, so zero-JS readers get
  the full list; Hologram only hydrates the chrome.

  Route note: Hologram routes are global, so this page registers under
  the internal path `/p` (never linked) and is served at `/` by the
  proposals router's relay (`PageRelay`). On the MAIN host the
  `HostGuard` middleware 404s both paths, keeping semtext.dev's route
  space untouched.

  Public view only — hidden proposals are invisible here (404 collapse is
  the detail page's job; the list just omits them). Moderators work from
  /moderation.
  """

  use Hologram.Page

  alias Semtext.Proposals
  alias SemtextWeb.Hologram.Pages.Proposals.{Fields, Moderators}
  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Components.Proposals.ProposalCard
  alias SemtextWeb.Hologram.Layouts.ProposalsLayout
  alias SemtextWeb.Hologram.Pages.Proposals.HostGuard

  route "/p"

  layout ProposalsLayout,
    page_title: "Browse proposals — SemText Proposals",
    description: "Browse and search SemText vocabulary proposals.",
    canonical: "https://proposals.semtext.dev/"

  middleware HostGuard

  def init(_params, component, server) do
    q = query_param(server, "q")
    tag = query_param(server, "tag")
    sort = query_param(server, "sort")
    after_cursor = query_param(server, "after")

    viewer = viewer_for(server)

    case Proposals.list_proposals(
           %{
             q: blank_to_nil(q),
             tag: blank_to_nil(tag),
             sort: sort_atom(sort),
             after: blank_to_nil(after_cursor),
             limit: 20
           },
           viewer
         ) do
      {:ok, %{items: items, next_cursor: next_cursor}} ->
        put_state(component,
          q: q,
          tag: tag,
          sort: sort,
          cards: Enum.map(items, &card_map/1),
          next_cursor: next_cursor || ""
        )

      _error ->
        put_state(component, q: q, tag: tag, sort: sort, cards: [], next_cursor: "")
    end
  end

  # ── template ─────────────────────────────────────────────────

  def template do
    ~HOLO"""
    <div>
      <h1 class="text-xl font-semibold text-ink" data-cy="browse-title">Proposals</h1>
      <p class="mt-1 max-w-3xl text-sm leading-relaxed text-ink-mute">
        Additions to the SemText vocabulary, proposed by the community and
        resolved on GitHub. Submit from the
        <a href="https://semtext.dev/extend/" class="text-violet-soft hover:underline">extend wizard</a>
        or from your dashboard after signing in.
      </p>

      <form method="get" action="/" class="mt-6 flex flex-wrap items-end gap-3" data-cy="browse-search">
        <div>
          <label for="search-q" class="block font-mono text-xs text-ink-mute">Search</label>
          <input
            id="search-q"
            type="text"
            name="q"
            value={@q}
            placeholder="quantum flux"
            class="mt-1 w-64 rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
          />
        </div>
        <div>
          <label for="search-tag" class="block font-mono text-xs text-ink-mute">Tag</label>
          <input
            id="search-tag"
            type="text"
            name="tag"
            value={@tag}
            placeholder="sem-note"
            class="mt-1 w-48 rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
          />
        </div>
        <div>
          <label for="search-sort" class="block font-mono text-xs text-ink-mute">Sort</label>
          <select id="search-sort" name="sort" class="mt-1 rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink">
            <option value="newest">Newest</option>
            <option value="updated">Recently updated</option>
            <option value="discussed">Most discussed</option>
          </select>
        </div>
        <button
          type="submit"
          class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
          data-cy="search-submit"
        >
          Search
        </button>
      </form>

      {%if Enum.empty?(@cards)}
        <div class="mt-8 border border-code-border px-4 py-6 text-sm text-ink-mute" data-cy="browse-empty">
          No proposals match. Clear the filters or propose the element from
          the extend wizard.
        </div>
      {%else}
        <div class="mt-6 grid gap-4">
          {%for card <- @cards}
            <ProposalCard
              slug={card_slug(card)}
              title={card_title(card)}
              element_tag={card_tag(card)}
              summary={card_summary(card)}
              status={card_status(card)}
              meta={card_meta(card)}
            />
          {/for}
        </div>
      {/if}

      {%if @next_cursor != ""}
        {%if @q == "" and @tag == ""}
          <a href={"/?after=" <> @next_cursor} class="mt-6 inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft" data-cy="browse-next">
            Next page
          </a>
        {%else}
          <a href={next_with_filters(@q, @tag, @next_cursor)} class="mt-6 inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft" data-cy="browse-next">
            Next page
          </a>
        {/if}
      {/if}
    </div>
    """
  end

  # ── client-transpilable helpers (plain data access only) ─────

  defp card_slug(card), do: Map.get(card, :slug) || ""
  defp card_title(card), do: Map.get(card, :title) || ""
  defp card_tag(card), do: Map.get(card, :element_tag) || ""
  defp card_summary(card), do: Map.get(card, :summary) || ""
  defp card_status(card), do: Map.get(card, :status) || "submitted"
  defp card_meta(card), do: Map.get(card, :meta) || ""

  defp next_with_filters(q, tag, cursor) do
    base = "/?after=" <> cursor

    base =
      if q == "" do
        base
      else
        base <> "&q=" <> uri_escape(q)
      end

    if tag == "" do
      base
    else
      base <> "&tag=" <> uri_escape(tag)
    end
  end

  defp uri_escape(s) do
    Hologram.JS.eval("encodeURIComponent(" <> js_string(s) <> ")")
  end

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

  # ── server-side helpers (init only) ──────────────────────────

  defp card_map(p) do
    counts =
      case p.discussion_link do
        %{comment_count: n} when is_integer(n) and n > 0 ->
          Integer.to_string(n) <> " comment" <> (if n == 1, do: "", else: "s")

        _ ->
          "no comments yet"
      end

    %{
      slug: p.slug,
      title: Fields.hydrate_safe(p.title),
      element_tag: Fields.hydrate_safe(p.element_tag),
      summary: Fields.hydrate_safe(p.summary || ""),
      status: Atom.to_string(p.status),
      meta: counts <> " · updated " <> Calendar.strftime(p.updated_at, "%b %d, %Y")
    }
  end

  defp viewer_for(server) do
    Moderators.viewer(Auth.current_user(server))
  end

  defp query_param(server, key) do
    server.query[key] || ""
  end

  defp blank_to_nil(""), do: nil
  defp blank_to_nil(v), do: v

  defp sort_atom("updated"), do: :updated
  defp sort_atom("discussed"), do: :discussed
  defp sort_atom(_), do: :newest
end
