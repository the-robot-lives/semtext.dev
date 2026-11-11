// SemText pane rendering layer (v0.4): glyph vocabulary, pure drawing
// helpers, viewer reducers, the per-kind render registry and the expanded
// document view's per-node role dispatch.
//
// Every decoration glyph in the pane comes from GLYPHS — content strings are
// control-stripped (sanitize) before drawing and never contribute glyphs.
// Elements are drawn from the VERIFIED surface only: Box/Text/Button with the
// props BoxProps/TextProps/ButtonProps allow (color via theme keys, dimColor,
// bold, width, padding, gap; Button plain/hotkey/variant/onPress).
import type {
  BoxProps,
  ButtonProps,
  ElementConstructor,
  RenderElement,
  TextProps,
} from 'claude-code'

import type {
  FactItem,
  QuizOption,
  SemBlock,
  SemTextNode,
  SemTextViewer,
} from '../types'

// --- hygiene (content strings never carry structure) ---

const ANSI_OR_CONTROL =
  /\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\u0007]*(?:\u0007|\x1b\\)|[\u0000-\u0008\u000b-\u001f\u007f]/g

/** Strips ANSI escape sequences and C0 control characters (keeps \n and \t). */
export function sanitize(value: string): string {
  return value.replace(ANSI_OR_CONTROL, '')
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Whitespace-collapses each line of `value` while keeping `\n` row breaks
 * verbatim (runs of blank lines collapse to one). The boxed-prose capture
 * rule: `<br>` variants and literal newlines are hard row breaks at draw
 * time (proseLines), labels/summaries still flatten via collapseWhitespace.
 */
export function collapseLines(value: string): string {
  return value
    .split('\n')
    .map(line => collapseWhitespace(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
}

/** 60-char word-boundary summary of a body — the browser reveal rule. */
export function truncateSummary(value: string): string {
  const flat = collapseWhitespace(value)
  if (flat.length <= 60) return flat
  const head = flat.slice(0, 60)
  const cut = head.lastIndexOf(' ')
  return (cut > 0 ? head.slice(0, cut) : head).replace(/[\s,;:.—-]+$/, '')
}

/** First `count` words of `value` — the collapsed-note summary rule. */
export function firstWords(value: string, count: number): string {
  return collapseWhitespace(value)
    .split(' ')
    .slice(0, count)
    .join(' ')
}

/** A list-mode facts item line: `body — conclusion`, whichever exists — never empty. */
export function factLine(item: FactItem): string {
  if (item.body === '') return item.conclusion === '' ? '(empty item)' : item.conclusion
  return item.conclusion === '' ? item.body : `${item.body} — ${item.conclusion}`
}

/**
 * The runner's prompt: the body, the flipped conclusion on a flashcard, or an
 * `Item N` placeholder when the text is empty — never an empty string, so a
 * sparse fact set still shows what item the runner is on.
 */
export function promptFor(
  item: FactItem,
  position: number,
  kind: 'quiz' | 'flashcards',
  flipped: boolean,
): string {
  if (kind === 'flashcards' && flipped) {
    return item.conclusion !== '' ? item.conclusion : '(no conclusion recorded)'
  }
  return item.body !== '' ? item.body : `Item ${position}`
}

// --- quiz randomness (ported from the browser fallback) ---

/**
 * splitmix32 PRNG — the exact constants of the browser fallback's `se`.
 * Deterministic on `seed`; a missing data-sem-seed stays deterministic at 0
 * (the browser falls back to Date.now(); the pane must not).
 */
export function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 1831565813) >>> 0
    let z = state
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates over a copy, driven by `next` — the browser fallback's `ce`. */
export function shuffle<T>(list: readonly T[], next: () => number): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    const swap = out[i]!
    out[i] = out[j]!
    out[j] = swap
  }
  return out
}

/**
 * Options for quiz item `itemIndex` of `items` — PURE and deterministic.
 * Browser rule: the item's explicit distractors first, then the other items'
 * conclusions, sliced to 3, plus the answer (exactly once), Fisher–Yates-
 * shuffled. One PRNG stream per set, continued across items, as the browser
 * does: item k's shuffle resumes where item k-1's stopped.
 */
export function buildQuizOptions(
  items: readonly FactItem[],
  itemIndex: number,
  seed = 0,
): QuizOption[] {
  if (itemIndex < 0 || itemIndex >= items.length) return []
  const next = rng(seed)
  let built: QuizOption[] = []
  for (let k = 0; k <= itemIndex; k++) {
    const item = items[k]!
    if (item.conclusion === '') {
      // Conclusion-less item: the browser pools distractors and the other
      // conclusions around an empty answer; the pane pools the same with no
      // answer at all — options still show, nothing is gradeable.
      const others: string[] = []
      for (let j = 0; j < items.length; j++) {
        if (j === k) continue
        const conclusion = items[j]!.conclusion
        if (conclusion !== '') others.push(conclusion)
      }
      built = shuffle(
        item.distractors
          .concat(others)
          .slice(0, 3)
          .map(text => ({ text, correct: false })),
        next,
      )
      continue
    }
    const others: string[] = []
    for (let j = 0; j < items.length; j++) {
      if (j === k) continue
      const conclusion = items[j]!.conclusion
      if (conclusion !== '') others.push(conclusion)
    }
    const pool = item.distractors.concat(others).slice(0, 3)
    const entries: QuizOption[] = pool.map(text => ({ text, correct: false }))
    entries.push({ text: item.conclusion, correct: true })
    built = shuffle(entries, next)
  }
  return built
}

// --- viewer reducers (PURE; the pane's only writers) ---

export const INITIAL_VIEWER: SemTextViewer = {
  mode: 'expanded',
  outlineMode: 'expanded',
  focusedSection: null,
  activeFactSet: null,
  factSetKind: 'quiz',
  itemIndex: 0,
  order: [],
  picked: null,
  score: { correct: 0, answered: 0 },
  flipped: false,
  expanded: {},
  activeView: {},
}

export function focusSection(viewer: SemTextViewer, key: string): SemTextViewer {
  return {
    ...viewer,
    mode: 'section',
    focusedSection: key,
    activeFactSet: null,
    itemIndex: 0,
    order: [],
    picked: null,
    flipped: false,
  }
}

/** Back to whichever overview (compact outline / expanded) was last active. */
export function backToOutline(viewer: SemTextViewer): SemTextViewer {
  return {
    ...viewer,
    mode: viewer.outlineMode,
    activeFactSet: null,
    order: [],
    picked: null,
    flipped: false,
  }
}

/** Switches the overview between the compact outline and the expanded view. */
export function setOutlineMode(
  viewer: SemTextViewer,
  mode: 'outline' | 'expanded',
): SemTextViewer {
  return { ...viewer, mode, outlineMode: mode }
}

/**
 * Sets every card key in `keys` open (true) or shut (false) at once — the
 * expand-all / collapse-all rule. Explicit per-card toggles keep winning over
 * defaults afterwards, since the map stores the requested value.
 */
export function setAllExpanded(
  viewer: SemTextViewer,
  keys: readonly string[],
  open: boolean,
): SemTextViewer {
  const expanded = { ...viewer.expanded }
  for (const key of keys) expanded[key] = open
  return { ...viewer, expanded }
}

export function startQuiz(
  viewer: SemTextViewer,
  setKey: string,
  kind: 'quiz' | 'flashcards',
  order: readonly QuizOption[],
): SemTextViewer {
  return {
    ...viewer,
    mode: 'quiz',
    activeFactSet: setKey,
    factSetKind: kind,
    itemIndex: 0,
    order,
    picked: null,
    flipped: false,
    score: { correct: 0, answered: 0 },
  }
}

/** Grades one press; a second press on the same item and flashcards never grade. */
export function pickOption(viewer: SemTextViewer, index: number): SemTextViewer {
  if (viewer.mode !== 'quiz' || viewer.factSetKind !== 'quiz' || viewer.picked !== null) {
    return viewer
  }
  const option = viewer.order[index]
  if (option === undefined) return viewer
  return {
    ...viewer,
    picked: index,
    score: {
      correct: viewer.score.correct + (option.correct ? 1 : 0),
      answered: viewer.score.answered + 1,
    },
  }
}

/** Advances the runner; past the last item parks at `count` (the end state). */
export function nextItem(
  viewer: SemTextViewer,
  order: readonly QuizOption[],
  count: number,
): SemTextViewer {
  if (viewer.mode !== 'quiz') return viewer
  const itemIndex = viewer.itemIndex + 1
  if (itemIndex >= count) {
    return { ...viewer, itemIndex: count, order: [], picked: null, flipped: false }
  }
  return { ...viewer, itemIndex, order, picked: null, flipped: false }
}

export function flipCard(viewer: SemTextViewer): SemTextViewer {
  if (viewer.mode !== 'quiz' || viewer.factSetKind !== 'flashcards') return viewer
  return { ...viewer, flipped: !viewer.flipped }
}

export function setExpanded(viewer: SemTextViewer, key: string, open: boolean): SemTextViewer {
  return { ...viewer, expanded: { ...viewer.expanded, [key]: open } }
}

export function setActiveView(viewer: SemTextViewer, key: string, index: number): SemTextViewer {
  return { ...viewer, activeView: { ...viewer.activeView, [key]: index } }
}

// --- glyph vocabulary (ours; content never contributes glyphs) ---

export const GLYPHS = {
  kind: {
    note: '📌',
    warning: '⚠',
    procedure: '🧭',
    step: '→',
    table: '▦',
    code: '⌨',
    facts: '❓',
    flashcards: '🃏',
    reveal: '💡',
    property: '🔑',
    properties: '🗂',
    views: '👁',
    view: '◦',
    reader: '📖',
    source: '◫',
    section: '§',
    fact: '❍',
    misc: '·',
  },
  npl: {
    mindread: '◆',
    thought: '◇',
    hormones: '≈',
    intent: '→',
    ref: '↗',
    block: '▣',
    wedge: '▲',
    shadow: '▼',
    critic: '✕',
    weego: '◎',
    // The spec's wider NPL family (sem-text v0.8 §npl): one glyph per tag,
    // kept to the same geometric/dingbat register as the rest of the pane.
    agent: 'Ⓐ',
    directive: '➤',
    section: '☰',
    rubric: '◈',
    critique: '⚑',
    declaration: '❝',
    example: '✦',
    flag: '⚐',
    mode: '▧',
    mood: '⋇',
    poa: '➤',
    vos: '◍',
    artifact: '⬢',
    cot: '⋯',
  },
  tree: { branch: '├──', last: '└──', spine: '│', blank: ' ' },
  crumb: '›',
  selected: '❯',
  toggle: { open: '▸', shut: '▾' },
  quote: '▌',
  option: '▢',
  bar: { full: '▰', empty: '▱' },
  check: '✓',
  cross: '✗',
  more: '…',
  active: '●',
  nav: { back: '◂', next: '▸' },
  frame: {
    tl: '┌',
    tr: '┐',
    bl: '└',
    br: '┘',
    h: '─',
    v: '│',
    teeDown: '┬',
    teeUp: '┴',
    cross: '┼',
    teeLeft: '├',
    teeRight: '┤',
  },
} as const

/** A run of `n` box-drawing horizontals. */
const hRule = (n: number): string => GLYPHS.frame.h.repeat(Math.max(0, n))

/** Code-point length (widths in this module count code points, not units). */
export const cpLen = (value: string): number => Array.from(value).length

/** Which vocabulary glyph names `node`'s kind. */
export function glyphOf(node: SemTextNode): string {
  const kind = node.attrs['kind'] ?? node.attrs['data-kind'] ?? node.attrs['variant']
  if (node.tag === 'sem-note' && kind === 'warning') {
    return GLYPHS.kind.warning
  }
  const byTag: Record<string, string> = {
    'sem-note': GLYPHS.kind.note,
    'sem-guard-rail': GLYPHS.kind.warning,
    'sem-guard-rails': GLYPHS.kind.warning,
    'sem-procedure': GLYPHS.kind.procedure,
    'sem-howto': GLYPHS.kind.procedure,
    'sem-runbook': GLYPHS.kind.procedure,
    'sem-workflow': GLYPHS.kind.procedure,
    'sem-plan': GLYPHS.kind.procedure,
    'sem-tsg': GLYPHS.kind.procedure,
    'sem-tsgs': GLYPHS.kind.procedure,
    'sem-step': GLYPHS.kind.step,
    'sem-table': GLYPHS.kind.table,
    'sem-code': GLYPHS.kind.code,
    'sem-md': GLYPHS.kind.code,
    'sem-facts': GLYPHS.kind.facts,
    'sem-faq': GLYPHS.kind.facts,
    'sem-faqs': GLYPHS.kind.facts,
    'sem-question': GLYPHS.kind.facts,
    'sem-fact': GLYPHS.kind.fact,
    'sem-reveal': GLYPHS.kind.reveal,
    'sem-detail': GLYPHS.kind.reveal,
    'sem-details': GLYPHS.kind.reveal,
    'sem-property': GLYPHS.kind.property,
    'sem-tag-attr': GLYPHS.kind.property,
    'sem-tag-def': GLYPHS.kind.property,
    'sem-properties': GLYPHS.kind.properties,
    'sem-profile': GLYPHS.kind.properties,
    'sem-views': GLYPHS.kind.views,
    'sem-view': GLYPHS.kind.view,
    'sem-reader': GLYPHS.kind.reader,
    'sem-kb': GLYPHS.kind.reader,
    'sem-source': GLYPHS.kind.source,
    'sem-data-source': GLYPHS.kind.source,
    'sem-reference': GLYPHS.kind.source,
    'sem-references': GLYPHS.kind.source,
    'sem-api-call': GLYPHS.kind.source,
    'sem-section': GLYPHS.kind.section,
    'sem-summary': GLYPHS.kind.section,
    'sem-tldr': GLYPHS.kind.section,
    'sem-conclusion': GLYPHS.kind.section,
  'npl-mindread': GLYPHS.npl.mindread,
  'npl-thought': GLYPHS.npl.thought,
  'npl-block': GLYPHS.npl.block,
  'npl-ref': GLYPHS.npl.ref,
  'npl-hormones': GLYPHS.npl.hormones,
  'npl-intent': GLYPHS.npl.intent,
  'npl-agent': GLYPHS.npl.agent,
  'npl-directive': GLYPHS.npl.directive,
  'npl-section': GLYPHS.npl.section,
  'npl-rubric': GLYPHS.npl.rubric,
  'npl-critique': GLYPHS.npl.critique,
  'npl-declaration': GLYPHS.npl.declaration,
  'npl-example': GLYPHS.npl.example,
  'npl-flag': GLYPHS.npl.flag,
  'npl-flags': GLYPHS.npl.flag,
  'npl-mode': GLYPHS.npl.mode,
  'npl-mood': GLYPHS.npl.mood,
  'npl-poa': GLYPHS.npl.poa,
  'npl-vos': GLYPHS.npl.vos,
  'npl-artifact': GLYPHS.npl.artifact,
  'npl-cot': GLYPHS.npl.cot,
  wedge: GLYPHS.npl.wedge,
  shadow: GLYPHS.npl.shadow,
  critic: GLYPHS.npl.critic,
  weego: GLYPHS.npl.weego,
  }
  return byTag[node.tag] ?? GLYPHS.kind.misc
}

/** An element's label: named attr else tag, sanitized, `#id` appended. */
export function labelOf(node: SemTextNode): string {
  const named = node.attrs['label'] ?? node.attrs['title'] ?? node.attrs['name']
  const head =
    named !== undefined ? `${node.tag} — ${sanitize(named).slice(0, 60)}` : node.tag
  const id = node.attrs['id']
  return id !== undefined ? `${head} #${sanitize(id)}` : head
}

// --- pure drawing helpers ---

/**
 * Fits `value` into `width` code points, cutting with `…` (which counts as a
 * cell). `width <= 0` yields ''.
 */
export function truncateCell(value: string, width: number): string {
  if (width <= 0) return ''
  const chars = Array.from(value)
  if (chars.length <= width) return value
  return `${chars.slice(0, width - 1).join('')}${GLYPHS.more}`
}

/**
 * Splits `value` into at most `maxLines` rows of at most `width` code points.
 * Word mode (default) wraps prose at whitespace: each row breaks after the
 * last whole word that fits and the break's whitespace run is consumed, while
 * leading indentation survives and a token longer than the width hard-cuts.
 * Char mode keeps the raw fixed-width slicing — code/pre bodies pass it so
 * source lines never reflow (tables truncate cells instead and never reach
 * this helper). The final row ends in `…` when content remains. Width counts
 * code points like truncateCell — an emoji is one unit, so double-width
 * glyphs still misalign by one cell (accepted, tracked in the defect ledger).
 */
export function wrapLines(
  value: string,
  width: number,
  maxLines: number,
  mode: 'word' | 'char' = 'word',
): string[] {
  const cells = Math.max(1, width)
  const chars = Array.from(value)
  const out: string[] = []
  const isSpace = (ch: string): boolean => ch === ' ' || ch === '\t' || ch === '\n'
  let at = 0
  while (at < chars.length && out.length < maxLines) {
    const rest = chars.length - at
    if (rest <= cells) {
      out.push(chars.slice(at).join(''))
      at += rest
      break
    }
    const window = chars.slice(at, at + cells)
    // Last whitespace inside the window: the wrap point (word mode only).
    let brk = -1
    if (mode === 'word') {
      for (let i = window.length - 1; i >= 0; i--) {
        if (isSpace(window[i]!)) {
          brk = i
          break
        }
      }
    }
    if (brk > 0) {
      out.push(window.slice(0, brk).join(''))
      at += brk
      // The whole run at the break is the boundary — consume it so the next
      // row starts on a word character.
      while (at < chars.length && isSpace(chars[at]!)) at++
    } else if (brk === 0 && at > 0) {
      // The window opens on whitespace mid-text: it is the boundary left
      // hanging from the previous row — skip it and keep filling this row.
      while (at < chars.length && isSpace(chars[at]!)) at++
    } else {
      // No usable break (a token longer than the width, or leading
      // indentation at the very start): hard-cut the window. Leading
      // indentation survives the cut, so the first row keeps its prefix.
      out.push(window.join(''))
      at += cells
    }
  }
  if (at < chars.length && out.length > 0) {
    const last = out.length - 1
    // Content was dropped: always mark the cut, reserving a cell for the glyph.
    out[last] = `${truncateCell(out[last]!, Math.max(1, cells - 1))}${GLYPHS.more}`
  }
  return out
}

/** `├── ` / `└── ` under `│` spines: one row of a file-tree outline. */
export function treePrefix(ancestorsLast: readonly boolean[], isLast: boolean): string {
  const spine = ancestorsLast
    .map(last => (last ? '   ' : `${GLYPHS.tree.spine}  `))
    .join('')
  return `${spine}${isLast ? GLYPHS.tree.last : GLYPHS.tree.branch} `
}

/**
 * The outline's selected-row mark: dedicated `❯` in the leftmost column,
 * blank elsewhere. `▸`/`▾` stay toggle/nav glyphs — they never mean selection.
 */
export function selectedMark(isSelected: boolean): string {
  return isSelected ? GLYPHS.selected : ' '
}

/** `▰▰▱▱`: `filled/total` over `cells` cells, rounded, clamped. */
export function progressBar(filled: number, total: number, cells: number): string {
  if (cells <= 0) return ''
  const ratio = total <= 0 ? 0 : Math.min(Math.max(filled, 0), total) / total
  const full = Math.min(cells, Math.max(0, Math.round(ratio * cells)))
  return GLYPHS.bar.full.repeat(full) + GLYPHS.bar.empty.repeat(cells - full)
}

/** The runner's meter line: `▰▰▱▱ 2/4 · score 1/1`. */
export function meterLine(
  isQuiz: boolean,
  position: number,
  n: number,
  viewer: SemTextViewer,
  cells = 8,
): string {
  const base = `${progressBar(Math.min(Math.max(position, 0), n), n, cells)} ${position}/${n}`
  return isQuiz
    ? `${base} · score ${viewer.score.correct}/${viewer.score.answered}`
    : base
}

/** A markdown delimiter cell: `---`, `:---`, `---:`, `:---:`. */
const DELIM_CELL = /^:?-+:?$/

/**
 * Cells of a textual table row: pipe- or tab-delimited, else one cell.
 * Markdown delimiter rows (`| --- | :---: |`) are separator decoration, not
 * data — dropped, so a pipe table's body starts at its first real row.
 */
export function tableCells(rows: readonly string[]): string[][] {
  const out: string[][] = []
  for (const raw of rows) {
    const line = raw.trim()
    if (line === '') continue
    let cells = line.includes('|')
      ? line.split('|')
      : line.includes('\t')
        ? line.split('\t')
        : [line]
    cells = cells.map(cell => collapseWhitespace(sanitize(cell)))
    if (cells.length > 1 && cells[0] === '') cells = cells.slice(1)
    if (cells.length > 1 && cells[cells.length - 1] === '') {
      cells = cells.slice(0, -1)
    }
    if (cells.every(cell => cell === '')) continue
    if (cells.every(cell => DELIM_CELL.test(cell))) continue
    out.push(cells)
  }
  return out
}

/**
 * Per-column widths of `cells`: the widest cell each, shrunk one code point at
 * a time from the widest column until the drawn row (`│ ` + cells + ` │`, i.e.
 * sum + 3·cols + 1 cells) fits `maxTotal` (3-cell floor per column).
 */
export function columnWidths(cells: readonly string[][], maxTotal: number): number[] {
  const cols = cells.reduce((max, row) => Math.max(max, row.length), 0)
  if (cols === 0) return []
  const widths = Array.from({ length: cols }, (_, c) =>
    cells.reduce((max, row) => Math.max(max, cpLen(row[c] ?? '')), 1),
  )
  const min = 3
  const budget = Math.max(cols * min, maxTotal - (3 * cols + 1))
  const sum = (ws: readonly number[]): number => ws.reduce((a, b) => a + b, 0)
  while (sum(widths) > budget) {
    let at = -1
    let widest = min - 1
    widths.forEach((w, i) => {
      if (w > widest) {
        widest = w
        at = i
      }
    })
    if (at < 0) break
    widths[at] = widest - 1
  }
  return widths
}

/**
 * A box-drawn table: `┌─┬─┐` top, the first row the header, `├─┼─┤` under it,
 * at most `maxRows` rows in all, `└─┴─┘` bottom. Cells truncate with `…`.
 */
export function drawTable(
  cells: readonly string[][],
  width: number,
  maxRows: number,
): { lines: string[]; headerRows: number; hidden: number } {
  if (cells.length === 0 || width < 6) return { lines: [], headerRows: 0, hidden: 0 }
  const cols = cells.reduce((max, row) => Math.max(max, row.length), 0)
  const grid = cells.map(row =>
    Array.from({ length: cols }, (_, c) => row[c] ?? ''),
  )
  const widths = columnWidths(grid, width - 2)
  const rule = (joiner: string, left: string, right: string): string =>
    `${left}${widths.map(w => hRule(w + 2)).join(joiner)}${right}`
  const rowLine = (row: readonly string[]): string =>
    `${GLYPHS.frame.v} ${widths
      .map((w, c) => truncateCell(row[c] ?? '', w).padEnd(w))
      .join(` ${GLYPHS.frame.v} `)} ${GLYPHS.frame.v}`
  const cap = Math.max(1, maxRows)
  const shown = grid.slice(0, cap)
  const hidden = Math.max(0, grid.length - shown.length)
  const lines: string[] = [rule(GLYPHS.frame.teeDown, GLYPHS.frame.tl, GLYPHS.frame.tr)]
  shown.forEach((row, i) => {
    if (i === 1) lines.push(rule(GLYPHS.frame.cross, GLYPHS.frame.teeLeft, GLYPHS.frame.teeRight))
    lines.push(rowLine(row))
  })
  lines.push(rule(GLYPHS.frame.teeUp, GLYPHS.frame.bl, GLYPHS.frame.br))
  return { lines, headerRows: 1, hidden }
}

/**
 * A hand-drawn frame (┌─ corner chars) around `lines`, its top border carrying
 * `badge` left- or right-aligned. Lines longer than the frame truncate.
 */
export function frameLines(
  lines: readonly string[],
  width: number,
  badge = '',
  align: 'left' | 'right' = 'left',
): string[] {
  const inner = Math.max(4, width - 2)
  const cellW = inner - 2 // '│ ' + content + ' │'
  const badgeText = badge === '' ? '' : ` ${truncateCell(badge, Math.max(0, cellW - 2))} `
  const open = badgeText === '' ? hRule(inner) : hRule(2) + badgeText
  const close = badgeText === '' ? '' : hRule(Math.max(0, inner - 2 - cpLen(badgeText)))
  const top =
    badgeText !== '' && align === 'right'
      ? `${GLYPHS.frame.tl}${close}${badgeText}${hRule(2)}${GLYPHS.frame.tr}`
      : `${GLYPHS.frame.tl}${open}${close}${GLYPHS.frame.tr}`
  return [
    top,
    ...lines.map(line =>
      `${GLYPHS.frame.v} ${truncateCell(line, cellW).padEnd(cellW)} ${GLYPHS.frame.v}`,
    ),
    `${GLYPHS.frame.bl}${hRule(inner)}${GLYPHS.frame.br}`,
  ]
}

/**
 * Lines of a card frame whose top border IS the toggle: `┌ ▾ badge ───┐` when
 * open (the body rows run between it and `└───┘`), `┌ ▸ badge · hint ───┐`
 * when shut (that single line is the whole card — collapsed shows a size
 * hint). Below ~32 columns the right/bottom borders drop and body rows carry
 * a bare `│ ` left rule instead of a full frame. Every line is prefixed with
 * `inset` spaces so nested cards sit inside their parent's frame (box-model
 * nesting). `toggle: false` draws a plain labelled frame (prose boxes): no
 * toggle glyph, no press target.
 */
export function cardFrameLines(
  width: number,
  inset: number,
  opts: {
    badge: string
    open: boolean
    /** Size hint shown while shut, e.g. `3 lines` or `2 children`. */
    hint?: string
    bodyLines?: readonly string[]
    toggle?: boolean
    /** Just the header line (the JSX card adds body/children itself). */
    headerOnly?: boolean
  },
): string[] {
  const padStr = ' '.repeat(inset)
  const inner = Math.max(10, width - inset - 2)
  const cellW = Math.max(6, inner - 2) // '│ ' + content + ' │'
  const narrow = inner < 30
  const toggleable = opts.toggle !== false
  const label =
    toggleable && !opts.open && opts.hint !== undefined && opts.hint !== ''
      ? `${opts.badge} · ${opts.hint}`
      : opts.badge
  const toggleGlyph = opts.open ? GLYPHS.toggle.shut : GLYPHS.toggle.open
  const headCore = toggleable ? `${toggleGlyph} ${label}` : label
  const headText = truncateCell(headCore, Math.max(4, inner - 2))
  const fill = Math.max(0, inner - 1 - cpLen(headText) - 1)
  const top = `${GLYPHS.frame.tl} ${headText} ${hRule(fill)}`
  if (opts.headerOnly) {
    // Header line only; the glyph still reflects the real open state so the
    // pane's first row shows ▾ on an open card and ▸ on a shut one.
    return [padStr + top + (narrow ? '' : GLYPHS.frame.tr)]
  }
  if (!toggleable || !opts.open) {
    // Shut card: the header line is the whole card. Prose boxes end with the
    // corner like any frame.
    return [padStr + top + (toggleable ? '' : GLYPHS.frame.tr)]
  }
  const body = (opts.bodyLines ?? []).map(line =>
    narrow
      ? `${GLYPHS.frame.v} ${truncateCell(line, Math.max(4, cellW - 2))}`
      : `${GLYPHS.frame.v} ${truncateCell(line, cellW).padEnd(cellW)} ${GLYPHS.frame.v}`,
  )
  const bottom = narrow ? '' : `${GLYPHS.frame.bl}${hRule(inner)}${GLYPHS.frame.br}`
  return [
    padStr + top + (narrow ? '' : GLYPHS.frame.tr),
    ...body.map(line => padStr + line),
    ...(bottom === '' ? [] : [padStr + bottom]),
  ]
}

/**
 * Prose rows for a captured text: `<br>` variants and literal newlines split
 * rows (consecutive blanks collapse to one empty row), each row word-wraps
 * inside the width, and an over-budget tail ends in `…`. `firstPrefix` (a
 * block's `##`/`▌` marker) rides the first row — wrapping reserves its
 * columns. Code/pre bodies never pass through here (verbatim lines).
 */
export function proseLines(
  value: string,
  width: number,
  maxLines: number,
  firstPrefix = '',
): string[] {
  const segments = sanitize(value)
    .split(/<br\s*\/?>/gi)
    .flatMap(seg => seg.split('\n'))
    .map(seg => seg.trim())
  while (segments.length > 0 && segments[0] === '') segments.shift()
  while (segments.length > 0 && segments[segments.length - 1] === '') segments.pop()
  const rows: string[] = []
  segments.forEach((seg, i) => {
    if (seg === '') {
      if (rows.length > 0 && rows[rows.length - 1] !== '') rows.push('')
      return
    }
    const prefix = i === 0 ? firstPrefix : ''
    const prefixWidth = cpLen(prefix)
    // Wrap under the marker's narrower column; continuation rows stay aligned
    // under the marked text (they ride the same reduced width).
    const wrapped = wrapLines(seg, Math.max(4, width - prefixWidth), Math.max(1, maxLines - rows.length))
    if (prefixWidth > 0 && wrapped.length > 0) {
      rows.push(prefix + wrapped[0]!, ...wrapped.slice(1))
    } else {
      rows.push(...wrapped)
    }
  })
  if (rows.length > maxLines) {
    const shown = rows.slice(0, maxLines)
    const last = shown.length - 1
    shown[last] = `${truncateCell(shown[last]!, Math.max(1, width - 1))}${GLYPHS.more}`
    return shown
  }
  return rows
}

/** The dim `… (+N chars)` row for a capture-cap-cut body; '' when whole. */
export function truncationHint(node: SemTextNode): string {
  return node.truncated !== undefined && node.truncated > 0
    ? `${GLYPHS.more} (+${node.truncated} chars)`
    : ''
}

/** `🔑 ttl ──▸ 3600` rows, keys column-aligned, values truncated. */
export function propertyLines(
  properties: readonly { key: string; value: string }[],
  width: number,
): string[] {
  if (properties.length === 0) return []
  const keyCol = Math.min(
    24,
    Math.max(...properties.map(property => cpLen(sanitize(property.key))), 1),
  )
  return properties.map(property => {
    const key = truncateCell(sanitize(property.key), keyCol).padEnd(keyCol)
    const rest = Math.max(1, width - keyCol - 5)
    return `${GLYPHS.kind.property} ${key} ──▸ ${truncateCell(sanitize(property.value), rest)}`
  })
}

/** Outline rows of `tree`: file-tree prefixes, kind glyphs, child-count badges. */
export type OutlineRow = {
  key: string
  depth: number
  label: string
  prefix: string
  glyph: string
  count: number
}

export function outlineTree(tree: readonly SemTextNode[], maxDepth = 8): OutlineRow[] {
  const rows: OutlineRow[] = []
  const walk = (nodes: readonly SemTextNode[], depth: number, base: string, ancestors: readonly boolean[]): void => {
    nodes.forEach((node, i) => {
      const isLast = i === nodes.length - 1
      const key = `${base}${i}`
      rows.push({
        key,
        depth,
        label: labelOf(node),
        prefix: treePrefix(ancestors, isLast),
        glyph: glyphOf(node),
        count: node.children.length,
      })
      if (depth < maxDepth) walk(node.children, depth + 1, `${key}.`, [...ancestors, isLast])
    })
  }
  walk(tree, 0, '', [])
  return rows
}

/**
 * Keys of the card nodes whose renderers consult `viewer.expanded` — the
 * section family (framed, subtree collapse), the note/reveal family and the
 * npl block family. Expand-all / collapse-all walks these; dotted keys match
 * outlineTree's scheme.
 */
export function cardKeys(tree: readonly SemTextNode[]): string[] {
  const out: string[] = []
  const walk = (nodes: readonly SemTextNode[], base: string): void => {
    nodes.forEach((node, i) => {
      const key = `${base}${i}`
      if (
        node.tag === 'sem-section' ||
        node.tag === 'sem-summary' ||
        node.tag === 'sem-tldr' ||
        node.tag === 'sem-note' ||
        node.tag === 'sem-reveal' ||
        node.tag === 'sem-detail' ||
        node.tag === 'sem-details' ||
        node.tag.startsWith('npl-') ||
        node.tag === 'wedge' ||
        node.tag === 'shadow' ||
        node.tag === 'critic' ||
        node.tag === 'weego'
      ) {
        out.push(key)
      }
      walk(node.children, `${key}.`)
    })
  }
  walk(tree, '')
  return out
}

/** `source › section › subsection` parts of an outline key: trail then leaf. */
export function breadcrumbOf(
  tree: readonly SemTextNode[],
  key: string,
): { trail: string[]; leaf: string } {
  const labels: string[] = []
  let nodes = tree
  for (const part of key.split('.')) {
    const idx = Number.parseInt(part, 10)
    const node = Number.isInteger(idx) && idx >= 0 ? nodes[idx] : undefined
    if (node === undefined) break
    labels.push(labelOf(node))
    nodes = node.children
  }
  if (labels.length === 0) return { trail: [], leaf: '' }
  return { trail: labels.slice(0, -1), leaf: labels[labels.length - 1]! }
}

// --- the render registry ---

export type PaneElements = {
  Box: ElementConstructor<BoxProps>
  Text: ElementConstructor<TextProps>
  Button: ElementConstructor<ButtonProps>
}

export type RenderCtx = {
  /** The element constructors `$.ui.resolve(e)` handed the pane hook. */
  el: PaneElements
  viewer: SemTextViewer
  /** Body columns of the pane (adapted renders). */
  width: number
  /** Spaces every drawn line is prefixed with (nesting depth × 2). */
  inset: number
  /** Outline key path of the node being rendered. */
  wkey: string
  /** Rows the section view still has room for. */
  budget: number
  /** Rows spent by renderers so far (shared, mutated). */
  spent: { rows: number }
  /** May the generic fallback draw the node's flattened body text? */
  showBody: boolean
  /** Applies a viewer reducer through the pane's atom. */
  press: (fn: (viewer: SemTextViewer) => SemTextViewer) => void
}

export type ElementRenderer = (node: SemTextNode, ctx: RenderCtx) => RenderElement

const roomOf = (ctx: RenderCtx): number => Math.max(0, ctx.budget - ctx.spent.rows)
const spend = (ctx: RenderCtx, rows: number): void => {
  ctx.spent.rows += rows
}
/** Columns a renderer may draw in: pane width minus the nesting inset. */
const widthOf = (ctx: RenderCtx): number => Math.max(12, ctx.width - ctx.inset)
/** Prefixes a row with the nesting inset — frame-in-frame children indent. */
const pad = (ctx: RenderCtx, line: string): string => `${' '.repeat(ctx.inset)}${line}`

const EMPTY = (ctx: RenderCtx): RenderElement => ctx.el.Box({})

/** Shared text-row builder for renderer bodies (inset-prefixed). */
function dimRows(
  ctx: RenderCtx,
  lines: readonly string[],
  key: string,
  dim = true,
): RenderElement[] {
  return lines.map(
    (line, i) =>
      h(ctx.el.Text, { key: `${key}${i}`, dimColor: dim }, pad(ctx, line)) as RenderElement,
  )
}

// --- headings (bold + underline rules) ---

export type HeadingStyle = {
  bold: boolean
  dim: boolean
  /** Rule character under the heading, null = no rule. */
  ruleChar: string | null
  /** true = the rule spans only the heading text's longest row. */
  ruleUnderText: boolean
}

/** h1 `═` full width · h2 `─` full width · h3 `┄` under text · h4 bold · h5/h6 bold+dim. */
export function headingStyle(level: number): HeadingStyle {
  const lv = Math.min(6, Math.max(1, level))
  if (lv === 1) return { bold: true, dim: false, ruleChar: '═', ruleUnderText: false }
  if (lv === 2) return { bold: true, dim: false, ruleChar: '─', ruleUnderText: false }
  if (lv === 3) return { bold: true, dim: false, ruleChar: '┄', ruleUnderText: true }
  return { bold: true, dim: lv >= 5, ruleChar: null, ruleUnderText: false }
}

/**
 * A heading's rows at `width`: word-wrapped bold text, then its rule
 * (emoji/code-point aware — the rule length follows cpLen, matching every
 * other width decision in the pane). The rule row is a separate entry so the
 * pane can style it unbolded.
 */
export function headingBlock(
  value: string,
  width: number,
  level: number,
  maxLines = 8,
): { text: string[]; rule: string | null; style: HeadingStyle } {
  const style = headingStyle(level)
  const wrapped = wrapLines(sanitize(value), Math.max(4, width), maxLines)
  let rule: string | null = null
  if (style.ruleChar !== null && wrapped.length > 0) {
    const span = style.ruleUnderText
      ? Math.max(...wrapped.map(row => cpLen(row)))
      : Math.max(4, width)
    rule = style.ruleChar.repeat(span)
  }
  return { text: wrapped, rule, style }
}

// --- captured blocks (heading/quote/prose) as style-tagged rows ---

export type StyledRow = { text: string; bold?: boolean; dim?: boolean }

/** One captured block as style-tagged rows (headings bold + rule, quotes `▌` dim, prose plain). */
export function blockRows(block: SemBlock, width: number, maxLines: number): StyledRow[] {
  if (block.kind === 'heading') {
    const head = headingBlock(block.text, width, block.level, maxLines)
    const rows: StyledRow[] = head.text.map(text => ({
      text,
      bold: head.style.bold,
      dim: head.style.dim,
    }))
    if (head.rule !== null) rows.push({ text: head.rule })
    return rows
  }
  if (block.kind === 'quote') {
    return wrapLines(sanitize(block.text), Math.max(4, width - 2), maxLines).map(text => ({
      text: `${GLYPHS.quote} ${text}`,
      dim: true,
    }))
  }
  return wrapLines(sanitize(block.text), Math.max(4, width), maxLines).map(text => ({ text }))
}

/** Consecutive blocks as rows; one blank row above every heading but the first row of the set. */
export function blocksRows(
  blocks: readonly SemBlock[],
  width: number,
  maxLines: number,
): StyledRow[] {
  const rows: StyledRow[] = []
  for (const block of blocks) {
    const drawn = blockRows(block, width, Math.max(1, maxLines - rows.length))
    if (drawn.length === 0) continue
    if (
      block.kind === 'heading' &&
      rows.length > 0 &&
      rows[rows.length - 1]!.text !== ''
    ) {
      rows.push({ text: '' })
    }
    rows.push(...drawn)
    if (rows.length >= maxLines) break
  }
  return rows.slice(0, maxLines)
}

/** Rows a captured text would occupy once `<br>`/newlines split it (shut-card size hints). */
export function lineCount(value: string): number {
  const segments = sanitize(value)
    .split(/<br\s*\/?>/gi)
    .flatMap(seg => seg.split('\n'))
    .map(seg => seg.trim())
  while (segments.length > 0 && segments[0] === '') segments.shift()
  while (segments.length > 0 && segments[segments.length - 1] === '') segments.pop()
  return segments.filter(seg => seg !== '').length
}

// --- the card: one presentation for every framed element ---

type CardOpts = {
  /** Outline key path (drives viewer.expanded + the toggle press). */
  key: string
  badge: string
  open: boolean
  /** Size hint shown while shut (`3 lines`, `2 children`). */
  hint?: string
  /** Prose body (word-wrapped, `<br>`/newline aware, blank-collapse, dim). */
  body?: string
  /** Verbatim lines (code): no trim, no blank-collapse, hard-cut at the frame. */
  rawLines?: readonly string[]
  /** Prebuilt body rows (procedure steps) drawn dim. */
  rows?: readonly string[]
  /** Captured blocks (headings bold + rule, quotes, prose). */
  blocks?: readonly SemBlock[]
  /** Element children drawn INSIDE the frame below the body (box nesting). */
  children?: readonly SemTextNode[]
  /** Dim footer row (`… (+N chars)`); the over-budget marker is added on top. */
  footer?: string
  /** false = a plain labelled box (prose): header is not a button. */
  toggle?: boolean
  /** Bold header text (section titles are document headings). */
  bold?: boolean
}

/**
 * The single card presentation: header line = the toggle button (or plain
 * label for prose boxes), body rows inside the frame, child cards nested
 * between body and bottom border (box-model nesting), dim footer. Every
 * framed renderer goes through here — no renderer draws its own hide row.
 * Budget: header + bottom border reserved first, children render at
 * inset+2 against the shared ledger, then the body is fitted to the rest.
 */
function cardBlock(ctx: RenderCtx, opts: CardOpts): RenderElement {
  const { Box, Text, Button } = ctx.el
  const toggleable = opts.toggle !== false
  const open = toggleable && opts.open
  const innerW = Math.max(10, ctx.width - ctx.inset - 2)
  const narrow = innerW < 30

  const header = cardFrameLines(ctx.width, ctx.inset, {
    badge: opts.badge,
    open: opts.open,
    hint: opts.hint,
    toggle: toggleable,
    headerOnly: true,
  })[0]!

  const headerEl: RenderElement = !toggleable ? (
    <Text bold={opts.bold} dimColor={!opts.bold}>
      {header}
    </Text>
  ) : (
    <Button
      key={`x:${opts.key}`}
      plain
      onPress={() => ctx.press(v => setExpanded(v, opts.key, !opts.open))}
    >
      {header}
    </Button>
  )

  if (!open) {
    spend(ctx, 1)
    return <Box>{headerEl}</Box>
  }

  spend(ctx, 1) // header
  const bottomBorder = narrow ? '' : `${GLYPHS.frame.bl}${hRule(innerW)}${GLYPHS.frame.br}`
  if (bottomBorder !== '') spend(ctx, 1)

  // Children first (they claim budget at inset+2, dotted keys match outlineTree).
  // showBody: true — nested unknown tags keep their text (boxed generic).
  const childEls: RenderElement[] = []
  ;(opts.children ?? []).forEach((child, i) => {
    if (roomOf(ctx) <= 0) return
    const render = RENDERERS[child.tag] ?? RENDERERS['*']!
    const sub: RenderCtx = {
      ...ctx,
      inset: ctx.inset + 2,
      wkey: `${opts.key}.${i}`,
      showBody: true,
    }
    childEls.push(render(child, sub))
  })

  // Body rows, fitted to the room the children left (the footer keeps one row
  // of budget when the body overflows or carries a truncation hint).
  let bodyRows: StyledRow[] = []
  if (opts.blocks !== undefined && opts.blocks.length > 0) {
    bodyRows = blocksRows(opts.blocks, Math.max(6, innerW - 4), 400)
  } else if (opts.rawLines !== undefined) {
    for (const line of opts.rawLines) {
      if (bodyRows.length >= 400) break
      wrapLines(line.replace(/\t/g, '  '), Math.max(6, innerW - 4), 400 - bodyRows.length, 'char').forEach(
        text => bodyRows.push({ text, dim: true }),
      )
    }
  } else if (opts.rows !== undefined) {
    bodyRows = opts.rows.slice(0, 400).map(text => ({ text, dim: true }))
  } else if (opts.body !== undefined && opts.body !== '') {
    bodyRows = proseLines(opts.body, Math.max(6, innerW - 4), 400).map(text => ({ text, dim: true }))
  }
  const room = roomOf(ctx)
  const fits = bodyRows.length <= room - (opts.footer !== undefined && opts.footer !== '' ? 1 : 0)
  const fitted = fits ? bodyRows : bodyRows.slice(0, Math.max(0, room - 1))
  const hiddenRows = bodyRows.length - fitted.length
  const footer = [
    opts.footer !== undefined && opts.footer !== '' ? opts.footer : '',
    hiddenRows > 0 ? `${GLYPHS.more} (+${hiddenRows} rows)` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  spend(ctx, fitted.length + (footer !== '' ? 1 : 0))

  // The open frame re-uses the same header (glyph direction included), so
  // what was drawn shut and what was drawn open agree on the first row.
  const frame = cardFrameLines(ctx.width, ctx.inset, {
    badge: opts.badge,
    open: true,
    hint: opts.hint,
    bodyLines: fitted.map(row => row.text),
  })
  // frame = [header, ...body gutter rows..., bottom (absent when narrow)]
  const hasBottom = !narrow && frame.length > 1
  const gutter = frame.slice(1, hasBottom ? -1 : undefined)

  return (
    <Box flexDirection="column">
      {headerEl}
      {gutter.map((line, i) => {
        const style = fitted[i] ?? { text: line }
        return (
          <Text key={`g${i}`} bold={style.bold} dimColor={style.dim ?? true}>
            {line}
          </Text>
        )
      })}
      {childEls}
      {hasBottom ? (
        <Text dimColor>{frame[frame.length - 1]!}</Text>
      ) : null}
      {footer !== '' ? <Text dimColor>{`${pad(ctx, '')}${footer}`}</Text> : null}
    </Box>
  )
}

// --- per-kind renderers ---

const noteRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'note') return genericRenderer(node, ctx)
  const warn =
    (node.attrs['kind'] ?? node.attrs['data-kind'] ?? node.attrs['variant']) === 'warning'
  const glyph = warn ? GLYPHS.kind.warning : GLYPHS.kind.note
  // Notes default open: the body shows inline inside its card frame; the
  // header IS the toggle (no separate hide row).
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge: `${glyph} note`,
    open: ctx.viewer.expanded[ctx.wkey] ?? true,
    hint: `${lineCount(content.body)} lines`,
    body: content.body,
    footer: truncationHint(node),
  })
}

const revealRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'reveal') return genericRenderer(node, ctx)
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge: `${GLYPHS.kind.reveal} ${node.tag === 'sem-reveal' ? 'reveal' : 'detail'}`,
    open: ctx.viewer.expanded[ctx.wkey] ?? !content.collapsed,
    hint: `${lineCount(content.body)} lines`,
    body: content.body,
    footer: truncationHint(node),
  })
}

const factsRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'facts') return genericRenderer(node, ctx)
  const { Box, Text, Button } = ctx.el
  const room = roomOf(ctx)
  if (room <= 0) return EMPTY(ctx)
  const name =
    content.viewAs === 'quiz'
      ? 'quiz'
      : content.viewAs === 'flashcards'
        ? 'flashcards'
        : 'facts'
  const glyph = content.viewAs === 'flashcards' ? GLYPHS.kind.flashcards : GLYPHS.kind.facts
  if (content.viewAs === 'list') {
    // List mode shows every item with its conclusion inline — the browser
    // leaves list markup visible, so nothing hides here.
    const head = `${glyph} ${name} · ${content.items.length} items`
    const lines = content.items
      .slice(0, Math.max(0, room - 1))
      .map(item => `${GLYPHS.kind.fact} ${factLine(item)}`)
    spend(ctx, lines.length + 1)
    return (
      <Box flexDirection="column">
        <Text dimColor>{pad(ctx, head)}</Text>
        {...dimRows(ctx, lines, 'fl')}
      </Box>
    )
  }
  spend(ctx, 2)
  const kind: 'quiz' | 'flashcards' = content.viewAs
  return (
    <Box flexDirection="column">
      <Text dimColor>{pad(ctx, `${glyph} ${name} · ${content.items.length} items`)}</Text>
      <Box flexDirection="row">
        <Text dimColor>{pad(ctx, '')}</Text>
        <Button
          key={`run:${ctx.wkey}`}
          plain
          onPress={() => {
            ctx.press(v => startQuiz(v, ctx.wkey, kind, buildQuizOptions(content.items, 0, content.seed)))
          }}
        >
          {`${GLYPHS.toggle.open} run ${name}`}
        </Button>
      </Box>
    </Box>
  )
}

const tableRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'table') return genericRenderer(node, ctx)
  const { Box, Text } = ctx.el
  const room = roomOf(ctx)
  if (room <= 1) return EMPTY(ctx)
  const cells = tableCells(content.rows)
  if (cells.length === 0) return EMPTY(ctx)
  const cols = cells.reduce((max, row) => Math.max(max, row.length), 0)
  const maxRows = Math.max(2, room - 1) // one row for the caption
  const { lines, hidden } = drawTable(cells, Math.max(12, widthOf(ctx) - 2), maxRows)
  spend(ctx, 1 + lines.length + (hidden > 0 ? 1 : 0))
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {pad(ctx, `${GLYPHS.kind.table} table · ${cells.length} rows × ${cols} cols`)}
      </Text>
      {/* lines[1] is the header row: emphasized; borders and body dim. */}
      {lines.map((line, i) =>
        i === 1
          ? h(ctx.el.Text, { key: `tb${i}`, bold: true }, pad(ctx, line))
          : h(ctx.el.Text, { key: `tb${i}`, dimColor: true }, pad(ctx, line)),
      )}
      {hidden > 0 ? (
        <Text dimColor>{pad(ctx, `${GLYPHS.more} (+${hidden} rows)`)}</Text>
      ) : null}
    </Box>
  )
}

const codeRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'code') return genericRenderer(node, ctx)
  const lang = sanitize(content.lang !== '' ? content.lang : (node.attrs['lang'] ?? ''))
  // Code never reflows: lines keep their column layout and hard-cut at the
  // frame edge (word mode is for prose only). C3 adds the dedicated code
  // renderer (gutter, tinting, markers); the card frame is already here.
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge: `${GLYPHS.kind.code}${lang !== '' ? ` ${lang}` : ''}`,
    open: ctx.viewer.expanded[ctx.wkey] ?? true,
    hint: `${content.body.split('\n').length} lines`,
    rawLines: content.body.split('\n'),
  })
}

const propertiesRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'properties') return genericRenderer(node, ctx)
  const { Box, Text } = ctx.el
  const room = roomOf(ctx)
  if (room <= 1) return EMPTY(ctx)
  const lines = propertyLines(content.properties, widthOf(ctx)).slice(0, room - 1)
  spend(ctx, lines.length + 1)
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {pad(ctx, `${GLYPHS.kind.properties} properties · ${content.properties.length}`)}
      </Text>
      {...dimRows(ctx, lines, 'pr', false)}
    </Box>
  )
}

const viewsRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'views') return genericRenderer(node, ctx)
  const { Box, Button } = ctx.el
  const room = roomOf(ctx)
  if (room <= 0) return EMPTY(ctx)
  const active = ctx.viewer.activeView[ctx.wkey] ?? content.initial
  const tabs: RenderElement[] = [h(ctx.el.Text, { key: 'lb', dimColor: true }, pad(ctx, '[')) as RenderElement]
  content.views.forEach((view, idx) => {
    if (idx > 0) tabs.push(h(ctx.el.Text, { key: `sep${idx}`, dimColor: true }, '│') as RenderElement)
    tabs.push(
      <Button
        key={`vt:${idx}`}
        plain
        onPress={() => ctx.press(v => setActiveView(v, ctx.wkey, idx))}
      >
        {(idx === active ? `${GLYPHS.active} ` : '') + sanitize(view.name)}
      </Button>,
    )
  })
  tabs.push(h(ctx.el.Text, { key: 'rb', dimColor: true }, pad(ctx, ']')) as RenderElement)
  spend(ctx, 1)
  const body = content.views[active]?.body ?? ''
  const lines =
    room > 1
      ? proseLines(body, Math.max(8, widthOf(ctx) - 2), room - 1)
      : []
  spend(ctx, lines.length)
  return (
    <Box flexDirection="column">
      <Box flexDirection="row">{tabs}</Box>
      {...dimRows(ctx, lines, 'vw')}
    </Box>
  )
}

const sectionRenderer: ElementRenderer = (node, ctx) => {
  // Section cards: the frame header carries toggle + glyph + title (bold — a
  // document heading); captured blocks (headings with their rules, quotes,
  // prose) and element children draw INSIDE the frame. No second heading row.
  const blocks = node.blocks ?? []
  const leafText = blocks.length === 0 ? (node.text ?? '') : ''
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge: `${glyphOf(node)} ${truncateCell(labelOf(node), Math.max(8, widthOf(ctx) - 8))}`,
    open: ctx.viewer.expanded[ctx.wkey] ?? true,
    bold: true,
    blocks,
    body: leafText === '' ? undefined : leafText,
    children: node.children,
    footer: truncationHint(node),
  })
}

const factRenderer: ElementRenderer = (node, ctx) => {
  const { Text } = ctx.el
  spend(ctx, 1)
  return (
    <Text dimColor>
      {pad(
        ctx,
        `${GLYPHS.kind.fact} ${truncateCell(collapseWhitespace(sanitize(node.text ?? '')), Math.max(8, widthOf(ctx) - 4))}`,
      )}
    </Text>
  )
}

const stepRenderer: ElementRenderer = (node, ctx) => {
  const { Text } = ctx.el
  spend(ctx, 1)
  return (
    <Text>
      {pad(
        ctx,
        `${GLYPHS.kind.step} ${truncateCell(collapseWhitespace(sanitize(node.text ?? '(empty step)')), Math.max(8, widthOf(ctx) - 4))}`,
      )}
    </Text>
  )
}

const sourceRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  const body = content !== undefined && 'body' in content ? String(content.body) : (node.text ?? '')
  const glyph = glyphOf(node)
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge: `${glyph} ${node.tag.replace('sem-', '')}`,
    open: ctx.viewer.expanded[ctx.wkey] ?? true,
    hint: `${lineCount(body)} lines`,
    body,
    footer: truncationHint(node),
  })
}

const procedureRenderer: ElementRenderer = (node, ctx) => {
  const room = roomOf(ctx)
  if (room <= 2) return genericRenderer(node, ctx)
  // Steps: direct sem-step children, else the flattened text as one step.
  // One line per step (truncated), so the drawn count is exact.
  const steps = node.children.filter(child => child.tag === 'sem-step')
  const stepTexts =
    steps.length > 0
      ? steps.map(step => collapseWhitespace(sanitize(step.text ?? '')))
      : [collapseWhitespace(sanitize(node.text ?? ''))]
  const named = node.attrs['title'] ?? node.attrs['label'] ?? node.attrs['name']
  const badge = `${GLYPHS.kind.procedure}${named !== undefined ? ` ${sanitize(named).slice(0, 24)}` : ''}`
  const innerW = Math.max(10, ctx.width - ctx.inset - 2)
  const rows = stepTexts.map(
    (step, i) =>
      `${i + 1} ${GLYPHS.kind.step} ${truncateCell(step === '' ? '(empty step)' : step, Math.max(8, innerW - 10))}`,
  )
  const hiddenSteps = Math.max(0, stepTexts.length - rows.length)
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge,
    open: ctx.viewer.expanded[ctx.wkey] ?? true,
    hint: `${stepTexts.length} steps`,
    rows,
    footer: hiddenSteps > 0 ? `${GLYPHS.more} (+${hiddenSteps} steps)` : '',
  })
}

/** Generic fallback: kind glyph + label, plus the body boxed (no free-floating prose rows). */
const genericRenderer: ElementRenderer = (node, ctx) => {
  const { Text } = ctx.el
  const room = roomOf(ctx)
  if (room <= 0) return EMPTY(ctx)
  const badge = `${glyphOf(node)} ${truncateCell(labelOf(node), 28)}`
  if (!ctx.showBody || (node.text ?? '') === '') {
    spend(ctx, 1)
    return <Text dimColor>{pad(ctx, badge)}</Text>
  }
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge,
    open: true,
    body: node.text ?? '',
    toggle: false,
    footer: truncationHint(node),
  })
}

/**
 * NPL pump tags (npl-*) and the Trinity friction markers: one shared block
 * renderer. Collapsed it is the single header line (glyph, name, attrs, size
 * hint); expanded it draws its own text inside the frame AND its element
 * children nested inside (box-model) — nothing hides behind a hide row.
 */
const renderNplBlock: ElementRenderer = (node, ctx) => {
  const glyph = glyphOf(node)
  const name = ['wedge', 'shadow', 'critic', 'weego'].includes(node.tag)
    ? node.tag.toUpperCase()
    : node.tag
  // `collapsed` is viewer state, not content — never echo it in the badge.
  const attrPairs = Object.entries(node.attrs)
    .filter(([key]) => key !== 'collapsed')
    .slice(0, 3)
  const badge =
    `${glyph} ${name}` +
    (attrPairs.length > 0
      ? ` · ${attrPairs.map(([key, value]) => `${key}=${sanitize(value)}`).join(' ')}`
      : '')
  // npl blocks default open; an authored `collapsed` attribute keeps the card
  // shut by default, and an explicit toggle always wins.
  const raw = sanitize(node.text ?? '')
  const hint = [
    `${lineCount(raw)} lines`,
    node.children.length > 0 ? `${node.children.length} children` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  return cardBlock(ctx, {
    key: ctx.wkey,
    badge,
    open: ctx.viewer.expanded[ctx.wkey] ?? node.attrs['collapsed'] === undefined,
    hint,
    body: raw,
    children: node.children,
    footer: truncationHint(node),
  })
}

/**
 * The extension point: one renderer per sem-* kind, `*` the generic fallback.
 * Adding an element kind later = adding one entry (plus a glyphOf mapping).
 */
export const RENDERERS: Record<string, ElementRenderer> = {
  'sem-note': noteRenderer,
  'sem-reveal': revealRenderer,
  'sem-detail': revealRenderer,
  'sem-details': revealRenderer,
  'sem-facts': factsRenderer,
  'sem-faq': factsRenderer,
  'sem-faqs': factsRenderer,
  'sem-question': factsRenderer,
  'sem-table': tableRenderer,
  'sem-code': codeRenderer,
  'sem-md': codeRenderer,
  'sem-properties': propertiesRenderer,
  'sem-property': factRenderer,
  'sem-tag-attr': factRenderer,
  'sem-tag-def': factRenderer,
  'sem-views': viewsRenderer,
  'sem-view': factRenderer,
  'sem-section': sectionRenderer,
  'sem-summary': sectionRenderer,
  'sem-tldr': sectionRenderer,
  'sem-fact': factRenderer,
  'sem-step': stepRenderer,
  'sem-procedure': procedureRenderer,
  'sem-howto': procedureRenderer,
  'sem-runbook': procedureRenderer,
  'sem-workflow': procedureRenderer,
  'sem-plan': procedureRenderer,
  'sem-tsg': procedureRenderer,
  'sem-tsgs': procedureRenderer,
  'sem-source': sourceRenderer,
  'sem-reader': sourceRenderer,
  'sem-data-source': sourceRenderer,
  'sem-reference': sourceRenderer,
  'sem-references': sourceRenderer,
  'sem-api-call': sourceRenderer,
  'sem-kb': sourceRenderer,
  'npl-mindread': renderNplBlock,
  'npl-thought': renderNplBlock,
  'npl-block': renderNplBlock,
  'npl-ref': renderNplBlock,
  'npl-hormones': renderNplBlock,
  'npl-intent': renderNplBlock,
  'npl-agent': renderNplBlock,
  'npl-directive': renderNplBlock,
  'npl-section': renderNplBlock,
  'npl-rubric': renderNplBlock,
  'npl-critique': renderNplBlock,
  'npl-declaration': renderNplBlock,
  'npl-example': renderNplBlock,
  'npl-flag': renderNplBlock,
  'npl-flags': renderNplBlock,
  'npl-mode': renderNplBlock,
  'npl-mood': renderNplBlock,
  'npl-poa': renderNplBlock,
  'npl-vos': renderNplBlock,
  'npl-artifact': renderNplBlock,
  'npl-cot': renderNplBlock,
  wedge: renderNplBlock,
  shadow: renderNplBlock,
  critic: renderNplBlock,
  weego: renderNplBlock,
  '*': genericRenderer,
}

// --- the expanded document view's per-node role ---

/**
 * How the expanded view treats one node. 'card': the node's renderer draws a
 * framed card — header, body, and its children nested INSIDE (consumed; the
 * plan emits no rows for them). 'flow': no dedicated body — the outline row
 * stands, then captured blocks or the leaf's own text, then recursion into
 * children.
 */
export type ExpandedRole = 'flow' | 'card'

/** Renderers that draw captured content and fall back to the generic head (a duplicate row in the expanded view) when nothing was captured. */
const CONTENT_RENDERERS: ReadonlySet<ElementRenderer> = new Set([
  noteRenderer,
  revealRenderer,
  factsRenderer,
  viewsRenderer,
  propertiesRenderer,
  tableRenderer,
  codeRenderer,
])

export function expandedRoleOf(node: SemTextNode): ExpandedRole {
  const render = RENDERERS[node.tag] ?? RENDERERS['*']!
  if (render === genericRenderer) return 'flow'
  if (node.content === undefined && CONTENT_RENDERERS.has(render)) return 'flow'
  // Sections, npl blocks and every captured card render as framed cards now.
  return 'card'
}

// --- the expanded document view's pure content plan ---

/**
 * One unit of the expanded view, in document order. 'row': the outline row
 * of a flow node (the pane draws it as the focus button). 'text': content
 * drawn under that row — captured blocks (with their markers) or a flow
 * leaf's own text; unknown tags land here, so their text is never dropped.
 * 'card': a framed card through its renderer — the header replaces the
 * outline row and its children are consumed (drawn inside the frame).
 */
export type ExpandedUnit =
  | { role: 'row'; key: string; row: OutlineRow }
  | {
      role: 'text'
      key: string
      depth: number
      /** Two spaces per nesting level (no tree gutters in the body view). */
      indent: string
      text: string
      /** Captured block (heading/quote/prose) — the pane draws its markers. */
      block?: SemBlock
    }
  | { role: 'card'; key: string; depth: number; node: SemTextNode }

/**
 * The expanded view's full content plan: every flow row top-to-bottom with
 * its text under it, and every card as a single card unit whose renderer
 * draws header, body and nested children inside the frame — a nested or
 * unclosed sibling is never swallowed; it draws inside its parent.
 * `baseKey` prefixes every key (the section view re-plans a subtree with the
 * document's key paths). Pure; the pane maps units to elements under its row
 * budget (renderer spend is only known at draw time).
 */
export function expandedPlan(
  tree: readonly SemTextNode[],
  maxDepth = 8,
  baseKey = '',
): ExpandedUnit[] {
  const units: ExpandedUnit[] = []
  const walkNodes = (nodes: readonly SemTextNode[], depth: number, base: string): void => {
    nodes.forEach((node, i) => {
      const key = `${base}${i}`
      const role = expandedRoleOf(node)
      if (role === 'card') {
        units.push({ role: 'card', key, depth, node })
        return
      }
      units.push({
        role: 'row',
        key,
        row: {
          key,
          depth,
          label: labelOf(node),
          prefix: '',
          glyph: glyphOf(node),
          count: node.children.length,
        },
      })
      const blocks = node.blocks ?? []
      if (blocks.length > 0) {
        blocks.forEach((block, b) => {
          units.push({
            role: 'text',
            key: `${key}#b${b}`,
            depth: depth + 1,
            indent: '  '.repeat(depth + 1),
            text: block.text,
            block,
          })
        })
      } else if (node.children.length === 0 && (node.text ?? '') !== '') {
        // A leaf without captured content (plain tldr/summary text, unknown
        // tags, note-less notes): its own text sits inline under the row.
        units.push({
          role: 'text',
          key: `${key}#leaf`,
          depth: depth + 1,
          indent: '  '.repeat(depth + 1),
          text: node.text ?? '',
        })
      }
      if (depth < maxDepth) walkNodes(node.children, depth + 1, `${key}.`)
    })
  }
  walkNodes(tree, 0, baseKey)
  return units
}
