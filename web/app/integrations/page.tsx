import type { Metadata } from "next";
import { AddonsCarousel } from "@/components/addons-carousel";
import { INTEGRATIONS } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "Integrations — SemText",
  description:
    "The integrations catalog: ticket embedding, knowledge-base answers, courses and quizzes, Draftamo mockups and UML, issue submission — each wired to its real logic as it is built. The reading and extraction core stays free and static.",
  alternates: { canonical: "https://semtext.dev/integrations/" },
};

/*
 * The Integrations page — the former "Add-ons" landing section, promoted
 * to its own route (the landing section's "More integrations" link points
 * here). Two lists, both shared, neither redefined here:
 *
 *   - AddonsCarousel carries the six integration cards and their mocks
 *     (illustrations of planned output, not screenshots — see its header).
 *   - INTEGRATIONS (components/docs-shell.tsx) lists the four live
 *     portfolio origins whose SemText hookups are planned; the same array
 *     feeds the landing showcase menu, so the two cannot drift.
 */

export default function IntegrationsPage() {
  return (
    <div className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p className="g-eyebrow">Platform</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Documents that do more than read
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          The reading and extraction core is free and static. Integrations
          connect a document to live systems — tickets and knowledge-base
          answers cited inline, quizzes and courses readers work through,
          mockups and UML rendered in place. Each is wired to its real logic
          as it is built, and none change how a document reads.
        </p>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-ink">
          The integrations
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          Six surfaces, one rule: the document stays the record. Each mock
          below is an illustration of planned output, not a screenshot —
          nothing in it claims availability.
        </p>
        <AddonsCarousel />

        <h2 className="mt-14 text-2xl font-semibold tracking-tight text-ink">
          Where they will live
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-mute">
          The portfolio apps the hookups land in first. Every origin below is
          live today; the SemText hookup is the planned part.
        </p>
        <ul className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2" role="list">
          {INTEGRATIONS.map((d) => (
            <li
              key={d.label}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3.5"
            >
              <span className="flex items-baseline justify-between gap-2">
                <a
                  href={d.href}
                  className="font-mono text-sm text-violet-soft underline-offset-4 hover:underline"
                >
                  {d.label}
                </a>
                {d.planned && <b className="g-status">hookup planned</b>}
              </span>
              <span className="mt-1.5 block text-sm leading-6 text-ink-mute">
                {d.note}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
