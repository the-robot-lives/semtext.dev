defmodule Semtext.Github do
  @moduledoc """
  GitHub App client for proposal Discussion sync (design v1 §6 / v2 §4, P1
  LANE=github-sync).

  This is the **GitHub App** (`semtext-proposals`, Discussions write on
  `noizu-labs-ml/npl-enhanced-content`) — a DIFFERENT GitHub object from the
  OAuth login app (D4). The two never share secrets.

  Shape follows the house `Semtext.FleetPush` pattern:

    * every outbound call goes through a `Semtext.Github.Client` behaviour —
      the default `Semtext.Github.ReqClient` (Req, `retry: false` — retries
      are Oban's job, not the HTTP client's);
    * config lives under `config :semtext, Semtext.Github, [...]`, values
      injected from env at boot (`config/runtime.exs`);
    * `enabled?/0` gates the sync workers — an unprovisioned pod logs and
      cancels jobs instead of retry-storming.

  Sub-modules:

    * `Semtext.Github.AppAuth` — RS256 App JWT (installations auth)
    * `Semtext.Github.InstallationToken` — cached installation access token
    * `Semtext.Github.Graphql` — `createDiscussion` + stats fetch
    * `Semtext.Github.DiscussionBody` — discussion markdown template
    * `Semtext.Github.Webhook` — `X-Hub-Signature-256` verification
    * `Semtext.Github.Port` — the seam to LANE=data's proposals context
    * `Semtext.Github.Sync` — enqueue/manual-retry facade for other lanes
  """

  @typedoc "A proposal id as the data context keys it (opaque to this lane)."
  @type proposal_id :: String.t()

  @doc """
  Reads this module's config (Keyword) with a default.
  """
  @spec cfg(atom(), term()) :: term()
  def cfg(key, default \\ nil) do
    Application.get_env(:semtext, __MODULE__, [])
    |> Keyword.get(key, default)
  end

  @doc """
  True when the full Discussion-creation credential set is configured (app id,
  private key, installation id, repository node id, discussion category id).
  The webhook secret is deliberately NOT part of this — the webhook endpoint
  only needs its own secret.
  """
  @spec enabled?() :: boolean()
  def enabled? do
    [
      :app_id,
      :app_private_key,
      :installation_id,
      :repository_id,
      :discussion_category_id
    ]
    |> Enum.all?(fn key -> present?(cfg(key)) end)
  end

  @doc """
  True when webhook ingestion can verify signatures.
  """
  @spec webhook_configured?() :: boolean()
  def webhook_configured?, do: present?(cfg(:webhook_secret))

  @doc "The configured HTTP client (behaviour `Semtext.Github.Client`)."
  @spec client() :: module()
  def client, do: cfg(:http_client, Semtext.Github.ReqClient)

  @doc """
  The proposals-domain port (behaviour `Semtext.Github.Port`). Default is the
  delegator to LANE=data's `Semtext.Proposals` context.
  """
  @spec port() :: module()
  def port, do: cfg(:proposals_port, Semtext.Github.Adapters.ProposalsContext)

  @doc "GitHub REST/GraphQL API base (override for tests)."
  @spec api_base() :: String.t()
  def api_base, do: cfg(:api_base, "https://api.github.com")

  @doc "Deep-link base for proposal pages (discussions link back here)."
  @spec proposals_base_url() :: String.t()
  def proposals_base_url, do: String.trim_trailing(cfg(:proposals_base_url, "https://proposals.semtext.dev"), "/")

  # -- plumbing -----------------------------------------------------------

  defp present?(nil), do: false
  defp present?(""), do: false
  defp present?(_), do: true
end
