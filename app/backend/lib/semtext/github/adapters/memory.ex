defmodule Semtext.Github.Adapters.Memory do
  @moduledoc """
  In-memory `Semtext.Github.Port` (ETS) — the P1 interim/dev adapter.

  Lets the whole sync flow run (and demo) before LANE=data's context lands in
  this branch, and gives `mix phx.server` sessions a proposals port without a
  schema. NOT durable: state dies with the VM. Select it with:

      config :semtext, Semtext.Github, proposals_port: Semtext.Github.Adapters.Memory

  Seeding for dev/demo:

      Semtext.Github.Adapters.Memory.seed_target(%{
        proposal_id: "…", slug: "sem-datalist", title: "…",
        element_tag: "sem-datalist", summary: "…", motivation: "…",
        options: [%{name: "…", meaning: "…"}], example: "…"
      })
  """

  @behaviour Semtext.Github.Port

  @table :semtext_github_memory_port

  # -- Port callbacks -----------------------------------------------------

  @impl true
  def get_sync_target(proposal_id) do
    ensure_table()

    case row(proposal_id) do
      {^proposal_id, %{target: target}} -> {:ok, target}
      nil -> {:error, :not_found}
    end
  end

  @impl true
  def get_discussion_link(proposal_id) do
    ensure_table()

    case row(proposal_id) do
      {^proposal_id, %{link: link}} -> {:ok, link}
      nil -> {:ok, nil}
    end
  end

  @impl true
  def mark_discussion_pending(proposal_id) do
    update_link(proposal_id, fn link ->
      link
      |> Map.put(:state, :pending)
      |> Map.put(:last_error, nil)
    end)
  end

  @impl true
  def put_discussion_link(proposal_id, %{node_id: node_id} = created) do
    update_link(proposal_id, fn link ->
      link
      |> Map.put(:state, :ok)
      |> Map.put(:last_error, nil)
      |> Map.put(:node_id, node_id)
      |> Map.put(:discussion_number, Map.fetch!(created, :discussion_number))
      |> Map.put(:url, Map.fetch!(created, :url))
      |> Map.put(:repo, Map.get(created, :repo, default_repo()))
      |> Map.put(:state_changed_at, DateTime.utc_now())
    end)
  end

  @impl true
  def mark_discussion_failed(proposal_id, reason) do
    update_link(proposal_id, fn link ->
      link
      |> Map.put(:state, :failed)
      |> Map.put(:last_error, to_string(reason))
      |> Map.put(:state_changed_at, DateTime.utc_now())
    end)
  end

  @impl true
  def mark_discussion_removed(proposal_id) do
    update_link(proposal_id, fn link ->
      link
      |> Map.put(:state, :removed)
      |> Map.put(:last_error, "discussion removed on GitHub")
      |> Map.put(:state_changed_at, DateTime.utc_now())
    end)
  end

  @impl true
  def update_discussion_stats(proposal_id, stats) do
    update_link(proposal_id, fn link ->
      link
      |> Map.put(:comment_count, Map.fetch!(stats, :comment_count))
      |> Map.put(:reactions, Map.fetch!(stats, :reactions))
      |> Map.put(:last_synced_at, Map.fetch!(stats, :last_synced_at))
    end)
  end

  @impl true
  def find_discussion_by_node(node_id) do
    ensure_table()
    {:ok, scan(fn {_, %{link: link}} -> is_map(link) and link[:node_id] == node_id end)}
  end

  @impl true
  def find_discussion_by_number(repo, number) do
    ensure_table()

    {:ok,
     scan(fn {_, %{link: link}} ->
       is_map(link) and link[:discussion_number] == number and (link[:repo] == repo or repo == default_repo())
     end)}
  end

  # -- dev/test helpers ---------------------------------------------------

  @doc "Inserts (or replaces) a proposal's sync target; the link starts unset."
  @spec seed_target(Semtext.Github.Port.sync_target()) :: :ok
  def seed_target(target) do
    ensure_table()
    :ets.insert(@table, {Map.fetch!(target, :proposal_id), %{target: target, link: nil}})
    :ok
  end

  @doc "Drops ALL memory-port rows (dev/demo/test only)."
  @spec reset() :: :ok
  def reset do
    ensure_table()
    :ets.delete_all_objects(@table)
    :ok
  end

  @doc "Reads one row for inspection: `{proposal_id, %{target:, link:}}` or nil."
  @spec row(term()) :: {term(), %{target: map(), link: map() | nil}} | nil
  def row(proposal_id) do
    ensure_table()
    case :ets.lookup(@table, proposal_id) do
      [row] -> row
      [] -> nil
    end
  end

  # -- plumbing -----------------------------------------------------------

  defp update_link(proposal_id, fun) do
    ensure_table()

    case row(proposal_id) do
      nil ->
        # Link lifecycle events for an unknown proposal: keep a link-only row
        # (the target may arrive later in demo flows).
        :ets.insert(@table, {proposal_id, %{target: nil, link: fun.(%{proposal_id: proposal_id})}})
        :ok

      {^proposal_id, %{target: target, link: link}} ->
        base = if is_map(link), do: link, else: %{proposal_id: proposal_id}
        :ets.insert(@table, {proposal_id, %{target: target, link: fun.(base)}})
        :ok
    end
  end

  defp scan(pred) do
    @table
    |> :ets.tab2list()
    |> Enum.find_value(fn {_pid, %{link: link}} = row ->
      if pred.(row), do: link, else: nil
    end)
  end

  defp ensure_table do
    if :ets.whereis(@table) == :undefined do
      :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    end

    :ok
  rescue
    ArgumentError -> :ok
  end

  defp default_repo, do: "#{Semtext.Github.cfg(:repository_owner, "noizu-labs-ml")}/#{Semtext.Github.cfg(:repository_name, "npl-enhanced-content")}"
end
