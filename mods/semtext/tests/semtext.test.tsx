import { test, expect } from 'claude-code/testing'
import type { RenderElement } from 'claude-code'

import {
  INITIAL_VIEWER,
  annotateText,
  annotateNplMarkdown,
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
  RENDERERS,
  blockRows,
  blocksRows,
  breadcrumbOf,
  cardFrameLines,
  cardKeys,
  columnWidths,
  cpLen,
  drawTable,
  expandedPlan,
  expandedRoleOf,
  firstWords,
  frameLines,
  glyphOf,
  headingBlock,
  headingStyle,
  lineCount,
  meterLine,
  outlineTree,
  progressBar,
  propertyLines,
  proseLines,
  selectedMark,
  setAllExpanded,
  setOutlineMode,
  tableCells,
  treePrefix,
  truncateCell,
  truncateSummary,
  truncationHint,
  wrapLines,
} from '../hooks/render'
import type { FactItem, QuizOption, SemTextDoc, SemTextNode } from '../types'
import type { PaneElements, RenderCtx } from '../hooks/render'

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

  // Back to outline clears the runner and returns to the overview that was
  // active — the default viewer's expanded document view.
  v = backToOutline(v)
  expect(v.mode).toBe('expanded')
  expect(v.activeFactSet).toBe(null)

  // From the compact outline it returns to the compact outline.
  const compact = setOutlineMode(INITIAL_VIEWER, 'outline')
  expect(compact.mode).toBe('outline')
  expect(compact.outlineMode).toBe('outline')
  expect(backToOutline(focusSection(compact, '0.1')).mode).toBe('outline')
  // Toggling back to the expanded view flips mode and the return target.
  const back = setOutlineMode(compact, 'expanded')
  expect(back.mode).toBe('expanded')
  expect(back.outlineMode).toBe('expanded')
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

test('wrapLines wraps prose at word boundaries; over-width tokens hard-cut', async () => {
  // Each break lands on a whitespace boundary; 'three' is wider than the
  // width so it hard-cuts, and the tail becomes its own row.
  expect(wrapLines('one two three', 4, 5)).toEqual(['one', 'two', 'thre', 'e'])
  expect(wrapLines('alpha beta gamma', 11, 4)).toEqual(['alpha beta', 'gamma'])
  // Budget exhausted mid-prose: the last row keeps the … cut marker.
  expect(wrapLines('one two three four five', 4, 2)).toEqual(['one', 'two…'])
  // Leading indentation survives on the first row; rows stay within width.
  expect(wrapLines('    keep indent and wrap', 10, 4)).toEqual([
    '    keep', 'indent', 'and wrap',
  ])
  // char mode keeps the raw fixed-width slice — code/pre never reflow.
  expect(wrapLines('one two', 3, 4, 'char')).toEqual(['one', ' tw', 'o'])
})

test('wrapLines never splits "first" in the reported real-world case', async () => {
  const line =
    'The klaviyo-middleware summary went to the manager to fold in after its first pass'
  // Width 74 is where the old hard cut landed inside "first" (chars 73-77).
  const wrapped = wrapLines(line, 74, 3)
  expect(wrapped[0]!.endsWith('its')).toBe(true)
  expect(wrapped[1]!.startsWith('first')).toBe(true)
  // Nothing dropped, nothing split: rejoining the rows restores the sentence.
  expect(wrapped.join(' ')).toBe(line)
  for (const row of wrapped) {
    expect(Array.from(row).length).toBeLessThanOrEqual(74)
  }
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

test('selectedMark draws the dedicated ❯ — never the toggle glyphs', async () => {
  expect(selectedMark(true)).toBe('❯')
  expect(selectedMark(false)).toBe(' ')
  // The selection mark is its own vocabulary entry: ▸/▾ stay toggle/nav glyphs.
  expect(GLYPHS.selected).toBe('❯')
  expect(GLYPHS.selected).not.toBe(GLYPHS.toggle.open)
  expect(GLYPHS.selected).not.toBe(GLYPHS.toggle.shut)
  expect(GLYPHS.selected).not.toBe(GLYPHS.nav.next)
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

// --- NPL extension: pump tags, Trinity markers, markdown digests ---

test('detector matches npl pump tags and the Trinity markers', async () => {
  expect(looksLikeSemText('<npl-mindread>weave</npl-mindread>')).toBe(true)
  expect(looksLikeSemText('body <npl-hormones tone="calm"/> tail')).toBe(true)
  expect(looksLikeSemText('<WEDGE>')).toBe(true)
  expect(looksLikeSemText('<SHADOW>')).toBe(true)
  expect(looksLikeSemText('<CRITIC>')).toBe(true)
  expect(looksLikeSemText('<WEEGO>')).toBe(true)
  // Plain HTML and near-miss names stay undetected.
  expect(looksLikeSemText('<div>plain</div>')).toBe(false)
  expect(looksLikeSemText('<wedgefoo>')).toBe(false)
  expect(looksLikeSemText('<npl->')).toBe(false)
})

test('parser treats npl elements like sem elements (lowercased, warn-matched)', async () => {
  const parsed = parseSemText('Intro.\n<npl-intent from="Loom">weave the thread</npl-intent>\n')!
  expect(parsed.elementCount).toBe(1)
  expect(parsed.roots[0]!.tag).toBe('npl-intent')
  expect(parsed.roots[0]!.attrs['from']).toBe('Loom')
  expect(parsed.roots[0]!.text).toBe('weave the thread')
  expect(parsed.unknownElements).toEqual([])
  const marked = parseSemText('<WEDGE>friction</WEDGE>')!
  expect(marked.roots[0]!.tag).toBe('wedge')
  expect(marked.unknownElements).toEqual([])
})

test('RENDERERS routes the npl vocabulary to one shared block renderer', async () => {
  const tags = [
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
  ]
  const expected: Record<string, string> = {
    mindread: GLYPHS.npl.mindread,
    thought: GLYPHS.npl.thought,
    block: GLYPHS.npl.block,
    ref: GLYPHS.npl.ref,
    hormones: GLYPHS.npl.hormones,
    intent: GLYPHS.npl.intent,
    wedge: GLYPHS.npl.wedge,
    shadow: GLYPHS.npl.shadow,
    critic: GLYPHS.npl.critic,
    weego: GLYPHS.npl.weego,
  }
  const renderer = RENDERERS['npl-mindread']!
  for (const tag of tags) {
    expect(RENDERERS[tag]).toBe(renderer)
    const key = tag.startsWith('npl-') ? tag.slice(4) : tag
    const node = { tag, attrs: {}, line: 1, children: [] } as SemTextNode
    expect(glyphOf(node)).toBe(expected[key])
  }
  expect(RENDERERS['*']).not.toBe(renderer)
})

const NPL_BODY: SemTextNode = {
  tag: 'npl-hormones',
  attrs: { tone: 'steady' },
  line: 1,
  children: [],
  text: 'baseline steady, spike on friction',
}

test('npl blocks render expanded by default; explicit hides and collapsed attrs win', async () => {
  const renderer = RENDERERS['npl-hormones']!
  const base = {
    el: { Box: 'Box', Text: 'Text', Button: 'Button' } as unknown as PaneElements,
    width: 48,
    wkey: '0.0',
    budget: 24,
    showBody: true,
  }
  // Default viewer (no expanded overrides): the framed body draws, not the
  // one-row collapsed toggle.
  const open: RenderCtx = {
    ...base,
    viewer: { ...INITIAL_VIEWER },
    spent: { rows: 0 },
    press: () => {},
  }
  expect(renderer(NPL_BODY, open)).not.toBeNull()
  // Frame top + wrapped body rows + bottom, plus the hide button row.
  expect(open.spent.rows).toBeGreaterThan(2)

  // An explicit hide toggle (expanded[key] === false) collapses to one row.
  const shut: RenderCtx = {
    ...base,
    viewer: { ...INITIAL_VIEWER, expanded: { '0.0': false } },
    spent: { rows: 0 },
    press: () => {},
  }
  expect(renderer(NPL_BODY, shut)).not.toBeNull()
  expect(shut.spent.rows).toBe(1) // one toggle row

  // An authored `collapsed` attribute keeps the card shut by default.
  const collapsed: RenderCtx = {
    ...base,
    viewer: { ...INITIAL_VIEWER },
    spent: { rows: 0 },
    press: () => {},
  }
  expect(
    renderer({ ...NPL_BODY, attrs: { tone: 'steady', collapsed: '' } }, collapsed),
  ).not.toBeNull()
  expect(collapsed.spent.rows).toBe(1)
})

test('annotateNplMarkdown digests the meta-review, mind-read and table forms', async () => {
  const review = 'Answer.\n```meta-review\nscore 82\n```\n'
  expect(annotateNplMarkdown(review)).toBe(
    'Answer.\n> NPL · meta-review\n```meta-review\nscore 82\n```\n',
  )
  // Mermaid (and any other fence language) stays untouched.
  const mermaid = '```mermaid\ngraph TD; A-->B;\n```\n'
  expect(annotateNplMarkdown(mermaid)).toBe(mermaid)
  // A code block opening with the MIND_READING header gains the mind-read digest.
  const mind = '```ts\n// MIND_READING MODULE\nconst x = 1\n```\n'
  expect(annotateNplMarkdown(mind).startsWith('> NPL · mind-read\n```ts')).toBe(true)
  // The assumption-table header is digested outside fences only.
  const table = '| Open Questions |\n| --- |\n| Q1 |\n'
  expect(
    annotateNplMarkdown(table).startsWith('> NPL · assumptions table\n| Open Questions |'),
  ).toBe(true)
  const fencedTable = '```\n| Open Questions |\n```\n'
  expect(annotateNplMarkdown(fencedTable)).toBe(fencedTable)
  // Nothing qualifies -> byte-identical passthrough.
  expect(annotateNplMarkdown('plain text\n')).toBe('plain text\n')
})

// --- v0.4: the expanded document view (default) ---

const EXPANDED_FIXTURE = `<sem-doc>
<sem-tldr>Short summary</sem-tldr>
<sem-section title="Deep dive">
  <h2>Recap</h2>
  <p>Recap prose.</p>
  <sem-note collapsed>Careful note body</sem-note>
  <sem-unknown-widget id="w1">unrendered body</sem-unknown-widget>
</sem-section>
</sem-doc>`

const FAKE_EL = { Box: 'Box', Text: 'Text', Button: 'Button' } as unknown as PaneElements

test('the viewer defaults to the expanded document view', async () => {
  expect(INITIAL_VIEWER.mode).toBe('expanded')
  expect(INITIAL_VIEWER.outlineMode).toBe('expanded')
  expect(INITIAL_VIEWER.expanded).toEqual({})
  // A fresh-source reset copies INITIAL_VIEWER, so new documents open expanded.
  expect({ ...INITIAL_VIEWER }.mode).toBe('expanded')
})

test('notes default open; cardKeys and setAllExpanded drive expand/collapse all', async () => {
  const tree = parseSemText(
    '<sem-doc>' +
      '<sem-note collapsed>note body here</sem-note>' +
      '<sem-reveal collapsed>hidden reveal</sem-reveal>' +
      '<npl-block>framed body</npl-block>' +
      '<sem-section><sem-note kind="warning">nested note</sem-note></sem-section>' +
      '</sem-doc>',
  )!.roots
  const keys = cardKeys(tree)
  expect(keys).toEqual(['0.0', '0.1', '0.2', '0.3', '0.3.0'])

  // The note card renderer draws the body with the default viewer (open):
  // framed body rows inside the card frame, not the one-row toggle.
  const renderer = RENDERERS['sem-note']!
  const ctx: RenderCtx = {
    el: FAKE_EL,
    viewer: { ...INITIAL_VIEWER },
    width: 48,
    inset: 0,
    wkey: '0.0',
    budget: 24,
    showBody: false,
    spent: { rows: 0 },
    press: () => {},
  }
  expect(renderer(nodeAt(tree, '0.0')!, ctx)).not.toBeNull()
  expect(ctx.spent.rows).toBeGreaterThan(1)

  // Collapse-all marks every card shut; expand-all opens them again.
  const shutAll = setAllExpanded({ ...INITIAL_VIEWER }, keys, false)
  expect(keys.every(key => shutAll.expanded[key] === false)).toBe(true)
  const openAll = setAllExpanded(shutAll, keys, true)
  expect(keys.every(key => openAll.expanded[key] === true)).toBe(true)
  // Non-card keys are untouched.
  expect(shutAll.expanded['0']).toBeUndefined()
})

test('expandedPlan collapses cards: tldr/section cards consume their children', async () => {
  const tree = parseSemText(EXPANDED_FIXTURE)!.roots
  // Plan the doc's content (sem-doc itself is a flow container).
  const plan = expandedPlan(tree[0]!.children)
  // Cards: tldr + section are card units — the note and the unknown widget
  // draw INSIDE the section's frame, so no rows plan for them at all.
  const cards = plan.filter(unit => unit.role === 'card')
  expect(cards.map(unit => unit.node.tag)).toEqual(['sem-tldr', 'sem-section'])
  expect(plan.every(unit => unit.role === 'card')).toBe(true)

  // The section card renders its whole subtree: shut is the one header line;
  // open draws blocks, the nested note card and the unknown tag inside.
  const node = nodeAt(tree, '0.1')!
  const shut: RenderCtx = {
    el: FAKE_EL,
    viewer: { ...INITIAL_VIEWER, expanded: { '0.1': false } },
    width: 48,
    inset: 0,
    wkey: '0.1',
    budget: 40,
    showBody: false,
    spent: { rows: 0 },
    press: () => {},
  }
  expect(RENDERERS['sem-section']!(node, shut)).not.toBeNull()
  expect(shut.spent.rows).toBe(1)
  const open: RenderCtx = { ...shut, viewer: { ...INITIAL_VIEWER }, spent: { rows: 0 } }
  RENDERERS['sem-section']!(node, open)
  expect(open.spent.rows).toBeGreaterThan(4)
})

test('expandedRoleOf dispatches flow/card per renderer and capture', async () => {
  const tree = parseSemText(EXPANDED_FIXTURE)!.roots
  const doc = tree[0]!
  expect(expandedRoleOf(doc)).toBe('flow') // unknown generic container
  expect(expandedRoleOf(doc.children[0]!)).toBe('card') // sem-tldr — framed card
  expect(expandedRoleOf(doc.children[1]!)).toBe('card') // sem-section — framed card
  expect(expandedRoleOf(nodeAt(tree, '0.1.0')!)).toBe('card') // captured sem-note
  expect(expandedRoleOf(nodeAt(tree, '0.1.1')!)).toBe('flow') // unknown widget
  // Procedure and npl families are always cards; v0.6: plain notes capture
  // their body and are cards too.
  const proc = parseSemText('<sem-procedure><sem-step>one</sem-step></sem-procedure>')!.roots[0]!
  expect(expandedRoleOf(proc)).toBe('card')
  const npl = parseSemText('<npl-intent>weave</npl-intent>')!.roots[0]!
  expect(expandedRoleOf(npl)).toBe('card')
  const plainNote =
    parseSemText('<sem-section><sem-note>real</sem-note></sem-section>')!.roots[0]!.children[0]!
  expect(plainNote.content?.kind).toBe('note') // captures without `collapsed`
  expect(expandedRoleOf(plainNote)).toBe('card')
})

// --- v0.5: Trinity friction sections — unclosed markers stay flat siblings ---

/**
 * A realistic Trinity-style response: Orientation (mindread + mermaid fence),
 * four unclosed markdown-escaped friction markers, then the answer body.
 * This is the exact shape that used to swallow SHADOW/CRITIC/WEEGO inside
 * the WEDGE card.
 */
const TRINITY_ANSWER = [
  '<npl-mindread>User sees only the wedge card</npl-mindread>',
  '',
  '<sem-code lang="mermaid">graph TD; A[Answer]-->B[User];</sem-code>',
  '',
  '\\<WEDGE\\> The premise that only wedge is broken may hide a parse-order bug.',
  '',
  '\\<SHADOW\\> The v0.4 plan walker dropped card children silently once already.',
  '',
  '\\<CRITIC\\> Frankfurt check: the repro above tracks the report, not the tree.',
  '',
  '\\<WEEGO\\> Other panes share this walker; fix at the plan layer, not the renderer.',
].join('\n')

test('unclosed friction markers stay flat siblings, each with its own card', async () => {
  const parsed = parseSemText(TRINITY_ANSWER)!
  // mindread (properly closed), the mermaid code element, and the four
  // unclosed markers — all roots.
  expect(parsed.roots.map(root => root.tag)).toEqual([
    'npl-mindread', 'sem-code', 'wedge', 'shadow', 'critic', 'weego',
  ])
  // Each marker carries its own body text — nothing swallowed.
  for (const tag of ['wedge', 'shadow', 'critic', 'weego']) {
    const node = parsed.roots.find(root => root.tag === tag)!
    expect(node.children.length).toBe(0)
    expect(node.text).toContain(tag === 'wedge' ? 'parse-order bug' : '')
    expect((node.text ?? '').length).toBeGreaterThan(10)
  }
  expect(parsed.unknownElements).toEqual([])

  // Expanded plan: every marker gets its own row + card (the bug showed only
  // the wedge card because the others had nested inside it and been consumed).
  const plan = expandedPlan(parsed.roots)
  for (const tag of ['wedge', 'shadow', 'critic', 'weego']) {
    const card = plan.find(unit => unit.role === 'card' && unit.node.tag === tag)
    expect(card !== undefined).toBe(true)
  }
  // The plan walker does not emit duplicate rows for consumed children.
  const cardNodes = plan.filter(unit => unit.role === 'card')
  expect(cardNodes.length).toBe(6) // mindread + code + 4 markers
})

test('implied end rules: friction closes friction, same-name closes same-name, sem-section nests', async () => {
  // Same-name NPL: the second intent is a sibling, not a child.
  const same = parseSemText('<npl-intent>one<npl-intent>two</npl-intent>')!
  expect(same.roots.map(root => root.tag)).toEqual(['npl-intent', 'npl-intent'])
  // Friction marker closes an open friction marker (mixed names).
  const mixed = parseSemText('<wedge>a<shadow>b</shadow>')!
  expect(mixed.roots.map(root => root.tag)).toEqual(['wedge', 'shadow'])
  // Same-name sem-* nesting stays legal (nested sem-section is real markup).
  const nested = parseSemText('<sem-section>a<sem-section>b</sem-section>')!
  expect(nested.roots.length).toBe(1)
  expect(nested.roots[0]!.children.length).toBe(1)
  // An npl child inside a marker is NOT closed away by a non-friction sibling.
  const inline = parseSemText('<wedge>a <npl-ref>cite</npl-ref> b</wedge>')!
  expect(inline.roots.length).toBe(1)
  expect(inline.roots[0]!.children[0]!.tag).toBe('npl-ref')
})

test('unclosed sem-note/sem-step/sem-fact siblings close their own name', async () => {
  // Back-to-back unclosed notes: flat siblings, each keeping its own text.
  const notes = parseSemText('<sem-note>one<sem-note>two')!
  expect(notes.roots.map(root => root.tag)).toEqual(['sem-note', 'sem-note'])
  expect(notes.roots[0]!.text).toBe('one')
  expect(notes.roots[1]!.text).toBe('two')
  // Each note gets its own card unit — none swallowed into a sibling.
  const noteCards = expandedPlan(notes.roots).filter(unit => unit.role === 'card')
  expect(noteCards.map(unit => unit.node.tag)).toEqual(['sem-note', 'sem-note'])
  expect(noteCards.map(unit => unit.key)).toEqual(['0', '1'])

  // Unclosed steps inside a procedure stay sibling steps (leaf role intact).
  const steps = parseSemText('<sem-procedure title="t"><sem-step>a<sem-step>b<sem-step>c')!
  expect(steps.roots[0]!.tag).toBe('sem-procedure')
  expect(steps.roots[0]!.children.map(child => child.tag)).toEqual([
    'sem-step', 'sem-step', 'sem-step',
  ])

  // Facts likewise, closed only by their container's end tag.
  const facts = parseSemText('<sem-facts><sem-fact>a<sem-fact>b</sem-facts>')!
  expect(facts.roots[0]!.children.map(child => child.tag)).toEqual(['sem-fact', 'sem-fact'])

  // Sibling notes inside a section — the same-name rule applies at depth too.
  const inside = parseSemText('<sem-section>a<sem-note>x<sem-note>y</sem-section>')!
  expect(inside.roots[0]!.children.map(child => child.tag)).toEqual(['sem-note', 'sem-note'])
  expect(inside.roots[0]!.children[0]!.text).toBe('x')
  expect(inside.roots[0]!.children[1]!.text).toBe('y')

  // Other sem-* names keep same-name nesting, and a properly closed note is
  // unaffected: the flat rule is exactly sem-note/sem-step/sem-fact.
  const nested = parseSemText('<sem-section>a<sem-section>b</sem-section>')!
  expect(nested.roots.length).toBe(1)
  expect(nested.roots[0]!.children.length).toBe(1)
  const proper = parseSemText('<sem-section><sem-note>a</sem-note></sem-section>')!
  expect(proper.roots[0]!.children[0]!.text).toBe('a')
})

test('npl card children draw inside the frame; the plan consumes card children', async () => {
  const parsed = parseSemText(
    '<npl-block>outer prose<npl-thought>inner thought</npl-thought></npl-block>',
  )!
  const block = parsed.roots[0]!
  // Body excludes the child's text (never drawn twice).
  expect(block.text).toBe('outer prose')
  expect(block.children[0]!.text).toBe('inner thought')
  // Plan: ONE card unit — the child draws nested inside the parent's frame,
  // not as sibling rows below it.
  const plan = expandedPlan(parsed.roots)
  expect(plan).toHaveLength(1)
  if (plan[0]!.role !== 'card') return
  expect(plan[0]!.node.tag).toBe('npl-block')
  // Rendering proves it: shut = the single header line; open = body rows
  // PLUS the nested child card (header, borders, rows).
  const shut: RenderCtx = {
    el: FAKE_EL,
    viewer: { ...INITIAL_VIEWER, expanded: { '0': false } },
    width: 48,
    inset: 0,
    wkey: '0',
    budget: 40,
    showBody: false,
    spent: { rows: 0 },
    press: () => {},
  }
  expect(RENDERERS['npl-block']!(block, shut)).not.toBeNull()
  expect(shut.spent.rows).toBe(1)
  const open: RenderCtx = { ...shut, viewer: { ...INITIAL_VIEWER }, spent: { rows: 0 } }
  RENDERERS['npl-block']!(block, open)
  expect(open.spent.rows).toBeGreaterThanOrEqual(5) // parent header+body+bottom, child header+...
})

test('markdown-escaped tag markers leave no stray backslashes in captured text', async () => {
  const parsed = parseSemText('\\<WEDGE\\>body here\\<SHADOW\\>more')!
  const wedge = parsed.roots[0]!
  expect(wedge.text).not.toContain('\\')
  expect(wedge.text).toContain('body here')
})

// --- v0.6: card UX — box-model nesting, boxed prose, heading rules ---

test('cardFrameLines draws the open frame; shut collapses to the header line', async () => {
  const open = cardFrameLines(34, 0, { badge: '▲ WEDGE', open: true, bodyLines: ['one', 'two'] })
  expect(open).toHaveLength(4) // top + two body rows + bottom
  expect(open[0]!.startsWith('┌ ▾ ▲ WEDGE')).toBe(true)
  expect(open[0]!.endsWith('┐')).toBe(true)
  expect(open[1]).toBe(`│ one${' '.repeat(27)} │`)
  expect(open[3]).toBe(`└${'─'.repeat(32)}┘`)
  // inset shifts every line — nested cards sit inside the parent frame.
  const nested = cardFrameLines(34, 2, { badge: '◆ note', open: true, bodyLines: [] })
  expect(nested[0]!.startsWith('  ┌ ▾ ◆ note')).toBe(true)
  // shut with hint: the single header line carries the size hint.
  const shut = cardFrameLines(30, 0, { badge: '▲ WEDGE', open: false, hint: '3 lines' })
  expect(shut).toHaveLength(1)
  expect(shut[0]!.startsWith('┌ ▸ ▲ WEDGE · 3 lines')).toBe(true)
  // narrow fallback: left rule only, no right border, no bottom.
  const narrow = cardFrameLines(20, 0, { badge: '▲ WEDGE', open: true, bodyLines: ['row'] })
  expect(narrow[1]).toBe('│ row')
  expect(narrow.some(line => line.includes('└'))).toBe(false)
  expect(narrow.some(line => line.includes('┐'))).toBe(false)
  // plain prose box: labelled frame, no toggle glyph.
  const plain = cardFrameLines(30, 0, { badge: '◆ prose', open: false, toggle: false })
  expect(plain).toHaveLength(1)
  expect(plain[0]!.startsWith('┌ ◆ prose')).toBe(true)
  expect(plain[0]!.endsWith('┐')).toBe(true)
})

test('proseLines splits br/newlines, collapses blanks, wraps, and marks the cap', async () => {
  // <br> variants and literal newlines split; consecutive blanks collapse.
  expect(proseLines('a<br/>b<br />c\n\nd', 20, 10)).toEqual(['a', 'b', 'c', '', 'd'])
  // leading/trailing blank rows are dropped.
  expect(proseLines('\n\nx\n\n', 20, 10)).toEqual(['x'])
  // firstPrefix rides row one; the wrap width reserves its columns.
  const prefixed = proseLines('one two three four', 12, 10, '## ')
  expect(prefixed[0]).toBe('## one two')
  expect(prefixed.every(row => cpLen(row) <= 12)).toBe(true)
  // over-budget: the last drawn row ends with the ellipsis glyph.
  const capped = proseLines('a<br/>b<br/>c<br/>d<br/>e', 20, 3)
  expect(capped).toHaveLength(3)
  expect(capped[2]!.endsWith(GLYPHS.more)).toBe(true)
})

test('capture cap leaves a visible `… (+N chars)` hint on the node', async () => {
  const block = parseSemText(`<npl-block>${'x'.repeat(6000)}</npl-block>`)!.roots[0]!
  expect(block.truncated).toBeGreaterThan(0)
  expect(truncationHint(block)).toBe(`${GLYPHS.more} (+${block.truncated} chars)`)
  // a fitting body carries no hint.
  const small = parseSemText('<npl-block>tiny</npl-block>')!.roots[0]!
  expect(truncationHint(small)).toBe('')
})

test('headings draw bold with rules per level; rules follow the longest wrapped row', async () => {
  expect(headingStyle(1)).toEqual({ bold: true, dim: false, ruleChar: '═', ruleUnderText: false })
  const h1 = headingBlock('Title', 30, 1)
  expect(h1.text).toEqual(['Title'])
  expect(h1.rule).toBe('═'.repeat(30))
  expect(headingBlock('Sub', 24, 2).rule).toBe('─'.repeat(24))
  expect(headingBlock('Small', 24, 3).rule).toBe('┄'.repeat(cpLen('Small')))
  const h4 = headingBlock('Tiny', 24, 4)
  expect(h4.rule).toBe(null)
  expect(h4.style.bold).toBe(true)
  expect(h4.style.dim).toBe(false)
  expect(headingBlock('Dim', 24, 5).style.dim).toBe(true)
  // wrapped heading: the h3 rule matches the longest wrapped row.
  const wrapped = headingBlock('one two three four five six seven eight', 10, 3)
  expect(wrapped.text.length).toBeGreaterThan(1)
  const longest = Math.max(...wrapped.text.map(cpLen))
  expect(wrapped.rule).toBe('┄'.repeat(longest))
  // emoji-aware width: the emoji counts as one unit.
  expect(headingBlock('🚀 Ship', 24, 3).rule).toBe('┄'.repeat(cpLen('🚀 Ship')))
})

test('blockRows tag styles; blocksRows blanks above headings but never first', async () => {
  const rows = blockRows({ kind: 'heading', level: 2, text: 'Head' }, 20, 10)
  expect(rows[0]).toEqual({ text: 'Head', bold: true, dim: false })
  expect(rows[1]!.text).toBe('─'.repeat(20))
  const quote = blockRows({ kind: 'quote', text: 'care' }, 20, 10)
  expect(quote[0]!.dim).toBe(true)
  expect(quote[0]!.text.startsWith(`${GLYPHS.quote} `)).toBe(true)
  const set = blocksRows(
    [
      { kind: 'text', text: 'intro' },
      { kind: 'heading', level: 2, text: 'Next' },
    ],
    20,
    10,
  )
  expect(set).toEqual([
    { text: 'intro' },
    { text: '' },
    { text: 'Next', bold: true, dim: false },
    { text: '─'.repeat(20) },
  ])
  // a heading leading the set gets no blank above it.
  const first = blocksRows([{ kind: 'heading', level: 1, text: 'Top' }], 12, 10)
  expect(first[0]).toEqual({ text: 'Top', bold: true, dim: false })
  expect(first[1]!.text).toBe('═'.repeat(12))
})

test('lineCount drives shut-card hints across br and newlines', async () => {
  expect(lineCount('a<br/>b<br>c')).toBe(3)
  expect(lineCount('one two three')).toBe(1)
  expect(lineCount('\n\n x \n\n y \n')).toBe(2)
  expect(lineCount('')).toBe(0)
})

test('flow text rows indent two spaces per depth; no tree gutters in the body view', async () => {
  const tree = parseSemText(
    '<sem-doc><sem-weird-box><sem-weird-leaf>deep text</sem-weird-leaf></sem-weird-box></sem-doc>',
  )!.roots
  const plan = expandedPlan(tree[0]!.children)
  const leaf = plan.find(unit => unit.role === 'text')
  expect(leaf?.text).toBe('deep text')
  expect(leaf?.indent).toBe('    ') // depth 2 × 2
  // rows carry no ├──/└── prefixes in the streamlined view.
  expect(plan.filter(unit => unit.role === 'row').map(unit => unit.row.prefix)).toEqual(['', ''])
})

test('escaped quotes collapse cleanly in captured prose', async () => {
  const parsed = parseSemText('\\<SHADOW\\>said \\"hi\\" twice')!
  const shadow = parsed.roots[0]!
  expect(shadow.text).not.toContain('\\')
  expect(shadow.text).toContain('said "hi" twice')
})

test('tableCells drops markdown delimiter rows', async () => {
  const cells = tableCells(['| h1 | h2 |', '| --- | :---: |', '| a | b |'])
  expect(cells).toEqual([['h1', 'h2'], ['a', 'b']])
  // Non-delimiter content rows never dropped.
  expect(tableCells(['plain line'])).toEqual([['plain line']])
})

test('full spec NPL vocabulary maps to glyphs and the shared block renderer', async () => {
  const specTags = [
    'npl-agent', 'npl-artifact', 'npl-block', 'npl-cot', 'npl-critique',
    'npl-declaration', 'npl-directive', 'npl-example', 'npl-flag', 'npl-flags',
    'npl-mode', 'npl-mood', 'npl-poa', 'npl-rubric', 'npl-section', 'npl-vos',
  ]
  const renderer = RENDERERS['npl-mindread']!
  for (const tag of specTags) {
    expect(RENDERERS[tag]).toBe(renderer)
    const parsed = parseSemText(`<${tag}>x</${tag}>`)!
    expect(parsed.unknownElements).toEqual([])
    expect(glyphOf(parsed.roots[0]!)).not.toBe(GLYPHS.kind.misc)
  }
})

test('sem-note warning glyph honors the spec variant spelling', async () => {
  const parsed = parseSemText('<sem-note variant="warning">hot</sem-note>')!
  expect(glyphOf(parsed.roots[0]!)).toBe(GLYPHS.kind.warning)
})

// --- v0.6 verify-the-thing: real fixtures through the card render pipeline ---

/**
 * Draws a whole document the way the expanded view does (expandedPlan ->
 * render registry under one budget) and returns the JSON of the produced
 * elements — every visible string the pane would draw is in there, so the
 * assertions check what the user actually sees, not helper internals.
 */
const drawJSON = (
  roots: readonly SemTextNode[],
  viewer: SemTextViewer = { ...INITIAL_VIEWER },
  width = 80,
  budget = 600,
): string => {
  const ectx: RenderCtx = {
    el: FAKE_EL,
    viewer,
    width,
    inset: 0,
    wkey: '',
    budget,
    spent: { rows: 0 },
    showBody: false,
    press: () => {},
  }
  const out: unknown[] = []
  for (const unit of expandedPlan(roots)) {
    if (unit.role === 'row') {
      out.push(`${unit.row.prefix}${unit.row.glyph} ${unit.row.label}`)
      continue
    }
    if (unit.role === 'text') {
      out.push(`${unit.indent}${unit.text}`)
      continue
    }
    const render = RENDERERS[unit.node.tag] ?? RENDERERS['*']!
    out.push(render(unit.node, { ...ectx, wkey: unit.key, showBody: false }))
  }
  return JSON.stringify(out)
}

test('fixture: Trinity answer — framed cards with header toggles, zero hide rows, headings with rules', async () => {
  const tree = parseSemText(TRINITY_ANSWER)!.roots
  const json = drawJSON(tree)
  // Every friction marker is its own open framed card (header = the toggle).
  expect(json).toContain('▲ WEDGE')
  expect(json).toContain('▼ SHADOW')
  expect(json).toContain('✕ CRITIC')
  expect(json).toContain('◎ WEEGO')
  expect(json).toContain('┌ ▾ ▲ WEDGE')
  // No standalone hide rows anywhere — the header IS the toggle. (The old
  // hide button read `▸ hide`; prose may legitimately contain the word.)
  expect(json.includes('▸ hide')).toBe(false)
  // The mermaid code element draws as a framed card, verbatim inside its
  // frame (markdown fences themselves are a parser gap — see the fixture
  // note above; the pane's code elements are sem-code).
  expect(json).toContain('⌨ mermaid')
  expect(json).toContain('graph TD')
  // mindread card body is visible inline, and the last marker's body too —
  // nothing after the final unclosed marker is required for this fixture.
  expect(json).toContain('User sees only the wedge card')
  expect(json).toContain('plan layer')
})

test('fixture: quiz and flashcards are inline visible in the main view', async () => {
  const doc =
    '<sem-doc>' +
    '<sem-facts data-view-as="quiz" data-sem-seed="7">' +
    '<sem-fact>What is A?<sem-conclusion>Alpha</sem-conclusion><sem-distractor>Delta</sem-distractor></sem-fact>' +
    '<sem-fact>What is B?<sem-conclusion>Beta</sem-conclusion></sem-fact>' +
    '</sem-facts>' +
    '<sem-facts data-view-as="flashcards">' +
    '<sem-fact>Card one<sem-conclusion>Answer one</sem-conclusion></sem-fact>' +
    '</sem-facts>' +
    '</sem-doc>'
  const json = drawJSON(parseSemText(doc)!.roots)
  expect(json).toContain('❓ quiz · 2 items')
  expect(json).toContain('run quiz')
  expect(json).toContain('🃏 flashcards · 1 items')
  expect(json).toContain('run flashcards')
})

test('fixture: nested cards draw inside the parent frame with 2-col insets and rules', async () => {
  const doc =
    '<sem-doc>' +
    '<sem-section title="Deep dive">' +
    '<h2>Recap</h2>' +
    '<p>Recap prose.</p>' +
    '<sem-note>line one<br/>line two</sem-note>' +
    '<npl-block>outer<npl-thought collapsed>inner thought body</npl-thought></npl-block>' +
    '</sem-section>' +
    '</sem-doc>'
  const json = drawJSON(parseSemText(doc)!.roots)
  // Section card: header carries the title (bold heading placement, no
  // duplicate heading row inside).
  expect(json).toContain('┌ ▾ § sem-section — Deep dive')
  // The nested note card is drawn with a 2-column inset inside the section.
  expect(json).toContain('  ┌ ▾ 📌 note')
  // Boxed prose inside the note: `<br>` variants split into frame rows.
  expect(json).toContain('│ line one')
  expect(json).toContain('│ line two')
  // The h2 heading inside the section draws with its full-width rule.
  expect(json).toContain('──────')
  // The collapsed npl-thought nested two levels in shows its shut header with
  // a size hint and 4-column inset (2 per depth) — without echoing `collapsed=`.
  expect(json).toContain('    ┌ ▸ ◇ npl-thought')
  // The section body prose is boxed too — no free-floating rows.
  expect(json).toContain('│ Recap prose.')
})

test('fixture: code stays verbatim; oversized bodies keep a visible +N chars hint', async () => {
  const doc =
    '<sem-doc>' +
    '<sem-code lang="bash">$ docker ps\nCONTAINER ID   IMAGE                 STATUS</sem-code>' +
    `<npl-block>${'x'.repeat(5000)}</npl-block>` +
    '</sem-doc>'
  const json = drawJSON(parseSemText(doc)!.roots)
  // Code lines keep their column layout — no word reflow inside the frame.
  expect(json).toContain('$ docker ps')
  expect(json).toContain('CONTAINER ID')
  // Capture-cap: 5000 chars against the 4000 cap leaves an explicit hint.
  expect(json).toContain('… (+1000 chars)')
})

test('fixture: collapse-all state shuts every card to its single header line', async () => {
  const doc =
    '<sem-doc>' +
    '<sem-section title="S"><sem-note>note body</sem-note><npl-block>block body</npl-block></sem-section>' +
    '</sem-doc>'
  const tree = parseSemText(doc)!.roots
  const keys = cardKeys(tree)
  const shut = setAllExpanded({ ...INITIAL_VIEWER }, keys, false)
  // A shut section collapses its whole subtree — only the header line remains.
  const sectionJSON = drawJSON(tree, shut)
  expect(sectionJSON).toContain('┌ ▸ § sem-section — S')
  expect(sectionJSON.includes('note body')).toBe(false)
  expect(sectionJSON.includes('block body')).toBe(false)
  // The section's children drawn standalone (keys are document-relative, so
  // the shut state is rebuilt over their own card keys): one header line
  // each, with size hints — no frame bodies, no bottom borders.
  const children = tree[0]!.children[0]!.children
  const childShut = setAllExpanded({ ...INITIAL_VIEWER }, cardKeys(children), false)
  const json = drawJSON(children, childShut)
  expect(json).toContain('┌ ▸ 📌 note ·')
  expect(json).toContain('┌ ▸ ▣ npl-block')
  expect(json.includes('│ note body')).toBe(false)
  expect(json.includes('│ block body')).toBe(false)
})

// --- v0.6.1 lists (amendment 8): bullets, ordered labels, tasks, dl, nested
// items, procedure steps through sub-groups ---

test('lists capture as blocks: bullets by depth, no double-draw of nested items', async () => {
  const doc =
    '<sem-section title="L">' +
    '<ul><li>one<ul><li>inner a<ul><li>deepest</li></ul></li><li>inner b</li></ul></li><li>two</li></ul>' +
    '</sem-section>'
  const section = parseSemText(doc)!.roots[0]!
  const blocks = section.blocks ?? []
  const kinds = blocks.map(b => (b.kind === 'list-item' ? `${b.bullet} ${b.text}` : b.kind))
  expect(kinds).toEqual([
    '• one', '◦ inner a', '▪ deepest', '◦ inner b', '• two',
  ])
  const innerA = blocks[1] as { text: string; bullet: string }
  expect(innerA.text).toBe('inner a')
  expect(innerA.bullet).toBe('◦')
  const deepest = blocks[2] as { bullet: string; text: string }
  expect(deepest.bullet).toBe('▪')
  expect(deepest.text).toBe('deepest')
})

test('ordered lists: start attr, type a/i labels, right-aligned hang', async () => {
  const doc =
    '<sem-section><ol start="3" type="a"><li>alpha</li><li>beta</li></ol>' +
    '<ol type="i"><li>roman one</li></ol><ol start="9"><li>nine</li><li>ten</li></ol></sem-section>'
  const section = parseSemText(doc)!.roots[0]!
  const labels = (section.blocks ?? []).map(
    b => (b.kind === 'list-item-ordered' ? b.label : (b as { kind: string }).kind),
  )
  expect(labels).toEqual(['c.', 'd.', 'i.', '9.', '10.'])
  // Rendering right-aligns labels in a 3-char gutter with a hanging indent.
  const rows = blockRows((section.blocks ?? [])[0]!, 24, 8)
  expect(rows[0]!.text).toBe(' c. alpha')
  const long = blockRows((section.blocks ?? [])[3]!, 24, 8)
  expect(long[0]!.text).toBe(' 9. nine')
  expect(long[1]).toBeUndefined()
  // Wrap keeps continuation rows under the text column.
  const wrapped = blockRows({ kind: 'list-item', text: 'aaa bbb ccc ddd', bullet: '•', depth: 0 }, 12, 8)
  expect(wrapped[0]!.text).toBe('• aaa bbb')
  expect(wrapped[1]!.text.startsWith('  ')).toBe(true)
})

test('task checkboxes: input type=checkbox and the task-list class both mark items', async () => {
  const doc =
    '<sem-section>' +
    '<ul><li><input type="checkbox" checked>shipped thing</li>' +
    '<li><input type="checkbox">open thing</li>' +
    '<li class="task-list-item">class task</li></ul></sem-section>'
  const blocks = parseSemText(doc)!.roots[0]!.blocks ?? []
  expect(blocks.map(b => (b.kind === 'task-item' ? (b.done ? '☑' : '☐') : b.kind))).toEqual([
    '☑', '☐', '☐',
  ])
  expect((blocks[0] as { text: string }).text).toBe('shipped thing')
  const rows = blockRows(blocks[1]!, 24, 4)
  expect(rows[0]!.text).toBe('☐ open thing')
})

test('dl: term draws bold, definition indented under it', async () => {
  const doc = '<sem-section><dl><dt>Budget</dt><dd>What it costs and why.</dd></dl></sem-section>'
  const blocks = parseSemText(doc)!.roots[0]!.blocks ?? []
  expect(blocks.map(b => b.kind)).toEqual(['term', 'definition'])
  const term = blockRows(blocks[0]!, 24, 4)
  expect(term[0]!.text).toBe('Budget')
  expect(term[0]!.bold).toBe(true)
  const def = blockRows(blocks[1]!, 24, 4)
  expect(def[0]!.text).toBe('  What it costs and why.')
})

test('procedure steps collect through nested sub-groups (was direct children only)', async () => {
  const doc =
    '<sem-procedure title="Ship"><sem-step>first</sem-step>' +
    '<sem-group><sem-step>grouped</sem-step></sem-group>' +
    '<sem-step>last</sem-step></sem-procedure>'
  const tree = parseSemText(doc)!.roots
  const json = drawJSON(tree)
  expect(json).toContain('1 → first')
  expect(json).toContain('2 → grouped')
  expect(json).toContain('3 → last')
})

test('fixture: lists, dl and tasks draw inside the section frame (webpage-like)', async () => {
  const doc =
    '<sem-doc><sem-section title="Plan">' +
    '<ul><li>outer<ul><li>inner</li></ul></li></ul>' +
    '<ol start="2"><li>second</li></ol>' +
    '<dl><dt>Scope</dt><dd>One screen, no chrome.</dd></dl>' +
    '<ul><li class="task-list-item"><input type="checkbox" checked>landed</li></ul>' +
    '</sem-doc></sem-section>'
  const json = drawJSON(parseSemText(doc)!.roots)
  expect(json).toContain('• outer')
  expect(json).toContain('◦ inner')
  expect(json).toContain('2. second')
  expect(json).toContain('Scope')
  expect(json).toContain('One screen, no chrome.')
  expect(json).toContain('☑ landed')
})
