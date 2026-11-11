const D = /* @__PURE__ */ new Set(["0", "1", "2", "30", "31", "32", "33", "34", "35", "36", "37"]), I = "\x1B[0m", N = "\x1B[2m", j = "\x1B[36m", z = "\x1B[33m", T = "\x1B[32m", m = (n, t) => n + t + I;
function F(n) {
  let t = "", s = 0;
  const i = (e) => {
    const h = s;
    for (; s < n.length && !n.startsWith(e, s); ) s++;
    t += n.slice(h, s);
  };
  for (; s < n.length; ) {
    if (n.startsWith("<!--", s)) {
      const e = n.indexOf("-->", s), h = e === -1 ? n.length : e + 3;
      t += m(N, n.slice(s, h)), s = h;
      continue;
    }
    if (n.startsWith("<!", s)) {
      const e = n.indexOf(">", s), h = e === -1 ? n.length : e + 1;
      t += m(N, n.slice(s, h)), s = h;
      continue;
    }
    if (n[s] === "<") {
      const e = G(n, s);
      if (e === -1) {
        t += n.slice(s);
        break;
      }
      t += H(n.slice(s, e + 1)), s = e + 1;
      continue;
    }
    i("<");
  }
  return t;
}
function G(n, t) {
  let s = null;
  for (let i = t + 1; i < n.length; i++) {
    const e = n[i];
    if (s)
      e === s && (s = null);
    else if (e === '"' || e === "'") s = e;
    else if (e === ">") return i;
  }
  return -1;
}
function H(n) {
  const t = /^<\/?[A-Za-z][A-Za-z0-9-]*/.exec(n);
  if (!t) return n;
  const s = n.startsWith("</") ? 2 : 1;
  let i = n.slice(0, s) + m(j, t[0].slice(s)), e = t[0].length, h = !1;
  for (; e < n.length; ) {
    const r = n[e];
    if (r === '"' || r === "'") {
      const l = n.indexOf(r, e + 1), o = l === -1 ? n.length : l + 1;
      i += m(T, n.slice(e, o)), e = o, h = !1;
    } else if (h && /\S/.test(r) && r !== ">") {
      const l = e;
      for (; e < n.length && !/[\s>]/.test(n[e]); ) e++;
      i += m(T, n.slice(l, e));
    } else if (!h && /[A-Za-z_:@-]/.test(r)) {
      const l = e;
      for (; e < n.length && !/[\s=>]/.test(n[e]); ) e++;
      i += m(z, n.slice(l, e));
    } else
      h = r === "=", i += r, e++;
  }
  return i;
}
function U(n, t) {
  const s = t.trim().toLowerCase();
  return s !== "html" && s !== "xml" && s !== "svg" ? n : n.split(`
`).map(F).join(`
`);
}
function V(n) {
  const t = [], s = /* @__PURE__ */ new Set();
  let i = "";
  const e = () => {
    i !== "" && t.push({ text: i, codes: [...s] }), i = "";
  }, h = /\x1b\[([0-9;]*)m/g;
  let r = 0;
  for (let l = h.exec(n); l !== null; l = h.exec(n)) {
    i += n.slice(r, l.index), r = l.index + l[0].length;
    for (const o of l[1].split(";"))
      o === "0" || o === "" ? s.clear() : D.has(o) && s.add(o);
    e();
  }
  return i += n.slice(r), e(), t;
}
const _ = [
  [4352, 4447],
  // Hangul Jamo leading consonants
  [11904, 12350],
  // CJK Radicals .. CJK Symbols (incl. 0x303F ideographic space edge)
  [12353, 13311],
  // Hiragana .. CJK Compatibility
  [13312, 19903],
  // CJK Extension A
  [19968, 40959],
  // CJK Unified
  [40960, 42191],
  // Yi
  [43360, 43391],
  // Hangul Jamo Extended-A
  [44032, 55203],
  // Hangul syllables + Jamo Extended-B
  [63744, 64255],
  // CJK Compatibility Ideographs
  [65040, 65049],
  // Vertical forms
  [65072, 65135],
  // CJK Compatibility Forms
  [65280, 65376],
  // Fullwidth Forms (ASCII block)
  [65504, 65510],
  // Fullwidth signs
  [127744, 128591],
  // Emoji pictographs (wide in every real terminal)
  [129280, 129535],
  // Supplemental symbols
  [131072, 196605],
  // CJK Extension B+
  [196608, 262141]
], Y = [
  [768, 879],
  // Combining Diacritical Marks
  [1155, 1161],
  [1425, 1469],
  [1552, 1562],
  [1611, 1631],
  [1648, 1648],
  [1750, 1756],
  [2304, 2306],
  [2362, 2362],
  [2364, 2364],
  [2369, 2376],
  [2381, 2381],
  [2385, 2391],
  [3633, 3633],
  [3636, 3642],
  [3655, 3662],
  [6832, 6911],
  // Combining Diacritical Extended
  [7616, 7679],
  // Combining Diacritical Supplement
  [8400, 8432],
  // Combining Symbols
  [65024, 65039],
  // Variation selectors
  [65056, 65071],
  // Combining Half Marks
  [8203, 8207]
  // Zero-width space/marks (fold, never print)
], O = (n, t) => {
  let s = 0, i = t.length - 1;
  for (; s <= i; ) {
    const e = s + i >> 1, [h, r] = t[e];
    if (n < h) i = e - 1;
    else if (n > r) s = e + 1;
    else return !0;
  }
  return !1;
};
function x(n) {
  return O(n, Y);
}
function $(n) {
  return n < 4352 ? 1 : O(n, _) ? 2 : 1;
}
const c = "\x1B[0m", W = 8;
function K(n) {
  if (n === null) return "";
  const t = n.split(".").pop()?.toLowerCase() ?? "";
  return ["html", "htm", "xhtml", "svg", "xml"].includes(t) ? "html" : "";
}
function q(n) {
  let t = "";
  const s = [], i = [], e = [];
  let h = 0;
  for (const r of n) {
    if (e.push(t.length), r === "	") {
      const a = W - h % W;
      t += " ".repeat(a), s.push(h), i.push(a), h += a;
      continue;
    }
    const l = r.codePointAt(0);
    if (x(l)) {
      s.push(s.length > 0 ? s[s.length - 1] : 0), i.push(0), t += r;
      continue;
    }
    const o = $(l);
    s.push(h), i.push(o), t += r, h += o;
  }
  return { disp: t, starts: s, widths: i, dispAt: e, total: h };
}
function b(n, t) {
  if (n.starts.length === 0) return 0;
  const s = Math.max(0, Math.min(n.starts.length - 1, t));
  return n.starts[s];
}
function R(n, t) {
  let s = 0;
  for (let i = 0; i < n.starts.length && n.starts[i] <= t; i++)
    s = i;
  return s;
}
function Z(n, t) {
  const s = [];
  for (const i of V(n)) {
    const e = [...i.text];
    for (let h = 0; h < e.length; h++) s.push(i.codes);
  }
  for (; s.length < t; ) s.push([]);
  return s;
}
function k(n, t) {
  let s = "", i = 0;
  for (const e of n) {
    const h = e.codePointAt(0);
    if (x(h) && i > 0) {
      s += e;
      continue;
    }
    const r = $(h);
    if (i + r > t) break;
    s += e, i += r;
  }
  return s + " ".repeat(Math.max(0, t - i));
}
function X(n) {
  let t = 0;
  for (const s of n) {
    const i = s.codePointAt(0);
    x(i) || (t += $(i));
  }
  return t;
}
function L(n) {
  let t = "";
  for (const s of n) {
    t += c;
    for (const i of s.codes) t += `\x1B[${i}m`;
    t += s.text;
  }
  return t;
}
const J = [
  "nano — key bindings",
  "",
  "  arrows, Home/End, PgUp/PgDn     move (Ctrl+A / Ctrl+E: line start/end)",
  "  type, Backspace, Delete, Enter  edit the buffer",
  "  Ctrl+O                          write (asks for the file name)",
  "  Ctrl+X                          exit (asks to save when modified)",
  "  Ctrl+W                          search (case-insensitive)",
  "  Alt+W                           search for the same string again",
  "  Ctrl+K / Ctrl+U                 cut line / paste",
  "  Alt+U / Alt+E                   undo / redo",
  "  Alt+C                           cursor location (Ctrl+C interrupts)",
  "  Ctrl+G                          this help; any key returns",
  "",
  "Read-only files open without editing; the mouse places the cursor and",
  "the wheel scrolls. Long lines scroll sideways — wrapping is off."
];
class P {
  constructor(t) {
    this.id = "nano", this.#r = null, this.#t = 0, this.#i = 0, this.#l = null, this.#h = 0, this.#o = 0, this.#u = !1, this.#w = "edit", this.#n = null, this.#e = null, this.#x = null, this.#a = null, this.#k = [], this.#A = !1, this.#m = [], this.#M = [], this.#S = /* @__PURE__ */ new Map(), this.#$ = t.path, this.#d = t.path === null ? null : t.path.split("/").pop() || t.path, this.#E = t.io, this.#c = t.readonly;
    const s = t.content;
    this.#B = s !== "" && s.endsWith(`
`), this.#s = s === "" ? [""] : this.#B ? s.slice(0, -1).split(`
`) : s.split(`
`);
  }
  #r;
  #$;
  #d;
  #E;
  #s;
  #B;
  #t;
  #i;
  #l;
  #h;
  #o;
  #u;
  #c;
  #w;
  #n;
  #e;
  #x;
  #a;
  #k;
  #A;
  #m;
  #M;
  #S;
  /* -- lifecycle ------------------------------------------------------ */
  start(t) {
    this.#r = t, this.#h = 0, this.#o = 0, t.setTitle(`nano ${this.#d ?? "(new buffer)"}`), t.requestMouse(!0);
    const s = this.#s.length === 1 && this.#s[0] === "";
    this.#e = this.#c ? "[ File is read-only ]" : s ? "[ New Buffer ]" : `[ Read ${this.#s.length} line${this.#s.length === 1 ? "" : "s"} ]`, this.paint();
  }
  /** The runner reallocates the screen first; paint re-reads #api.cols/rows. */
  resize(t, s) {
    this.#N(), this.#f(), this.paint();
  }
  stop() {
    this.#r = null;
  }
  a11ySummary() {
    if (this.#w === "help") return "nano: key bindings";
    const t = `line ${this.#t + 1} of ${this.#s.length}, column ${this.#i + 1}`, s = this.#n !== null ? this.#n.mode === "write" ? `answering file name to write: ${this.#n.buffer}` : this.#n.mode === "search" ? `answering search: ${this.#n.buffer}` : "answering: save modified buffer?" : this.#c ? "read-only" : this.#u ? "modified" : "unmodified";
    return `nano: editing ${this.#d ?? "a new buffer"}, ${t}, ${s}`;
  }
  /** The context menu's Find… verb (CORE-V2 §8.5) — the pager's pattern. */
  find() {
    this.#w !== "help" && this.#G({ mode: "search", buffer: this.#x ?? "" });
  }
  /* -- geometry cache -------------------------------------------------- */
  #N() {
    this.#S.clear();
  }
  #p(t) {
    let s = this.#S.get(t);
    return s === void 0 && (s = q(this.#s[t] ?? ""), this.#S.set(t, s)), s;
  }
  /* -- text edits (the ONE mutation primitive) -------------------------- */
  #U(t, s) {
    if (t.row === s.row) return this.#s[t.row].slice(t.col, s.col);
    const i = [this.#s[t.row].slice(t.col)];
    for (let e = t.row + 1; e < s.row; e++) i.push(this.#s[e]);
    return i.push(this.#s[s.row].slice(0, s.col)), i.join(`
`);
  }
  #ot(t) {
    let s = t.col;
    for (let i = 0; i < t.row; i++) s += this.#s[i].length + 1;
    return s;
  }
  #T(t, s) {
    const i = s.lastIndexOf(`
`);
    return i === -1 ? { row: t.row, col: t.col + s.length } : { row: t.row + s.slice(0, i).split(`
`).length, col: s.length - i - 1 };
  }
  /**
   * Replace [start, end) with `text`, record the inverse, move the cursor
   * to the end of the inserted text. `coalesce` folds a plain single-char
   * insert/delete into the previous undo entry (typing / delete runs).
   */
  #g(t, s, i, e = !1) {
    const h = this.#U(t, s);
    if (h === i) return;
    const r = { start: { ...t }, end: { ...s }, old: h, text: i }, l = this.#m[this.#m.length - 1];
    let o = !1;
    e && l !== void 0 && l.start.row === t.row && (h === "" && i.length === 1 && !i.includes(`
`) && l.start.col + l.text.length === t.col && l.text !== "" ? (l.text += i, l.end = this.#T(l.start, l.text), o = !0) : i === "" && h.length === 1 && l.text === "" && l.start.col === t.col && l.old.length === 1 ? (l.old = h + l.old, l.end = { ...s }, o = !0) : i === "" && h.length === 1 && l.text === "" && t.col + h.length === l.start.col && (l.start = { ...t }, l.old = h + l.old, o = !0)), o || this.#m.push(r), this.#m.length > 1e3 && this.#m.shift(), this.#M = [], this.#W(t, s, i), this.#A = !1, this.#u = !0, this.#a = null;
    const a = this.#T(t, i);
    this.#t = a.row, this.#i = a.col, this.#l = null, this.#N(), this.#f();
  }
  /** Apply an operation to the line array (no bookkeeping). */
  #W(t, s, i) {
    const e = this.#s[t.row].slice(0, t.col), h = this.#s[s.row].slice(s.col), r = i.split(`
`), l = r.length === 1 ? [e + r[0] + h] : [e + r[0], ...r.slice(1, -1), r[r.length - 1] + h];
    this.#s = [...this.#s.slice(0, t.row), ...l, ...this.#s.slice(s.row + 1)];
  }
  /* -- undo / redo ------------------------------------------------------ */
  #R(t, s) {
    const i = this.#T(t.start, t.text);
    this.#W(t.start, i, t.old), s.push({ start: { ...t.start }, end: i, old: t.text, text: t.old }), this.#u = !0, this.#a = null, this.#t = t.start.row, this.#i = t.start.col, this.#l = null, this.#N(), this.#f();
  }
  #V() {
    if (this.#c) return this.#b();
    const t = this.#m.pop();
    if (t === void 0) {
      this.#e = "[ Nothing to undo ]";
      return;
    }
    this.#R(t, this.#M), this.#e = "[ Undid ]";
  }
  #_() {
    if (this.#c) return this.#b();
    const t = this.#M.pop();
    if (t === void 0) {
      this.#e = "[ Nothing to redo ]";
      return;
    }
    this.#R(t, this.#m), this.#e = "[ Redid ]";
  }
  /* -- scrolling -------------------------------------------------------- */
  #y() {
    return Math.max(1, (this.#r?.rows ?? 24) - 4);
  }
  #f() {
    const t = this.#y();
    this.#t < this.#h && (this.#h = this.#t), this.#t >= this.#h + t && (this.#h = this.#t - t + 1), this.#h > Math.max(0, this.#s.length - 1) && (this.#h = Math.max(0, this.#s.length - 1));
    const s = this.#r?.cols ?? 80, i = b(this.#p(this.#t), this.#i);
    i < this.#o && (this.#o = i), i >= this.#o + s && (this.#o = i - s + 1);
    let e = 0;
    const h = Math.min(this.#s.length - this.#h, t);
    for (let r = this.#h; r < this.#h + h; r++) e = Math.max(e, this.#p(r).total);
    this.#o = Math.min(this.#o, Math.max(0, e - s + 1));
  }
  /* -- cursor movement --------------------------------------------------- */
  #L(t) {
    t === -1 ? this.#i > 0 ? this.#i-- : this.#t > 0 && (this.#t--, this.#i = this.#s[this.#t].length) : this.#i < this.#s[this.#t].length ? this.#i++ : this.#t < this.#s.length - 1 && (this.#t++, this.#i = 0), this.#l = null, this.#f();
  }
  #P(t) {
    const s = this.#t + t;
    if (s < 0 || s > this.#s.length - 1) return;
    const i = this.#l ?? b(this.#p(this.#t), this.#i);
    this.#t = s, this.#i = this.#v(s, i), this.#l = i, this.#f();
  }
  #O(t) {
    const s = Math.max(1, this.#y() - 2), i = Math.max(0, Math.min(this.#s.length - 1, this.#t + t * s));
    if (i === this.#t) return;
    const e = this.#l ?? b(this.#p(this.#t), this.#i);
    this.#t = i, this.#i = this.#v(i, e), this.#l = e, this.#f();
  }
  /** Char index on `row` for a wanted cell column (0 on empty lines). */
  #v(t, s) {
    const i = this.#p(t);
    return i.total === 0 ? 0 : R(i, Math.min(s, i.total - 1));
  }
  #D() {
    this.#i = 0, this.#l = null, this.#f();
  }
  #I() {
    this.#i = this.#s[this.#t].length, this.#l = null, this.#f();
  }
  /* -- editing commands --------------------------------------------------- */
  #C(t) {
    if (this.#c) return this.#b();
    t !== "" && this.#g({ row: this.#t, col: this.#i }, { row: this.#t, col: this.#i }, t, t.length === 1);
  }
  #Y() {
    if (this.#c) return this.#b();
    if (this.#i > 0) {
      const t = this.#s[this.#t].slice(this.#i - 1, this.#i);
      this.#g({ row: this.#t, col: this.#i - 1 }, { row: this.#t, col: this.#i }, "", t.length === 1);
    } else this.#t > 0 && this.#g({ row: this.#t - 1, col: this.#s[this.#t - 1].length }, { row: this.#t, col: 0 }, "");
  }
  #K() {
    if (this.#c) return this.#b();
    const t = this.#s[this.#t];
    if (this.#i < t.length) {
      const s = t.slice(this.#i, this.#i + 1);
      this.#g({ row: this.#t, col: this.#i }, { row: this.#t, col: this.#i + 1 }, "", s.length === 1);
    } else this.#t < this.#s.length - 1 && this.#g({ row: this.#t, col: this.#i }, { row: this.#t + 1, col: 0 }, "");
  }
  #q() {
    if (this.#c) return this.#b();
    const t = this.#s[this.#t], s = this.#t === this.#s.length - 1;
    if (s && t === "") {
      this.#e = "[ Nothing to cut ]";
      return;
    }
    this.#A || (this.#k = []), s ? (this.#k.push(t), this.#g({ row: this.#t, col: 0 }, { row: this.#t, col: t.length }, "")) : (this.#k.push(`${t}
`), this.#g({ row: this.#t, col: 0 }, { row: this.#t + 1, col: 0 }, "")), this.#A = !0, this.#e = `[ Cut ${this.#k.length === 1 ? "1 line" : `${this.#k.length} lines`} ]`;
  }
  #Z() {
    if (this.#c) return this.#b();
    const t = this.#k.join("");
    if (t === "") {
      this.#e = "[ Cutbuffer is empty ]";
      return;
    }
    this.#g({ row: this.#t, col: this.#i }, { row: this.#t, col: this.#i }, t), this.#e = "[ Pasted ]";
  }
  /* -- search -------------------------------------------------------------- */
  #j(t) {
    if (this.#n = null, t === "") {
      this.#x = null, this.#a = null, this.paint();
      return;
    }
    this.#x = t;
    const s = t.toLowerCase(), i = (r, l, o) => {
      const f = this.#s[r].toLowerCase().indexOf(s, l);
      return f !== -1 && f < o ? { row: r, col: f, len: t.length } : null;
    };
    let e = null, h = !1;
    for (let r = this.#t; r < this.#s.length && e === null; r++)
      e = i(r, r === this.#t ? this.#i + 1 : 0, this.#s[r].length + 1);
    if (e === null) {
      h = !0;
      for (let r = 0; r <= this.#t && e === null; r++)
        e = i(r, 0, r === this.#t ? this.#i : this.#s[r].length + 1);
    }
    if (e === null) {
      this.#a = null, this.#e = `[ "${t}" not found ]`, this.paint();
      return;
    }
    this.#a = e, this.#t = e.row, this.#i = e.col, this.#l = null, this.#f(), this.#e = h ? "[ Search Wrapped ]" : null, this.paint();
  }
  #X() {
    if (this.#x === null) {
      this.#e = "[ No previous search ]";
      return;
    }
    this.#j(this.#x);
  }
  /* -- write / exit ---------------------------------------------------------- */
  #J() {
    const t = this.#s.join(`
`);
    return this.#B ? `${t}
` : t;
  }
  #z(t, s) {
    this.#n = null;
    const i = t.trim();
    if (i === "") {
      this.#e = "[ No file name ]", this.paint();
      return;
    }
    const e = this.#E.resolve(i), h = this.#E.write(e, this.bufferText);
    if (h !== null) {
      this.#e = `[ ${h} ]`, this.paint();
      return;
    }
    if (this.#$ = e, this.#d = e.split("/").pop() || e, this.#u = !1, this.#e = `[ Wrote ${this.#s.length} line${this.#s.length === 1 ? "" : "s"} to ${this.#d} ]`, this.#r?.setTitle(`nano ${this.#d}`), s) {
      this.#r?.exit(0);
      return;
    }
    this.paint();
  }
  #Q() {
    if (!this.#u) {
      this.#r?.exit(0);
      return;
    }
    this.#n = { mode: "confirm-exit" }, this.#e = null, this.paint();
  }
  #F(t) {
    if (this.#n = null, !t) {
      this.#r?.exit(0);
      return;
    }
    if (this.#$ === null) {
      this.#n = { mode: "write", buffer: "", exitAfter: !0 }, this.paint();
      return;
    }
    const s = this.#E.write(this.#$, this.bufferText);
    if (s !== null) {
      this.#e = `[ ${s} ]`, this.paint();
      return;
    }
    this.#u = !1, this.#r?.exit(0);
  }
  /* -- location (Alt+C — Ctrl+C interrupts, §6.3) ------------------------------ */
  #tt() {
    const t = this.#s.length, s = b(this.#p(this.#t), this.#i), i = t <= 1 ? 100 : Math.round(this.#t / (t - 1) * 100);
    this.#e = `[ Line ${this.#t + 1} of ${t} (${i}%), col ${s + 1} ]`;
  }
  #b() {
    this.#e = "[ File is read-only ]";
  }
  /* -- keys --------------------------------------------------------------------- */
  key(t) {
    if (this.#w === "help") {
      this.#w = "edit", this.#e = null, this.paint();
      return;
    }
    if (this.#n !== null) {
      this.#it(t);
      return;
    }
    if (this.#e = null, t.ctrl) {
      switch (t.key) {
        case "a":
          this.#D();
          break;
        case "e":
          this.#I();
          break;
        case "g":
          this.#w = "help";
          break;
        case "k":
          this.#q();
          break;
        case "o":
          this.#st(!1);
          break;
        case "u":
          this.#Z();
          break;
        case "w":
          this.find();
          break;
        case "x":
          this.#Q();
          break;
      }
      this.paint();
      return;
    }
    if (t.alt) {
      switch (t.key) {
        case "w":
          this.#X();
          break;
        case "u":
          this.#V();
          break;
        case "e":
          this.#_();
          break;
        case "c":
          this.#tt();
          break;
      }
      this.paint();
      return;
    }
    switch (t.key) {
      case "ArrowLeft":
        this.#L(-1);
        break;
      case "ArrowRight":
        this.#L(1);
        break;
      case "ArrowUp":
        this.#P(-1);
        break;
      case "ArrowDown":
        this.#P(1);
        break;
      case "Home":
        this.#D();
        break;
      case "End":
        this.#I();
        break;
      case "PageUp":
        this.#O(-1);
        break;
      case "PageDown":
        this.#O(1);
        break;
      case "Backspace":
        this.#Y();
        break;
      case "Delete":
        this.#K();
        break;
      case "Enter":
        this.#C(`
`);
        break;
      case "Tab":
        this.#C("	");
        break;
      case "Space":
        this.#C(" ");
        break;
      default:
        t.key.length === 1 && this.#C(t.key);
        break;
    }
    this.paint();
  }
  #st(t) {
    if (this.#c) {
      this.#b();
      return;
    }
    this.#G({ mode: "write", buffer: this.#d ?? "", exitAfter: t });
  }
  #G(t) {
    this.#n = t, this.#e = null, this.paint();
  }
  #it(t) {
    const s = this.#n;
    if (s.mode === "confirm-exit") {
      if (t.ctrl || t.meta) return;
      t.key === "y" || t.key === "Y" ? this.#F(!0) : t.key === "n" || t.key === "N" ? this.#F(!1) : t.key === "Escape" && (this.#n = null, this.paint());
      return;
    }
    if (t.ctrl || t.meta) {
      t.ctrl && !t.alt && t.key === "o" && s.mode === "write" && this.#z(s.buffer, s.exitAfter);
      return;
    }
    switch (t.key) {
      case "Escape":
        this.#n = null, this.#e = null, this.paint();
        return;
      case "Enter":
        s.mode === "search" ? this.#j(s.buffer) : this.#z(s.buffer, s.exitAfter);
        return;
      case "Backspace":
        s.buffer = s.buffer.slice(0, -1), this.paint();
        return;
      case "Space":
        s.buffer += " ", this.paint();
        return;
      default:
        t.key.length === 1 && (s.buffer += t.key, this.paint());
        return;
    }
  }
  /* -- mouse / paste --------------------------------------------------------------- */
  mouse(t) {
    if (this.#w === "help") return;
    if (t.kind === "wheel") {
      const i = Math.max(0, this.#s.length - this.#y()), e = Math.max(0, Math.min(i, this.#h + t.dy));
      e !== this.#h && (this.#h = e, this.paint());
      return;
    }
    if (t.kind !== "press" || t.row < 1 || t.row - 1 >= this.#y()) return;
    const s = this.#h + (t.row - 1);
    s > this.#s.length - 1 || (this.#t = s, this.#i = R(this.#p(s), t.col + this.#o), this.#l = null, this.#f(), this.paint());
  }
  paste(t) {
    if (this.#n !== null && this.#n.mode !== "confirm-exit") {
      for (const i of t)
        i >= " " && i !== "" && (this.#n.buffer += i);
      this.paint();
      return;
    }
    const s = t.replace(/\r\n?/g, `
`);
    s !== "" && this.#C(s), this.paint();
  }
  /* -- paint -------------------------------------------------------------------------- */
  paint() {
    const t = this.#r;
    if (t === null) return;
    const s = t.cols, i = t.rows, e = t.screen;
    if (e.moveTo(0, 0), e.eraseDisplay(2), e.write(`${this.#nt(s)}\r
`), this.#w === "help") {
      this.#et(t);
      return;
    }
    const h = this.#y();
    for (let r = 0; r < h; r++) {
      const l = this.#h + r;
      e.write(`${this.#ht(l, this.#s[l] ?? "", s)}\r
`);
    }
    e.moveTo(0, i - 3), e.write(this.#rt(s)), e.moveTo(0, i - 2), e.write(`${this.#H(0, s)}\r
`), e.write(this.#H(1, s)), this.#lt(), t.setStatus(`nano: ${this.#d ?? "new buffer"}, line ${this.#t + 1} of ${this.#s.length}`, this.#u ? "busy" : "idle");
  }
  #et(t) {
    const s = t.screen;
    for (let i = 0; i < this.#y(); i++) {
      const e = J[i] ?? "";
      s.write(`${c}\x1B[2m${k(e, t.cols)}${c}\r
`);
    }
    s.moveTo(0, t.rows - 3), s.write(`${c}\x1B[7m${k(" press any key to return to the buffer", t.cols)}${c}`), s.moveTo(0, t.rows - 2), s.write(`${c}\x1B[7m${" ".repeat(t.cols)}${c}\r
`), s.write(`${c}\x1B[7m${" ".repeat(t.cols)}${c}`), s.setCursorVisible(!1), t.setStatus("nano: key bindings", "idle");
  }
  #nt(t) {
    const s = k(`nano  ${this.#d ?? "New Buffer"}${this.#u ? " Modified" : ""}`, t), i = Math.max(0, t - X(s)), e = Math.floor(i / 2);
    return `${c}\x1B[7m${" ".repeat(e)}${s}${" ".repeat(i - e)}${c}`;
  }
  /** One edit-area row: syntax colour + match overlay + horizontal slice. */
  #ht(t, s, i) {
    const e = this.#p(t), h = K(this.#$), r = h !== "" ? U(s, h) : s, l = Z(r, e.starts.length), o = this.#a !== null && this.#a.row === t ? [this.#a.col, this.#a.col + this.#a.len] : null, a = this.#o, f = a + i, p = [];
    let d = "", w = [], y = !1, C = !0;
    const E = () => {
      d !== "" && p.push({ text: d, codes: w }), d = "";
    };
    for (let u = 0; u < e.starts.length; u++) {
      const A = e.starts[u], M = e.widths[u];
      let g;
      if (M === 0 ? g = C : g = A >= a && A + M <= f, C = g, !g) continue;
      const v = e.disp.slice(e.dispAt[u], u + 1 < e.dispAt.length ? e.dispAt[u + 1] : void 0), S = l[u] ?? [], B = o !== null && u >= o[0] && u < o[1] ? [...S, "7"] : S;
      (!y || B.join(" ") !== w.join(" ")) && (E(), w = B, y = !0), d += v;
    }
    return E(), L(p);
  }
  #rt(t) {
    let s = null;
    const i = this.#n;
    return i !== null ? i.mode === "write" ? s = `File Name to Write: ${i.buffer}` : i.mode === "search" ? s = `Search: ${i.buffer}` : s = "Save modified buffer?  Y Yes / N No / Esc Cancel" : this.#e !== null && (s = this.#e), s === null ? `${c}\x1B[7m${" ".repeat(t)}${c}` : `${c}\x1B[7m${k(` ${s}`, t)}${c}`;
  }
  /** One footer row of five chords; unimplemented ones print dim. */
  #H(t, s) {
    const i = t === 0 ? [
      ["^G", "Help", !1],
      ["^O", "Write Out", !1],
      ["^W", "Where Is", !1],
      ["^K", "Cut", !1],
      ["^T", "Execute", !0]
    ] : [
      ["^X", "Exit", !1],
      ["^R", "Read File", !0],
      ["^\\", "Replace", !0],
      ["^U", "Paste", !1],
      ["^C", "Location", !0]
    ], e = [];
    let h = 0;
    for (const [r, l, o] of i) {
      const a = `${r} ${l}`.padEnd(15, " ");
      let f = "", p = 0;
      for (const d of a) {
        const w = $(d.codePointAt(0));
        if (h + p + w > s) break;
        f += d, p += w;
      }
      if (f === "") break;
      e.push({ text: f, codes: o ? ["2"] : [] }), h += p;
    }
    return `${L(e)}${c}`;
  }
  #lt() {
    const t = this.#r;
    if (t === null) return;
    const s = this.#n;
    if (s !== null && s.mode !== "confirm-exit") {
      const h = s.mode === "write" ? 20 : 8;
      t.screen.moveTo(Math.min(t.cols - 1, h + s.buffer.length), t.rows - 3), t.screen.setCursorVisible(!0), t.screen.setCursorStyle("block");
      return;
    }
    if (s !== null) {
      t.screen.setCursorVisible(!1);
      return;
    }
    const i = this.#p(this.#t), e = this.#i < i.starts.length ? i.starts[this.#i] : i.total;
    t.screen.moveTo(Math.max(0, Math.min(t.cols - 1, e - this.#o)), 1 + (this.#t - this.#h)), t.screen.setCursorVisible(!0), t.screen.setCursorStyle("block");
  }
  /* -- test surface (read-only views of private state) ------------------- */
  /** @internal vitest hook — the buffer lines. */
  get lines() {
    return this.#s;
  }
  /** @internal vitest hook / io surface — the buffer text per the trailing-newline policy. */
  get bufferText() {
    return this.#J();
  }
  /** @internal vitest hook — the dirty flag. */
  get modified() {
    return this.#u;
  }
  /** @internal vitest hook — the resolved path (updated on save-as). */
  get path() {
    return this.#$;
  }
}
function Q(n) {
  if (!n.color) return null;
  const t = [];
  for (const i of n.args) {
    if (i.startsWith("-") && i !== "-") return null;
    t.push(i);
  }
  if (t.length > 1) return null;
  const s = {
    write: (i, e) => {
      try {
        return n.vfs.mountFile(i, e), null;
      } catch (h) {
        return h instanceof Error ? h.message : String(h);
      }
    },
    resolve: (i) => n.vfs.resolve(n.state.cwd, i)
  };
  if (t.length === 1) {
    const i = n.vfs.resolve(n.state.cwd, t[0]), e = n.vfs.nodeAt(i);
    if (e !== null && e.kind === "dir") return null;
    const h = n.vfs.backendFor(i), r = e !== null && e.kind === "file" ? e : null;
    return new P({ path: i, content: r?.content ?? "", readonly: h !== null && !h.writable, io: s });
  }
  return new P({ path: null, content: n.stdin ?? "", readonly: !1, io: s });
}
export {
  P as NanoEditor,
  Q as nanoApp
};
