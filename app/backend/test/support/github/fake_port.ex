defmodule Semtext.Github.FakePort do
  @moduledoc """
  Test double for `Semtext.Github.Port` (test env only).

  State lives in an ETS table created per test module; helpers seed proposal
  targets and inspect link state. Point the port at it per test:

      Application.put_env(:semtext, Semtext.Github, Keyword.merge(base, proposals_port: __MODULE__.FakePort))

  (`Semtext.Github.FakePortSetup` does this for you — see `use` below.)
  """

  @behaviour Semtext.Github.Port

  @table :semtext_github_fake_port

  @impl true
  def get_sync_target(proposal_id) do
    ensure()

    case :ets.lookup(@table, {:target, proposal_id}) do
      [{_, target}] -> {:ok, target}
      [] -> {:error, :not_found}
    end
  end

  @impl true
  def get_discussion_link(proposal_id) do
    ensure()
    {:ok, link(proposal_id)}
  end

  @impl true
  def mark_discussion_pending(proposal_id) do
    put_link(proposal_id, fn link -> link |> Map.put(:state, :pending) |> Map.put(:last_error, nil) end)
  end

  @impl true
  def put_discussion_link(proposal_id, created) do
    put_link(proposal_id, fn link ->
      link
      |> Map.put(:state, :ok)
      |> Map.put(:last_error, nil)
      |> Map.put(:node_id, created.node_id)
      |> Map.put(:discussion_number, created.discussion_number)
      |> Map.put(:url, created.url)
    end)
  end

  @impl true
  def mark_discussion_failed(proposal_id, reason) do
    put_link(proposal_id, fn link -> link |> Map.put(:state, :failed) |> Map.put(:last_error, to_string(reason)) end)
  end

  @impl true
  def mark_discussion_removed(proposal_id) do
    put_link(proposal_id, fn link -> link |> Map.put(:state, :removed) end)
  end

  @impl true
  def update_discussion_stats(proposal_id, stats) do
    put_link(proposal_id, fn link ->
      link
      |> Map.put(:comment_count, stats.comment_count)
      |> Map.put(:reactions, stats.reactions)
      |> Map.put(:last_synced_at, stats.last_synced_at)
    end)
  end

  @impl true
  def find_discussion_by_node(node_id) do
    ensure()

    {:ok,
     @table
     |> :ets.tab2list()
     |> Enum.find_value(fn
       {{:link, _id}, link} -> if link[:node_id] == node_id, do: link, else: nil
       _target_row -> nil
     end)}
  end

  @impl true
  def find_discussion_by_number(repo, number) do
    ensure()

    {:ok,
     @table
     |> :ets.tab2list()
     |> Enum.find_value(fn
       {{:link, _id}, link} ->
         if link[:discussion_number] == number and (link[:repo] == repo or is_nil(link[:repo])),
           do: link,
           else: nil

       _target_row ->
         nil
     end)}
  end

  # -- helpers ------------------------------------------------------------

  @doc "Seeds a proposal the port knows about (no link yet)."
  def seed_target(proposal_id, overrides \\ %{}) do
    ensure()

    target =
      Map.merge(
        %{
          proposal_id: to_string(proposal_id),
          slug: "sem-example",
          title: "An example proposal",
          element_tag: "sem-example",
          summary: "Does something useful.",
          motivation: "Because reasons.",
          options: [%{name: "kind", meaning: "inline | referenced"}],
          example: "<sem-example></sem-example>"
        },
        overrides
      )

    :ets.insert(@table, {{:target, to_string(proposal_id)}, target})
    :ok
  end

  @doc "The stored link for a proposal (nil when nothing was ever written)."
  def link(proposal_id) do
    ensure()

    case :ets.lookup(@table, {:link, to_string(proposal_id)}) do
      [{_, link}] -> link
      [] -> nil
    end
  end

  @doc "Wipes all port state."
  def reset do
    ensure()
    :ets.delete_all_objects(@table)
    :ok
  end

  defp put_link(proposal_id, fun) do
    ensure()
    id = to_string(proposal_id)
    base = link(id) || %{proposal_id: id}
    :ets.insert(@table, {{:link, id}, fun.(base)})
    :ok
  end

  defp ensure do
    if :ets.whereis(@table) == :undefined do
      :ets.new(@table, [:named_table, :set, :public])
    end

    :ok
  rescue
    ArgumentError -> :ok
  end
end

defmodule Semtext.Github.FakePortSetup do
  @moduledoc """
  `use` helper for github-sync tests: points `Semtext.Github.port/0` at
  `Semtext.Github.FakePort` (merged into the shipped config, never replacing
  it), resets port state, and restores config on exit.

      use Semtext.Github.FakePortSetup
  """

  defmacro __using__(_) do
    quote do
      setup do
        base = Application.get_env(:semtext, Semtext.Github, [])
        Application.put_env(:semtext, Semtext.Github, Keyword.put(base, :proposals_port, Semtext.Github.FakePort))
        Semtext.Github.FakePort.reset()

        on_exit(fn ->
          if base == [] do
            Application.delete_env(:semtext, Semtext.Github)
          else
            Application.put_env(:semtext, Semtext.Github, base)
          end
        end)

        :ok
      end
    end
  end
end
