defmodule SemtextWeb.ProposalsPagesTest do
  @moduledoc """
  SSR-scope tests for the proposals.semtext.dev Hologram surface (P1 ui
  lane): host gating, browse/search, detail visibility + sync chip,
  dashboard/moderation gating, the /extend wizard's signed-in/anon
  states, problem-map helpers, and hydration-payload safety for hostile
  example text.

  Command round-trips (POST /hologram/command with encrypted payloads)
  are exercised by the Cypress specs against a live server; these tests
  pin the server-rendered contract that zero-JS readers depend on.
  """

  use SemtextWeb.ConnCase, async: false

  import Ecto.Query, only: [from: 2]

  alias Semtext.Proposals
  alias Semtext.Repo
  alias Semtext.Test.Auth
  alias SemtextWeb.Hologram.Pages.Proposals.Fields
  alias SemtextWeb.Hologram.Pages.Proposals.Problems

  @mod System.unique_integer([:positive])
  @host "proposals.semtext.dev"

  defp now, do: DateTime.utc_now()

  defp user_fixture(role \\ "user") do
    n = System.unique_integer([:positive])

    {1, [%{id: raw}]} =
      Repo.insert_all(
        "users",
        [
          %{
            email: "ui#{n}-#{@mod}@test.dev",
            role: role,
            inserted_at: now(),
            updated_at: now()
          }
        ],
        returning: [:id]
      )

    %{id: Ecto.UUID.cast!(raw), role: role}
  end

  defp proposal_fixture(user_id, tag, extra \\ []) do
    attrs =
      Map.merge(
        %{
          "element_tag" => tag,
          "title" => "Better #{tag}",
          "summary" => "A summary for #{tag}.",
          "motivation" => "Because #{tag} matters.",
          "options" => [%{"label" => "primary", "meaning" => "the main one"}],
          "example" => "Example for #{tag}."
        },
        Map.new(extra)
      )

    key = "idem-#{@mod}-#{tag}"
    {:ok, proposal, :created} = Proposals.create_and_submit(user_id, attrs, key)
    proposal
  end

  defp host_conn(conn), do: %{conn | host: @host}

  # ConnCase conns carry no cookie-store plumbing; wire the session stack
  # the same way auth_plugs_test does, so Test.Auth.login_as can put_session.
  defp session_conn(conn) do
    conn
    |> Map.put(:secret_key_base, String.duplicate("t", 64))
    |> Plug.Session.call(SemtextWeb.Plugs.Session.init(nil))
    |> fetch_session()
  end

  defp logged_in(conn, user, host \\ @host) do
    conn |> Map.put(:host, host) |> session_conn() |> Auth.login_as(user)
  end

  defp draft_attrs(tag, title) do
    %{
      "element_tag" => tag,
      "title" => title,
      "summary" => "Summary for #{title}.",
      "motivation" => "Motivation for #{title}.",
      "options" => [%{"label" => "a", "meaning" => "b"}],
      "example" => "Example."
    }
  end

  defp set_link_state(proposal_id, state) do
    Repo.update_all(
      from(dl in Semtext.Proposals.DiscussionLink, where: dl.proposal_id == ^proposal_id),
      set: [state: state, updated_at: now()]
    )
  end

  # ── host gating ──────────────────────────────────────────────────────────

  test "HostGuard 404s proposals resolution off the proposals host" do
    guard = &SemtextWeb.Hologram.Pages.Proposals.HostGuard.call/2

    denied = guard.(struct(Hologram.Server, host: "semtext.dev"), [])
    assert denied.status == 404

    allowed = guard.(struct(Hologram.Server, host: @host), [])
    assert allowed.status == nil
  end

  test "browse serves on the proposals host", %{conn: conn} do
    user = user_fixture()
    proposal_fixture(user.id, "anchor")

    conn = conn |> host_conn() |> get("/")
    assert conn.status == 200

    body = html_response(conn, 200)
    assert body =~ "semtext"
    assert body =~ "Better anchor"
  end

  # ── browse search ────────────────────────────────────────────────────────

  test "browse search filters by text (?q=)", %{conn: conn} do
    user = user_fixture()
    proposal_fixture(user.id, "magnet")
    proposal_fixture(user.id, "pulley")

    body =
      conn |> host_conn() |> get("/", %{"q" => "magnet"}) |> html_response(200)

    assert body =~ "Better magnet"
    refute body =~ "Better pulley"
  end

  test "browse search filters by tag (?tag=)", %{conn: conn} do
    user = user_fixture()
    proposal_fixture(user.id, "crank")
    proposal_fixture(user.id, "cog")

    body =
      conn |> host_conn() |> get("/", %{"tag" => "cog"}) |> html_response(200)

    assert body =~ "Better cog"
    refute body =~ "Better crank"
  end

  test "browse empty state renders", %{conn: conn} do
    body = conn |> host_conn() |> get("/", %{"q" => "nothingmatches"}) |> html_response(200)
    assert body =~ "No proposals match"
  end

  # ── detail page ──────────────────────────────────────────────────────────

  test "detail SSR renders overview, version and sync chip (pending)", %{conn: conn} do
    user = user_fixture()
    proposal = proposal_fixture(user.id, "gearbox")

    body =
      conn |> host_conn() |> get("/p/#{proposal.slug}") |> html_response(200)

    assert body =~ "Better gearbox"
    assert body =~ "A summary for gearbox."
    assert body =~ "Sync pending"
    assert body =~ "gearbox"
  end

  test "detail SSR: ok sync state links out; removed state labels", %{conn: conn} do
    user = user_fixture()
    proposal = proposal_fixture(user.id, "winch")

    set_link_state(proposal.id, :ok)
    body = conn |> host_conn() |> get("/p/winch") |> html_response(200)
    assert body =~ "Synced"

    set_link_state(proposal.id, :removed)
    body = conn |> host_conn() |> get("/p/winch") |> html_response(200)
    assert body =~ "Discussion removed"
  end

  test "detail: hidden proposal is a real 404 for anonymous, visible to moderator", %{conn: conn} do
    user = user_fixture()
    proposal = proposal_fixture(user.id, "camshaft")
    moderator = user_fixture("moderator")

    {:ok, _} = Proposals.hide(%{user_id: moderator.id, moderator: true}, "camshaft")

    conn = host_conn(conn)
    assert get(conn, "/p/camshaft").status == 404

    mod_conn = logged_in(build_conn(), moderator)
    assert get(mod_conn, "/p/camshaft").status == 200
  end

  test "detail: draft visible to owner, 404 to strangers", %{conn: conn} do
    user = user_fixture()
    stranger = user_fixture()

    {:ok, _draft} = Proposals.save_draft(user.id, draft_attrs("ratchet", "Ratchet draft"))

    owner_conn = logged_in(build_conn(), user)
    body = get(owner_conn, "/p/ratchet") |> html_response(200)
    assert body =~ "Ratchet draft"

    stranger_conn = logged_in(build_conn(), stranger)
    assert get(stranger_conn, "/p/ratchet").status == 404
  end

  test "detail: unknown slug is a real 404", %{conn: conn} do
    assert get(host_conn(conn), "/p/never-existed").status == 404
  end

  # ── hydration payload safety ─────────────────────────────────────────────

  test "hostile example text cannot break out of the hydration payload", %{conn: conn} do
    user = user_fixture()

    hostile = "</script><script>alert(\"pwned\")</script>"

    proposal = proposal_fixture(user.id, "hostile", %{"example" => hostile})

    body = conn |> host_conn() |> get("/p/#{proposal.slug}") |> html_response(200)

    # The raw hostile markup must never appear unescaped anywhere in the
    # response (neither as HTML text nor inside the hydration payload).
    refute body =~ "<script>alert(\"pwned\")</script>"
    refute body =~ "</script><script>alert"
  end

  # ── dashboard ────────────────────────────────────────────────────────────

  test "dashboard redirects anonymous visitors to GitHub login", %{conn: conn} do
    conn = host_conn(conn) |> get("/dashboard")
    assert redirected_to(conn) == "/auth/github"
  end

  test "dashboard lists drafts and live proposals for the owner", %{conn: conn} do
    user = user_fixture()
    proposal_fixture(user.id, "fulcrum")
    {:ok, _} = Proposals.save_draft(user.id, draft_attrs("pivot", "Pivot draft"))

    conn = logged_in(conn, user)
    body = get(conn, "/dashboard") |> html_response(200)

    assert body =~ "Pivot draft"
    assert body =~ "Better fulcrum"
    assert body =~ "Submit for review"
  end

  # ── moderation ───────────────────────────────────────────────────────────

  test "moderation redirects anonymous visitors to GitHub login", %{conn: conn} do
    conn = host_conn(conn) |> get("/moderation")
    assert redirected_to(conn) == "/auth/github"
  end

  test "moderation redirects non-moderators to browse", %{conn: conn} do
    user = user_fixture()
    conn = logged_in(conn, user) |> get("/moderation")
    assert redirected_to(conn) == "/"
  end

  test "moderation queue lists hidden, reported and failed-sync rows", %{conn: conn} do
    moderator = user_fixture("moderator")
    author = user_fixture()

    proposal = proposal_fixture(author.id, "flywheel")
    {:ok, report} = Proposals.create_report("flywheel", author.id, %{"reason" => "spam", "details" => "ad links"})
    {:ok, _} = Proposals.hide(%{user_id: moderator.id, moderator: true}, "flywheel", "spam")

    # force a failed discussion link
    proposal2 = proposal_fixture(author.id, "sprocket")
    set_link_state(proposal2.id, :failed)

    body = conn |> logged_in(moderator) |> get("/moderation") |> html_response(200)

    assert body =~ "Better flywheel"
    assert body =~ "Better sprocket"
    assert body =~ "spam"
    assert report.id
  end

  # ── /extend wizard ───────────────────────────────────────────────────────

  test "extend page shows the disabled sign-in state when GitHub login is unconfigured", %{conn: conn} do
    # config.exs pins :github_enabled false and test.exs deletes the GitHub
    # client env (CI parity) — anonymous visitors must see the disabled
    # state, never a dead /auth/github link.
    body = conn |> get("/extend") |> html_response(200)
    # "Sign in coming soon" stub copy removed (thread 6a1d418a); the
    # disabled state is the wizard's status line, no dead auth link.
    assert body =~ "Name, summary and motivation make the draft submittable"
    refute body =~ ~s(href="/auth/github")
  end

  test "extend page shows the GitHub login link when GitHub login is configured", %{conn: conn} do
    Application.put_env(:semtext, :github_enabled, true)

    try do
      body = conn |> get("/extend") |> html_response(200)
      assert body =~ "Sign in with GitHub"
      assert body =~ ~s(href="/auth/github")
    after
      Application.put_env(:semtext, :github_enabled, false)
    end
  end

  test "extend page shows the same-origin submit button when signed in", %{conn: conn} do
    user = user_fixture()
    body = conn |> session_conn() |> Auth.login_as(user) |> get("/extend") |> html_response(200)
    # The submit button is readiness-gated (fields fill client-side), so SSR
    # pins the hydrated signed_in state instead; the command path re-checks
    # auth server-side, so this is presentation-only.
    # The hydration payload serialises state as Type.* literals; the
    # proposal wizard's signed_in flag ships as Type.atom("true").
    assert body =~ ~s[Type.atom("signed_in"), Type.atom("true")]
  end

  # ── problem + fields helpers (the SSR problem surface) ───────────────────

  describe "Problems catalogue" do
    test "from_result maps contract errors to the API.md catalogue" do
      assert {:error, %{"status" => 404, "title" => "Not found"}} =
               Problems.from_result({:error, :not_found})

      assert {:error, %{"status" => 403}} = Problems.from_result({:error, :forbidden})
      assert {:error, %{"status" => 401}} = Problems.from_result({:error, :unauthenticated})

      assert {:error, %{"status" => 409, "type" => type}} =
               Problems.from_result({:error, :invalid_transition})

      assert type =~ "invalid-status-transition"

      assert {:error, %{"status" => 429, "retry_after" => secs}} =
               Problems.from_result({:error, {:limited, 42}})

      assert secs >= 0

      cs = Ecto.Changeset.change(%Semtext.Proposals.Proposal{}, %{}) |> Ecto.Changeset.validate_required([:title])

      assert {:error, %{"status" => 422, "errors" => %{"title" => [_msg]}}} =
               Problems.from_result({:error, cs})

      assert {:error, %{"status" => 500}} = Problems.from_result({:error, :boom})
    end

    test "problem/1 accepts catalogue strings (command-path calls)" do
      assert %{"status" => 404, "type" => type} = Problems.problem("not-found")
      assert type =~ "problems/not-found"

      assert %{"status" => 500} = Problems.problem("internal-error")
    end
  end

  describe "Fields" do
    test "from_wizard builds submit attrs from wizard fields" do
      fields =
        Fields.from_wizard(%{
          "tag" => "Lever",
          "summary" => "A bar.",
          "motivation" => "Prying.",
          "attrs" => "length — how long",
          "example" => "Ex."
        })

      assert fields["element_tag"] == "lever"
      assert fields["title"] == "Vocabulary proposal: lever"
      assert fields["options"] == [%{"label" => "length", "meaning" => "how long"}]
      assert fields["summary"] == "A bar."
    end

    test "normalize_tag strips decoration and lowercases" do
      assert Fields.normalize_tag("  Widget — ") == "widget"
    end

    test "from_draft reads draft attrs back into editor fields" do
      fields =
        Fields.from_draft(%{
          "element_tag" => "hinge",
          "title" => "Hinge",
          "summary" => "S.",
          "motivation" => "M.",
          "options" => [%{"label" => "leaf", "meaning" => "a flat part"}],
          "example" => "E."
        })

      assert fields["element_tag"] == "hinge"
      assert fields["options_text"] == "leaf — a flat part"
      assert fields["options"] == [%{"label" => "leaf", "meaning" => "a flat part"}]
    end
  end
end
