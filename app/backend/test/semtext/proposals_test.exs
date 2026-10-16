defmodule Semtext.ProposalsTest do
  # async: false — the submit path now enqueues the github-sync Oban job inline
  # (testing: :inline) and the worker reads the GLOBAL `Semtext.Github` app env;
  # must serialize against the github-sync lane's env-mutating test modules.
  use Semtext.DataCase, async: false

  alias Semtext.Proposals
  alias Semtext.Proposals.{DiscussionLink, Proposal, ProposalVersion, RateLimit, RateLimitEvent}
  alias Semtext.Github.InstallationToken
  alias Semtext.Github.Sync

  @mod System.unique_integer([:positive])

  defp now, do: DateTime.utc_now()

  defp user_fixture do
    n = System.unique_integer([:positive])

    {1, [%{id: raw}]} =
      Repo.insert_all(
        "users",
        [
          %{
            email: "u#{n}-#{@mod}@test.dev",
            inserted_at: now(),
            updated_at: now()
          }
        ],
        returning: [:id]
      )

    {:ok, id} = Ecto.UUID.cast(raw)
    id
  end

  defp valid_attrs(tag \\ "widget") do
    %{
      "element_tag" => tag,
      "title" => "Better #{tag}",
      "summary" => "A summary for #{tag}.",
      "motivation" => "Because #{tag} matters.",
      "options" => [%{"label" => "a"}],
      "example" => "example text"
    }
  end

  defp submit!(user_id, attrs \\ nil, key \\ nil) do
    {:ok, proposal, :created} =
      Proposals.create_and_submit(user_id, attrs || valid_attrs(), key)

    proposal
  end

  defp moderator_viewer, do: %{user_id: user_fixture(), moderator: true}

  # ── Submit / idempotency ─────────────────────────────────────────────────

  test "create_and_submit happy path: submitted row + version 1 + pending link + audit event" do
    uid = user_fixture()

    {:ok, proposal, :created} =
      Proposals.create_and_submit(uid, valid_attrs("gadget"), "idem-1")

    assert proposal.status == :submitted
    assert proposal.slug == "gadget"
    assert proposal.submitter_id == uid

    {:ok, v1} = Proposals.get_version("gadget", 1)
    assert v1.title == proposal.title
    assert v1.version == 1

    expected_sha =
      :sha256
      |> :crypto.hash(ProposalVersion.canonical_files(%{}))
      |> Base.encode16(case: :lower)

    assert v1.files_sha256 == expected_sha
    assert proposal.current_version_id == v1.id

    assert {:ok, %{state: :pending}} = Proposals.discussion_link_for(proposal.id)

    assert {:ok, events} = Proposals.moderation_events("gadget")
    assert [%{event: :status_change, from_status: :draft, to_status: :submitted}] = events
  end

  test "files round-trip: sha256 covers canonical file set" do
    uid = user_fixture()
    files = %{"b.txt" => "two", "a.txt" => "one"}

    {:ok, proposal, :created} =
      Proposals.create_and_submit(uid, Map.put(valid_attrs("files"), "files", files), nil)

    {:ok, v1} = Proposals.get_version("files", 1)

    expected =
      :sha256
      |> :crypto.hash(ProposalVersion.canonical_files(files))
      |> Base.encode16(case: :lower)

    assert v1.files_sha256 == expected
    assert v1.files == files
    assert proposal.current_version_id == v1.id
  end

  test "idempotency replay returns the ORIGINAL proposal with :replayed" do
    uid = user_fixture()

    {:ok, first, :created} = Proposals.create_and_submit(uid, valid_attrs("idem"), "key-1")

    # Different attrs, same key → original wins.
    {:ok, replayed, :replayed} =
      Proposals.create_and_submit(uid, valid_attrs("other"), "key-1")

    assert replayed.id == first.id
    assert replayed.slug == "idem"

    # Third call — still the same row.
    {:ok, again, :replayed} = Proposals.create_and_submit(uid, valid_attrs("z"), "key-1")
    assert again.id == first.id
  end

  test "slug uniquification: second submit of the same tag gets -2" do
    uid = user_fixture()
    uid2 = user_fixture()

    p1 = submit!(uid, valid_attrs("dupe"))
    {:ok, p2, :created} = Proposals.create_and_submit(uid2, valid_attrs("dupe"), nil)

    assert p1.slug == "dupe"
    assert p2.slug == "dupe-2"
  end

  test "validation failures return changesets without inserting" do
    uid = user_fixture()

    {:error, cs} = Proposals.create_and_submit(uid, %{"element_tag" => "x"}, nil)
    assert errors_on(cs)[:title]

    {:error, cs} =
      Proposals.create_and_submit(
        uid,
        Map.put(valid_attrs("Bad Tag"), "element_tag", "Bad Tag"),
        nil
      )

    assert errors_on(cs)[:element_tag]

    {:error, cs} =
      Proposals.create_and_submit(
        uid,
        Map.put(valid_attrs("big"), "example", String.duplicate("a", 64 * 1024 + 1)),
        nil
      )

    assert errors_on(cs)[:example]

    assert {:error, :not_found} = Proposals.get_by_slug("x", nil)
  end

  test "oversized files are rejected and roll the whole submit back" do
    uid = user_fixture()

    attrs =
      valid_attrs("bigfiles")
      |> Map.put("files", %{"huge.bin" => String.duplicate("x", 256 * 1024 + 1)})

    {:error, cs} = Proposals.create_and_submit(uid, attrs, nil)
    assert errors_on(cs)[:files]
    assert {:error, :not_found} = Proposals.get_by_slug("bigfiles", nil)
  end

  # ── Draft lifecycle ──────────────────────────────────────────────────────

  test "draft lifecycle: save -> edit -> submit -> visible publicly" do
    uid = user_fixture()

    {:ok, draft} = Proposals.save_draft(uid, valid_attrs("drafty"))
    assert draft.status == :draft
    assert draft.slug == "drafty"

    {:ok, edited} =
      Proposals.update_draft(uid, "drafty", %{"title" => "Renamed draft"})

    assert edited.title == "Renamed draft"

    {:ok, submitted} = Proposals.submit_draft(uid, "drafty")
    assert submitted.status == :submitted

    {:ok, v1} = Proposals.get_version("drafty", 1)
    assert v1.title == "Renamed draft"

    assert {:ok, _} = Proposals.get_by_slug("drafty", nil)

    # Drafts only edit pre-submit.
    assert {:error, :invalid_transition} =
             Proposals.update_draft(uid, "drafty", %{"title" => "too late"})
  end

  test "update_draft/submit_draft are owner-scoped (stranger gets :not_found)" do
    uid = user_fixture()
    stranger = user_fixture()

    {:ok, _} = Proposals.save_draft(uid, valid_attrs("mine"))

    assert {:error, :not_found} =
             Proposals.update_draft(stranger, "mine", %{"title" => "hijack"})

    assert {:error, :not_found} = Proposals.submit_draft(stranger, "mine")
  end

  test "withdraw: draft and submitted rows -> withdrawn + audit event" do
    uid = user_fixture()

    {:ok, _} = Proposals.save_draft(uid, valid_attrs("gone"))
    assert {:ok, w1} = Proposals.withdraw(uid, "gone")
    assert w1.status == :withdrawn

    p = submit!(uid, valid_attrs("gone-too"))
    assert {:ok, w2} = Proposals.withdraw(uid, p.slug)
    assert w2.status == :withdrawn

    assert {:error, :invalid_transition} = Proposals.withdraw(uid, p.slug)

    assert {:ok, events} = Proposals.moderation_events("gone-too")
    assert Enum.any?(events, &(&1.event == :status_change and &1.to_status == :withdrawn))
  end

  # ── Visibility ───────────────────────────────────────────────────────────

  test "visibility matrix: drafts for owner+moderator only; hidden for moderator only" do
    owner = user_fixture()
    stranger = user_fixture()
    mod = moderator_viewer()

    {:ok, draft} = Proposals.save_draft(owner, valid_attrs("secret"))
    assert {:ok, _} = Proposals.get_by_slug("secret", %{user_id: owner, moderator: false})
    assert {:ok, _} = Proposals.get_by_slug("secret", mod)
    assert {:error, :not_found} = Proposals.get_by_slug("secret", nil)
    assert {:error, :not_found} = Proposals.get_by_slug("secret", %{user_id: stranger})

    p = submit!(owner)
    {:ok, _} = Proposals.hide(%{system: "spam-heuristic"}, p.slug, "wizard hit")

    assert {:ok, _} = Proposals.get_by_slug(p.slug, mod)
    assert {:error, :not_found} = Proposals.get_by_slug(p.slug, nil)
    # Even the owner loses a hidden row (moderators only).
    assert {:error, :not_found} = Proposals.get_by_slug(p.slug, %{user_id: owner})

    assert {:ok, _} = Proposals.unhide(%{system: "undo"}, p.slug)

    assert {:ok, _} = Proposals.get_by_slug(p.slug, %{user_id: stranger})
    _ = draft
  end

  # ── List / search / pagination ───────────────────────────────────────────

  test "list: default newest, status narrowing, public-only for anon" do
    uid = user_fixture()
    a = submit!(uid, valid_attrs("aaa"))
    submit!(uid, valid_attrs("bbb"))
    submit!(uid, valid_attrs("ccc"))

    {:ok, page} = Proposals.list_proposals(%{}, nil)
    assert page.has_more == false
    assert page.next_cursor == nil
    assert length(page.items) == 3
    assert hd(page.items).slug == "ccc"

    {:ok, page} = Proposals.list_proposals(%{status: :submitted}, nil)
    assert length(page.items) == 3

    # Anon can never widen into non-public statuses.
    {:ok, page} = Proposals.list_proposals(%{status: [:draft, :withdrawn]}, nil)
    assert page.items == []

    # Moderator narrows within their wider view.
    {:ok, page} = Proposals.list_proposals(%{status: :submitted}, moderator_viewer())
    assert length(page.items) == 3
    _ = a
  end

  test "list: tag filter + full-text q" do
    uid = user_fixture()
    submit!(uid, valid_attrs("tagone"))
    submit!(uid, valid_attrs("tagtwo"))
    submit!(uid, %{
      "element_tag" => "searchable",
      "title" => "Quantum flux capacitor",
      "summary" => "s",
      "motivation" => "m"
    })

    {:ok, page} = Proposals.list_proposals(%{tag: "tagone"}, nil)
    assert [%{slug: "tagone"}] = page.items

    {:ok, page} = Proposals.list_proposals(%{q: "quantum flux"}, nil)
    assert [%{slug: "searchable"}] = page.items

    {:ok, page} = Proposals.list_proposals(%{q: "zzzznomatch"}, nil)
    assert page.items == []
  end

  test "list: cursor pagination walks without repeats" do
    uid = user_fixture()

    for tag <- ~w(p1a p1b p1c p1d p1e), do: submit!(uid, valid_attrs(tag))

    {:ok, page1} = Proposals.list_proposals(%{limit: 2}, nil)
    assert length(page1.items) == 2
    assert page1.has_more

    {:ok, page2} = Proposals.list_proposals(%{limit: 2, after: page1.next_cursor}, nil)
    assert length(page2.items) == 2

    {:ok, page3} = Proposals.list_proposals(%{limit: 2, after: page2.next_cursor}, nil)
    assert length(page3.items) == 1
    refute page3.has_more

    slugs =
      for p <- page1.items ++ page2.items ++ page3.items, uniq: true do
        p.slug
      end

    assert length(slugs) == 5
  end

  test "list: discussed sort orders by comment_count desc, cursor preserved" do
    uid = user_fixture()
    p1 = submit!(uid, valid_attrs("hot"))
    submit!(uid, valid_attrs("cold"))
    {:ok, _} = Proposals.record_discussion_created(p1.id, %{discussion_number: 7})
    {:ok, _} = Proposals.record_discussion_sync(p1.id, %{comment_count: 12})

    {:ok, page} = Proposals.list_proposals(%{sort: :discussed}, nil)
    assert hd(page.items).slug == "hot"

    {:ok, page2} = Proposals.list_proposals(%{sort: "discussed", limit: 1}, nil)
    assert hd(page2.items).slug == "hot"

    {:ok, next} = Proposals.list_proposals(%{sort: :discussed, limit: 1, after: page2.next_cursor}, nil)
    assert hd(next.items).slug == "cold"
  end

  test "list: invalid cursor degrades to first page (no error leak)" do
    uid = user_fixture()
    submit!(uid, valid_attrs("cur"))

    {:ok, page} = Proposals.list_proposals(%{after: "not-a-cursor!!"}, nil)
    assert length(page.items) == 1
  end

  test "owner_proposals: own rows only, drafts included" do
    uid = user_fixture()
    other = user_fixture()

    {:ok, _} = Proposals.save_draft(uid, valid_attrs("own-draft"))
    submit!(uid, valid_attrs("own-live"))
    submit!(other, valid_attrs("theirs"))

    {:ok, items} = Proposals.owner_proposals(uid)
    slugs = Enum.map(items, & &1.slug) |> Enum.sort()
    assert slugs == ["own-draft", "own-live"]
  end

  test "list_forks: public children of a parent, hidden excluded" do
    uid = user_fixture()
    parent = submit!(uid, valid_attrs("parent"))

    Repo.insert!(%Proposal{
      slug: "kid",
      element_tag: "kid",
      title: "t",
      summary: "s",
      motivation: "m",
      status: :submitted,
      submitter_id: uid,
      forked_from_proposal_id: parent.id,
      inserted_at: now(),
      updated_at: now()
    })

    Repo.insert!(%Proposal{
      slug: "hidden-kid",
      element_tag: "hidden-kid",
      title: "t",
      summary: "s",
      motivation: "m",
      status: :submitted,
      submitter_id: uid,
      forked_from_proposal_id: parent.id,
      hidden_at: now(),
      inserted_at: now(),
      updated_at: now()
    })

    {:ok, forks} = Proposals.list_forks("parent")
    assert Enum.map(forks, & &1.slug) == ["kid"]
  end

  # ── Moderation ───────────────────────────────────────────────────────────

  test "change_status walks the moderator lifecycle and audits each step" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("lifecycle"))
    mod = %{system: "mod-bot"}

    assert {:ok, s1} = Proposals.change_status(mod, p.slug, :under_review, "taking a look")
    assert s1.status == :under_review

    assert {:ok, s2} = Proposals.change_status(mod, p.slug, :accepted, nil)
    assert s2.status == :accepted

    assert {:ok, s3} = Proposals.change_status(mod, p.slug, :merged, nil)
    assert s3.status == :merged

    assert {:error, :invalid_transition} = Proposals.change_status(mod, p.slug, :under_review)

    assert {:error, :invalid_transition} =
             Proposals.change_status(mod, p.slug, :withdrawn)

    assert {:ok, events} = Proposals.moderation_events(p.slug)
    tos = Enum.map(events, & &1.to_status)
    assert tos == [:merged, :accepted, :under_review, :submitted]
  end

  test "change_status: unknown slug -> :not_found" do
    assert {:error, :not_found} =
             Proposals.change_status(%{system: "sys"}, "nope-nope", :under_review)
  end

  test "moderation_events: unknown slug -> :not_found" do
    assert {:error, :not_found} = Proposals.moderation_events("nope-nope")
  end

  test "moderation_queue: hidden, reported and sync_failed buckets" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("queued"))

    # Report while it is still live (hidden rows 404 to the report endpoint).
    {:ok, live} = Proposals.create_report(p.slug, nil, %{"reason" => "spam", "details" => "d"})
    assert live.status == :open

    {:ok, _} = Proposals.hide(%{system: "sys"}, p.slug, "spam")

    {:ok, q} = Proposals.moderation_queue()
    assert Enum.map(q.hidden, & &1.slug) == [p.slug]
    assert length(q.reported) == 1
    assert hd(q.reported).id == live.id
    assert q.sync_failed == []
  end

  test "moderation_queue: sync_failed bucket lists failed links" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("flaky"))

    for _ <- 1..5, do: {:ok, _} = Proposals.record_discussion_failure(p.id, "boom")

    {:ok, q} = Proposals.moderation_queue()
    assert Enum.map(q.sync_failed, & &1.slug) == [p.slug]
  end

  # ── Reports ──────────────────────────────────────────────────────────────

  test "reports: create (anon + authed), public-visible target gate, resolve" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("reportme"))
    mod = moderator_viewer()

    {:ok, r1} = Proposals.create_report(p.slug, nil, %{"reason" => "spam"})
    assert r1.status == :open

    {:ok, r2} =
      Proposals.create_report(p.slug, uid, %{"reason" => "harassment", "details" => "mean"})

    {:ok, report} = Proposals.resolve_report(mod, r1.id, :resolved)
    assert report.status == :resolved

    {:ok, open} = Proposals.list_reports(:open)
    assert Enum.map(open, & &1.id) == [r2.id]

    assert {:error, :not_found} =
             Proposals.resolve_report(mod, Ecto.UUID.generate(), :dismissed)

    # Draft target is not publicly visible -> no report.
    {:ok, _} = Proposals.save_draft(uid, valid_attrs("unreported"))
    assert {:error, :not_found} = Proposals.create_report("unreported", nil, %{"reason" => "spam"})
  end

  # ── Discussion sync ──────────────────────────────────────────────────────

  test "discussion created -> ok state with number/url; failure never flips an ok link" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("linked"))

    {:ok, link} =
      Proposals.record_discussion_created(p.id, %{
        discussion_number: 42,
        node_id: "D_nk_1",
        url: "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/42",
        category: "proposals"
      })

    assert link.state == :ok
    assert link.discussion_number == 42

    {:ok, same} = Proposals.record_discussion_failure(p.id, "late webhook error")
    assert same.state == :ok
  end

  test "failure increments attempts; state -> failed at configured max; retry resets" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("retryme"))

    {:ok, l1} = Proposals.record_discussion_failure(p.id, "boom 1")
    assert l1.state == :pending
    assert l1.attempts == 1

    {:ok, l2} = Proposals.record_discussion_failure(p.id, "boom 2")
    assert l2.state == :pending
    assert l2.attempts == 2

    {:ok, l3} = Proposals.record_discussion_failure(p.id, "boom 3")
    assert l3.state == :pending
    assert l3.attempts == 3

    {:ok, l4} = Proposals.record_discussion_failure(p.id, "boom 4")
    assert l4.state == :pending
    assert l4.attempts == 4

    {:ok, l5} = Proposals.record_discussion_failure(p.id, "boom 5")
    assert l5.state == :failed
    assert l5.attempts == 5
    assert l5.last_error =~ "boom 5"

    {:ok, retried} = Proposals.retry_discussion(p.id)
    assert retried.state == :pending
    assert retried.attempts == 5

    # retry_discussion on a pending link is a no-op; unknown id -> :not_found
    {:ok, same} = Proposals.retry_discussion(p.id)
    assert same.state == :pending
    assert {:error, :not_found} = Proposals.retry_discussion(Ecto.UUID.generate())
  end

  test "pending_discussions returns pending links oldest-first" do
    uid = user_fixture()
    a = submit!(uid, valid_attrs("pending-a"))
    b = submit!(uid, valid_attrs("pending-b"))

    {:ok, pending} = Proposals.pending_discussions(10)
    ids = Enum.map(pending, & &1.proposal_id)
    assert a.id in ids and b.id in ids
  end

  test "record_discussion_sync updates counts + last_synced_at without touching state" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("synced"))

    {:ok, link} =
      Proposals.record_discussion_sync(p.id, %{comment_count: 3, reactions: %{"+1" => 2}})

    assert link.comment_count == 3
    assert link.reactions == %{"+1" => 2}
    assert link.state == :pending
    assert link.last_synced_at

    assert {:error, %Ecto.Changeset{}} =
             Proposals.record_discussion_sync(Ecto.UUID.generate(), %{comment_count: 1})
  end

  # ── Webhook dedupe ───────────────────────────────────────────────────────

  test "record_delivery: first is :new, replay is :duplicate" do
    delivery = "d-#{@mod}"
    assert :new = Proposals.record_delivery(delivery, "discussion")
    assert :duplicate = Proposals.record_delivery(delivery, "discussion")
    assert :new = Proposals.record_delivery("d-#{@mod}-other", "push")
  end

  # ── Rate limits ──────────────────────────────────────────────────────────

  test "rate limit: bucket exhausts, other subjects unaffected, window expiry frees" do
    uid = user_fixture()
    uid2 = user_fixture()

    for _ <- 1..5, do: assert :ok = Proposals.consume_rate_limit(:submit, uid)

    assert {:error, {:limited, secs}} = Proposals.consume_rate_limit(:submit, uid)
    assert is_integer(secs) and secs > 0

    assert :ok = Proposals.consume_rate_limit(:submit, uid2)

    # Backdate the window away (submit window = 1h) -> subject is free again.
    old = DateTime.add(DateTime.utc_now(), -7200, :second)

    Repo.update_all(
      from(e in RateLimitEvent, where: e.subject == ^uid),
      set: [inserted_at: old]
    )

    assert :ok = Proposals.consume_rate_limit(:submit, uid)
  end

  test "rate limit: buckets are independent; prune drops stale rows only" do
    uid = user_fixture()

    assert :ok = Proposals.consume_rate_limit(:report, "ip:1.2.3.4")

    stale = %RateLimitEvent{
      bucket: "report",
      subject: "ip:9.9.9.9",
      inserted_at: DateTime.add(DateTime.utc_now(), -26 * 3600, :second)
    }

    Repo.insert!(stale)
    fresh = %RateLimitEvent{bucket: "report", subject: "ip:8.8.8.8", inserted_at: now()}
    Repo.insert!(fresh)

    count = RateLimit.prune()
    assert count >= 1

    assert Repo.one(from e in RateLimitEvent, where: e.subject == "ip:9.9.9.9") == nil
    assert Repo.one(from e in RateLimitEvent, where: e.subject == "ip:8.8.8.8")
    _ = uid
  end

  test "rate_buckets contract shape" do
    buckets = Proposals.rate_buckets()
    assert %{limit: 5, window_seconds: 3600} = buckets.submit
    assert %{limit: 10, window_seconds: 3600} = buckets.report
    assert %{limit: 10, window_seconds: 86_400} = buckets.fork
    assert %{limit: 120, window_seconds: 60} = buckets.read
  end

  # ── Discussion enqueue on submit + `removed` state (coordinator 2026-10-17)
  #
  # Oban runs `testing: :inline` in tests: jobs execute synchronously and NO
  # oban_jobs rows persist, so enqueue behavior is asserted through outcomes
  # (chip states) — the acceptance describe runs the worker against the REAL
  # port + stubbed HTTP.

  test "submit survives an unconfigured GitHub: commits with a pending chip" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("enq-me"))

    assert {:ok, %{discussion: link}} = Proposals.get_by_slug(p.slug, nil)
    assert link.state == :pending
  end

  test "idempotency replay does not disturb the original's chip" do
    uid = user_fixture()
    attrs = valid_attrs("replay-enq")

    {:ok, p1, :created} = Proposals.create_and_submit(uid, attrs, "key-enq-1")
    {:ok, p2, :replayed} = Proposals.create_and_submit(uid, attrs, "key-enq-1")

    assert p2.id == p1.id

    assert {:ok, %{discussion: link}} = Proposals.get_by_slug(p1.slug, nil)
    assert link.state == :pending
  end

  test "slug-collision retry still submits both survivors cleanly" do
    uid = user_fixture()
    uid2 = user_fixture()

    p1 = submit!(uid, valid_attrs("enq-clash"))
    {:ok, p2, :created} = Proposals.create_and_submit(uid2, valid_attrs("enq-clash"), nil)

    assert p1.slug == "enq-clash"
    assert p2.slug == "enq-clash-2"

    assert {:ok, %{discussion: l1}} = Proposals.get_by_slug(p1.slug, nil)
    assert {:ok, %{discussion: l2}} = Proposals.get_by_slug(p2.slug, nil)
    assert l1.state == :pending and l2.state == :pending
  end

  test "submit_draft: no link while a draft; pending link created at submit" do
    uid = user_fixture()

    {:ok, draft} = Proposals.save_draft(uid, valid_attrs("draft-enq"))
    assert {:ok, %{discussion: nil}} = Proposals.get_by_slug("draft-enq", %{user_id: uid})

    {:ok, _submitted} = Proposals.submit_draft(uid, "draft-enq")

    assert {:ok, %{discussion: link}} = Proposals.get_by_slug("draft-enq", nil)
    assert link.proposal_id == draft.id
    assert link.state == :pending
  end

  test "recreate_discussion: removed -> pending with a fresh budget; other states refused" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("recreate-1"))

    {:ok, _} =
      Proposals.record_discussion_created(p.id, %{
        discussion_number: 9,
        node_id: "D_rec_1",
        url: "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/9"
      })

    {:ok, _} = Proposals.record_discussion_removed(p.id, "deleted on GitHub")

    {:ok, link} = Proposals.recreate_discussion(p.id)
    assert link.state == :pending
    assert link.attempts == 0
    assert is_nil(link.last_error)
    # Old coordinates cleared — they point at a deleted discussion.
    assert is_nil(link.discussion_number) and is_nil(link.node_id) and is_nil(link.url)

    # Only a removed link can be recreated.
    q = submit!(uid, valid_attrs("recreate-2"))
    assert {:error, :invalid_transition} = Proposals.recreate_discussion(q.id)
    assert {:error, :not_found} = Proposals.recreate_discussion(Ecto.UUID.generate())
  end

  test "record_discussion_removed: ok -> removed; pending/failed are stale-webhook no-ops" do
    uid = user_fixture()
    p = submit!(uid, valid_attrs("removed-1"))

    {:ok, _link} =
      Proposals.record_discussion_created(p.id, %{
        discussion_number: 7,
        node_id: "D_rem_1",
        url: "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/7",
        category: "proposals"
      })

    {:ok, removed} = Proposals.record_discussion_removed(p.id, "deleted on GitHub")
    assert removed.state == :removed
    assert removed.last_error =~ "deleted on GitHub"
    # The old coordinates stay for the audit story until a recreate clears them.
    assert removed.discussion_number == 7

    # A discussion that never existed cannot be "removed" — a stale webhook
    # must not suppress creation.
    q = submit!(uid, valid_attrs("removed-2"))
    {:ok, still} = Proposals.record_discussion_removed(q.id, "stale webhook")
    assert still.state == :pending

    assert {:error, %Ecto.Changeset{}} = Proposals.record_discussion_removed(Ecto.UUID.generate())
  end

  describe "acceptance: outage -> pending chip -> retry lands (real port, stubbed HTTP)" do
    setup do
      InstallationToken.clear()

      base = Application.get_env(:semtext, Semtext.Github, [])

      Application.put_env(
        :semtext,
        Semtext.Github,
        Keyword.merge(base,
          app_id: "123",
          app_private_key: JOSE.JWK.generate_key({:rsa, 2048}) |> JOSE.JWK.to_pem() |> elem(1),
          installation_id: "456",
          repository_id: "R_repo",
          discussion_category_id: "DIC_proposals",
          repository_owner: "noizu-labs-ml",
          repository_name: "npl-enhanced-content",
          http_client: __MODULE__.GithubStubClient
        )
      )

      # Default: FORCED GITHUB OUTAGE (transport refused = transient).
      :persistent_term.put({__MODULE__, :gh_reply}, {:error, {:transport, :econnrefused}})

      on_exit(fn ->
        InstallationToken.clear()
        :persistent_term.erase({__MODULE__, :gh_reply})

        if base == [] do
          Application.delete_env(:semtext, Semtext.Github)
        else
          Application.put_env(:semtext, Semtext.Github, base)
        end
      end)

      :ok
    end

    test "forced outage: proposal visible with a pending chip; retry lands the discussion" do
      uid = user_fixture()

      assert {:ok, p, :created} = Proposals.create_and_submit(uid, valid_attrs("outage-1"), nil)

      # The inline job already failed transiently; the submit itself survived.
      assert {:ok, %{proposal: prop, discussion: link}} = Proposals.get_by_slug("outage-1", nil)
      assert prop.id == p.id and prop.status == :submitted
      assert link.state == :pending

      # Retry with GitHub healthy — the discussion lands, chip flips to ok.
      set_gh_reply(
        {:ok, 200,
         %{
           "data" => %{
             "createDiscussion" => %{
               "discussion" => %{
                 "id" => "D_outage",
                 "number" => 11,
                 "url" => "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/11",
                 "title" => "t"
               }
             }
           }
         }}
      )

      assert {:ok, _job} = Sync.retry_discussion(p.id)

      assert {:ok, %{discussion: ok_link}} = Proposals.get_by_slug("outage-1", nil)
      assert ok_link.state == :ok
      assert ok_link.discussion_number == 11
      assert ok_link.node_id == "D_outage"
      assert is_nil(ok_link.last_error)
    end

    test "never auto-recreate: retry against a removed link is a no-op; recreate lands it" do
      uid = user_fixture()
      p = submit!(uid, valid_attrs("norecreate"))

      set_gh_reply(created_reply(12))

      assert {:ok, _job} = Sync.retry_discussion(p.id)
      assert {:ok, %{discussion: link}} = Proposals.get_by_slug("norecreate", nil)
      assert link.state == :ok

      # Webhook says the discussion was deleted.
      {:ok, _} = Proposals.record_discussion_removed(p.id, "deleted on GitHub")

      # A stray retry/job MUST NOT recreate it.
      assert {:ok, _job} = Sync.retry_discussion(p.id)
      assert {:ok, %{discussion: still_removed}} = Proposals.get_by_slug("norecreate", nil)
      assert still_removed.state == :removed

      # The moderator action is the only way back.
      assert {:ok, recreated} = Proposals.recreate_discussion(p.id)
      assert recreated.state == :pending

      assert {:ok, %{discussion: landed}} = Proposals.get_by_slug("norecreate", nil)
      assert landed.state == :ok
      assert landed.discussion_number == 12
    end

    test "healthy GitHub: the submit itself lands the discussion inline" do
      uid = user_fixture()

      set_gh_reply(created_reply(21))

      assert {:ok, p, :created} = Proposals.create_and_submit(uid, valid_attrs("healthy-1"), "key-h")

      # The enqueue runs inside the submit transaction (testing: :inline) — the
      # discussion exists by the time submit returns.
      assert {:ok, %{discussion: link}} = Proposals.get_by_slug(p.slug, nil)
      assert link.state == :ok
      assert link.discussion_number == 21
      assert is_nil(link.last_error)

      # A replay of the same idempotency key creates nothing further.
      {:ok, p2, :replayed} = Proposals.create_and_submit(uid, valid_attrs("healthy-1"), "key-h")
      assert p2.id == p.id
      assert {:ok, %{discussion: same}} = Proposals.get_by_slug(p.slug, nil)
      assert same.discussion_number == 21
    end

    defp created_reply(number) do
      {:ok, 200,
       %{
         "data" => %{
           "createDiscussion" => %{
             "discussion" => %{
               "id" => "D_n#{number}",
               "number" => number,
               "url" =>
                 "https://github.com/noizu-labs-ml/npl-enhanced-content/discussions/#{number}",
               "title" => "t"
             }
           }
         }
       }}
    end

    defp set_gh_reply(reply), do: :persistent_term.put({__MODULE__, :gh_reply}, reply)
  end

  defmodule GithubStubClient do
    @moduledoc false
    @behaviour Semtext.Github.Client

    @token_reply {:ok, 201, %{"token" => "ghs_test", "expires_at" => "2099-01-01T00:00:00Z"}}

    @impl true
    def post(url, _headers, _body) do
      if String.contains?(to_string(url), "/access_tokens") do
        @token_reply
      else
        case :persistent_term.get({Semtext.ProposalsTest, :gh_reply}, nil) do
          nil -> {:ok, 500, "no reply configured"}
          reply -> reply
        end
      end
    end
  end

  # ── Contract constants ───────────────────────────────────────────────────

  test "lifecycle constants match the API contract" do
    assert Proposals.public_statuses() == [:submitted, :under_review, :accepted, :merged]
    assert Proposals.owner_transitions() == %{draft: [:submitted, :withdrawn], submitted: [:withdrawn]}

    assert Proposals.moderator_transitions() == %{
             submitted: [:under_review, :declined],
             under_review: [:accepted, :declined],
             accepted: [:merged]
           }
  end

  # ── helpers ──────────────────────────────────────────────────────────────

  defp errors_on(cs) do
    Ecto.Changeset.traverse_errors(cs, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
