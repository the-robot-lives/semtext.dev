defmodule Semtext.Github.Adapters.ProposalsContext do
  @moduledoc """
  Production `Semtext.Github.Port`: maps onto the landed `Semtext.Proposals`
  context (LANE=data).

  The Port speaks sync-worker vocabulary (`get_sync_target`,
  `put_discussion_link`, …); the data context speaks chip-state vocabulary
  (`ensure_discussion_link`, `record_discussion_created`, …). This module is
  the single v1→v2 mapping point:

    | Port callback             | `Semtext.Proposals`                                    |
    |---------------------------|--------------------------------------------------------|
    | `get_sync_target/1`       | `Repo.get(Proposal, id)` (body fields denormalized)    |
    | `get_discussion_link/1`   | `discussion_link_for/1` (`{:error, :not_found}` → nil) |
    | `mark_discussion_pending/1` | `ensure_discussion_link/2` (creates the row `:pending`) |
    | `put_discussion_link/2`   | `record_discussion_created/2`                          |
    | `mark_discussion_failed/2`| `record_discussion_failure/2` (attempts-gated, v2 §5)  |
    | `mark_discussion_removed/1`| `record_discussion_removed/2` (`:ok` -> `:removed`)  |
    | `update_discussion_stats/2`| `record_discussion_sync/2`                            |
    | `find_discussion_by_node/1` | DiscussionLink query by `node_id`                    |
    | `find_discussion_by_number/2` | DiscussionLink query by `repo` + `discussion_number` |

  v2 notes (documented deviations from the v1 §6 chip vocabulary): a
  discussion deleted on GitHub sets `:removed` (`record_discussion_removed/2`,
  only reachable from `:ok`) and a `:pending` link accrues attempts toward
  `:failed` — the data context owns the state machine; recreation from
  `:removed` is the moderator `Proposals.recreate_discussion/1` action and is
  never automatic.
  """

  @behaviour Semtext.Github.Port

  import Ecto.Query, only: [from: 2]

  alias Semtext.Proposals
  alias Semtext.Proposals.DiscussionLink
  alias Semtext.Proposals.Proposal
  alias Semtext.Repo

  @impl true
  def get_sync_target(proposal_id) do
    case Repo.get(Proposal, proposal_id) do
      nil ->
        {:error, :not_found}

      proposal ->
        {:ok,
         %{
           proposal_id: proposal.id,
           slug: proposal.slug,
           title: proposal.title,
           element_tag: proposal.element_tag,
           summary: proposal.summary,
           motivation: proposal.motivation,
           options: proposal.options || [],
           example: proposal.example
         }}
    end
  end

  @impl true
  def get_discussion_link(proposal_id) do
    case Proposals.discussion_link_for(proposal_id) do
      {:ok, link} -> {:ok, link}
      {:error, :not_found} -> {:ok, nil}
    end
  end

  @impl true
  def mark_discussion_pending(proposal_id) do
    with {:ok, _link} <- Proposals.ensure_discussion_link(proposal_id, default_repo()), do: :ok
  end

  @impl true
  def put_discussion_link(proposal_id, attrs) do
    with {:ok, _link} <- Proposals.record_discussion_created(proposal_id, attrs), do: :ok
  end

  @impl true
  def mark_discussion_failed(proposal_id, reason) do
    with {:ok, _link} <- Proposals.record_discussion_failure(proposal_id, reason), do: :ok
  end

  @impl true
  def mark_discussion_removed(proposal_id) do
    # `:removed` chip state (LANE=data, coordinator follow-up 2026-10-17):
    # only an `:ok` link flips; recreation is the moderator action, never auto.
    with {:ok, _link} <- Proposals.record_discussion_removed(proposal_id), do: :ok
  end

  @impl true
  def update_discussion_stats(proposal_id, stats) do
    with {:ok, _link} <- Proposals.record_discussion_sync(proposal_id, stats), do: :ok
  end

  @impl true
  def find_discussion_by_node(node_id) when is_binary(node_id) do
    proposal_id =
      Repo.one(from dl in DiscussionLink, where: dl.node_id == ^node_id, select: dl.proposal_id)

    {:ok, proposal_id}
  end

  def find_discussion_by_node(_), do: {:ok, nil}

  @impl true
  def find_discussion_by_number(repo, number) when is_binary(repo) and is_integer(number) do
    proposal_id =
      Repo.one(
        from dl in DiscussionLink,
          where: dl.repo == ^repo and dl.discussion_number == ^number,
          select: dl.proposal_id
      )

    {:ok, proposal_id}
  end

  def find_discussion_by_number(_repo, _number), do: {:ok, nil}

  defp default_repo, do: "#{Semtext.Github.cfg(:repository_owner, "noizu-labs-ml")}/#{Semtext.Github.cfg(:repository_name, "npl-enhanced-content")}"
end
