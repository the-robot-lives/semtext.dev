defmodule SemtextWeb.Hologram.Components.Site.VocabProposalWizard do
  @moduledoc """
  Drafts a vocabulary proposal and SUBMITS it in place (P1: the same-origin
  command path — design v2 §5, decision D4): the submit button fires the
  `:submit_proposal` command straight to `Semtext.Proposals.create_and_submit/3`
  (no cross-origin POST, no CORS), then navigates to the new proposal's
  `/p/<slug>` page on proposals.semtext.dev. The idempotency key is
  generated once at mount and reused across retries — a replay returns the
  original (API.md §5). Failures render the problem+json map via
  `ProblemNotice` (429 carries the retry seconds; anonymous visitors get a
  GitHub-login prompt instead of the button — the server command re-checks
  auth either way).

  The GitHub-issue fallback link is a plain constant (no prefill): the
  prefilled URL needed client-side `encodeURIComponent` and the resulting
  NativeValue corrupted the wizard's VDOM patch (fields reset, bindings
  died on the ready flip). The same-origin command submit is the primary
  path; D5 removes the fallback once it is verified end to end.
  The name normaliser is shared with the scaffold wizard
  (`VocabScaffoldWizard.parse_namespace/1`) — one implementation, no drift.
  """

  use Hologram.Component

  alias Semtext.Hologram.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.{Fields, Problems}
  alias Semtext.Proposals
  alias SemtextWeb.Hologram.Components.Proposals.ProblemNotice
  alias SemtextWeb.Hologram.Components.Site.VocabScaffoldWizard

  @issue_base "https://github.com/noizu-labs-ml/npl-enhanced-content/issues/new"

  def init(_props, component, server) do
    put_state(component,
      name: "",
      summary: "",
      motivation: "",
      attrs: "",
      example: "",
      tag: "",
      ready: false,
      # Same-origin submit (P1): identity + a mount-time idempotency key
      # that survives retries within the session.
      signed_in: Auth.current_user(server) != nil,
      # Server-computed (Application env is not client-transpilable): with
      # GITHUB_CLIENT_ID unset the submit gate renders the disabled
      # "Sign in coming soon" state instead of a dead /auth/github link.
      github_enabled: Application.get_env(:semtext, :github_enabled, false),
      idempotency_key: Ecto.UUID.generate(),
      submitting: false,
      problem: %{}
    )
  end

  # -- actions ------------------------------------------------------------------

  # $change params shape: the runtime wraps the control's value under
  # :event (params.event.value) — params.value raises KeyError on any real
  # input event (same latent bug fixed in VocabScaffoldWizard).
  def action(:set_name, params, component), do: recompute(component, %{name: params.event.value})

  def action(:set_summary, params, component),
    do: recompute(component, %{summary: params.event.value})

  def action(:set_motivation, params, component),
    do: recompute(component, %{motivation: params.event.value})

  def action(:set_attrs, params, component),
    do: recompute(component, %{attrs: params.event.value})

  def action(:set_example, params, component),
    do: recompute(component, %{example: params.event.value})

  def action(:submit, _params, component) do
    s = component.state

    put_command(component, :submit_proposal,
      fields: %{
        tag: s.tag,
        summary: s.summary,
        motivation: s.motivation,
        attrs: s.attrs,
        example: s.example
      },
      idempotency_key: s.idempotency_key
    )
  end

  # Commands cannot 302 (the client runtime has no redirect handling for
  # command responses) — submit raises a :goto action instead; the action
  # runs client-side and navigates to the proposals host. The URL is always
  # server-built (validated slug + configured origin), so quoting is safe.
  def action(:goto, params, component) do
    Hologram.JS.exec("window.location.assign('" <> params.url <> "')")
    # The action must return the component struct (the client runtime reads
    # next_action off the return value).
    component
  end

  def action(:submit_failed, params, component) do
    put_state(component, problem: params.problem, submitting: false)
  end

  # ── command (server) — same-origin submit ────────────────────

  def command(:submit_proposal, params, server) do
    case Auth.current_user(server) do
      nil ->
        put_action(server, :submit_failed,
          problem: Problems.problem("unauthenticated")
        )

      user ->
        case Proposals.consume_rate_limit(:submit, user.id) do
          :ok ->
            fields = Fields.from_wizard(Map.get(params, :fields) || %{})
            idem = command_key(params)

            case Problems.from_result(Proposals.create_and_submit(user.id, fields, idem)) do
              {:ok, proposal} ->
                put_action(server, :goto, url: proposals_origin() <> "/p/" <> proposal.slug)

              {:error, problem} ->
                put_action(server, :submit_failed, problem: problem)
            end

          {:error, {:limited, secs}} ->
            put_action(server, :submit_failed,
              problem: Problems.problem("rate-limited", %{"retry_after" => secs})
            )

          _ ->
            put_action(server, :submit_failed,
              problem: Problems.problem("internal-error")
            )
        end
    end
  end

  # Submit redirects land on the proposals host's detail page. The origin
  # is configurable (`:semtext, :proposals_ui` → `:origin`, env
  # SEMTEXT_PROPOSALS_ORIGIN) so dev/e2e runs on non-80 ports can point
  # the redirect at the served host:port instead of production.
  defp proposals_origin do
    :semtext
    |> Application.get_env(:proposals_ui, [])
    |> Keyword.get(:origin, "https://proposals.semtext.dev")
  end

  defp command_key(params) do
    key = Map.get(params, :idempotency_key) || Map.get(params, "idempotency_key") || ""

    if is_binary(key) and key != "" do
      String.slice(key, 0, 64)
    else
      Ecto.UUID.generate()
    end
  end

  defp recompute(component, changed) do
    s = Map.merge(component.state, changed)
    tag = VocabScaffoldWizard.parse_namespace(s.name)

    ready =
      valid_tag?(tag) and String.trim(s.summary) != "" and String.trim(s.motivation) != ""

    # NOTE: no client-side URL prefill here. Building the prefilled issue
    # URL with Hologram.JS.eval("encodeURIComponent(...)") hands the state a
    # NativeValue (not a binary); the next patch renders it into an href and
    # the wizard subtree corrupts (fields reset, bindings die). The fallback
    # link is a plain constant in the template instead.
    #
    # `changed` MUST be persisted along with the derived fields: put_state
    # merges, so omitting it here silently kept name/summary/... empty — the
    # controlled-input patch reset every keystroke and `ready` never flipped.
    put_state(component, Map.merge(changed, %{tag: tag, ready: ready}))
  end

  # `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` + must contain a hyphen (custom-element
  # rule). The shared normaliser has already lowercased, collapsed dash runs
  # and stripped the edges, so what is left is: non-empty, leading letter,
  # carries a dash.
  defp valid_tag?(tag) do
    case String.graphemes(tag) do
      [] -> false
      [first | _] -> leading_az?(first) and String.contains?(tag, "-")
    end
  end

  defp leading_az?("a"), do: true
  defp leading_az?("b"), do: true
  defp leading_az?("c"), do: true
  defp leading_az?("d"), do: true
  defp leading_az?("e"), do: true
  defp leading_az?("f"), do: true
  defp leading_az?("g"), do: true
  defp leading_az?("h"), do: true
  defp leading_az?("i"), do: true
  defp leading_az?("j"), do: true
  defp leading_az?("k"), do: true
  defp leading_az?("l"), do: true
  defp leading_az?("m"), do: true
  defp leading_az?("n"), do: true
  defp leading_az?("o"), do: true
  defp leading_az?("p"), do: true
  defp leading_az?("q"), do: true
  defp leading_az?("r"), do: true
  defp leading_az?("s"), do: true
  defp leading_az?("t"), do: true
  defp leading_az?("u"), do: true
  defp leading_az?("v"), do: true
  defp leading_az?("w"), do: true
  defp leading_az?("x"), do: true
  defp leading_az?("y"), do: true
  defp leading_az?("z"), do: true
  defp leading_az?(_), do: false

  defp body(s, tag) do
    Enum.join(
      [
        "## Element",
        "`" <> tag <> "`",
        "",
        "## Summary",
        String.trim(s.summary),
        "",
        "## Motivation",
        String.trim(s.motivation),
        "",
        "## Options",
        opts_or_none(s.attrs),
        "",
        "## Example",
        "```html",
        String.trim(s.example),
        "```",
        "",
        "— drafted on semtext.dev/extend/"
      ],
      "\n"
    )
  end

  defp opts_or_none(attrs) do
    trimmed = String.trim(attrs)

    if trimmed == "" do
      "_(none proposed)_"
    else
      trimmed
    end
  end



  # -- template ------------------------------------------------------------------

  def template do
    ~HOLO"""
    <div>
      <div class="no-js-only text-sm leading-relaxed text-ink-mute">
        The proposal drafter needs JavaScript. Proposals are vocabulary
        additions to the SemText spec — the element's name, what it is, why
        it cannot be authored with the existing vocabulary, its options, and
        a worked example.
      </div>

      <!--
        NOT gated behind the site's .js-only class: Hologram's client render
        rebuilds the layout's html.no-js literal, which re-hides every
        .js-only surface after hydration (the site-chrome.js flip runs too
        early and is undone). The form degrades gracefully without the gate:
        the submit control is @ready-gated, so no-JS visitors see the fields
        plus the fill hint and no button.
      -->
      <div>
        <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
          <div>
            <label for="prop-name" class="block font-mono text-sm text-violet-soft">
              Element name
            </label>
            <input
              id="prop-name"
              type="text"
              value={@name}
              placeholder="yelp-sem-review-summary"
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_name"
            />
          </div>
          <div>
            <label for="prop-summary" class="block font-mono text-sm text-violet-soft">
              One-line summary
            </label>
            <input
              id="prop-summary"
              type="text"
              value={@summary}
              placeholder="A roll-up of review scores with per-source counts."
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_summary"
            />
          </div>
          <div class="sm:col-span-2">
            <label for="prop-motivation" class="block font-mono text-sm text-violet-soft">
              Why the existing vocabulary cannot express it
            </label>
            <textarea
              id="prop-motivation"
              rows="3"
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_motivation"
            >{@motivation}</textarea>
          </div>
          <div class="sm:col-span-2">
            <label for="prop-attrs" class="block font-mono text-sm text-violet-soft">
              Options — one per line, <code>name — meaning</code>
            </label>
            <textarea
              id="prop-attrs"
              rows="2"
              placeholder={"source — where the scores come from\nkind — summary | histogram"}
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_attrs"
            >{@attrs}</textarea>
          </div>
          <div class="sm:col-span-2">
            <label for="prop-example" class="block font-mono text-sm text-violet-soft">
              Worked example
            </label>
            <textarea
              id="prop-example"
              rows="4"
              placeholder={"<yelp-sem-review-summary source=\"yelp\" kind=\"summary\">\n  4.2 across 3,140 reviews\n</yelp-sem-review-summary>"}
              class="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
              $change="set_example"
            >{@example}</textarea>
          </div>
        </div>

        <ProblemNotice problem={@problem} />

        <div class="mt-6 flex flex-wrap items-center gap-3">
          {%if @ready}
            {%if @signed_in}
              <button
                type="button"
                class="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
                $click="submit"
                data-cy="wizard-submit"
              >
                Submit proposal
              </button>
            {%else}
              {%if @github_enabled}
                <a
                  href="/auth/github"
                  class="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
                  data-cy="wizard-login"
                >
                  Sign in with GitHub to submit
                </a>
              {%else}
                <span
                  class="inline-flex min-h-11 items-center bg-violet/50 px-5 py-2 text-sm font-semibold text-white/80"
                  data-cy="wizard-login-disabled"
                  aria-disabled="true"
                >
                  Sign in coming soon
                </span>
              {/if}
            {/if}
            <a
              href="https://github.com/noizu-labs-ml/npl-enhanced-content/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
            >
              Open as a GitHub issue instead
            </a>
          {%else}
            <span class="font-mono text-xs text-ink-faint" role="status">
              Name, summary and motivation make the draft submittable.
            </span>
          {/if}
          <a
            href="https://github.com/noizu-labs-ml/npl-enhanced-content/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
          >
            Blank issue instead
          </a>
        </div>
        <p class="mt-2 font-mono text-[0.68rem] leading-5 text-ink-faint">
          Submitting publishes the proposal to the review queue on
          proposals.semtext.dev; the GitHub-issue link stays as a fallback
          for anything the form cannot carry (very long examples, say).
        </p>
      </div>
    </div>
    """
  end
end
