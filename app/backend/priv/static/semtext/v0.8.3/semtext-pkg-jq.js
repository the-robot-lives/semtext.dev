class R extends Error {
  constructor(n, t) {
    super(n), this.pos = t, this.name = "JqSyntaxError";
  }
}
const ge = /[A-Za-z_]/, ne = /[A-Za-z0-9_]/, C = /[0-9]/, Ye = /* @__PURE__ */ new Set(["<", ">", "+", "-", "*", "/", "%", "="]), Qe = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: `
`,
  r: "\r",
  t: "	"
}, ve = /* @__PURE__ */ new Set([" ", "	", `
`, "\r"]);
function Pe(e) {
  const n = [];
  let t = 0, r = 1;
  const i = e.length, o = (s, l = t) => {
    throw new R(s, l);
  };
  for (; t < i; ) {
    const s = e[t];
    if (s === " " || s === "	" || s === `
` || s === "\r") {
      s === `
` && r++, t++;
      continue;
    }
    if (s === "#") {
      for (; t < i && e[t] !== `
`; ) t++;
      continue;
    }
    switch (s) {
      case ".":
        e[t + 1] === "." ? (n.push({ k: "dotdot", pos: t }), t += 2) : (n.push({ k: "dot", pos: t }), t++);
        continue;
      case "[":
        n.push({ k: "[", pos: t }), t++;
        continue;
      case "]":
        n.push({ k: "]", pos: t }), t++;
        continue;
      case "{":
        n.push({ k: "{", pos: t }), t++;
        continue;
      case "}":
        n.push({ k: "}", pos: t }), t++;
        continue;
      case "(":
        n.push({ k: "(", pos: t }), t++;
        continue;
      case ")":
        n.push({ k: ")", pos: t }), t++;
        continue;
      case "|":
        e[t + 1] === "=" ? (n.push({ k: "op", op: "|=", pos: t }), t += 2) : (n.push({ k: "pipe", pos: t }), t++);
        continue;
      case ",":
        n.push({ k: "comma", pos: t }), t++;
        continue;
      case ":":
        n.push({ k: "colon", pos: t }), t++;
        continue;
      case ";":
        n.push({ k: "semi", pos: t }), t++;
        continue;
      case "?":
        n.push({ k: "question", pos: t }), t++;
        continue;
    }
    if (e.slice(t, t + 3) === "//=") {
      n.push({ k: "op", op: "//=", pos: t }), t += 3;
      continue;
    }
    const l = e.slice(t, t + 2);
    if (["==", "!=", "<=", ">=", "//"].includes(l)) {
      n.push({ k: "op", op: l, pos: t }), t += 2;
      continue;
    }
    if (["+=", "-=", "*=", "/=", "%="].includes(l)) {
      n.push({ k: "op", op: l, pos: t }), t += 2;
      continue;
    }
    if (Ye.has(s)) {
      n.push({ k: "op", op: s, pos: t }), t++;
      continue;
    }
    if (C.test(s)) {
      const a = t;
      for (; t < i && C.test(e[t]); ) t++;
      if (e[t] === "." && C.test(e[t + 1] ?? ""))
        for (t++; t < i && C.test(e[t]); ) t++;
      if (e[t] === "e" || e[t] === "E") {
        const w = t;
        if (t++, (e[t] === "+" || e[t] === "-") && t++, !C.test(e[t] ?? "")) t = w;
        else for (; t < i && C.test(e[t]); ) t++;
      }
      const p = e.slice(a, t), h = Number(p);
      Number.isFinite(h) || o(`invalid number literal '${p}'`, a), n.push({ k: "num", v: h, pos: a });
      continue;
    }
    if (s === '"') {
      n.push({ k: "str", parts: et(e, t), pos: t }), t = tt(e, t);
      continue;
    }
    if (s === "$") {
      const a = t;
      t++, ge.test(e[t] ?? "") || o("' $' must be followed by a name", a);
      let p = "";
      for (; t < i && ne.test(e[t]); ) p += e[t++];
      n.push({ k: "var", name: p, pos: a, line: r });
      continue;
    }
    if (s === "@") {
      const a = t;
      t++;
      let p = "";
      for (; t < i && ne.test(e[t]); ) p += e[t++];
      p === "" && o("'@' must be followed by a format name", a), n.push({ k: "format", name: p, pos: a });
      continue;
    }
    if (ge.test(s)) {
      const a = t;
      let p = "";
      for (; t < i && ne.test(e[t]); ) p += e[t++];
      n.push({ k: "ident", name: p, pos: a, adj: a > 0 && !ve.has(e[a - 1]) });
      continue;
    }
    o(`unexpected character '${s}'`);
  }
  return n.push({ k: "eof", pos: i }), n;
}
function et(e, n) {
  const t = [];
  let r = "", i = n + 1;
  const o = e.length, s = () => {
    r !== "" && (t.push(r), r = "");
  };
  for (; i < o; ) {
    const l = e[i];
    if (l === '"')
      return s(), t;
    if (l === "\\") {
      const a = e[i + 1];
      if (a === void 0) break;
      if (a === "(") {
        s();
        const h = i + 2;
        let w = 1, d = h;
        for (; d < o && w > 0; ) {
          const k = e[d];
          if (k === '"') {
            for (d++; d < o && e[d] !== '"'; )
              e[d] === "\\" && d++, d++;
            if (d >= o) throw new R("unterminated string in interpolation", h);
          } else if (k === "(")
            w++;
          else if (k === ")" && (w--, w === 0))
            break;
          d++;
        }
        if (w !== 0) throw new R("unterminated interpolation (missing ')')", h);
        t.push({ raw: e.slice(h, d), pos: h }), i = d + 1;
        continue;
      }
      const p = Qe[a];
      if (p === void 0 && a !== "u")
        throw new R(`invalid escape '\\${a}' in string`, i);
      if (a === "u") {
        const h = e.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(h)) throw new R("invalid \\u escape in string", i);
        r += String.fromCharCode(parseInt(h, 16)), i += 6;
        continue;
      }
      r += p, i += 2;
      continue;
    }
    r += l, i++;
  }
  throw new R("unterminated string literal", n);
}
function tt(e, n) {
  let t = n + 1;
  const r = e.length;
  for (; t < r; ) {
    const i = e[t];
    if (i === '"') return t + 1;
    if (i === "\\") {
      if (e[t + 1] === "(") {
        let o = 1, s = t + 2;
        for (; s < r && o > 0; ) {
          const l = e[s];
          if (l === '"')
            for (s++; s < r && e[s] !== '"'; )
              e[s] === "\\" && s++, s++;
          else l === "(" ? o++ : l === ")" && o--;
          s++;
        }
        t = s;
        continue;
      }
      t += e[t + 1] === "u" ? 6 : 2;
      continue;
    }
    t++;
  }
  return r;
}
class ce extends Error {
  constructor(n, t) {
    super(n), this.pos = t, this.name = "JqParseError";
  }
}
const nt = /* @__PURE__ */ new Set(["text", "json", "csv", "tsv", "html", "uri", "base64", "base64d"]), we = /* @__PURE__ */ new Set(["=", "|=", "+=", "-=", "*=", "/=", "%=", "//="]), be = /* @__PURE__ */ new Set([
  "if",
  "then",
  "elif",
  "else",
  "end",
  "as",
  "def",
  "foreach",
  "reduce",
  "try",
  "catch",
  "label",
  "and",
  "or",
  "import",
  "include",
  "break",
  "__loc__"
]);
class qe {
  constructor(n, t) {
    this.toks = n, this.src = t, this.i = 0;
  }
  peek(n = 0) {
    return this.toks[Math.min(this.i + n, this.toks.length - 1)];
  }
  next() {
    return this.toks[this.i++];
  }
  atOp(n) {
    const t = this.peek();
    return t.k === "op" && t.op === n;
  }
  atIdent(n) {
    const t = this.peek();
    return t.k === "ident" && t.name === n;
  }
  fail(n, t) {
    const r = t ?? this.peek().pos, i = this.src.slice(0, r).split(`
`).length;
    throw new ce(`${n} at line ${i}`, r);
  }
  expect(n, t) {
    const r = this.next();
    return r.k !== n && this.fail(`expected ${t}`, r.pos), r;
  }
  parseProgram() {
    const n = this.parsePipe(), t = this.peek();
    return t.k !== "eof" && this.fail(`unexpected ${ke(t)}`, t.pos), n;
  }
  /**
   * `|` — lowest; right-associated. `EXPR as $x | body` binds here (its body
   * eats the rest of the pipe), as do `def f: …; rest` and `label $x | body`.
   */
  parsePipe() {
    if (this.atIdent("def")) return this.parseDef();
    if (this.atIdent("label")) {
      this.next();
      const t = this.expect("var", "a $label after 'label'");
      return this.peek().k !== "pipe" && this.fail("expected '|' after 'label $name'", this.peek().pos), this.next(), { t: "label", name: t.name, body: this.parsePipe() };
    }
    let n = this.parseComma();
    if (n.t === "as") return n;
    if (this.peek().k === "pipe") {
      this.next();
      const t = this.parsePipe();
      return { t: "pipe", l: n, r: t };
    }
    return n;
  }
  parseDef() {
    this.next();
    const t = this.expect("ident", "a function name after def").name, r = [];
    if (this.peek().k === "(")
      for (this.next(); ; ) {
        const s = this.next();
        if (s.k === "var" ? r.push({ dollar: !0, name: s.name }) : s.k === "ident" ? r.push({ dollar: !1, name: s.name }) : this.fail("expected a parameter name ($var or f) in the def parameter list", s.pos), this.peek().k === "semi") {
          this.next();
          continue;
        }
        this.expect(")", "')' after the def parameter list");
        break;
      }
    this.expect("colon", "':' after the def name/parameters");
    const i = this.parsePipe();
    this.expect("semi", "';' after the def body");
    const o = this.parsePipe();
    return { t: "def", name: t, params: r, body: i, rest: o };
  }
  parseComma() {
    let n = this.parseAlt();
    for (; this.peek().k === "comma"; ) {
      this.next();
      const t = this.parseAlt();
      t.t === "as" && this.fail("'as' must end its pipeline segment", this.peek().pos), n = { t: "comma", l: n, r: t };
    }
    return n;
  }
  /** `//` — right-associated, binds looser than assignment (probe-verified). */
  parseAlt() {
    const n = this.parseAssign();
    return this.atOp("//") ? (this.next(), { t: "alt", l: n, r: this.parseAlt() }) : n;
  }
  /** `= |= += -= *= /= %= //=` — nonassociative; operands at `or` level. */
  parseAssign() {
    const n = this.parseOr(), t = this.peek();
    return t.k === "op" && we.has(t.op) ? (this.next(), { t: "assign", op: t.op, lhs: n, rhs: this.parseOr() }) : n;
  }
  parseOr() {
    let n = this.parseAnd();
    for (; this.atIdent("or"); )
      this.next(), n = { t: "or", l: n, r: this.parseAnd() };
    return n;
  }
  parseAnd() {
    let n = this.parseCmp();
    for (; this.atIdent("and"); )
      this.next(), n = { t: "and", l: n, r: this.parseCmp() };
    return n;
  }
  parseCmp() {
    const n = this.parseAdd(), t = this.peek();
    return t.k === "op" && ["==", "!=", "<", "<=", ">", ">="].includes(t.op) ? (this.next(), { t: "binop", op: t.op, l: n, r: this.parseAdd() }) : n;
  }
  parseAdd() {
    let n = this.parseMul();
    for (; ; ) {
      const t = this.peek();
      if (t.k === "op" && (t.op === "+" || t.op === "-"))
        this.next(), n = { t: "binop", op: t.op, l: n, r: this.parseMul() };
      else return n;
    }
  }
  parseMul() {
    let n = this.parseUnary();
    for (; ; ) {
      const t = this.peek();
      if (t.k === "op" && (t.op === "*" || t.op === "/" || t.op === "%"))
        this.next(), n = { t: "binop", op: t.op, l: n, r: this.parseUnary() };
      else return n;
    }
  }
  parseUnary() {
    return this.atOp("-") ? (this.next(), { t: "neg", e: this.parsePostfix() }) : this.parsePostfixAs();
  }
  /** A Term optionally followed by `as $var | body` (jq's as-source is a Term). */
  parsePostfixAs() {
    const n = this.parsePostfix();
    if (!this.atIdent("as")) return n;
    this.next();
    const t = this.expect("var", "a $variable after 'as'");
    this.peek().k !== "pipe" && this.fail("expected '|' after 'EXPR as $var'", this.peek().pos), this.next();
    const r = this.parsePipe();
    return { t: "as", src: n, name: t.name, body: r };
  }
  parsePostfix() {
    let n = this.parsePrimary();
    for (; ; ) {
      const t = this.peek();
      if (t.k === "dot") {
        const r = this.peek(1);
        if (r.k === "ident" && r.adj) {
          this.next();
          const i = this.next();
          n = { t: "pipe", l: n, r: { t: "field", name: i.name } };
          continue;
        }
        if (r.k === "str") {
          this.next();
          const i = this.next();
          n = { t: "pipe", l: n, r: { t: "field", name: re(i, this) } };
          continue;
        }
        this.fail("expected a field name after '.'", r.pos);
      }
      if (t.k === "[") {
        if (this.next(), this.peek().k === "]")
          this.next(), n = { t: "pipe", l: n, r: { t: "iter" } };
        else if (this.peek().k === "colon") {
          this.next();
          const r = this.peek().k === "]" ? null : this.parsePipe();
          this.expect("]", "']'"), n = { t: "pipe", l: n, r: { t: "slice", lo: null, hi: r } };
        } else {
          const r = this.parsePipe();
          if (this.peek().k === "colon") {
            this.next();
            const i = this.peek().k === "]" ? null : this.parsePipe();
            this.expect("]", "']'"), n = { t: "pipe", l: n, r: { t: "slice", lo: r, hi: i } };
          } else
            this.expect("]", "']'"), n = { t: "pipe", l: n, r: { t: "index", key: r } };
        }
        continue;
      }
      if (t.k === "question") {
        this.next(), n = { t: "try", body: n, catch_: null };
        continue;
      }
      return n;
    }
  }
  parsePrimary() {
    const n = this.next();
    switch (n.k) {
      case "dot": {
        const t = this.peek();
        if (t.k === "ident" && t.adj) {
          const r = this.next();
          return { t: "pipe", l: { t: "id" }, r: { t: "field", name: r.name } };
        }
        if (t.k === "str") {
          const r = this.next();
          return { t: "pipe", l: { t: "id" }, r: { t: "field", name: re(r, this) } };
        }
        return { t: "id" };
      }
      case "dotdot":
        return { t: "call", name: "recurse", args: [] };
      case "num":
        return { t: "lit", v: n.v };
      case "str":
        return { t: "str", parts: n.parts.map((r) => typeof r == "string" ? r : $e(r.raw)) };
      case "var":
        return n.name === "__loc__" ? { t: "loc", line: n.line } : { t: "var", name: n.name };
      case "format": {
        if (nt.has(n.name) || this.fail(`'@${n.name}' is not a known format`, n.pos), this.peek().k === "str") {
          const r = this.next().parts.map((i) => typeof i == "string" ? i : $e(i.raw));
          return { t: "fmtnstr", name: n.name, parts: r };
        }
        return { t: "format", name: n.name };
      }
      case "(": {
        const t = this.parsePipe();
        return this.expect(")", "')'"), t;
      }
      case "[": {
        if (this.peek().k === "]")
          return this.next(), { t: "array", body: null };
        const t = this.parsePipe();
        return this.expect("]", "']'"), { t: "array", body: t };
      }
      case "{":
        return this.parseObject();
      case ")":
      case "]":
      case "}":
      case "comma":
      case "colon":
      case "semi":
      case "question":
      case "pipe":
      case "eof":
        this.fail(`unexpected ${ke(n)}`, n.pos);
      case "op":
        we.has(n.op) && this.fail("an assignment needs a path on its left ('X' is not a path)", n.pos), this.fail(`unexpected operator '${n.op}'`, n.pos);
      case "ident":
        return this.parseIdent(n.name, n.pos);
    }
  }
  /**
   * `{...}` construction. Entries: `{key: VAL}`, `{key}` (= `.key`),
   * `{$var}` (key = the variable's name), `{"str": VAL}`, `{"str"}`,
   * `{(EXPR): VAL}`. Values parse at assignment level so `,` separates
   * entries and `:` never leaks into them; keys accept any identifier word
   * (jq's keywords-as-keys allowance).
   */
  parseObject() {
    const n = [];
    if (this.peek().k === "}")
      return this.next(), { t: "object", entries: n };
    for (; ; ) {
      const t = this.next();
      if (t.k === "var")
        t.name === "__loc__" && this.fail("$__loc__ is not a valid object key shorthand", t.pos), n.push({ key: { t: "lit", v: t.name }, val: { t: "var", name: t.name } });
      else if (t.k === "ident")
        be.has(t.name) ? n.push({ key: { t: "lit", v: t.name }, val: { t: "pipe", l: { t: "id" }, r: { t: "field", name: t.name } } }) : this.peek().k === "colon" ? (this.next(), n.push({ key: { t: "lit", v: t.name }, val: this.parseObjVal() })) : n.push({ key: { t: "lit", v: t.name }, val: { t: "pipe", l: { t: "id" }, r: { t: "field", name: t.name } } });
      else if (t.k === "str") {
        const r = re(t, this);
        this.peek().k === "colon" ? (this.next(), n.push({ key: { t: "lit", v: r }, val: this.parseObjVal() })) : n.push({ key: { t: "lit", v: r }, val: { t: "pipe", l: { t: "id" }, r: { t: "field", name: r } } });
      } else if (t.k === "(") {
        const r = this.parsePipe();
        this.expect(")", "')'"), this.expect("colon", "':'"), n.push({ key: r, val: this.parseObjVal() });
      } else
        this.fail('expected an object key (name, "string", $var or (expr))', t.pos);
      if (this.peek().k === "comma") {
        this.next();
        continue;
      }
      return this.expect("}", "'}'"), { t: "object", entries: n };
    }
  }
  parseObjVal() {
    return this.parseAssign();
  }
  parseIdent(n, t) {
    if ((n === "import" || n === "include") && this.fail("import/include of module files is not supported by this jq build", t), n === "true") return { t: "lit", v: !0 };
    if (n === "false") return { t: "lit", v: !1 };
    if (n === "null") return { t: "lit", v: null };
    if (n === "if") return this.parseIf();
    if (n === "try") {
      const r = this.parsePostfix();
      return this.atIdent("catch") ? (this.next(), { t: "try", body: r, catch_: this.parsePostfix() }) : { t: "try", body: r, catch_: null };
    }
    if (n === "reduce") {
      const r = this.parsePostfix();
      this.atIdent("as") || this.fail("expected 'as' after 'reduce SOURCE'", this.peek().pos), this.next();
      const i = this.expect("var", "a $variable");
      this.expect("(", "'('");
      const o = this.parsePipe();
      this.expect("semi", "';'");
      const s = this.parsePipe();
      return this.expect(")", "')'"), { t: "reduce", src: r, name: i.name, init: o, update: s };
    }
    if (n === "foreach") return this.parseForeach();
    if (n === "break")
      return { t: "break", name: this.expect("var", "a $label after 'break'").name };
    if (n === "as" && this.fail("'as' needs a source expression (EXPR as $x | body)", t), be.has(n) && this.fail(`unexpected keyword '${n}'`, t), this.peek().k === "(") {
      this.next();
      const r = [this.parsePipe()];
      for (; this.peek().k === "semi"; )
        this.next(), r.push(this.parsePipe());
      return this.expect(")", "')'"), { t: "call", name: n, args: r };
    }
    return { t: "call", name: n, args: [] };
  }
  /** `foreach SOURCE as $x (INIT; UPDATE)` or `foreach SOURCE as $x (INIT; UPDATE; EXTRACT)`. */
  parseForeach() {
    const n = this.parsePostfix();
    this.atIdent("as") || this.fail("expected 'as' after 'foreach SOURCE'", this.peek().pos), this.next();
    const t = this.expect("var", "a $variable");
    this.expect("(", "'('");
    const r = this.parsePipe();
    this.expect("semi", "';'");
    const i = this.parsePipe();
    let o = null;
    return this.peek().k === "semi" && (this.next(), o = this.parsePipe()), this.expect(")", "')'"), { t: "foreach", src: n, name: t.name, init: r, update: i, extract: o };
  }
  parseIf() {
    const n = [], t = this.parsePipe();
    this.atIdent("then") || this.fail("expected 'then' after 'if' condition", this.peek().pos), this.next(), n.push({ cond: t, then: this.parsePipe() });
    let r = null;
    for (; ; ) {
      if (this.atIdent("elif")) {
        this.next();
        const i = this.parsePipe();
        this.atIdent("then") || this.fail("expected 'then' after 'elif' condition", this.peek().pos), this.next(), n.push({ cond: i, then: this.parsePipe() });
        continue;
      }
      return this.atIdent("else") && (this.next(), r = this.parsePipe()), this.atIdent("end") || this.fail("expected 'end' to close 'if'", this.peek().pos), this.next(), { t: "if", clauses: n, els: r };
    }
  }
}
function Ie(e) {
  if (e.trim() === "") throw new ce("empty program", 0);
  return new qe(Pe(e), e).parseProgram();
}
function $e(e) {
  return new qe(Pe(e), e).parseProgram();
}
function re(e, n) {
  if (e.parts.length === 1 && typeof e.parts[0] == "string") return e.parts[0];
  if (e.parts.length === 0) return "";
  n.fail("interpolated strings are not valid here", e.pos);
}
function ke(e) {
  switch (e.k) {
    case "eof":
      return "end of program";
    case "dot":
      return "'.'";
    case "dotdot":
      return "'..'";
    case "pipe":
      return "'|'";
    case "comma":
      return "','";
    case "str":
      return "a string";
    case "ident":
      return `'${e.name}'`;
    case "var":
      return `'$${e.name}'`;
    case "num":
      return `number ${e.v}`;
    case "format":
      return `'@${e.name}'`;
    case "op":
      return `'${e.op}'`;
    default:
      return `'${e.k}'`;
  }
}
const rt = {
  alpha: "A-Za-z",
  digit: "0-9",
  alnum: "0-9A-Za-z",
  upper: "A-Z",
  lower: "a-z",
  space: " \\t\\r\\n\\x0b\\f",
  blank: " \\t",
  punct: "!-/:-@\\[-`{-~",
  cntrl: "\\x00-\\x1f\\x7f",
  xdigit: "0-9A-Fa-f",
  word: "\\w"
};
function it(e) {
  return e.replace(/\[:(\w+):\]/g, (n, t) => rt[t] ?? n);
}
function ot(e) {
  let n = "", t = !1;
  for (let r = 0; r < e.length; r++) {
    const i = e[r];
    if (i === "\\") {
      n += i + (e[r + 1] ?? ""), r++;
      continue;
    }
    if (t) {
      i === "]" && (t = !1), n += i;
      continue;
    }
    if (i === "[") {
      t = !0, n += i;
      continue;
    }
    if (i === "#") {
      for (; r < e.length && e[r] !== `
`; ) r++;
      continue;
    }
    i === " " || i === "	" || i === `
` || i === "\r" || (n += i);
  }
  return n;
}
function st(e) {
  let n = "";
  for (let t = 0; t < e.length; t++) {
    const r = e[t];
    if (r === "\\" && (e[t + 1] === "A" || e[t + 1] === "z" || e[t + 1] === "Z")) {
      n += e[t + 1] === "A" ? "^" : "$", t++;
      continue;
    }
    n += r;
  }
  return n;
}
function lt(e) {
  const n = [];
  let t = !1;
  for (let r = 0; r < e.length; r++) {
    const i = e[r];
    if (i === "\\") {
      r++;
      continue;
    }
    if (t) {
      i === "]" && (t = !1);
      continue;
    }
    if (i === "[") {
      t = !0;
      continue;
    }
    if (i !== "(") continue;
    const o = e.slice(r + 1);
    if (o.startsWith("?")) {
      if (/^\?<([A-Za-z_][A-Za-z0-9_]*)>/.test(o)) {
        const s = /^\?<([A-Za-z_][A-Za-z0-9_]*)>/.exec(o);
        n.push(s[1]), r += s[0].length;
        continue;
      }
      continue;
    }
    n.push(null);
  }
  return n;
}
function xe(e, n) {
  let t = "ud", r = !1, i = !1;
  for (const l of n ?? "")
    if (l === "g") r = !0;
    else if (l === "i") t += "i";
    else if (l !== "x") {
      if (l === "m" || l === "p") t += "s";
      else if (l !== "s") if (l === "n") i = !0;
      else throw u(n, `${n === null ? "" : n} is not a valid modifier string`);
    }
  let o = st(it(e));
  (n ?? "").includes("x") && (o = ot(o));
  let s;
  try {
    s = new RegExp(o, t);
  } catch (l) {
    throw u(e, `"${e}" is not a valid regex: ${l.message.replace(/^Invalid regular expression: /, "")}`);
  }
  return { re: s, global: r, nonEmpty: i, names: lt(e) };
}
function ie(e, n) {
  const t = e.charCodeAt(n);
  return t >= 55296 && t <= 56319 && n + 1 < e.length ? 2 : 1;
}
class Ce {
  constructor(n) {
    this.text = n, this.marks = [];
    for (let t = 0; t < n.length; )
      this.marks.push(t), t += ie(n, t);
    this.marks.push(n.length);
  }
  /** Codepoint offset of a UTF-16 offset. */
  cp(n) {
    let t = 0, r = this.marks.length - 1;
    for (; t < r; ) {
      const i = t + r + 1 >> 1;
      this.marks[i] <= n ? t = i : r = i - 1;
    }
    return t;
  }
  /** Codepoint length of a slice given its UTF-16 start and length. */
  cpLen(n, t) {
    return this.cp(n + t) - this.cp(n);
  }
}
function* P(e, n) {
  const t = new RegExp(n.re.source, n.re.flags + (n.global ? "g" : ""));
  let r = 0;
  for (; ; ) {
    t.lastIndex = r;
    const i = t.exec(e);
    if (i === null) return;
    const o = new Ce(e);
    if (i[0] === "" && n.nonEmpty) {
      const s = i.index + ie(e, i.index);
      if (s > e.length) return;
      r = s;
      continue;
    }
    if (yield { m: i, cp: o }, !n.global || (r = i[0] === "" ? i.index + ie(e, i.index) : i.index + i[0].length, r > e.length)) return;
  }
}
function at(e, n, t) {
  const { m: r, cp: i } = n, o = r.indices, s = [];
  for (let l = 1; l < r.length; l++) {
    const a = o?.[l], p = r[l];
    if (p === void 0 || !a) {
      s.push({ offset: -1, length: 0, string: null, name: t.names[l - 1] ?? null });
      continue;
    }
    s.push({
      offset: i.cp(a[0]),
      length: i.cpLen(a[0], a[1] - a[0]),
      string: p,
      name: t.names[l - 1] ?? null
    });
  }
  return { offset: i.cp(r.index), length: i.cpLen(r.index, r[0].length), string: r[0], captures: s };
}
function L(e, n) {
  const { m: t, cp: r } = e, i = t.indices, o = {};
  for (let s = 1; s < t.length; s++) {
    const l = n.names[s - 1];
    if (l == null) continue;
    const a = i?.[s];
    o[l] = t[s] === void 0 || !a ? null : t[s];
  }
  return o;
}
function Je(e) {
  return e.names.some((n) => n !== null);
}
function Re(e, n) {
  const t = { ...n, global: !0 }, r = [];
  let i = 0;
  for (const { m: o } of P(e, t))
    r.push(e.slice(i, o.index)), i = o.index + o[0].length;
  return r.push(e.slice(i)), r;
}
const g = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
function m(e) {
  return e === null ? "null" : typeof e == "boolean" ? "boolean" : typeof e == "number" ? "number" : typeof e == "string" ? "string" : Array.isArray(e) ? "array" : "object";
}
const A = (e) => e !== null && e !== !1;
function y(e) {
  return e === null ? "null" : e === !0 ? "true" : e === !1 ? "false" : typeof e == "number" ? Number.isFinite(e) ? String(e) : "null" : typeof e == "string" ? JSON.stringify(e) : Array.isArray(e) ? `[${e.map(y).join(",")}]` : `{${Object.entries(e).map(([n, t]) => `${JSON.stringify(n)}:${y(t)}`).join(",")}}`;
}
function _(e) {
  return typeof e == "string" ? e : y(e);
}
function ft(e, n = 2) {
  const t = (i) => " ".repeat(n * i), r = (i, o) => {
    if (Array.isArray(i))
      return i.length === 0 ? "[]" : `[
${i.map((s) => `${t(o + 1)}${r(s, o + 1)}`).join(`,
`)}
${t(o)}]`;
    if (g(i)) {
      const s = Object.keys(i);
      return s.length === 0 ? "{}" : `{
${s.map((l) => `${t(o + 1)}${JSON.stringify(l)}: ${r(i[l], o + 1)}`).join(`,
`)}
${t(o)}}`;
    }
    return y(i);
  };
  return r(e, 0);
}
function b(e, n) {
  const t = (o) => o === null ? 0 : typeof o == "boolean" ? o ? 2 : 1 : typeof o == "number" ? 3 : typeof o == "string" ? 4 : Array.isArray(o) ? 5 : 6, r = t(e), i = t(n);
  if (r !== i) return r < i ? -1 : 1;
  switch (r) {
    case 0:
    case 1:
    case 2:
      return 0;
    case 3:
      return e === n ? 0 : e < n ? -1 : 1;
    case 4:
      return e === n ? 0 : e < n ? -1 : 1;
    case 5: {
      const o = e, s = n, l = Math.min(o.length, s.length);
      for (let a = 0; a < l; a++) {
        const p = b(o[a], s[a]);
        if (p !== 0) return p;
      }
      return o.length === s.length ? 0 : o.length < s.length ? -1 : 1;
    }
    default: {
      const o = Object.keys(e).sort(), s = Object.keys(n).sort(), l = b(o, s);
      if (l !== 0) return l;
      const a = e, p = n;
      for (const h of o) {
        const w = b(a[h], p[h]);
        if (w !== 0) return w;
      }
      return 0;
    }
  }
}
class T extends Error {
  constructor(n, t) {
    super(t), this.value = n, this.jqMessage = t, this.name = "JqError";
  }
}
const u = (e, n) => new T(e, n);
class je extends Error {
  constructor(n) {
    super("break"), this.marker = n, this.name = "JqBreak";
  }
}
class Q extends Error {
  constructor(n, t) {
    super("halt"), this.code = n, this.payload = t, this.name = "JqHalt";
  }
}
const q = (e, n, t) => ({ k: "var", name: n, value: t, parent: e }), W = (e, n) => ({ k: "fn", ...n, parent: e });
function ct(e, n) {
  for (let t = e; t !== null; t = t.parent)
    if (t.k === "var" && t.name === n) return t.value;
  throw u(n, `$${n} is not defined (pass --arg ${n} <value> or --argjson ${n} <json>)`);
}
function Me(e, n, t) {
  for (let r = e; r !== null; r = r.parent)
    if (r.k === "fn" && r.name === n && r.arity === t) return r;
  return null;
}
const x = { nextInput: null, filename: null, env: {}, depth: 0 };
function Te(e, n) {
  const t = { ...e };
  for (const [r, i] of Object.entries(n)) {
    const o = t[r];
    t[r] = g(o) && g(i) ? Te(o, i) : i;
  }
  return t;
}
function J(e, n, t) {
  return u(null, `${m(e)} (${y(e)}) and ${m(n)} (${y(n)}) cannot be ${t}`);
}
function oe(e, n, t) {
  switch (e) {
    case "+":
      if (n === null) return t;
      if (t === null) return n;
      if (typeof n == "number" && typeof t == "number" || typeof n == "string" && typeof t == "string") return n + t;
      if (Array.isArray(n) && Array.isArray(t)) return [...n, ...t];
      if (g(n) && g(t)) return { ...n, ...t };
      throw J(n, t, "added");
    case "-":
      if (typeof n == "number" && typeof t == "number") return n - t;
      if (Array.isArray(n) && Array.isArray(t)) return n.filter((r) => !t.some((i) => b(r, i) === 0));
      throw J(n, t, "subtracted");
    case "*": {
      if (typeof n == "number" && typeof t == "number") return n * t;
      const [r, i] = typeof n == "string" && typeof t == "number" ? [n, t] : typeof t == "string" && typeof n == "number" ? [t, n] : [null, 0];
      if (r !== null) {
        if (!Number.isInteger(i)) throw J(n, t, "multiplied");
        return i <= 0 ? null : r.repeat(i);
      }
      if (g(n) && g(t)) return Te(n, t);
      throw J(n, t, "multiplied");
    }
    case "/":
      if (typeof n == "number" && typeof t == "number") {
        if (t === 0) throw u(null, `${m(n)} (${y(n)}) and ${m(t)} (${y(t)}) cannot be divided because the divisor is zero`);
        return n / t;
      }
      if (typeof n == "string" && typeof t == "string") {
        if (t === "") throw u(n, `cannot be split: "${n}" / "" (empty separator)`);
        return n.split(t);
      }
      throw J(n, t, "divided");
    case "%":
      if (typeof n == "number" && typeof t == "number") {
        if (!Number.isInteger(n) || !Number.isInteger(t)) throw u(null, `${m(n)} (${y(n)}) and ${m(t)} (${y(t)}) cannot be divided, because % requires integers`);
        if (t === 0) throw u(null, `${m(n)} (${y(n)}) and ${m(t)} (${y(t)}) cannot be divided because the divisor is zero`);
        return n % t;
      }
      throw J(n, t, "divided");
  }
}
function z(e, n) {
  if (typeof n == "string") {
    if (e === null) return null;
    if (g(e)) return e[n] ?? null;
    throw u(n, `Cannot index ${m(e)} with "${n}"`);
  }
  if (typeof n == "number") {
    if (e === null) return null;
    if (Array.isArray(e)) {
      if (!Number.isInteger(n)) throw u(n, `Cannot index array with number (${y(n)}) — array indices must be integers`);
      const t = n < 0 ? e.length + n : n;
      return t >= 0 && t < e.length ? e[t] : null;
    }
    throw u(n, `Cannot index ${m(e)} with number`);
  }
  throw u(n, `Cannot index ${m(e)} with ${m(n)}`);
}
function ue(e, n, t) {
  if (e === null) return null;
  if (!Array.isArray(e) && typeof e != "string") throw u(e, `Cannot slice ${m(e)} (${y(e)})`);
  const r = e.length;
  let i = U(n, "start", r), o = U(t, "end", r);
  return o <= i ? typeof e == "string" ? "" : [] : e.slice(i, o);
}
function U(e, n, t) {
  if (e === null) return n === "start" ? 0 : t;
  if (typeof e != "number") throw u(e, `Slice ${n} must be a number, got ${m(e)}`);
  let r = Math.floor(e);
  return r < 0 && (r = Math.max(0, t + r)), Math.min(r, t);
}
function v(e) {
  const n = Array.isArray(e) || g(e) ? "" : ` (${y(e)})`;
  return u(e, `Cannot iterate over ${m(e)}${n}`);
}
function* Z(e) {
  if (Array.isArray(e)) yield* e;
  else if (g(e)) yield* Object.values(e);
  else throw v(e);
}
function K(e, n) {
  return typeof e == "string" && typeof n == "string" ? e.includes(n) : Array.isArray(e) && Array.isArray(n) ? n.every((t) => e.some((r) => K(r, t))) : g(e) && g(n) ? Object.entries(n).every(([t, r]) => t in e && K(e[t], r)) : b(e, n) === 0;
}
function $(e, n) {
  if (!Array.isArray(e)) throw u(e, `${n} requires an array, got ${m(e)} (${y(e)})`);
  return e;
}
function j(e, n) {
  if (typeof e != "string") throw u(e, `${n} requires a string, got ${m(e)} (${y(e)})`);
  return e;
}
function N(e, n) {
  if (typeof e != "number") throw u(e, `${n} requires a number, got ${m(e)} (${y(e)})`);
  return e;
}
function E(e) {
  if (typeof e != "string") throw u(e, `${y(e)} (${m(e)}) cannot be matched, as it is not a string`);
  return e;
}
function D(e, n, t) {
  return [...f(e, n, t)];
}
function G(e, n) {
  let t = e;
  for (const r of n)
    typeof r == "string" || typeof r == "number" ? t = z(t, r) : t = ue(t, r.start, r.end);
  return t;
}
function ee(e) {
  return $(e, "path").map((t) => {
    if (typeof t == "string" || typeof t == "number") return t;
    if (g(t) && ("start" in t || "end" in t)) {
      const r = t.start ?? null, i = t.end ?? null;
      if (r !== null && typeof r != "number" || i !== null && typeof i != "number") throw u(e, "Invalid path");
      return { start: r, end: i };
    }
    throw u(e, "Invalid path");
  });
}
function M(e, n, t) {
  if (n.length === 0) return t;
  const r = n[0], i = n.slice(1);
  if (typeof r == "string") {
    let a = e;
    if (a === null && (a = {}), !g(a)) throw u(r, `Cannot index ${m(a)} with "${r}"`);
    return { ...a, [r]: M(a[r] ?? null, i, t) };
  }
  if (typeof r == "number") {
    let a = e;
    if (a === null && (a = []), !Array.isArray(a)) throw u(r, `Cannot index ${m(a)} with number`);
    if (!Number.isInteger(r)) throw u(r, `Cannot index array with number (${y(r)}) — array indices must be integers`);
    const p = r < 0 ? a.length + r : r;
    if (p < 0) throw u(r, "Out of bounds negative array index");
    const h = a.slice();
    for (; h.length < p; ) h.push(null);
    return h[p] = M(h[p] ?? null, i, t), h;
  }
  let o = e;
  if (o === null && (o = []), !Array.isArray(o)) throw u(e, `Cannot slice ${m(e)} (${y(e)})`);
  if (i.length > 0) throw u(null, "Invalid path expression");
  if (!Array.isArray(t)) throw u(t, "A slice of an array can only be assigned another array");
  const s = U(r.start, "start", o.length), l = U(r.end, "end", o.length);
  return [...o.slice(0, s), ...t, ...o.slice(l)];
}
function pe(e, n) {
  if (n.length === 0) return null;
  const t = n[0];
  if (n.length === 1) {
    if (typeof t == "string") {
      if (!g(e) || !(t in e)) return e;
      const { [t]: l, ...a } = e;
      return a;
    }
    if (typeof t == "number") {
      if (!Array.isArray(e) || !Number.isInteger(t)) return e;
      const l = t < 0 ? e.length + t : t;
      return l < 0 || l >= e.length ? e : [...e.slice(0, l), ...e.slice(l + 1)];
    }
    if (!Array.isArray(e)) return e;
    const o = U(t.start, "start", e.length), s = U(t.end, "end", e.length);
    return s <= o ? e : [...e.slice(0, o), ...e.slice(s)];
  }
  const r = typeof t == "string" || typeof t == "number" ? z(e, t) : ue(e, t.start, t.end), i = pe(r, n.slice(1));
  if (i === r) return e;
  if (typeof t == "string") return { ...e, [t]: i };
  if (typeof t == "number") {
    const o = e, s = t < 0 ? o.length + t : t, l = o.slice();
    for (; l.length < s; ) l.push(null);
    return l[s] = i, l;
  }
  return e;
}
function* O(e, n, t, r) {
  switch (e.t) {
    case "id":
      yield [...r];
      return;
    case "field": {
      ut(n, e.name), yield [...r, e.name];
      return;
    }
    case "index":
      for (const i of f(e.key, n, t))
        pt(n, i), yield [...r, i];
      return;
    case "slice":
      for (const i of e.lo !== null ? f(e.lo, n, t) : X(null))
        for (const o of e.hi !== null ? f(e.hi, n, t) : X(null)) {
          if (n !== null && !Array.isArray(n) && typeof n != "string") throw u(n, `Cannot slice ${m(n)} (${y(n)})`);
          yield [...r, { start: Ae(i), end: Ae(o) }];
        }
      return;
    case "iter": {
      if (Array.isArray(n))
        for (let i = 0; i < n.length; i++) yield [...r, i];
      else if (g(n))
        for (const i of Object.keys(n)) yield [...r, i];
      else throw v(n);
      return;
    }
    case "pipe":
      for (const i of O(e.l, n, t, r)) {
        const o = G(n, i.slice(r.length));
        yield* O(e.r, o, t, i);
      }
      return;
    case "comma":
      yield* O(e.l, n, t, r), yield* O(e.r, n, t, r);
      return;
    case "try":
      try {
        yield* O(e.body, n, t, r);
      } catch (i) {
        if (!(i instanceof T)) throw i;
      }
      return;
    case "if":
      yield* Ue(e.clauses, e.els, 0, n, t, r);
      return;
    case "call": {
      if (e.name === "select" && e.args.length === 1) {
        for (const o of f(e.args[0], n, t)) A(o) && (yield [...r]);
        return;
      }
      if (e.name === "empty" && e.args.length === 0) return;
      if (e.name === "recurse" && e.args.length === 0) {
        yield* le(n, r);
        return;
      }
      if (e.name === "getpath" && e.args.length === 1) {
        for (const o of f(e.args[0], n, t)) yield [...r, ...ee(o)];
        return;
      }
      const i = Me(t, e.name, e.args.length);
      if (i !== null) {
        yield* se(i, 0, e.args, n, t, i.paramClosure === !0 ? i.defEnv : W(i.defEnv, i), r);
        return;
      }
      throw u(null, "Invalid path expression");
    }
    default:
      throw u(null, "Invalid path expression");
  }
}
function* se(e, n, t, r, i, o, s) {
  if (n === e.params.length) {
    yield* O(e.body, r, o, s);
    return;
  }
  const l = e.params[n];
  if (l.dollar)
    for (const a of f(t[n], r, i)) yield* se(e, n + 1, t, r, i, q(o, l.name, a), s);
  else
    yield* se(e, n + 1, t, r, i, W(o, { name: l.name, arity: 0, params: [], body: t[n], defEnv: i, paramClosure: !0 }), s);
}
function* Ue(e, n, t, r, i, o) {
  if (t === e.length) {
    n !== null ? yield* O(n, r, i, o) : yield [...o];
    return;
  }
  const { cond: s, then: l } = e[t];
  for (const a of f(s, r, i))
    A(a) ? yield* O(l, r, i, o) : yield* Ue(e, n, t + 1, r, i, o);
}
function* le(e, n) {
  if (yield [...n], Array.isArray(e))
    for (let t = 0; t < e.length; t++) yield* le(e[t], [...n, t]);
  else if (g(e))
    for (const t of Object.keys(e)) yield* le(e[t], [...n, t]);
}
function ut(e, n) {
  if (!(e === null || g(e)))
    throw u(n, `Cannot index ${m(e)} with "${n}"`);
}
function pt(e, n) {
  if (e !== null) {
    if (typeof n == "string" && !g(e)) throw u(n, `Cannot index ${m(e)} with "${n}"`);
    if (typeof n == "number" && !Array.isArray(e)) throw u(n, `Cannot index ${m(e)} with number`);
  }
}
function Ae(e) {
  if (e === null) return null;
  if (typeof e != "number") throw u(e, "Slice boundaries must be numbers in a path expression");
  return Math.floor(e);
}
const V = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function ht(e) {
  const n = new TextEncoder().encode(e);
  let t = "";
  for (let r = 0; r < n.length; r += 3) {
    const i = n[r], o = n[r + 1], s = n[r + 2];
    t += V[i >> 2], t += V[(i & 3) << 4 | (o ?? 0) >> 4], t += o === void 0 ? "=" : V[(o & 15) << 2 | (s ?? 0) >> 6], t += s === void 0 ? "=" : V[s & 63];
  }
  return t;
}
function dt(e) {
  const n = e.replace(/[\s=]+/g, ""), t = [];
  let r = 0, i = 0;
  for (const o of n) {
    const s = V.indexOf(o);
    if (s === -1) throw u(e, `${y(e)} is not valid base64`);
    r = r << 6 | s, i += 6, i >= 8 && (i -= 8, t.push(r >> i & 255));
  }
  return new TextDecoder("utf-8", { fatal: !1 }).decode(new Uint8Array(t));
}
function _e(e, n) {
  switch (e) {
    case "text":
      return _(n);
    case "json":
      return y(n);
    case "base64":
      return ht(_(n));
    case "base64d":
      return dt(j(n, "@base64d"));
    case "uri":
      return encodeURIComponent(_(n));
    case "html":
      return _(n).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    case "csv":
      return $(n, "@csv").map((r) => {
        if (r === null) return "";
        if (typeof r == "boolean") return r ? "true" : "false";
        if (typeof r == "number") return String(r);
        if (typeof r == "string") return `"${r.replace(/"/g, '""')}"`;
        throw u(r, `@csv: cannot format ${m(r)} (${y(r)})`);
      }).join(",");
    case "tsv":
      return $(n, "@tsv").map((r) => {
        if (r === null) return "";
        if (typeof r == "boolean") return r ? "true" : "false";
        if (typeof r == "number") return String(r);
        if (typeof r == "string") return r.replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        throw u(r, `@tsv: cannot format ${m(r)} (${y(r)})`);
      }).join("	");
    default:
      throw u(e, `@${e} is not a known format`);
  }
}
function Se(e, n, t) {
  for (const r of f(e, n, t)) return { ok: !0, value: r };
  return { ok: !1, value: null };
}
function he(e, n, t) {
  return e.map((r) => ({ el: r, key: D(n, r, t) })).sort((r, i) => b(r.key, i.key));
}
const F = /* @__PURE__ */ new Map();
function c(e, n, t) {
  F.set(`${e}/${n}`, t);
}
c("empty", 0, function* () {
});
c("error", 0, function* (e) {
  throw u(e, _(e));
});
c("error", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) throw u(r, _(r));
});
c("not", 0, function* (e) {
  yield !A(e);
});
c("length", 0, function* (e) {
  if (e === null) yield 0;
  else {
    if (typeof e == "boolean") throw u(e, `${m(e)} (${y(e)}) has no length`);
    typeof e == "number" ? yield Math.abs(e) : typeof e == "string" ? yield [...e].length : g(e) ? yield Object.keys(e).length : yield e.length;
  }
});
c("utf8bytelength", 0, function* (e) {
  yield new TextEncoder().encode(j(e, "utf8bytelength")).length;
});
c("keys", 0, function* (e) {
  if (g(e)) yield Object.keys(e).sort();
  else if (Array.isArray(e)) yield e.map((n, t) => t);
  else throw u(e, `${m(e)} (${y(e)}) has no keys`);
});
c("keys_unsorted", 0, function* (e) {
  if (g(e)) yield Object.keys(e);
  else if (Array.isArray(e)) yield e.map((n, t) => t);
  else throw u(e, `${m(e)} (${y(e)}) has no keys`);
});
c("values", 0, function* (e) {
  e !== null && (yield e);
});
c("has", 1, function* (e, [n], t) {
  for (const r of f(n, e, t))
    if (g(e)) yield typeof r == "string" && r in e;
    else if (Array.isArray(e)) yield typeof r == "number" && Number.isInteger(r) && r >= 0 && r < e.length;
    else throw u(r, `Cannot check whether ${m(e)} has a key of type ${m(r)}`);
});
c("contains", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) yield K(e, r);
});
c("inside", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) yield K(r, e);
});
c("type", 0, function* (e) {
  yield m(e);
});
c("tostring", 0, function* (e) {
  yield _(e);
});
c("tonumber", 0, function* (e) {
  if (typeof e == "number") yield e;
  else if (typeof e == "string") {
    const n = Number(e);
    if (e.trim() === "" || Number.isNaN(n)) throw u(e, `Cannot parse '${e}' as number`);
    yield n;
  } else throw u(e, `${m(e)} (${y(e)}) cannot be parsed as a number`);
});
c("tojson", 0, function* (e) {
  yield y(e);
});
c("fromjson", 0, function* (e) {
  const n = j(e, "fromjson");
  try {
    yield $t(n);
  } catch (t) {
    throw t instanceof T ? t : u(n, `${y(n)} cannot be parsed as JSON: ${t.message}`);
  }
});
c("add", 0, function* (e) {
  let n = null;
  for (const t of Z(e)) n = oe("+", n, t);
  yield n;
});
c("any", 0, function* (e) {
  let n = !1;
  for (const t of Z(e)) A(t) && (n = !0);
  yield n;
});
c("all", 0, function* (e) {
  let n = !0;
  for (const t of Z(e)) A(t) || (n = !1);
  yield n;
});
c("range", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) {
    const i = N(r, "range");
    for (let o = 0; o < i; o++) yield o;
  }
});
c("range", 2, function* (e, [n, t], r) {
  for (const i of f(n, e, r))
    for (const o of f(t, e, r)) {
      const s = N(i, "range"), l = N(o, "range");
      for (let a = s; a < l; a++) yield a;
    }
});
c("range", 3, function* (e, [n, t, r], i) {
  for (const o of f(n, e, i))
    for (const s of f(t, e, i))
      for (const l of f(r, e, i)) {
        const a = N(o, "range"), p = N(s, "range"), h = N(l, "range");
        if (h === 0) throw u(l, "range with step 0");
        if (h > 0) for (let w = a; w < p; w += h) yield w;
        else for (let w = a; w > p; w += h) yield w;
      }
});
const B = (e, n) => c(e, 0, function* (t) {
  yield n(N(t, e));
});
B("floor", Math.floor);
B("ceil", Math.ceil);
B("round", Math.round);
B("sqrt", (e) => e < 0 ? NaN : Math.sqrt(e));
B("fabs", Math.abs);
c("min", 0, function* (e) {
  const n = $(e, "min");
  n.length === 0 ? yield null : yield n.reduce((t, r) => b(r, t) < 0 ? r : t);
});
c("max", 0, function* (e) {
  const n = $(e, "max");
  n.length === 0 ? yield null : yield n.reduce((t, r) => b(r, t) > 0 ? r : t);
});
c("min_by", 1, function* (e, [n], t) {
  const r = $(e, "min_by");
  r.length === 0 ? yield null : yield r.reduce((i, o) => b(D(n, o, t), D(n, i, t)) < 0 ? o : i);
});
c("max_by", 1, function* (e, [n], t) {
  const r = $(e, "max_by");
  r.length === 0 ? yield null : yield r.reduce((i, o) => b(D(n, o, t), D(n, i, t)) > 0 ? o : i);
});
c("sort", 0, function* (e) {
  yield [...$(e, "sort")].sort(b);
});
c("sort_by", 1, function* (e, [n], t) {
  yield he($(e, "sort_by"), n, t).map((r) => r.el);
});
c("group_by", 1, function* (e, [n], t) {
  const r = he($(e, "group_by"), n, t), i = [];
  let o = null, s = null;
  for (const { el: l, key: a } of r)
    o === null || s === null || b(a, s) !== 0 ? (o = [l], s = a, i.push(o)) : o.push(l);
  yield i;
});
c("unique", 0, function* (e) {
  const n = [...$(e, "unique")].sort(b), t = [];
  for (const r of n) (t.length === 0 || b(t[t.length - 1], r) !== 0) && t.push(r);
  yield t;
});
c("unique_by", 1, function* (e, [n], t) {
  const r = he($(e, "unique_by"), n, t), i = [];
  let o = null;
  for (const { el: s, key: l } of r)
    (o === null || b(l, o) !== 0) && (i.push(s), o = l);
  yield i;
});
c("reverse", 0, function* (e) {
  if (e === null) yield [];
  else if (Array.isArray(e)) yield [...e].reverse();
  else if (typeof e == "string") yield [...e].reverse().join("");
  else throw u(e, `Cannot reverse ${m(e)} (${y(e)})`);
});
c("flatten", 0, function* (e) {
  yield de(e, 1 / 0, "flatten");
});
c("flatten", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) yield de(e, N(r, "flatten"), "flatten");
});
function de(e, n, t) {
  const r = $(e, t);
  if (n < 0) return r;
  const i = [];
  for (const o of r)
    Array.isArray(o) && n > 0 ? i.push(...de(o, n - 1, t)) : i.push(o);
  return i;
}
c("first", 0, function* (e) {
  yield z(e, 0);
});
c("first", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) {
    yield r;
    return;
  }
});
c("last", 0, function* (e) {
  yield z(e, -1);
});
c("join", 1, function* (e, [n], t) {
  const r = $(e, "join");
  for (const i of f(n, e, t)) {
    const o = _(i);
    yield r.map((s) => {
      if (s === null) return "";
      if (typeof s == "string") return s;
      if (typeof s == "boolean" || typeof s == "number") return _(s);
      throw u(s, `Cannot join with ${m(s)} (${y(s)})`);
    }).join(o);
  }
});
c("split", 1, function* (e, [n], t) {
  const r = j(e, "split");
  for (const i of f(n, e, t)) {
    const o = j(i, "split");
    if (o === "") throw u(o, "split input and separator must not be empty");
    yield r.split(o);
  }
});
c("ltrimstr", 1, function* (e, [n], t) {
  if (typeof e != "string") yield e;
  else
    for (const r of f(n, e, t))
      yield typeof r == "string" && e.startsWith(r) ? e.slice(r.length) : e;
});
c("rtrimstr", 1, function* (e, [n], t) {
  if (typeof e != "string") yield e;
  else
    for (const r of f(n, e, t))
      yield typeof r == "string" && r !== "" && e.endsWith(r) ? e.slice(0, e.length - r.length) : e;
});
c("startswith", 1, function* (e, [n], t) {
  const r = j(e, "startswith");
  for (const i of f(n, e, t)) yield r.startsWith(j(i, "startswith"));
});
c("endswith", 1, function* (e, [n], t) {
  const r = j(e, "endswith");
  for (const i of f(n, e, t)) yield r.endsWith(j(i, "endswith"));
});
c("ascii_downcase", 0, function* (e) {
  yield j(e, "ascii_downcase").replace(/[A-Z]/g, (n) => n.toLowerCase());
});
c("ascii_upcase", 0, function* (e) {
  yield j(e, "ascii_upcase").replace(/[a-z]/g, (n) => n.toUpperCase());
});
c("to_entries", 0, function* (e) {
  if (!g(e)) throw u(e, `to_entries requires an object, got ${m(e)} (${y(e)})`);
  yield Object.entries(e).map(([n, t]) => ({ key: n, value: t }));
});
c("from_entries", 0, function* (e) {
  const n = $(e, "from_entries"), t = {};
  for (const r of n) {
    if (!g(r)) throw u(r, `from_entries: entry ${y(r)} is not an object`);
    const i = ("key" in r ? r.key : "k" in r ? r.k : "name" in r ? r.name : "Name" in r ? r.Name : null) ?? null;
    if (i === null) throw u(r, `from_entries: entry ${y(r)} has no key`);
    const o = typeof i == "string" ? i : _(i);
    t[o] = "value" in r ? r.value : "v" in r ? r.v : null;
  }
  yield t;
});
c("with_entries", 1, function* (e, [n], t) {
  if (!g(e)) throw u(e, `with_entries requires an object, got ${m(e)} (${y(e)})`);
  const r = Object.entries(e).map(([s, l]) => ({ key: s, value: l })), i = [];
  for (const s of r) for (const l of f(n, s, t)) i.push(l);
  const o = {};
  for (const s of i) {
    if (!g(s)) throw u(s, `with_entries: mapped entry ${y(s)} is not an object`);
    const l = ("key" in s ? s.key : "k" in s ? s.k : "name" in s ? s.name : null) ?? null;
    if (l === null) throw u(s, `with_entries: mapped entry ${y(s)} has no key`);
    o[typeof l == "string" ? l : _(l)] = "value" in s ? s.value : null;
  }
  yield o;
});
c("select", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) A(r) && (yield e);
});
c("map", 1, function* (e, [n], t) {
  const r = [];
  for (const i of Z(e)) for (const o of f(n, i, t)) r.push(o);
  yield r;
});
c("map_values", 1, function* (e, [n], t) {
  if (Array.isArray(e)) {
    const r = [];
    for (const i of e) {
      const o = Se(n, i, t);
      o.ok && r.push(o.value);
    }
    yield r;
  } else if (g(e)) {
    const r = {};
    for (const [i, o] of Object.entries(e)) {
      const s = Se(n, o, t);
      s.ok && (r[i] = s.value);
    }
    yield r;
  } else throw v(e);
});
c("path", 1, function* (e, [n], t) {
  for (const r of O(n, e, t, [])) yield r;
});
c("getpath", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) yield G(e, ee(r));
});
c("setpath", 2, function* (e, [n, t], r) {
  for (const i of f(n, e, r)) {
    const o = ee(i);
    for (const s of f(t, e, r)) yield M(e, o, s);
  }
});
c("delpaths", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) {
    const o = [...$(r, "delpaths")].sort((l, a) => b(a, l));
    let s = e;
    for (const l of o) s = pe(s, ee(l));
    yield s;
  }
});
c("indices", 1, function* (e, [n], t) {
  for (const r of f(n, e, t)) {
    if (e === null) {
      yield null;
      continue;
    }
    if (typeof e == "string") {
      if (typeof r != "string") throw u(r, `Cannot get indices of ${m(r)} in string`);
      yield r === "" ? [] : yt(e, r);
    } else if (Array.isArray(e)) {
      const i = Array.isArray(r) ? r : [r];
      if (i.length === 0) {
        yield null;
        continue;
      }
      const o = [];
      for (let s = 0; s + i.length <= e.length; s++) {
        let l = !0;
        for (let a = 0; a < i.length; a++)
          if (b(e[s + a], i[a]) !== 0) {
            l = !1;
            break;
          }
        l && o.push(s);
      }
      yield o;
    } else throw u(r, `Cannot get indices of ${m(e)}`);
  }
});
function yt(e, n) {
  const t = new Ce(e), r = [];
  let i = 0;
  for (; ; ) {
    const o = e.indexOf(n, i);
    if (o === -1) return r;
    r.push(t.cp(o)), i = o + n.length;
  }
}
c("index", 1, function* (e, [n], t) {
  for (const r of Ve(e, n, t)) yield Array.isArray(r) && r.length > 0 ? r[0] : null;
});
c("rindex", 1, function* (e, [n], t) {
  for (const r of Ve(e, n, t)) yield Array.isArray(r) && r.length > 0 ? r[r.length - 1] : null;
});
function* Ve(e, n, t) {
  yield* F.get("indices/1")(e, [n], t);
}
c("transpose", 0, function* (e) {
  const n = $(e, "transpose");
  let t = 0;
  for (const i of n) {
    if (!Array.isArray(i)) throw v(i);
    i.length > t && (t = i.length);
  }
  const r = Array.from({ length: t }, () => []);
  for (const i of n) {
    const o = i;
    for (let s = 0; s < t; s++) r[s].push(s < o.length ? o[s] : null);
  }
  yield r;
});
c("explode", 0, function* (e) {
  yield [...j(e, "explode")].map((n) => n.codePointAt(0));
});
c("implode", 0, function* (e) {
  const n = $(e, "implode");
  let t = "";
  for (const r of n) {
    if (typeof r != "number" || !Number.isInteger(r)) throw u(r, `implode input must be an array of numbers (${y(r)} given)`);
    if (r < 0 || r > 1114111 || r >= 55296 && r <= 57343) throw u(r, `${r} is not a valid codepoint for implode`);
    t += String.fromCodePoint(r);
  }
  yield t;
});
c("ascii", 0, function* (e) {
  const n = N(e, "ascii");
  if (!Number.isInteger(n) || n < 0 || n > 1114111) throw u(e, `${n} is not a valid codepoint for ascii`);
  yield String.fromCodePoint(n);
});
c("env", 0, function* () {
  yield { ...x.env };
});
c("input", 0, function* () {
  if (x.nextInput === null) throw u(null, "No more inputs");
  const e = x.nextInput();
  if (e === null) throw u(null, "No more inputs");
  yield e;
});
c("inputs", 0, function* () {
  if (x.nextInput === null) throw u(null, "No more inputs");
  for (; ; ) {
    const e = x.nextInput();
    if (e === null) return;
    yield e;
  }
});
c("input_filename", 0, function* () {
  yield x.filename;
});
c("halt", 0, function* () {
  throw new Q(0, null);
});
c("halt_error", 0, function* (e) {
  throw new Q(5, e);
});
c("halt_error", 1, function* (e, [n], t) {
  for (const r of f(n, e, t))
    throw typeof r != "number" || !Number.isInteger(r) || r < 0 || r > 255 ? u(r, "halt_error/1: number between 0 and 255 required") : new Q(r, e);
});
function* S(e, n, t, r) {
  for (const i of f(n, e, r)) {
    const o = E(i);
    if (t === null) {
      yield xe(o, null);
      continue;
    }
    for (const s of f(t, e, r)) {
      if (s !== null && typeof s != "string") throw u(s, `${y(s)} is not a valid modifier string`);
      yield xe(o, s);
    }
  }
}
c("test", 1, function* (e, [n], t) {
  const r = E(e);
  for (const i of S(e, n, null, t)) yield P(r, i).next().done !== !0;
});
c("test", 2, function* (e, [n, t], r) {
  const i = E(e);
  for (const o of S(e, n, t, r)) yield P(i, o).next().done !== !0;
});
c("match", 1, function* (e, [n], t) {
  const r = E(e);
  for (const i of S(e, n, null, t)) yield* De(r, i);
});
c("match", 2, function* (e, [n, t], r) {
  const i = E(e);
  for (const o of S(e, n, t, r)) yield* De(i, o);
});
function* De(e, n) {
  for (const t of P(e, n)) yield at(e, t, n);
}
c("capture", 1, function* (e, [n], t) {
  const r = E(e);
  for (const i of S(e, n, null, t))
    for (const o of P(r, i)) yield L(o, i);
});
c("capture", 2, function* (e, [n, t], r) {
  const i = E(e);
  for (const o of S(e, n, t, r))
    for (const s of P(i, o)) yield L(s, o);
});
c("scan", 1, function* (e, [n], t) {
  const r = E(e);
  for (const i of S(e, n, null, t))
    for (const o of P(r, { ...i, global: !0 })) yield Je(i) ? L(o, i) : o.m[0];
});
c("scan", 2, function* (e, [n, t], r) {
  const i = E(e);
  for (const o of S(e, n, t, r))
    for (const s of P(i, { ...o, global: !0 })) yield Je(o) ? L(s, o) : s.m[0];
});
c("split", 2, function* (e, [n, t], r) {
  const i = j(e, "split");
  for (const o of S(e, n, t, r)) yield Re(i, o);
});
c("splits", 2, function* (e, [n, t], r) {
  const i = j(e, "splits");
  for (const o of S(e, n, t, r)) yield* Re(i, o);
});
function* te(e, n, t, r, i, o) {
  const s = E(e);
  for (const l of S(e, n, t, i)) {
    const a = o || l.global, p = [...P(s, { ...l, global: !0 })], h = a ? p : p.slice(0, 1);
    yield* Fe(s, h, 0, 0, "", r, i, l);
  }
}
function* Fe(e, n, t, r, i, o, s, l) {
  if (t === n.length) {
    yield i + e.slice(r);
    return;
  }
  const { m: a, cp: p } = n[t], h = e.slice(r, a.index), w = L({ m: a, cp: p }, l);
  for (const d of f(o, w, s)) {
    if (typeof d != "string") throw u(d, `sub/gsub replacement must be a string (${y(d)} given)`);
    yield* Fe(e, n, t + 1, a.index + a[0].length, i + h + d, o, s, l);
  }
}
c("sub", 2, function* (e, [n, t], r) {
  yield* te(e, n, null, t, r, !1);
});
c("sub", 3, function* (e, [n, t, r], i) {
  yield* te(e, n, r, t, i, !1);
});
c("gsub", 2, function* (e, [n, t], r) {
  yield* te(e, n, null, t, r, !0);
});
c("gsub", 3, function* (e, [n, t, r], i) {
  yield* te(e, n, r, t, i, !0);
});
const mt = [
  "def recurse(f): def r: ., (f | r); r;",
  "def recurse: recurse(.[]?);",
  'def objects: select(type == "object");',
  'def arrays: select(type == "array");',
  'def booleans: select(type == "boolean");',
  'def numbers: select(type == "number");',
  'def strings: select(type == "string");',
  'def nulls: select(type == "null");',
  'def iterables: select(type == "array" or type == "object");',
  'def scalars: select(type != "array" and type != "object");',
  'def leaf_paths: paths(. != null and type != "array" and type != "object");',
  "def paths: path(..) | select(length > 0);",
  "def paths(node_filter): . as $in | paths | select(. as $p | $in | getpath($p) | node_filter);",
  "def del(path_filter): delpaths([path(path_filter)]);",
  'def walk(f): . as $in | if type == "object" then reduce keys_unsorted[] as $key ({}; . + {($key): ($in[$key] | walk(f))}) | f elif type == "array" then map(walk(f)) | f else f end;',
  // first(f) is a native builtin: the classic `label $out | (f, break $out)`
  // prelude def needs comma semantics jq's VM has (the break preempts f's
  // remaining outputs) that a pull-driven comma cannot reproduce.
  "def last(f): reduce f as $x (null; $x);",
  "def until(cond; update): def _until: if cond then . else (update | _until) end; _until;",
  "def while(cond; update): def _while: if cond then ., (update | _while) else empty end; _while;",
  "def repeat(f): def _repeat: f as $x | $x, ($x | _repeat); _repeat;",
  "def limit($n; f): if $n > 0 then label $out | foreach f as $item (0; . + 1; $item, if . >= $n then break $out else empty end) elif $n == 0 then empty else f end;",
  "def abs: if . < 0 then - . else . end;",
  'def toarray: if type == "array" then . else [.] end;',
  "def any(generator; condition): reduce (generator | condition) as $v (false; . or $v);",
  "def any(condition): any(.[]; condition);",
  "def all(generator; condition): reduce (generator | condition) as $v (true; . and $v);",
  "def all(condition): all(.[]; condition);",
  "def add(f): reduce f as $x (null; . + $x);",
  "def splits($re): splits($re; null);",
  "def ascii: [.] | implode;"
].join(`
`), Le = (() => {
  const e = Ie(`${mt}
empty`), n = [];
  let t = e;
  for (; t.t === "def"; )
    n.push({ k: "fn", name: t.name, arity: t.params.length, params: t.params, body: t.body, defEnv: null, parent: null }), t = t.rest;
  let r = null;
  for (let i = n.length - 1; i >= 0; i--)
    r = { ...n[i], parent: r }, n[i] = r;
  for (const i of n) i.defEnv = r;
  return r;
})(), We = (() => {
  const e = /* @__PURE__ */ new Set();
  for (let n = Le; n !== null && n.k === "fn"; n = n.parent) e.add(`${n.name}/${n.arity}`);
  return e;
})(), Oe = /* @__PURE__ */ new Set([...F.keys(), ...We]);
function gt(e, n) {
  let t = q(Le, "ENV", n);
  for (const [r, i] of e) t = q(t, r, i);
  return t;
}
const Ee = 400;
function* wt(e, n, t, r) {
  if (x.depth++, x.depth > Ee)
    throw x.depth--, u(null, `jq recursion limit exceeded (over ${Ee} nested function calls)`);
  try {
    const i = e.paramClosure === !0 ? e.defEnv : W(e.defEnv, e);
    yield* ae(e, 0, n, t, r, i);
  } finally {
    x.depth--;
  }
}
function* ae(e, n, t, r, i, o) {
  if (n === e.params.length) {
    yield* f(e.body, r, o);
    return;
  }
  const s = e.params[n];
  if (s.dollar)
    for (const l of f(t[n], r, i)) yield* ae(e, n + 1, t, r, i, q(o, s.name, l));
  else
    yield* ae(e, n + 1, t, r, i, W(o, { name: s.name, arity: 0, params: [], body: t[n], defEnv: i, paramClosure: !0 }));
}
function* f(e, n, t) {
  switch (e.t) {
    case "id":
      yield n;
      return;
    case "lit":
      yield e.v;
      return;
    case "str":
      yield* H(e.parts, 0, "", n, t, _);
      return;
    case "fmtnstr":
      yield* H(e.parts, 0, "", n, t, (r) => {
        const i = _e(e.name, r);
        return j(i, `@${e.name}`);
      });
      return;
    case "field": {
      if (n === null) yield null;
      else if (g(n)) yield n[e.name] ?? null;
      else throw u(e.name, `Cannot index ${m(n)} with "${e.name}"`);
      return;
    }
    case "index":
      for (const r of f(e.key, n, t)) yield z(n, r);
      return;
    case "slice":
      for (const r of e.lo !== null ? f(e.lo, n, t) : X(null))
        for (const i of e.hi !== null ? f(e.hi, n, t) : X(null)) yield ue(n, r, i);
      return;
    case "iter":
      yield* Z(n);
      return;
    case "pipe":
      for (const r of f(e.l, n, t)) yield* f(e.r, r, t);
      return;
    case "comma":
      yield* f(e.l, n, t), yield* f(e.r, n, t);
      return;
    case "alt": {
      let r = !1;
      for (const i of f(e.l, n, t))
        A(i) && (r = !0, yield i);
      r || (yield* f(e.r, n, t));
      return;
    }
    case "or":
      for (const r of f(e.l, n, t))
        if (A(r)) yield !0;
        else for (const i of f(e.r, n, t)) yield A(i);
      return;
    case "and":
      for (const r of f(e.l, n, t))
        if (!A(r)) yield !1;
        else for (const i of f(e.r, n, t)) yield A(i);
      return;
    case "binop": {
      const { op: r } = e;
      if (r === "==" || r === "!=") {
        for (const i of f(e.r, n, t))
          for (const o of f(e.l, n, t)) yield r === "==" ? b(o, i) === 0 : b(o, i) !== 0;
        return;
      }
      if (r === "<" || r === "<=" || r === ">" || r === ">=") {
        for (const i of f(e.r, n, t))
          for (const o of f(e.l, n, t)) {
            const s = b(o, i);
            yield r === "<" ? s < 0 : r === "<=" ? s <= 0 : r === ">" ? s > 0 : s >= 0;
          }
        return;
      }
      for (const i of f(e.r, n, t)) for (const o of f(e.l, n, t)) yield oe(r, o, i);
      return;
    }
    case "neg":
      for (const r of f(e.e, n, t)) {
        if (typeof r != "number") throw u(r, `${m(r)} (${y(r)}) cannot be negated`);
        yield -r;
      }
      return;
    case "try": {
      if (e.catch_ === null) {
        try {
          yield* f(e.body, n, t);
        } catch (i) {
          if (!(i instanceof T)) throw i;
        }
        return;
      }
      const r = f(e.body, n, t);
      for (; ; ) {
        let i;
        try {
          i = r.next();
        } catch (o) {
          if (!(o instanceof T)) throw o;
          yield* f(e.catch_, o.value, t);
          return;
        }
        if (i.done) return;
        yield i.value;
      }
    }
    case "if":
      yield* ze(e.clauses, e.els, 0, n, t);
      return;
    case "reduce": {
      for (const r of f(e.init, n, t)) {
        let i = r;
        for (const o of f(e.src, n, t)) {
          const s = q(t, e.name, o);
          let l;
          for (const a of f(e.update, i, s)) l = a;
          l !== void 0 && (i = l);
        }
        yield i;
      }
      return;
    }
    case "foreach": {
      for (const r of f(e.init, n, t)) {
        let i = r;
        for (const o of f(e.src, n, t)) {
          const s = q(t, e.name, o);
          let l;
          for (const a of f(e.update, i, s))
            l = a, yield* f(e.extract ?? { t: "id" }, a, s);
          l !== void 0 && (i = l);
        }
      }
      return;
    }
    case "as":
      for (const r of f(e.src, n, t)) yield* f(e.body, n, q(t, e.name, r));
      return;
    case "def": {
      const r = W(t, { name: e.name, arity: e.params.length, params: e.params, body: e.body, defEnv: t });
      yield* f(e.rest, n, r);
      return;
    }
    case "label": {
      const r = {}, i = { k: "label", name: e.name, marker: r, parent: t };
      try {
        yield* f(e.body, n, i);
      } catch (o) {
        if (o instanceof je && o.marker === r) return;
        throw o;
      }
      return;
    }
    case "break": {
      for (let r = t; r !== null; r = r.parent)
        if (r.k === "label" && r.name === e.name) throw new je(r.marker);
      throw u(null, `$*${e.name} is not defined (break must be inside a matching label)`);
    }
    case "assign": {
      const r = [];
      for (const s of O(e.lhs, n, t, [])) r.push(s);
      if (e.op === "=") {
        for (const s of f(e.rhs, n, t)) {
          let l = n;
          for (const a of r) l = M(l, a, s);
          yield l;
        }
        return;
      }
      if (e.op === "|=") {
        const s = [...r].sort((a, p) => b(p, a));
        let l = n;
        for (const a of s) {
          const p = G(l, a);
          let h;
          for (const w of f(e.rhs, p, t)) {
            h = w;
            break;
          }
          l = h === void 0 ? pe(l, a) : M(l, a, h);
        }
        yield l;
        return;
      }
      const o = { "+=": "+", "-=": "-", "*=": "*", "/=": "/", "%=": "%" }[e.op];
      for (const s of f(e.rhs, n, t)) {
        let l = n;
        for (const a of r) {
          const p = G(l, a);
          l = M(l, a, o !== void 0 ? oe(o, p, s) : A(p) ? p : s);
        }
        yield l;
      }
      return;
    }
    case "loc":
      yield { file: "<top-level>", line: e.line };
      return;
    case "var":
      yield ct(t, e.name);
      return;
    case "call": {
      const r = Me(t, e.name, e.args.length);
      if (r !== null) {
        yield* wt(r, e.args, n, t);
        return;
      }
      const i = F.get(`${e.name}/${e.args.length}`);
      if (i === void 0) {
        const o = [...F.keys(), ...We].some((s) => s.startsWith(`${e.name}/`));
        throw u(e.name, `${e.name}/${e.args.length} is not defined${o ? ` (only ${e.name} with a different arity exists)` : ""}`);
      }
      yield* i(n, e.args, t);
      return;
    }
    case "array":
      yield e.body === null ? [] : [...f(e.body, n, t)];
      return;
    case "object":
      yield* fe(e.entries, 0, {}, n, t);
      return;
    case "format":
      yield _e(e.name, n);
      return;
  }
}
function* ze(e, n, t, r, i) {
  if (t === e.length) {
    n !== null ? yield* f(n, r, i) : yield r;
    return;
  }
  const { cond: o, then: s } = e[t];
  for (const l of f(o, r, i))
    A(l) ? yield* f(s, r, i) : yield* ze(e, n, t + 1, r, i);
}
function* H(e, n, t, r, i, o) {
  if (n === e.length) {
    yield t;
    return;
  }
  const s = e[n];
  if (typeof s == "string") {
    yield* H(e, n + 1, t + s, r, i, o);
    return;
  }
  for (const l of f(s, r, i)) yield* H(e, n + 1, t + o(l), r, i, o);
}
function* fe(e, n, t, r, i) {
  if (n === e.length) {
    yield { ...t };
    return;
  }
  const { key: o, val: s } = e[n];
  for (const l of f(o, r, i)) {
    if (typeof l != "string") throw u(l, `Object keys must be strings (${y(l)} given)`);
    if (s === null) {
      const a = r === null ? null : g(r) ? r[l] ?? null : null;
      if (r !== null && !g(r)) throw u(r, `Cannot index ${m(r)} with "${l}"`);
      yield* fe(e, n + 1, { ...t, [l]: a }, r, i);
      continue;
    }
    for (const a of f(s, r, i)) yield* fe(e, n + 1, { ...t, [l]: a }, r, i);
  }
}
function bt(e, n) {
  let t = null;
  const r = (i, o, s, l) => {
    if (t === null)
      switch (i.t) {
        case "var":
          o.has(i.name) || (t = `$${i.name} is not defined`);
          return;
        case "call": {
          const a = `${i.name}/${i.args.length}`;
          if (!s.has(a) && !Oe.has(a)) {
            const p = [...Oe].find((h) => h.startsWith(`${i.name}/`));
            t = `${a} is not defined${p !== void 0 ? ` (did you mean ${p}?)` : ""}`;
          }
          for (const p of i.args) r(p, o, s, l);
          return;
        }
        case "as": {
          r(i.src, o, s, l);
          const a = new Set(o);
          a.add(i.name), r(i.body, a, s, l);
          return;
        }
        case "reduce": {
          r(i.src, o, s, l), r(i.init, o, s, l);
          const a = new Set(o);
          a.add(i.name), r(i.update, a, s, l);
          return;
        }
        case "foreach": {
          r(i.src, o, s, l), r(i.init, o, s, l);
          const a = new Set(o);
          a.add(i.name), r(i.update, a, s, l), i.extract !== null && r(i.extract, a, s, l);
          return;
        }
        case "def": {
          const a = new Set(s);
          a.add(`${i.name}/${i.params.length}`);
          const p = new Set(o), h = new Set(a);
          for (const w of i.params)
            w.dollar ? p.add(w.name) : h.add(`${w.name}/0`);
          r(i.body, p, h, l), r(i.rest, o, a, l);
          return;
        }
        case "label": {
          const a = new Set(l);
          a.add(i.name), r(i.body, o, s, a);
          return;
        }
        case "break":
          l.has(i.name) || (t = `$*${i.name} is not defined (break must be inside a matching label)`);
          return;
        case "assign":
          r(i.lhs, o, s, l), r(i.rhs, o, s, l);
          return;
        case "pipe":
        case "comma":
        case "alt":
        case "or":
        case "and":
        case "binop":
          r(i.l, o, s, l), r(i.r, o, s, l);
          return;
        case "try":
          r(i.body, o, s, l), i.catch_ !== null && r(i.catch_, o, s, l);
          return;
        case "if":
          for (const a of i.clauses)
            r(a.cond, o, s, l), r(a.then, o, s, l);
          i.els !== null && r(i.els, o, s, l);
          return;
        case "neg":
          r(i.e, o, s, l);
          return;
        case "index":
          r(i.key, o, s, l);
          return;
        case "slice":
          i.lo !== null && r(i.lo, o, s, l), i.hi !== null && r(i.hi, o, s, l);
          return;
        case "array":
          i.body !== null && r(i.body, o, s, l);
          return;
        case "object":
          for (const a of i.entries)
            r(a.key, o, s, l), a.val !== null && r(a.val, o, s, l);
          return;
        case "str":
          for (const a of i.parts) typeof a != "string" && r(a, o, s, l);
          return;
        case "fmtnstr":
          for (const a of i.parts) typeof a != "string" && r(a, o, s, l);
          return;
        default:
          return;
      }
  };
  return r(e, n, /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()), t;
}
function $t(e) {
  const n = e.trim();
  if (n === "") throw new Error("empty JSON text");
  return JSON.parse(n);
}
function* X(e) {
  yield e;
}
class I extends Error {
  constructor(n, t) {
    super(n), this.offset = t, this.name = "JqJsonError";
  }
}
const Y = (e) => e === " " || e === "	" || e === `
` || e === "\r";
function* Ze(e) {
  const n = e.length;
  let t = 0;
  for (; ; ) {
    for (; t < n && Y(e[t]); ) t++;
    if (t >= n) return;
    const r = t, i = Ke(e, t);
    yield Be(e, r, i), t = i;
  }
}
function kt(e) {
  const n = e.length;
  let t = 0;
  for (; t < n && Y(e[t]); ) t++;
  if (t >= n) throw new I("empty JSON text (offset 0)", 0);
  const r = t, i = Ke(e, t), o = Be(e, r, i);
  let s = i;
  for (; s < n && Y(e[s]); ) s++;
  if (s < n) throw new I(`extra data after JSON value (offset ${s})`, s);
  return o;
}
function Be(e, n, t) {
  try {
    return JSON.parse(e.slice(n, t));
  } catch (r) {
    const i = r.message.replace(/^JSON\.parse: /, "").replace(/ in JSON at position \d+.*$/, "");
    throw new I(`${i} (offset ${n})`, n);
  }
}
function Ke(e, n) {
  const t = e[n], r = e.length;
  if (t === "{" || t === "[") {
    let o = 0, s = n, l = !1;
    for (; s < r; ) {
      const a = e[s];
      if (l)
        a === "\\" ? s++ : a === '"' && (l = !1);
      else if (a === '"') l = !0;
      else if (a === "{" || a === "[") o++;
      else if ((a === "}" || a === "]") && (o--, o === 0))
        return s + 1;
      s++;
    }
    throw new I(`unterminated ${t === "{" ? "object" : "array"} (offset ${n})`, n);
  }
  if (t === '"') {
    let o = n + 1;
    for (; o < r; ) {
      const s = e[o];
      if (s === "\\") o++;
      else if (s === '"') return o + 1;
      o++;
    }
    throw new I(`unterminated string (offset ${n})`, n);
  }
  let i = n;
  for (; i < r && !Y(e[i]) && e[i] !== "," && e[i] !== "]" && e[i] !== "}"; ) i++;
  return i;
}
function Ge(e, n) {
  return n.raw && typeof e == "string" ? e : n.compact ? y(e) : ft(e);
}
const ye = "jq [-rscn] [--arg name value] [--argjson name json] 'FILTER' [file ...]", xt = [
  "Usage: " + ye,
  "",
  "Filter and transform JSON (a jq subset that covers real use).",
  "",
  "Options:",
  "  -r, --raw-output     print strings raw (no quotes)",
  "  -c, --compact-output one line per output",
  "  -s, --slurp          read all inputs into one array",
  "  -n, --null-input     run the filter once with null input",
  "  --arg name value     $name as a string",
  "  --argjson name json  $name as parsed JSON",
  "  -h, --help           this help; --version",
  "",
  'Language: paths (.a.b, .["k"], .[0], slices), .[] iteration, pipe |,',
  "comma, // alternative, and/or/not, comparisons and arithmetic,",
  "if/elif/else/end, try/catch and ?, reduce, foreach, def (incl.",
  "recursion and $params), label/break, .. recursive descent,",
  'EXPR as $x, string interpolation "\\(expr)", @format and',
  '@format "\\(interp)", assignment = |= += -= *= /= %= //=,',
  "$ENV/env, $__loc__, input/inputs/input_filename, halt/halt_error,",
  "regex test match capture scan split/2 splits sub gsub with flags",
  "g i x s m n p, path getpath setpath delpaths del paths leaf_paths,",
  "indices index rindex transpose explode implode ascii tojson,",
  "limit first(f) last(f) until while repeat walk, plus the string,",
  "array and object builtins (select map keys sort_by group_by",
  "unique_by to_entries with_entries has contains inside add range",
  "min max join split startswith endswith ltrimstr rtrimstr",
  "ascii_downcase ascii_upcase tostring tonumber type not empty",
  "error, @csv @tsv @json @base64 @base64d @text @uri @html).",
  "",
  "Not supported: import/include of module files.",
  "",
  "Exit codes: 0 ok · 2 usage/bad input JSON · 3 bad program · 5 runtime",
  "error (later inputs still run); halt/halt_error exit with their code."
], me = "json [-c] [-r] [file ...]", jt = [
  "Usage: " + me,
  "",
  "Pretty-print and validate JSON (the jq pretty-printer under an",
  "obvious name). Reads each file (or the pipe) as a stream of JSON",
  "documents and prints them with 2-space indent; malformed input",
  "reports the offset and exits 2.",
  "",
  "  -c, --compact   one line per document",
  "  -r, --raw       print strings without quotes",
  "  -h, --help      this help"
], At = /^[A-Za-z_][A-Za-z0-9_]*$/;
function _t(e, n, t) {
  const r = [];
  let i = 0, o = !1;
  const s = (l) => {
    if (i >= e.length) throw new Error(`jq: ${l} requires an argument`);
    return e[i++];
  };
  for (; i < e.length; ) {
    const l = e[i++];
    if (o || l === "-" || !l.startsWith("-") || l === "") {
      r.push(l);
      continue;
    }
    if (l === "--") {
      o = !0;
      continue;
    }
    if (l.startsWith("--")) {
      switch (l) {
        case "--help":
          for (const a of xt) n.out(a);
          return n.exit(0), "handled";
        case "--version":
          return n.out(St), n.exit(0), "handled";
        case "--raw-output":
          t.raw = !0;
          break;
        case "--compact-output":
          t.compact = !0;
          break;
        case "--slurp":
          t.slurp = !0;
          break;
        case "--null-input":
          t.nullInput = !0;
          break;
        case "--arg": {
          const a = s("--arg"), p = s("--arg"), h = Ne(a);
          if (h !== null) return h;
          t.vars.set(a, p);
          break;
        }
        case "--argjson": {
          const a = s("--argjson"), p = s("--argjson"), h = Ne(a);
          if (h !== null) return h;
          try {
            t.vars.set(a, kt(p));
          } catch {
            return "jq: Invalid JSON text passed to --argjson";
          }
          break;
        }
        default:
          return `jq: Unknown option: ${l}
Try 'jq --help' for more information.`;
      }
      continue;
    }
    for (const a of l.slice(1))
      switch (a) {
        case "r":
          t.raw = !0;
          break;
        case "c":
          t.compact = !0;
          break;
        case "s":
          t.slurp = !0;
          break;
        case "n":
          t.nullInput = !0;
          break;
        default:
          return `jq: Unknown option: -${a}
Try 'jq --help' for more information.`;
      }
  }
  return t.files = r, null;
}
function Ne(e) {
  return At.test(e) ? null : `jq: Invalid variable name '${e}' passed to --arg/--argjson`;
}
const St = "jq-1.7-semtext (semtext-sh) — a jq subset for the sem-shell";
class He extends Error {
  constructor(n, t) {
    super(n), this.label = t, this.name = "JqDocError";
  }
}
function Ot(e, n) {
  const t = [];
  if (n.length === 0)
    return t.push({ label: "<stdin>", text: e.stdin ?? "" }), t;
  for (const r of n) {
    if (r === "-") {
      if (e.stdin === null)
        return e.err("jq: error: Could not open -: no piped input"), e.exit(2), null;
      t.push({ label: "<stdin>", text: e.stdin });
      continue;
    }
    const i = e.vfs.resolve(e.state.cwd, r), o = e.vfs.nodeAt(i);
    if (o === null)
      return e.err(`jq: error: Could not open ${r}: No such file or directory`), e.exit(2), null;
    if (o.kind === "dir")
      return e.err(`jq: error: Could not open ${r}: Is a directory`), e.exit(2), null;
    t.push({ label: r, text: o.content });
  }
  return t;
}
function Et(e) {
  let n = 0, t = null;
  return {
    next() {
      for (; ; ) {
        if (t === null) {
          if (n >= e.length) return null;
          const i = e[n].label, o = e[n].text;
          t = (function* () {
            try {
              for (const s of Ze(o)) yield { v: s, file: i };
            } catch (s) {
              throw s instanceof I ? new He(s.message, i) : s;
            }
          })();
        }
        const r = t.next();
        if (r.done) {
          t = null, n++;
          continue;
        }
        return r.value;
      }
    }
  };
}
function Xe(e, n, t) {
  const r = Ge(n, t);
  if (r === "") {
    e.out("");
    return;
  }
  for (const i of r.split(`
`)) e.out(i);
}
const Nt = {
  name: "jq",
  usage: ye,
  complete: (e) => ["-r", "-c", "-s", "-n", "--arg", "--argjson", "--raw-output", "--compact-output", "--slurp", "--null-input", "--help", "--version"].filter(
    (n) => n.startsWith(e.word)
  ),
  run(e) {
    const n = { raw: !1, compact: !1, slurp: !1, nullInput: !1, vars: /* @__PURE__ */ new Map(), files: [] };
    let t;
    try {
      t = _t(e.args, e, n);
    } catch (d) {
      e.err(d.message), e.err("Try 'jq --help' for more information."), e.exit(2);
      return;
    }
    if (t === "handled") return;
    if (t !== null) {
      e.err(t), e.exit(2);
      return;
    }
    const r = n.files.shift();
    if (r === void 0) {
      e.err("jq: error: no filter given"), e.err("Try 'jq --help' for more information."), e.exit(2);
      return;
    }
    let i;
    try {
      i = Ie(r);
      const d = bt(i, /* @__PURE__ */ new Set([...n.vars.keys(), "ENV"]));
      if (d !== null) {
        e.err(`jq: error: ${d}`), e.exit(3);
        return;
      }
    } catch (d) {
      if (d instanceof ce) {
        e.err(`jq: error: ${d.message}`), e.exit(3);
        return;
      }
      throw d;
    }
    const o = Ot(e, n.files);
    if (o === null) return;
    const s = Et(o);
    let l = null;
    if (n.nullInput) l = [{ v: null, file: null }];
    else if (n.slurp) {
      const d = [];
      for (; ; ) {
        const k = s.next();
        if (k === null) break;
        d.push(k.v);
      }
      l = [{ v: d, file: null }];
    }
    x.env = { ...e.state.env }, x.depth = 0, x.nextInput = () => {
      const d = s.next();
      return d === null ? null : d.v;
    };
    const a = gt(n.vars.entries(), x.env);
    let p = 0;
    const h = () => l !== null ? p < l.length ? l[p++] : null : s.next();
    let w = !1;
    try {
      for (; ; ) {
        const d = h();
        if (d === null) break;
        x.filename = d.file;
        try {
          for (const k of f(i, d.v, a)) Xe(e, k, n);
        } catch (k) {
          if (k instanceof T) {
            e.err(`jq: error: ${k.jqMessage}`), w = !0;
            continue;
          }
          if (k instanceof RangeError) {
            e.err("jq: error: recursion limit exceeded"), w = !0;
            continue;
          }
          throw k;
        }
      }
    } catch (d) {
      if (d instanceof He) {
        e.err(`jq: error (at ${d.label}): ${d.message}`), e.exit(2);
        return;
      }
      if (d instanceof Q) {
        if (d.payload !== null)
          if (typeof d.payload == "string") e.err(d.payload);
          else for (const k of Ge(d.payload, { raw: !1, compact: !0 }).split(`
`)) e.err(k);
        e.exit(d.code);
        return;
      }
      throw d;
    }
    w && e.exit(5);
  }
}, Pt = {
  name: "json",
  usage: me,
  complete: (e) => ["-c", "-r", "--compact", "--raw", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = [];
    let t = !1, r = !1, i = !1, o = 0;
    for (; o < e.args.length; ) {
      const a = e.args[o++];
      if (i || a === "-" || !a.startsWith("-")) {
        n.push(a);
        continue;
      }
      if (a === "--") {
        i = !0;
        continue;
      }
      if (a === "--help") {
        for (const p of jt) e.out(p);
        e.exit(0);
        return;
      }
      if (a === "--compact") {
        t = !0;
        continue;
      }
      if (a === "--raw") {
        r = !0;
        continue;
      }
      if (a.startsWith("--")) {
        e.err(`json: unrecognized option '${a}'`), e.err("Try 'json --help' for more information."), e.exit(2);
        return;
      }
      for (const p of a.slice(1))
        if (p === "c") t = !0;
        else if (p === "r") r = !0;
        else {
          e.err(`json: unrecognized option '-${p}'`), e.err("Try 'json --help' for more information."), e.exit(2);
          return;
        }
    }
    const s = [];
    n.length === 0 && s.push({ label: "<stdin>", text: e.stdin ?? "" });
    for (const a of n) {
      if (a === "-") {
        if (e.stdin === null) {
          e.err("json: -: no piped input"), e.exit(2);
          return;
        }
        s.push({ label: "<stdin>", text: e.stdin });
        continue;
      }
      const p = e.vfs.resolve(e.state.cwd, a), h = e.vfs.nodeAt(p);
      if (h === null) {
        e.err(`json: ${a}: No such file or directory`), e.exit(2);
        return;
      }
      if (h.kind === "dir") {
        e.err(`json: ${a}: Is a directory`), e.exit(2);
        return;
      }
      s.push({ label: a, text: h.content });
    }
    let l = !1;
    for (const a of s)
      try {
        for (const p of Ze(a.text)) Xe(e, p, { raw: r, compact: t });
      } catch (p) {
        if (p instanceof I) {
          e.err(`json: ${a.label}: parse error: ${p.message}`), l = !0;
          continue;
        }
        throw p;
      }
    l && e.exit(2);
  }
}, qt = [Nt, Pt], It = {
  jq: [
    "NAME",
    "     jq — filter and transform JSON (a jq subset for the sem-shell)",
    "",
    "SYNOPSIS",
    `     ${ye}`,
    "",
    "DESCRIPTION",
    "     Runs FILTER (a jq program) over each JSON document read from",
    "     the files (or the pipe). Options: -r raw strings, -c compact,",
    "     -s slurp all inputs into one array, -n null input, --arg name",
    "     value ($name string), --argjson name json ($name parsed).",
    "",
    "LANGUAGE",
    '     Paths .a.b .["k"] .[0] .[1:3] and .[] iteration; pipe | and',
    "     comma; the // alternative; and/or/not; comparisons (jq total",
    "     order) and arithmetic (+ - * / % incl. string/array/object",
    "     forms); if/elif/else/end; try/catch and the ? suffix; reduce",
    "     and foreach; user defs (recursion, filter and $ parameters);",
    "     label/break; recursive descent ..; EXPR as $x; string",
    '     interpolation "\\(expr)" with @format forms; assignment and',
    "     update-assignment = |= += -= *= /= %= //=; $ENV, env,",
    "     $__loc__, input, inputs, input_filename, halt, halt_error;",
    "     regex test match capture scan sub gsub split/2 splits with",
    "     flags g i x s m n p; path getpath setpath delpaths del paths",
    "     leaf_paths; indices index rindex transpose explode implode",
    "     ascii tojson fromjson; limit first(f) last(f) until while",
    "     repeat walk recurse; sort/sort_by, group_by, unique/unique_by,",
    "     min/max, min_by/max_by, reverse, flatten, first, last, any,",
    "     all, add, map, map_values, with_entries, to/from_entries, has,",
    "     contains, inside, range, join, split, startswith, endswith,",
    "     ltrimstr, rtrimstr, ascii_downcase, ascii_upcase, tostring,",
    "     tonumber, type, not, empty, error, length, keys; @csv @tsv",
    "     @json @base64 @base64d @text @uri @html.",
    "",
    "EXIT CODES",
    "     0 ok · 2 usage or malformed input JSON · 3 program compile",
    "     error · 5 runtime error (remaining inputs still run); halt",
    "     and halt_error exit with their own code (halt_error default",
    "     5).",
    "",
    "NOT SUPPORTED",
    "     Module import/include. Regexes compile to JavaScript rather",
    "     than Oniguruma: common syntax (classes, anchors, named",
    "     groups, i/x/n/s/m/p flags) matches, but exotic Onig",
    "     constructs (callouts, K, possessive quantifiers) do not."
  ],
  json: [
    "NAME",
    "     json — pretty-print and validate JSON",
    "",
    "SYNOPSIS",
    `     ${me}`,
    "",
    "DESCRIPTION",
    "     Reads each file (or the pipe) as a stream of JSON documents",
    "     and prints them with 2-space indent (jq layout). A malformed",
    "     document reports its offset; exit 2. -c/-r behave like the jq",
    "     flags. Same engine as jq — this is the obvious-name alias for",
    '     "validate and normalize this JSON".'
  ]
}, Ct = { commands: qt, manPages: It };
export {
  qt as commands,
  It as manPages,
  Ct as pkg
};
