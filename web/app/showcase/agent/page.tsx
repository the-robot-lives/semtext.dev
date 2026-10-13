import type { Metadata } from "next";
import { ExampleViewer } from "@/components/example-viewer";
import {
  ShowcaseFooter,
  ShowcaseFrame,
} from "@/components/showcase-page";

export const metadata: Metadata = {
  title: "Agent — SemText showcase",
  description:
    "An agent record in SemText: name, bio and instructions as machine-facing metadata, plus the facts the agent answers from, each with a citable id.",
  alternates: { canonical: "https://semtext.dev/showcase/agent/" },
};

/*
 * Spec vocabulary used: the bare agent record and its name/bio/instructions
 * parts, sem-facts/sem-fact with ids, sem-reveal for the agent-facing FAQ.
 */

const EXAMPLE = `<sem-enhanced-document>
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
</sem-enhanced-document>`;

export default function AgentShowcasePage() {
  return (
    <ShowcaseFrame
      slug="agent"
      title="An agent record, and what it may assert"
      lede={
        <>
          A SemText document can carry its own agent: the{" "}
          <code className="font-mono">agent</code> element holds a name, a
          one-line bio and the instructions the model must follow, and the
          document body holds exactly what those instructions may draw on.
          The contract is auditable by a human — the instructions say
          &ldquo;cite fact ids&rdquo;, and the facts are right there with
          their ids.
        </>
      }
      sections={[
        { id: "example", label: "The document" },
        { id: "why", label: "Why this works" },
      ]}
    >
      <section id="example" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          The document
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          The agent element is inert to the browser and a record to the
          extractor — it never renders, which is why the visible page reads
          as the answerable material alone.
        </p>
        <ExampleViewer name="agent" code={EXAMPLE} renderable={true} />
      </section>

      <section id="why" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Why this works
        </h2>
        <ul className="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code className="font-mono">statement</code> and{" "}
            <code className="font-mono">conclusion</code> children make every
            fact an assertable pair — the conclusion is the citable takeaway.
          </li>
          <li>
            The <code className="font-mono">id</code> attribute is a stable
            anchor: a <code className="font-mono">#a-store</code> deep link
            reaches the fact through any closed reveal.
          </li>
          <li>
            <code className="font-mono">sem-reveal</code> is the
            non-assertive counterpart to the fact pair — a disclosure, not a
            claim extraction would return.
          </li>
        </ul>
      </section>

      <ShowcaseFooter>
        Elements used: <code className="font-mono">agent</code>,{" "}
        <code className="font-mono">sem-facts</code>,{" "}
        <code className="font-mono">sem-reveal</code>. Their contracts live on{" "}
        <a href="/reference/" className="text-violet-soft underline-offset-4 hover:underline">
          the reference pages
        </a>
        .
      </ShowcaseFooter>
    </ShowcaseFrame>
  );
}
