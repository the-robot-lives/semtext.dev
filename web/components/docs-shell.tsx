import React from "react";

import { NPL_TAGS, tagHref } from "@/data/reference-tags";
import { REFERENCE_BUCKETS } from "@/data/reference-buckets";

/*
 * Shared left-menu layout for the reference pages (/reference/, /docs/,
 * /showcase/*, /integrations/, /extend/, /themes/), Tailwind-docs style:
 * sticky sidebar, content column, and an optional examples rail beside it.
 * Pure server component — no client JS.
 *
 * Sidebar IA: every link stays inside the docs/reference section of the
 * site — the landing page's sections are marketing surface and are never
 * sidebar targets (no /#… anchors here). SHOWCASE_ITEMS below feeds this
 * sidebar's Showcase group, the landing page's "Open the showcase" menu
 * and the /docs/ sample list, so the three cannot drift: each entry is a
 * real page under /showcase/<slug>/.
 */

export interface ShowcaseItem {
  label: string;
  note: string;
  href?: string;
  planned?: boolean;
  /** URL slug under /showcase/ — also the sidebar key (`showcase-<slug>`). */
  slug?: string;
}

/*
 * One entry per showcase page (web/app/showcase/<slug>/). Every example on
 * those pages is authored SemText built only from tags the spec defines.
 */
export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    slug: "claude-md",
    label: "CLAUDE.md",
    href: "/showcase/claude-md/",
    note: "repo guidance one file serves to an agent and to a human",
  },
  {
    slug: "documentation",
    label: "Documentation",
    href: "/showcase/documentation/",
    note: "long-form docs with callouts, listings and citations",
  },
  {
    slug: "onboarding",
    label: "Onboarding",
    href: "/showcase/onboarding/",
    note: "a checklist that tracks itself — steps, progress, facts",
  },
  {
    slug: "agent",
    label: "Agent",
    href: "/showcase/agent/",
    note: "an agent record and the facts it answers from",
  },
  {
    slug: "command",
    label: "Command",
    href: "/showcase/command/",
    note: "a command spec: arguments, steps, invariants",
  },
  {
    slug: "skill",
    label: "Skill",
    href: "/showcase/skill/",
    note: "a skill file with tabbed reference and examples",
  },
  {
    slug: "data-viewer",
    label: "Data viewer",
    href: "/showcase/data-viewer/",
    note: "sort and filter a table authored in the document",
  },
  {
    slug: "embedding",
    label: "Embedding",
    href: "/showcase/embedding/",
    note: "reuse one document's sections inside another",
  },
  {
    slug: "sem-shell",
    label: "sem-shell",
    href: "/showcase/sem-shell/",
    note: "the interactive terminal element over a virtual file system",
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

export interface NavGroup {
  title: string;
  items: Array<{ key: string; label: string; href: string; dataRef?: string }>;
}

const GITHUB_REPO = "https://github.com/noizu-labs-ml/npl-enhanced-content";

/*
 * The SemText reference group comes from REFERENCE_BUCKETS
 * (web/data/reference-buckets.ts) — one reader-facing group per bucket, in
 * the module's validated display order, with companions and aliases beside
 * their primary tag. NPL tags are not bucketed (one display family) and
 * keep their own group. The bucket module throws at import if a SemText tag
 * is missing from or duplicated across buckets, so the sidebar cannot
 * silently drop an element.
 */
function referenceGroups(): NavGroup[] {
  const bucketGroups: NavGroup[] = REFERENCE_BUCKETS.map((bucket) => ({
    title: bucket.label,
    items: bucket.tags.map((t) => ({
      key: `ref-${t.name}`,
      label: t.name,
      href: tagHref(t.name),
      dataRef: t.name.toLowerCase(),
    })),
  }));
  const nplGroup: NavGroup = {
    title: "NPL elements",
    items: NPL_TAGS.map((t) => ({
      key: `ref-${t.name}`,
      label: t.name,
      href: tagHref(t.name),
      dataRef: t.name.toLowerCase(),
    })),
  };
  return [...bucketGroups, nplGroup];
}

const GROUPS: NavGroup[] = [
  {
    title: "Guides",
    items: [
      { key: "docs", label: "Docs", href: "/docs/" },
      { key: "cli", label: "CLI commands", href: "/docs/#cli-commands" },
    ],
  },
  ...referenceGroups(),
  {
    title: "Showcase",
    items: SHOWCASE_ITEMS.map((d) => ({
      key: `showcase-${d.slug}`,
      label: d.label,
      href: d.href as string,
    })),
  },
  {
    title: "Platform",
    items: [
      { key: "editor", label: "Editor", href: "/editor/" },
      { key: "integrations", label: "Integrations", href: "/integrations/" },
      { key: "extend", label: "Extend", href: "/extend/" },
      { key: "themes", label: "Themes", href: "/themes/" },
    ],
  },
  {
    title: "Project",
    items: [{ key: "github", label: "GitHub", href: GITHUB_REPO }],
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
   *
   * `dataRef` is the string the reference index's filter box matches
   * sidebar links against (the element's name and summary); links without
   * it are never hidden by the filter.
   */
  groups?: NavGroup[];
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
                      data-ref={item.dataRef}
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
