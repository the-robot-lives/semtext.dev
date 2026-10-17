defmodule Semtext.Github.GraphqlTest do
  @moduledoc """
  GraphQL client: createDiscussion happy path + payload shape, GraphQL-level
  error classification (NOT_FOUND/FORBIDDEN permanent, RATE_LIMITED
  transient), HTTP status handling (401 clears the token cache), stats fetch
  + reaction-group tallies.
  """

  use ExUnit.Case, async: false

  alias Semtext.Github
  alias Semtext.Github.Graphql
  alias Semtext.Github.InstallationToken

  @calls_key {__MODULE__, :calls}
  @reply_key {__MODULE__, :reply}
  @base_cfg_key {__MODULE__, :base_cfg}

  @target %{
    proposal_id: "p-1",
    slug: "sem-datalist",
    title: "A datalist element",
    element_tag: "sem-datalist",
    summary: "Renders a list.",
    motivation: "Lists are common.",
    options: [],
    example: "<sem-datalist></sem-datalist>"
  }

  setup do
    InstallationToken.clear()
    :persistent_term.put(@calls_key, [])

    base = Application.get_env(:semtext, Semtext.Github, [])
    :persistent_term.put(@base_cfg_key, base)

    Application.put_env(
      :semtext,
      Semtext.Github,
      Keyword.merge(base,
        app_id: "123",
        app_private_key: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1),
        installation_id: "456",
        repository_id: "R_repo",
        discussion_category_id: "DIC_category",
        repository_owner: "noizu-labs-ml",
        repository_name: "npl-enhanced-content",
        http_client: __MODULE__.StubClient
      )
    )

    # Default: token mint succeeds, then hand the call to the per-test reply.
    :persistent_term.put(@reply_key, fn _url, _body -> {:ok, 200, %{"data" => %{"createDiscussion" => %{"discussion" => created()}}}} end)

    on_exit(fn ->
      InstallationToken.clear()
      :persistent_term.erase(@calls_key)
      :persistent_term.erase(@reply_key)
      :persistent_term.erase(@base_cfg_key)

      if base == [] do
        Application.delete_env(:semtext, Semtext.Github)
      else
        Application.put_env(:semtext, Semtext.Github, base)
      end
    end)

    :ok
  end

  defp created do
    %{"id" => "D_node", "number" => 7, "url" => "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/7", "title" => "sem-datalist — A datalist element"}
  end

  defmodule StubClient do
    @moduledoc false
    @behaviour Semtext.Github.Client

    # The installation-token mint is canned healthy: per-test replies describe
    # the GraphQL exchange only.
    @token_reply {:ok, 201, %{"token" => "ghs_test", "expires_at" => "2099-01-01T00:00:00Z"}}

    @impl true
    def post(url, headers, body) do
      key = {Semtext.Github.GraphqlTest, :calls}
      :persistent_term.put(key, [{url, headers, body} | :persistent_term.get(key, [])])

      if String.contains?(to_string(url), "/access_tokens") do
        @token_reply
      else
        case :persistent_term.get({Semtext.Github.GraphqlTest, :reply}, nil) do
          nil -> {:ok, 200, %{"data" => %{}}}
          fun when is_function(fun) -> fun.(url, body)
          fixed -> fixed
        end
      end
    end
  end

  defp calls, do: :persistent_term.get(@calls_key, []) |> Enum.reverse() |> Enum.map(fn {url, _h, body} -> %{url: url, body: body} end)

  defp set_reply(reply), do: :persistent_term.put(@reply_key, reply)

  test "create_discussion posts repositoryId/categoryId/title/body and normalizes the result" do
    assert {:ok, %{node_id: "D_node", discussion_number: 7, url: url, title: title}} =
             Graphql.create_discussion(@target)

    assert url =~ "/discussions/7"
    assert title =~ "sem-datalist"

    # First call mints the token, second is the GraphQL POST.
    assert [%{url: token_url}, %{url: gh_url, body: gh_body}] = calls()
    assert token_url =~ "/app/installations/456/access_tokens"
    assert gh_url == "https://api.github.com/graphql"

    assert %{"query" => query, "variables" => %{"input" => input}} = Jason.decode!(gh_body)
    assert query =~ "createDiscussion"
    assert input["repositoryId"] == "R_repo"
    assert input["categoryId"] == "DIC_category"
    assert input["title"] == "sem-datalist — A datalist element"
    assert input["body"] =~ "https://proposals.semtext.dev/p/sem-datalist"
  end

  test "GraphQL NOT_FOUND/FORBIDDEN → permanent" do
    set_reply(fn _url, _body -> {:ok, 200, %{"errors" => [%{"type" => "NOT_FOUND", "message" => "Could not resolve to a node"}]}} end)

    assert {:error, {:permanent, {:graphql, "NOT_FOUND"}}} = Graphql.create_discussion(@target)
  end

  test "GraphQL RATE_LIMITED → transient" do
    set_reply(fn _url, _body -> {:ok, 200, %{"errors" => [%{"type" => "RATE_LIMITED", "message" => "you are rate limited"}]}} end)

    assert {:error, {:transient, {:graphql_rate_limited, "you are rate limited"}}} =
             Graphql.create_discussion(@target)
  end

  test "plain GraphQL user error → permanent" do
    set_reply(fn _url, _body -> {:ok, 200, %{"errors" => [%{"message" => "Category is not correct for this repository"}]}} end)

    assert {:error, {:permanent, {:graphql, "Category is not correct for this repository"}}} =
             Graphql.create_discussion(@target)
  end

  test "HTTP 401 clears the token cache and is transient; 5xx transient; 400 permanent" do
    set_reply(fn _url, _body -> {:ok, 401, "bad token"} end)
    assert {:error, {:transient, {:auth_rejected, 401}}} = Graphql.create_discussion(@target)

    set_reply(fn _url, _body -> {:ok, 502, "gateway"} end)
    assert {:error, {:transient, {:github_status, 502}}} = Graphql.create_discussion(@target)

    set_reply(fn _url, _body -> {:error, :timeout} end)
    assert {:error, {:transient, {:transport, :timeout}}} = Graphql.create_discussion(@target)

    set_reply(fn _url, _body -> {:ok, 400, "bad request"} end)
    assert {:error, {:permanent, {:bad_request, 400}}} = Graphql.create_discussion(@target)
  end

  test "fetch_stats parses comment totals + reaction groups" do
    set_reply(fn _url, _body ->
      {:ok, 200,
       %{
         "data" => %{
           "repository" => %{
             "discussion" => %{
               "id" => "D_node",
               "url" => "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/7",
               "comments" => %{"totalCount" => 4},
               "reactionGroups" => [
                 %{"content" => "THUMBS_UP", "users" => %{"totalCount" => 3}},
                 %{"content" => "HEART", "users" => %{"totalCount" => 0}},
                 %{"content" => "EYES", "users" => %{"totalCount" => 2}}
               ]
             }
           }
         }
       }}
    end)

    assert {:ok, %{comment_count: 4, reactions: %{"THUMBS_UP" => 3, "EYES" => 2}, node_id: "D_node"}} =
             Graphql.fetch_stats(7)
  end

  test "fetch_stats NOT_FOUND classifies as discussion-not-found (deleted on GitHub)" do
    set_reply(fn _url, _body -> {:ok, 200, %{"errors" => [%{"type" => "NOT_FOUND", "message" => "none"}]}} end)

    assert {:error, {:permanent, {:not_found, :discussion}}} = Graphql.fetch_stats(7)
  end

  test "missing repo/category config raises at the call site (config bug, not a retry)" do
    base = :persistent_term.get(@base_cfg_key, [])

    Application.put_env(
      :semtext,
      Github,
      Keyword.merge(base,
        app_id: "1",
        app_private_key: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1),
        installation_id: "2",
        repository_id: nil,
        http_client: __MODULE__.StubClient
      )
    )

    assert_raise ArgumentError, ~r/repository_id/, fn ->
      Graphql.create_discussion(@target)
    end
  end
end
