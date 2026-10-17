class E extends Error {
}
const j = /* @__PURE__ */ new Set([
  "BEGIN",
  "END",
  "function",
  "func",
  "if",
  "else",
  "while",
  "for",
  "do",
  "break",
  "continue",
  "next",
  "nextfile",
  "delete",
  "return",
  "exit",
  "in",
  "getline",
  "print",
  "printf"
]), q = /* @__PURE__ */ new Set([
  ">>",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "^=",
  "&&",
  "||",
  "==",
  "!=",
  "<=",
  ">=",
  "!~"
]), Z = /* @__PURE__ */ new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "<",
  ">",
  "=",
  "!",
  "~",
  "?",
  ":",
  ";",
  ",",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "$",
  "|"
]);
function V(n) {
  const t = [];
  let e = 0, s = 1, i = !1;
  const a = (r) => {
    throw new E(`cmd. line:${s}: ${r}`);
  };
  for (; e < n.length; ) {
    const r = n[e];
    if (r === `
`) {
      t.push({ t: "nl", v: null, ln: s }), s++, e++, i = !1;
      continue;
    }
    if (r === " " || r === "	" || r === "\r" || r === "\f" || r === "\v") {
      e++;
      continue;
    }
    if (r === "#") {
      for (; e < n.length && n[e] !== `
`; ) e++;
      continue;
    }
    if (r >= "0" && r <= "9" || r === "." && n[e + 1] !== void 0 && n[e + 1] >= "0" && n[e + 1] <= "9") {
      let l = e;
      if (r === "0" && (n[e + 1] === "x" || n[e + 1] === "X")) {
        for (l = e + 2; l < n.length && /[0-9a-fA-F]/.test(n[l]); ) l++;
        l === e + 2 && a("bad hex constant"), t.push({ t: "num", v: parseInt(n.slice(e, l), 16), ln: s }), e = l, i = !0;
        continue;
      }
      for (; l < n.length && n[l] >= "0" && n[l] <= "9"; ) l++;
      if (n[l] === ".")
        for (l++; l < n.length && n[l] >= "0" && n[l] <= "9"; ) l++;
      if (n[l] === "e" || n[l] === "E") {
        let h = l + 1;
        if ((n[h] === "+" || n[h] === "-") && h++, n[h] !== void 0 && n[h] >= "0" && n[h] <= "9") {
          for (; h < n.length && n[h] >= "0" && n[h] <= "9"; ) h++;
          l = h;
        }
      }
      t.push({ t: "num", v: Number(n.slice(e, l)), ln: s }), e = l, i = !0;
      continue;
    }
    if (r === '"') {
      let l = "";
      for (e++; ; ) {
        e >= n.length && a("unterminated string");
        const h = n[e];
        if (h === '"') {
          e++;
          break;
        }
        if (h === `
` && a("unterminated string"), h === "\\") {
          e++;
          const [d, g] = W(n, e, s, a);
          l += d, e = g;
          continue;
        }
        l += h, e++;
      }
      t.push({ t: "str", v: l, ln: s }), i = !0;
      continue;
    }
    if (r === "/" && !i) {
      let l = "";
      for (e++; ; ) {
        e >= n.length && a("unterminated regexp");
        const h = n[e];
        if (h === "/") {
          e++;
          break;
        }
        if (h === `
` && a("unterminated regexp"), h === "\\") {
          e + 1 >= n.length && a("unterminated regexp"), l += "\\" + n[e + 1], e += 2;
          continue;
        }
        l += h, e++;
      }
      t.push({ t: "ere", v: l, ln: s }), i = !0;
      continue;
    }
    if (/[A-Za-z_]/.test(r)) {
      let l = e;
      for (; l < n.length && /[A-Za-z0-9_]/.test(n[l]); ) l++;
      const h = n.slice(e, l);
      e = l, j.has(h) ? (t.push({ t: "kw", v: h, ln: s }), i = h === "next" || h === "nextfile" || h === "break" || h === "continue") : (t.push({ t: "name", v: h, ln: s }), i = !0);
      continue;
    }
    const o = n.slice(e, e + 2);
    if (q.has(o)) {
      if (o === "/=" && !i) {
        t.push({ t: "op", v: "/", ln: s }), e++, i = !1;
        continue;
      }
      t.push({ t: "op", v: o, ln: s }), e += 2, i = o === "++" || o === "--";
      continue;
    }
    if (Z.has(r)) {
      t.push({ t: "op", v: r, ln: s }), e++, i = r === ")" || r === "]";
      continue;
    }
    a(`syntax error at or near '${r}'`);
  }
  return t;
}
function W(n, t, e, s) {
  const i = n[t];
  i === void 0 && s("unterminated escape at end of input");
  const a = {
    n: `
`,
    t: "	",
    r: "\r",
    f: "\f",
    b: "\b",
    v: "\v",
    a: "a",
    "\\": "\\",
    '"': '"',
    "/": "/",
    "?": "?"
  };
  if (i in a) return [a[i], t + 1];
  if (i !== void 0 && i >= "0" && i <= "7") {
    let r = t, o = 0;
    for (; r < n.length && r < t + 3 && n[r] >= "0" && n[r] <= "7"; )
      o = o * 8 + (n[r].charCodeAt(0) - 48), r++;
    return [String.fromCharCode(o), r];
  }
  if (i === "x") {
    let r = t + 1, o = 0;
    for (; r < n.length && r < t + 3 && /[0-9a-fA-F]/.test(n[r]); )
      o = o * 16 + parseInt(n[r], 16), r++;
    return r === t + 1 ? ["x", r] : [String.fromCharCode(o), r];
  }
  return [i, t + 1];
}
const R = /* @__PURE__ */ new Set([
  "length",
  "substr",
  "index",
  "split",
  "sub",
  "gsub",
  "match",
  "sprintf",
  "tolower",
  "toupper",
  "sin",
  "cos",
  "atan2",
  "exp",
  "log",
  "sqrt",
  "int",
  "rand",
  "srand",
  "close",
  "fflush",
  "system"
]);
class Y {
  constructor(t, e) {
    this.toks = t, this.functions = e, this.pos = 0, this.inFunction = !1, this.inPrintList = !1, this.calls = [];
  }
  peek(t = 0) {
    return this.toks[this.pos + t];
  }
  at(t, e) {
    const s = this.peek();
    return s !== void 0 && s.t === t && (e === void 0 || s.v === e);
  }
  next() {
    const t = this.toks[this.pos];
    if (t === void 0) throw new E("unexpected end of program");
    return this.pos++, t;
  }
  ln() {
    return this.peek()?.ln ?? 1;
  }
  describe(t) {
    return t === void 0 ? "end of program" : t.t === "nl" ? "newline" : `'${t.v}'`;
  }
  err(t) {
    throw new E(`cmd. line:${this.ln()}: ${t}`);
  }
  expectOp(t) {
    this.at("op", t) || this.err(`syntax error at or near ${this.describe(this.peek())}, expected '${t}'`), this.pos++;
  }
  skipNl() {
    for (; this.at("nl"); ) this.pos++;
  }
  /** Optional semicolons/newlines that may trail a simple statement. */
  skipTerminator() {
    for (; this.at("nl") || this.at("op", ";"); ) this.pos++;
  }
  /* ---------------- program ---------------- */
  program() {
    const t = [];
    for (this.skipTerminator(); this.pos < this.toks.length; ) {
      if (this.at("kw", "function") || this.at("kw", "func")) {
        const e = this.functionDef();
        this.functions.set(e.name, e);
      } else
        t.push(this.item());
      this.skipTerminator();
    }
    for (const e of this.calls)
      if (!R.has(e.name) && !this.functions.has(e.name))
        throw new E(`cmd. line:${e.ln}: calling undefined function ${e.name}`);
    return { items: t, functions: this.functions };
  }
  /** `function name(params) { body }` — `func` too (one-true-awk spelling). */
  functionDef() {
    this.pos++, this.at("name") || this.err("syntax error in function definition, expected name");
    const t = this.next(), e = t.v;
    if (R.has(e))
      throw new E(`cmd. line:${t.ln}: function name '${e}' conflicts with a builtin`);
    this.expectOp("(");
    const s = [];
    for (; !this.at("op", ")") && (this.at("name") || this.err("bad function parameter list"), s.push(this.next().v), this.at("op", ",")); )
      this.pos++;
    this.expectOp(")");
    const i = this.inFunction;
    this.inFunction = !0;
    const a = this.block();
    return this.inFunction = i, { name: e, params: s, body: a, ln: t.ln };
  }
  item() {
    if (this.at("kw", "BEGIN") || this.at("kw", "END")) {
      const e = this.next().v;
      return this.at("op", "{") || this.err(`syntax error at or near ${this.describe(this.peek())}, expected '{'`), { kind: e, pattern: null, body: this.block() };
    }
    if (this.at("op", "{"))
      return { kind: "main", pattern: null, body: this.block() };
    const t = this.expr();
    return this.at("op", "{") ? { kind: "main", pattern: t, body: this.block() } : { kind: "main", pattern: t, body: [] };
  }
  block() {
    this.expectOp("{");
    const t = [];
    for (this.skipTerminator(); !this.at("op", "}"); )
      this.pos >= this.toks.length && this.err("unexpected end of program, missing '}'"), t.push(this.statement()), this.skipTerminator();
    return this.pos++, t;
  }
  /* ---------------- statements ---------------- */
  statement() {
    const t = this.ln();
    if (this.at("op", "{"))
      return { k: "block", body: this.block() };
    if (this.at("kw", "print") || this.at("kw", "printf")) {
      const s = this.next().v === "printf";
      let i = [], a = null;
      if (!this.stmtEndAhead() && !this.at("op", ">") && !this.at("op", ">>")) {
        const r = this.inPrintList;
        this.inPrintList = !0;
        try {
          for (i.push(this.expr()); this.at("op", ","); )
            this.pos++, i.push(this.expr());
        } finally {
          this.inPrintList = r;
        }
      }
      return i.length === 0 && !s && (i = [{ k: "field", e: { k: "num", v: 0 } }]), (this.at("op", ">") || this.at("op", ">>")) && (a = { op: this.next().v, target: this.concat() }, (this.at("op", ">") || this.at("op", ">>")) && this.err("syntax error: multiple output redirections")), this.at("op", "|") && this.err("output pipes are not supported by this awk"), s ? { k: "printf", args: i, redir: a, ln: t } : { k: "print", args: i, redir: a, ln: t };
    }
    if (this.at("kw", "if")) {
      this.pos++, this.expectOp("(");
      const s = this.expr();
      this.expectOp(")"), this.skipNl();
      const i = this.statement();
      this.skipTerminator();
      let a = null;
      return this.at("kw", "else") && (this.pos++, this.skipNl(), a = this.statement()), { k: "if", c: s, a: i, b: a };
    }
    if (this.at("kw", "while")) {
      this.pos++, this.expectOp("(");
      const s = this.expr();
      this.expectOp(")"), this.skipNl();
      const i = this.statement();
      return { k: "while", c: s, body: i };
    }
    if (this.at("kw", "do")) {
      this.pos++, this.skipNl();
      const s = this.statement();
      this.skipTerminator(), this.at("kw", "while") || this.err("syntax error, expected 'while' after do-body"), this.pos++, this.expectOp("(");
      const i = this.expr();
      return this.expectOp(")"), { k: "do", body: s, c: i };
    }
    if (this.at("kw", "for")) {
      if (this.pos++, this.expectOp("("), this.at("name") && this.peek(1) !== void 0 && this.peek(1).t === "kw" && this.peek(1).v === "in") {
        const r = this.next().v;
        this.pos++, this.at("name") || this.err("syntax error in for-in, expected array name");
        const o = this.next().v;
        return this.expectOp(")"), this.skipNl(), { k: "forIn", name: r, arr: o, body: this.statement(), ln: t };
      }
      const s = this.at("op", ";") ? null : this.expr();
      this.expectOp(";");
      const i = this.at("op", ";") ? null : this.expr();
      this.expectOp(";");
      const a = this.at("op", ")") ? null : this.expr();
      return this.expectOp(")"), this.skipNl(), { k: "forC", init: s, cond: i, step: a, body: this.statement() };
    }
    if (this.at("kw", "break"))
      return this.pos++, { k: "break", ln: t };
    if (this.at("kw", "continue"))
      return this.pos++, { k: "continue", ln: t };
    if (this.at("kw", "next"))
      return this.pos++, { k: "next", ln: t };
    if (this.at("kw", "nextfile"))
      return this.pos++, { k: "nextfile", ln: t };
    if (this.at("kw", "exit"))
      return this.pos++, { k: "exit", e: this.stmtEndAhead() ? null : this.expr() };
    if (this.at("kw", "return"))
      return this.pos++, this.inFunction || this.err("return outside of a function"), { k: "return", e: this.stmtEndAhead() ? null : this.expr(), ln: t };
    if (this.at("kw", "delete")) {
      this.pos++, this.at("name") || this.err("syntax error in delete, expected array name");
      const s = this.next().v;
      let i = null;
      if (this.at("op", "[")) {
        for (this.pos++, i = [this.expr()]; this.at("op", ","); )
          this.pos++, i.push(this.expr());
        this.expectOp("]");
      }
      return { k: "delete", name: s, args: i, ln: t };
    }
    return { k: "expr", e: this.expr(), ln: t };
  }
  /** nl, `;`, `}` or end — a statement list terminator. */
  stmtEndAhead() {
    const t = this.peek();
    return t === void 0 || t.t === "nl" || t.t === "op" && (t.v === ";" || t.v === "}");
  }
  /* ---------------- expressions (precedence ladder) ---------------- */
  expr() {
    return this.assignment();
  }
  assignment() {
    const t = this.ternary(), e = this.peek();
    return e !== void 0 && e.t === "op" && ["=", "+=", "-=", "*=", "/=", "%=", "^="].includes(e.v) ? (t.k !== "var" && t.k !== "index" && t.k !== "field" && this.err("syntax error: assignment target is not a variable, array element or field"), this.pos++, { k: "assign", op: e.v, target: t, src: this.assignment() }) : t;
  }
  ternary() {
    const t = this.logicOr();
    if (this.at("op", "?")) {
      this.pos++;
      const e = this.ternary();
      this.expectOp(":");
      const s = this.ternary();
      return { k: "ternary", c: t, a: e, b: s };
    }
    return t;
  }
  logicOr() {
    let t = this.logicAnd();
    for (; this.at("op", "||"); )
      this.pos++, t = { k: "logic", op: "||", a: t, b: this.logicAnd() };
    return t;
  }
  logicAnd() {
    let t = this.inExpr();
    for (; this.at("op", "&&"); )
      this.pos++, t = { k: "logic", op: "&&", a: t, b: this.inExpr() };
    return t;
  }
  inExpr() {
    let t = this.matchExpr();
    for (; this.at("kw", "in"); ) {
      const e = this.ln();
      this.pos++, this.at("name") || this.err("syntax error after `in`, expected array name");
      const s = this.next().v;
      t = {
        k: "in",
        args: t.k === "group" ? t.exprs : [t],
        name: s,
        ln: e
      };
    }
    return t;
  }
  matchExpr() {
    const t = this.relational();
    if (this.at("op", "~") || this.at("op", "!~")) {
      const e = this.next().v === "!~", s = this.relational();
      return { k: "match", a: t, b: s, neg: e };
    }
    return t;
  }
  relational() {
    const t = this.concat(), e = this.inPrintList, s = this.peek();
    if (s !== void 0 && s.t === "op" && ["<", "<=", ">", ">=", "!=", "=="].includes(s.v)) {
      if (e && s.v === ">") return t;
      this.pos++;
      const i = this.concat();
      return { k: "cmp", op: s.v, a: t, b: i };
    }
    return t;
  }
  /** Adjacent value expressions concatenate (weakest binary level). */
  concat() {
    let t = this.additive();
    for (; this.concatStarts(); )
      t = { k: "cat", a: t, b: this.additive() };
    return t;
  }
  concatStarts() {
    const t = this.peek();
    return t === void 0 ? !1 : t.t === "num" || t.t === "str" || t.t === "ere" || t.t === "name" || t.t === "op" && (t.v === "(" || t.v === "$" || t.v === "!");
  }
  additive() {
    let t = this.multiplicative();
    for (; ; ) {
      if (this.at("op", "+") || this.at("op", "-")) {
        t = { k: "bin", op: this.next().v, a: t, b: this.multiplicative(), ln: this.ln() };
        continue;
      }
      return t;
    }
  }
  multiplicative() {
    let t = this.unary();
    for (; ; ) {
      if (this.at("op", "*") || this.at("op", "/") || this.at("op", "%")) {
        t = { k: "bin", op: this.next().v, a: t, b: this.unary(), ln: this.ln() };
        continue;
      }
      return t;
    }
  }
  unary() {
    const t = this.peek();
    if (t !== void 0 && t.t === "op" && (t.v === "-" || t.v === "+" || t.v === "!"))
      return this.pos++, { k: "neg", op: t.v, e: this.unary() };
    if (t !== void 0 && t.t === "op" && (t.v === "++" || t.v === "--")) {
      this.pos++;
      const e = this.unary();
      return e.k !== "var" && e.k !== "index" && e.k !== "field" && this.err("syntax error: ++/-- target is not an lvalue"), { k: "pre", op: t.v, e };
    }
    return this.power();
  }
  power() {
    const t = this.postfix();
    return this.at("op", "^") ? (this.pos++, { k: "bin", op: "^", a: t, b: this.unary(), ln: this.ln() }) : t;
  }
  postfix() {
    if (this.at("op", "$")) {
      this.pos++;
      const t = { k: "field", e: this.fieldOperand() };
      return this.postfixTail(t);
    }
    return this.postfixTail(this.primary());
  }
  postfixTail(t) {
    for (; ; ) {
      if (this.at("op", "++") || this.at("op", "--")) {
        const e = this.next().v;
        t.k !== "var" && t.k !== "index" && t.k !== "field" && this.err("syntax error: ++/-- target is not an lvalue"), t = { k: "post", op: e, e: t };
        continue;
      }
      return t;
    }
  }
  /** The operand of `$`: a primary, or another `$` chain (`$$x`). */
  fieldOperand() {
    return this.at("op", "$") ? (this.pos++, { k: "field", e: this.fieldOperand() }) : this.primary();
  }
  primary() {
    const t = this.peek();
    t === void 0 && this.err("unexpected end of expression");
    const e = t.ln;
    if (t.t === "num")
      return this.pos++, { k: "num", v: t.v };
    if (t.t === "str")
      return this.pos++, { k: "str", v: t.v };
    if (t.t === "ere")
      return this.pos++, { k: "ere", src: t.v, ln: e };
    if (t.t === "kw" && t.v === "getline")
      return this.pos++, this.getlineRest(e);
    if (t.t === "name") {
      this.pos++;
      const s = t.v;
      if (this.at("op", "(")) {
        if (this.pos++, R.has(s)) return this.builtinArgs(s, e);
        this.calls.push({ name: s, ln: e });
        const i = [];
        if (!this.at("op", ")"))
          for (i.push(this.expr()); this.at("op", ","); )
            this.pos++, i.push(this.expr());
        return this.expectOp(")"), { k: "call", name: s, args: i, ln: e };
      }
      if (this.at("op", "[")) {
        this.pos++;
        const i = [this.expr()];
        for (; this.at("op", ","); )
          this.pos++, i.push(this.expr());
        return this.expectOp("]"), { k: "index", name: s, args: i, ln: e };
      }
      return s === "length" ? { k: "call", name: s, args: [], ln: e } : { k: "var", name: s };
    }
    if (t.t === "op" && t.v === "(") {
      this.pos++;
      const s = this.inPrintList;
      this.inPrintList = !1;
      try {
        const i = [this.expr()];
        for (; this.at("op", ","); )
          this.pos++, i.push(this.expr());
        return this.expectOp(")"), { k: "group", exprs: i };
      } finally {
        this.inPrintList = s;
      }
    }
    this.err(`syntax error at or near ${this.describe(t)}`);
  }
  /** After the `getline` keyword: optional target, optional `< file`. */
  getlineRest(t) {
    let e = null;
    if (this.at("name")) {
      const i = this.next().v;
      e = this.maybeIndex(i, t);
    } else this.at("op", "$") && (this.pos++, e = { k: "field", e: this.fieldOperand() });
    let s = null;
    return this.at("op", "<") && (this.pos++, s = this.concat()), { k: "getline", target: e, file: s, ln: t };
  }
  /** Name possibly followed by `[subscripts]` (a getline target). */
  maybeIndex(t, e) {
    if (this.at("op", "[")) {
      this.pos++;
      const s = [this.expr()];
      for (; this.at("op", ","); )
        this.pos++, s.push(this.expr());
      return this.expectOp("]"), { k: "index", name: t, args: s, ln: e };
    }
    return { k: "var", name: t };
  }
  /** Builtin-call argument grammars (split's 2nd arg is an array lvalue). */
  builtinArgs(t, e) {
    const s = [];
    if (!this.at("op", ")"))
      if (s.push(this.expr()), t === "split" && this.at("op", ",")) {
        this.pos++, this.at("name") || this.err("split: second argument must be an array name");
        const i = this.next().v;
        let a = { k: "var", name: i };
        if (this.at("op", "[")) {
          this.pos++;
          const r = [this.expr()];
          for (; this.at("op", ","); )
            this.pos++, r.push(this.expr());
          this.expectOp("]"), a = { k: "index", name: i, args: r, ln: e };
        }
        s.push(a), this.at("op", ",") && (this.pos++, s.push(this.expr()));
      } else
        for (; this.at("op", ","); )
          this.pos++, s.push(this.expr());
    return this.expectOp(")"), { k: "call", name: t, args: s, ln: e };
  }
}
function J(n) {
  const t = /* @__PURE__ */ new Map();
  for (let e = 0; e < n.length; e++) {
    const s = n[e];
    if (s.t === "kw" && (s.v === "function" || s.v === "func")) {
      const i = n[e + 1];
      i !== void 0 && i.t === "name" && t.set(i.v, { name: i.v, params: [], body: [], ln: i.ln });
    }
  }
  return t;
}
function Q(n) {
  const t = V(n), e = J(t);
  return new Y(t, e).program();
}
class p extends Error {
}
class F {
}
class N {
}
class O {
}
class $ {
}
class T {
  constructor(t) {
    this.value = t;
  }
}
class I {
  constructor(t) {
    this.code = t;
  }
}
const c = (n) => ({ v: n, sn: !1 }), w = (n) => ({ v: n, sn: !1 }), S = { v: void 0, sn: !1 }, tt = /^[ \t\n]*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[ \t\n]*$/, et = /^[ \t\n]*[+-]?0[xX][0-9a-fA-F]+[ \t\n]*$/;
function z(n) {
  return tt.test(n) || et.test(n);
}
function X(n) {
  const t = /^[ \t\n]*[+-]?(0[xX][0-9a-fA-F]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(n);
  if (!t) return 0;
  const e = Number(t[1]);
  return Number.isNaN(e) ? 0 : e;
}
function st(n) {
  if (n === void 0) return 6;
  const t = /^%[-+ 0#]*(\d+)?(?:\.\d+)?[eEfgG]$/.exec(n);
  if (!t) return 6;
  const e = t[1] === void 0 ? 6 : Number(t[1]);
  return e >= 1 ? e : 1;
}
function C(n, t) {
  if (Number.isNaN(n)) return "nan";
  if (!Number.isFinite(n)) return n > 0 ? "inf" : "-inf";
  let e = n.toPrecision(t);
  if (e.includes("e")) {
    let [s, i] = e.split("e");
    s.includes(".") && (s = s.replace(/0+$/, "").replace(/\.$/, ""));
    const a = parseInt(i, 10), r = Math.abs(a) < 10 ? "0" + Math.abs(a) : String(Math.abs(a));
    return `${s}e${a < 0 ? "-" : "+"}${r}`;
  }
  return e.includes(".") && (e = e.replace(/0+$/, "").replace(/\.$/, "")), e;
}
function it(n) {
  return Number.isInteger(n) && Math.abs(n) < 1e21 ? String(n) : C(n, 6);
}
function v(n) {
  const t = n.v;
  return t === void 0 ? 0 : typeof t == "number" ? t : X(t);
}
function u(n) {
  const t = n.v;
  return t === void 0 ? "" : typeof t == "string" ? t : it(t);
}
function k(n) {
  const t = n.v;
  return t === void 0 ? !1 : typeof t == "number" ? t !== 0 : z(t) ? X(t) !== 0 : t !== "";
}
function nt(n, t) {
  const e = n.v === void 0 || typeof n.v == "number" || n.sn, s = t.v === void 0 || typeof t.v == "number" || t.sn;
  if (e && s) {
    const r = v(n), o = v(t);
    return r < o ? -1 : r > o ? 1 : 0;
  }
  const i = u(n), a = u(t);
  return i < a ? -1 : i > a ? 1 : 0;
}
const H = {
  alpha: "a-zA-Z",
  digit: "0-9",
  alnum: "a-zA-Z0-9",
  upper: "A-Z",
  lower: "a-z",
  space: " \\t\\n\\r\\f\\v",
  punct: "!-/:-@\\[-`{-~",
  xdigit: "0-9a-fA-F",
  blank: " \\t",
  cntrl: "\\x00-\\x1f\\x7f",
  print: "\\x20-\\x7e",
  graph: "\\x21-\\x7e"
};
function rt(n) {
  let t = "";
  for (let e = 0; e < n.length; e++) {
    const s = n[e];
    if (s === "\\" && n[e + 1] === "/") {
      t += "/", e++;
      continue;
    }
    if (s === "[" && n[e + 1] === ":") {
      const i = n.indexOf(":]", e + 2);
      if (i !== -1) {
        const a = n.slice(e + 2, i);
        if (a in H) {
          t += "[" + H[a] + "]", e = i + 1;
          continue;
        }
      }
    }
    t += s;
  }
  return t;
}
function b(n, t) {
  try {
    return new RegExp(rt(n), t ? "g" : "");
  } catch (e) {
    throw new p(`invalid regular expression /${n}/: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function at(n, t) {
  if (t === `
`) {
    if (n === "") return [];
    const r = n.split(`
`);
    return r[r.length - 1] === "" && r.pop(), r;
  }
  if (t === "") {
    const r = n.replace(/^[\n\r\f\v]+/, "").replace(/[\n\r\f\v]+$/, "");
    return r === "" ? [] : r.split(/\n[ \t\r\f\v]*(?:\n[ \t\r\f\v]*)+/);
  }
  if (t.length === 1) {
    if (n === "") return [];
    const r = n.split(t);
    return r[r.length - 1] === "" && r.pop(), r;
  }
  const e = b(t, !0), s = [];
  let i = 0, a;
  for (; (a = e.exec(n)) !== null; ) {
    if (a[0].length === 0) {
      e.lastIndex++;
      continue;
    }
    s.push(n.slice(i, a.index)), i = e.lastIndex;
  }
  return s.push(n.slice(i)), s.length > 0 && s[s.length - 1] === "" && s.pop(), s;
}
function G(n, t) {
  if (t === " ") {
    const r = n.replace(/^[ \t\n]+/, "").replace(/[ \t\n]+$/, "");
    return r === "" ? [] : r.split(/[ \t\n]+/);
  }
  if (t === "") return [...n];
  if ([...t].length === 1)
    return n === "" ? [] : n.split(t);
  const e = b(t, !0), s = [];
  let i = 0, a;
  for (; (a = e.exec(n)) !== null; ) {
    if (a[0].length === 0) {
      e.lastIndex++;
      continue;
    }
    s.push(n.slice(i, a.index)), i = e.lastIndex;
  }
  return s.push(n.slice(i)), s;
}
const M = (n) => ({ v: n, sn: z(n) }), P = (1n << 64n) - 1n;
function U(n, t) {
  let e = "", s = 0;
  const i = () => s < t.length ? t[s++] : S, a = () => v(i()), r = (o) => Number.isNaN(o) ? 0n : Number.isFinite(o) ? BigInt(Math.trunc(o)) : o > 0 ? 9223372036854775807n : -9223372036854775808n;
  for (let o = 0; o < n.length; o++) {
    const l = n[o];
    if (l !== "%") {
      e += l;
      continue;
    }
    if (o++, n[o] === "%") {
      e += "%";
      continue;
    }
    let h = "";
    for (; n[o] !== void 0 && "-+ 0#".includes(n[o]); )
      h += n[o], o++;
    let d = 0;
    if (n[o] === "*")
      d = Math.max(0, Math.trunc(a())), o++;
    else
      for (; n[o] !== void 0 && n[o] >= "0" && n[o] <= "9"; )
        d = d * 10 + (n[o].charCodeAt(0) - 48), o++;
    let g = -1;
    if (n[o] === ".")
      if (o++, n[o] === "*")
        g = Math.max(0, Math.trunc(a())), o++;
      else
        for (g = 0; n[o] !== void 0 && n[o] >= "0" && n[o] <= "9"; )
          g = g * 10 + (n[o].charCodeAt(0) - 48), o++;
    const y = n[o];
    if (y === void 0) {
      e += "%";
      break;
    }
    let m;
    const L = h.includes("-") ? "-" : h.includes("0") ? "0" : "", A = (f, x) => (h.includes("+") && f >= 0 ? "+" : h.includes(" ") && f >= 0 ? " " : "") + x;
    switch (y) {
      case "d":
      case "i": {
        const f = a();
        m = A(f, (f < 0 ? "-" : "") + r(f).toString().replace("-", ""));
        break;
      }
      case "u": {
        const f = a();
        m = (r(f) & P).toString();
        break;
      }
      case "o": {
        const f = a(), x = r(f);
        m = (h.includes("#") && x !== 0n ? "0" : "") + (x & P).toString(8);
        break;
      }
      case "x":
      case "X": {
        const f = a(), x = r(f), B = (x & P).toString(16);
        m = (h.includes("#") && x !== 0n ? "0x" : "") + (y === "X" ? B.toUpperCase() : B);
        break;
      }
      case "c": {
        const f = i();
        m = typeof f.v == "number" ? String.fromCharCode(Math.abs(Math.trunc(f.v)) % 256) : u(f).charAt(0) || "";
        break;
      }
      case "s": {
        const f = u(i());
        m = g >= 0 ? f.slice(0, g) : f;
        break;
      }
      case "e":
      case "E": {
        const f = a();
        m = f.toExponential(g >= 0 ? g : 6).replace(/e([+-])(\d)$/, "e$10$2"), y === "E" && (m = m.toUpperCase()), m = A(f, m);
        break;
      }
      case "f":
      case "F": {
        const f = a();
        m = A(f, f.toFixed(g >= 0 ? g : 6));
        break;
      }
      case "g":
      case "G": {
        const f = a();
        m = A(f, C(f, g >= 0 ? Math.max(g, 1) : 6)), y === "G" && (m = m.toUpperCase());
        break;
      }
      default:
        e += "%" + h + (d ? String(d) : "") + (g >= 0 ? "." + g : "") + y;
        continue;
    }
    if (d > m.length)
      if (L === "-") m = m.padEnd(d, " ");
      else if (L === "0" && "diuoxXeEfgG".includes(y)) {
        const f = /^[+-]/.test(m) ? m[0] : "";
        f !== "" && (m = m.slice(1));
        const x = d - m.length - f.length;
        m = f + (x > 0 ? "0".repeat(x) : "") + m;
      } else m = m.padStart(d, " ");
    e += m;
  }
  return e;
}
class D {
  constructor(t, e) {
    this.content = t, this.rs = e, this.records = null, this.idx = 0;
  }
  next() {
    return this.records === null && (this.records = at(this.content, this.rs)), this.idx < this.records.length ? this.records[this.idx++] : null;
  }
}
const ot = 800;
function lt(n, t) {
  return new ht(n, t).run();
}
class ht {
  constructor(t, e) {
    this.program = t, this.opts = e, this.globals = /* @__PURE__ */ new Map(), this.globalArrays = /* @__PURE__ */ new Map(), this.frames = [], this.depth = 0, this.status = 0, this.rec = "", this.fields = null, this.nfCell = c(0), this.nr = 0, this.fnr = 0, this.filename = "", this.rstart = 0, this.rlength = -1, this.subsep = "", this.mainFeeder = null, this.inputHandles = /* @__PURE__ */ new Map(), this.outputHandles = /* @__PURE__ */ new Map(), this.randState = 1, this.randSeed = 0;
  }
  /* ---------------- scope plumbing ---------------- */
  scalarCell(t) {
    for (let a = this.frames.length - 1; a >= 0; a--) {
      const r = this.frames[a], o = r.cells.get(t);
      if (o) return o;
      if (r.arrays.has(t)) throw new p(`attempt to use array '${t}' in a scalar context`);
    }
    const e = this.globals.get(t);
    if (e) return e;
    if (this.globalArrays.has(t)) throw new p(`attempt to use array '${t}' in a scalar context`);
    const s = { v: void 0, sn: !1 }, i = this.frames[this.frames.length - 1];
    return i ? i.cells.set(t, s) : this.globals.set(t, s), s;
  }
  arrayFor(t) {
    for (let a = this.frames.length - 1; a >= 0; a--) {
      const r = this.frames[a], o = r.arrays.get(t);
      if (o) return o;
      if (r.cells.has(t)) throw new p(`attempt to use scalar '${t}' as array`);
    }
    const e = this.globalArrays.get(t);
    if (e) return e;
    if (this.globals.has(t)) throw new p(`attempt to use scalar '${t}' as array`);
    const s = /* @__PURE__ */ new Map(), i = this.frames[this.frames.length - 1];
    return i ? i.arrays.set(t, s) : this.globalArrays.set(t, s), s;
  }
  isKnownArray(t) {
    for (const e of this.frames) {
      if (e.arrays.has(t)) return !0;
      if (e.cells.has(t)) return !1;
    }
    return this.globalArrays.has(t);
  }
  /* ---------------- special variables ---------------- */
  specialGet(t) {
    switch (t) {
      case "NF":
        return this.ensureFields(), this.nfCell;
      case "NR":
        return c(this.nr);
      case "FNR":
        return c(this.fnr);
      case "FILENAME":
        return w(this.filename);
      case "RSTART":
        return c(this.rstart);
      case "RLENGTH":
        return c(this.rlength);
      case "SUBSEP":
        return w(this.subsep);
      default:
        return null;
    }
  }
  specialSet(t, e) {
    switch (t) {
      case "NF": {
        const s = Math.trunc(v(e));
        if (s < 0) throw new p(`NF set to negative value ${s}`);
        for (this.ensureFields(); this.fields.length < s; ) this.fields.push(S);
        return this.fields.length = s, this.nfCell = c(s), this.rebuildRecord(), !0;
      }
      case "NR":
        return this.nr = Math.trunc(v(e)), !0;
      case "FNR":
        return this.fnr = Math.trunc(v(e)), !0;
      case "FILENAME":
        return this.filename = u(e), !0;
      case "RSTART":
        return this.rstart = Math.trunc(v(e)), !0;
      case "RLENGTH":
        return this.rlength = Math.trunc(v(e)), !0;
      case "SUBSEP":
        return this.subsep = u(e), !0;
      default:
        return !1;
    }
  }
  /* ---------------- fields ---------------- */
  globalStr(t, e) {
    const s = this.globals.get(t);
    return s && s.v !== void 0 ? u(s) : e;
  }
  currentFs() {
    return this.globalStr("FS", " ");
  }
  currentOfs() {
    return this.globalStr("OFS", " ");
  }
  currentOrs() {
    return this.globalStr("ORS", `
`);
  }
  currentRs() {
    return this.globalStr("RS", `
`);
  }
  ensureFields() {
    this.fields === null && (this.fields = G(this.rec, this.currentFs()).map(M), this.nfCell = c(this.fields.length));
  }
  invalidateFields() {
    this.fields = null, this.nfCell = c(0);
  }
  rebuildRecord() {
    this.rec = this.fields.map((t) => u(t)).join(this.currentOfs());
  }
  getField(t) {
    return t === 0 ? w(this.rec) : t < 0 ? S : (this.ensureFields(), this.fields[t - 1] ?? S);
  }
  setField(t, e) {
    if (t === 0) {
      this.rec = u(e), this.invalidateFields();
      return;
    }
    if (t < 0) throw new p(`attempt to access field ${t}`);
    for (this.ensureFields(); this.fields.length < t; ) this.fields.push(S);
    this.fields[t - 1] = e, this.nfCell = c(this.fields.length), this.rebuildRecord();
  }
  setRecord(t) {
    this.rec = t, this.invalidateFields();
  }
  /** Advance record state (fields lazily split; FNR keyed on file change). */
  consumeRecord(t, e) {
    this.setRecord(t), this.fnr = e === this.filename ? this.fnr + 1 : 1, this.filename = e, this.nr++;
  }
  /* ---------------- arrays ---------------- */
  arrayKey(t) {
    return t.map((e) => u(e)).join(this.subsep);
  }
  /* ---------------- expression evaluation ---------------- */
  eval(t) {
    switch (t.k) {
      case "num":
        return c(t.v);
      case "str":
        return w(t.v);
      case "ere":
        return c(b(t.src, !1).test(this.rec) ? 1 : 0);
      case "var": {
        const e = this.specialGet(t.name);
        return e || this.scalarCell(t.name);
      }
      case "index": {
        const e = this.arrayFor(t.name), s = this.arrayKey(t.args.map((a) => this.eval(a)));
        let i = e.get(s);
        return i || (i = { v: void 0, sn: !1 }, e.set(s, i)), i;
      }
      case "field": {
        const e = Math.trunc(v(this.eval(t.e)));
        return this.getField(e);
      }
      case "call":
        return R.has(t.name) ? this.callBuiltin(t) : this.callUser(t);
      case "assign":
        return this.evalAssign(t);
      case "ternary":
        return k(this.eval(t.c)) ? this.eval(t.a) : this.eval(t.b);
      case "logic": {
        const e = k(this.eval(t.a)), s = t.op === "&&" ? e && k(this.eval(t.b)) : e || k(this.eval(t.b));
        return c(s ? 1 : 0);
      }
      case "in": {
        const e = this.arrayFor(t.name), s = this.arrayKey(t.args.map((i) => this.eval(i)));
        return c(e.has(s) ? 1 : 0);
      }
      case "match": {
        const e = this.eval(t.a), s = t.b, a = (s.k === "ere" ? b(s.src, !1) : b(u(this.eval(s)), !1)).test(u(e));
        return c(a === !t.neg ? 1 : 0);
      }
      case "cmp": {
        const e = nt(this.eval(t.a), this.eval(t.b)), s = t.op === "<" ? e < 0 : t.op === "<=" ? e <= 0 : t.op === ">" ? e > 0 : t.op === ">=" ? e >= 0 : t.op === "==" ? e === 0 : e !== 0;
        return c(s ? 1 : 0);
      }
      case "cat":
        return w(u(this.eval(t.a)) + u(this.eval(t.b)));
      case "bin":
        return this.evalBin(t);
      case "neg": {
        const e = this.eval(t.e);
        if (t.op === "!") return c(k(e) ? 0 : 1);
        const s = v(e);
        return c(t.op === "-" ? -s : +s);
      }
      case "pre": {
        const e = v(this.eval(t.e)) + (t.op === "++" ? 1 : -1);
        return this.setLvalue(t.e, c(e)), c(e);
      }
      case "post": {
        const e = v(this.eval(t.e));
        return this.setLvalue(t.e, c(e + (t.op === "++" ? 1 : -1))), c(e);
      }
      case "group": {
        if (t.exprs.length !== 1) throw new p("syntax error: (expr, expr) is only valid with `in`");
        return this.eval(t.exprs[0]);
      }
      case "getline":
        return this.evalGetline(t);
    }
  }
  evalBin(t) {
    const e = v(this.eval(t.a)), s = v(this.eval(t.b));
    switch (t.op) {
      case "+":
        return c(e + s);
      case "-":
        return c(e - s);
      case "*":
        return c(e * s);
      case "/":
        if (s === 0) throw new p("division by zero");
        return c(e / s);
      case "%":
        if (s === 0) throw new p("division by zero in %");
        return c(e % s);
      case "^":
        return c(Math.pow(e, s));
    }
  }
  evalAssign(t) {
    if (t.op === "=") {
      const r = this.eval(t.src);
      return this.setLvalue(t.target, r), r;
    }
    const e = v(this.eval(t.target)), s = v(this.eval(t.src));
    let i;
    switch (t.op) {
      case "+=":
        i = e + s;
        break;
      case "-=":
        i = e - s;
        break;
      case "*=":
        i = e * s;
        break;
      case "/=":
        if (s === 0) throw new p("division by zero");
        i = e / s;
        break;
      case "%=":
        if (s === 0) throw new p("division by zero in %=");
        i = e % s;
        break;
      case "^=":
        i = Math.pow(e, s);
        break;
      default:
        throw new p(`unknown assignment operator ${t.op}`);
    }
    const a = c(i);
    return this.setLvalue(t.target, a), a;
  }
  setLvalue(t, e) {
    switch (t.k) {
      case "var": {
        if (this.specialSet(t.name, e)) return;
        if (this.isKnownArray(t.name)) throw new p(`attempt to use array '${t.name}' in a scalar context`);
        const s = this.scalarCell(t.name);
        s.v = e.v, s.sn = e.sn;
        return;
      }
      case "index": {
        const s = this.arrayFor(t.name), i = this.arrayKey(t.args.map((a) => this.eval(a)));
        s.set(i, e);
        return;
      }
      case "field": {
        const s = Math.trunc(v(this.eval(t.e)));
        this.setField(s, e);
        return;
      }
      default:
        throw new p("assignment to a non-lvalue");
    }
  }
  /* ---------------- user functions ---------------- */
  callUser(t) {
    const e = this.program.functions.get(t.name);
    if (!e) throw new p(`calling undefined function ${t.name}`);
    if (this.depth >= ot) throw new p(`function call nesting too deep at '${t.name}'`);
    const s = [];
    for (let a = 0; a < e.params.length; a++) {
      const r = e.params[a], o = t.args[a];
      if (o === void 0) {
        s.push({ name: r, cell: { v: void 0, sn: !1 } });
        continue;
      }
      if (o.k === "var" && this.isKnownArray(o.name))
        s.push({ name: r, arr: this.arrayFor(o.name) });
      else {
        const l = this.eval(o);
        s.push({ name: r, cell: { v: l.v, sn: l.sn } });
      }
    }
    const i = { cells: /* @__PURE__ */ new Map(), arrays: /* @__PURE__ */ new Map() };
    for (const a of s)
      a.arr ? i.arrays.set(a.name, a.arr) : i.cells.set(a.name, a.cell);
    this.frames.push(i), this.depth++;
    try {
      return this.execBody(e.body), S;
    } catch (a) {
      if (a instanceof T) return a.value;
      throw a;
    } finally {
      this.depth--, this.frames.pop();
    }
  }
  /* ---------------- getline ---------------- */
  evalGetline(t) {
    let e, s;
    if (t.file !== null) {
      const i = this.opts.vfs.resolve(this.opts.cwd, u(this.eval(t.file)));
      let a = this.inputHandles.get(i);
      if (!a) {
        const r = this.opts.vfs.read(i);
        if (r === null) return c(-1);
        a = new D(r, this.currentRs()), this.inputHandles.set(i, a);
      }
      e = a.next(), s = i;
    } else {
      const i = this.nextMainRecord();
      if (i === null) return c(0);
      e = i.rec, s = i.file;
    }
    return e === null ? c(0) : (this.consumeRecord(e, s), t.target !== null && this.setLvalue(t.target, M(this.rec)), c(1));
  }
  /** The shared main input stream — the record loop and getline both draw it. */
  nextMainRecord() {
    return this.mainFeeder === null && (this.mainFeeder = this.makeMainFeeder()), this.mainFeeder();
  }
  makeMainFeeder() {
    const t = this.currentRs(), e = this.opts.files.map((a) => {
      if (a === "-") return { content: this.opts.stdin ?? "", file: "-" };
      const r = this.opts.vfs.resolve(this.opts.cwd, a);
      return { content: this.opts.vfs.read(r) ?? "", file: r };
    });
    e.length === 0 && this.opts.stdin !== null && e.push({ content: this.opts.stdin, file: "-" });
    const s = e.map((a) => ({ stream: new D(a.content, t), file: a.file }));
    let i = 0;
    return () => {
      for (; i < s.length; ) {
        const a = s[i].stream.next();
        if (a !== null) return { rec: a, file: s[i].file };
        i++;
      }
      return null;
    };
  }
  /* ---------------- builtins ---------------- */
  callBuiltin(t) {
    const e = t.args;
    switch (t.name) {
      case "length": {
        if (e.length === 0) return c([...this.rec].length);
        const s = e[0];
        return s.k === "var" && this.isKnownArray(s.name) ? c(this.arrayFor(s.name).size) : c([...u(this.eval(s))].length);
      }
      case "substr": {
        const s = [...u(this.eval(e[0]))], i = Math.trunc(v(this.eval(e[1])));
        if (e.length < 3) return w(i < 1 ? s.join("") : s.slice(i - 1).join(""));
        const a = Math.trunc(v(this.eval(e[2])));
        if (a <= 0) return w("");
        const r = Math.max(i, 1), o = i + a;
        return w(s.slice(r - 1, o - 1).join(""));
      }
      case "index": {
        const s = u(this.eval(e[0])), i = u(this.eval(e[1]));
        if (i === "") return c(1);
        const a = s.indexOf(i);
        return c(a === -1 ? 0 : a + 1);
      }
      case "split":
        return this.builtinSplit(e);
      case "sub":
      case "gsub":
        return this.builtinSub(t.name === "gsub", e);
      case "match": {
        const s = u(this.eval(e[0])), i = e[1], r = (i.k === "ere" ? b(i.src, !1) : b(u(this.eval(i)), !1)).exec(s);
        return r === null ? (this.rstart = 0, this.rlength = -1, c(0)) : (this.rstart = r.index + 1, this.rlength = r[0].length, c(this.rstart));
      }
      case "sprintf": {
        const s = u(this.eval(e[0]));
        return w(U(s, e.slice(1).map((i) => this.eval(i))));
      }
      case "tolower":
        return w(u(this.eval(e[0])).toLowerCase());
      case "toupper":
        return w(u(this.eval(e[0])).toUpperCase());
      case "sin":
        return c(Math.sin(v(this.eval(e[0]))));
      case "cos":
        return c(Math.cos(v(this.eval(e[0]))));
      case "atan2":
        return c(Math.atan2(v(this.eval(e[0])), v(this.eval(e[1]))));
      case "exp":
        return c(Math.exp(v(this.eval(e[0]))));
      case "log":
        return c(Math.log(v(this.eval(e[0]))));
      case "sqrt":
        return c(Math.sqrt(v(this.eval(e[0]))));
      case "int":
        return c(Math.trunc(v(this.eval(e[0]))));
      case "rand":
        return c(this.nextRand());
      case "srand": {
        const s = this.randSeed, i = e.length === 0 ? Math.floor(Date.now() / 1e3) : Math.trunc(v(this.eval(e[0])));
        return this.randSeed = i, this.randState = Math.abs(i) % 2147483646 + 1, c(s);
      }
      case "close": {
        const s = this.opts.vfs.resolve(this.opts.cwd, u(this.eval(e[0]))), i = this.outputHandles.get(s);
        return i ? (this.flushHandle(s, i), this.outputHandles.delete(s), c(0)) : this.inputHandles.has(s) ? (this.inputHandles.delete(s), c(0)) : c(-1);
      }
      case "fflush": {
        for (const [s, i] of this.outputHandles) this.flushHandle(s, i);
        return c(0);
      }
      case "system":
        throw new p("system() is not supported by this awk");
      default:
        throw new p(`calling undefined function ${t.name}`);
    }
  }
  /** classic C-rand LCG — deterministic after srand(n), per POSIX rand semantics */
  nextRand() {
    return this.randState = Math.imul(1103515245, this.randState) + 12345 & 2147483647, this.randState < 0 && (this.randState += 2147483648), this.randState / 2147483648;
  }
  builtinSplit(t) {
    const e = u(this.eval(t[0])), s = t[1];
    if (s.k !== "var" && s.k !== "index")
      throw new p("split: second argument must be an array");
    const i = this.arrayFor(s.name);
    if (i.clear(), e === "") return c(0);
    const a = t.length >= 3 ? t[2] : null, r = a === null ? this.currentFs() : a.k === "ere" ? a.src : u(this.eval(a)), o = G(e, r);
    for (let l = 0; l < o.length; l++) i.set(String(l + 1), M(o[l]));
    return c(o.length);
  }
  builtinSub(t, e) {
    if (e.length < 2) throw new p("sub/gsub needs a pattern and a replacement");
    const s = e.length >= 3 ? e[2] : { k: "field", e: { k: "num", v: 0 } }, i = u(this.eval(s)), a = e[0], r = a.k === "ere" ? b(a.src, !0) : b(u(this.eval(a)), !0), o = u(this.eval(e[1]));
    r.lastIndex = 0;
    let l = "", h = 0, d = 0, g;
    for (; (g = r.exec(i)) !== null && (d++, l += i.slice(h, g.index) + this.expandRepl(o, g), h = r.lastIndex, g[0].length === 0 && r.lastIndex++, !!t); )
      ;
    return d === 0 ? c(0) : (this.setLvalue(s, w(l + i.slice(h))), c(t ? d : 1));
  }
  /** awk replacement text: `&` is the match; `\&`, `\\`, `\n`, `\t` escape. */
  expandRepl(t, e) {
    let s = "";
    for (let i = 0; i < t.length; i++) {
      const a = t[i];
      if (a === "\\" && i + 1 < t.length) {
        const r = t[++i];
        s += r === "&" ? "&" : r === "\\" ? "\\" : r === "n" ? `
` : r === "t" ? "	" : r;
        continue;
      }
      s += a === "&" ? e[0] : a;
    }
    return s;
  }
  /* ---------------- statements ---------------- */
  execBody(t) {
    for (const e of t) this.execStmt(e);
  }
  execStmt(t) {
    switch (t.k) {
      case "block":
        this.execBody(t.body);
        return;
      case "print":
        this.doPrint(t.args, t.redir, "print");
        return;
      case "printf":
        this.doPrint(t.args, t.redir, "printf");
        return;
      case "if":
        k(this.eval(t.c)) ? this.execStmt(t.a) : t.b !== null && this.execStmt(t.b);
        return;
      case "while":
        for (; k(this.eval(t.c)); )
          try {
            this.execStmt(t.body);
          } catch (e) {
            if (e instanceof F) break;
            if (!(e instanceof N)) throw e;
          }
        return;
      case "do":
        for (; ; ) {
          try {
            this.execStmt(t.body);
          } catch (e) {
            if (e instanceof F) break;
            if (!(e instanceof N)) throw e;
          }
          if (!k(this.eval(t.c))) break;
        }
        return;
      case "forC": {
        for (t.init !== null && this.eval(t.init); !(t.cond !== null && !k(this.eval(t.cond))); ) {
          try {
            this.execStmt(t.body);
          } catch (e) {
            if (e instanceof F) break;
            if (!(e instanceof N)) throw e;
          }
          t.step !== null && this.eval(t.step);
        }
        return;
      }
      case "forIn": {
        const e = this.arrayFor(t.arr);
        for (const s of [...e.keys()]) {
          this.setNamedScalar(t.name, w(s));
          try {
            this.execStmt(t.body);
          } catch (i) {
            if (i instanceof F) break;
            if (!(i instanceof N)) throw i;
          }
        }
        return;
      }
      case "break":
        throw new F();
      case "continue":
        throw new N();
      case "next":
        throw new O();
      case "nextfile":
        throw new $();
      case "exit":
        throw new I(t.e === null ? null : Math.trunc(v(this.eval(t.e))));
      case "return":
        throw new T(t.e === null ? S : this.eval(t.e));
      case "delete": {
        const e = this.arrayFor(t.name);
        t.args === null ? e.clear() : e.delete(this.arrayKey(t.args.map((s) => this.eval(s))));
        return;
      }
      case "expr":
        this.eval(t.e);
        return;
    }
  }
  setNamedScalar(t, e) {
    if (this.isKnownArray(t)) throw new p(`attempt to use array '${t}' in a scalar context`);
    const s = this.scalarCell(t);
    s.v = e.v, s.sn = e.sn;
  }
  doPrint(t, e, s) {
    let i;
    if (s === "printf") {
      if (t.length === 0) throw new p("printf: no format string");
      const o = u(this.eval(t[0]));
      i = U(o, t.slice(1).map((l) => this.eval(l)));
    } else
      i = t.map((o) => this.display(this.eval(o))).join(this.currentOfs()) + this.currentOrs();
    if (e === null) {
      this.opts.out(i);
      return;
    }
    const a = this.opts.vfs.resolve(this.opts.cwd, u(this.eval(e.target)));
    let r = this.outputHandles.get(a);
    if (!r) {
      const o = e.op === ">>" ? this.opts.vfs.read(a) ?? "" : "";
      r = { mode: e.op, buf: o === "" ? [] : [o] }, this.outputHandles.set(a, r);
    }
    r.buf.push(i);
  }
  /** print's number form: OFMT for non-integral values (the POSIX print rule). */
  display(t) {
    if (typeof t.v == "number" && !Number.isInteger(t.v)) {
      const e = this.globals.get("OFMT"), s = st(e && typeof e.v == "string" ? e.v : void 0);
      return C(t.v, s);
    }
    return u(t);
  }
  flushHandle(t, e) {
    if (e.buf.length === 0) return;
    const s = e.buf.join("");
    e.buf = [];
    try {
      this.opts.vfs.mountFile(t, s);
    } catch (i) {
      throw new p(`can't write to ${t}: ${i instanceof Error ? i.message : String(i)}`);
    }
  }
  /* ---------------- the run ---------------- */
  run() {
    const { begins: t, mains: e, ends: s } = ct(this.program);
    try {
      for (const [i, a] of this.opts.assigns) this.setNamedScalar(i, M(a));
      for (const [i, a] of [
        ["FS", " "],
        ["OFS", " "],
        ["ORS", `
`],
        ["RS", `
`],
        ["SUBSEP", this.subsep],
        ["CONVFMT", "%.6g"],
        ["OFMT", "%.6g"]
      ])
        this.globals.has(i) || this.globals.set(i, w(a));
      for (const i of t) this.execBody(i.body);
      if (e.length > 0) {
        if (this.opts.files.length === 0 && this.opts.stdin === null)
          return this.opts.err("awk: no input (pipe one in, or name a file)"), this.runEnds(s), this.flushAll(), 1;
        this.runMain(e);
      }
    } catch (i) {
      if (i instanceof I)
        return i.code !== null && (this.status = i.code), this.runEnds(s), this.flushAll(), this.status;
      if (i instanceof p)
        return this.opts.err(`awk: ${i.message}`), this.flushAll(), 2;
      throw i instanceof T ? new p("return used outside of a function") : i instanceof O ? new p("next used in BEGIN action") : i instanceof $ ? new p("nextfile used in BEGIN action") : i instanceof F || i instanceof N ? new p("break/continue used outside of a loop") : i;
    }
    return this.runEnds(s), this.flushAll(), this.status;
  }
  runEnds(t) {
    try {
      for (const e of t) this.execBody(e.body);
    } catch (e) {
      if (e instanceof I) {
        e.code !== null && (this.status = e.code);
        return;
      }
      if (e instanceof p) {
        this.opts.err(`awk: ${e.message}`), this.status = 2;
        return;
      }
      throw e instanceof O ? new p("next used in END action") : e instanceof $ ? new p("nextfile used in END action") : e;
    }
  }
  flushAll() {
    for (const [t, e] of this.outputHandles) this.flushHandle(t, e);
  }
  runMain(t) {
    this.mainFeeder === null && (this.mainFeeder = this.makeMainFeeder());
    const e = this.mainFeeder;
    let s = e();
    for (; s !== null; ) {
      const { rec: i, file: a } = s;
      this.consumeRecord(i, a);
      try {
        for (const r of t)
          (r.pattern === null || k(this.eval(r.pattern))) && (r.body.length === 0 ? this.opts.out(this.display(w(this.rec)) + this.currentOrs()) : this.execBody(r.body));
      } catch (r) {
        if (r instanceof O) {
          s = e();
          continue;
        }
        if (r instanceof $) {
          do
            s = e();
          while (s !== null && s.file === a);
          continue;
        }
        throw r;
      }
      s = e();
    }
  }
}
function ct(n) {
  const t = [], e = [], s = [];
  for (const i of n.items)
    i.kind === "BEGIN" ? t.push(i) : i.kind === "END" ? s.push(i) : e.push(i);
  return { begins: t, mains: e, ends: s };
}
const K = "awk [-F fs] [-v var=val] [-f progfile] ['program'] [file ...]", ut = [
  "Usage: " + K,
  "",
  "Pattern scanning and processing language (POSIX awk, gawk-flavoured).",
  "",
  "Options:",
  '  -F fs            field separator (a regex; " " means whitespace runs)',
  "  -v var=val       assign val to var before BEGIN (numeric strings too)",
  "  -f progfile      read the program from progfile (repeatable; concatenated)",
  "  -e 'program'     inline program text (repeatable; may mix with -f)",
  "  --               everything after this is program/file operands",
  "",
  "Long options: --field-separator=FS --assign VAR=VAL --file F --source P",
  "",
  "The first non-option operand is the program when no -f/-e is given;",
  'the rest are input files ("-" reads the pipe). Runs BEGIN before any',
  "input, the pattern{action} rules per record, END after all input.",
  "",
  "Supported: fields ($1..$NF, NF re-assign), NR/FNR/FS/OFS/ORS/RS/SUBSEP",
  '(RS "" is paragraph mode; multi-char RS is a regex), arrays with `in`',
  "and delete, multi-dim [a,b] via SUBSEP, ~ !~ regex match, printf/sprintf",
  "(%-10s %5.2f %x %o %c %e %g %%, * width/precision), string fns (length",
  "substr index split sub gsub match sprintf tolower toupper), math fns",
  "(sin cos atan2 exp log sqrt int rand srand), getline (var, <file), user",
  "functions (recursion; arrays pass by reference), > and >> redirection",
  "with buffering and close().",
  "",
  "Not supported: | output pipes, system(), |& coprocesses."
], ft = "awk (semtext-sh) 0.1.0 — POSIX awk for the sem-shell", pt = /^[_A-Za-z][_A-Za-z0-9]*$/;
function dt(n, t, e) {
  let s = 0;
  const i = /* @__PURE__ */ new Set(["F", "v", "f", "e"]);
  let a = [];
  const r = (o) => {
    const l = o.indexOf("=");
    if (l <= 0) return `awk: -v assignment '${o}' lacks a name=value shape`;
    const h = o.slice(0, l);
    return pt.test(h) ? (e.assigns.push([h, o.slice(l + 1)]), null) : `awk: invalid -v variable name '${h}'`;
  };
  for (; s < n.length; ) {
    const o = n[s];
    if (o === "--") {
      s++, a = a.concat(n.slice(s));
      break;
    }
    if (o.startsWith("--")) {
      const l = o.indexOf("="), h = l === -1 ? o : o.slice(0, l), d = l === -1 ? null : o.slice(l + 1);
      switch (h) {
        case "--help":
          for (const g of ut) t.out(g);
          return t.exit(0), "handled";
        case "--version":
          return t.out(ft), t.exit(0), "handled";
        case "--field-separator":
          if (d === null) return "awk: option '--field-separator' requires an argument";
          e.assigns.push(["FS", d]);
          break;
        case "--assign":
          if (d === null) return "awk: option '--assign' requires an argument";
          {
            const g = r(d);
            if (g !== null) return g;
          }
          break;
        case "--file":
          if (d === null) return "awk: option '--file' requires an argument";
          e.progFiles.push(d);
          break;
        case "--source":
          if (d === null) return "awk: option '--source' requires an argument";
          e.progTexts.push(d);
          break;
        default:
          return `awk: unrecognized option '${h}'
Try 'awk --help' for more information.`;
      }
      s++;
      continue;
    }
    if (o.length >= 2 && o[0] === "-" && o !== "-") {
      let l = o.slice(1);
      for (; l !== ""; ) {
        const h = l[0];
        if (!i.has(h))
          return `awk: invalid option -- '${h}'
Try 'awk --help' for more information.`;
        let d;
        if (l = l.slice(1), l !== "")
          d = l;
        else {
          if (s++, s >= n.length) return `awk: option '${h}' requires an argument`;
          d = n[s];
        }
        if (h === "F") e.assigns.push(["FS", d]);
        else if (h === "v") {
          const g = r(d);
          if (g !== null) return g;
        } else h === "f" ? e.progFiles.push(d) : e.progTexts.push(d);
        l = "";
      }
      s++;
      continue;
    }
    a.push(o), s++;
  }
  if (e.progFiles.length === 0 && e.progTexts.length === 0) {
    if (a.length === 0) return `awk: no program given
Try 'awk --help' for more information.`;
    e.progTexts.push(a.shift());
  }
  return e.files = a, null;
}
function _(n, t) {
  const e = t.split(`
`);
  e[e.length - 1] === "" && e.pop();
  for (const s of e) n(s);
}
const gt = {
  name: "awk",
  usage: K,
  complete: (n) => ["--help", "--version", "--field-separator=", "--assign=", "--file=", "--source=", "-F", "-v", "-f", "-e"].filter(
    (t) => t.startsWith(n.word)
  ),
  run(n) {
    const t = { assigns: [], progFiles: [], progTexts: [], files: [] }, e = dt(n.args, n, t);
    if (e !== null) {
      if (e === "handled") return;
      n.err(e), n.exit(1);
      return;
    }
    let s = "";
    for (const r of t.progFiles) {
      const o = n.vfs.resolve(n.state.cwd, r), l = n.vfs.read(o);
      if (l === null) {
        n.err(`awk: can't open source file '${r}': No such file or directory`), n.exit(2);
        return;
      }
      s += l + `
`;
    }
    s += t.progTexts.join(`
`);
    let i;
    try {
      i = Q(s);
    } catch (r) {
      if (r instanceof E) {
        n.err(`awk: ${r.message}`), n.exit(1);
        return;
      }
      throw r;
    }
    for (const r of t.files) {
      if (r === "-") continue;
      const o = n.vfs.resolve(n.state.cwd, r), l = n.vfs.nodeAt(o);
      if (l === null) {
        n.err(`awk: can't open file '${r}': No such file or directory`), n.exit(2);
        return;
      }
      if (l.kind === "dir") {
        n.err(`awk: can't open file '${r}': Is a directory`), n.exit(2);
        return;
      }
    }
    const a = lt(i, {
      vfs: n.vfs,
      cwd: n.state.cwd,
      stdin: n.stdin,
      files: t.files,
      assigns: t.assigns,
      out: (r) => _(n.out, r),
      err: (r) => _(n.err, r)
    });
    n.exit(a);
  }
}, vt = [gt], mt = {
  awk: [
    "AWK(1)                    semtext-sh manual",
    "",
    "NAME",
    "     awk — pattern scanning and processing language",
    "",
    "SYNOPSIS",
    "     awk [-F fs] [-v var=val] [-f progfile] ['program'] [file ...]",
    "     pipeline | awk 'program'",
    "",
    "DESCRIPTION",
    "     POSIX awk: reads records (lines by default), splits each into",
    "     fields, and runs pattern{action} rules against it. BEGIN rules",
    "     run before any input, END rules after all of it.",
    "",
    "     Fields:   $1 $2 … $NF; $0 is the whole record. Assigning NF or",
    "     any $i re-builds the record with OFS.",
    "     Built-in variables: NR FNR NF FILENAME FS OFS ORS RS SUBSEP",
    "     RSTART RLENGTH CONVFMT OFMT.",
    '     FS forms: " " whitespace runs, "" single characters, any other',
    '     string a regex. RS forms: "\\n" default, "" paragraph mode, one',
    "     character, or a multi-character regex.",
    "",
    "STATEMENTS",
    "     if/else, while, do, for (C-style), for (var in array), break,",
    "     continue, next, nextfile, delete arr[k] / delete arr, exit [code],",
    "     print, printf; print > file and >> file (buffered, flushed at",
    "     exit; close(file) flushes and frees the handle).",
    "",
    "FUNCTIONS",
    "     length [x], substr(s, m [,n]), index(s, t), split(s, a [,fs]),",
    "     sub(re, rep [,t]), gsub(re, rep [,t]), match(s, re),",
    "     sprintf(fmt, …), tolower(s), toupper(s), sin cos atan2 exp log",
    "     sqrt int rand srand([n]), close(f), fflush([f]).",
    "     User functions: function name(params) { … } — scalars pass by",
    "     value, arrays by reference; extra params are locals; return expr.",
    "",
    "OPTIONS",
    "     -F fs        field separator (same as assigning FS)",
    "     -v var=val   assignment before BEGIN, in command-line order",
    "     -f progfile  program from a file (repeatable; concatenated)",
    "     -e 'program' inline program text (repeatable; may mix with -f)",
    "     --           end of options",
    "",
    "EXIT STATUS",
    "     0 success; 1 usage or parse errors (and no-input with main",
    "     rules); 2 unreadable file operands and fatal runtime errors;",
    "     else the value of `exit n`.",
    "",
    "LIMITS",
    "     No output pipes, system(), or |& coprocesses. getline without a",
    "     file shares the main input stream; getline < file gives -1 when",
    "     the file cannot be opened.",
    "",
    "EXAMPLES",
    "     echo 'a b c' | awk '{print $2}'        → b",
    "     awk -F: '{print $1}' /etc/passwd       first column",
    "     awk 'END{print NR}' file               line count",
    "     awk '{s+=$1} END{print s}' nums        column sum"
  ]
}, xt = { commands: vt, manPages: mt };
export {
  vt as commands,
  mt as manPages,
  xt as pkg
};
