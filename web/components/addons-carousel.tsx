"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

/*
 * The Integrations section's carousel: one card per integration, each with
 * a mock of the surface the integration would put on a page — an embedded
 * ticket, a knowledge-base answer, a course panel, a scored quiz, a Draftamo
 * UML render, a filed issue. No status chips: an integration is wired to its
 * real logic as it is built, and until then the mocks are illustrations of
 * planned output, not screenshots of shipped product — nothing in them is
 * a claim of availability.
 *
 * Zero-JS: the server HTML stacks all six cards in document order and the
 * controls stay hidden (the same hidden-until-hydration pattern as
 * try-views.tsx) — a scripts-off reader gets a plain list. With scripts on,
 * the stack becomes a translated track driven by the side arrows, the dots,
 * and the left/right arrow keys while focus is inside the carousel.
 *
 * Autoplay advances one card every 6 s and wraps. It pauses while the
 * pointer is over the carousel or focus is inside it, while the tab is
 * hidden, and entirely under `prefers-reduced-motion` (which also drops
 * the slide transition). Keyboard mechanics are unchanged: the region and
 * every control are reachable and operable, and hidden cards are
 * `aria-hidden`.
 */

function TicketEmbedMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-code-border bg-slateink">
      <div className="flex items-center gap-2 border-b border-code-border px-3 py-2 font-mono text-[0.65rem] text-ink-faint">
        <span className="inline-block h-2 w-2 rounded-full bg-violet" aria-hidden="true" />
        embed.semtext.dev/tickets?account=key_live_7f3k9x
      </div>
      <div className="p-3">
        <p className="font-mono text-xs text-violet-soft">TRK-241 · open</p>
        <p className="mt-1 text-sm text-ink">Streak reset wipes a completed quiz score</p>
        <p className="mt-2 font-mono text-[0.65rem] text-ink-faint">
          assigned @dana · tagged semtext · cited inline from your tracker
        </p>
      </div>
    </div>
  );
}

function KnowsAnswerMock() {
  return (
    <div className="rounded-lg border border-code-border bg-slateink p-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
        KB-118 · account keys · v3
      </p>
      <p className="mt-2 text-sm font-medium text-ink">What does an account key unlock?</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-mute">
        Embedding — tickets, quizzes and course progress render inside your
        documents; the reading core stays open.
      </p>
      <p className="mt-2 font-mono text-[0.65rem] text-ink-faint">
        source: The Robot Knows · entry cited on the fact
      </p>
    </div>
  );
}

function CoursePanelMock() {
  return (
    <div className="rounded-lg border border-code-border bg-slateink p-3">
      <p className="font-mono text-xs text-violet-soft">course · Working with SemText</p>
      <div className="mt-2 h-1 rounded bg-code" role="presentation">
        <div className="h-1 w-2/5 rounded bg-violet" />
      </div>
      <ol className="mt-2 space-y-1 font-mono text-[0.68rem] text-ink-mute">
        <li>1 · documents &amp; records — done</li>
        <li className="text-ink">2 · reading views — current</li>
        <li>3 · extraction — up next</li>
      </ol>
      <p className="mt-2 font-mono text-[0.65rem] text-ink-faint">
        progress tracked per reader · sign-in prompted on start
      </p>
    </div>
  );
}

function QuizCardMock() {
  return (
    <div className="rounded-lg border border-code-border bg-slateink p-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
        quiz · public catalogue
      </p>
      <p className="mt-2 text-sm font-medium text-ink">
        Which attribute selects an alternate rendering?
      </p>
      <ul className="mt-2 space-y-1 font-mono text-[0.68rem] text-ink-mute">
        <li>a · key</li>
        <li className="text-violet-soft">b · view-as — correct</li>
        <li>c · role</li>
      </ul>
      <p className="mt-2 font-mono text-[0.65rem] text-ink-faint">
        scores in place · private exams use the same embed
      </p>
    </div>
  );
}

function DraftamoUmlMock() {
  return (
    <div className="rounded-lg border border-code-border bg-slateink p-3">
      <svg
        viewBox="0 0 330 66"
        role="img"
        aria-label="UML render: sem-doc to reader to records"
        className="w-full"
      >
        <g fill="none" stroke="var(--code-border)" strokeWidth="1">
          <rect x="4" y="18" width="90" height="30" rx="6" />
          <rect x="120" y="18" width="90" height="30" rx="6" />
          <rect x="236" y="18" width="90" height="30" rx="6" />
        </g>
        <g
          fill="var(--ink-mute)"
          fontSize="10"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          <text x="49" y="37">sem-doc</text>
          <text x="165" y="37">reader</text>
          <text x="281" y="37">records</text>
        </g>
        <g stroke="var(--accent)" strokeWidth="1" fill="none">
          <path d="M94 33 H116" />
          <path d="M116 33 l-5 -3 v6 z" fill="var(--accent)" />
          <path d="M210 33 H232" />
          <path d="M232 33 l-5 -3 v6 z" fill="var(--accent)" />
        </g>
      </svg>
      <p className="mt-2 font-mono text-[0.65rem] text-ink-faint">
        checkout-flow.uml · rendered by Draftamo
      </p>
    </div>
  );
}

function PlansIssueMock() {
  return (
    <div className="rounded-lg border border-code-border bg-slateink p-3">
      <p className="font-mono text-xs text-violet-soft">
        SEM-312 · Integration carousel keyboard focus ring
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="g-status">integrations</span>
        <span className="g-status">enhancement</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-mute">
        Reported from this page — reporter, page section and build attached
        automatically.
      </p>
      <p className="mt-2 font-mono text-[0.65rem] text-ink-faint">
        filed via embedded form → The Robot Plans (GitHub)
      </p>
    </div>
  );
}

const ADDONS: Array<{
  id: string;
  title: string;
  blurb: string;
  mock: ReactNode;
}> = [
  {
    id: "ticket-embedding",
    title: "Ticket embedding",
    blurb:
      "An account key enables ticket embedding — live tickets from your tracker, cited inline like any other datum.",
    mock: <TicketEmbedMock />,
  },
  {
    id: "the-robot-knows",
    title: "The Robot Knows hookup",
    blurb:
      "Point a document at your knowledge base, so facts and procedures draw on live KB entries.",
    mock: <KnowsAnswerMock />,
  },
  {
    id: "the-robot-learns",
    title: "The Robot Learns courses",
    blurb:
      "Courses load as SemText and track each reader's quiz progress; sign-in is prompted when tracking starts.",
    mock: <CoursePanelMock />,
  },
  {
    id: "embedded-quizzes",
    title: "Private & public quizzes",
    blurb:
      "Private exams and quizzes from The Robot Learns embed in your pages, beside a public catalogue of embedded quizzes.",
    mock: <QuizCardMock />,
  },
  {
    id: "draftamo-renders",
    title: "Draftamo mockups & UML",
    blurb:
      "Mockups and UML renders from Draftamo-hosted projects, or from local Draftamo XML.",
    mock: <DraftamoUmlMock />,
  },
  {
    id: "issue-submission",
    title: "The Robot Plans issue submission",
    blurb:
      "Submit an issue from the page itself — The Robot Plans files it in Jira, ClickUp, or GitHub.",
    mock: <PlansIssueMock />,
  },
];

export function AddonsCarousel() {
  const [js, setJs] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setJs(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const count = ADDONS.length;
  // Side arrows and autoplay wrap; the dots address cards directly.
  const go = (next: number) => setIndex(((next % count) + count) % count);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  };

  // Autoplay: one card every 6 s, paused on hover, on focus anywhere in
  // the carousel, while the tab is hidden, and under reduced motion.
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  useEffect(() => {
    if (!js) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current || reducedRef.current) return;
      if (document.visibilityState !== "visible") return;
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [js, count]);

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  return (
    <div
      ref={rootRef}
      {...(js
        ? {
            role: "region",
            "aria-roledescription": "carousel",
            "aria-label": "Integration cards",
            tabIndex: 0,
            onKeyDown,
            ...pauseHandlers,
          }
        : {})}
      className="relative mt-8 max-w-4xl"
    >
      <div className="overflow-hidden">
        <ul
          className={`flex items-stretch ${
            js && !reducedMotion
              ? "flex-row transition-transform duration-300 ease-out"
              : js
                ? "flex-row"
                : "flex-col gap-4"
          }`}
          style={js ? { transform: `translateX(-${index * 100}%)` } : undefined}
        >
          {ADDONS.map((addon, i) => (
            <li
              key={addon.id}
              className={js ? "min-w-full px-0" : undefined}
              aria-hidden={js && i !== index ? true : undefined}
            >
              <article
                className="flex h-full flex-col rounded-xl border border-code-border bg-slateink-panel p-5"
                aria-labelledby={`addon-${addon.id}-h`}
              >
                <h3 id={`addon-${addon.id}-h`} className="text-lg font-semibold text-ink">
                  {addon.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">{addon.blurb}</p>
                <div className="mt-4">{addon.mock}</div>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {/* Side arrows — overlay the card edges, rendered only after
          hydration. They wrap in both directions (so does autoplay). */}
      {js && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous integration"
            className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-code-border bg-slateink font-mono text-base text-ink shadow-md hover:border-violet-soft"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next integration"
            className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-code-border bg-slateink font-mono text-base text-ink shadow-md hover:border-violet-soft"
          >
            ›
          </button>
        </>
      )}

      {/* Dots + status — rendered only after hydration, so a scripts-off
          page has no controls in the DOM at all. The status line announces
          only while autoplay is paused (hover/focus/reduced motion), so a
          running carousel does not narrate every 6-second step. */}
      {js && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {ADDONS.map((addon, i) => (
              <button
                key={addon.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to card ${i + 1}: ${addon.title}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-2.5 w-2.5 rounded-full ${
                  i === index ? "bg-violet" : "bg-code-border"
                }`}
              />
            ))}
          </div>
          <p
            aria-live={paused || reducedMotion ? "polite" : "off"}
            className="font-mono text-xs text-ink-faint"
          >
            {index + 1} / {count} — {ADDONS[index].title}
          </p>
        </div>
      )}
    </div>
  );
}
