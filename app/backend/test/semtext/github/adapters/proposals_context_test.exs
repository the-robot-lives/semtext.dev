defmodule Semtext.Github.Adapters.ProposalsContextTest do
  @moduledoc """
  The production port adapter mapped onto the landed `Semtext.Proposals`
  context: real rows through the sandbox — lifecycle, finders, not-founds.
  """

  use Semtext.DataCase, async: false

  alias Semtext.Github.Adapters.ProposalsContext
  alias Semtext.Proposals

  setup do
    uniq = System.unique_integer([:positive])

    {:ok, user} =
      Semtext.Repo.insert(%Semtext.Schema.Users.User{
        id: Ecto.UUID.generate(),
        email: "gh-sync-#{uniq}@example.com",
        user_name: "ghsync#{uniq}",
        handle: "ghsync#{uniq}",
        hashed_password: "x",
        status: :active,
        verified: false,
        flagged: false
      })

    {:ok, proposal, :created} =
      Proposals.create_and_submit(
        user.id,
        %{
          element_tag: "sem-datalist",
          slug: "gh-sync-target",
          title: "A datalist element",
          summary: "Renders a list.",
          motivation: "Lists are common.",
          options: [],
          example: "<sem-datalist></sem-datalist>"
        },
        "idem-" <> Ecto.UUID.generate()
      )

    %{proposal: proposal, proposal_id: proposal.id}
  end

  test "get_sync_target returns the body-field map for a real proposal", %{proposal_id: id} do
    assert {:ok, target} = ProposalsContext.get_sync_target(id)
    assert target.slug == "gh-sync-target"
    assert target.element_tag == "sem-datalist"
    assert target.summary == "Renders a list."
    assert is_list(target.options)
  end

  test "get_sync_target unknown id → {:error, :not_found}" do
    assert {:error, :not_found} = ProposalsContext.get_sync_target(Ecto.UUID.generate())
  end

  test "link lifecycle through the port callbacks", %{proposal_id: id} do
    # create_and_submit auto-creates the :pending link (data lane contract).
    assert {:ok, %{state: :pending}} = ProposalsContext.get_discussion_link(id)

    assert :ok = ProposalsContext.mark_discussion_pending(id)
    assert {:ok, %{state: :pending}} = ProposalsContext.get_discussion_link(id)

    assert :ok =
             ProposalsContext.put_discussion_link(id, %{
               node_id: "D_node",
               discussion_number: 12,
               url: "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/12"
             })

    assert {:ok, %{state: :ok, node_id: "D_node"}} = ProposalsContext.get_discussion_link(id)

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    assert :ok =
             ProposalsContext.update_discussion_stats(id, %{
               comment_count: 3,
               reactions: %{"THUMBS_UP" => 2},
               last_synced_at: now
             })

    assert {:ok, %{comment_count: 3, reactions: %{"THUMBS_UP" => 2}}} =
             ProposalsContext.get_discussion_link(id)

    # v2 deviation (documented in the adapter): the failure recorder no-ops on
    # an `:ok` link — a later sync failure cannot un-publish a live discussion.
    assert :ok = ProposalsContext.mark_discussion_failed(id, "boom")
    assert {:ok, %{state: :ok, last_error: nil}} = ProposalsContext.get_discussion_link(id)
  end

  test "a failing sync before creation accrues attempts toward :failed (attempts-gated)", %{
    proposal_id: id
  } do
    assert {:ok, %{state: :pending}} = ProposalsContext.get_discussion_link(id)

    max = Application.get_env(:semtext, :proposals, []) |> Keyword.get(:discussion_max_attempts, 5)

    for n <- 1..(max - 1) do
      assert :ok = ProposalsContext.mark_discussion_failed(id, "attempt #{n}")
      assert {:ok, %{state: :pending}} = ProposalsContext.get_discussion_link(id)
    end

    assert :ok = ProposalsContext.mark_discussion_failed(id, "final straw")
    assert {:ok, %{state: :failed, last_error: "final straw"}} = ProposalsContext.get_discussion_link(id)

    # The manual-retry path resets the chip so the worker can drive it again.
    assert {:ok, %{state: :pending}} = Proposals.retry_discussion(id)
  end

  test "finders resolve created links (by node, by repo+number), nil otherwise", %{proposal_id: id} do
    repo = "noizu-labs-ml/npl-enhanced-content"

    assert {:ok, nil} = ProposalsContext.find_discussion_by_node("D_absent")

    :ok =
      ProposalsContext.put_discussion_link(id, %{node_id: "D_find", discussion_number: 33, url: "u"})

    assert {:ok, ^id} = ProposalsContext.find_discussion_by_node("D_find")
    assert {:ok, nil} = ProposalsContext.find_discussion_by_node(nil)
    assert {:ok, ^id} = ProposalsContext.find_discussion_by_number(repo, 33)
    assert {:ok, nil} = ProposalsContext.find_discussion_by_number(repo, 34)
    assert {:ok, nil} = ProposalsContext.find_discussion_by_number("other/repo", 33)
  end
end
