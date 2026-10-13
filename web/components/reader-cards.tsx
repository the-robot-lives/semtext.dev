"use client";

import { useEffect, useState } from "react";

/*
 * The Why section's four readers — raw, web, cli viewer, cli renderer — as
 * a row of cards. Each card carries the view name and a one-line blurb;
 * clicking one selects it and shows its full description below.
 *
 * Zero-JS: the full descriptions are server-rendered and none of them is
 * hidden until a script runs. Without scripts all four are visible in
 * document order; the buttons do nothing. With scripts, the selected
 * reader's description shows alone. No content ever leaves the page —
 * hiding is `hidden={...}` on hydrated client state only.
 */

type Reader = {
  id: string;
  name: string;
  blurb: string;
  sig: string;
  full: React.ReactNode;
};

const READERS: Array<Reader> = [
  {
    id: "raw",
    name: "raw",
    blurb:
      "Prose in document order — a person, a diff or a model reads it with no conversion step.",
    sig: "view: raw",
    full: (
      <>
        The file as authored: XHTML you can open in an editor, a diff or a
        terminal — prose in document order, each qualifier written beside the
        thing it qualifies, no generated markup to skip past. A model reads and
        writes this same text, with no conversion step in either direction.
      </>
    ),
  },
  {
    id: "web",
    name: "web",
    blurb:
      "The same file opens as a styled page — flashcards, quizzes and disclosures in the browser.",
    sig: "view: the web page",
    full: (
      <>
        The in-browser render: open the file and the markup becomes the page
        you are reading. The theme CSS styles the vocabulary directly, so a
        document is readable the moment it opens. Flashcards flip, quizzes
        score, tabs switch and disclosures expand — driven by roughly 7 KB of
        vanilla JavaScript with no dependencies and no network calls.
      </>
    ),
  },
  {
    id: "viewer",
    name: "cli viewer",
    blurb:
      "semtext tui — an interactive terminal session for people, without leaving the shell.",
    sig: "view: the CLI viewer",
    full: (
      <>
        <code className="font-mono text-violet-soft">semtext tui</code> — an
        interactive terminal viewer for people: the same file with flashcards,
        a data visualizer and graphs, without leaving the terminal.
      </>
    ),
  },
  {
    id: "renderer",
    name: "cli renderer",
    blurb:
      "semtext --render — embeds loaded, collapse and filter, output an agent can cite.",
    sig: "view: the CLI renderer",
    full: (
      <>
        <code className="font-mono text-violet-soft">semtext --render</code> —
        rendered output from the --render mode: it renders and loads embeds,
        with collapse, expand and filtering for agents. Summaries expand in
        place, so a file is effectively its own summary view.
      </>
    ),
  },
];

export function ReaderCards() {
  const [js, setJs] = useState(false);
  const [selected, setSelected] = useState<string>(READERS[0].id);

  useEffect(() => setJs(true), []);

  return (
    <div className="mx-auto mt-8 max-w-docs">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {READERS.map((r) => {
          const active = js && selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              aria-pressed={active || undefined}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-violet bg-violet/10"
                  : "border-code-border bg-slateink hover:border-violet-soft"
              }`}
            >
              <span className="font-mono text-sm text-violet-soft">
                {r.name}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-ink-mute">
                {r.blurb}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {READERS.map((r) => (
          <article key={r.id} hidden={js && selected !== r.id}>
            <p className="sig mb-3">{r.sig}</p>
            <p className="max-w-2xl leading-relaxed text-ink-mute">{r.full}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
