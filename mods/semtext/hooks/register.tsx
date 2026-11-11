import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, ToolCallInput } from 'claude-code'

import {
  GLYPHS,
  INITIAL_VIEWER,
  RENDERERS,
  backToOutline,
  breadcrumbOf,
  blockRows,
  buildQuizOptions,
  cardKeys,
  collapseLines,
  collapseWhitespace,
  decodeEntities,
  expandedPlan,
  factLine,
  firstWords,
  flipCard,
  focusSection,
  meterLine,
  nextItem,
  outlineTree,
  pickOption,
  promptFor,
  sanitize,
  selectedMark,
  setActiveView,
  setAllExpanded,
  setExpanded,
  setOutlineMode,
  startQuiz,
  truncateCell,
  truncateSummary,
  wrapLines,
} from './render'
import type { RenderCtx } from './render'
import type {
  FactItem,
  QuizOption,
  SemBlock,
  SemNodeContent,
  SemTextDoc,
  SemTextNode,
  SemTextViewer,
} from '../types'

// Re-exported for the test harness (and any importer of the legacy surface):
// the pure layer lives in ./render now.
export {
  backToOutline,
  buildQuizOptions,
  factLine,
  firstWords,
  flipCard,
  focusSection,
  INITIAL_VIEWER,
  nextItem,
  pickOption,
  promptFor,
  sanitize,
  setExpanded,
  setActiveView,
  startQuiz,
  truncateSummary,
  collapseWhitespace,
}

// --- constants ---

const PANE_ID = 'semtext-outline'
const PANE_TITLE = 'SemText'
const MAX_STORED_NODES = 2000
const MAX_SEEN_SOURCES = 50
const MAX_NOTES = 20
const MAX_TEXT = 4000 // per-node captured text, characters
const MAX_CODE_LINES = 40 // sem-code body cap, lines
const MAX_TABLE_ROWS = 10 // sem-table rows cap
const MAX_BLOCKS = 32 // headings/paragraphs captured per node
const MAX_FACT_ITEMS = 50 // items captured per facts set
const MAX_WIDGETS = 10 // interactive widgets drawn per section view
const NOTE_SUMMARY_WORDS = 10 // collapsed-note summary rule
const FALLBACK_COLUMNS = 72 // pane width when the surface reports none

// NPL pump-tag vocabulary (the sem-text v0.8 §npl family) + the Trinity
// friction markers. The parser lowercases tag names, so these stay lowercase;
// they parse like sem elements and warn-match like them (never an
// unknown-note).
const NPL_ELEMENTS: ReadonlySet<string> = new Set([
  'npl-agent',
  'npl-artifact',
  'npl-block',
  'npl-cot',
  'npl-critique',
  'npl-declaration',
  'npl-directive',
  'npl-example',
  'npl-flag',
  'npl-flags',
  'npl-hormones',
  'npl-intent',
  'npl-mindread',
  'npl-mode',
  'npl-mood',
  'npl-poa',
  'npl-ref',
  'npl-rubric',
  'npl-section',
  'npl-thought',
  'npl-vos',
  'wedge',
  'shadow',
  'critic',
  'weego',
])

// The Trinity friction markers: flat sibling sections of the Friction phase
// (WEDGE ▲ SHADOW ▼ CRITIC ✕ WEEGO ◎). Model output emits them unclosed
// (markdown-escaped `\<WEDGE\>` and bare `<WEDGE>` alike), so the parser
// applies the flat-section rule to exactly this set (see parseSemText).
const FRICTION_MARKERS: ReadonlySet<string> = new Set(['wedge', 'shadow', 'critic', 'weego'])

// Same-name implied end for the loose sem-* leaves: sem-note, sem-step and
// sem-fact are routinely emitted unclosed back-to-back (one per item), so a
// new opening of the same name closes the still-open one and both render as
// siblings. Every other sem-* name keeps normal same-name nesting (nested
// sem-section is real markup) — see parseSemText.
const IMPLIED_END_SEM: ReadonlySet<string> = new Set(['sem-note', 'sem-step', 'sem-fact'])

// The element vocabulary of sem-text.v0.7.spec.html (the 57 §2 table entries
// plus the structural authoring elements its §1 names: sem-enhanced-document,
// sem-list, sem-section, sem-break, sem-question, sem-option).
// Warn-matching ONLY: an unknown sem-* name still parses, counts and renders —
// it just earns a validation note.
const KNOWN_ELEMENTS: ReadonlySet<string> = new Set([
  'sem-api-call',
  'sem-api-param',
  'sem-audiences',
  'sem-break',
  'sem-browser',
  'sem-changelog',
  'sem-changelogs',
  'sem-chronology',
  'sem-code',
  // sem-conclusion / sem-distractor: the interactive fact markup the browser
  // fallback enhances (d("conclusion"), d("distractor")) even though the spec
  // table lists them only as parts of sem-fact content.
  'sem-conclusion',
  'sem-distractor',
  'sem-data-join',
  'sem-data-query',
  'sem-data-source',
  'sem-data-visualizer',
  'sem-detail',
  'sem-details',
  'sem-enhanced-document',
  'sem-eval',
  'sem-event',
  'sem-fact',
  'sem-facts',
  'sem-faq',
  'sem-faqs',
  'sem-file-tree',
  'sem-guard-rail',
  'sem-guard-rails',
  'sem-highlight',
  'sem-howto',
  'sem-kb',
  'sem-list',
  'sem-md',
  'sem-mockup',
  'sem-note',
  'sem-option',
  'sem-philosophy',
  'sem-plan',
  'sem-procedure',
  'sem-profile',
  'sem-progress',
  'sem-properties',
  'sem-property',
  'sem-question',
  'sem-reader',
  'sem-reference',
  'sem-references',
  'sem-requirement',
  'sem-reveal',
  'sem-rubric',
  'sem-runbook',
  'sem-section',
  'sem-site-tree',
  'sem-source',
  'sem-step',
  'sem-summary',
  'sem-table',
  'sem-tag-attr',
  'sem-tag-def',
  'sem-threat-model',
  'sem-tldr',
  'sem-tsg',
  'sem-tsgs',
  'sem-view',
  'sem-views',
  'sem-workflow',
  ...NPL_ELEMENTS,
])

// --- state ---

const DOC = atom({ plugin: 'semtext', key: 'doc' } as const, null)
const SEEN = atom({ plugin: 'semtext', key: 'seenSources' } as const, [])
/** Exported for tests; all pane writes go through update($, VIEWER, …). */
export const VIEWER = atom({ plugin: 'semtext', key: 'viewer' } as const, INITIAL_VIEWER)

// --- detection ---

export interface ParsedSemText {
  roots: SemTextNode[]
  elementCount: number
  unknownElements: string[]
  notes: string[]
}

/** Cheap prefix-match gate: a sem-/npl- element open tag or a Trinity marker. */
export function looksLikeSemText(text: string): boolean {
  // `\\` in the lookahead: markdown-escaped markers (`\<WEDGE\>`) must trip
  // detection too, or a fully escaped Trinity answer is never parsed at all.
  return /<(?:sem-[a-z][a-z0-9-]*|npl-[a-z][a-z0-9-]*|wedge|shadow|critic|weego)(?=[\s/>\\])/i.test(text)
}

// --- parser ---

function countNewlines(text: string, from: number, to: number): number {
  let seen = 0
  for (let i = from; i < to; i++) if (text.charCodeAt(i) === 10) seen++
  return seen
}

/** Index just past the `>` that closes the tag starting at `start`, quotes respected; -1 when unterminated. */
function tagEnd(text: string, start: number): number {
  let quote = ''
  for (let i = start + 1; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (quote !== '') {
      if (code === quote.charCodeAt(0)) quote = ''
    } else if (code === 34 || code === 39) {
      quote = text[i]!
    } else if (code === 62) {
      return i + 1
    }
  }
  return -1
}

const ATTR = /([a-zA-Z_:@][-\w:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

function parseAttrs(src: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  ATTR.lastIndex = 0
  for (;;) {
    const m = ATTR.exec(src)
    if (m === null) break
    const name = m[1]!.toLowerCase()
    if (name in attrs) continue
    attrs[name] = sanitize(m[2] ?? m[3] ?? m[4] ?? '')
  }
  return attrs
}

function attrSrcOf(src: string): string {
  return src
    .replace(/^<\/?\s*[a-zA-Z][a-zA-Z0-9-]*/, '')
    .replace(/\/?\s*>$/, '')
}

const RAW_TEXT_CLOSE = /<\/(script|style)\s*>/gi
const COMMENT_BLOCK = /<!--[\s\S]*?-->/g
const TAG_LIKE = /<[^>]*>/g
const HEADING_NAME = /^h([1-6])$/

/** Internal parse-time fields, stripped before the tree is stored. */
type ParseNode = SemTextNode & {
  raw?: string
  inheritedSeed?: number | null
  /** `<caption>` text of a sem-table (routed out of the row capture). */
  caption?: string
}

type TextContainer = {
  name: string
  start: number
  /** Tag attributes (ol start/type matter for the ordered labels). */
  attrs?: Record<string, string>
  /** Absolute spans of inner containers already captured — subtracted from
   *  this container's own capture so nested lists never double-draw. */
  consumed?: Array<[number, number]>
  /** li items emitted so far by this ol (the ordered index base). */
  count?: number
  /** li carries a checkbox task state (from an input type=checkbox inside). */
  task?: boolean
  done?: boolean
  /** This container's own blocks (document-order pre-merge). */
  own?: SemBlock[]
  /** Merged blocks of inner containers, in pre-order. */
  kids?: SemBlock[]
}

const LIST_CONTAINERS = new Set(['ul', 'ol', 'dl'])
const ITEM_CONTAINERS = new Set(['li', 'dt', 'dd'])

/**
 * Inline-tag family → visible pair delimiters (schema `highlight`: tag
 * aliases `highlight`/`sem-highlight`, class alias span/div.sem-highlight;
 * plus the plain-HTML inline tags prose carries). The gap-capture writes the
 * delimiters straight into the text stream; container captures decode the
 * original markup via decodeInlineMarks. render.tsx pairs them into styled
 * spans (highlight cyan, strong bold, em italic, code green, struck dim) so
 * the TUI colors and weights the emphasis like the web renderer.
 */
const INLINE_MARKS: Readonly<Record<string, readonly [string, string]>> = {
  highlight: ['⟦', '⟧'],
  'sem-highlight': ['⟦', '⟧'],
  mark: ['⟦', '⟧'],
  strong: ['**', '**'],
  b: ['**', '**'],
  em: ['*', '*'],
  i: ['*', '*'],
  code: ['`', '`'],
  del: ['~~', '~~'],
  s: ['~~', '~~'],
  strike: ['~~', '~~'],
}
const INLINE_TAG_RE =
  /<(\/)?(span|div|highlight|sem-highlight|mark|strong|b|em|i|code|del|s|strike)\b([^>]*)>/gi

/**
 * Container captures slice the ORIGINAL source, so inline tags arrive as
 * literal markup — decode them into the pair delimiters. Other span/div
 * wrappers are dropped (their text stays); a `</span>` only emits the close
 * delimiter when an unpaired sem-highlight span opened before it.
 */
function decodeInlineMarks(value: string): string {
  let out = ''
  let last = 0
  const highlightSpans: boolean[] = []
  for (const tag of value.matchAll(INLINE_TAG_RE)) {
    out += value.slice(last, tag.index)
    last = tag.index + tag[0].length
    const closing = tag[1] === '/'
    const name = tag[2]!.toLowerCase()
    if (name === 'span' || name === 'div') {
      if (!closing && /sem-highlight/.test(tag[3] ?? '')) {
        out += '⟦'
        highlightSpans.push(true)
      } else if (closing && highlightSpans.pop() === true) {
        out += '⟧'
      }
      continue
    }
    const pair = INLINE_MARKS[name]
    if (pair === undefined) continue
    out += closing ? pair[1] : pair[0]
  }
  out += value.slice(last)
  return out
}


function roman(n: number, upper: boolean): string {
  const table: Array<[number, string]> = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
    [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ]
  let out = ''
  for (const [value, sym] of table) {
    while (n >= value) {
      out += sym
      n -= value
    }
  }
  return upper ? out.toUpperCase() : out
}

/** `1.`-style display label per the ol's type attr (1/a/A/i/I), index 1-based. */
function orderedLabel(type: string, index: number): string {
  if (type === 'a') return `${String.fromCharCode(97 + ((index - 1) % 26))}.`
  if (type === 'A') return `${String.fromCharCode(65 + ((index - 1) % 26))}.`
  if (type === 'i') return `${roman(Math.max(1, index), false)}.`
  if (type === 'I') return `${roman(Math.max(1, index), true)}.`
  return `${index}.`
}

/** Removes already-captured inner spans (absolute coords, `base` = slice start). */
function subtractSpans(
  slice: string,
  spans: ReadonlyArray<[number, number]>,
  base: number,
): string {
  if (spans.length === 0) return slice
  const rel = spans
    .map(
      ([from, to]) =>
        [Math.max(0, from - base), Math.min(slice.length, to - base)] as [number, number],
    )
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0])
  let out = ''
  let cursor = 0
  for (const [from, to] of rel) {
    if (from < cursor) continue
    out += slice.slice(cursor, from) + ' '
    cursor = Math.max(cursor, to)
  }
  return out + slice.slice(cursor)
}

function parseSeedAttr(value: string | undefined): number | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  if (!/^[+-]?\d+$/.test(trimmed)) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function collectTag(node: SemTextNode, tag: string, out: SemTextNode[]): void {
  for (const child of node.children) {
    if (child.tag === tag) out.push(child)
    collectTag(child, tag, out)
  }
}

function contentFor(
  node: ParseNode,
  full: string,
  raw: string,
  childRaws: readonly string[],
): SemNodeContent | undefined {
  switch (node.tag) {
    case 'sem-facts': {
      // Every view-as mode captures: quiz/flashcards drive the runner, list
      // (the bare-tag default) renders as an inline item list — the browser
      // leaves list markup visible, so a plain <sem-facts> must never
      // capture as empty. Unknown modes fall back to list (safe display).
      const viewRaw = node.attrs['view-as'] ?? node.attrs['data-view-as'] ?? 'list'
      const viewAs = viewRaw === 'quiz' || viewRaw === 'flashcards' ? viewRaw : 'list'
      const found: SemTextNode[] = []
      collectTag(node, 'sem-fact', found)
      const items: FactItem[] = []
      for (const fact of found) {
        if (items.length >= MAX_FACT_ITEMS) break
        const conclusions: SemTextNode[] = []
        collectTag(fact, 'sem-conclusion', conclusions)
        const distractorNodes: SemTextNode[] = []
        collectTag(fact, 'sem-distractor', distractorNodes)
        const conclusion = collapseWhitespace(conclusions[0]?.text ?? '')
        const distractors = distractorNodes
          .map(d => collapseWhitespace(d.text ?? ''))
          .filter(text => text !== '')
        let body = fact.text ?? ''
        if (conclusion !== '') body = body.split(conclusion).join(' ')
        for (const text of distractors) body = body.split(text).join(' ')
        items.push({ body: collapseWhitespace(body), conclusion, distractors })
      }
      if (items.length === 0) return undefined
      return { kind: 'facts', viewAs, seed: node.inheritedSeed ?? 0, items }
    }
    case 'sem-reveal': {
      if (full === '') return undefined
      const summary = node.attrs['summary'] ?? node.attrs['data-summary'] ?? truncateSummary(full)
      return { kind: 'reveal', summary, body: full, collapsed: node.attrs['collapsed'] !== undefined }
    }
    case 'sem-note': {
      // v0.6: every note is a card (default-open with its body inline), so
      // the content captures regardless of the `collapsed` attribute — the
      // attribute only biases the default toggle state, it never hides text.
      if (full === '') return undefined
      return {
        kind: 'note',
        collapsed: true,
        summary: `${firstWords(full, NOTE_SUMMARY_WORDS)} …`,
        body: full,
      }
    }
    case 'sem-views': {
      const views = node.children
        .filter(child => child.tag === 'sem-view')
        .map((child, idx) => ({
          name: child.attrs['name'] ?? child.attrs['data-name'] ?? `view ${idx + 1}`,
          body: child.text ?? '',
          active: child.attrs['active'] !== undefined || child.attrs['data-active'] !== undefined,
        }))
      if (views.length === 0) return undefined
      const initial = Math.max(0, views.findIndex(view => view.active))
      return {
        kind: 'views',
        views: views.map(view => ({ name: view.name, body: view.body })),
        initial,
      }
    }
    case 'sem-properties': {
      const properties = node.children
        .filter(child => child.tag === 'sem-property')
        .map(child => ({
          key: child.attrs['key'] ?? child.attrs['data-key'] ?? '',
          value: child.text ?? '',
        }))
      if (properties.length === 0) return undefined
      return { kind: 'properties', properties }
    }
    case 'sem-table': {
      const lines = raw
        .split('\n')
        .map(row => row.trim())
        .filter(row => row !== '')
      const rows = (lines.length > 0 ? lines : [full].filter(row => row !== '')).slice(
        0,
        MAX_TABLE_ROWS,
      )
      if (rows.length === 0) return undefined
      const caption =
        node.caption !== undefined && collapseWhitespace(node.caption) !== ''
          ? collapseWhitespace(node.caption)
          : undefined
      return caption !== undefined ? { kind: 'table', rows, caption } : { kind: 'table', rows }
    }
    case 'sem-code': {
      // Verbatim: entities decode (`&lt;` in source means a literal `<`).
      const source = [
        decodeEntities(raw.trim()),
        ...childRaws.map(line => decodeEntities(line.trim())),
      ]
        .filter(part => part !== '')
        .join('\n')
      const body = source.split('\n').slice(0, MAX_CODE_LINES).join('\n')
      if (body === '') return undefined
      return { kind: 'code', lang: node.attrs['lang'] ?? node.attrs['data-lang'] ?? '', body }
    }
    default:
      return undefined
  }
}

function finalizeNode(node: ParseNode): void {
  const childRaws = node.children.map(child => (child as ParseNode).raw ?? '')
  for (const child of node.children) finalizeNode(child as ParseNode)
  const direct = collapseLines(node.raw ?? '')
  const childText = node.children
    .map(child => child.text ?? '')
    .filter(text => text !== '')
    .join('\n')
  const full = collapseLines(
    childText === '' ? direct : direct === '' ? childText : `${direct}\n${childText}`,
  )
  // An NPL block card draws its own prose; its element children render as
  // their own rows (expandedPlan), so their text stays out of the body here
  // — never drawn twice. The cap is visible: a cut body records how many
  // characters were dropped so the pane can show `… (+N chars)`.
  const body = NPL_ELEMENTS.has(node.tag) ? direct : full
  if (body.length > MAX_TEXT) {
    node.text = body.slice(0, MAX_TEXT)
    node.truncated = body.length - MAX_TEXT
  } else {
    node.text = body
  }
  node.content = contentFor(node, full, node.raw ?? '', childRaws)
  delete node.raw
  delete node.inheritedSeed
}

/**
 * Parses the sem-* markup of `text` into a nested element tree, capturing
 * per-element content (facts/reveal/note/views/properties/table/code) and the
 * headings/paragraphs/blockquotes inside each sem element as `blocks`.
 * Skips HTML comments, doctype/PI forms and the raw bodies of <script>/<style>
 * (a page's fallback JS mentions sem-* names as strings — not markup).
 * Returns null when the text carries no sem-* element at all.
 */
export function parseSemText(text: string): ParsedSemText | null {
  if (!looksLikeSemText(text)) return null
  const roots: ParseNode[] = []
  const stack: ParseNode[] = []
  const containers: TextContainer[] = []
  const unknown = new Set<string>()
  const notes: string[] = []
  let count = 0
  let stored = 0
  let line = 1
  let i = 0
  // An open `<caption>` routes gap text into the owning sem-table node's
  // caption (instead of the row capture) until `</caption>` closes it.
  let captionNode: ParseNode | null = null

  const captureGap = (from: number, to: number): void => {
    if (to <= from) return
    const top = stack[stack.length - 1]
    if (top === undefined || containers.length > 0) return
    // Markdown-escaped tag markers (`\<WEDGE\>`) leak their backslash into
    // the gap text; strip the escape. The backslash before an opening `<`
    // always sits at the very end of the gap slice (the tag starts the next
    // slice), so `$` must count as an escape position too. Quotes round the
    // set out — escaped `\"` at a body's end leaked a stray backslash.
    const piece = sanitize(text.slice(from, to)).replace(/\\([<>"']|$)/g, '$1')
    if (captionNode !== null) captionNode.caption = (captionNode.caption ?? '') + piece
    else top.raw = (top.raw ?? '') + piece
  }
  const captureContainer = (container: TextContainer, at: number, to: number): void => {
    // Record spans of every implicitly-closed inner container (and this one)
    // into their parents, so a parent's own capture never re-draws inner text
    // (nested lists/paragraphs inside an li emit their own blocks).
    for (let j = containers.length - 1; j >= at; j--) {
      const span: [number, number] = [containers[j]!.start, to]
      if (j > 0) {
        const parent = containers[j - 1]!
        parent.consumed ??= []
        parent.consumed.push(span)
      }
    }
    // Pre-order block merge: inner containers close first, so each container
    // collects its own block + its children's merged blocks and hands the
    // result up on close — the final order is parent-then-children in
    // document order, never inside-out.
    const close = (): void => {
      const merged = [...(container.own ?? []), ...(container.kids ?? [])]
      if (merged.length === 0) return
      if (at > 0) {
        const parent = containers[at - 1]!
        parent.kids = [...(parent.kids ?? []), ...merged]
        return
      }
      const top = stack[stack.length - 1]
      if (top === undefined) return
      const blocks: SemBlock[] = (top.blocks ??= [])
      for (const block of merged) {
        if (blocks.length >= MAX_BLOCKS) return
        blocks.push(block)
      }
    }
    const top = stack[stack.length - 1]
    if (top === undefined) return
    if (container.name === 'ul' || container.name === 'ol' || container.name === 'dl') {
      close()
      return
    }
    const inner = subtractSpans(
      text.slice(container.start, to),
      container.consumed ?? [],
      container.start,
    ).replace(COMMENT_BLOCK, ' ')
    // Inline tags become pair delimiters BEFORE the generic tag strip, so
    // the emphasis survives; leftover markup (fallback table tr/td…) still
    // blanks to a space.
    const clean = collapseWhitespace(
      decodeInlineMarks(sanitize(inner)).replace(TAG_LIKE, ' '),
    )
    const heading = HEADING_NAME.exec(container.name)
    if (clean !== '') {
      const own: SemBlock[] = (container.own ??= [])
      if (heading !== null) own.push({ kind: 'heading', level: Number(heading[1]), text: clean })
      else if (container.name === 'blockquote') own.push({ kind: 'quote', text: clean })
      else if (container.name === 'li') {
        // List item: bullet/number/task from the enclosing structure (v0.6.1).
        let lists = 0
        for (let s = 0; s < at; s++) {
          const n = containers[s]!.name
          if (n === 'ul' || n === 'ol') lists++
        }
        const parent = at > 0 ? containers[at - 1]! : undefined
        const parentIsList = parent !== undefined && (parent.name === 'ul' || parent.name === 'ol')
        const depth = Math.max(0, parentIsList ? lists - 1 : lists)
        const authoredTask =
          container.task === true ||
          /task/.test(container.attrs?.['class'] ?? '') ||
          container.attrs?.['data-task'] !== undefined
        if (authoredTask) {
          own.push({ kind: 'task-item', text: clean, done: container.done === true, depth })
        } else if (parentIsList && parent.name === 'ol') {
          parent.count = (parent.count ?? 0) + 1
          const start = parseSeedAttr(parent.attrs?.['start']) ?? 1
          const type = parent.attrs?.['type'] ?? '1'
          own.push({
            kind: 'list-item-ordered',
            text: clean,
            label: orderedLabel(type, Math.max(1, start) + parent.count - 1),
            depth,
          })
        } else {
          own.push({
            kind: 'list-item',
            text: clean,
            bullet: depth === 0 ? '•' : depth === 1 ? '◦' : '▪',
            depth,
          })
        }
      } else if (container.name === 'dt') own.push({ kind: 'term', text: clean })
      else if (container.name === 'dd') own.push({ kind: 'definition', text: clean })
      else own.push({ kind: 'text', text: clean })
    }
    close()
  }

  while (i < text.length) {
    const lt = text.indexOf('<', i)
    if (lt < 0) {
      captureGap(i, text.length)
      break
    }
    captureGap(i, lt)
    line += countNewlines(text, i, lt)
    i = lt
    if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4)
      const stop = end < 0 ? text.length : end + 3
      line += countNewlines(text, i, stop)
      i = stop
      continue
    }
    if (text.startsWith('<!', i) || text.startsWith('<?', i)) {
      const end = text.indexOf('>', i)
      const stop = end < 0 ? text.length : end + 1
      line += countNewlines(text, i, stop)
      i = stop
      continue
    }
    const end = tagEnd(text, i)
    if (end < 0) break
    const src = text.slice(i, end)
    const nameMatch = /^<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(src)
    if (nameMatch === null) {
      i += 1
      continue
    }
    const name = nameMatch[1]!.toLowerCase()
    const closing = src.charCodeAt(1) === 47
    const selfClosing = /\/\s*>$/.test(src)
    line += countNewlines(text, i, end)
    if (!closing && (name === 'script' || name === 'style')) {
      RAW_TEXT_CLOSE.lastIndex = end
      const close = RAW_TEXT_CLOSE.exec(text)
      const stop = close === null ? text.length : RAW_TEXT_CLOSE.lastIndex
      line += countNewlines(text, end, stop)
      i = stop
      continue
    }
    if (!name.startsWith('sem-') && !NPL_ELEMENTS.has(name)) {
      // Inline emphasis family: write the pair delimiters into the raw
      // capture (container slices decode their own markup below).
      const pair = INLINE_MARKS[name]
      if (pair !== undefined) {
        const top = stack[stack.length - 1]
        if (top !== undefined && containers.length === 0) {
          if (closing) top.raw += pair[1]
          else if (!selfClosing) top.raw += pair[0]
        }
        i = end
        continue
      }
      if (name === 'caption') {
        // Caption text routes into the owning sem-table node (captureGap),
        // so the row capture never sees it and the grid can draw it as the
        // table's header.
        if (closing) captionNode = null
        else if (!selfClosing && stack.length > 0) captionNode = stack[stack.length - 1]!
        i = end
        continue
      }
      if (closing) {
        let at = -1
        for (let s = containers.length - 1; s >= 0; s--) {
          if (containers[s]!.name === name) {
            at = s
            break
          }
        }
        if (at >= 0) {
          captureContainer(containers[at]!, at, i)
          containers.length = at
        }
      } else if (
        !selfClosing &&
        (name === 'p' ||
          name === 'blockquote' ||
          HEADING_NAME.test(name) ||
          LIST_CONTAINERS.has(name) ||
          ITEM_CONTAINERS.has(name))
      ) {
        containers.push(
          name === 'ol' || name === 'li'
            ? { name, start: end, attrs: parseAttrs(attrSrcOf(src)) }
            : { name, start: end },
        )
      } else if (!closing && name === 'input') {
        // Task-list checkbox: mark the nearest enclosing li as a task item.
        const attrs = parseAttrs(attrSrcOf(src))
        if ((attrs['type'] ?? '').toLowerCase() === 'checkbox') {
          for (let s = containers.length - 1; s >= 0; s--) {
            if (containers[s]!.name === 'li') {
              containers[s]!.task = true
              containers[s]!.done = attrs['checked'] !== undefined
              break
            }
          }
        }
      } else if (name === 'br' && !closing) {
        // `<br>` variants are hard row breaks in boxed prose — record a line
        // break in the raw capture so finalizeNode's per-line collapse keeps
        // the split (literal newlines already land in gap slices verbatim).
        // Inside a sem-table a br breaks WITHIN the cell, not the row: the
        // ⏎ sentinel rides inside the cell text and the grid splits on it.
        const top = stack[stack.length - 1]
        if (top !== undefined && containers.length === 0) {
          top.raw += top.tag === 'sem-table' ? '⏎' : '\n'
        }
      }
      i = end
      continue
    }
    if (closing) {
      let at = -1
      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s]!.tag === name) {
          at = s
          break
        }
      }
      if (at >= 0) {
        stack.length = at
      } else if (notes.length < MAX_NOTES) {
        notes.push(`line ${line}: </${name}> closes nothing`)
      }
    } else {
      count++
      if (!KNOWN_ELEMENTS.has(name)) unknown.add(name)
      // Implied end tags: the NPL family (friction markers are flat sibling
      // sections emitted unclosed — WEDGE then SHADOW then CRITIC… — so one
      // marker opening closes the still-open marker, and an NPL element also
      // closes an earlier open of its own name), plus same-name implied end
      // for sem-note/sem-step/sem-fact. Same-name nesting stays legal for
      // every other sem-* name (nested sem-section is real markup) — without
      // these rules each unclosed marker nested into the previous one and
      // vanished inside its parent card, and back-to-back notes/steps/facts
      // collapsed into a single swallowed body.
      if (!selfClosing && (NPL_ELEMENTS.has(name) || IMPLIED_END_SEM.has(name))) {
        for (let s = stack.length - 1; s >= 0; s--) {
          const open = stack[s]!.tag
          if (
            open === name ||
            (FRICTION_MARKERS.has(open) && FRICTION_MARKERS.has(name))
          ) {
            stack.length = s
            break
          }
        }
      }
      if (stored < MAX_STORED_NODES) {
        stored++
        const parent = stack[stack.length - 1]
        const node: ParseNode = {
          tag: name,
          attrs: parseAttrs(attrSrcOf(src)),
          line,
          children: [],
        }
        node.raw = ''
        node.inheritedSeed =
          parseSeedAttr(node.attrs['data-sem-seed']) ?? parent?.inheritedSeed ?? null
        if (parent === undefined) roots.push(node)
        else parent.children.push(node)
        if (!selfClosing) stack.push(node)
      }
    }
    i = end
  }
  if (count === 0) return null
  for (const root of roots) finalizeNode(root)
  return { roots, elementCount: count, unknownElements: [...unknown].sort(), notes }
}

// --- inline annotation (digest lines around sem-* blocks, never a re-render) ---

/**
 * Rewrites markdown so a blockquote digest line precedes each top-level sem-*
 * block that sits outside a fenced code block. Returns `text` unchanged when
 * nothing qualifies — callers pass such text through byte-identical.
 */
export function annotateText(text: string, parsed: ParsedSemText): string {
  if (parsed.roots.length === 0) return text
  const lines = text.split('\n')
  const fenced: boolean[] = []
  let inFence = false
  let fenceMark = ''
  for (const row of lines) {
    const m = /^\s*(`{3,}|~{3,})/.exec(row)
    if (m !== null) {
      const mark = m[1]![0]!
      if (!inFence) {
        inFence = true
        fenceMark = mark
      } else if (mark === fenceMark) {
        inFence = false
      }
    }
    fenced.push(inFence)
  }
  const marks = new Map<number, SemTextNode>()
  for (const root of parsed.roots) {
    const idx = root.line - 1
    if (idx < 0 || idx >= lines.length) continue
    if (fenced[idx]) continue
    marks.set(idx, root)
  }
  if (marks.size === 0) return text
  const unknown = parsed.unknownElements
  const digest =
    `> SemText · ${parsed.roots[0]!.tag} · ${parsed.elementCount} elements` +
    (unknown.length === 0
      ? ''
      : ` · ${unknown.length} unknown (${unknown.slice(0, 3).join(', ')})`)
  const out: string[] = []
  for (let idx = 0; idx < lines.length; idx++) {
    if (marks.has(idx)) out.push(digest)
    out.push(lines[idx]!)
  }
  return out.join('\n')
}

// --- NPL markdown digests (Trinity response forms that are not elements) ---
/**
 * Rewrites markdown so a blockquote digest line precedes each NPL response
 * form that is not an element: a ```meta-review fence, a fenced code block
 * whose first line is a MIND_READING module header, and an Open Questions
 * assumption table outside any fence. Mermaid fences are left alone. Fence
 * tracking matches annotateText. Returns `text` unchanged when nothing
 * qualifies — callers pass such text through byte-identical.
 */
export function annotateNplMarkdown(text: string): string {
  const lines = text.split('\n')
  const marks = new Map<number, string>()
  let inFence = false
  let fenceMark = ''
  let fenceLine = -1
  let fenceFirst = true
  for (let idx = 0; idx < lines.length; idx++) {
    const row = lines[idx]!
    const m = /^\s*(`{3,}|~{3,})(.*)$/.exec(row)
    if (m !== null) {
      const mark = m[1]![0]!
      if (!inFence) {
        inFence = true
        fenceMark = mark
        fenceLine = idx
        fenceFirst = true
        if (m[2]!.trim() === 'meta-review' && !marks.has(idx)) {
          marks.set(idx, '> NPL · meta-review')
        }
      } else if (mark === fenceMark) {
        inFence = false
      }
      continue
    }
    if (inFence) {
      if (fenceFirst) {
        fenceFirst = false
        if (
          fenceLine >= 0 &&
          /^\s*\/\/ MIND_READING MODULE/.test(row) &&
          !marks.has(fenceLine)
        ) {
          marks.set(fenceLine, '> NPL · mind-read')
        }
      }
      continue
    }
    if (/^\|\s*Open Questions\s*\|/.test(row) && !marks.has(idx)) {
      marks.set(idx, '> NPL · assumptions table')
    }
  }
  if (marks.size === 0) return text
  const out: string[] = []
  for (let idx = 0; idx < lines.length; idx++) {
    const digest = marks.get(idx)
    if (digest !== undefined) out.push(digest)
    out.push(lines[idx]!)
  }
  return out.join('\n')
}

// --- ingestion ---

function fileNameOf(e: ToolCallInput): string | undefined {
  if ('file_path' in e && typeof e.file_path === 'string') return e.file_path
  return undefined
}

function sourceOf(e: ToolCallInput): string {
  const file = fileNameOf(e)
  return file !== undefined ? file : `tool:${e.tool}`
}

/**
 * A fresh source resets the viewer; a re-read of the same source leaves a
 * quiz in progress alone. (Pure; ingest applies it.)
 */
export function resetsViewer(previous: SemTextDoc | null, source: string): boolean {
  return previous === null || previous.source !== source
}

export async function ingest(
  $: EngineInterface,
  text: string,
  source: string,
  fileName?: string,
): Promise<void> {
  const parsed = parseSemText(text)
  if (parsed === null || parsed.roots.length === 0) return
  const nextDoc: SemTextDoc = {
    source,
    fileName,
    tree: parsed.roots,
    elementCount: parsed.elementCount,
    unknownElements: parsed.unknownElements,
    firstSeen: await $.clock.now(),
  }
  const previous = await read($, DOC)
  await update($, DOC, () => nextDoc)
  if (resetsViewer(previous, source)) {
    await update($, VIEWER, () => ({ ...INITIAL_VIEWER }))
  }
  const seen = await read($, SEEN)
  if (!seen.includes(source)) {
    await update($, SEEN, list => [...list, source].slice(-MAX_SEEN_SOURCES))
    $.ui.toast(`SemText detected: ${parsed.elementCount} elements — ${sanitize(source)}`)
    const open = await $.ui.panes()
    if (!open.some(pane => pane.id === PANE_ID)) {
      void $.ui.open({ id: PANE_ID, title: PANE_TITLE })
    }
  }
}

/** The node at an outline row key path ('0.2.1'). */
export function nodeAt(tree: readonly SemTextNode[], key: string): SemTextNode | undefined {
  if (key === '') return undefined
  let nodes = tree
  let node: SemTextNode | undefined
  for (const part of key.split('.')) {
    const idx = Number.parseInt(part, 10)
    node = Number.isInteger(idx) && idx >= 0 ? nodes[idx] : undefined
    if (node === undefined) return undefined
    nodes = node.children
  }
  return node
}


// --- the mod ---

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'semtext',
      description: 'Toggle the SemText viewer pane.',
    })
    return next(e)
  })

  // Detection: scan what a tool answered.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (typeof ran.text === 'string' && looksLikeSemText(ran.text)) {
      await ingest($, ran.text, sourceOf(e), fileNameOf(e))
    }
    return ran
  })

  // Detection: scan the finished answer.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (looksLikeSemText(e.answer)) {
      const source = e.agentId === undefined ? 'answer' : `answer:${e.agentId}`
      await ingest($, e.answer, source)
    }
    return done
  })

  // Inline annotation: AssistantMessage markdown text. One annotation pass
  // per message: the sem digest first, then NPL markdown digests on top.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const text = e.props.text
    if (!looksLikeSemText(text)) return next(e)
    const parsed = parseSemText(text)
    let annotated = text
    if (parsed !== null && parsed.roots.length > 0) annotated = annotateText(text, parsed)
    const digested = annotateNplMarkdown(annotated)
    if (digested === text) return next(e)
    return next({ ...e, props: { ...e.props, text: digested } })
  })

  // Inline annotation: ToolResult rows. `output` is schema-checked by the
  // engine, so annotate only plain-string outputs; anything else passes
  // through untouched (detection still ran at tool.call).
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const output = e.props.output
    if (typeof output !== 'string' || !looksLikeSemText(output)) return next(e)
    const parsed = parseSemText(output)
    if (parsed === null || parsed.roots.length === 0) return next(e)
    const annotated = annotateText(output, parsed)
    if (annotated === output) return next(e)
    return next({ ...e, props: { ...e.props, output: annotated } })
  })

  // The pane: expanded document view (default), compact outline, section
  // focus and the quiz runner — one mode at a time.
  on('ui.render', { component: 'Pane', requestId: PANE_ID }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const doc = await read($, DOC)
    const viewer = await read($, VIEWER)
    if (doc === null) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No SemText document detected yet.</Text>
        </Box>
      )
    }
    // Width: the pane's own body columns (inside the frame), falling back to
    // the viewport, then a 72-column assumption with truncation.
    const width = Math.max(20, e.props.bodyColumns ?? e.viewport?.columns ?? FALLBACK_COLUMNS)
    const room = Math.max(6, (e.viewport?.rows ?? 24) - 3)
    const rows = outlineTree(doc.tree)
    const cards = cardKeys(doc.tree)
    const anyShut = cards.some(key => viewer.expanded[key] === false)
    const ctx: RenderCtx = {
      el: { Box, Text, Button },
      viewer,
      width,
      inset: 0,
      wkey: '',
      budget: room,
      spent: { rows: 0 },
      showBody: false,
      press: fn => {
        void update($, VIEWER, fn)
      },
    }

    // The overview toggle: compact outline <-> expanded view, plus
    // expand-all / collapse-all over the card keys. Shown on both overviews.
    const viewToggleRow = (): RenderElement => (
      <Box flexDirection="row" gap={1}>
        <Button
          key="view:mode"
          plain
          dimColor
          onPress={() => {
            void update($, VIEWER, v =>
              setOutlineMode(v, v.mode === 'expanded' ? 'outline' : 'expanded'),
            )
          }}
        >
          {viewer.mode === 'expanded'
            ? `${GLYPHS.toggle.open} compact outline`
            : `${GLYPHS.toggle.shut} expanded view`}
        </Button>
        <Button
          key="view:cards"
          plain
          dimColor
          onPress={() => {
            // Collapse-all IS the compact outline (and expand-all returns to
            // the streamlined expanded view) — one view, two zoom levels.
            void update($, VIEWER, v =>
              setOutlineMode(setAllExpanded(v, cards, anyShut), anyShut ? 'expanded' : 'outline'),
            )
          }}
        >
          {anyShut
            ? `${GLYPHS.toggle.shut} expand all`
            : `${GLYPHS.toggle.open} collapse all`}
        </Button>
      </Box>
    )

    const outlineView = (): RenderElement => {
      const unknown = doc.unknownElements
      const body = rows.slice(0, Math.max(1, room - 4))
      const selected = viewer.focusedSection ?? body[0]?.key
      return (
        <Box flexDirection="column">
          <Text>
            {`${GLYPHS.kind.source} ${sanitize(doc.fileName ?? doc.source)}`}
          </Text>
          <Text dimColor>
            {unknown.length === 0
              ? `${GLYPHS.kind.section} ${doc.elementCount} elements · ${GLYPHS.check} all elements known`
              : `${GLYPHS.kind.section} ${doc.elementCount} elements`}
          </Text>
          {unknown.length > 0 && (
            <Text color="warning">
              {`${GLYPHS.cross} ${unknown.length} unknown: ${unknown.slice(0, 4).join(', ')}`}
            </Text>
          )}
          {viewToggleRow()}
          {body.map(row => (
            <Button
              key={`sec:${row.key}`}
              plain
              dimColor={row.depth > 0}
              onPress={() => {
                void update($, VIEWER, v => focusSection(v, row.key))
              }}
            >
              {`${selectedMark(row.key === selected)} ${row.prefix}${row.glyph} ${row.label}`}
              {row.count > 0 && <Text dimColor>{` (${row.count})`}</Text>}
            </Button>
          ))}
          {rows.length > body.length && (
            <Text dimColor>{`${GLYPHS.more} (+${rows.length - body.length})`}</Text>
          )}
        </Box>
      )
    }

    // The shared content drawer: plan units -> elements under a row budget.
    // Cards render through the registry (the card header replaces the outline
    // row, children draw inside the frame); flow rows stay pressable to
    // focus, their blocks draw bold + rules, their text indents 2 per depth.
    const drawUnits = (
      units: ReturnType<typeof expandedPlan>,
      ectx: RenderCtx,
      parts: RenderElement[],
    ): number => {
      let hidden = 0
      let drewContent = false
      for (const unit of units) {
        const left = ectx.budget - ectx.spent.rows
        if (left <= 0) {
          hidden++
          continue
        }
        if (unit.role === 'row') {
          parts.push(
            <Button
              key={`sec:${unit.key}`}
              plain
              dimColor
              onPress={() => {
                void update($, VIEWER, v => focusSection(v, unit.key))
              }}
            >
              {`${unit.row.prefix}${unit.row.glyph} ${unit.row.label}`}
              {unit.row.count > 0 && <Text dimColor>{` (${unit.row.count})`}</Text>}
            </Button>,
          )
          ectx.spent.rows += 1
          drewContent = true
        } else if (unit.role === 'text') {
          const cellW = Math.max(8, width - unit.indent.length - 2)
          if (unit.block !== undefined) {
            // One blank row above a heading that isn't the first drawn row.
            const blank =
              unit.block.kind === 'heading' && drewContent && left > 1
                ? 1
                : 0
            if (blank === 1) {
              parts.push(<Text key={`t:${unit.key}.blank`}>{' '}</Text>)
              ectx.spent.rows += 1
            }
            const rows = blockRows(unit.block, cellW, Math.max(1, left - blank))
            rows.forEach((row, i) => {
              parts.push(
                <Text
                  key={`t:${unit.key}.${i}`}
                  bold={row.bold}
                  dimColor={row.dim ?? false}
                >
                  {row.text === '' ? ' ' : `${unit.indent}${row.text}`}
                </Text>,
              )
            })
            ectx.spent.rows += rows.length
            drewContent = true
          } else {
            // Boxed-prose line rule for flow leaf text too: literal newlines
            // (and captured `<br>` breaks) split rows, blanks collapse.
            const segments = sanitize(unit.text)
              .split('\n')
              .map(seg => seg.trim())
            while (segments.length > 0 && segments[0] === '') segments.shift()
            while (segments.length > 0 && segments[segments.length - 1] === '') segments.pop()
            const lines: string[] = []
            segments.forEach(seg => {
              if (seg === '') {
                if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
                return
              }
              lines.push(...wrapLines(seg, cellW, Math.max(1, left - lines.length)))
            })
            ectx.spent.rows += lines.length
            lines.forEach((line, i) => {
              parts.push(
                <Text key={`t:${unit.key}.${i}`} dimColor>
                  {line === '' ? ' ' : `${unit.indent}${line}`}
                </Text>,
              )
            })
            drewContent = drewContent || lines.length > 0
          }
        } else {
          const render = RENDERERS[unit.node.tag] ?? RENDERERS['*']!
          const sub: RenderCtx = { ...ectx, wkey: unit.key, showBody: false }
          const drawn = render(unit.node, sub)
          parts.push(
            <Box key={`w:${unit.key}`} flexDirection="column">
              {drawn}
            </Box>,
          )
          drewContent = true
        }
      }
      return hidden
    }

    // The streamlined expanded view (default): the whole document top-to-
    // bottom — every section, note and NPL block as a framed card with its
    // children nested inside; flow rows keep their press-to-focus. Collapse
    // all and the compact outline remains.
    const expandedView = (): RenderElement => {
      const unknown = doc.unknownElements
      const budget = Math.max(1, room - 4) // source + stats + unknown? + toggle
      const ectx: RenderCtx = { ...ctx, inset: 0, budget, spent: { rows: 0 } }
      const parts: RenderElement[] = []
      const hidden = drawUnits(expandedPlan(doc.tree), ectx, parts)
      return (
        <Box flexDirection="column">
          <Text>{`${GLYPHS.kind.source} ${sanitize(doc.fileName ?? doc.source)}`}</Text>
          <Text dimColor>
            {unknown.length === 0
              ? `${GLYPHS.kind.section} ${doc.elementCount} elements · ${GLYPHS.check} all elements known`
              : `${GLYPHS.kind.section} ${doc.elementCount} elements`}
          </Text>
          {unknown.length > 0 && (
            <Text color="warning">
              {`${GLYPHS.cross} ${unknown.length} unknown: ${unknown.slice(0, 4).join(', ')}`}
            </Text>
          )}
          {viewToggleRow()}
          {parts.length === 0 && <Text dimColor>(empty document)</Text>}
          {parts}
          {hidden > 0 && <Text dimColor>{`${GLYPHS.more} (+${hidden} rows hidden)`}</Text>}
        </Box>
      )
    }

    const stepSection = (delta: number): void => {
      void update($, VIEWER, v => {
        const at = rows.findIndex(row => row.key === v.focusedSection)
        const next = at < 0 ? 0 : Math.min(rows.length - 1, Math.max(0, at + delta))
        return focusSection(v, rows[next]!.key)
      })
    }

    const navRow = (): RenderElement => (
      <Box flexDirection="row" gap={1}>
        <Button
          key="nav:outline"
          plain
          dimColor
          onPress={() => {
            void update($, VIEWER, backToOutline)
          }}
        >
          {`${GLYPHS.nav.back} outline`}
        </Button>
        <Button
          key="nav:prev"
          plain
          dimColor
          onPress={() => {
            stepSection(-1)
          }}
        >
          {`${GLYPHS.nav.back} prev`}
        </Button>
        <Button
          key="nav:next"
          plain
          dimColor
          onPress={() => {
            stepSection(1)
          }}
        >
          {`${GLYPHS.nav.next} next`}
        </Button>
      </Box>
    )

    // Section focus: the same streamlined drawer scoped to the focused
    // element's subtree (document key paths, so card toggles keep working),
    // with a breadcrumb and prev/next nav on top.
    const sectionView = (): RenderElement => {
      const key = viewer.focusedSection ?? ''
      const node = nodeAt(doc.tree, key)
      if (node === undefined) {
        return viewer.outlineMode === 'outline' ? outlineView() : expandedView()
      }
      const budget = Math.max(1, room - 2)
      const ectx: RenderCtx = { ...ctx, inset: 0, budget, spent: { rows: 0 } }
      const parts: RenderElement[] = []

      // Breadcrumb: source › ancestors (dim) › leaf.
      const { trail, leaf } = breadcrumbOf(doc.tree, key)
      const crumbs: RenderElement[] = [
        <Text key="c0" dimColor>
          {sanitize(doc.fileName ?? doc.source)}
        </Text>,
      ]
      trail.forEach((label, i) => {
        crumbs.push(
          <Text key={`c${i + 1}`} dimColor>
            {`${GLYPHS.crumb} ${label}`}
          </Text>,
        )
      })
      crumbs.push(
        <Text key="leaf">
          {`${GLYPHS.crumb} ${truncateCell(leaf, Math.max(8, width - 4))}`}
        </Text>,
      )
      const crumbBox = (
        <Box key="crumb" flexDirection="row">
          {crumbs}
        </Box>
      )

      const hidden = drawUnits(expandedPlan([node], 8, key), ectx, parts)

      return (
        <Box flexDirection="column">
          {crumbBox}
          {parts.length === 0 && <Text dimColor>(no content captured)</Text>}
          {parts}
          {hidden > 0 && <Text dimColor>{`${GLYPHS.more} (+${hidden} rows hidden)`}</Text>}
          {navRow()}
        </Box>
      )
    }

    const quizView = (): RenderElement => {
      const setNode =
        viewer.activeFactSet === null ? undefined : nodeAt(doc.tree, viewer.activeFactSet)
      const content = setNode?.content
      if (content === undefined || content.kind !== 'facts') {
        return viewer.outlineMode === 'outline' ? outlineView() : expandedView()
      }
      const items = content.items
      const n = items.length
      const isQuiz = viewer.factSetKind === 'quiz'
      const at = Math.min(viewer.itemIndex, n)
      const position = at < n ? at + 1 : n
      const budget = Math.max(1, room - 4)
      const out: RenderElement[] = []
      let used = 0
      const push = (el: RenderElement): void => {
        if (used < budget) {
          out.push(el)
          used++
        }
      }
      const cellWidth = Math.max(8, width - 6)
      if (at >= n || n === 0) {
        push(
          <Text key="done">{`${meterLine(isQuiz, n, n, viewer)} — set complete`}</Text>,
        )
      } else {
        const item = items[viewer.itemIndex]!
        push(
          <Text key="meter" dimColor>
            {meterLine(isQuiz, position, n, viewer)}
          </Text>,
        )
        const prompt = promptFor(item, position, viewer.factSetKind, viewer.flipped)
        for (const line of wrapLines(sanitize(prompt), cellWidth, Math.max(1, budget - used))) {
          push(<Text key={`p${out.length}`}>{line}</Text>)
        }
        if (isQuiz) {
          if (viewer.picked === null && viewer.order.length === 0) {
            // Conclusion-less item with an empty distractor pool: nothing to
            // pick, so offer the skip rather than a dead end.
            push(
              <Text key="noopts" dimColor>
                (no options recorded for this item)
              </Text>,
            )
            push(
              <Button
                key="quiz:next"
                plain
                onPress={() => {
                  void update($, VIEWER, v =>
                    nextItem(v, buildQuizOptions(items, v.itemIndex + 1, content.seed), n),
                  )
                }}
              >
                {`skip ${GLYPHS.nav.next}`}
              </Button>,
            )
          } else if (viewer.picked === null) {
            const letters = ['a', 'b', 'c', 'd']
            viewer.order
              .slice(0, 4)
              .forEach((option, idx) =>
                push(
                  <Button
                    key={`opt:${idx}`}
                    plain
                    hotkey={letters[idx]}
                    onPress={() => {
                      void update($, VIEWER, v => pickOption(v, idx))
                    }}
                  >
                    {`${GLYPHS.option} ${letters[idx]!.toUpperCase()}) ${truncateCell(sanitize(option.text), cellWidth - 5)}`}
                  </Button>,
                ),
              )
          } else {
            viewer.order.slice(0, 4).forEach((option, idx) => {
              const correct = option.correct
              const picked = idx === viewer.picked
              const mark = correct ? GLYPHS.check : picked ? GLYPHS.cross : '·'
              push(
                <Text
                  key={`opt:${idx}`}
                  color={correct ? 'success' : picked ? 'error' : undefined}
                  dimColor={!correct && !picked}
                >
                  {`${mark} ${truncateCell(sanitize(option.text), cellWidth - 3)}`}
                </Text>,
              )
            })
            push(
              <Button
                key="quiz:next"
                plain
                onPress={() => {
                  void update($, VIEWER, v =>
                    nextItem(v, buildQuizOptions(items, v.itemIndex + 1, content.seed), n),
                  )
                }}
              >
                {`next ${GLYPHS.nav.next}`}
              </Button>,
            )
          }
        } else {
          push(
            <Button
              key="quiz:flip"
              plain
              hotkey="f"
              onPress={() => {
                void update($, VIEWER, flipCard)
              }}
            >
              {`${GLYPHS.kind.flashcards} ${viewer.flipped ? 'hide' : 'flip'}`}
            </Button>,
          )
          push(
            <Button
              key="quiz:next"
              plain
              onPress={() => {
                void update($, VIEWER, v =>
                  nextItem(v, buildQuizOptions(items, v.itemIndex + 1, content.seed), n),
                )
              }}
            >
              {`next ${GLYPHS.nav.next}`}
            </Button>,
          )
        }
      }
      return (
        <Box flexDirection="column">
          {out}
          <Box flexDirection="row" gap={1}>
            <Button
              key="nav:outline"
              plain
              dimColor
              onPress={() => {
                void update($, VIEWER, backToOutline)
              }}
            >
              {`${GLYPHS.nav.back} outline`}
            </Button>
            <Button
              key="nav:section"
              plain
              dimColor
              onPress={() => {
                void update($, VIEWER, v =>
                  focusSection(v, viewer.activeFactSet ?? v.focusedSection ?? ''),
                )
              }}
            >
              {`${GLYPHS.nav.back} section`}
            </Button>
          </Box>
        </Box>
      )
    }

    if (viewer.mode === 'section') return sectionView()
    if (viewer.mode === 'quiz') return quizView()
    if (viewer.mode === 'outline') return outlineView()
    return expandedView()
  })

  // The band above the prompt while a document is active.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, DOC)
    if (current === null || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor>
          {`${GLYPHS.kind.section} SemText: ${current.elementCount} elements · ${current.unknownElements.length} unknown `}
        </Text>
      </Box>
    )
  })

  // /semtext toggles the pane.
  on('command.run', { command: 'semtext' }, async $ => {
    const panes = await $.ui.panes()
    if (panes.some(pane => pane.id === PANE_ID)) {
      await $.ui.close({ id: PANE_ID })
      return { text: 'SemText viewer closed.' }
    }
    await $.ui.open({ id: PANE_ID, title: PANE_TITLE })
    return { text: 'SemText viewer open.' }
  })
}
