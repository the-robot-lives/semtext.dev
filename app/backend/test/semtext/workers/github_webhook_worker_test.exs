defmodule Semtext.Workers.GithubWebhookWorkerTest do
  @moduledoc """
  Webhook event application: comment/reaction events refresh counts from a
  fresh GraphQL fetch, `discussion.deleted` (and a NOT_FOUND during refresh)
  flip the link to removed, unknown events/payloads no-op, replays are no-ops
  (idempotent re-writes).
  """

  use ExUnit.Case, async: false
  use Semtext.Github.FakePortSetup

  alias Semtext.Github.FakePort
  alias Semtext.Github.InstallationToken
  alias Semtext.Workers.GithubWebhookWorker

  @proposal "44444444-4444-4444-4444-444444444444"
  @repo "noizu-labs-ml/npl-enhanced-content"

  @reply_key {__MODULE__, :reply}

  setup do
    InstallationToken.clear()

    base_gh = Application.get_env(:semtext, Semtext.Github, [])

    Application.put_env(
      :semtext,
      Semtext.Github,
      Keyword.merge(base_gh,
        app_id: "123",
        app_private_key: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1),
        installation_id: "456",
        repository_owner: "noizu-labs-ml",
        repository_name: "npl-enhanced-content",
        http_client: __MODULE__.StubClient,
        proposals_port: Semtext.Github.FakePort
      )
    )

    FakePort.seed_target(@proposal)
    FakePort.put_discussion_link(@proposal, %{node_id: "D_live", discussion_number: 21, url: "u"})

    :persistent_term.put(@reply_key, {:ok, 200, stats_response()})

    on_exit(fn ->
      InstallationToken.clear()
      :persistent_term.erase(@reply_key)

      if base_gh == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base_gh)
      end
    end)

    :ok
  end

  defp stats_response(count \\ 5) do
    %{
      "data" => %{
        "repository" => %{
          "discussion" => %{
            "id" => "D_live",
            "url" => "https://github.com/x/y/discussions/21",
            "comments" => %{"totalCount" => count},
            "reactionGroups" => [%{"content" => "THUMBS_UP", "users" => %{"totalCount" => 4}}]
          }
        }
      }
    }
  end

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.Github.Client

    # The installation-token mint is canned healthy: configured replies
    # (fun or tuple) describe the GraphQL exchange only.
    @token_reply {:ok, 201, %{"token" => "ghs_test", "expires_at" => "2099-01-01T00:00:00Z"}}

    @impl true
    def post(url, _headers, _body) do
      if String.contains?(to_string(url), "/access_tokens") do
        @token_reply
      else
        case :persistent_term.get({Semtext.Workers.GithubWebhookWorkerTest, :reply}, {:ok, 500, "no reply"}) do
          fun when is_function(fun, 0) -> fun.()
          reply -> reply
        end
      end
    end
  end

  defp set_reply(reply), do: :persistent_term.put(@reply_key, reply)

  defp delivery(event, action, payload, delivery_id \\ "d-1") do
    %Oban.Job{
      args: %{
        "delivery_id" => delivery_id,
        "event" => event,
        "action" => action,
        "payload" => payload
      },
      attempt: 1,
      max_attempts: 10
    }
  end

  defp discussion_payload(action, overrides \\ %{}) do
    Map.merge(
      %{
        "action" => action,
        "discussion" => %{"node_id" => "D_live", "number" => 21, "title" => "t"},
        "repository" => %{"full_name" => @repo}
      },
      overrides
    )
  end

  test "discussion_comment.created refreshes counts via a fresh fetch" do
    assert :ok = GithubWebhookWorker.perform(delivery("discussion_comment", "created", discussion_payload("created")))

    link = FakePort.link(@proposal)
    assert link.comment_count == 5
    assert link.reactions == %{"THUMBS_UP" => 4}
    assert %DateTime{} = link.last_synced_at
  end

  test "reaction events resolve the link by node id OR number, refresh once" do
    payload = discussion_payload("created", %{"discussion" => %{"number" => 21}, "subject" => %{"node_id" => "D_live"}})

    assert :ok = GithubWebhookWorker.perform(delivery("reaction", "created", payload))
    assert FakePort.link(@proposal).comment_count == 5
  end

  test "discussion.deleted flips the link to removed without touching GitHub" do
    set_reply(fn -> flunk("deleted events must not call GitHub") end)

    assert :ok = GithubWebhookWorker.perform(delivery("discussion", "deleted", discussion_payload("deleted")))
    assert FakePort.link(@proposal).state == :removed
  end

  test "stats fetch NOT_FOUND (deleted without a webhook) flips the link to removed" do
    set_reply({:ok, 200, %{"errors" => [%{"type" => "NOT_FOUND", "message" => "gone"}]}})

    assert :ok = GithubWebhookWorker.perform(delivery("discussion_comment", "created", discussion_payload("created")))
    assert FakePort.link(@proposal).state == :removed
  end

  test "transient stats fetch failure returns an error (Oban retries), state untouched" do
    set_reply({:error, :timeout})

    assert {:error, {:transient, {:transport, :timeout}}} =
             GithubWebhookWorker.perform(delivery("discussion_comment", "created", discussion_payload("created")))

    refute FakePort.link(@proposal)[:comment_count]
  end

  test "events for discussions we do not track no-op" do
    payload = discussion_payload("created", %{"discussion" => %{"node_id" => "D_other", "number" => 999}})
    set_reply(fn -> flunk("unknown discussions must not call GitHub") end)

    assert :ok = GithubWebhookWorker.perform(delivery("discussion_comment", "created", payload, "d-unknown"))
    assert FakePort.link(@proposal)[:comment_count] == nil
  end

  test "ping and unsupported events no-op" do
    set_reply(fn -> flunk("no-ops must not call GitHub") end)

    assert :ok = GithubWebhookWorker.perform(delivery("ping", nil, %{}))
    assert :ok = GithubWebhookWorker.perform(delivery("installation", "created", %{"action" => "created"}))
    assert :ok = GithubWebhookWorker.perform(delivery("star", "created", %{}))
  end

  test "a replayed delivery rewrites identical values (idempotent no-op)" do
    args = delivery("discussion_comment", "created", discussion_payload("created"))

    assert :ok = GithubWebhookWorker.perform(args)

    set_reply({:ok, 200, stats_response(5)})
    assert :ok = GithubWebhookWorker.perform(args)

    link = FakePort.link(@proposal)
    assert link.comment_count == 5
  end

  test "oban wiring: queue declared, unique keyed on delivery_id across settled states" do
    oban_cfg = Application.get_env(:semtext, Oban, [])
    assert Keyword.has_key?(Keyword.get(oban_cfg, :queues, []), :github_sync)

    unique = GithubWebhookWorker.__opts__() |> Keyword.fetch!(:unique)
    assert unique[:keys] == [:delivery_id]
    assert :infinity == unique[:period]
    assert :completed in unique[:states], "replays must be deduped even after the first job settles"
    assert :discarded in unique[:states]
  end
end
