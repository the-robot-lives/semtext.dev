import React from "react";

/*
 * Shared left-menu layout for the reference pages (/elements/, /docs/),
 * Tailwind-docs style: sticky sidebar, content column, and an optional
 * examples rail beside it. Pure server component — no client JS.
 *
 * The showcase list below feeds both this sidebar's Showcase group and the
 * landing page's "Open the showcase" menu, so the two cannot drift. Each
 * entry is a section of the landing page on this site (no separate
 * showcase origin). The demo documents are not reachable from here —
 * there is no /demo/ tree on this site.
 */

export interface ShowcaseItem {
  label: string;
  note: string;
  href?: string;
  planned?: boolean;
}

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    label: "Try views",
    href: "/#try",
    note: "the view toggle live — list, flashcards, quiz",
  },
  {
    label: "Reading",
    href: "/#reading",
    note: "previews, backlinks, sort and filter, live",
  },
  {
    label: "Surface sizes",
    href: "/#surface",
    note: "measured sizes of the scripts and stylesheets",
  },
  {
    label: "Data visualizer",
    href: "/dataviz/",
    note: "tables from inline, CSV and YAML sources — sort, views, join, editable query, live",
  },
];

/*
 * Every product below is live and linked, but the SemText hookups the add-on
 * descriptions promise are planned — none is shipped yet, so each row carries
 * the planned pill. Statuses verified 2026-10-13 (all four origins serve 200).
 */
export const INTEGRATIONS: ShowcaseItem[] = [
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
    title: "Guides",
    items: [{ key: "cli", label: "CLI commands", href: "/docs/" }],
  },
  {
    title: "Reference",
    items: [{ key: "elements", label: "Elements", href: "/elements/" }],
  },
  {
    title: "Showcase",
    items: SHOWCASE_ITEMS.map((d) => ({
      key: `showcase-${d.label.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      label: d.label,
      href: d.href as string,
    })),
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
  sections,
  examples,
  groups,
  children,
}: {
  active: string;
  /** The doc's own sections — rendered as an "On this page" anchor group. */
  sections?: Array<{ id: string; label: string }>;
  /** Optional rail beside the main column (doc listings, rendered SemText). */
  examples?: React.ReactNode;
  /**
   * Override the default nav groups (a page that needs its own sidebar
   * inventory — /reference/ lists every element tag by family). Falls back
   * to the shared GROUPS above.
   */
  groups?: Array<{
    title: string;
    items: Array<{ key: string; label: string; href: string }>;
  }>;
  children: React.ReactNode;
}) {
  const navGroups = groups ?? GROUPS;
  return (
    <div className="mx-auto flex w-full max-w-docs gap-10 px-4 pb-24 pt-12 sm:px-6">
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav aria-label="Docs" className="sticky top-24 flex flex-col gap-7">
          {navGroups.map((group) => (
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
          {sections && sections.length > 0 && (
            <div>
              <p className="g-nav-title">On this page</p>
              <ul className="mt-1.5 flex flex-col" role="list">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="g-nav-link">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
      {examples ? (
        <aside
          aria-label="Examples"
          className="mt-14 w-full shrink-0 border-t border-white/10 pt-10 lg:mt-0 lg:w-72 lg:border-t-0 lg:pt-0"
        >
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            {examples}
          </div>
        </aside>
      ) : null}
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
