import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ToolCallInput } from 'claude-code'

import type { SemTextDoc, SemTextNode } from '../types'

// --- constants ---

const PANE_ID = 'semtext-outline'
const PANE_TITLE = 'SemText outline'
const MAX_STORED_NODES = 2000
const MAX_SEEN_SOURCES = 50
const MAX_NOTES = 20

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
])

// --- state ---

const DOC = atom({ plugin: 'semtext', key: 'doc' } as const, null)
const SEEN = atom({ plugin: 'semtext', key: 'seenSources' } as const, [])

// --- detection ---

export interface ParsedSemText {
  roots: SemTextNode[]
  elementCount: number
  unknownElements: string[]
  notes: string[]
}

const ANSI_OR_CONTROL =
  /\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\u0007]*(?:\u0007|\x1b\\)|[\u0000-\u0008\u000b-\u001f\u007f]/g

/** Strips ANSI escape sequences and C0 control characters (keeps \n and \t). */
export function sanitize(value: string): string {
  return value.replace(ANSI_OR_CONTROL, '')
}

/** Cheap prefix-match gate: a sem-* custom element open tag. */
export function looksLikeSemText(text: string): boolean {
  return /<sem-[a-z][a-z0-9-]*(?=[\s/>])/i.test(text)
}

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

/**
 * Parses the sem-* markup of `text` into a nested element tree.
 * Skips HTML comments, doctype/PI forms and the raw bodies of <script>/<style>
 * (a page's fallback JS mentions sem-* names as strings — not markup).
 * Returns null when the text carries no sem-* element at all.
 */
export function parseSemText(text: string): ParsedSemText | null {
  if (!looksLikeSemText(text)) return null
  const roots: SemTextNode[] = []
  const stack: SemTextNode[] = []
  const unknown = new Set<string>()
  const notes: string[] = []
  let count = 0
  let stored = 0
  let line = 1
  let i = 0
  while (i < text.length) {
    const lt = text.indexOf('<', i)
    if (lt < 0) break
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
    line += countNewlines(text, i, end)
    if (!closing && (name === 'script' || name === 'style')) {
      RAW_TEXT_CLOSE.lastIndex = end
      const close = RAW_TEXT_CLOSE.exec(text)
      const stop = close === null ? text.length : RAW_TEXT_CLOSE.lastIndex
      line += countNewlines(text, end, stop)
      i = stop
      continue
    }
    if (name.startsWith('sem-')) {
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
          const selfClosing = /\/\s*>$/.test(src)
          const node: SemTextNode = {
            tag: name,
            attrs: parseAttrs(attrSrcOf(src)),
            line,
            children: [],
          }
          const parent = stack[stack.length - 1]
          if (parent === undefined) roots.push(node)
          else parent.children.push(node)
          if (!selfClosing) stack.push(node)
        }
      }
    }
    i = end
  }
  if (count === 0) return null
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

// --- ingestion ---

function fileNameOf(e: ToolCallInput): string | undefined {
  if ('file_path' in e && typeof e.file_path === 'string') return e.file_path
  return undefined
}

function sourceOf(e: ToolCallInput): string {
  const file = fileNameOf(e)
  return file !== undefined ? file : `tool:${e.tool}`
}

async function ingest(
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
  await update($, DOC, () => nextDoc)
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

// --- outline ---

function outlineRows(doc: SemTextDoc): { key: string; depth: number; label: string }[] {
  const rows: { key: string; depth: number; label: string }[] = []
  const walk = (nodes: readonly SemTextNode[], depth: number, prefix: string): void => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!
      const key = `${prefix}${i}`
      const id = node.attrs['id']
      const named = node.attrs['label'] ?? node.attrs['title'] ?? node.attrs['name']
      const head =
        named !== undefined ? `${node.tag} — ${sanitize(named).slice(0, 60)}` : node.tag
      rows.push({
        key,
        depth,
        label: id !== undefined ? `${head} #${sanitize(id)}` : head,
      })
      if (depth < 8) walk(node.children, depth + 1, `${key}.`)
    }
  }
  walk(doc.tree, 0, '')
  return rows
}

// --- the mod ---

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'semtext',
      description: 'Toggle the SemText outline pane.',
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

  // Inline annotation: AssistantMessage markdown text.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const text = e.props.text
    if (!looksLikeSemText(text)) return next(e)
    const parsed = parseSemText(text)
    if (parsed === null || parsed.roots.length === 0) return next(e)
    const annotated = annotateText(text, parsed)
    if (annotated === text) return next(e)
    return next({ ...e, props: { ...e.props, text: annotated } })
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

  // The outline pane.
  on('ui.render', { component: 'Pane', requestId: PANE_ID }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const current = await read($, DOC)
    if (current === null) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No SemText document detected yet.</Text>
        </Box>
      )
    }
    const rows = outlineRows(current)
    const room = Math.max(1, (e.viewport?.rows ?? 24) - 4)
    const unknown = current.unknownElements
    return (
      <Box flexDirection="column">
        <Text>{sanitize(current.fileName ?? current.source)}</Text>
        <Text dimColor>
          {current.elementCount} elements ·{' '}
          {unknown.length === 0
            ? 'no unknown elements'
            : `${unknown.length} unknown: ${unknown.slice(0, 4).join(', ')}`}
        </Text>
        {rows.slice(0, room).map(row => (
          <Text key={row.key} dimColor={row.depth > 0}>
            {'  '.repeat(row.depth)}
            {row.label}
          </Text>
        ))}
      </Box>
    )
  })

  // The band above the prompt while a document is active.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, DOC)
    if (current === null || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor>
          SemText: {current.elementCount} elements · {current.unknownElements.length} unknown{' '}
        </Text>
      </Box>
    )
  })

  // /semtext toggles the pane.
  on('command.run', { command: 'semtext' }, async $ => {
    const panes = await $.ui.panes()
    if (panes.some(pane => pane.id === PANE_ID)) {
      await $.ui.close({ id: PANE_ID })
      return { text: 'SemText outline closed.' }
    }
    await $.ui.open({ id: PANE_ID, title: PANE_TITLE })
    return { text: 'SemText outline open.' }
  })
}
