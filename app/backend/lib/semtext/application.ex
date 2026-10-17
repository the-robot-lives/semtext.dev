defmodule Semtext.Application do
  @moduledoc false
  use Application
  require Logger

  @impl true
  # <REMOVED UUID HERE> start :: auto-generated pointer for public function start
  def start(_type, _args) do
    OpentelemetryPhoenix.setup(adapter: :bandit)
    OpentelemetryEcto.setup([:semtext, :repo])
    OpentelemetryBandit.setup()
    OpentelemetryOban.setup()
    Semtext.Observability.Metrics.setup()

    # Digest static assets once at boot (release-safe app priv dir); see
    # SemtextWeb.AssetVersion. Best-effort — never blocks or crashes start.
    SemtextWeb.AssetVersion.warm()

    samly_children =
      if Application.get_env(:semtext, :saml_enabled) do
        [Samly.Provider]
      else
        []
      end

    children =
      [
        SemtextWeb.Telemetry,
        Semtext.Repo,
        {Ecto.Migrator,
         repos: Application.fetch_env!(:semtext, :ecto_repos), skip: skip_migrations?()},
        {DNSCluster, query: Application.get_env(:semtext, :dns_cluster_query) || :ignore},
        {Phoenix.PubSub, name: Semtext.PubSub},
        Semtext.Redis,
        Noizu.LiveViewEventServer,
        {Oban, Application.fetch_env!(:semtext, Oban)}
      ] ++
        samly_children ++
        [
          Semtext.Events.WebhookHandler,
          SemtextWeb.Endpoint
        ]

    opts = [strategy: :one_for_one, name: Semtext.Supervisor]

    with {:ok, _pid} = ok <- Supervisor.start_link(children, opts) do
      warm_sref_handlers()
      ok
    end
  end

  # Build the sref -> entity handler table at boot (noizu_labs_entities >= 0.3.4)
  # so the first requests after a deploy don't pay the cold build (the Guardian
  # subject `ref.user-session.*` resolves through it). Never fails boot: the
  # table is still built lazily on first lookup if this raises.
  defp warm_sref_handlers() do
    Semtext.EntityRepo.warm_sref_handlers()
  rescue
    e -> Logger.warning("sref handler warm-up failed: #{Exception.message(e)}")
  catch
    kind, reason -> Logger.warning("sref handler warm-up failed: #{inspect({kind, reason})}")
  end

  @impl true
  # <REMOVED UUID HERE> config_change :: auto-generated pointer for public function config_change
  def config_change(changed, _new, removed) do
    SemtextWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp skip_migrations?() do
    System.get_env("RELEASE_NAME") == nil
  end
end
