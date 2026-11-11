// @vitest-environment happy-dom
// Unit spec — runtime/semtext-v06.js · inline sugar in sem-list items
//             and sem-table pipe-table cells
//
// Feature: item/cell text renders `code` -> <code> and **bold** -> <strong>
//          (spec/schema/sem-list.md, spec/schema/sem-table.md); everything
//          else — unclosed markers, HTML-looking text — stays literal
//   Scenario: code span and bold in a list item
//   Scenario: double-backtick span keeps an inner backtick (sem-md rule:
//             the closing run is exactly as long as the opening one)
//   Scenario: * inside a code span is not emphasised
//   Scenario: unclosed ` and ** stay literal; edge-spaced ** stays literal
//   Scenario: text that looks like HTML renders as characters, no element
//   Scenario: *text* emphasis still works inside items and cells
//   Scenario: header and body cells get the same sugar

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(resolve(repo, 'runtime/semtext-v06.js'), 'utf8');
// The layer is an IIFE with no export; run it as a <script> would. Its
// DOMContentLoaded/readyState boot is a no-op over an empty body; every
// case drives the transform explicitly via the global it defines.
new Function(src)();

function render(html) {
  document.body.innerHTML = '<sem-enhanced-document>' + html + '</sem-enhanced-document>';
  window.SemTextV06.run();
  return document.body;
}

describe('v06 inline sugar — sem-list items', () => {
  it('renders a code span and bold inside an item', () => {
    const li = render('<sem-list>\n- run `npm ci` **now**\n</sem-list>').querySelector('li');
    expect(li.innerHTML).toBe('run <code>npm ci</code> <strong>now</strong>');
  });

  it('treats a longer backtick run as the closer and keeps inner backticks literal', () => {
    const li = render('<sem-list>\n- use ``a` b`` here\n</sem-list>').querySelector('li');
    expect(li.querySelectorAll('code')).toHaveLength(1);
    expect(li.querySelector('code').textContent).toBe('a` b');
    expect(li.innerHTML).toBe('use <code>a` b</code> here');
  });

  it('does not emphasise asterisks inside a code span', () => {
    const li = render('<sem-list>\n- run `a*b*c` now\n</sem-list>').querySelector('li');
    expect(li.querySelector('code').textContent).toBe('a*b*c');
    expect(li.querySelector('em')).toBeNull();
    expect(li.querySelector('strong')).toBeNull();
  });

  it('leaves unclosed markers literal', () => {
    const li = render('<sem-list>\n- cost `5 **today\n</sem-list>').querySelector('li');
    expect(li.textContent).toBe('cost `5 **today');
    expect(li.querySelector('code')).toBeNull();
    expect(li.querySelector('strong')).toBeNull();
    expect(li.querySelector('em')).toBeNull();
  });

  it('leaves edge-spaced ** literal (sem-md strong flanking)', () => {
    const li = render('<sem-list>\n- pad ** a ** out\n</sem-list>').querySelector('li');
    expect(li.textContent).toBe('pad ** a ** out');
    expect(li.querySelector('strong')).toBeNull();
  });

  it('keeps HTML-looking text as characters and creates no element', () => {
    const li = render('<sem-list>\n- &lt;b&gt;hi&lt;/b&gt;\n</sem-list>').querySelector('li');
    expect(li.children).toHaveLength(0);
    expect(li.textContent).toBe('<b>hi</b>');
  });

  it('still emphasises *text* inside an item', () => {
    const li = render('<sem-list>\n- the *rotating* token\n</sem-list>').querySelector('li');
    expect(li.querySelector('em')).not.toBeNull();
    expect(li.querySelector('em').textContent).toBe('rotating');
  });

  it('a plain item keeps a single text child (no regression for markerless text)', () => {
    const li = render('<sem-list>\n- httpOnly cookie\n</sem-list>').querySelector('li');
    expect(li.childNodes).toHaveLength(1);
    expect(li.textContent).toBe('httpOnly cookie');
  });
});

describe('v06 inline sugar — sem-table pipe cells', () => {
  it('renders sugar in header and body cells', () => {
    const root = render(
      '<sem-table>\n| `h` | **Head** |\n|---|---|\n| `x` | **y** |\n</sem-table>');
    const ths = root.querySelectorAll('thead th');
    const tds = root.querySelectorAll('tbody td');
    expect(ths[0].innerHTML).toBe('<code>h</code>');
    expect(ths[1].innerHTML).toBe('<strong>Head</strong>');
    expect(tds[0].innerHTML).toBe('<code>x</code>');
    expect(tds[1].innerHTML).toBe('<strong>y</strong>');
  });

  it('keeps unclosed markers literal in cells and still emphasises *text*', () => {
    const root = render(
      '<sem-table>\n| a | b |\n|---|---|\n| c `d | e *f* |\n</sem-table>');
    const tds = root.querySelectorAll('tbody td');
    expect(tds[0].textContent).toBe('c `d');
    expect(tds[0].querySelector('code')).toBeNull();
    expect(tds[1].querySelector('em')).not.toBeNull();
    expect(tds[1].querySelector('em').textContent).toBe('f');
  });
});
