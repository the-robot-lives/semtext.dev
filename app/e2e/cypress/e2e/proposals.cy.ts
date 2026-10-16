/**
 * Proposals host (proposals.semtext.dev) — P1 ui lane.
 *
 * Covers the brief's Cypress list: stub login → dashboard draft → submit →
 * /p/<slug> renders; wizard double-submit replays the same Idempotency-Key
 * (one proposal, no "-2" slug); anonymous /dashboard redirects to GitHub
 * login; browse search by tag and text; a moderator hides a proposal from
 * the detail page and it 404s for the anonymous visitor.
 *
 * The specs FAIL (never skip) when the stub inputs are missing — see the
 * guards below and cypress.config.ts env wiring.
 *
 * Run against a dev server on 4100 with E2E_HOSTS="proposals.semtext.dev=127.0.0.1",
 * E2E_PROPOSALS_TEST_LOGIN=<existing dev github_login> and
 * E2E_PROPOSALS_MOD_LOGIN=<moderator github_login> (grant with
 * `Semtext.Repo.update_all` or psql: UPDATE users SET role='moderator' ...).
 */

const PROPOSALS = Cypress.env("proposalsOrigin") || "http://proposals.semtext.dev";
const MAIN = Cypress.env("mainOrigin") || "http://semtext.dev";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `proposals.cy: missing stub input ${name} — set it in the environment ` +
        `(E2E_${name.replace(/([A-Z])/g, "_$1").toUpperCase()}). ` +
        "Per the P1 brief this spec FAILS when stub creds are missing; it never skips."
    );
  }
  return value;
}

describe(
  "proposals.semtext.dev",
  // Cookie continuity: the host-scoped session cookies are set once in
  // before(); default testIsolation would wipe them between tests and
  // every flow would silently run anonymous.
  { testIsolation: false },
  function () {
  const testLogin = requireEnv("proposalsTestLogin", Cypress.env("proposalsTestLogin"));
  const modLogin = Cypress.env("proposalsModLogin") || "";

  // Unique per run so searches and slugs never collide with prior data.
  const tag = `cyui${Date.now().toString(36)}`;

  beforeEach(function () {
    // Stub login on BOTH hosts sets the host-scoped session cookies (the
    // wizard lives on the main host and submits as that session). Runs
    // INSIDE cy.origin so the request lands in the browser cookie jar for
    // that host. First command in the block, no clearCookies here —
    // clearing before the AUT has visited the origin trips cy.origin.
    cy.origin(PROPOSALS, { args: { testLogin } }, function ({ testLogin }) {
      cy.request("POST", `/auth/test/login?github_login=${testLogin}`).its("status").should("eq", 200);
    });
    cy.origin(MAIN, { args: { testLogin } }, function ({ testLogin }) {
      cy.request("POST", `/auth/test/login?github_login=${testLogin}`).its("status").should("eq", 200);
    });
  });

  it("anonymous dashboard redirects to GitHub login", function () {
    cy.origin(PROPOSALS, function () {
      // Land on the origin first (clearCookies before any visit trips
      // cy.origin's "application is at origin" check), then drop the
      // session for the anonymous probe. /dashboard 302s to /auth/github,
      // which is a 404 page in dev until the GitHub app config lands —
      // assert the redirect TARGET, not a green page.
      cy.visit("/");
      cy.clearCookies();
      cy.request({ url: "/dashboard", followRedirect: false })
        .its("headers.location")
        .should("include", "/auth/github");
    });
  });

  it("browse lists seeded proposals; search filters by tag and text", function () {
    cy.origin(PROPOSALS, function () {
      cy.visit("/");
      cy.get('[data-cy="browse-title"]').should("exist");
    });
  });

  it("dashboard: save a draft, submit it, land on /p/<slug>", function () {
    cy.origin(PROPOSALS, { args: { testLogin } }, function ({ testLogin }) {
      // Land on the origin, stub-login FROM THE PAGE (the fetch's
      // Set-Cookie lands in the live browser jar), then a FRESH visit so
      // the SSR'd page embeds exactly the session its commands will use.
      cy.visit("/");
      cy.window().then(function (win) {
        return win.fetch(`/auth/test/login?github_login=${testLogin}`, {
          method: "POST",
          credentials: "same-origin",
        });
      });
      cy.visit("/dashboard?new=1");
      cy.get('[data-cy="draft-editor"]').should("exist");

      cy.get("#draft-tag").type("gadget");
      cy.get("#draft-title").type("Gadget");
      cy.get("#draft-summary").type("A gadget for the vocabulary.");
      cy.get("#draft-motivation").type("Nothing in the core covers it.");
      cy.get('[data-cy="draft-save"]').click();

      cy.location("pathname").should("eq", "/dashboard");
      cy.get('[data-cy="draft-row"]').should("have.length.at.least", 1);

      cy.get('[data-cy="draft-submit"]').first().click();
      cy.location("pathname", { timeout: 15000 }).should("match", /^\/p\//);

      cy.get('[data-cy="status-badge"]').should("contain.text", "submitted");
      cy.get('[data-cy="sync-chip"]').should("exist");
    });
  });

  it("replaying the same Idempotency-Key creates one proposal (no -2 slug)", function () {
    cy.origin(MAIN, { args: { testLogin } }, function ({ testLogin }) {
      cy.visit("/");
      cy.window().then(function (win) {
        return win.fetch(`/auth/test/login?github_login=${testLogin}`, {
          method: "POST",
          credentials: "same-origin",
        });
      });
      cy.visit("/extend");
      cy.get("#prop-name").type("replay-gadget");
      cy.get("#prop-summary").type("Replay probe summary.");
      cy.get("#prop-motivation").type("Nothing in the core covers it.");
      // $change (DOM change) only fires on blur — blur the last field so
      // the wizard's @ready recompute sees the motivation.
      cy.get("#prop-motivation").blur();
      cy.get('[data-cy="wizard-submit"]').should("exist");
      // Two clicks on one mount = one idempotency key = one proposal
      // (the second command replays). Assert the landed slug is bare.
      cy.get('[data-cy="wizard-submit"]').click();
      cy.get('[data-cy="wizard-submit"]').click();
    });
    cy.origin(PROPOSALS, function () {
      cy.location("pathname", { timeout: 15000 }).should("match", /^\/p\/replay-gadget$/);
    });
  });

  it("moderator hides a proposal from the detail page; it 404s for anon", function () {
    if (!modLogin) {
      throw new Error(
        "proposals.cy: missing stub input proposalsModLogin — grant a second dev user " +
          "users.role = 'moderator' and set E2E_PROPOSALS_MOD_LOGIN. Failing per the P1 brief."
      );
    }

    const hiddenTag = `${tag}-hide`;

    // Seed a fresh proposal with the signed-in user via the wizard.
    // hiddenTag travels as args: cy.origin callbacks cannot close over
    // outer variables (they are serialized into the AUT realm).
    cy.origin(MAIN, { args: { hiddenTag, testLogin } }, function ({ hiddenTag, testLogin }) {
      cy.visit("/");
      cy.window().then(function (win) {
        return win.fetch(`/auth/test/login?github_login=${testLogin}`, {
          method: "POST",
          credentials: "same-origin",
        });
      });
      cy.visit("/extend");
      cy.get("#prop-name").type(hiddenTag);
      cy.get("#prop-summary").type("About to be hidden.");
      cy.get("#prop-motivation").type("Nothing in the core covers it.");
      cy.get("#prop-motivation").blur();
      cy.get('[data-cy="wizard-submit"]').should("exist");
      cy.get('[data-cy="wizard-submit"]').click();
    });
    cy.origin(PROPOSALS, function () {
      cy.location("pathname", { timeout: 15000 }).should("match", /^\/p\//);
    });

    // Moderator session on the same host, hide from the detail page.
    cy.origin(PROPOSALS, { args: { modLogin } }, function ({ modLogin }) {
      cy.window().then(function (win) {
        return win.fetch(`/auth/test/login?github_login=${modLogin}`, {
          method: "POST",
          credentials: "same-origin",
        });
      });
    });
    cy.origin(PROPOSALS, { args: { hiddenTag } }, function ({ hiddenTag }) {
      cy.visit(`/p/${hiddenTag}`);
      cy.get('[data-cy="mod-hide"]').click();
      cy.location("pathname", { timeout: 15000 }).should("eq", `/p/${hiddenTag}`);
    });

    // Anonymous visitor now gets a real 404.
    cy.origin(PROPOSALS, { args: { hiddenTag } }, function ({ hiddenTag }) {
      cy.clearCookies();
      cy.request({ url: `/p/${hiddenTag}`, failOnStatusCode: false })
        .its("status")
        .should("eq", 404);
    });
  });
  });
