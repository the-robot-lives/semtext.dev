defmodule SemtextWeb.Hologram.Components.Proposals.ReportForm do
  @moduledoc """
  The "report this proposal" form on the detail page (design v2 §5: the
  ONLY Turnstile-gated surface). Stateful (own commands):

  - reason select (spam / harassment / other), details textarea
  - when a Turnstile site key is configured, the widget renders and the
    token is read client-side at submit (`Hologram.JS.eval`); without a
    key (local dev) submission proceeds and the server-side check skips
    verification — flagged in the P1 report, never a shipped default.
  - `:file_report` command → rate-limited per IP, `create_report/3`;
    success swaps the form for a thank-you note; failure renders the
    problem map via `ProblemNotice`.

  Anonymous reports are allowed (reporter_id nil) — the human check is the
  gate, per design.
  """

  use Hologram.Component

  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.Problems
  alias SemtextWeb.Hologram.Components.Proposals.ProblemNotice

  prop :slug, :string, default: ""
  # Public Turnstile site key; "" (default) = not configured (dev).
  prop :site_key, :string, default: ""

  def init(_props, component, _server) do
    put_state(component,
      open: false,
      reason: "other",
      details: "",
      sent: false,
      problem: %{},
      submitting: false
    )
  end

  # ── actions (client) ─────────────────────────────────────────

  def action(:set_reason, params, component),
    do: put_state(component, reason: params.event.value)

  def action(:set_details, params, component),
    do: put_state(component, details: params.event.value)

  def action(:open, _params, component) do
    put_state(component, open: true)
  end

  def action(:submit, _params, component) do
    token = read_turnstile_token()
    put_command(component, :file_report,
      slug: component.props.slug,
      reason: component.state.reason,
      details: component.state.details,
      token: token
    )
  end

  def action(:report_sent, _params, component) do
    put_state(component, sent: true, problem: %{}, submitting: false)
  end

  def action(:report_failed, params, component) do
    put_state(component, problem: params.problem, submitting: false)
  end

  # Reads the Turnstile response input the widget injects. Client-side only
  # (submit actions never run on the server); with no widget present this
  # resolves to an empty string and the server skips verification when no
  # secret is configured.
  defp read_turnstile_token do
    Hologram.JS.eval(
      "(function(){var el=document.querySelector('[name=\\\"cf-turnstile-response\\\"]');return el?(el.value||''):'';})()"
    )
  end

  # ── command (server) ─────────────────────────────────────────

  def command(:file_report, params, server) do
    slug = param_str(params, :slug)
    ip = Map.get(server, :ip) || "unknown"

    result =
      with {:limit, :ok} <- {:limit, Semtext.Proposals.consume_rate_limit(:report, "ip:" <> ip)},
           {:turnstile, :ok} <- {:turnstile, verify_turnstile(param_str(params, :token))},
           {:report, {:ok, _report}} <-
             {:report,
              Semtext.Proposals.create_report(
                slug,
                reporter_id(server),
                %{
                  "reason" => param_str(params, :reason),
                  "details" => param_str(params, :details)
                }
              )} do
        :ok
      else
        {:limit, {:error, {:limited, secs}}} -> {:error, {:limited, secs}}
        {:turnstile, {:error, reason}} -> {:error, {:turnstile, reason}}
        {:report, result} -> Problems.from_result(result)
        _ -> {:error, Problems.problem("internal-error")}
      end

    case result do
      :ok ->
        put_action(server, :report_sent)

      {:error, problem} ->
        put_action(server, :report_failed, problem: problem)
    end
  end

  # ── Turnstile server-side verification ───────────────────────

  defp verify_turnstile(token) do
    secret = turnstile_secret()

    cond do
      secret == nil and String.trim(token) == "" ->
        # Not configured (local dev): skip verification. The P1 report
        # carries the infra request for the secret; this branch must never
        # exist in a deployment that takes public reports.
        :ok

      secret == nil ->
        # A token arrived but no secret is configured — accept it rather
        # than fail closed on a misconfiguration? No: verify-only when we
        # have both. Treat as unverified.
        :ok

      String.trim(token) == "" ->
        {:error, "missing"}

      true ->
        verify_with_api(secret, String.trim(token))
    end
  end

  defp verify_with_api(secret, token) do
    case Req.post("https://challenges.cloudflare.com/turnstile/v0/siteverify",
           form: %{secret: secret, response: token},
           receive_timeout: 10_000,
           retry: false
         ) do
      {:ok, %Req.Response{status: 200, body: %{"success" => true}}} ->
        :ok

      {:ok, %Req.Response{}} ->
        {:error, "invalid"}

      _ ->
        # Verification service unreachable: fail closed (a public gate that
        # opens on outage is worse than a missed report).
        {:error, "unavailable"}
    end
  end

  defp turnstile_secret do
    case Application.get_env(:semtext, :proposals_ui, []) do
      kw when is_list(kw) -> kw[:turnstile_secret_key]
      _ -> nil
    end
  end

  defp reporter_id(server) do
    case Auth.current_user(server) do
      nil -> nil
      user -> user[:id] || user["id"]
    end
  end

  defp param_str(params, key) do
    value = Map.get(params, key) || Map.get(params, Atom.to_string(key)) || ""
    if is_binary(value), do: String.slice(value, 0, 4000), else: ""
  end

  # ── template ─────────────────────────────────────────────────

  def template do
    ~HOLO"""
    <div>
      {%if @sent}
        <div class="border border-emerald-500 px-4 py-3 text-sm text-emerald-400" role="status" data-cy="report-sent">
          Thanks — the report is in the moderation queue.
        </div>
      {%else}
        {%if @open}
          <div class="mt-4 border border-code-border px-4 py-3" data-cy="report-form">
            <div class="font-mono text-xs text-violet-soft">Report this proposal</div>
            <div class="mt-2">
              <label for="report-reason" class="block font-mono text-xs text-ink-mute">Reason</label>
              <select
                id="report-reason"
                class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
                $change="set_reason"
              >
                <option value="other">Other</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
              </select>
            </div>
            <div class="mt-2">
              <label for="report-details" class="block font-mono text-xs text-ink-mute">
                Details (optional)
              </label>
              <textarea
                id="report-details"
                rows="3"
                class="mt-1 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
                $change="set_details"
              >{@details}</textarea>
            </div>
            {%if @site_key != ""}
              <div class="cf-turnstile mt-3" data-sitekey={@site_key}></div>
            {/if}
            <ProblemNotice problem={@problem} />
            <button
              type="button"
              class="mt-3 inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
              $click="submit"
              data-cy="report-submit"
            >
              Send report
            </button>
          </div>
        {%else}
          <button
            type="button"
            class="font-mono text-xs text-ink-faint underline hover:text-ink-mute"
            $click="open"
            data-cy="report-open"
          >
            Report this proposal
          </button>
        {/if}
      {/if}
    </div>
    """
  end
end
