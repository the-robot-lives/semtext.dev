import { test, expect } from 'claude-code/testing'
import type { RenderElement } from 'claude-code'

import {
  INITIAL_VIEWER,
  annotateText,
  backToOutline,
  buildQuizOptions,
  factLine,
  flipCard,
  focusSection,
  looksLikeSemText,
  nextItem,
  nodeAt,
  parseSemText,
  pickOption,
  promptFor,
  resetsViewer,
  startQuiz,
} from '../hooks/register'
import {
  GLYPHS,
  breadcrumbOf,
  columnWidths,
  drawTable,
  firstWords,
  frameLines,
  meterLine,
  outlineTree,
  progressBar,
  propertyLines,
  tableCells,
  treePrefix,
  truncateCell,
  truncateSummary,
  wrapLines,
} from '../hooks/render'
import type { FactItem, QuizOption, SemTextDoc, SemTextNode } from '../types'

const FIXTURE = `<!doctype html>
<html><body>
<sem-enhanced-document role="main">
  <sem-tldr>Short summary</sem-tldr>
  <sem-section title="Deep dive">
    <sem-note kind="warning">Careful</sem-note>
    <sem-unknown-widget id="w1"/>
  </sem-section>
</sem-enhanced-document>
</body></html>`

test('detector parses a sem-* document into the expected tree', async () => {
  const parsed = parseSemText(FIXTURE)
  expect(parsed === null).toBe(false)
  const p = parsed!
  expect(p.elementCount).toBe(5)
  expect(p.roots.length).toBe(1)

  const root = p.roots[0]!
  expect(root.tag).toBe('sem-enhanced-document')
  expect(root.attrs['role']).toBe('main')
  expect(root.children.map(child => child.tag)).toEqual(['sem-tldr', 'sem-section'])

  const section = root.children[1]!
  expect(section.attrs['title']).toBe('Deep dive')
  expect(section.children.map(child => child.tag)).toEqual(['sem-note', 'sem-unknown-widget'])
  expect(section.children[1]!.children.length).toBe(0)
  expect(p.unknownElements).toEqual(['sem-unknown-widget'])
})

test('detector skips script bodies and honors self-closing tags', async () => {
  const text =
    '<script>var x = "<sem-fake-not-markup>";</script>' +
    '<sem-enhanced-document><sem-break/><sem-note>real</sem-note></sem-enhanced-document>'
  const parsed = parseSemText(text)
  expect(parsed === null).toBe(false)
  const p = parsed!
  // The string inside <script> never closes as a tag, so only the real
  // elements count.
  expect(p.elementCount).toBe(3)
  expect(p.roots[0]!.children.map(child => child.tag)).toEqual(['sem-break', 'sem-note'])
  // The script body never lands in captured content.
  expect(p.roots[0]!.text).not.toContain('var x')
})

test('text without sem-* markup passes through unchanged', async ($, on) => {
  const seen: string[] = []
  // The test's hook is the bottom of the chain: it answers ui.render itself
  // and records the text the plugin's chain left on `e`.
  on('ui.render', { component: 'AssistantMessage' }, async (_d, e) => {
    seen.push(e.props.text)
    return h('Text', null, e.props.text) as unknown as RenderElement
  })
  const plain = 'A plain answer with <div> tags and no sem markup at all.'
  expect(looksLikeSemText(plain)).toBe(false)
  await $.ui.render({
    surface: 'terminal',
    component: 'AssistantMessage',
    requestId: 'plain-1',
    props: { text: plain, isFirstOfReply: true },
  })
  expect(seen).toEqual([plain])
})

test('text carrying sem-* markup gains a digest line', async () => {
  const sem =
    'Intro paragraph.\n' +
    '<sem-enhanced-document role="main">\n<sem-tldr>hi</sem-tldr>\n</sem-enhanced-document>\n'
  const parsed = parseSemText(sem)!
  const annotated = annotateText(sem, parsed)
  expect(annotated.includes('SemText · sem-enhanced-document · 2 elements')).toBe(true)
  expect(annotated.length).toBeGreaterThan(sem.length)
  // Fenced sem markup is left alone.
  const fenced =
    'Before.\n```\n<sem-enhanced-document><sem-note>x</sem-note></sem-enhanced-document>\n```\n'
  const parsedFence = parseSemText(fenced)!
  expect(annotateText(fenced, parsedFence)).toBe(fenced)
})

// --- v0.2: content capture ---

const VIEWER_FIXTURE = `<sem-enhanced-document>
  <sem-section title="Recap">
    <h2>Recap</h2>
    <p>Prose line.</p>
    <sem-facts data-view-as="quiz" data-sem-seed="7">
      <sem-fact>What is A?<sem-conclusion>Alpha</sem-conclusion><sem-distractor>Delta</sem-distractor></sem-fact>
      <sem-fact>What is B?<sem-conclusion>Beta</sem-conclusion></sem-fact>
    </sem-facts>
    <sem-reveal summary="Why?">Because.</sem-reveal>
    <sem-note collapsed>one two three four five six seven eight nine ten eleven</sem-note>
    <sem-views id="deploy"><sem-view name="Helm">helm text</sem-view><sem-view name="Raw" active>raw text</sem-view></sem-views>
    <sem-properties kind="config"><sem-property key="ttl">3600</sem-property><sem-property key="mode">fast</sem-property></sem-properties>
    <sem-code lang="ts">const a = 1
const b = 2</sem-code>
  </sem-section>
</sem-enhanced-document>`

test('parser captures headings, paragraphs and interactive content', async () => {
  const parsed = parseSemText(VIEWER_FIXTURE)
  expect(parsed === null).toBe(false)
  const section = parsed!.roots[0]!.children[0]!
  expect(section.tag).toBe('sem-section')
  expect(section.children.map(child => child.tag)).toEqual([
    'sem-facts',
    'sem-reveal',
    'sem-note',
    'sem-views',
    'sem-properties',
    'sem-code',
  ])
  // Headings/paragraphs captured as blocks, in document order.
  expect(section.blocks).toEqual([
    { kind: 'heading', level: 2, text: 'Recap' },
    { kind: 'text', text: 'Prose line.' },
  ])

  const facts = section.children[0]!.content
  expect(facts?.kind).toBe('facts')
  if (facts?.kind !== 'facts') return
  expect(facts.viewAs).toBe('quiz')
  expect(facts.seed).toBe(7)
  expect(facts.items.length).toBe(2)
  expect(facts.items[0]).toEqual({
    body: 'What is A?',
    conclusion: 'Alpha',
    distractors: ['Delta'],
  })
  expect(facts.items[1]!.conclusion).toBe('Beta')
  expect(facts.items[1]!.distractors).toEqual([])

  const reveal = section.children[1]!.content
  expect(reveal).toEqual({
    kind: 'reveal',
    summary: 'Why?',
    body: 'Because.',
    collapsed: false,
  })

  const note = section.children[2]!.content
  expect(note?.kind).toBe('note')
  if (note?.kind !== 'note') return
  expect(note.summary).toBe('one two three four five six seven eight nine ten …')
  expect(note.body).toContain('eleven')

  const views = section.children[3]!.content
  expect(views?.kind).toBe('views')
  if (views?.kind !== 'views') return
  expect(views.views.map(view => view.name)).toEqual(['Helm', 'Raw'])
  expect(views.initial).toBe(1)
  expect(views.views[1]!.body).toBe('raw text')

  const properties = section.children[4]!.content
  expect(properties).toEqual({
    kind: 'properties',
    properties: [
      { key: 'ttl', value: '3600' },
      { key: 'mode', value: 'fast' },
    ],
  })

  const code = section.children[5]!.content
  expect(code?.kind).toBe('code')
  if (code?.kind !== 'code') return
  expect(code.lang).toBe('ts')
  expect(code.body).toContain('const a = 1')
  expect(code.body).toContain('const b = 2')
})

test('collapsed reveal and inherited seeds capture correctly', async () => {
  const text =
    '<sem-section data-sem-seed="42">' +
    '<sem-reveal collapsed>Hidden body text here</sem-reveal>' +
    '<sem-facts view-as="flashcards"><sem-fact>Q<sem-conclusion>C1</sem-conclusion></sem-fact></sem-facts>' +
    '</sem-section>'
  const parsed = parseSemText(text)!
  const section = parsed.roots[0]!
  const reveal = section.children[0]!.content
  expect(reveal).toEqual({
    kind: 'reveal',
    summary: 'Hidden body text here',
    body: 'Hidden body text here',
    collapsed: true,
  })
  const facts = section.children[1]!.content
  expect(facts?.kind).toBe('facts')
  if (facts?.kind !== 'facts') return
  // view-as (spec form) recognized; seed inherited from the section.
  expect(facts.viewAs).toBe('flashcards')
  expect(facts.seed).toBe(42)
  expect(facts.items[0]).toEqual({ body: 'Q', conclusion: 'C1', distractors: [] })
})

// --- v0.2: buildQuizOptions (pure) ---

const BUILDER_ITEMS: FactItem[] = [
  { body: 'q0', conclusion: 'A0', distractors: ['D0a', 'D0b', 'D0c', 'D0d'] },
  { body: 'q1', conclusion: 'A1', distractors: [] },
  { body: 'q2', conclusion: 'A2', distractors: ['D2'] },
]

test('buildQuizOptions follows the browser distractor rule', async () => {
  const options = buildQuizOptions(BUILDER_ITEMS, 0, 7)
  // 4 explicit distractors available but capped at 3, explicit first.
  expect(options.length).toBe(4)
  expect([...options].map(o => o.text).sort()).toEqual(['A0', 'D0a', 'D0b', 'D0c'])
  // Answer exactly once.
  const correct = options.filter(option => option.correct)
  expect(correct.length).toBe(1)
  expect(correct[0]!.text).toBe('A0')
  // Deterministic given the seed.
  expect(buildQuizOptions(BUILDER_ITEMS, 0, 7)).toEqual(options)
  // Item without explicit distractors fills from the other items' conclusions.
  const second = buildQuizOptions(BUILDER_ITEMS, 1, 7)
  expect([...second].map(o => o.text).sort()).toEqual(['A0', 'A1', 'A2'])
  expect(second.filter(option => option.correct).map(o => o.text)).toEqual(['A1'])
  // Out-of-range and empty inputs.
  expect(buildQuizOptions(BUILDER_ITEMS, 3, 7)).toEqual([])
  expect(buildQuizOptions([], 0, 7)).toEqual([])
})

test('buildQuizOptions is deterministic per item across the set stream', async () => {
  const again = buildQuizOptions(BUILDER_ITEMS, 2, 7)
  expect(buildQuizOptions(BUILDER_ITEMS, 2, 7)).toEqual(again)
  expect(again.filter(option => option.correct).map(o => o.text)).toEqual(['A2'])
  // Every item keeps exactly one answer.
  for (let idx = 0; idx < BUILDER_ITEMS.length; idx++) {
    const options = buildQuizOptions(BUILDER_ITEMS, idx, 99)
    expect(options.filter(option => option.correct).length).toBe(1)
  }
})

// --- v0.2: grading + navigation (pure reducers; the test harness exposes no
// state noun, so the atom plumbing itself is exercised live, not here) ---

const ORDER: QuizOption[] = [
  { text: 'x', correct: false },
  { text: 'y', correct: true },
  { text: 'z', correct: false },
]

test('grading updates the score; a second press never grades', async () => {
  let v = startQuiz(INITIAL_VIEWER, '0.1', 'quiz', ORDER)
  v = pickOption(v, 1)
  expect(v.score).toEqual({ correct: 1, answered: 1 })
  expect(v.picked).toBe(1)
  // A second press on the same item is inert (same state back).
  expect(pickOption(v, 0)).toBe(v)

  // Wrong pick on a fresh set.
  const wrong = pickOption(startQuiz(INITIAL_VIEWER, '0.1', 'quiz', ORDER), 0)
  expect(wrong.score).toEqual({ correct: 0, answered: 1 })
})

test('flashcards flip without grading', async () => {
  let v = startQuiz(INITIAL_VIEWER, '0.1', 'flashcards', ORDER)
  v = flipCard(v)
  expect(v.flipped).toBe(true)
  expect(v.score).toEqual({ correct: 0, answered: 0 })
  // pickOption is inert in flashcards mode.
  v = pickOption(v, 1)
  expect(v.score.answered).toBe(0)
})

test('outline select jumps to a section; the runner reaches its end state', async () => {
  let v = focusSection(INITIAL_VIEWER, '0.2')
  expect(v.mode).toBe('section')
  expect(v.focusedSection).toBe('0.2')
  expect(v.order).toEqual([])

  v = startQuiz(v, '0.2.0', 'quiz', ORDER)
  v = pickOption(v, 1)
  v = nextItem(v, ORDER, 2)
  expect(v.itemIndex).toBe(1)
  expect(v.picked).toBe(null)
  v = nextItem(v, [], 2)
  expect(v.itemIndex).toBe(2)
  expect(v.order).toEqual([])

  // Back to outline clears the runner.
  v = backToOutline(v)
  expect(v.mode).toBe('outline')
  expect(v.activeFactSet).toBe(null)
})

test('nodeAt resolves outline row keys', async () => {
  const tree: SemTextNode[] = parseSemText(
    '<sem-doc><sem-section><sem-note>x</sem-note></sem-section></sem-doc>',
  )!.roots
  expect(nodeAt(tree, '0')?.tag).toBe('sem-doc')
  expect(nodeAt(tree, '0.0')?.tag).toBe('sem-section')
  expect(nodeAt(tree, '0.0.0')?.tag).toBe('sem-note')
  expect(nodeAt(tree, '0.9')).toBeUndefined()
  expect(nodeAt(tree, '')).toBeUndefined()
})

test('a fresh source resets the viewer; a re-read of the same source does not', async () => {
  const doc: SemTextDoc = {
    source: 'test:source-a',
    fileName: 'a.html',
    tree: [],
    elementCount: 1,
    unknownElements: [],
    firstSeen: 0,
  }
  expect(resetsViewer(null, 'test:source-a')).toBe(true)
  expect(resetsViewer(doc, 'test:source-a')).toBe(false)
  expect(resetsViewer(doc, 'test:source-b')).toBe(true)
})

// --- v0.2.1: list mode + conclusion-only items — a facts section never blank ---

test('list-mode and conclusion-only facts capture and render non-blank', async () => {
  // Capture: bare <sem-facts> (list mode, the default) with every degenerate
  // item shape the browser fallback accepts.
  const text =
    '<sem-facts>' +
    '<sem-fact>Q1<sem-conclusion>C1</sem-conclusion></sem-fact>' +
    '<sem-fact><sem-conclusion>Only</sem-conclusion></sem-fact>' +
    '<sem-fact><sem-distractor>D</sem-distractor></sem-fact>' +
    '</sem-facts>'
  const parsed = parseSemText(text)!
  const facts = parsed.roots[0]!.content
  expect(facts?.kind).toBe('facts')
  if (facts?.kind !== 'facts') return
  expect(facts.viewAs).toBe('list')
  expect(facts.items[0]).toEqual({ body: 'Q1', conclusion: 'C1', distractors: [] })
  // Conclusion-only item: the body collapses empty, the conclusion stays.
  expect(facts.items[1]).toEqual({ body: '', conclusion: 'Only', distractors: [] })
  // Distractor-only item: still captured.
  expect(facts.items[2]).toEqual({ body: '', conclusion: '', distractors: ['D'] })

  // Render inputs are never blank.
  expect(factLine(facts.items[0]!)).toBe('Q1 — C1')
  expect(factLine(facts.items[1]!)).toBe('Only')
  expect(factLine(facts.items[2]!)).toBe('(empty item)')
  expect(promptFor(facts.items[1]!, 1, 'quiz', false)).toBe('Item 1')
  expect(promptFor(facts.items[1]!, 1, 'flashcards', true)).toBe('Only')
  expect(promptFor(facts.items[2]!, 1, 'flashcards', true)).toBe('(no conclusion recorded)')
  // Conclusion-less item in a quiz: options come from the pool, none gradeable.
  const options = buildQuizOptions(facts.items, 2, 7)
  expect(options.length).toBeGreaterThan(0)
  expect(options.filter(option => option.correct)).toEqual([])
})

// --- v0.3: the pure drawing layer ---

test('cell truncation cuts at width with the ellipsis glyph', async () => {
  expect(truncateCell('hello', 10)).toBe('hello')
  expect(truncateCell('hello', 4)).toBe(`hel${GLYPHS.more}`)
  expect(truncateCell('hello', 1)).toBe(GLYPHS.more)
  expect(truncateCell('hello', 0)).toBe('')
  expect(truncateCell('', 5)).toBe('')
  // Code-point safe: an emoji survives whole under the cut.
  const cut = truncateCell('ab📌cd', 4)
  expect(cut.startsWith('ab📌')).toBe(true)
  expect(Array.from(cut).length).toBe(4)
})

test('wrapLines chunks to width and marks the cut', async () => {
  expect(wrapLines('abcdefgh', 4, 4)).toEqual(['abcd', 'efgh'])
  const cut = wrapLines('abcdefghij', 4, 2)
  expect(cut.length).toBe(2)
  expect(cut[1]!.endsWith(GLYPHS.more)).toBe(true)
  expect(wrapLines('', 4, 2)).toEqual([])
})

test('columnWidths takes the widest cell and shrinks to fit the frame', async () => {
  expect(columnWidths([], 40)).toEqual([])
  expect(columnWidths([['a', 'bbb'], ['cc', 'd']], 100)).toEqual([2, 3])
  // Budget binds before the floor: maxes 8+8=16, budget = 20-(3*2+1)=13.
  const shrink = columnWidths([['aaaaaaaa', 'bbbbbbbb']], 20)
  expect(shrink).toEqual([6, 7])
  // Budget never drops below the 3-cells-per-column floor: maxes 4+2=6,
  // budget = max(2*3, 10-7) = 6, so [4, 2] survives untouched.
  const floored = columnWidths([['aaaa', 'bb']], 10)
  expect(floored).toEqual([4, 2])
})

test('tableCells splits pipes, tabs and plain lines; drawTable frames', async () => {
  expect(tableCells(['a | b | c', 'x\ty', 'plain line', '', '  '])).toEqual([
    ['a', 'b', 'c'],
    ['x', 'y'],
    ['plain line'],
  ])
  // Pipe-table decoration (leading/trailing empty cells) is trimmed.
  expect(tableCells(['| h1 | h2 |', '| a | b |'])).toEqual([
    ['h1', 'h2'],
    ['a', 'b'],
  ])

  const { lines, headerRows, hidden } = drawTable(
    [
      ['name', 'value'],
      ['ttl', '3600'],
      ['mode', 'fast'],
    ],
    40,
    10,
  )
  // ┌─┬─┐ top, header row, ├─┼─┤, two body rows, └─┴─┘ bottom.
  expect(lines.length).toBe(6)
  expect(lines[0]!.startsWith(`${GLYPHS.frame.tl}`)).toBe(true)
  expect(lines[0]!.endsWith(GLYPHS.frame.tr)).toBe(true)
  expect(lines[0]!.includes(GLYPHS.frame.teeDown)).toBe(true)
  expect(lines[2]!.includes(GLYPHS.frame.cross)).toBe(true)
  expect(lines[5]!.startsWith(GLYPHS.frame.bl)).toBe(true)
  expect(headerRows).toBe(1)
  expect(hidden).toBe(0)
  expect(lines[1]).toContain('name')
  expect(lines[1]).toContain('value')

  // Row cap: maxRows 3 draws header + 2 body rows and reports the rest.
  const capped = drawTable(
    [
      ['h'],
      ['r1'],
      ['r2'],
      ['r3'],
    ],
    40,
    3,
  )
  expect(capped.hidden).toBe(1)
  expect(capped.lines.some(line => line.includes(`(+1)`))).toBe(false) // marker drawn by the pane, not the table
  expect(capped.lines.length).toBe(6) // top + header + separator + 2 body + bottom

  // Long cells truncate with … inside their column.
  const wide = drawTable([['header'], ['x'.repeat(50)]], 20, 10)
  expect(Array.from(wide.lines[1]!).length).toBeLessThanOrEqual(20)
})

test('progressBar and meterLine draw the ▰▱ meter', async () => {
  expect(progressBar(1, 4, 4)).toBe(`${GLYPHS.bar.full}${GLYPHS.bar.empty.repeat(3)}`)
  expect(progressBar(4, 4, 4)).toBe(GLYPHS.bar.full.repeat(4))
  expect(progressBar(0, 4, 4)).toBe(GLYPHS.bar.empty.repeat(4))
  expect(progressBar(2, 4, 8)).toBe(GLYPHS.bar.full.repeat(4) + GLYPHS.bar.empty.repeat(4))
  expect(progressBar(1, 0, 4)).toBe(GLYPHS.bar.empty.repeat(4))
  expect(progressBar(1, 4, 0)).toBe('')
  // Overfill clamps.
  expect(progressBar(9, 4, 4)).toBe(GLYPHS.bar.full.repeat(4))

  const viewer = { ...INITIAL_VIEWER, score: { correct: 2, answered: 2 } }
  const quiz = meterLine(true, 2, 4, viewer)
  expect(quiz).toContain('2/4')
  expect(quiz).toContain('score 2/2')
  expect(quiz).toContain(GLYPHS.bar.full)
  expect(meterLine(false, 3, 5, viewer)).not.toContain('score')
})

test('treePrefix draws ├──/└── with │ continuation', async () => {
  expect(treePrefix([], false)).toBe(`${GLYPHS.tree.branch} `)
  expect(treePrefix([], true)).toBe(`${GLYPHS.tree.last} `)
  // A non-last ancestor carries the spine down.
  expect(treePrefix([false], true)).toBe(`${GLYPHS.tree.spine}  ${GLYPHS.tree.last} `)
  // A last ancestor leaves a blank gap.
  expect(treePrefix([true, false], false)).toBe(
    `   ${GLYPHS.tree.spine}  ${GLYPHS.tree.branch} `,
  )
})

test('summary truncation follows the word-boundary and word-count rules', async () => {
  // 60-char cap cuts at the last word boundary and strips trailing punctuation.
  const long = 'one two three four five six seven eight nine ten eleven twelve thirteen'
  expect(truncateSummary(long).endsWith('thirteen')).toBe(false)
  expect(truncateSummary(long).length).toBeLessThanOrEqual(60)
  expect(truncateSummary('short body')).toBe('short body')
  expect(firstWords(long, 3)).toBe('one two three')
  expect(firstWords('   ', 3)).toBe('')
})

test('outlineTree, glyphOf vocabulary and breadcrumbOf label the pane', async () => {
  const tree = parseSemText(
    '<sem-doc>' +
      '<sem-procedure><sem-step>one</sem-step><sem-step>two</sem-step></sem-procedure>' +
      '<sem-section title="Leaf"><sem-note kind="warning">hot</sem-note></sem-section>' +
      '</sem-doc>',
  )!.roots
  const rows = outlineTree(tree)
  expect(rows.map(row => row.key)).toEqual(['0', '0.0', '0.0.0', '0.0.1', '0.1', '0.1.0'])
  // Root row is the last at its level; its children carry the blank gap.
  expect(rows[0]!.prefix.startsWith(GLYPHS.tree.last)).toBe(true)
  expect(rows[1]!.prefix.startsWith(`   ${GLYPHS.tree.branch}`)).toBe(true)
  // Glyphs come from OUR vocabulary, never content.
  expect(rows[0]!.glyph).toBe(GLYPHS.kind.misc)
  expect(rows[1]!.glyph).toBe(GLYPHS.kind.procedure)
  expect(rows[3]!.glyph).toBe(GLYPHS.kind.step)
  expect(rows[5]!.glyph).toBe(GLYPHS.kind.warning) // sem-note kind="warning"
  expect(rows[5]!.count).toBe(0)
  expect(rows[4]!.count).toBe(1)

  const crumb = breadcrumbOf(tree, '0.1.0')
  expect(crumb.trail).toEqual(['sem-doc', 'sem-section — Leaf'])
  expect(crumb.leaf).toBe('sem-note')
  expect(breadcrumbOf(tree, '9.9').leaf).toBe('')
})

test('frames and property lines render from the vocabulary table', async () => {
  const lines = frameLines(['body line', 'second'], 30, '📌 note', 'left')
  // ┌ top with the badge, two body rows between │ walls, └ bottom.
  expect(lines.length).toBe(4)
  expect(lines[0]!.startsWith(GLYPHS.frame.tl)).toBe(true)
  expect(lines[0]!.includes('📌 note')).toBe(true)
  expect(lines[0]!.endsWith(GLYPHS.frame.tr)).toBe(true)
  expect(lines[1]!.startsWith(`${GLYPHS.frame.v} `)).toBe(true)
  expect(lines[1]!.endsWith(` ${GLYPHS.frame.v}`)).toBe(true)
  expect(lines[3]!.startsWith(GLYPHS.frame.bl)).toBe(true)
  // Every frame row is the same width in code points (the badge emoji is a
  // surrogate pair, so UTF-16 .length would differ by one on the top row).
  expect(lines.every(line => Array.from(line).length === Array.from(lines[0]!).length)).toBe(true)

  // Right-aligned badge: the lang sits at the top border's end.
  const right = frameLines(['const a = 1'], 30, '⌨ ts', 'right')
  expect(right[0]!.includes('⌨ ts')).toBe(true)
  expect(right[0]!.indexOf('⌨ ts')).toBeGreaterThan(right[0]!.length / 2)

  const props = propertyLines(
    [
      { key: 'ttl', value: '3600' },
      { key: 'mode-long', value: 'a very long value that must truncate somewhere' },
    ],
    40,
  )
  // keyCol = 9 ('mode-long'); pad + the template's space → 7 gaps after 'ttl'.
  expect(props[0]).toBe(`🔑 ttl       ──▸ 3600`)
  expect(props[1]!.startsWith('🔑 mode-long ──▸ ')).toBe(true)
  expect(props[1]!.includes(GLYPHS.more)).toBe(true)
})
