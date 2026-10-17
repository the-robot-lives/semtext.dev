"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SEARCH_ENTRIES,
  SEARCH_GROUPS,
  searchEntries,
  type SearchEntry,
  type SearchGroup,
} from "@/data/search-index";

/*
 * The header search box: a client-side combobox over the build-time index
 * in data/search-index.ts (every SemText/NPL tag plus the CLI commands).
 * All filtering happens in the browser against static strings — no
 * network, no service.
 *
 * ARIA 1.2 combobox pattern: the input owns a collapsed/expanded listbox
 * (aria-expanded, aria-controls), options live in per-group role="group"
 * containers, and the active row is selected with aria-activedescendant —
 * focus never leaves the input while arrowing.
 *
 * Keyboard: "/" anywhere focuses the box (unless the reader is already
 * typing in a field); ArrowDown/ArrowUp move the selection; Enter opens
 * the selected row; Escape closes the popup, then clears the query.
 *
 * Zero-JS: until hydration the box renders as a plain link to /reference/
 * (search needs JavaScript; the link keeps the no-JS header useful), and
 * hydration swaps in the combobox in the same slot — no layout shift.
 */

const LIST_ID = "header-search-listbox";
const INPUT_ID = "header-search-input";
const MAX_PER_GROUP = 8;

interface Row {
  entry: SearchEntry;
  id: string;
}

function limitByGroup(hits: SearchEntry[]): Row[] {
  const rows: Row[] = [];
  const perGroup = new Map<SearchGroup, number>();
  outer: for (const entry of hits) {
    const n = perGroup.get(entry.group) ?? 0;
    if (n >= MAX_PER_GROUP) continue;
    perGroup.set(entry.group, n + 1);
    rows.push({ entry, id: `${LIST_ID}-opt-${rows.length}` });
    if (rows.length >= 24) break outer;
  }
  return rows;
}

export function HeaderSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const rows = useMemo(() => limitByGroup(searchEntries(query)), [query]);

  // Reset the selection whenever the result set changes.
  useEffect(() => setActive(-1), [rows]);

  /*
   * "/" focuses the search from anywhere on the page — except while the
   * reader is typing in some other field, where the character belongs to
   * that field.
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes the popup.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!mounted) {
    return (
      <a
        href="/reference/"
        className="hidden items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-ink-mute hover:border-white/40 hover:text-ink sm:flex"
        aria-label="Search the docs (opens the reference)"
      >
        <span aria-hidden="true">Search</span>
        <kbd
          aria-hidden="true"
          className="rounded border border-white/20 px-1 font-mono text-[0.65rem] text-ink-faint"
        >
          /
        </kbd>
      </a>
    );
  }

  const grouped = SEARCH_GROUPS.map((group) => ({
    group,
    items: rows.filter((r) => r.entry.group === group),
  })).filter((g) => g.items.length > 0);

  function openEntry(entry: SearchEntry) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open || rows.length === 0) {
        setOpen(true);
        setActive(0);
      } else {
        setActive((a) => Math.min(rows.length - 1, a + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open && rows.length > 0) {
        setActive((a) => Math.max(0, a - 1));
      }
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActive(rows.length ? 0 : -1);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActive(rows.length - 1);
    } else if (e.key === "Enter") {
      if (open && active >= 0 && rows[active]) {
        e.preventDefault();
        openEntry(rows[active].entry);
      }
    } else if (e.key === "Escape") {
      if (open) {
        setOpen(false);
      } else if (query) {
        setQuery("");
      }
    }
  }

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <label htmlFor={INPUT_ID} className="sr-only">
        Search tags and CLI commands
      </label>
      <input
        ref={inputRef}
        id={INPUT_ID}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={LIST_ID}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? rows[active]?.id : undefined}
        placeholder="Search tags & CLI — press /"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-44 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-ink placeholder:text-ink-faint focus:w-56 focus:border-white/40 focus:outline-none md:w-56 md:focus:w-72"
      />
      {open && query.trim() !== "" && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-code-border bg-slateink-lift shadow-xl">
          {grouped.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-mute" role="status">
              Nothing matches &ldquo;{query.trim()}&rdquo;. Tag names, summaries,
              options and CLI commands are all searched.
            </p>
          ) : (
            <ul id={LIST_ID} role="listbox" aria-labelledby={INPUT_ID} className="max-h-[60vh] overflow-y-auto py-1">
              {grouped.map(({ group, items }) => (
                <li key={group} role="group" aria-labelledby={`${LIST_ID}-g-${slugify(group)}`}>
                  <p
                    id={`${LIST_ID}-g-${slugify(group)}`}
                    className="px-4 pb-1 pt-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-faint"
                  >
                    {group}
                  </p>
                  <ul className="flex flex-col" role="presentation">
                    {items.map((row) => (
                      <li key={row.entry.key} role="presentation">
                        <a
                          role="option"
                          id={row.id}
                          href={row.entry.href}
                          aria-selected={rows[active]?.id === row.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            openEntry(row.entry);
                          }}
                          onMouseMove={() => setActive(rows.findIndex((r) => r.id === row.id))}
                          className={
                            "flex flex-col gap-0.5 px-4 py-2 text-sm " +
                            (rows[active]?.id === row.id
                              ? "bg-violet/20 text-ink"
                              : "text-ink-mute hover:bg-white/5")
                          }
                        >
                          <code className="font-mono text-[0.82rem] text-ink">
                            {row.entry.title}
                          </code>
                          <span className="line-clamp-2 text-[0.8rem] leading-5">
                            {row.entry.hint}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-white/10 px-4 py-1.5 font-mono text-[0.62rem] text-ink-faint">
            {SEARCH_ENTRIES.length} entries indexed · ↑ ↓ move · Enter opens · Esc closes
          </p>
        </div>
      )}
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z]+/g, "-");
}
