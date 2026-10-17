defmodule Semtext.Github.Adapters.MemoryTest do
  @moduledoc "The ETS interim/dev port: full Port lifecycle, unknown proposals, finders."

  use ExUnit.Case, async: false

  alias Semtext.Github.Adapters.Memory

  @id "22222222-2222-2222-2222-222222222222"

  setup do
    Memory.reset()
    on_exit(fn -> Memory.reset() end)
    :ok
  end

  test "unknown proposal: no target, nil link, lifecycle events still recorded" do
    assert {:error, :not_found} = Memory.get_sync_target(@id)
    assert {:ok, nil} = Memory.get_discussion_link(@id)

    :ok = Memory.mark_discussion_pending(@id)
    assert {:ok, %{state: :pending}} = Memory.get_discussion_link(@id)
  end

  test "full lifecycle: seed → pending → ok(+link) → stats → failed → removed" do
    :ok =
      Memory.seed_target(%{
        proposal_id: @id,
        slug: "sem-datalist",
        title: "A datalist element",
        element_tag: "sem-datalist",
        summary: "s",
        motivation: "m",
        options: [],
        example: "e"
      })

    assert {:ok, %{slug: "sem-datalist"}} = Memory.get_sync_target(@id)

    :ok = Memory.mark_discussion_pending(@id)
    :ok = Memory.put_discussion_link(@id, %{node_id: "D_n", discussion_number: 3, url: "https://github.com/x/y/discussions/3"})
    assert {:ok, %{state: :ok, node_id: "D_n", discussion_number: 3}} = Memory.get_discussion_link(@id)

    now = DateTime.utc_now()
    :ok = Memory.update_discussion_stats(@id, %{comment_count: 2, reactions: %{"THUMBS_UP" => 1}, last_synced_at: now})
    assert {:ok, %{comment_count: 2, reactions: %{"THUMBS_UP" => 1}}} = Memory.get_discussion_link(@id)

    :ok = Memory.mark_discussion_failed(@id, "boom")
    assert {:ok, %{state: :failed, last_error: "boom"}} = Memory.get_discussion_link(@id)

    :ok = Memory.mark_discussion_removed(@id)
    assert {:ok, %{state: :removed}} = Memory.get_discussion_link(@id)
  end

  test "finders resolve by node id and (repo, number)" do
    id = @id
    :ok = Memory.put_discussion_link(@id, %{node_id: "D_abc", discussion_number: 9, url: "u"})

    assert {:ok, %{proposal_id: ^id}} = Memory.find_discussion_by_node("D_abc")
    assert {:ok, nil} = Memory.find_discussion_by_node("D_missing")

    assert {:ok, %{proposal_id: ^id}} = Memory.find_discussion_by_number("noizu-labs-ml/npl-enhanced-content", 9)
    assert {:ok, nil} = Memory.find_discussion_by_number("noizu-labs-ml/npl-enhanced-content", 10)
  end

  test "put_discussion_link clears a prior failure state" do
    :ok = Memory.mark_discussion_failed(@id, "boom")
    :ok = Memory.put_discussion_link(@id, %{node_id: "D_1", discussion_number: 1, url: "u"})

    assert {:ok, %{state: :ok, last_error: nil}} = Memory.get_discussion_link(@id)
  end
end
