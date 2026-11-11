/**
 * SemText v0.6 extension layer — semtext.dev authoring forms.
 *
 * Appended to the vendored runtime in the consolidated
 * `semtext/latest/semtext.js` bundle (scripts/build-latest.mjs). The
 * vendored IIFE (`SemText`) is untouched; this layer defines a separate
 * global, `SemTextV06`, and upgrades the v0.6 authoring forms into the
 * real markup the rest of the runtime (and the vocabulary CSS) already
 * understands. Contracts: spec/schema/sem-list.md, sem-table.md (form B),
 * sem-code.md (flat form), sem-references.md (AUTO-ID rule),
 * conventions.md §3 (*text* sugar).
 *
 * Transforms (idempotent; each container stamped `data-sem-v06`):
 *   refIds          sem-reference auto ids  = block id (default `refs`)
 *                   + '-' + slug(cite)      (pure function, sem-references.md)
 *   flatCode        sem-code without an authored <pre>: decorated or
 *                   multi-line text wraps into <pre><code>; plain
 *                   single-line text is the inline chip (CSS chip) —
 *                   block chrome a prior enhance pass built is unwrapped
 *                   back to the flat text, and the chip state leaves a
 *                   later enhance pass nothing to do
 *   lists           sem-list markdown lines -> real <ul>/<ol>/<li>
 *                   (2-space indent = one nesting level); item text
 *                   carries inline sugar (appendInline): `code`, **bold**
 *   mdTables        sem-table pipe-table text -> real <table> (form B),
 *                   cell text through the same appendInline sugar;
 *                   an already-upgraded element is cloned and reconnected
 *                   so the Lit enhance re-runs over real rows
 *   highlightMirror <sem-highlight> gains the .sem-highlight class so the
 *                   vocabulary + occlusion handlers key on one spelling
 *   emphasis        *text* -> <em> in prose text nodes; never inside
 *                   pre/code/sem-code/sem-md/sem-source/script/style
 *
 * JS-off behaviour is the contract, not a fallback: every form reads as
 * pre-wrapped text and extracts unchanged without this file.
 */
(function () {
  'use strict';
  if (window.SemTextV06) return;

  var VERSION = '0.6';
  var MARK = 'data-sem-v06';
  var SKIP_FOR_EMPHASIS =
    'pre, code, sem-code, script, style, template, textarea, sem-md, sem-source, .sem-source-fence';

  function all(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  function scope() {
    return document.querySelector('sem-enhanced-document, .sem-enhanced-document') || document.body;
  }

  /* AUTO-ID slug (sem-references.md): lowercase, non-alphanumeric runs to
     one '-', trim leading/trailing dashes. */
  function slug(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function refIds(root) {
    all(root, 'sem-reference, .sem-reference').forEach(function (el) {
      if (el.id) return;
      var cite = el.getAttribute('cite') || el.getAttribute('data-cite') ||
        el.getAttribute('href') || el.getAttribute('data-href') || '';
      if (!cite) return;
      var block = el.closest('sem-references, .sem-references');
      var base = (block && (block.getAttribute('id') || block.getAttribute('data-id'))) || 'refs';
      var id = base + '-' + slug(cite);
      if (!document.getElementById(id)) el.id = id;
    });
  }

  /* Structural trims (sem-code.md): one leading newline directly after
     the open tag and the trailing whitespace before the close tag are
     authoring layout; interior whitespace stays byte-identical. */
  function trimListing(text) {
    return String(text).replace(/^[^\S\n]*\n+/, '').replace(/\s+$/, '');
  }

  /* The listing text regardless of enhance state. Once the reading
     bundle adopts the flat text into <pre><code>, the element's own
     textContent is chrome-polluted (control button labels), so read the
     adopted <code> instead. */
  function listingText(el) {
    var pre = el.querySelector(':scope > pre');
    if (pre) return (pre.querySelector('code') || pre).textContent || '';
    return el.textContent || '';
  }

  /* Single-line flat with none of filename/lang/mark/controls = inline
     chip (sem-code.md, inline chip clause): no chrome, no <pre>, no copy
     control — the element's own text IS the listing. The reading
     bundle's Lit upgrade routinely lands before this layer (deferred
     bundles: define() upgrades the element, our run() beats only the
     update microtask — and after it the enhance has already blocked the
     flat text), so the chip state has to cover both orders:

       - chrome already built -> unwrap it back to the flat text;
       - chrome not built yet -> leave one inert <template> child and no
         <pre>, which makes the bundle's enhance a no-op (it adopts flat
         text only over an element with no children, and bails once there
         is no <pre> to enhance).

     A <template> keeps its content in a separate fragment: no text, no
     layout, invisible to querySelector('pre') — extraction and the chip
     render are untouched, and literal `<` stays a character because the
     listing goes back as a text node, never markup. */
  function restoreInline(el) {
    var chrome = el.querySelector(':scope > .sem-code-chrome');
    var pre = el.querySelector(':scope > pre');
    var text = trimListing(pre ? listingText(el) : (el.textContent || ''));
    if (chrome) chrome.remove();
    el.textContent = '';
    el.appendChild(document.createTextNode(text));
    el.appendChild(document.createElement('template'));
  }

  function flatCode(root) {
    all(root, 'sem-code, .sem-code').forEach(function (el) {
      if (el.hasAttribute(MARK)) return;
      var decorated = ['filename', 'lang', 'mark', 'controls'].some(function (a) {
        return el.hasAttribute(a) || el.hasAttribute('data-' + a);
      });
      var text = listingText(el);
      var multiline = /\n[^\s]/.test(trimListing(text));
      if (!decorated && !multiline) {
        restoreInline(el);
        el.setAttribute(MARK, 'inline');
        return;
      }
      if (el.querySelector('pre')) { el.setAttribute(MARK, 'block'); return; }
      var pre = document.createElement('pre');
      var code = document.createElement('code');
      code.textContent = trimListing(text);
      pre.appendChild(code);
      el.textContent = '';
      el.appendChild(pre);
      el.setAttribute(MARK, 'block');
    });
  }

  /* Inline sugar shared by sem-list items and sem-table (form B) cells:
     `code` -> <code>, **bold** -> <strong>; everything else is literal
     text. Code-span rule matches sem-md (src/md/parse.ts): the closing
     backtick run must be exactly as long as the opening one, and a
     one-space pad inside the span is stripped. Strong content must be
     non-empty and free of edge spaces (same flanking rule). Nodes are
     built as DOM — never innerHTML — so literal `<` stays a character.
     Single `*text*` emphasis is left to the emphasis() pass, which
     already skips <code>. Unclosed markers stay literal. */
  function appendInline(el, text) {
    var i = 0;
    var plainStart = 0;
    function flush(end) {
      if (end > plainStart) el.appendChild(document.createTextNode(text.slice(plainStart, end)));
    }
    while (i < text.length) {
      var c = text.charAt(i);
      if (c === '`') {
        var run = 0;
        while (text.charAt(i + run) === '`') run++;
        var j = i + run;
        var closer = -1;
        while (j < text.length) {
          if (text.charAt(j) === '`') {
            var k = 0;
            while (text.charAt(j + k) === '`') k++;
            if (k === run) { closer = j; break; }
            j += k;
          } else {
            j++;
          }
        }
        if (closer !== -1) {
          flush(i);
          var codeText = text.slice(i + run, closer);
          if (codeText.length > 2 && codeText.charAt(0) === ' ' &&
            codeText.charAt(codeText.length - 1) === ' ') codeText = codeText.slice(1, -1);
          var code = document.createElement('code');
          code.textContent = codeText;
          el.appendChild(code);
          i = closer + run;
          plainStart = i;
          continue;
        }
        i += run; /* unclosed backtick run: literal */
        continue;
      }
      if (c === '*' && text.charAt(i + 1) === '*') {
        var end = text.indexOf('**', i + 2);
        if (end > i + 2 && !/^\s|\s$/.test(text.slice(i + 2, end))) {
          flush(i);
          var strong = document.createElement('strong');
          appendInline(strong, text.slice(i + 2, end));
          el.appendChild(strong);
          i = end + 2;
          plainStart = i;
          continue;
        }
        i += 2; /* unclosed / empty / edge-spaced: literal */
        continue;
      }
      i++;
    }
    flush(text.length);
  }

  /* --- sem-list: markdown-style lines -> real list --- */

  function parseListLines(text) {
    var items = [];
    var ulRe = /^[-*]\s+(.*)$/;
    var olRe = /^\d+[.)]\s+(.*)$/;
    text.split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      var indent = (line.match(/^ */) || [''])[0].length;
      var body = line.slice(indent);
      var m;
      if ((m = ulRe.exec(body))) {
        items.push({ depth: Math.floor(indent / 2), type: 'ul', text: m[1] });
      } else if ((m = olRe.exec(body))) {
        items.push({ depth: Math.floor(indent / 2), type: 'ol', text: m[1] });
      } else if (items.length) {
        items[items.length - 1].text += ' ' + body;
      } else {
        items.push({ depth: 0, type: 'ul', text: body });
      }
    });
    return items;
  }

  function buildList(items, start, forceType) {
    var type = forceType || items[start].type;
    var list = document.createElement(type);
    var i = start;
    var baseDepth = items[start].depth;
    while (i < items.length && items[i].depth >= baseDepth) {
      if (items[i].depth > baseDepth && list.lastElementChild) {
        var sub = buildList(items, i, null);
        list.lastElementChild.appendChild(sub.list);
        i = sub.next;
        continue;
      }
      var li = document.createElement('li');
      appendInline(li, items[i].text);
      list.appendChild(li);
      i++;
    }
    return { list: list, next: i };
  }

  function lists(root) {
    all(root, 'sem-list, .sem-list').forEach(function (el) {
      if (el.hasAttribute(MARK)) return;
      if (el.querySelector('ul, ol')) { el.setAttribute(MARK, 'native'); return; }
      var items = parseListLines(el.textContent);
      if (!items.length) { el.setAttribute(MARK, 'empty'); return; }
      var orderedRoot = el.hasAttribute('ordered') || el.hasAttribute('data-ordered');
      el.textContent = '';
      el.appendChild(buildList(items, 0, orderedRoot ? 'ol' : null).list);
      el.setAttribute(MARK, 'list');
    });
  }

  /* --- sem-table form B: pipe-table text -> real <table> --- */

  function splitRow(line) {
    return line.replace(/^\|/, '').replace(/\|$/, '')
      .split('|').map(function (c) { return c.trim(); });
  }

  function isDelimiter(cells) {
    return cells.length > 0 && cells.every(function (c) { return /^:?-{2,}:?$/.test(c); });
  }

  function parsePipeRows(text) {
    var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); })
      .filter(function (l) {
        return l.charAt(0) === '|' && l.indexOf('|', 1) !== -1 && l.charAt(l.length - 1) === '|';
      });
    if (lines.length < 2) return null;
    var align = null;
    var start = 0;
    if (isDelimiter(splitRow(lines[1]))) {
      align = splitRow(lines[1]).map(function (c) {
        var l = c.charAt(0) === ':';
        var r = c.charAt(c.length - 1) === ':';
        return l && r ? 'center' : l ? 'left' : r ? 'right' : '';
      });
      start = 2;
    }
    var rows = [splitRow(lines[0])];
    for (var i = start; i < lines.length; i++) rows.push(splitRow(lines[i]));
    return { rows: rows, align: align };
  }

  function buildTable(parsed, label) {
    var table = document.createElement('table');
    if (label) {
      var caption = document.createElement('caption');
      caption.textContent = label;
      table.appendChild(caption);
    }
    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    parsed.rows[0].forEach(function (cell, idx) {
      var th = document.createElement('th');
      th.setAttribute('scope', 'col');
      appendInline(th, cell);
      if (parsed.align && parsed.align[idx]) th.style.textAlign = parsed.align[idx];
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    for (var i = 1; i < parsed.rows.length; i++) {
      var tr = document.createElement('tr');
      parsed.rows[i].forEach(function (cell, idx) {
        var td = document.createElement('td');
        appendInline(td, cell);
        if (parsed.align && parsed.align[idx]) td.style.textAlign = parsed.align[idx];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function mdTables(root) {
    all(root, 'sem-table, .sem-table').forEach(function (el) {
      if (el.hasAttribute(MARK)) return;
      if (el.querySelector('table')) { el.setAttribute(MARK, 'native'); return; }
      var parsed = parsePipeRows(el.textContent);
      if (!parsed) { el.setAttribute(MARK, 'skip'); return; }
      var table = buildTable(parsed, el.getAttribute('label') || el.getAttribute('data-label'));
      if (el.hasAttribute('data-sem-upgraded')) {
        /* Lit already enhanced the (table-less) element: swap in a clone
           carrying the rendered table so connectedCallback re-runs and the
           chrome attaches to real rows. */
        var clone = el.cloneNode(false);
        clone.setAttribute(MARK, 'table');
        clone.appendChild(table);
        el.parentNode.replaceChild(clone, el);
      } else {
        el.textContent = '';
        el.insertBefore(table, el.firstChild);
        el.setAttribute(MARK, 'table');
      }
    });
  }

  /* --- sem-highlight -> .sem-highlight class mirror --- */

  function highlightMirror(root) {
    all(root, 'sem-highlight').forEach(function (el) {
      el.classList.add('sem-highlight');
    });
  }

  /* --- *text* emphasis sugar (conventions.md §3) --- */

  function emphasis(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest && parent.closest(SKIP_FOR_EMPHASIS)) return NodeFilter.FILTER_REJECT;
        if (node.nodeValue.indexOf('*') === -1) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var re = /(^|[^\\*])\*([^*\n]+)\*(?!\*)/g;
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      re.lastIndex = 0;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var last = 0;
      var m;
      while ((m = re.exec(text)) !== null) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index) + m[1]));
        var em = document.createElement('em');
        em.textContent = m[2];
        frag.appendChild(em);
        last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function runAll() {
    var root = scope();
    if (!root) return;
    refIds(root);
    flatCode(root);
    lists(root);
    mdTables(root);
    highlightMirror(root);
    emphasis(root);
  }

  function run() { runAll(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAll);
  } else {
    runAll();
  }

  window.SemTextV06 = { run: run, version: VERSION };
})();
