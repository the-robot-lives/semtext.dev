"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

/*
 * The Try section's four view surfaces — code, browser, tui, cli — over the
 * demo documents under /demo/. The target architecture (§ product intent,
 * 2026-10-14) is a live window per tab: a <sem-shell> whose start script is
 * typed and executed in view, and a <sem-browser> rendering the document.
 * Until the shell bundle and the script runner land, this component renders
 * the placeholders that work today, zero-JS:
 *
 *   - shell tabs: a <sem-shell> placeholder carrying start-script="<site
 *     path to a demo-runner script file>" whose fallback content is a
 *     static transcript — the script's `cat` and the message file it
 *     prints, i.e. the command a visitor will run in this shell.
 *   - browser tab: a <sem-browser> placeholder carrying src="<site path to
 *     the .sem.html document>"; its fallback children are a framed iframe
 *     of that exact document (which renders live with the shipped fallback
 *     tier). When the element defines, it takes over and the children go.
 *
 * Placeholder contract for the later lanes (keep these attribute names and
 * the window layout stable; the transcript text may change):
 *
 *   <sem-shell start-script="/demo/scripts/<tab>.txt" aria-label="...">
 *     ...static transcript (script line + catted message)...
 *   </sem-shell>
 *
 *   <sem-browser src="/demo/example-deck.sem.html" aria-label="...">
 *     ...address bar + iframe fallback...
 *   </sem-browser>
 *
 * The tablist appears only after hydration; with scripts off all four
 * panels render stacked and readable (no interaction is promised).
 */

export interface TryFact {
  id: string;
  statement: string;
  conclusion: string;
  incorrectStatement: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sem-shell": HTMLAttributes<HTMLElement> & { "start-script"?: string };
      "sem-browser": HTMLAttributes<HTMLElement> & { src?: string };
    }
  }
}

/* ------------------------------------------------------------------ */
/* The four tabs — one document each, one window each.                 */
/* ------------------------------------------------------------------ */

type TabKey = "code" | "browser" | "tui" | "cli";

interface TabDef {
  key: TabKey;
  label: string;
  chrome: string; // window title bar text
  aria: string; // window + iframe accessible name
  script?: string; // shell tabs: site path of the demo-runner start script
  src?: string; // browser tab: site path of the rendered document
  lines?: string[]; // shell tabs: static transcript (script + message)
}

const TABS: TabDef[] = [
  {
    key: "code",
    label: "code",
    chrome: "sem-shell · demo/example-deck.sem.html · code view",
    aria: "The deck file in a shell pager",
    script: "/demo/scripts/code.txt",
    lines: [
      "$ cat demo/messages/code.txt",
      "code view — the pager over the deck file:",
      "",
      "    bat demo/example-deck.sem.html",
      "",
      "Up/Down line · PgUp/PgDn page · / find · n/N next/prev · q quit",
      "",
      "(placeholder — this shell types and runs the script once the shell bundle lands)",
    ],
  },
  {
    key: "browser",
    label: "browser",
    chrome: "sem-browser · demo/example-deck.sem.html",
    aria: "The deck file rendered in a browser window",
    src: "/demo/example-deck.sem.html",
  },
  {
    key: "tui",
    label: "tui",
    chrome: "sem-shell · demo/auth-notes.sem.html · terminal",
    aria: "The notes file in the interactive terminal view",
    script: "/demo/scripts/tui.txt",
    lines: [
      "$ cat demo/messages/tui.txt",
      "tui view — the interactive terminal over the notes file:",
      "",
      "    semtext tui demo/auth-notes.sem.html",
      "",
      "arrow keys or click: sections, flashcards, quiz · Esc exits",
      "",
      "(placeholder — this shell types and runs the script once the shell bundle lands)",
    ],
  },
  {
    key: "cli",
    label: "cli",
    chrome: "sem-shell · plain-text readers",
    aria: "The plain-text commands agents run on the demo files",
    script: "/demo/scripts/cli.txt",
    lines: [
      "$ cat demo/messages/cli.txt",
      "cli view — plain text out, one command per reader:",
      "",
      "    render-card demos/render-demo.card",
      "    semtext --render demo/auth-notes.sem.html",
      "    render-card demos/render-subsection.card",
      "    render-card demos/render-toc.card",
      "",
      "(placeholder — this shell types and runs the script once the shell bundle lands)",
    ],
  },
];

function pill(active: boolean): string {
  return [
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1",
    "font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-violet bg-violet text-white"
      : "border-code-border text-code-gray hover:border-violet-soft hover:text-ink",
  ].join(" ");
}

/* The shell placeholder: real element, static transcript as its fallback
   content. start-script names the script the runner will type and run;
   the transcript shows that script's one `cat` and the message it prints. */
function ShellWindow({ tab }: { tab: TabDef }) {
  return (
    <sem-shell start-script={tab.script} aria-label={tab.aria} className="block">
      <figure className="code-window">
        <div className="code-chrome">
          <span className="dot live" aria-hidden="true" />
          <span className="min-w-0 truncate">{tab.chrome}</span>
          <span className="ml-auto hidden min-w-0 truncate font-mono text-[0.66rem] text-ink-faint sm:inline">
            start-script {tab.script}
          </span>
        </div>
        <pre className="max-h-[26rem] min-h-[16rem] overflow-auto p-4 font-mono text-[0.78rem] leading-relaxed text-ink-mute">
          <code>
            {(tab.lines ?? []).map((line, i) => (
              <span
                key={i}
                className={
                  line.startsWith("$ ")
                    ? "block whitespace-pre text-violet-soft"
                    : "block whitespace-pre"
                }
              >
                {line === "" ? " " : line}
              </span>
            ))}
          </code>
        </pre>
      </figure>
    </sem-shell>
  );
}

/* The browser placeholder: real element, framed live document as fallback
   children. The chrome row is inert decoration with the document path in
   an address-bar pill; the sem-browser element replaces all of it once
   defined. */
function BrowserWindow({ tab }: { tab: TabDef }) {
  return (
    <sem-browser src={tab.src} aria-label={tab.aria} className="block">
      <figure className="code-window">
        <div className="code-chrome">
          <span className="select-none text-ink-faint" aria-hidden="true">
            ← →
          </span>
          <span className="select-none text-ink-faint" aria-hidden="true">
            ⟳
          </span>
          <span className="mx-1 min-w-0 flex-1 truncate rounded-md border border-code-border bg-[#0a101c] px-2 py-0.5 font-mono text-[0.68rem] text-code-gray">
            {tab.src?.replace(/^\//, "")}
          </span>
        </div>
        <iframe
          src={tab.src}
          title={tab.aria}
          loading="lazy"
          className="h-[26rem] w-full border-0 bg-white"
        />
      </figure>
    </sem-browser>
  );
}

export function TryViews({
  facts: _facts,
}: {
  facts: TryFact[];
}) {
  // `facts` stays on the signature for the live views (the script-runner
  // lane re-derives transcripts from the deck); the placeholder windows
  // read only the static demo assets under /demo/.
  const [js, setJs] = useState(false);
  const [active, setActive] = useState<TabKey>("code");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => setJs(true), []);

  function onTablistKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = TABS.findIndex((t) => t.key === active);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft")
      next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setActive(TABS[next].key);
    requestAnimationFrame(() => tabRefs.current[next]?.focus());
  }

  return (
    <div>
      {/* Rendered only after hydration: with no JS the panels are stacked
          and the tab list is not in the DOM, so the static page stays
          zero-JS honest. */}
      <div
        role="tablist"
        aria-label="SemText views"
        className="flex flex-wrap items-center gap-2"
        hidden={!js}
        onKeyDown={onTablistKeyDown}
      >
        {TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`try-tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`try-panel-${t.key}`}
            tabIndex={active === t.key ? 0 : -1}
            onClick={() => setActive(t.key)}
            className={pill(active === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {TABS.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`try-panel-${t.key}`}
          aria-labelledby={`try-tab-${t.key}`}
          tabIndex={0}
          hidden={js && active !== t.key}
          className="mt-4"
        >
          {t.src ? <BrowserWindow tab={t} /> : <ShellWindow tab={t} />}
        </div>
      ))}
    </div>
  );
}
