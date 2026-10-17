defmodule Semtext.Github.Graphql do
  @moduledoc """
  GitHub GraphQL v4 calls for the Discussions sync (auth = installation
  token, v1 §6).

    * `create_discussion/1` — the `createDiscussion` mutation into the
      configured repository + Proposals category
    * `fetch_stats/2` — comment/reaction counts for one discussion (the
      webhook-sync refresh: the event is the trigger, the API is the truth)

  All HTTP goes through `Semtext.Github.Client`; failures come back as
  `{kind, reason}` with `kind ∈ :transient | :permanent`
  (`Semtext.Github.Errors`).
  """

  require Logger

  @create_mutation """
  mutation CreateDiscussion($input: CreateDiscussionInput!) {
    createDiscussion(input: $input) {
      discussion {
        id
        number
        url
        title
      }
    }
  }
  """

  @stats_query """
  query DiscussionStats($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      discussion(number: $number) {
        id
        url
        comments(first: 0) {
          totalCount
        }
        reactionGroups {
          content
          users(first: 0) {
            totalCount
          }
        }
      }
    }
  }
  """

  @doc """
  Creates the discussion for a proposal snapshot.

  Returns `{:ok, %{node_id:, discussion_number:, url:, title:}}` or
  `{:error, {kind, reason}}`.
  """
  @spec create_discussion(Semtext.Github.Port.sync_target()) ::
          {:ok, %{node_id: String.t(), discussion_number: pos_integer(), url: String.t(), title: String.t()}}
          | {:error, Semtext.Github.Errors.classified()}
  def create_discussion(target) do
    variables = %{
      "input" => %{
        "repositoryId" => required_cfg(:repository_id),
        "categoryId" => required_cfg(:discussion_category_id),
        "title" => Semtext.Github.DiscussionBody.title(target),
        "body" => Semtext.Github.DiscussionBody.body(target)
      }
    }

    with_installation_token(fn token ->
      case post_graphql(token, @create_mutation, variables) do
        {:ok, %{"data" => %{"createDiscussion" => %{"discussion" => discussion}}}} ->
          {:ok, normalize_discussion(discussion)}

        {:ok, %{"errors" => errors}} ->
          {:error, Semtext.Github.Errors.classify_graphql(errors)}

        {:ok, other} ->
          {:error, {:transient, {:unexpected_graphql_shape, inspect(other)}}}

        {:error, classified} ->
          {:error, classified}
      end
    end)
  end

  @doc """
  Comment/reaction counts for a discussion (reaction groups are the head
  post's tallies — that post IS the proposal vote).

  Returns `{:ok, %{comment_count:, reactions:, node_id:, url:}}`. A
  `NOT_FOUND` here means the discussion was deleted on GitHub → classified
  permanent with reason `{:not_found, :discussion}`.
  """
  @spec fetch_stats(pos_integer() | String.t()) ::
          {:ok, %{
            optional(:comment_count) => non_neg_integer(),
            optional(:reactions) => %{String.t() => non_neg_integer()},
            optional(:node_id) => String.t(),
            optional(:url) => String.t()
          }}
          | {:error, Semtext.Github.Errors.classified()}
  def fetch_stats(discussion_number) do
    variables = %{
      "owner" => to_string(Semtext.Github.cfg(:repository_owner, "noizu-labs-ml")),
      "name" => to_string(Semtext.Github.cfg(:repository_name, "npl-enhanced-content")),
      "number" => discussion_number
    }

    with_installation_token(fn token ->
      case post_graphql(token, @stats_query, variables) do
        {:ok, %{"data" => %{"repository" => %{"discussion" => %{"comments" => comments} = discussion}}}} ->
          {:ok,
           %{
             comment_count: comments["totalCount"],
             reactions: reaction_tallies(discussion["reactionGroups"]),
             node_id: discussion["id"],
             url: discussion["url"]
           }}

        {:ok, %{"errors" => errors}} ->
          case Semtext.Github.Errors.classify_graphql(errors) do
            {:permanent, {:graphql, types}} ->
              if String.contains?(types, "NOT_FOUND") do
                {:error, {:permanent, {:not_found, :discussion}}}
              else
                {:error, {:permanent, {:graphql, types}}}
              end

            classified ->
              {:error, classified}
          end

        {:ok, other} ->
          {:error, {:transient, {:unexpected_graphql_shape, inspect(other)}}}

        {:error, classified} ->
          {:error, classified}
      end
    end)
  end

  # -- plumbing -----------------------------------------------------------

  defp with_installation_token(fun) do
    case Semtext.Github.InstallationToken.get() do
      {:ok, token} -> fun.(token)
      {:error, classified} -> {:error, classified}
    end
  end

  defp post_graphql(token, query, variables) do
    url = Semtext.Github.api_base() <> "/graphql"
    headers = [
      {"authorization", "Bearer " <> token},
      {"content-type", "application/json"}
    ]

    result = Semtext.Github.client().post(url, headers, Jason.encode!(%{"query" => query, "variables" => variables}))

    case result do
      {:ok, status, body} when status in 200..299 and is_map(body) ->
        {:ok, body}

      {:ok, status, _body} when status in [401, 403] ->
        # Installation token stale/revoked — drop the cache so the next call
        # re-mints, and let Oban retry with a fresh token.
        Semtext.Github.InstallationToken.clear()
        {:error, {:transient, {:auth_rejected, status}}}

      {:ok, status, _body} ->
        {:error, Semtext.Github.Errors.classify_http({:ok, status, nil})}

      {:error, reason} ->
        {:error, Semtext.Github.Errors.classify_http({:error, reason})}
    end
  end

  defp normalize_discussion(%{"id" => id, "number" => number, "url" => url} = discussion) do
    %{
      node_id: id,
      discussion_number: number,
      url: url,
      title: Map.get(discussion, "title")
    }
  end

  defp normalize_discussion(other) do
    Logger.error("github_graphql: unexpected createDiscussion payload: #{inspect(other, limit: 5)}")
    %{"id" => id, "number" => number, "url" => url} = other

    %{node_id: id, discussion_number: number, url: url, title: nil}
  end

  defp reaction_tallies(nil), do: %{}

  defp reaction_tallies(groups) when is_list(groups) do
    groups
    |> Enum.reduce(%{}, fn group, acc ->
      content = Map.get(group, "content")
      count = get_in(group, ["users", "totalCount"])

      if is_binary(content) and is_integer(count) and count > 0 do
        Map.put(acc, content, count)
      else
        acc
      end
    end)
  end

  defp required_cfg(key) do
    case Semtext.Github.cfg(key) do
      nil -> raise ArgumentError, "Semtext.Github config key #{inspect(key)} is not set"
      value -> to_string(value)
    end
  end
end
