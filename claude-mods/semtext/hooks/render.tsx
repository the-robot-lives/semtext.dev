// SemText pane rendering layer (v0.3): glyph vocabulary, pure drawing
// helpers, viewer reducers and the per-kind render registry.
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
  mode: 'outline',
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

export function backToOutline(viewer: SemTextViewer): SemTextViewer {
  return { ...viewer, mode: 'outline', activeFactSet: null, order: [], picked: null, flipped: false }
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
  tree: { branch: '├──', last: '└──', spine: '│', blank: ' ' },
  crumb: '›',
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
  if (node.tag === 'sem-note' && (node.attrs['kind'] ?? node.attrs['data-kind']) === 'warning') {
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
 * Splits `value` into at most `maxLines` rows of `width` code points, cutting
 * the last row short with `…` when content remains. Code-point safe.
 */
export function wrapLines(value: string, width: number, maxLines: number): string[] {
  const cells = Math.max(1, width)
  const chars = Array.from(value)
  const out: string[] = []
  let at = 0
  while (at < chars.length && out.length < maxLines) {
    out.push(chars.slice(at, at + cells).join(''))
    at += cells
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

/** Cells of a textual table row: pipe- or tab-delimited, else one cell. */
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

const EMPTY = (ctx: RenderCtx): RenderElement => ctx.el.Box({})

/** Shared text-row builder for renderer bodies. */
function dimRows(
  ctx: RenderCtx,
  lines: readonly string[],
  key: string,
  dim = true,
): RenderElement[] {
  return lines.map(
    (line, i) => h(ctx.el.Text, { key: `${key}${i}`, dimColor: dim }, line) as RenderElement,
  )
}

/** A framed body (used by note/code/source/reader/procedure). */
function framedBody(
  ctx: RenderCtx,
  body: string,
  badge: string,
  align: 'left' | 'right',
  tabExpand = false,
): { element: RenderElement | null; hidden: number } {
  const room = roomOf(ctx)
  if (room <= 2 || body === '') return { element: null, hidden: 0 }
  const text = tabExpand ? body.replace(/\t/g, '  ') : body
  const inner = Math.max(10, ctx.width - 4)
  const maxBody = room - 2 // top + bottom borders
  const totalLines = text.split('\n').length
  const shown: string[] = []
  for (const line of text.split('\n')) {
    if (shown.length >= maxBody) break
    for (const part of wrapLines(line, inner - 4, maxBody - shown.length)) {
      if (shown.length >= maxBody) break
      shown.push(part)
    }
  }
  const hidden = Math.max(0, totalLines - shown.length)
  const lines = frameLines(shown, ctx.width, badge, align)
  spend(ctx, lines.length + (hidden > 0 ? 1 : 0))
  return {
    element: h(
      ctx.el.Box,
      { flexDirection: 'column' },
      lines.map((line, i) => h(ctx.el.Text, { key: `f${i}` }, line)),
      hidden > 0
        ? h(ctx.el.Text, { key: 'fh', dimColor: true }, `${GLYPHS.more} (+${hidden} lines)`)
        : null,
    ) as RenderElement,
    hidden,
  }
}

// --- per-kind renderers ---

const noteRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'note') return genericRenderer(node, ctx)
  const { Box, Button } = ctx.el
  const warn = (node.attrs['kind'] ?? node.attrs['data-kind']) === 'warning'
  const glyph = warn ? GLYPHS.kind.warning : GLYPHS.kind.note
  const open = ctx.viewer.expanded[ctx.wkey] ?? false
  if (!open) {
    spend(ctx, 1)
    return (
      <Box>
        <Button
          key={`x:${ctx.wkey}`}
          plain
          onPress={() => ctx.press(v => setExpanded(v, ctx.wkey, true))}
        >
          {`${glyph} ${truncateCell(content.summary, Math.max(8, ctx.width - 8))} ${GLYPHS.toggle.open}`}
        </Button>
      </Box>
    )
  }
  const frame = framedBody(ctx, content.body, `${glyph} note`, 'left')
  if (frame.element === null) return genericRenderer(node, ctx)
  spend(ctx, 1) // the hide button
  return (
    <Box flexDirection="column">
      {frame.element}
      <Button
        key={`x:${ctx.wkey}`}
        plain
        onPress={() => ctx.press(v => setExpanded(v, ctx.wkey, false))}
      >
        {`${GLYPHS.toggle.shut} hide`}
      </Button>
    </Box>
  )
}

const revealRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'reveal') return genericRenderer(node, ctx)
  const { Box, Button } = ctx.el
  const open = ctx.viewer.expanded[ctx.wkey] ?? !content.collapsed
  if (!open) {
    spend(ctx, 1)
    return (
      <Box>
        <Button
          key={`x:${ctx.wkey}`}
          plain
          onPress={() => ctx.press(v => setExpanded(v, ctx.wkey, true))}
        >
          {`${GLYPHS.kind.reveal} ${truncateCell(content.summary, Math.max(8, ctx.width - 8))} ${GLYPHS.toggle.open}`}
        </Button>
      </Box>
    )
  }
  const room = roomOf(ctx)
  const body = wrapLines(sanitize(content.body), Math.max(8, ctx.width - 2), Math.max(1, room - 1))
  spend(ctx, body.length + 1)
  return (
    <Box flexDirection="column">
      {...dimRows(ctx, body, 'r')}
      <Button
        key={`x:${ctx.wkey}`}
        plain
        onPress={() => ctx.press(v => setExpanded(v, ctx.wkey, false))}
      >
        {`${GLYPHS.toggle.shut} hide`}
      </Button>
    </Box>
  )
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
        <Text dimColor>{head}</Text>
        {...dimRows(ctx, lines, 'fl')}
      </Box>
    )
  }
  spend(ctx, 2)
  const kind: 'quiz' | 'flashcards' = content.viewAs
  return (
    <Box flexDirection="column">
      <Text dimColor>{`${glyph} ${name} · ${content.items.length} items`}</Text>
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
  const { lines, hidden } = drawTable(cells, Math.max(12, ctx.width - 2), maxRows)
  spend(ctx, 1 + lines.length + (hidden > 0 ? 1 : 0))
  return (
    <Box flexDirection="column">
      <Text dimColor>{`${GLYPHS.kind.table} table · ${cells.length} rows × ${cols} cols`}</Text>
      {/* lines[1] is the header row: emphasized; borders and body dim. */}
      {lines.map((line, i) =>
        i === 1
          ? h(ctx.el.Text, { key: `tb${i}`, bold: true }, line)
          : h(ctx.el.Text, { key: `tb${i}`, dimColor: true }, line),
      )}
      {hidden > 0 ? (
        <Text dimColor>{`${GLYPHS.more} (+${hidden} rows)`}</Text>
      ) : null}
    </Box>
  )
}

const codeRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  const body = content?.kind === 'code' ? content.body : ''
  const lang = content?.kind === 'code' ? content.lang : (node.attrs['lang'] ?? '')
  if (content?.kind !== 'code') return genericRenderer(node, ctx)
  const badge = `${GLYPHS.kind.code}${lang !== '' ? ` ${sanitize(lang)}` : ''}`
  const frame = framedBody(ctx, body, badge, 'right', true)
  if (frame.element === null) return EMPTY(ctx)
  return frame.element
}

const propertiesRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  if (content?.kind !== 'properties') return genericRenderer(node, ctx)
  const { Box, Text } = ctx.el
  const room = roomOf(ctx)
  if (room <= 1) return EMPTY(ctx)
  const lines = propertyLines(content.properties, ctx.width).slice(0, room - 1)
  spend(ctx, lines.length + 1)
  return (
    <Box flexDirection="column">
      <Text dimColor>{`${GLYPHS.kind.properties} properties · ${content.properties.length}`}</Text>
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
  const tabs: RenderElement[] = [h(ctx.el.Text, { key: 'lb', dimColor: true }, '[') as RenderElement]
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
  tabs.push(h(ctx.el.Text, { key: 'rb', dimColor: true }, ']') as RenderElement)
  spend(ctx, 1)
  const body = content.views[active]?.body ?? ''
  const lines =
    room > 1
      ? wrapLines(sanitize(body), Math.max(8, ctx.width - 2), room - 1)
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
  // A section's content arrives as the section view's blocks + descendants;
  // the renderer itself is just the kind-marked heading line.
  const { Text } = ctx.el
  spend(ctx, 1)
  return (
    <Text dimColor>
      {`${GLYPHS.kind.section} ${truncateCell(labelOf(node), Math.max(8, ctx.width - 4))}`}
    </Text>
  )
}

const factRenderer: ElementRenderer = (node, ctx) => {
  const { Text } = ctx.el
  spend(ctx, 1)
  return (
    <Text dimColor>
      {`${GLYPHS.kind.fact} ${truncateCell(collapseWhitespace(sanitize(node.text ?? '')), Math.max(8, ctx.width - 4))}`}
    </Text>
  )
}

const stepRenderer: ElementRenderer = (node, ctx) => {
  const { Text } = ctx.el
  spend(ctx, 1)
  return (
    <Text>
      {`${GLYPHS.kind.step} ${truncateCell(collapseWhitespace(sanitize(node.text ?? '(empty step)')), Math.max(8, ctx.width - 4))}`}
    </Text>
  )
}

const sourceRenderer: ElementRenderer = (node, ctx) => {
  const content = node.content
  const body = content !== undefined && 'body' in content ? String(content.body) : (node.text ?? '')
  const glyph = glyphOf(node)
  const frame = framedBody(ctx, body, `${glyph} ${node.tag.replace('sem-', '')}`, 'left')
  if (frame.element === null) return genericRenderer(node, ctx)
  return frame.element
}

const procedureRenderer: ElementRenderer = (node, ctx) => {
  const { Box, Text } = ctx.el
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
  const inner = Math.max(10, ctx.width - 4)
  const maxBody = room - 2
  const drawn = stepTexts.slice(0, maxBody)
  const bodyLines = drawn.map((step, i) =>
    `${i + 1} ${GLYPHS.kind.step} ${truncateCell(step === '' ? '(empty step)' : step, inner - 8)}`,
  )
  const hidden = Math.max(0, stepTexts.length - drawn.length)
  const lines = frameLines(bodyLines, ctx.width, badge, 'left')
  spend(ctx, lines.length + (hidden > 0 ? 1 : 0))
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text key={`p${i}`}>{line}</Text>
      ))}
      {hidden > 0 ? (
        <Text dimColor>{`${GLYPHS.more} (+${hidden} steps)`}</Text>
      ) : null}
    </Box>
  )
}

/** Generic fallback: kind glyph + label, plus the body when nothing else drew it. */
const genericRenderer: ElementRenderer = (node, ctx) => {
  const { Box, Text } = ctx.el
  const room = roomOf(ctx)
  if (room <= 0) return EMPTY(ctx)
  const head = `${glyphOf(node)} ${truncateCell(labelOf(node), Math.max(8, ctx.width - 4))}`
  if (!ctx.showBody || (node.text ?? '') === '') {
    spend(ctx, 1)
    return <Text dimColor>{head}</Text>
  }
  const body = wrapLines(sanitize(node.text ?? ''), Math.max(8, ctx.width - 2), room - 1)
  spend(ctx, 1 + body.length)
  return (
    <Box flexDirection="column">
      <Text dimColor>{head}</Text>
      {...dimRows(ctx, body, 'g', false)}
    </Box>
  )
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
  'sem-source': sourceRenderer,
  'sem-reader': sourceRenderer,
  'sem-data-source': sourceRenderer,
  'sem-reference': sourceRenderer,
  '*': genericRenderer,
}
