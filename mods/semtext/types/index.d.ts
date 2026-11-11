export type SemTextNode = {
  tag: string
  attrs: Readonly<Record<string, string>>
  line: number
  children: SemTextNode[]
  /**
   * Full text content (direct prose plus descendants'), ANSI-stripped and
   * whitespace-collapsed, capped. Present once the element closed at parse.
   */
  text?: string
  /**
   * Characters of `text` cut by the capture cap (visible `… (+N chars)` in
   * the pane) — 0/undefined when the body fit whole.
   */
  truncated?: number
  /**
   * Structured capture for the interactive vocabulary (facts/reveal/note/
   * views/properties/table/code) once the element closed at parse.
   */
  content?: SemNodeContent
  /**
   * Headings (h1-h6) and paragraphs (p) captured inside this element, in
   * document order.
   */
  blocks?: SemBlock[]
}

export type SemBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'text'; text: string }
  /** Unordered item; bullet is depth-styled at capture (• depth 0, ◦ 1, ▪ 2+). */
  | { kind: 'list-item'; text: string; bullet: string; depth: number }
  /** Ordered item; label is the capture-computed marker (`1.`, `a.`, `i.` …). */
  | { kind: 'list-item-ordered'; text: string; label: string; depth: number }
  /** Task item (`input type=checkbox` inside the li); done = checked attr present. */
  | { kind: 'task-item'; text: string; done: boolean; depth: number }
  /** dl term (draws bold); its dd siblings draw indented after it. */
  | { kind: 'term'; text: string }
  | { kind: 'definition'; text: string }

export type FactItem = {
  /** Prompt text: the fact's content with its conclusion/distractors removed. */
  body: string
  conclusion: string
  distractors: readonly string[]
}

export type QuizOption = {
  text: string
  correct: boolean
}

export type SemNodeContent =
  | {
      kind: 'facts'
      /** quiz/flashcards drive the runner; list renders items inline. */
      viewAs: 'quiz' | 'flashcards' | 'list'
      /** Deterministic shuffle seed: data-sem-seed (own or inherited), else 0. */
      seed: number
      items: readonly FactItem[]
    }
  | { kind: 'reveal'; summary: string; body: string; collapsed: boolean }
  | { kind: 'note'; collapsed: true; summary: string; body: string }
  | { kind: 'views'; views: readonly { name: string; body: string }[]; initial: number }
  | { kind: 'properties'; properties: readonly { key: string; value: string }[] }
  | { kind: 'table'; rows: readonly string[]; caption?: string }
  | { kind: 'code'; lang: string; body: string }

/** Viewer + runner state of the pane; every write goes through update(). */
export type SemTextViewer = {
  /**
   * What the pane draws: 'expanded' (the default — whole outline tree
   * top-to-bottom, every card open inline), 'outline' (the compact clickable
   * list), 'section' (one focused element) or 'quiz' (the runner).
   */
  mode: 'outline' | 'expanded' | 'section' | 'quiz'
  /** Overview the outline nav returns to: 'outline' or 'expanded'. */
  outlineMode: 'outline' | 'expanded'
  /** Key path (outline row key) of the section in section/quiz mode. */
  focusedSection: string | null
  /** Key path of the facts set the runner is on. */
  activeFactSet: string | null
  factSetKind: 'quiz' | 'flashcards'
  /** Zero-based item; === items.length once the set is complete. */
  itemIndex: number
  /** Option order of the current quiz item (from buildQuizOptions). */
  order: readonly QuizOption[]
  /** Index into `order` the runner graded, null until an option is pressed. */
  picked: number | null
  score: { correct: number; answered: number }
  flipped: boolean
  /** Reveal/note key path -> expanded? (default = captured collapsed state). */
  expanded: Readonly<Record<string, boolean>>
  /** Views key path -> active view index (default = captured initial). */
  activeView: Readonly<Record<string, number>>
}

export type SemTextDoc = {
  source: string
  fileName?: string
  tree: SemTextNode[]
  elementCount: number
  unknownElements: string[]
  firstSeen: number
}

declare module 'claude-code' {
  interface PluginState {
    semtext: {
      doc: SemTextDoc | null
      seenSources: string[]
      viewer: SemTextViewer
    }
  }
}
