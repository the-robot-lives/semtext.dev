defmodule Semtext.Proposals.Queries do
  @moduledoc """
  Query builders behind `Semtext.Proposals` list/search/detail — visibility
  scoping, filtering, sorting and keyset (cursor) pagination.

  Cursor format: opaque `Base.url_encode64` of pipe-joined sort-key parts
  (newest/updated: `timestamp|id`; discussed: `count|timestamp|id`). Invalid
  cursors are treated as absent (browse starts over) — never an error leak.
  """

  import Ecto.Query

  alias Semtext.Proposals.DiscussionLink
  alias Semtext.Proposals.Proposal

  @default_limit 20
  @max_limit 50
  @public_statuses [:submitted, :under_review, :accepted, :merged]

  @doc "Public statuses mirror (`Semtext.Proposals.public_statuses/0`)."
  def public_statuses, do: @public_statuses

  # ── Visibility ──────────────────────────────────────────────────────────

  @doc "The anonymous-public row set: live statuses, not hidden (v1 §3.3 state matrix)."
  def public_visible(query \\ Proposal) do
    from p in query,
      where: p.status in ^@public_statuses,
      where: is_nil(p.hidden_at)
  end

  @doc """
  Viewer-scoped visibility (docs/proposals/API.md §8): anonymous → public set;
  a signed-in viewer adds their own rows (drafts/withdrawn included);
  moderators see everything.
  """
  def visible_to(query \\ Proposal, viewer)

  def visible_to(query, nil), do: public_visible(query)

  def visible_to(query, %{moderator: true}), do: query

  def visible_to(query, %{user_id: user_id}) do
    from p in query,
      where:
        (p.status in ^@public_statuses and is_nil(p.hidden_at)) or
          (p.submitter_id == ^user_id and is_nil(p.hidden_at))
  end

  @doc "True when `viewer` may see this specific row (mirror of `visible_to/2`)."
  def can_view?(%Proposal{} = p, nil) do
    p.status in @public_statuses and is_nil(p.hidden_at)
  end

  def can_view?(%Proposal{}, %{moderator: true}), do: true

  def can_view?(%Proposal{} = p, %{user_id: user_id}) do
    is_nil(p.hidden_at) and
      (p.submitter_id == user_id or p.status in @public_statuses)
  end

  # ── Filters ─────────────────────────────────────────────────────────────

  @doc """
  Apply list filters to an ALREADY visibility-scoped query (`visible_to/2`
  first). `:status` narrows within the viewer's allowed set (public callers
  can never widen it — asking only for non-public statuses yields an honest
  empty page); `:submitter_id` is honored only for the viewer themself or a
  moderator (no draft enumeration through the public API).
  """
  def filter(query, filters, viewer) do
    query
    |> scope_status(filters, viewer)
    |> scope_tag(filters)
    |> scope_search(filters)
    |> scope_submitter(filters, viewer)
    |> scope_fork_of(filters)
  end

  defp scope_status(query, filters, viewer) do
    requested =
      case Map.get(filters, :status) do
        nil -> []
        v -> List.wrap(v)
      end

    moderator? = is_map(viewer) and viewer[:moderator] == true

    cond do
      requested == [] ->
        query

      moderator? ->
        from p in query, where: p.status in ^requested

      true ->
        case Enum.filter(requested, &(&1 in @public_statuses)) do
          [] -> from p in query, where: false
          public -> from p in query, where: p.status in ^public
        end
    end
  end

  defp scope_tag(query, %{tag: tag}) when is_binary(tag) and tag != "" do
    from p in query, where: p.element_tag == ^tag
  end

  defp scope_tag(query, _), do: query

  defp scope_search(query, %{q: q}) when is_binary(q) and q != "" do
    from p in query,
      where: fragment("search @@ websearch_to_tsquery('english', ?)", ^q)
  end

  defp scope_search(query, _), do: query

  defp scope_submitter(query, %{submitter_id: uid}, viewer) when is_binary(uid) do
    moderator? = is_map(viewer) and viewer[:moderator] == true
    self? = is_map(viewer) and viewer[:user_id] == uid

    if moderator? or self? do
      from p in query, where: p.submitter_id == ^uid
    else
      query
    end
  end

  defp scope_submitter(query, _filters, _viewer), do: query

  defp scope_fork_of(query, %{fork_of: slug}) when is_binary(slug) and slug != "" do
    case Semtext.Repo.one(from p in Proposal, where: p.slug == ^slug, select: p.id) do
      nil -> from p in query, where: false
      pid -> from p in query, where: p.forked_from_proposal_id == ^pid
    end
  end

  defp scope_fork_of(query, _), do: query

  # ── Sort + cursor keyset ────────────────────────────────────────────────

  @doc """
  Apply sort (`:newest` default) + cursor keyset. Returns `{query, limit}` —
  fetch `limit + 1` rows and hand them to `page/3`.
  """
  def paginate(query, filters) do
    sort = normalize_sort(filters[:sort])
    limit = clamp_limit(filters[:limit])
    cursor = decode_cursor(filters[:after])

    q =
      case sort do
        :discussed ->
          query
          |> order_discussed()
          |> cursor_discussed(cursor)

        :updated ->
          query
          |> order_key(:updated_at)
          |> cursor_key(:updated_at, cursor)

        _newest ->
          query
          |> order_key(:inserted_at)
          |> cursor_key(:inserted_at, cursor)
      end

    {q, limit}
  end

  @doc "Normalize a sort param (`binary` or `atom`) to the internal sort atom."
  def normalize_sort(nil), do: :newest

  def normalize_sort(s) when s in [:newest, :updated, :discussed], do: s

  def normalize_sort(s) when is_binary(s) do
    case s do
      "newest" -> :newest
      "updated" -> :updated
      "discussed" -> :discussed
      _ -> :newest
    end
  end

  def normalize_sort(_), do: :newest

  defp clamp_limit(nil), do: @default_limit
  defp clamp_limit(n) when is_integer(n) and n > 0, do: min(n, @max_limit)
  defp clamp_limit(_), do: @default_limit

  defp order_discussed(query) do
    from p in query,
      left_join: dl in DiscussionLink,
      on: dl.proposal_id == p.id,
      order_by: [
        desc: fragment("coalesce(?, 0)", dl.comment_count),
        desc: p.updated_at,
        desc: p.id
      ]
  end

  defp order_key(query, field) when field == :updated_at do
    from p in query, order_by: [desc: p.updated_at, desc: p.id]
  end

  defp order_key(query, :inserted_at) do
    from p in query, order_by: [desc: p.inserted_at, desc: p.id]
  end

  defp cursor_discussed(query, [count, ts, id]) do
    with {:ok, dt, _offset} <- DateTime.from_iso8601(ts),
         {n, ""} <- Integer.parse(count) do
      from p in query,
        left_join: dl in DiscussionLink,
        on: dl.proposal_id == p.id,
        where:
          fragment("coalesce(?, 0)", dl.comment_count) < ^n or
            (fragment("coalesce(?, 0)", dl.comment_count) == ^n and
               (p.updated_at < ^dt or (p.updated_at == ^dt and p.id < ^id)))
    else
      _ -> query
    end
  end

  defp cursor_discussed(query, _cursor), do: query

  defp cursor_key(query, :updated_at, [ts, id]) do
    case DateTime.from_iso8601(ts) do
      {:ok, dt, _offset} ->
        from p in query, where: p.updated_at < ^dt or (p.updated_at == ^dt and p.id < ^id)

      _ ->
        query
    end
  end

  defp cursor_key(query, :inserted_at, [ts, id]) do
    case DateTime.from_iso8601(ts) do
      {:ok, dt, _offset} ->
        from p in query, where: p.inserted_at < ^dt or (p.inserted_at == ^dt and p.id < ^id)

      _ ->
        query
    end
  end

  defp cursor_key(query, _field, _cursor), do: query

  # ── Page envelope ───────────────────────────────────────────────────────

  @doc """
  Page envelope from items fetched with `paginate/1`'s `limit + 1`: the first
  `limit` are the page; row `limit + 1` (if any) yields `next_cursor`.
  """
  def page(items, limit, sort) do
    {page_items, rest} = Enum.split(items, limit)

    case rest do
      [] ->
        %{items: page_items, next_cursor: nil, has_more: false}

      _rest when page_items != [] ->
        # Cursor = key of the LAST PAGE item, so the next fetch starts at the
        # first row after the page (not the first fetched-beyond row).
        %{
          items: page_items,
          next_cursor: next_cursor(normalize_sort(sort), List.last(page_items)),
          has_more: true
        }
    end
  end

  @doc "Cursor for the row AFTER the page, under `sort`."
  def next_cursor(:discussed, %Proposal{} = p) do
    count = (p.discussion_link && p.discussion_link.comment_count) || 0
    encode_cursor([Integer.to_string(count), DateTime.to_iso8601(p.updated_at), p.id])
  end

  def next_cursor(:updated, %Proposal{} = p),
    do: encode_cursor([DateTime.to_iso8601(p.updated_at), p.id])

  def next_cursor(sort, %Proposal{} = p) when sort in [:newest],
    do: encode_cursor([DateTime.to_iso8601(p.inserted_at), p.id])

  # ── Cursor codecs ───────────────────────────────────────────────────────

  defp encode_cursor(parts) do
    parts
    |> Enum.join("|")
    |> Base.url_encode64(padding: false)
  end

  defp decode_cursor(nil), do: nil

  defp decode_cursor(cursor) when is_binary(cursor) do
    case Base.url_decode64(cursor, padding: false) do
      {:ok, bin} -> String.split(bin, "|")
      :error -> nil
    end
  end

  defp decode_cursor(_), do: nil
end
