"use client";

import { useEffect, useId, useRef, useState } from "react";

/*
 * Compact nav for the header below `sm`, where the four inline links
 * hide. One disclosure button (aria-expanded, native button semantics —
 * Enter/Space toggle, tab-reachable) opens a panel with the same links
 * the desktop row shows. Escape closes and restores focus to the
 * button; a pointer press outside the panel closes it; opening a link
 * closes it. The `/` search shortcut lives in `search.tsx` (a window
 * keydown that skips inputs) and is untouched — this menu adds no keys
 * of its own beyond Escape-while-open.
 */

const MOBILE_LINKS = [
  { href: "/#try", label: "See it work" },
  { href: "/reference/", label: "Reference" },
  { href: "/spec/semtext.html", label: "Spec" },
  { href: "/#start", label: "Get started" },
  { href: "https://therobotlives.com", label: "The Robot Lives" },
];

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="relative sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
            buttonRef.current?.focus();
          }
        }}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/15 font-mono text-ink hover:border-white/40"
      >
        <span aria-hidden="true">{open ? "✕" : "≡"}</span>
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              buttonRef.current?.focus();
            }
          }}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-white/15 bg-slateink/95 p-2 shadow-2xl backdrop-blur-md"
        >
          {/* Distinct landmark name: below sm the header's own "Primary"
              nav (search + this toggle) stays exposed, so a second bare
              "Primary" here would duplicate the landmark. */}
          <nav aria-label="Primary menu" className="flex flex-col">
            {MOBILE_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-md px-3 font-mono text-sm text-ink-mute hover:bg-white/5 hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
