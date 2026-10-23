import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, ToolCallInput } from 'claude-code'

import {
  GLYPHS,
  INITIAL_VIEWER,
  RENDERERS,
  backToOutline,
  breadcrumbOf,
  buildQuizOptions,
  collapseWhitespace,
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
  setActiveView,
  setExpanded,
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

// NPL pump-tag vocabulary (Trinity response elements) + the Trinity friction
// markers. The parser lowercases tag names, so these stay lowercase; they
// parse like sem elements and warn-match like them (never an unknown-note).
const NPL_ELEMENTS: ReadonlySet<string> = new Set([
  'npl-mindread',
  'npl-thought',
  'npl-block',
  'npl-ref',
  'npl-hormones',
  'npl-intent',
  'wedge',
  'shadow',
  'critic',
  'weego',
])

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
  return /<(?:sem-[a-z][a-z0-9-]*|npl-[a-z][a-z0-9-]*|wedge|shadow|critic|weego)(?=[\s/>])/i.test(text)
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
}

type TextContainer = { name: string; start: number }

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
      if (node.attrs['collapsed'] === undefined || full === '') return undefined
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
      return { kind: 'table', rows }
    }
    case 'sem-code': {
      const source = [raw.trim(), ...childRaws.map(line => line.trim())]
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
  const raw = node.raw ?? ''
  const direct = collapseWhitespace(raw)
  const childText = node.children
    .map(child => child.text ?? '')
    .filter(text => text !== '')
    .join(' ')
  const full = collapseWhitespace(`${direct} ${childText}`)
  node.text = full.slice(0, MAX_TEXT)
  node.content = contentFor(node, full, raw, childRaws)
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

  const captureGap = (from: number, to: number): void => {
    if (to <= from) return
    const top = stack[stack.length - 1]
    if (top === undefined || containers.length > 0) return
    top.raw = (top.raw ?? '') + sanitize(text.slice(from, to))
  }
  const captureContainer = (container: TextContainer, to: number): void => {
    const top = stack[stack.length - 1]
    if (top === undefined) return
    const inner = text
      .slice(container.start, to)
      .replace(COMMENT_BLOCK, ' ')
      .replace(TAG_LIKE, ' ')
    const clean = collapseWhitespace(sanitize(inner))
    if (clean === '') return
    const blocks: SemBlock[] = (top.blocks ??= [])
    if (blocks.length >= MAX_BLOCKS) return
    const heading = HEADING_NAME.exec(container.name)
    if (heading !== null) blocks.push({ kind: 'heading', level: Number(heading[1]), text: clean })
    else if (container.name === 'blockquote') blocks.push({ kind: 'quote', text: clean })
    else blocks.push({ kind: 'text', text: clean })
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
      if (closing) {
        let at = -1
        for (let s = containers.length - 1; s >= 0; s--) {
          if (containers[s]!.name === name) {
            at = s
            break
          }
        }
        if (at >= 0) {
          captureContainer(containers[at]!, i)
          containers.length = at
        }
      } else if (
        !selfClosing &&
        (name === 'p' || name === 'blockquote' || HEADING_NAME.test(name))
      ) {
        containers.push({ name, start: end })
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

const INTERACTIVE: ReadonlySet<SemNodeContent['kind']> = new Set([
  'facts',
  'reveal',
  'note',
  'views',
  'properties',
  'table',
  'code',
])

type Widget = { key: string; node: SemTextNode }

/** Interactive-content descendants of `root`, keyed by outline row key. */
function widgetsIn(root: SemTextNode, baseKey: string): Widget[] {
  const out: Widget[] = []
  const walk = (nodes: readonly SemTextNode[], prefix: string): void => {
    for (let i = 0; i < nodes.length && out.length < MAX_WIDGETS; i++) {
      const node = nodes[i]!
      const key = `${prefix}${i}`
      if (node.content !== undefined && INTERACTIVE.has(node.content.kind)) {
        out.push({ key, node })
      }
      walk(node.children, `${key}.`)
    }
  }
  walk(root.children, `${baseKey}.`)
  return out
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

  // The pane: outline / section / quiz runner, one mode at a time.
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
    const ctx: RenderCtx = {
      el: { Box, Text, Button },
      viewer,
      width,
      wkey: '',
      budget: room,
      spent: { rows: 0 },
      showBody: false,
      press: fn => {
        void update($, VIEWER, fn)
      },
    }

    const outlineView = (): RenderElement => {
      const unknown = doc.unknownElements
      const body = rows.slice(0, Math.max(1, room - 3))
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
          {body.map(row => (
            <Button
              key={`sec:${row.key}`}
              plain
              dimColor={row.depth > 0}
              onPress={() => {
                void update($, VIEWER, v => focusSection(v, row.key))
              }}
            >
              {`${row.key === selected ? GLYPHS.toggle.open : ' '} ${row.prefix}${row.glyph} ${row.label}`}
              {row.count > 0 && <Text dimColor>{` (${row.count})`}</Text>}
            </Button>
          ))}
          {rows.length > body.length && (
            <Text dimColor>{`${GLYPHS.more} (+${rows.length - body.length})`}</Text>
          )}
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

    // Blocks: headings (`##` dim marker), blockquotes (`▌`), paragraphs plain.
    // Returns the number of rows actually drawn.
    const pushBlock = (parts: RenderElement[], block: SemBlock, budget: number): number => {
      if (budget <= 0) return 0
      const cellWidth = Math.max(8, width - 2)
      const draw = (marker: string, text: string, dim: boolean, weight?: 'semibold'): number => {
        const lines = wrapLines(sanitize(text), Math.max(4, cellWidth - marker.length), budget)
        lines.forEach((line, i) => {
          parts.push(
            i === 0 && marker !== '' ? (
              <Text key={`b${parts.length}-${i}`} dimColor={dim} weight={weight}>
                <Text dimColor>{marker}</Text>
                {line}
              </Text>
            ) : (
              <Text
                key={`b${parts.length}-${i}`}
                dimColor={dim}
                weight={i === 0 ? weight : undefined}
              >
                {marker !== '' && i > 0 ? `${' '.repeat(marker.length)}${line}` : line}
              </Text>
            ),
          )
        })
        return lines.length
      }
      if (block.kind === 'heading') {
        const mark = `${'#'.repeat(Math.min(6, Math.max(1, block.level)))} `
        return draw(mark, block.text, false, block.level <= 2 ? 'semibold' : undefined)
      }
      if (block.kind === 'quote') {
        return draw(`${GLYPHS.quote} `, block.text, true)
      }
      return draw('', block.text, false)
    }

    const sectionView = (): RenderElement => {
      const key = viewer.focusedSection ?? ''
      const node = nodeAt(doc.tree, key)
      if (node === undefined) return outlineView()
      let used = 1 // the breadcrumb row
      const budget = Math.max(1, room - 2)
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
      parts.push(
        <Box key="crumb" flexDirection="row">
          {crumbs}
        </Box>,
      )

      // Headings / paragraphs / blockquotes captured inside the element.
      for (const block of node.blocks ?? []) {
        if (used >= budget) break
        used += pushBlock(parts, block, budget - used)
      }

      // The element's own content, then interactive descendants — both
      // through the render registry. `spent` is shared; only the delta
      // between calls counts against the budget.
      const renderWith = (widgetKey: string, target: SemTextNode, showBody: boolean): void => {
        if (used >= budget) return
        const render = RENDERERS[target.tag] ?? RENDERERS['*']!
        const before = ctx.spent.rows
        const sub: RenderCtx = { ...ctx, wkey: widgetKey, budget: budget - used, showBody }
        const drawn = render(target, sub)
        used += ctx.spent.rows - before
        parts.push(
          <Box key={`w:${widgetKey}`} flexDirection="column">
            {drawn}
          </Box>,
        )
      }
      renderWith(key, node, (node.blocks ?? []).length === 0 && node.content === undefined)
      for (const widget of widgetsIn(node, key)) {
        if (used >= budget) break
        renderWith(widget.key, widget.node, false)
      }

      return (
        <Box flexDirection="column">
          {parts.length === 1 ? <Text dimColor>(no content captured)</Text> : parts}
          {used >= budget && <Text dimColor>{GLYPHS.more}</Text>}
          {navRow()}
        </Box>
      )
    }

    const quizView = (): RenderElement => {
      const setNode =
        viewer.activeFactSet === null ? undefined : nodeAt(doc.tree, viewer.activeFactSet)
      const content = setNode?.content
      if (content === undefined || content.kind !== 'facts') return outlineView()
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
    return outlineView()
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
