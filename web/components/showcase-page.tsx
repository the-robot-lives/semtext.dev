import type { ReactNode } from "react";
import { DocsShell } from "@/components/docs-shell";

/*
 * Shared scaffold for the /showcase/<slug>/ pages: the docs sidebar, the
 * eyebrow + title + one-paragraph "why this use case" lede, then the
 * page's worked examples. Each showcase page stays a thin file that only
 * supplies copy and authored SemText — the chrome lives here.
 */

export function ShowcaseFrame({
  slug,
  title,
  lede,
  sections,
  children,
}: {
  slug: string;
  title: string;
  lede: ReactNode;
  /** Optional "On this page" anchors, as on the docs page. */
  sections?: Array<{ id: string; label: string }>;
  children: ReactNode;
}) {
  return (
    <DocsShell active={`showcase-${slug}`} sections={sections}>
      <main id="main">
        <p className="g-eyebrow">Showcase</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">{lede}</p>
        {children}
      </main>
    </DocsShell>
  );
}

/** The footer row every showcase page shares. */
export function ShowcaseFooter({ children }: { children: ReactNode }) {
  return (
    <p className="mt-12 max-w-3xl border-t border-white/10 pt-6 text-sm leading-6 text-ink-faint">
      {children}
    </p>
  );
}
