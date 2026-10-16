defmodule Semtext.Workers.GithubDiscussionWorkerTest do
  @moduledoc """
  The P1 acceptance behaviour, unit-level: "a forced GitHub outage leaves the
  proposal visible with a `discussion pending` chip and the retry lands it",
  permanent failures flip `failed` + cancel, and the worker never mutates the
  proposal — only link state through the port.
  """

  use ExUnit.Case, async: false
  use Semtext.Github.FakePortSetup

  import ExUnit.CaptureLog

  alias Semtext.Github.FakePort
  alias Semtext.Github.InstallationToken
  alias Semtext.Workers.GithubDiscussionWorker

  @reply_key {__MODULE__, :reply}
  @calls_key {__MODULE__, :calls}
  @base_gh_key {__MODULE__, :base_gh}

  @proposal "33333333-3333-3333-3333-333333333333"

  setup do
    InstallationToken.clear()
    :persistent_term.put(@calls_key, [])

    base_gh = Application.get_env(:semtext, Semtext.Github, [])
    :persistent_term.put(@base_gh_key, base_gh)

    # Fully-provisioned GitHub App config + stubbed HTTP + fake port.
    Application.put_env(
      :semtext,
      Semtext.Github,
      Keyword.merge(base_gh,
        app_id: "123",
        app_private_key: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1),
        installation_id: "456",
        repository_id: "R_repo",
        discussion_category_id: "DIC_proposals",
        repository_owner: "noizu-labs-ml",
        repository_name: "npl-enhanced-content",
        http_client: __MODULE__.StubClient,
        proposals_port: Semtext.Github.FakePort
      )
    )

    FakePort.seed_target(@proposal)

    # Default: token mint OK; GraphQL createDiscussion OK.
    :persistent_term.put(@reply_key, {:ok, 200, %{"data" => %{"createDiscussion" => %{"discussion" => created()}}}})

    on_exit(fn ->
      InstallationToken.clear()
      :persistent_term.erase(@calls_key)
      :persistent_term.erase(@reply_key)
      :persistent_term.erase(@base_gh_key)

      if base_gh == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base_gh)
      end
    end)

    :ok
  end

  defp created do
    %{"id" => "D_node", "number" => 11, "url" => "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/11", "title" => "t"}
  end

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.Github.Client

    # The installation-token mint is canned healthy: configured replies
    # (fun or tuple) describe the GraphQL exchange only.
    @token_reply {:ok, 201, %{"token" => "ghs_test", "expires_at" => "2099-01-01T00:00:00Z"}}

    @impl true
    def post(url, _headers, _body) do
      key = {Semtext.Workers.GithubDiscussionWorkerTest, :calls}
      :persistent_term.put(key, [url | :persistent_term.get(key, [])])

      if String.contains?(to_string(url), "/access_tokens") do
        @token_reply
      else
        case :persistent_term.get({Semtext.Workers.GithubDiscussionWorkerTest, :reply}, nil) do
          nil -> {:ok, 500, "no reply configured"}
          reply when is_function(reply) -> reply.(url)
          reply -> reply
        end
      end
    end
  end

  defp set_reply(reply), do: :persistent_term.put(@reply_key, reply)

  defp job(attempt \\ 1, max \\ 12) do
    %Oban.Job{args: %{"proposal_id" => @proposal}, attempt: attempt, max_attempts: max}
  end

  test "happy path: creates the discussion and stores the ok link" do
    assert :ok = GithubDiscussionWorker.perform(job())

    link = FakePort.link(@proposal)
    assert link.state == :ok
    assert link.node_id == "D_node"
    assert link.discussion_number == 11
    assert link.url =~ "/discussions/11"
  end

  test "ACCEPTANCE — forced outage: proposal chip stays pending, nothing crashes, retry lands it" do
    # 1. GitHub is unreachable (the outage): the GraphQL call fails with a
    #    transport error (the token mint is canned healthy — irrelevant here).
    set_reply(fn _url -> {:error, :econnrefused} end)

    assert {:error, {:transient, {:transport, :econnrefused}}} = GithubDiscussionWorker.perform(job())

    link = FakePort.link(@proposal)
    assert link.state == :pending, "the chip must read 'discussion pending' during an outage"
    assert link[:node_id] == nil, "no discussion must be recorded"

    # 2. GitHub comes back; the retry (next Oban attempt) lands the discussion.
    set_reply(fn _url -> {:ok, 200, %{"data" => %{"createDiscussion" => %{"discussion" => created()}}}} end)

    assert :ok = GithubDiscussionWorker.perform(job(2))
    assert FakePort.link(@proposal).state == :ok
    assert FakePort.link(@proposal).discussion_number == 11
  end

  test "transient failure before the last attempt: stays pending, returns error (Oban retries)" do
    set_reply(fn _url -> {:ok, 503, "unavailable"} end)

    assert {:error, {:transient, {:github_status, 503}}} = GithubDiscussionWorker.perform(job(3, 12))
    assert FakePort.link(@proposal).state == :pending
  end

  test "retries exhausted: chip flips to failed" do
    set_reply(fn _url -> {:ok, 503, "still down"} end)

    assert capture_log(fn ->
             assert {:error, {:transient_exhausted, {:github_status, 503}}} =
                      GithubDiscussionWorker.perform(job(12, 12))
           end) =~ "retries exhausted"

    assert FakePort.link(@proposal).state == :failed
    assert FakePort.link(@proposal).last_error =~ "503"
  end

  test "permanent GraphQL failure: chip flips to failed immediately, job cancelled" do
    set_reply(fn _url -> {:ok, 200, %{"errors" => [%{"type" => "NOT_FOUND", "message" => "category id wrong"}]}} end)

    assert {:cancel, {:permanent, {:graphql, "NOT_FOUND"}}} = GithubDiscussionWorker.perform(job())

    assert FakePort.link(@proposal).state == :failed
  end

  test "a proposal whose link is already ok is a no-op (double-enqueue safety)" do
    assert :ok = GithubDiscussionWorker.perform(job())
    set_reply(fn _url -> flunk("must not touch GitHub when already synced") end)

    assert :ok = GithubDiscussionWorker.perform(job())
    assert FakePort.link(@proposal).discussion_number == 11
  end

  test "unknown proposal: cancels without touching GitHub" do
    set_reply(fn _url -> flunk("must not touch GitHub for a missing proposal") end)

    assert {:cancel, :proposal_not_found} =
             GithubDiscussionWorker.perform(%Oban.Job{args: %{"proposal_id" => "ghost"}, attempt: 1, max_attempts: 12})
  end

  test "unconfigured GitHub App: cancels cleanly (no crash, no retry storm)" do
    base = :persistent_term.get(@base_gh_key, [])
    Application.put_env(:semtext, Semtext.Github, Keyword.merge(base, app_id: nil, app_private_key: nil))

    assert capture_log(fn ->
             assert {:cancel, :github_not_configured} = GithubDiscussionWorker.perform(job())
           end) =~ "not configured"

    assert FakePort.link(@proposal) == nil, "an unconfigured pod must not touch link state"
  end

  test "backoff grows exponentially and caps at 15 minutes" do
    assert GithubDiscussionWorker.backoff(%Oban.Job{attempt: 1}) == 30
    assert GithubDiscussionWorker.backoff(%Oban.Job{attempt: 2}) == 60
    assert GithubDiscussionWorker.backoff(%Oban.Job{attempt: 3}) == 120
    assert GithubDiscussionWorker.backoff(%Oban.Job{attempt: 9}) == 900
    assert GithubDiscussionWorker.backoff(%Oban.Job{attempt: 12}) == 900
  end

  test "oban wiring: queue declared, unique keyed on proposal_id, cap 12" do
    oban_cfg = Application.get_env(:semtext, Oban, [])
    assert Keyword.has_key?(Keyword.get(oban_cfg, :queues, []), :github_sync)

    opts = GithubDiscussionWorker.__opts__()
    assert Keyword.fetch!(opts, :queue) == :github_sync
    assert Keyword.fetch!(opts, :max_attempts) == 12

    unique = Keyword.fetch!(opts, :unique)
    assert unique[:keys] == [:proposal_id]
    assert :infinity == unique[:period]
  end
end
