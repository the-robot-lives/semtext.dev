import { test, expect } from 'claude-code/testing'
import type { RenderElement } from 'claude-code'

import { parseSemText, annotateText, looksLikeSemText } from '../hooks/register'

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
