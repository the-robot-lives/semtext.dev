import React from "react";

/*
 * Shared left-menu layout for the reference pages (/elements/, /docs/),
 * Tailwind-docs style: sticky sidebar, content column on the right.
 * Pure server component — no client JS. The same sample-docs and
 * integration lists feed the Scope section's "Open the showcase" menu,
 * so the menu and this sidebar never drift.
 */

export const SHOWCASE = "http://localhost:4173";

export interface SampleDoc {
  label: string;
  note: string;
  href?: string;
  planned?: boolean;
}

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    label: "Vocabulary demo",
    href: `${SHOWCASE}/demo/`,
    note: "every element on one page",
  },
  {
    label: "Reading demo",
    href: `${SHOWCASE}/demo/reading.html`,
    note: "sem-reader chrome over a long document",
  },
  {
    label: "Reading on Lit",
    href: `${SHOWCASE}/demo/reading-lit.html`,
    note: "the same document on the Lit tier",
  },
  {
    label: "Standalone Lit components",
    href: `${SHOWCASE}/demo/standalone-lit.html`,
    note: "sem-* custom elements, no document shell",
  },
  {
    label: "Markdown renderer",
    href: `${SHOWCASE}/demo/md-only.html`,
    note: "sem-md alone, without the rest of the bundle",
  },
  {
    label: "Data visualizers",
    href: `${SHOWCASE}/site/#try`,
    note: "shipped in the tui bundle today",
  },
  {
    label: "Flashcards & quizzes",
    href: `${SHOWCASE}/demo/#facts-list`,
    note: "sem-facts as flip cards and scored quizzes",
  },
  {
    label: "Embeds & linking",
    note: "sem-embed composition — spec'd, demo pending",
    planned: true,
  },
];

/*
 * Every product below is live and linked, but the SemText hookups the add-on
 * descriptions promise are planned — none is shipped yet, so each row carries
 * the planned pill. Statuses verified 2026-10-13 (all four origins serve 200).
 */
export const INTEGRATIONS: SampleDoc[] = [
  {
    label: "The Robot Learns",
    href: "https://therobotlearns.com",
    note: "live app; courses as SemText with per-user quiz tracking is the planned add-on",
    planned: true,
  },
  {
    label: "The Robot Plans",
    href: "https://therobotplans.com",
    note: "live app; issue submission into Jira, ClickUp or GitHub is the planned add-on",
    planned: true,
  },
  {
    label: "The Robot Knows",
    href: "https://therobotknows.com",
    note: "live app; the knowledge-base hookup is the planned add-on",
    planned: true,
  },
  {
    label: "Draftamo",
    href: "https://draftamo.com",
    note: "live app; mockups and UML renders from hosted projects or local XML is the planned add-on",
    planned: true,
  },
];

const GROUPS: Array<{
  title: string;
  items: Array<{ key: string; label: string; href: string }>;
}> = [
  {
    title: "Reference",
    items: [{ key: "elements", label: "Elements", href: "/elements/" }],
  },
  {
    title: "Guides",
    items: [
      { key: "getting-started", label: "Getting started", href: "/docs/#getting-started" },
      { key: "samples", label: "Sample docs", href: "/docs/#samples" },
    ],
  },
  {
    title: "Platform",
    items: [
      { key: "addons", label: "Add Ons", href: "/#addons" },
      { key: "extend", label: "Extend", href: "/#extend" },
      { key: "scope", label: "Scope", href: "/#scope" },
    ],
  },
];

export function DocsShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-docs gap-10 px-4 pb-24 pt-12 sm:px-6">
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav aria-label="Docs" className="sticky top-24 flex flex-col gap-7">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="g-nav-title">{group.title}</p>
              <ul className="mt-1.5 flex flex-col" role="list">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      aria-current={item.key === active ? "page" : undefined}
                      className={
                        "g-nav-link" + (item.key === active ? " is-active" : "")
                      }
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** A themed block of raw SemText markup, rendered server-side. */
export function Sem({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      data-sem-theme="minimal-tech-light"
      data-color-mode="dark"
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
