"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The Try section's four view surfaces — code, browser, tui, cli — over the
 * same four facts, plus a simulated terminal card. The terminal reads only
 * from the fact data passed in as props and the sample constants below: it
 * executes nothing, it renders strings. The CLI itself is not shipped yet;
 * the command surface here (view / expand / collapse / filter / list /
 * help / clear) mirrors the copy's promises for `semtext tui` and
 * `semtext --render`.
 *
 * Zero-JS: every panel except browser is server-rendered and the code panel
 * is visible by default; the switch buttons are only revealed after
 * hydration, and the terminal card below shows its prefilled session (the
 * tui flashcard screen) with scripts off — the input line only exists once
 * scripts run. The browser pane is enhanced pane-scoped with the real
 * bundle on first show (same pattern as hero-window.tsx).
 *
 * The terminal simulates `semtext tui` over the page's sample facts only:
 * it executes nothing, it renders strings. Commands (help, view, expand,
 * collapse, filter, list, clear) are answered from the fact data below;
 * Enter with an empty prompt flips the current flashcard, and the arrow
 * keys recall command history.
 */

export interface TryFact {
  id: string;
  statement: string;
  conclusion: string;
  distractor: string;
}

const THEME_CSS = [
  "/semtext/semtext.css",
  "/semtext/semtext-theme-minimal-tech-light.css",
];

declare global {
  interface Window {
    SemTextFallback?: { enhance: (root: Document | HTMLElement) => void };
    __semJsOff?: boolean;
  }
}

/* ------------------------------------------------------------------ */
/* Sample document constants — the simulated CLI renders these.        */
/* ------------------------------------------------------------------ */

const DECK_ID = "try-deck";
const COLLAPSED_SECTIONS: Array<{ id: string; title: string; body: string }> = [
  {
    id: "s-sizes",
    title: "asset sizes",
    body:
      "semtext.css 4.1 KB · semtext-theme-minimal-tech-light.css 3.8 KB ·\n" +
      "semtext.js 7.2 KB gzipped — no other assets, no network calls",
  },
  {
    id: "s-procedure",
    title: "publishing a document",
    body:
      "1. author the facts, one <sem-fact> each\n" +
      "2. link semtext.css and semtext.js — a theme is one more link\n" +
      "3. open the file — or hand it to a model as-is",
  },
];
const EMBEDS: string[] = [
  "glossary.semtext.html#view-as",
  "schema/sem-facts.semtext.html",
];

/* ------------------------------------------------------------------ */
/* Renderers — pure functions over the facts + terminal state.         */
/* ------------------------------------------------------------------ */

const TERM_W = 58;

function wrap(text: string, width: number, indent = ""): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > width) {
      lines.push(indent + line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(indent + line);
  return lines;
}

function boxCard(f: TryFact, revealed = true): string[] {
  const inner = TERM_W - 2;
  const head = ` ${f.id} `;
  const kind = " rule ";
  const lines: string[] = [];
  lines.push("┌" + head + "─".repeat(Math.max(0, inner - head.length - kind.length)) + kind + "┐");
  for (const l of wrap(f.statement, inner - 2, "")) lines.push("│ " + l.padEnd(inner - 2) + " │");
  lines.push("│ " + " ".repeat(inner - 2) + " │");
  if (revealed) {
    for (const l of wrap("→ " + f.conclusion, inner - 4, "")) lines.push("│  " + l.padEnd(inner - 2) + "│");
  } else {
    lines.push("│" + " (enter flips)".padEnd(inner) + "│");
  }
  lines.push("└" + "─".repeat(inner) + "┘");
  return lines;
}

type ViewMode = "flashcards" | "list" | "quiz";

function factsListing(facts: TryFact[], mode: ViewMode): string[] {
  const out: string[] = [];
  const title = `FACTS #${DECK_ID} · ${facts.length} records`;
  if (mode === "flashcards") {
    out.push(title + "   view: flashcards");
    for (const f of facts) out.push(...boxCard(f));
    out.push("(flip with Enter · `view list` for the plain list)");
  } else if (mode === "list") {
    out.push(title + "            view: list");
    for (const f of facts) {
      out.push(`  ${f.id}`);
      out.push(...wrap(f.statement + " :: " + f.conclusion, TERM_W - 4, "    "));
    }
  } else {
    out.push(title + "            view: quiz");
    facts.forEach((f, i) => {
      out.push(`  Q${i + 1} ${f.statement}`);
      out.push(...wrap("✓ " + f.conclusion, TERM_W - 4, "    "));
      out.push(...wrap("✗ " + f.distractor, TERM_W - 4, "    "));
    });
  }
  return out;
}

function bar(label: string, n: number, total: number): string {
  const w = 16;
  return `${label} ${"█".repeat(Math.max(1, Math.round((n / total) * w)))} ${n}/${total}`;
}

interface TermState {
  view: ViewMode;
  expanded: Set<string>;
  filter: string;
  cardIdx: number;
  hidden: boolean[];
}

function cliRender(facts: TryFact[], st: TermState): string[] {
  const out: string[] = [];
  for (const e of EMBEDS) out.push(`<embed: ${e} — loaded>`);
  out.push("");
  const shown = st.filter
    ? facts.filter((f) =>
        (f.statement + " " + f.conclusion + " " + f.distractor)
          .toLowerCase()
          .includes(st.filter.toLowerCase())
      )
    : facts;
  out.push(
    `FACTS #${DECK_ID} · view: ${st.view}` +
      (st.filter ? ` · filter: "${st.filter}" (${shown.length}/${facts.length})` : ` · ${facts.length} records`)
  );
  if (st.view === "flashcards") {
    facts.forEach((f, i) => {
      if (st.filter && !shown.includes(f)) return;
      out.push(...boxCard(f, !st.hidden[i]));
    });
    out.push("(flip with Enter · `view list` for the plain list)");
  } else if (st.view === "quiz") {
    facts.forEach((f, i) => {
      if (st.filter && !shown.includes(f)) return;
      out.push(`  Q${i + 1} ${f.statement}`);
      out.push(...wrap("✓ " + f.conclusion, TERM_W - 4, "    "));
      out.push(...wrap("✗ " + f.distractor, TERM_W - 4, "    "));
    });
  } else {
    for (const f of shown) {
      out.push(`  ▸ ${f.id}  ${f.statement}`);
      out.push(...wrap("└ " + f.conclusion, TERM_W - 4, "    "));
    }
    if (st.filter && shown.length === 0) out.push("  (no matches — `filter` clears)");
  }
  out.push("");
  out.push(
    bar("kinds", facts.length, facts.length) +
      `   rule ×${facts.length}`
  );
  out.push("");
  out.push("SKELETON");
  out.push("sem-enhanced-document");
  out.push(`├── sem-facts #${DECK_ID}   view-as: ${st.view}`);
  out.push(`└── sem-view-more ×${COLLAPSED_SECTIONS.length}`);
  for (const s of COLLAPSED_SECTIONS) {
    if (st.expanded.has(s.id)) {
      out.push(`  ▾ ${s.id}  ${s.title}`);
      out.push(...wrap(s.body, TERM_W - 6, "      "));
    } else {
      out.push(`  ▸ ${s.id}  ${s.title}   (expand ${s.id})`);
    }
  }
  return out;
}

function prefill(facts: TryFact[], st: TermState): string[] {
  return [
    "$ semtext tui auth-notes.semtext.html",
    ...cliRender(facts, st),
    "",
    "type `help` for commands — this is a simulation, it runs nothing",
  ];
}

const HELP: string[] = [
  "commands:",
  "  view flashcards|list|quiz   switch the facts view",
  "  expand <id>|all             open a collapsed section",
  "  collapse <id>|all           close it again",
  "  filter <text>               keep matching facts (`filter` clears)",
  "  list                        the fact ids on screen",
  "  clear                       back to the rendered session",
  "  help                        this list",
];

/* ------------------------------------------------------------------ */
/* The component                                                       */
/* ------------------------------------------------------------------ */

type Panel = "code" | "browser" | "tui" | "cli";

let bootPromise: Promise<void> | null = null;
function bootSemtext(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      for (const href of THEME_CSS) {
        if (document.querySelector(`link[href="${href}"]`)) continue;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
      if (!window.SemTextFallback) {
        // Keep the bundle from auto-wiring the document on injection;
        // wiring is explicit below.
        window.__semJsOff = true;
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "/semtext/semtext.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("semtext.js failed to load"));
          document.head.appendChild(script);
        });
      }
    })();
  }
  return bootPromise;
}

function pill(active: boolean): string {
  return [
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1",
    "font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-violet bg-violet text-white"
      : "border-code-border text-code-gray hover:border-violet-soft hover:text-ink",
  ].join(" ");
}

function sourceMarkup(facts: TryFact[]): string {
  const factsEl = facts
    .map(
      (f) =>
        `  <sem-fact id="${f.id}" kind="rule">\n` +
        `    <statement>${f.statement}</statement>\n` +
        `    <conclusion>${f.conclusion}</conclusion>\n` +
        `    <sem-distractor>${f.distractor}</sem-distractor>\n` +
        `  </sem-fact>`
    )
    .join("\n");
  return `<sem-facts id="${DECK_ID}" view-as="flashcards" kind="capability">\n${factsEl}\n</sem-facts>`;
}

function browserMarkup(facts: TryFact[]): string {
  // Same document as sourceMarkup — this pane is the rendered form.
  return sourceMarkup(facts);
}

function tuiPanelLines(facts: TryFact[]): string[] {
  return ["$ semtext tui auth-notes.semtext.html", "", ...factsListing(facts, "flashcards")];
}

function cliPanelLines(facts: TryFact[]): string[] {
  return ["$ semtext --render auth-notes.semtext.html", "", ...cliRender(facts, {
    view: "list",
    expanded: new Set<string>(),
    filter: "",
    cardIdx: 0,
    hidden: [],
  })];
}

export function TryViews({ facts }: { facts: TryFact[] }) {
  const [js, setJs] = useState(false);
  const [panel, setPanel] = useState<Panel>("code");
  const paneRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);

  const [log, setLog] = useState<string[]>(() =>
    prefill(facts, {
      view: "flashcards",
      expanded: new Set<string>(),
      filter: "",
      cardIdx: 0,
      hidden: facts.map(() => false),
    })
  );
  const [input, setInput] = useState("");
  const termState = useRef<TermState>({
    view: "flashcards",
    expanded: new Set<string>(),
    filter: "",
    cardIdx: 0,
    hidden: facts.map(() => false),
  });
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => setJs(true), []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Browser pane: enhance only this pane, on first show, with re-checks —
  // React may reset the SSR'd pane around hydration (same self-healing
  // schedule as the hero window).
  useEffect(() => {
    if (panel !== "browser") return;
    const wirePane = () => {
      const pane = paneRef.current;
      const deck = pane?.querySelector("sem-facts");
      if (pane && deck && !deck.hasAttribute("data-sem-fallback")) {
        window.SemTextFallback?.enhance(pane);
      }
    };
    let cancelled = false;
    bootSemtext()
      .then(() => {
        if (cancelled) return;
        bootedRef.current = true;
        wirePane();
        for (const ms of [150, 500, 1200]) setTimeout(wirePane, ms);
      })
      .catch(() => {
        // Without the bundle the rendered view still shows every element:
        // the vocabulary CSS hides nothing until a tier marker is set.
      });
    return () => {
      cancelled = true;
    };
  }, [panel]);

  function run(raw: string) {
    const cmd = raw.trim();
    const st = termState.current;
    const out: string[] = [`$ ${cmd}`];
    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    switch (head) {
      case "": {
        if (st.view !== "flashcards") break;
        const i = st.cardIdx % facts.length;
        st.hidden[i] = !st.hidden[i];
        out[0] = `$ flip ${facts[i].id}`;
        st.cardIdx = (i + 1) % facts.length;
        break;
      }
      case "help":
        out.push(...HELP);
        break;
      case "clear":
        setLog(prefill(facts, st));
        return;
      case "list": {
        for (const f of facts) out.push(`  ${f.id}  ${f.statement}`);
        break;
      }
      case "view": {
        const mode = arg as ViewMode;
        if (mode === "flashcards" || mode === "list" || mode === "quiz") {
          st.view = mode;
          out.push(`view: ${mode}`);
        } else {
          out.push(`usage: view flashcards|list|quiz (current: ${st.view})`);
        }
        break;
      }
      case "expand":
      case "collapse": {
        const targets =
          arg === "all"
            ? COLLAPSED_SECTIONS.map((s) => s.id)
            : COLLAPSED_SECTIONS.some((s) => s.id === arg)
              ? [arg]
              : [];
        if (targets.length === 0) {
          out.push(
            `usage: ${head} ${COLLAPSED_SECTIONS.map((s) => s.id).join("|")}|all`
          );
          break;
        }
        for (const t of targets) {
          if (head === "expand") st.expanded.add(t);
          else st.expanded.delete(t);
        }
        out.push(`${head}ed: ${targets.join(", ")}`);
        break;
      }
      case "filter": {
        st.filter = arg;
        out.push(arg ? `filter: "${arg}" (\`filter\` clears)` : "filter cleared");
        break;
      }
      default:
        out.push(`unknown command: ${head} — try \`help\``);
    }
    if (cmd !== "clear") {
      out.push("");
      out.push(...cliRender(facts, st));
      setLog((prev) => [...prev, ...out]);
    }
  }

  const source = sourceMarkup(facts);
  const rendered = browserMarkup(facts);
  const tuiLines = tuiPanelLines(facts);
  const cliLines = cliPanelLines(facts);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" hidden={!js}>
        {(
          [
            ["code", "code"],
            ["browser", "browser"],
            ["tui", "tui"],
            ["cli", "cli"],
          ] as Array<[Panel, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPanel(key)}
            aria-pressed={panel === key}
            className={pill(panel === key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* code */}
      <div className="mt-4" hidden={panel !== "code"}>
        <figure
          className="code-window"
          aria-label="The four facts as authored"
        >
          <div className="code-chrome">
            <span className="dot live" aria-hidden="true" />
            <span>try-deck.xhtml · the source</span>
          </div>
          <pre>
            <code>{source}</code>
          </pre>
        </figure>
      </div>

      {/* browser */}
      <div className="mt-4" hidden={panel !== "browser"}>
        <figure
          className="code-window"
          aria-label="The four facts rendered in the browser"
        >
          <div className="code-chrome">
            <span className="dot live" aria-hidden="true" />
            <span>try-deck.xhtml · rendered</span>
          </div>
          <div
            ref={paneRef}
            data-sem-theme="minimal-tech-light"
            data-color-mode="dark"
            className="px-4 py-4 sm:px-5"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </figure>
      </div>

      {/* tui */}
      <div className="mt-4" hidden={panel !== "tui"}>
        <figure
          className="code-window"
          aria-label="The four facts in the tui viewer"
        >
          <div className="code-chrome">
            <span className="dot live" aria-hidden="true" />
            <span>semtext tui · terminal viewer</span>
          </div>
          <pre>
            <code>{tuiLines.join("\n")}</code>
          </pre>
        </figure>
        <p className="mt-3 text-sm text-ink-mute">
          The tui view — the interactive terminal below is the same session,
          live.
        </p>
      </div>

      {/* cli */}
      <div className="mt-4" hidden={panel !== "cli"}>
        <figure
          className="code-window"
          aria-label="The four facts as --render output"
        >
          <div className="code-chrome">
            <span className="dot live" aria-hidden="true" />
            <span>semtext --render · agent output</span>
          </div>
          <pre>
            <code>{cliLines.join("\n")}</code>
          </pre>
        </figure>
        <p className="mt-3 text-sm text-ink-mute">
          The --render output — expand and filter it in the terminal below.
        </p>
      </div>

      {/* The shared terminal card: always present, prefilled, simulated. */}
      <figure
        className="code-window mt-4"
        aria-label="Simulated semtext terminal (runs nothing)"
      >
        <div className="code-chrome">
          <span className="dot live" aria-hidden="true" />
          <span>semtext — simulation · reads the page's sample data, executes nothing</span>
        </div>
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
          className="min-h-[20rem] max-h-[32rem] overflow-y-auto p-4 font-mono text-[0.78rem] leading-relaxed text-ink-mute"
        >
          {log.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith("$ ")
                  ? "text-violet-soft"
                  : "whitespace-pre-wrap"
              }
            >
              {line === "" ? " " : line}
            </div>
          ))}
        </div>
        {js && (
          <form
            className="flex items-center gap-2 border-t border-white/5 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              const cmd = input.trim();
              if (cmd) {
                historyRef.current.push(cmd);
                histIdxRef.current = null;
              }
              run(input);
              setInput("");
            }}
          >
            <span className="font-mono text-[0.78rem] text-violet-soft">$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                const h = historyRef.current;
                if (e.key === "ArrowUp") {
                  if (h.length === 0) return;
                  e.preventDefault();
                  histIdxRef.current =
                    histIdxRef.current === null
                      ? h.length - 1
                      : Math.max(0, histIdxRef.current - 1);
                  setInput(h[histIdxRef.current]);
                } else if (e.key === "ArrowDown") {
                  if (histIdxRef.current === null) return;
                  e.preventDefault();
                  histIdxRef.current += 1;
                  if (histIdxRef.current >= h.length) {
                    histIdxRef.current = null;
                    setInput("");
                  } else {
                    setInput(h[histIdxRef.current]);
                  }
                }
              }}
              aria-label="Terminal command input"
              className="min-h-9 w-full bg-transparent font-mono text-[0.78rem] text-ink outline-none"
              placeholder="help"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        )}
      </figure>
      {!js && (
        <p className="mt-2 text-xs text-ink-faint">
          With scripts off the terminal shows the rendered session; with them
          on, type <code className="font-mono">help</code> inside it.
        </p>
      )}
    </div>
  );
}
