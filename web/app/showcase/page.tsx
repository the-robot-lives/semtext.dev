import type { Metadata } from "next";
import { SHOWCASE_ITEMS } from "@/components/docs-shell";

export const metadata: Metadata = {
  title: "Showcase — SemText",
  description:
    "Real use cases worked in SemText: repo guidance, documentation, onboarding, agent records, command and skill files, data viewers, embedding and the interactive shell — every example is authored SemText, rendered live.",
  alternates: { canonical: "https://semtext.dev/showcase/" },
};

/*
 * Index of the showcase section: one card per page under /showcase/<slug>/.
 * The list itself is SHOWCASE_ITEMS (components/docs-shell.tsx) — the same
 * array the sidebar and the landing menu use, so the three cannot drift.
 */

export default function ShowcaseIndexPage() {
  return (
    <div className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p className="g-eyebrow">Showcase</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          One format, real jobs
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          Each page is one use case worked in SemText — a document an agent
          and a human read from the same file. Every example is authored
          SemText built only from tags the spec defines, with a source toggle
          so you can see the markup doing the work.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2" role="list">
          {SHOWCASE_ITEMS.map((d) => (
            <li key={d.slug}>
              <a
                href={d.href ?? "/showcase/"}
                className="group block h-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3.5 transition-colors hover:border-white/30 hover:bg-white/[0.06]"
              >
                <span className="block font-mono text-sm text-ink group-hover:text-white">
                  {d.label}
                </span>
                <span className="mt-1.5 block text-sm leading-6 text-ink-mute">
                  {d.note}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
