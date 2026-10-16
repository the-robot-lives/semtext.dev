defmodule SemtextWeb.Hologram.Pages.ShowcaseAgentPage do
  @moduledoc """
  /showcase/agent/ — port of the Next site's `app/showcase/agent/page.tsx`:
  the bare agent record (name, bio, instructions) plus the facts it answers
  from, each with a citable id — a contract a human can audit.
  """

  use Hologram.Page

  alias SemtextWeb.Docs.Highlighter
  alias SemtextWeb.Docs.NavGroups
  alias SemtextWeb.Hologram.Components.Site.ExampleViewer
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFooter
  alias SemtextWeb.Hologram.Components.Site.ShowcaseFrame
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/showcase/agent"

  layout SiteLayout,
    page_title: "Agent — SemText showcase",
    description:
      "An agent record in SemText: name, bio and instructions as machine-facing metadata, plus the facts the agent answers from, each with a citable id.",
    canonical: "https://semtext.dev/showcase/agent/"

  @example ~S"""
  <sem-enhanced-document>
    <agent>
      <name>Auth Desk</name>
      <bio>Answers authentication questions from the facts on this page.</bio>
      <instructions>Answer only from sem-fact ids; cite the id with every answer. If no fact covers the question, say so.</instructions>
    </agent>

    <h1 data-kind="title">Auth desk</h1>

    <p>The records this agent answers from:</p>

    <sem-facts view-as="list">
      <sem-fact id="a-hdr" kind="concept">
        <statement>Where does the OIDC token travel?</statement>
        <conclusion>In the Authorization header, as a bearer token.</conclusion>
      </sem-fact>
      <sem-fact id="a-store" kind="anti-pattern">
        <statement>Where should a browser keep tokens?</statement>
        <conclusion>Memory or an httpOnly cookie — localStorage is readable by any script on the page.</conclusion>
      </sem-fact>
    </sem-facts>

    <sem-reveal summary="Which fact covers token storage?" collapsed>
      a-store — the anti-pattern record above; cite it for any question about where a browser keeps tokens.
    </sem-reveal>
  </sem-enhanced-document>
  """

  def init(_params, component, _server) do
    put_state(component,
      groups: NavGroups.groups(),
      lines: Highlighter.numbered_lines(@example),
      # raw source for ExampleViewer data-sem-html (template @example = state key)
      example: @example
    )
  end

  def template do
    ~HOLO"""
    <ShowcaseFrame slug="agent" title="An agent record, and what it may assert" groups={@groups} sections={[%{id: "example", label: "The document"}, %{id: "why", label: "Why this works"}]}>
      <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        A SemText document can carry its own agent: the{" "}
        <code class="font-mono">agent</code> element holds a name, a
        one-line bio and the instructions the model must follow, and the
        document body holds exactly what those instructions may draw on.
        The contract is auditable by a human — the instructions say
        “cite fact ids”, and the facts are right there with
        their ids.
      </p>

      <section id="example" class="mt-10 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p class="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          The agent element is inert to the browser and a record to the
          extractor — it never renders, which is why the visible page reads
          as the answerable material alone.
        </p>
        <ExampleViewer cid="example-viewer" id="agent" label="agent example" filename="agent.md" caption="authored SemText" lines={@lines} renderable={true} raw={@example} />
      </section>

      <section id="why" class="mt-14 scroll-mt-24">
        <h2 class="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code class="font-mono">statement</code> and{" "}
            <code class="font-mono">conclusion</code> children make every
            fact an assertable pair — the conclusion is the citable takeaway.
          </li>
          <li>
            The <code class="font-mono">id</code> attribute is a stable
            anchor: a <code class="font-mono">#a-store</code> deep link
            reaches the fact through any closed reveal.
          </li>
          <li>
            <code class="font-mono">sem-reveal</code> is the
            non-assertive counterpart to the fact pair — a disclosure, not a
            claim extraction would return.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code class="font-mono">agent</code>,{" "}
        <code class="font-mono">sem-facts</code>,{" "}
        <code class="font-mono">sem-reveal</code>. Their contracts live on{" "}
        <a href="/reference/" class="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
    """
  end
end
