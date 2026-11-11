// @vitest-environment happy-dom
// Unit spec — runtime/semtext-v06.js · flatCode: the sem-code inline chip
//
// Feature: a single-line flat listing with none of filename/lang/mark/
//          controls renders as an inline chip — no block chrome, no <pre>,
//          text intact (spec/schema/sem-code.md, inline chip clause)
//   Scenario: bare single-line flat listing stays inline (no chrome, no pre)
//   Scenario: authored layout newlines are trimmed from the chip
//   Scenario: block chrome an enhance pass already built is unwrapped
//   Scenario: a later enhance pass is a no-op over the marked chip
//   Scenario: multi-line flat listing is a block listing (interior
//             whitespace byte-identical)
//   Scenario: decorated flat listing (lang / filename / controls / mark)
//             is a block listing
//   Scenario: chrome an enhance built over a block candidate stays
//   Scenario: `<`-looking text stays literal in the chip

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

function mount(html) {
  document.body.innerHTML = '<sem-enhanced-document>' + html + '</sem-enhanced-document>';
  return document.body.querySelector('sem-enhanced-document');
}

function render(html) {
  const root = mount(html);
  window.SemTextV06.run();
  return root;
}

/* Mirrors the vendored reading-bundle enhance (v0.9.6): adopts flat text
   into <pre><code> with line spans, inserts chrome as first child, stamps
   data-sem-upgraded — the production DOM our layer must recover from. */
function enhanceLikeBundle(el) {
  const text = el.textContent.replace(/^[^\S\n]*\n+/, '').replace(/\s+$/, '');
  el.textContent = '';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  const span = document.createElement('span');
  span.className = 'sem-code-line';
  span.textContent = text;
  code.appendChild(span);
  pre.appendChild(code);
  el.appendChild(pre);
  const chrome = document.createElement('div');
  chrome.className = 'sem-code-chrome';
  const btn = document.createElement('button');
  btn.setAttribute('data-act', 'copy');
  btn.textContent = 'Copy';
  chrome.appendChild(btn);
  el.insertBefore(chrome, el.firstChild);
  el.setAttribute('data-sem-upgraded', '');
}

/* The vendored enhance's decision logic (idempotent on chrome; adopts flat
   text only over an element with no children; bails with no <pre>): what
   the marked chip must reduce to. */
function vendoredEnhanceWould(el) {
  if (el.querySelector(':scope > .sem-code-chrome')) return 'idempotent';
  if (!el.children.length && el.textContent.trim()) return 'adopt-block';
  if (!el.querySelector(':scope > pre')) return 'bail';
  return 'enhance-block';
}

describe('v06 flatCode — inline chip', () => {
  it('a bare single-line flat listing stays inline: no chrome, no pre, text intact', () => {
    const el = render('<sem-code>npm ci</sem-code>').querySelector('sem-code');
    expect(el.getAttribute('data-sem-v06')).toBe('inline');
    expect(el.querySelector('.sem-code-chrome')).toBeNull();
    expect(el.querySelector('pre')).toBeNull();
    expect(el.textContent).toBe('npm ci');
    expect(el.hasAttribute('data-sem-upgraded')).toBe(false);
  });

  it('interior whitespace of a chip stays byte-identical', () => {
    const el = render('<sem-code>a  b\tc</sem-code>').querySelector('sem-code');
    expect(el.getAttribute('data-sem-v06')).toBe('inline');
    expect(el.textContent).toBe('a  b\tc');
  });

  it('authored layout newlines are trimmed from the chip', () => {
    const el = render('<sem-code>\nnpm ci\n</sem-code>').querySelector('sem-code');
    expect(el.getAttribute('data-sem-v06')).toBe('inline');
    expect(el.textContent).toBe('npm ci');
  });

  it('block chrome an enhance pass already built is unwrapped back to the text', () => {
    // Production order: the bundle's enhance runs first (element upgraded
    // at parse), the v0.6 layer flattens afterwards.
    const root = mount('<sem-code>npm ci</sem-code>');
    const el = root.querySelector('sem-code');
    enhanceLikeBundle(el);
    window.SemTextV06.run();
    expect(el.getAttribute('data-sem-v06')).toBe('inline');
    expect(el.querySelector('.sem-code-chrome')).toBeNull();
    expect(el.querySelector('pre')).toBeNull();
    expect(el.querySelector('button')).toBeNull();
    expect(el.textContent).toBe('npm ci');
    // Whatever the enhance stamped stays; the chip state is the marker.
    expect(el.hasAttribute('data-sem-upgraded')).toBe(true);
  });

  it('a later enhance pass is a no-op over the marked chip', () => {
    const el = render('<sem-code>npm ci</sem-code>').querySelector('sem-code');
    // One inert element child, no <pre>: the vendored enhance has nothing
    // to adopt and nothing to enhance (deferred-bundle ordering: the Lit
    // update microtask lands after this layer's run).
    expect(el.children).toHaveLength(1);
    expect(el.querySelector('pre')).toBeNull();
    expect(vendoredEnhanceWould(el)).toBe('bail');
  });

  it('`<`-looking text stays literal: one text child, no element created', () => {
    const el = render('<sem-code>a &lt; b &amp; c</sem-code>').querySelector('sem-code');
    expect(el.getAttribute('data-sem-v06')).toBe('inline');
    expect(el.textContent).toBe('a < b & c');
    const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === 3);
    expect(textNodes).toHaveLength(1);
    expect(textNodes[0].textContent).toBe('a < b & c');
    expect(el.querySelector('b')).toBeNull();
  });
});

describe('v06 flatCode — block listings', () => {
  it('a multi-line flat listing is a block listing with interior whitespace intact', () => {
    const el = render('<sem-code>line one\n  line two indented\nline three</sem-code>')
      .querySelector('sem-code');
    expect(el.getAttribute('data-sem-v06')).toBe('block');
    const code = el.querySelector('pre > code');
    expect(code).not.toBeNull();
    expect(code.textContent).toBe('line one\n  line two indented\nline three');
  });

  it('a multi-line flat listing an enhance already blocked keeps its chrome', () => {
    const root = mount('<sem-code>one\ntwo</sem-code>');
    const el = root.querySelector('sem-code');
    enhanceLikeBundle(el);
    window.SemTextV06.run();
    expect(el.getAttribute('data-sem-v06')).toBe('block');
    expect(el.querySelector('.sem-code-chrome')).not.toBeNull();
    expect(el.querySelector('pre > code .sem-code-line').textContent).toBe('one\ntwo');
  });

  it('lang / filename / controls / mark each force the block form', () => {
    const cases = [
      '<sem-code lang="bash">npm ci</sem-code>',
      '<sem-code data-lang="bash">npm ci</sem-code>',
      '<sem-code filename="pkg.json">npm ci</sem-code>',
      '<sem-code controls="copy,wrap">npm ci</sem-code>',
      '<sem-code mark="1">npm ci</sem-code>',
    ];
    cases.forEach((html) => {
      const el = render(html).querySelector('sem-code');
      expect(el.getAttribute('data-sem-v06'), html).toBe('block');
      expect(el.querySelector('pre'), html).not.toBeNull();
    });
  });
});
