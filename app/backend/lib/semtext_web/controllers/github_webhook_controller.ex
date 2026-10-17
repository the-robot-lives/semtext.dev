defmodule SemtextWeb.GithubWebhookController do
  @moduledoc """
  `POST /api/v1/webhooks/github` — inbound GitHub App webhook receiver
  (design v1 §5 + §6, host `proposals.semtext.dev`).

  Contract:

    * verify `X-Hub-Signature-256` (constant-time) against the RAW body
      BEFORE trusting anything — the raw copy is captured for webhook paths
      by `Semtext.Github.Webhook.BodyReader` at the endpoint's parsers;
    * dedupe by `X-GitHub-Delivery` twice: `Semtext.Proposals.record_delivery/2`
      (durable `webhook_deliveries` table) then the worker's Oban unique key
      for concurrent in-flight replays — a replay answers `202 duplicate`;
    * answer `202` fast for anything with a valid signature (GitHub disables
      webhooks on non-2xx; `ping` must succeed for the hook to activate);
    * errors are RFC 9457 `application/problem+json` (LANE=data owns the
      shared catalogue — the two types used here are flagged for it in the
      lane report).

  Rejections: missing/unset secret → 503 (misconfiguration, not caller's
  fault), bad signature → 401, undecodable/unnormalizable delivery → 400.
  """

  use Phoenix.Controller,
    formats: [:json],
    layouts: []

  require Logger

  alias Semtext.Github.Webhook
  alias Semtext.Workers.GithubWebhookWorker

  @problem_type_base "https://proposals.semtext.dev/problems/"

  def receive(conn, _params) do
    unless Semtext.Github.webhook_configured?() do
      Logger.error("github_webhook: SEMTEXT_GITHUB_WEBHOOK_SECRET is not configured; rejecting delivery")
      problem(conn, 503, "webhook-not-configured", "GitHub webhook secret is not configured")
    else
      secret = Semtext.Github.cfg(:webhook_secret)
      raw = webhook_raw_body(conn)

      case Webhook.verify_signature(secret, raw, get_req_header(conn, "x-hub-signature-256")) do
        :ok ->
          ingest(conn)

        {:error, reason} ->
          Logger.warning("github_webhook: signature rejected (#{inspect(reason)})")
          problem(conn, 401, "invalid-signature", "X-Hub-Signature-256 verification failed")
      end
    end
  end

  # -- ingest -------------------------------------------------------------

  # The raw body for signature verification. Normally the BodyReader parser
  # wrapper captured it byte-exactly; if the request's content-type skipped
  # parsing entirely (Parsers pass-through), the body is still unread in the
  # adapter — read it now so correctly-signed bodies verify whatever the
  # content-type.
  defp webhook_raw_body(conn) do
    case Semtext.Github.Webhook.BodyReader.raw_body(conn) do
      nil ->
        case Plug.Conn.read_body(conn) do
          {:ok, body, _conn} -> body
          {:more, body, _conn} -> body
          {:error, _reason} -> ""
        end

      raw ->
        raw
    end
  end

  defp ingest(conn) do
    delivery_id = header(conn, "x-github-delivery")
    event = header(conn, "x-github-event")
    payload = conn.body_params

    case Webhook.normalize(delivery_id, event, payload) do
      {:ok, delivery} ->
        dedupe_delivery(conn, delivery)

      {:error, :missing_delivery_id} ->
        problem(conn, 400, "missing-delivery-id", "X-GitHub-Delivery header is required")

      {:error, :missing_event} ->
        problem(conn, 400, "missing-event", "X-GitHub-Event header is required")

      {:error, :bad_payload} ->
        problem(conn, 400, "bad-payload", "Webhook payload must be a JSON object")
    end
  end

  # Replayed-delivery dedupe, layer 1: the proposals context' webhook_deliveries
  # table (durable, survives Oban Pruner). Oban's unique job key remains as
  # layer 2 for concurrent in-flight deliveries.
  defp dedupe_delivery(conn, delivery) do
    case Semtext.Proposals.record_delivery(delivery.delivery_id, delivery.event) do
      :duplicate ->
        Logger.info("github_webhook: duplicate delivery #{delivery.delivery_id} ignored")
        json(conn |> put_status(202), %{ok: true, duplicate: true})

      :new ->
        enqueue_delivery(conn, delivery)

      {:error, changeset} ->
        Logger.error("github_webhook: delivery record failed for #{delivery.delivery_id}: #{inspect(changeset.errors)}")
        problem(conn, 500, "enqueue-failed", "Could not record the webhook delivery")
    end
  end

  defp enqueue_delivery(conn, %{event: "ping"} = delivery) do
    Logger.info("github_webhook: ping received (delivery #{delivery.delivery_id})")
    json(conn |> put_status(202), %{ok: true, ping: true})
  end

  defp enqueue_delivery(conn, delivery) do
    args = %{
      "delivery_id" => delivery.delivery_id,
      "event" => delivery.event,
      "action" => delivery.action,
      "payload" => delivery.payload
    }

    case GithubWebhookWorker.new(args) |> Oban.insert() do
      {:ok, %Oban.Job{conflict?: true}} ->
        # Replayed delivery — dedupe no-op, still acknowledge to GitHub.
        Logger.info("github_webhook: duplicate delivery #{delivery.delivery_id} ignored")
        json(conn |> put_status(202), %{ok: true, duplicate: true})

      {:ok, _job} ->
        json(conn |> put_status(202), %{ok: true})

      {:error, changeset} ->
        Logger.error("github_webhook: enqueue failed for delivery #{delivery.delivery_id}: #{inspect(changeset.errors)}")
        problem(conn, 500, "enqueue-failed", "Could not queue the webhook delivery")
    end
  end

  # -- plumbing -----------------------------------------------------------

  defp header(conn, name) do
    case get_req_header(conn, name) do
      [value | _] -> value
      [] -> nil
    end
  end

  defp problem(conn, status, type_suffix, title) do
    body = %{
      type: @problem_type_base <> type_suffix,
      title: title,
      status: status
    }

    conn
    |> put_resp_content_type("application/problem+json")
    |> put_status(status)
    |> json(body)
  end
end
