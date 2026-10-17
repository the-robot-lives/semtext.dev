function x(e) {
  return `semtext-pkg-${e}.js`;
}
function X(e) {
  return import(
    /* @vite-ignore */
    new URL(x(e), import.meta.url).href
  ).then(
    (s) => s
  );
}
function J(e) {
  return e.includes("--help") || e.includes("-h");
}
function Q(e, s) {
  const t = x(e.name), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const u of e.commands)
    u.man !== void 0 && i.set(u.name, u.man);
  let f = !1, c = !1, r = null;
  const l = () => (r ??= s().then(
    (u) => {
      for (const d of u.commands) o.set(d.name, d);
      for (const [d, h] of Object.entries(u.manPages ?? {})) a.set(d, h);
      return f = !0, !0;
    },
    () => (c = !0, !1)
  ), r);
  l();
  const n = (u) => {
    const d = () => o.get(u.name);
    return {
      name: u.name,
      // Help/completion surfaces read the stub's line — never the chunk.
      usage: u.usage,
      run(h) {
        const m = d();
        if (m !== void 0)
          return m.run(h);
        if (J(h.args)) {
          h.out(u.usage);
          return;
        }
        if (c) {
          h.err(`${u.name}: package chunk failed to load (${t})`), h.exit(1);
          return;
        }
        if (f) {
          h.err(`${u.name}: package chunk ${t} does not provide it`), h.exit(70);
          return;
        }
        h.err(`${u.name}: chunk still loading — try again`), h.exit(1);
      },
      complete(h) {
        return d()?.complete?.(h) ?? [];
      },
      app(h) {
        return d()?.app?.(h) ?? null;
      }
    };
  };
  return {
    name: e.name,
    commands: e.commands.map(n),
    ensure: l,
    loaded: () => f,
    state: () => f ? "resident" : c ? "failed" : "loading",
    manNames: () => /* @__PURE__ */ new Set([...a.keys(), ...i.keys()]),
    manPage: (u) => a.get(u) ?? i.get(u) ?? null,
    supersedes: new Set(e.supersedes ?? [])
  };
}
const j = {
  name: "text",
  // grep/wc/head/tail exist as simpler posix commands — this package
  // replaces them on purpose (integration TODO #9: silences the four
  // [packages] mount warnings). Until the chunk is resident the superseded
  // base commands answer (manifest.ts fallback wrapper).
  supersedes: ["grep", "wc", "head", "tail"],
  commands: [
    {
      name: "grep",
      summary: "print lines matching a pattern",
      usage: "grep [-EFivnclLowx] [-A|-B|-C N] [--color[=when]] PATTERN [file...]",
      man: [
        "GREP(1)                   semtext-sh manual",
        "",
        "NAME",
        "     grep — print lines matching a pattern (short page; the full one",
        "     prints once the package body has loaded)."
      ]
    },
    {
      name: "sort",
      summary: "sort lines of text",
      usage: "sort [-nruhV] [-k POS[,POS]] [-t C] [file...]",
      man: [
        "SORT(1)                   semtext-sh manual",
        "",
        "NAME",
        "     sort — sort lines of text (-n numeric, -r reverse, -u unique,",
        "     -k keys, -t separator; short page until the body loads)."
      ]
    },
    {
      name: "uniq",
      summary: "drop adjacent duplicate lines",
      usage: "uniq [-cdui] [file...]",
      man: [
        "UNIQ(1)                   semtext-sh manual",
        "",
        "NAME",
        "     uniq — drop adjacent duplicate lines (-c counts, -d/-u filter,",
        "     -i ignore case; short page until the body loads)."
      ]
    },
    {
      name: "wc",
      summary: "count lines, words, chars, bytes",
      usage: "wc [-l | -w | -c | -m] [file...]",
      man: [
        "WC(1)                     semtext-sh manual",
        "",
        "NAME",
        "     wc — count lines, words, characters and bytes (short page until",
        "     the body loads)."
      ]
    },
    {
      name: "head",
      summary: "print the first lines/bytes",
      usage: "head [-n N | -N] [-c N] [file...]",
      man: [
        "HEAD(1)                   semtext-sh manual",
        "",
        "NAME",
        "     head — print the first lines or bytes of each file (short page",
        "     until the body loads)."
      ]
    },
    {
      name: "tail",
      summary: "print the last lines/bytes",
      usage: "tail [-n N | -N | -n +N] [-c N] [-f] [file...]",
      man: [
        "TAIL(1)                   semtext-sh manual",
        "",
        "NAME",
        "     tail — print the last lines or bytes (-n +N starts at line N;",
        "     short page until the body loads)."
      ]
    },
    {
      name: "cut",
      summary: "select fields or characters per line",
      usage: "cut (-d C -f LIST | -c LIST) [file...]",
      man: [
        "CUT(1)                    semtext-sh manual",
        "",
        "NAME",
        "     cut — select fields (-d/-f) or characters (-c) from each line",
        "     (short page until the body loads)."
      ]
    },
    {
      name: "tr",
      summary: "translate, squeeze, delete characters",
      usage: "tr [-cds] SET1 [SET2]",
      man: [
        "TR(1)                     semtext-sh manual",
        "",
        "NAME",
        "     tr — translate, squeeze or delete characters from stdin (short",
        "     page until the body loads)."
      ]
    },
    {
      name: "tee",
      summary: "copy stdin to files and stdout",
      usage: "tee [-a] [file...]",
      man: [
        "TEE(1)                    semtext-sh manual",
        "",
        "NAME",
        "     tee — copy stdin into files while passing it through (-a appends;",
        "     short page until the body loads)."
      ]
    },
    {
      name: "xargs",
      summary: "build command lines from stdin",
      usage: "xargs [-0] [-n N] [-I STR] [-r] [CMD [ARG...]]",
      man: [
        "XARGS(1)                  semtext-sh manual",
        "",
        "NAME",
        "     xargs — build and run command lines from stdin items (short page",
        "     until the body loads)."
      ]
    },
    {
      name: "nl",
      summary: "number lines",
      usage: "nl [-b a|t] [-w N] [-s SEP] [file...]",
      man: [
        "NL(1)                     semtext-sh manual",
        "",
        "NAME",
        "     nl — number lines (-b a|t style, -w width, -s separator; short",
        "     page until the body loads)."
      ]
    },
    {
      name: "rev",
      summary: "reverse each line",
      usage: "rev [file...]",
      man: [
        "REV(1)                    semtext-sh manual",
        "",
        "NAME",
        "     rev — reverse the characters of each line (short page until the",
        "     body loads)."
      ]
    },
    {
      name: "paste",
      summary: "join files line-wise side by side",
      usage: "paste [-d LIST] [-s] [file...]",
      man: [
        "PASTE(1)                  semtext-sh manual",
        "",
        "NAME",
        "     paste — join files line-wise (-s serial, -d delimiters; short",
        "     page until the body loads)."
      ]
    },
    {
      name: "column",
      summary: "align whitespace-separated columns",
      usage: "column [-t] [file...]",
      man: [
        "COLUMN(1)                 semtext-sh manual",
        "",
        "NAME",
        "     column -t — align whitespace-separated input into columns (short",
        "     page until the body loads)."
      ]
    },
    {
      name: "fold",
      summary: "wrap long lines",
      usage: "fold [-w N] [-s] [file...]",
      man: [
        "FOLD(1)                   semtext-sh manual",
        "",
        "NAME",
        "     fold — wrap each line at a width (-s breaks after blanks; short",
        "     page until the body loads)."
      ]
    },
    {
      name: "expand",
      summary: "expand tabs to spaces",
      usage: "expand [-t N | -t LIST] [file...]",
      man: [
        "EXPAND(1)                 semtext-sh manual",
        "",
        "NAME",
        "     expand — expand tabs to spaces (-t sets the stops; short page",
        "     until the body loads)."
      ]
    }
  ]
};
Q(j, () => X("text"));
const w = (e) => j.commands.find((s) => s.name === e).usage;
function E(e) {
  if (e === "") return [];
  const s = e.split(`
`);
  return e.endsWith(`
`) ? s.slice(0, -1) : s;
}
const _ = new TextEncoder(), H = (e) => _.encode(e).length, S = (e) => [...e];
function N(e, s) {
  const t = [];
  let o = !1;
  for (const a of e) {
    if (o || a.length <= 2 || a[0] !== "-" || a[1] === "-" || /^-\d+$/.test(a)) {
      a === "--" && !o && (o = !0), t.push(a);
      continue;
    }
    if (s.includes(a[1]))
      t.push("-" + a[1], a.slice(2));
    else
      for (const i of a.slice(1)) t.push("-" + i);
  }
  return t;
}
function A(e, s, t, o = 1) {
  const a = [];
  let i = !1;
  if (t.length === 0)
    return e.stdin === null ? (e.err(`${s}: no input (pipe one in, or name a file)`), e.exit(o), null) : (a.push({ label: null, text: e.stdin }), a);
  for (const f of t) {
    if (f === "-") {
      a.push({ label: null, text: e.stdin ?? "" });
      continue;
    }
    const c = e.vfs.resolve(e.state.cwd, f), r = e.vfs.nodeAt(c);
    if (!r) {
      e.err(`${s}: ${f}: No such file or directory`), i = !0;
      continue;
    }
    if (r.kind === "dir") {
      e.err(`${s}: ${f}: Is a directory`), i = !0;
      continue;
    }
    a.push({ label: f, text: r.content });
  }
  return i && e.exit(1), a;
}
function Z(e) {
  if (e === "") return "empty list";
  const s = [];
  for (const t of e.split(",")) {
    let o = /^(\d+)$/.exec(t);
    if (o) {
      const a = Number(o[1]);
      if (a < 1) return t;
      s.push([a, a]);
      continue;
    }
    if (o = /^(\d+)-$/.exec(t), o) {
      const a = Number(o[1]);
      if (a < 1) return t;
      s.push([a, 1 / 0]);
      continue;
    }
    if (o = /^-(\d+)$/.exec(t), o) {
      const a = Number(o[1]);
      if (a < 1) return t;
      s.push([1, a]);
      continue;
    }
    if (o = /^(\d+)-(\d+)$/.exec(t), o) {
      const a = Number(o[1]), i = Number(o[2]);
      if (a < 1 || i < a) return t;
      s.push([a, i]);
      continue;
    }
    return t;
  }
  return s.sort((t, o) => t[0] - o[0]), s;
}
const z = (e, s) => e.some(([t, o]) => s >= t && s <= o);
function C(e) {
  if (!e.includes("\\")) return e;
  let s = "";
  for (let t = 0; t < e.length; t++) {
    if (e[t] !== "\\" || t + 1 >= e.length) {
      s += e[t];
      continue;
    }
    const o = e[++t];
    s += o === "t" ? "	" : o === "n" ? `
` : o === "r" ? "\r" : o === "a" ? "\x07" : o === "b" ? "\b" : o === "f" ? "\f" : o === "v" ? "\v" : o;
  }
  return s;
}
const F = "\x1B[01;31m", ee = "\x1B[32m", te = "\x1B[35m", B = "\x1B[36m", R = "\x1B[0m";
function ne(e) {
  let s = "", t = !1;
  for (let o = 0; o < e.length; o++) {
    const a = e[o];
    if (a === "\\") {
      const i = e[++o];
      if (i === void 0) {
        s += "\\\\";
        break;
      }
      !t && "|+?(){}".includes(i) ? s += i : s += "\\" + i;
      continue;
    }
    if (t) {
      s += a, a === "]" && (t = !1);
      continue;
    }
    if (a === "[") {
      t = !0, s += a, e[o + 1] === "^" && (s += "^", o++);
      continue;
    }
    "|+?(){}".includes(a) ? s += "\\" + a : s += a;
  }
  return s;
}
function se(e, s) {
  let t;
  e.F ? t = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : e.E ? t = s : t = ne(s), e.x ? t = `^(?:${t})$` : e.w && (t = `\\b(?:${t})\\b`);
  try {
    return new RegExp(t, e.i ? "i" : "");
  } catch {
    return `grep: invalid pattern: ${s}`;
  }
}
const re = {
  name: "grep",
  usage: w("grep"),
  run(e) {
    const s = N(e.args, "ABC"), t = {
      E: !1,
      F: !1,
      i: !1,
      v: !1,
      n: !1,
      c: !1,
      l: !1,
      L: !1,
      o: !1,
      w: !1,
      x: !1,
      r: !1,
      // House convention (posix `ls --color`): colors are opt-in — the
      // default is `never`; `--color`/`=always` force paint, `=auto`
      // paints when the stage's stdout is the terminal (ctx.color).
      color: "never",
      after: 0,
      before: 0
    }, o = [];
    for (let m = 0; m < s.length; m++) {
      const p = s[m], b = (y) => {
        const M = s[++m], $ = Number(M);
        return M === void 0 || M === "" || !Number.isInteger($) || $ < 0 ? (e.err(`grep: ${y}: invalid context length argument`), e.exit(2), !1) : (y === "A" ? t.after = $ : (y === "B" || (t.after = $), t.before = $), !0);
      };
      if (p === "-E" || p === "--extended-regexp") t.E = !0;
      else if (p === "-F" || p === "--fixed-strings") t.F = !0;
      else {
        if (p === "-G" || p === "--basic-regexp") continue;
        if (p === "-i" || p === "--ignore-case") t.i = !0;
        else if (p === "-v" || p === "--invert-match") t.v = !0;
        else if (p === "-n") t.n = !0;
        else if (p === "-c" || p === "--count") t.c = !0;
        else if (p === "-l" || p === "--files-with-matches") t.l = !0;
        else if (p === "-L" || p === "--files-without-match") t.L = !0;
        else if (p === "-o" || p === "--only-matching") t.o = !0;
        else if (p === "-w" || p === "--word-regexp") t.w = !0;
        else if (p === "-x" || p === "--line-regexp") t.x = !0;
        else if (p === "-r" || p === "-R" || p === "--recursive") t.r = !0;
        else if (p === "-A") {
          if (!b("A")) return;
        } else if (p === "-B") {
          if (!b("B")) return;
        } else if (p === "-C") {
          if (!b("C")) return;
        } else if (p === "--color" || p === "--colour" || p.startsWith("--color=") || p.startsWith("--colour=")) {
          if (t.color = p.split("=")[1] ?? "always", !["auto", "always", "never"].includes(t.color)) {
            e.err(`grep: invalid argument '${t.color}' for '--color'`), e.exit(2);
            return;
          }
        } else {
          if (p === "--") continue;
          if (p.startsWith("--")) {
            e.err(`grep: unrecognized option '${p}'`), e.exit(2);
            return;
          } else if (p.startsWith("-") && p !== "-") {
            e.err(`grep: invalid option -- '${p[1]}'`), e.exit(2);
            return;
          } else o.push(p);
        }
      }
    }
    const a = o.shift();
    if (a === void 0 || a === "") {
      e.err("grep: usage: grep [-EFivnclLowx] [-A|-B|-C N] [--color[=when]] PATTERN [file...]"), e.exit(2);
      return;
    }
    const i = se(t, a);
    if (typeof i == "string") {
      e.err(i), e.exit(2);
      return;
    }
    const f = i, c = t.color === "always" || t.color === "auto" && e.color, r = o, l = [];
    let n = !1;
    if (r.length === 0) {
      if (e.stdin === null) {
        e.err("grep: no input (pipe one in, or name a file)"), e.exit(2);
        return;
      }
      l.push({ label: null, text: e.stdin });
    } else
      for (const m of r) {
        const p = e.vfs.resolve(e.state.cwd, m), b = e.vfs.nodeAt(p);
        if (!b) {
          e.err(`grep: ${m}: No such file or directory`), n = !0;
          continue;
        }
        if (b.kind === "file") {
          l.push({ label: m, text: b.content });
          continue;
        }
        if (!t.r) {
          e.err(`grep: ${m}: Is a directory`), n = !0;
          continue;
        }
        const y = (M, $) => {
          for (const g of [...M.children].sort((v, k) => v.name.localeCompare(k.name))) {
            const v = `${$}/${g.name}`;
            g.kind === "dir" ? y(g, v) : l.push({ label: v, text: g.content });
          }
        };
        y(b, m.replace(/\/+$/, ""));
      }
    const u = l.length > 1 || l.some((m) => m.label !== null);
    let d = !1;
    const h = new RegExp(f.source, f.flags + "g");
    for (const m of l) {
      const p = E(m.text), b = p.map((g) => {
        const v = f.test(g);
        return t.v ? !v : v;
      }), y = b.some(Boolean);
      if (y && (d = !0), t.l || t.L) {
        t.l === y && e.out(m.label ?? "(standard input)");
        continue;
      }
      if (t.c) {
        const g = b.filter(Boolean).length;
        e.out(u && m.label !== null ? `${m.label}:${g}` : String(g));
        continue;
      }
      const M = (g, v) => {
        const k = [];
        if (u && m.label !== null && k.push(c ? te + m.label + R : m.label), t.n) {
          const P = String(g + 1);
          k.push(c ? (v === "match" ? ee : B) + P + R : P);
        }
        const I = v === "match" ? ":" : "-";
        return k.length === 0 ? "" : k.join(I) + I;
      };
      if (t.o && !t.v) {
        for (let g = 0; g < p.length; g++) {
          if (!b[g]) continue;
          h.lastIndex = 0;
          let v;
          for (; (v = h.exec(p[g])) !== null; )
            e.out(M(g, "match") + (c ? F + v[0] + R : v[0])), v[0] === "" && h.lastIndex++;
        }
        continue;
      }
      if (t.o) continue;
      const $ = [];
      for (let g = 0; g < p.length; g++) {
        if (!b[g]) continue;
        const v = Math.max(0, g - t.before), k = Math.min(p.length - 1, g + t.after), I = $[$.length - 1], P = I === void 0 ? -1 : I[I.length - 1][0];
        if (I !== void 0 && v <= P + 1)
          for (let T = P + 1; T <= k; T++)
            I.push([T, b[T] ? "match" : "context"]);
        else {
          const T = [];
          for (let q = v; q <= k; q++) T.push([q, b[q] ? "match" : "context"]);
          $.push(T);
        }
      }
      for (let g = 0; g < $.length; g++) {
        g > 0 && e.out(c ? B + "--" + R : "--");
        for (const [v, k] of $[g]) {
          const I = p[v], P = c && k === "match" ? I.replace(h, F + "$&" + R) : I;
          e.out(M(v, k) + P);
        }
      }
    }
    n ? e.exit(2) : e.exit(d ? 0 : 1);
  }
};
function ie(e) {
  const s = (f) => {
    const c = /^(\d+)(?:\.(\d+))?([nrbh]*)$/.exec(f);
    return c ? { field: Number(c[1]), char: c[2] === void 0 ? void 0 : Number(c[2]), mods: c[3] ?? "" } : f;
  }, [t, o] = e.split(",");
  if (o !== void 0 && e.split(",").length > 2) return e;
  const a = s(t ?? "");
  if (typeof a == "string" || a.field < 1) return e;
  const i = { from: a.field, fromChar: a.char };
  if (i.n = a.mods.includes("n") || void 0, i.r = a.mods.includes("r") || void 0, i.h = a.mods.includes("h") || void 0, o !== void 0) {
    const f = s(o);
    if (typeof f == "string" || f.field < 1) return e;
    i.to = f.field, i.toChar = f.char, i.n = i.n || f.mods.includes("n") || void 0, i.r = i.r || f.mods.includes("r") || void 0, i.h = i.h || f.mods.includes("h") || void 0;
  }
  return i;
}
const oe = (e, s) => {
  if (s !== null) return e.split(s);
  const t = e.trim();
  return t === "" ? [""] : t.split(/\s+/);
};
function W(e, s, t) {
  const o = oe(e, t), a = Math.min(s.from, o.length) - 1;
  let i;
  if (s.to === void 0)
    i = o.slice(a).join(t ?? " ");
  else {
    const f = Math.min(s.to, o.length) - 1;
    i = o.slice(a, f + 1).join(t ?? " ");
  }
  return s.fromChar !== void 0 && s.fromChar > 0 ? i = S(i).slice(s.fromChar - 1).join("") : s.toChar !== void 0 && s.toChar > 0 && s.to !== void 0 && s.to === s.from && (i = S(i).slice(0, s.toChar).join("")), i;
}
const le = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
function G(e) {
  const s = le.exec(e.trim());
  return s === null ? 0 : Number(s[0]);
}
const ae = { K: 1, M: 2, G: 3, T: 4, P: 5, E: 6 };
function D(e) {
  const s = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))([kKMGTPPE]?)/.exec(e.trim());
  if (s === null) return 0;
  const t = ae[(s[2] ?? "").toUpperCase()] ?? 0;
  return Number(s[1]) * 1024 ** t;
}
function Y(e) {
  return (e.match(/\d+|\D+/g) ?? []).map((t) => /^\d+$/.test(t) ? { num: Number(t), text: t } : { num: null, text: t });
}
function ue(e, s) {
  const t = Y(e), o = Y(s);
  for (let a = 0; a < Math.max(t.length, o.length); a++) {
    const i = t[a], f = o[a];
    if (i === void 0) return -1;
    if (f === void 0) return 1;
    if (i.num !== null && f.num !== null) {
      if (i.num !== f.num) return i.num < f.num ? -1 : 1;
    } else if (i.text !== f.text)
      return i.text < f.text ? -1 : 1;
  }
  return 0;
}
function O(e, s, t) {
  if (t === "numeric") {
    const o = G(e), a = G(s);
    return o === a ? 0 : o < a ? -1 : 1;
  }
  if (t === "human") {
    const o = D(e), a = D(s);
    return o === a ? 0 : o < a ? -1 : 1;
  }
  return t === "version" ? ue(e, s) : e < s ? -1 : e > s ? 1 : 0;
}
const fe = {
  name: "sort",
  usage: w("sort"),
  run(e) {
    const s = N(e.args, "kt"), t = { numeric: !1, reverse: !1, unique: !1, human: !1, version: !1, tab: null, keys: [] }, o = [];
    for (let n = 0; n < s.length; n++) {
      const u = s[n];
      if (u === "-n") t.numeric = !0;
      else if (u === "-r") t.reverse = !0;
      else if (u === "-u") t.unique = !0;
      else if (u === "-h") t.human = !0;
      else if (u === "-V") t.version = !0;
      else if (u === "-t") {
        const d = s[++n];
        if (d === void 0 || d === "") {
          e.err("sort: option -t requires an argument"), e.exit(2);
          return;
        }
        const h = C(d);
        if (S(h).length !== 1) {
          e.err("sort: multi-character tab"), e.exit(2);
          return;
        }
        t.tab = h;
      } else if (u === "-k") {
        const d = s[++n];
        if (d === void 0 || d === "") {
          e.err("sort: option -k requires an argument"), e.exit(2);
          return;
        }
        const h = ie(d);
        if (typeof h == "string") {
          e.err(`sort: invalid specification '${h}'`), e.exit(2);
          return;
        }
        t.keys.push(h);
      } else {
        if (u === "--") continue;
        if (u.startsWith("--")) {
          e.err(`sort: unrecognized option '${u}'`), e.exit(2);
          return;
        } else if (u.startsWith("-") && u !== "-") {
          e.err(`sort: invalid option -- '${u[1]}'`), e.exit(2);
          return;
        } else o.push(u);
      }
    }
    const a = A(e, "sort", o, 2);
    if (a === null) return;
    const i = [];
    for (const n of a) i.push(...E(n.text));
    const f = t.numeric ? "numeric" : t.human ? "human" : t.version ? "version" : "plain", c = i.map((n) => ({
      line: n,
      keys: t.keys.map((u) => W(n, u, t.tab))
    })), r = (n) => n.n ? "numeric" : n.h ? "human" : f;
    c.sort((n, u) => {
      for (let h = 0; h < t.keys.length; h++) {
        const m = t.keys[h], p = O(n.keys[h], u.keys[h], r(m));
        if (p !== 0) return m.r ?? t.reverse ? -p : p;
      }
      const d = O(n.line, u.line, f);
      return d !== 0 ? t.reverse ? -d : d : 0;
    });
    let l = c.map((n) => n.line);
    if (t.unique) {
      const n = (d, h) => {
        for (let m = 0; m < t.keys.length; m++) {
          const p = t.keys[m];
          if (O(W(d, p, t.tab), W(h, p, t.tab), r(p)) !== 0)
            return !1;
        }
        return t.keys.length > 0 ? !0 : O(d, h, f) === 0;
      }, u = [];
      for (const d of l)
        u.length > 0 && n(u[u.length - 1], d) || u.push(d);
      l = u;
    }
    for (const n of l) e.out(n);
  }
}, ce = {
  name: "uniq",
  usage: w("uniq"),
  run(e) {
    const s = N(e.args, ""), t = { c: !1, d: !1, u: !1, i: !1 }, o = [];
    for (const r of s)
      if (r === "-c" || r === "--count") t.c = !0;
      else if (r === "-d" || r === "--repeated") t.d = !0;
      else if (r === "-u" || r === "--unique") t.u = !0;
      else if (r === "-i" || r === "--ignore-case") t.i = !0;
      else {
        if (r === "--") continue;
        if (r.startsWith("--")) {
          e.err(`uniq: unrecognized option '${r}'`), e.exit(2);
          return;
        } else if (r.startsWith("-") && r !== "-") {
          e.err(`uniq: invalid option -- '${r[1]}'`), e.exit(2);
          return;
        } else o.push(r);
      }
    const a = A(e, "uniq", o);
    if (a === null) return;
    const i = [];
    for (const r of a) i.push(...E(r.text));
    const f = (r) => t.i ? r.toLowerCase() : r;
    let c = 0;
    for (; c < i.length; ) {
      let r = 1;
      for (; c + r < i.length && f(i[c + r]) === f(i[c]); ) r++;
      (!t.d && !t.u || t.d && r > 1 || t.u && r === 1) && e.out(t.c ? `${String(r).padStart(7)} ${i[c]}` : i[c]), c += r;
    }
  }
}, de = {
  name: "wc",
  usage: w("wc"),
  run(e) {
    const s = N(e.args, ""), t = { l: !1, w: !1, c: !1, m: !1 }, o = [];
    for (const r of s)
      if (r !== "--")
        if (r.startsWith("--")) {
          e.err(`wc: unrecognized option '${r}'`), e.exit(2);
          return;
        } else if (r.startsWith("-") && r !== "-")
          for (const l of r.slice(1))
            if (l === "l") t.l = !0;
            else if (l === "w") t.w = !0;
            else if (l === "c") t.c = !0;
            else if (l === "m") t.m = !0;
            else {
              e.err(`wc: invalid option -- '${l}'`), e.exit(2);
              return;
            }
        else o.push(r);
    const i = t.l || t.w || t.c || t.m ? ["l", "w", "m", "c"].filter((r) => t[r]) : ["l", "w", "c"], f = A(e, "wc", o);
    if (f === null) return;
    const c = { l: 0, w: 0, m: 0, c: 0 };
    for (const r of f) {
      const l = {
        l: E(r.text).length,
        w: r.text.trim() === "" ? 0 : r.text.trim().split(/\s+/).length,
        m: S(r.text).length,
        c: H(r.text)
      };
      c.l += l.l, c.w += l.w, c.m += l.m, c.c += l.c;
      const n = i.map((u) => String(l[u]).padStart(7)).join("");
      e.out(r.label === null ? n : `${n} ${r.label}`);
    }
    if (f.length > 1) {
      const r = i.map((l) => String(c[l]).padStart(7)).join("");
      e.out(`${r} total`);
    }
  }
};
function L(e, s, t) {
  const a = _.encode(e).slice(s, t);
  return new TextDecoder("utf-8", { fatal: !1 }).decode(a);
}
function U(e, s, t) {
  return e === "" || /[^0-9]/.test(e) ? `${s}: invalid number of ${t}: '${e}'` : Number(e);
}
function K(e) {
  const s = e ? "tail" : "head";
  return (t) => {
    const o = N(t.args, "nc");
    let a = 10, i = null, f = !1, c = !1;
    const r = [];
    for (let n = 0; n < o.length; n++) {
      const u = o[n], d = (h, m) => {
        if (m === void 0)
          return t.err(`${s}: option -${h === "lines" ? "n" : "c"} requires an argument`), t.exit(1), null;
        let p = m, b = !1;
        e && p.startsWith("+") ? (b = !0, p = p.slice(1)) : !e && p.startsWith("+") && (p = p.slice(1));
        const y = U(p, s, h);
        return typeof y == "string" ? (t.err(y), t.exit(1), null) : (h === "lines" ? (a = y, f = b) : (i = y, c = b), y);
      };
      if (u === "-n") {
        if (d("lines", o[++n]) === null) return;
      } else if (u === "-c") {
        if (d("bytes", o[++n]) === null) return;
      } else if (/^-\d+$/.test(u)) {
        const h = U(u.slice(1), s, "lines");
        if (typeof h == "string") {
          t.err(h), t.exit(1);
          return;
        }
        a = h;
      } else if (u !== "-f") {
        if (u === "--") continue;
        if (u.startsWith("--")) {
          t.err(`${s}: unrecognized option '${u}'`), t.exit(1);
          return;
        } else if (u.startsWith("-") && u !== "-") {
          t.err(`${s}: invalid option -- '${u[1]}'`), t.exit(1);
          return;
        } else r.push(u);
      }
    }
    const l = A(t, s, r);
    if (l !== null)
      for (let n = 0; n < l.length; n++) {
        const u = l[n];
        if (l.length > 1 && (n > 0 && t.out(""), t.out(`==> ${u.label} <==`)), i !== null) {
          const m = e ? c ? L(u.text, i - 1, 1 / 0) : L(u.text, Math.max(0, H(u.text) - i), 1 / 0) : L(u.text, 0, i);
          if (m === "") continue;
          for (const p of m.replace(/\n$/, "").split(`
`)) t.out(p);
          continue;
        }
        const d = E(u.text), h = e ? f ? d.slice(Math.max(0, a - 1)) : a === 0 ? [] : d.slice(-a) : d.slice(0, a);
        for (const m of h) t.out(m);
      }
  };
}
const he = { name: "head", usage: w("head"), run: K(!1) }, pe = { name: "tail", usage: w("tail"), run: K(!0) }, me = {
  name: "cut",
  usage: w("cut"),
  run(e) {
    const s = N(e.args, "dfc");
    let t = "	", o = null, a = null, i = !1;
    const f = [];
    for (let n = 0; n < s.length; n++) {
      const u = s[n];
      if (u === "-d") {
        const d = s[++n];
        if (d === void 0) {
          e.err("cut: option -d requires an argument"), e.exit(1);
          return;
        }
        if (i = !0, t = C(d), S(t).length !== 1) {
          e.err("cut: the delimiter must be a single character"), e.exit(1);
          return;
        }
      } else if (u === "-f") {
        const d = s[++n];
        if (d === void 0) {
          e.err("cut: option -f requires an argument"), e.exit(1);
          return;
        }
        o = d;
      } else if (u === "-c") {
        const d = s[++n];
        if (d === void 0) {
          e.err("cut: option -c requires an argument"), e.exit(1);
          return;
        }
        a = d;
      } else {
        if (u === "--") continue;
        if (u.startsWith("--")) {
          e.err(`cut: unrecognized option '${u}'`), e.exit(2);
          return;
        } else if (u.startsWith("-") && u !== "-") {
          e.err(`cut: invalid option -- '${u[1]}'`), e.exit(2);
          return;
        } else f.push(u);
      }
    }
    if (o !== null == (a !== null)) {
      e.err(
        o !== null ? "cut: only one type of list may be specified" : "cut: you must specify a list of bytes, characters, or fields"
      ), e.exit(1);
      return;
    }
    if (a !== null && i) {
      e.err("cut: an input delimiter may be specified only when operating on fields"), e.exit(1);
      return;
    }
    const r = Z(o ?? a);
    if (typeof r == "string") {
      e.err(`cut: invalid range: ${r}`), e.exit(1);
      return;
    }
    const l = A(e, "cut", f);
    if (l !== null)
      for (const n of l)
        for (const u of E(n.text))
          if (o !== null) {
            if (!u.includes(t)) {
              e.out(u);
              continue;
            }
            const d = u.split(t), h = [];
            for (let m = 1; m <= d.length; m++)
              z(r, m) && h.push(d[m - 1]);
            e.out(h.join(t));
          } else {
            const d = S(u);
            let h = "";
            for (let m = 1; m <= d.length; m++)
              z(r, m) && (h += d[m - 1]);
            e.out(h);
          }
  }
}, ge = {
  upper: (e) => e >= 65 && e <= 90,
  lower: (e) => e >= 97 && e <= 122,
  digit: (e) => e >= 48 && e <= 57,
  alpha: (e) => e >= 65 && e <= 90 || e >= 97 && e <= 122,
  alnum: (e) => e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57,
  space: (e) => e === 32 || e >= 9 && e <= 13,
  blank: (e) => e === 32 || e === 9,
  punct: (e) => e >= 33 && e <= 47,
  xdigit: (e) => e >= 48 && e <= 57 || e >= 65 && e <= 70 || e >= 97 && e <= 102,
  cntrl: (e) => e >= 0 && e <= 31 || e === 127,
  print: (e) => e >= 32 && e <= 126,
  graph: (e) => e >= 33 && e <= 126
};
function V(e) {
  const s = [];
  let t = 0;
  for (; t < e.length; ) {
    if (e.startsWith("[:", t)) {
      const i = e.indexOf(":]", t + 2);
      if (i === -1) return e.slice(t);
      const f = e.slice(t + 2, i), c = ge[f];
      if (!c) return `[:${f}:]`;
      for (let r = 0; r <= 383; r++)
        c(r) && s.push(String.fromCodePoint(r));
      t = i + 2;
      continue;
    }
    const o = e[t];
    if (o === "\\" && t + 1 < e.length) {
      s.push(C(e.slice(t, t + 2))), t += 2;
      continue;
    }
    if (e[t + 1] === "-" && t + 2 < e.length && e[t + 2] !== "]") {
      const i = e[t + 2], f = i === "\\" ? C(e.slice(t + 2, t + 4)) : i, c = o.codePointAt(0), r = f.codePointAt(0);
      if (f === "" || r < c) return `${o}-${i}`;
      for (let l = c; l <= r; l++) s.push(String.fromCodePoint(l));
      t += i === "\\" ? 4 : 3;
      continue;
    }
    s.push(o), t++;
  }
  return s;
}
const ye = {
  name: "tr",
  usage: w("tr"),
  run(e) {
    const s = N(e.args, ""), t = { d: !1, s: !1, c: !1 }, o = [];
    for (const n of s)
      if (n === "-d") t.d = !0;
      else if (n === "-s" || n === "--squeeze-repeats") t.s = !0;
      else if (n === "-c" || n === "-C" || n === "--complement") t.c = !0;
      else {
        if (n === "--") continue;
        if (n.startsWith("--")) {
          e.err(`tr: unrecognized option '${n}'`), e.exit(2);
          return;
        } else if (n.startsWith("-") && n !== "-") {
          e.err(`tr: invalid option -- '${n[1]}'`), e.exit(2);
          return;
        } else o.push(n);
      }
    if (o.length === 0) {
      e.err("usage: tr [-cds] SET1 [SET2]"), e.exit(2);
      return;
    }
    if (!t.d && !t.s && o.length < 2) {
      e.err(`tr: missing operand after '${o[0]}'`), e.exit(1);
      return;
    }
    if (o.length > 2 || t.d && o.length > 1) {
      e.err(`tr: extra operand '${o[t.d ? 1 : 2] ?? ""}'`), e.exit(1);
      return;
    }
    if (t.c && !t.d && !t.s) {
      e.err("tr: -c is only supported with -d or -s in this emulation"), e.exit(1);
      return;
    }
    const a = V(o[0]);
    if (typeof a == "string") {
      e.err(`tr: invalid character class or range '${a}'`), e.exit(1);
      return;
    }
    const i = a;
    let f = [];
    if (!t.d && o.length >= 2) {
      const n = V(o[1]);
      if (typeof n == "string") {
        e.err(`tr: invalid character class or range '${n}'`), e.exit(1);
        return;
      }
      if (f = n, !t.c && f.length > i.length) {
        e.err(`tr: extra operand '${f[i.length]}'`), e.exit(1);
        return;
      }
    }
    if (e.stdin === null) {
      e.err("tr: no input (pipe one in)"), e.exit(1);
      return;
    }
    const c = /* @__PURE__ */ new Map();
    if (!t.d && o.length >= 2)
      for (let n = 0; n < i.length; n++)
        c.set(i[n], f[Math.min(n, f.length - 1)]);
    const r = (n) => t.c ? !i.includes(n) : i.includes(n);
    let l = e.stdin;
    if (t.d ? l = S(l).filter((n) => !r(n)).join("") : l = S(l).map((n) => c.get(n) ?? n).join(""), t.s) {
      const n = (d) => t.d || o.length < 2 || t.c ? r(d) : f.includes(d);
      let u = "";
      for (const d of S(l))
        d === u[u.length - 1] && n(d) || (u += d);
      l = u;
    }
    if (l !== "")
      for (const n of l.replace(/\n$/, "").split(`
`)) e.out(n);
  }
}, be = {
  name: "tee",
  usage: w("tee"),
  run(e) {
    const s = N(e.args, "");
    let t = !1;
    const o = [];
    for (const i of s)
      if (i === "-a" || i === "--append") t = !0;
      else {
        if (i === "--") continue;
        if (i.startsWith("--")) {
          e.err(`tee: unrecognized option '${i}'`), e.exit(2);
          return;
        } else if (i.startsWith("-") && i !== "-") {
          e.err(`tee: invalid option -- '${i[1]}'`), e.exit(2);
          return;
        } else o.push(i);
      }
    if (e.stdin === null) {
      e.err("tee: no input (pipe one in)"), e.exit(1);
      return;
    }
    for (const i of E(e.stdin)) e.out(i);
    let a = !1;
    for (const i of o) {
      const f = e.vfs.resolve(e.state.cwd, i), c = e.vfs.backendFor(f);
      if (c !== null && !c.writable) {
        e.err(`tee: ${i}: Read-only file system`), a = !0;
        continue;
      }
      const r = e.vfs.nodeAt(f);
      if (r?.kind === "dir") {
        e.err(`tee: ${i}: Is a directory`), a = !0;
        continue;
      }
      try {
        const l = t && r?.kind === "file" ? r.content : "";
        e.vfs.mountFile(f, l + e.stdin);
      } catch (l) {
        e.err(`tee: ${i}: ${l instanceof Error ? l.message : String(l)}`), a = !0;
      }
    }
    a && e.exit(1);
  }
}, ve = {
  name: "xargs",
  usage: w("xargs"),
  run(e) {
    const s = N(e.args, "nI"), t = { zero: !1, max: null, repl: null, noRunIfEmpty: !1 }, o = [];
    let a = !1;
    for (let d = 0; d < s.length; d++) {
      const h = s[d];
      if (a) {
        o.push(h);
        continue;
      }
      if (h === "--")
        a = !0;
      else if (h === "-0") t.zero = !0;
      else if (h === "-r" || h === "--no-run-if-empty") t.noRunIfEmpty = !0;
      else if (h === "-n") {
        const m = Number(s[++d]);
        if (!Number.isInteger(m) || m < 1) {
          e.err("xargs: invalid number for -n"), e.exit(1);
          return;
        }
        t.max = m;
      } else if (h === "-I") {
        const m = s[++d];
        if (m === void 0 || m === "") {
          e.err("xargs: option -I requires an argument"), e.exit(1);
          return;
        }
        t.repl = m;
      } else if (h.startsWith("-") && h !== "-") {
        e.err(`xargs: invalid option -- '${h[1]}'`), e.exit(1);
        return;
      } else o.push(h);
    }
    if (e.stdin === null) {
      e.err("xargs: no input (pipe one in)"), e.exit(1);
      return;
    }
    const i = e.stdin.endsWith(`
`) ? e.stdin.slice(0, -1) : e.stdin, f = t.zero ? i.split("\0").filter((d) => d !== "") : i.trim() === "" ? [] : i.trim().split(/\s+/), c = o[0] ?? "echo", r = o.slice(1), l = e.commands.get(c);
    if (!l) {
      e.err(`xargs: ${c}: No such file or directory`), e.exit(127);
      return;
    }
    let n = !1;
    const u = (d) => {
      let h = 0, m = 0;
      const p = {
        args: d.slice(1),
        stdin: null,
        vfs: e.vfs,
        state: e.state,
        color: !1,
        commands: e.commands,
        out: (y) => e.out(y),
        err: (y) => {
          m++, e.err(y);
        },
        emit: (y) => e.emit(y),
        exit: (y) => {
          h = y;
        }
      };
      try {
        l.run(p);
      } catch (y) {
        e.err(`xargs: ${c}: ${y instanceof Error ? y.message : String(y)}`), h = 1;
      }
      const b = h !== 0 ? h : m > 0 ? 1 : 0;
      b >= 1 && b <= 125 && (n = !0);
    };
    if (f.length === 0) {
      if (t.noRunIfEmpty) return;
      u([c, ...r]);
    } else if (t.repl !== null)
      for (const d of f)
        u([c, ...r.map((h) => h.split(t.repl).join(d))]);
    else {
      const d = t.max ?? f.length;
      for (let h = 0; h < f.length; h += d)
        u([c, ...r, ...f.slice(h, h + d)]);
    }
    e.exit(n ? 123 : 0);
  }
}, we = {
  name: "nl",
  usage: w("nl"),
  run(e) {
    const s = N(e.args, "bws");
    let t = "t", o = 6, a = "	";
    const i = [];
    for (let r = 0; r < s.length; r++) {
      const l = s[r];
      if (l === "-b") {
        const n = s[++r] ?? "t";
        if (n !== "a" && n !== "t") {
          e.err(`nl: invalid body numbering style: '${n}'`), e.exit(1);
          return;
        }
        t = n;
      } else if (l === "-w") {
        const n = Number(s[++r]);
        if (!Number.isInteger(n) || n < 1) {
          e.err("nl: invalid line number width"), e.exit(1);
          return;
        }
        o = n;
      } else if (l === "-s") {
        const n = s[++r];
        if (n === void 0) {
          e.err("nl: option -s requires an argument"), e.exit(1);
          return;
        }
        a = C(n);
      } else if (l.startsWith("-") && l !== "-" && l !== "--") {
        e.err(`nl: invalid option -- '${l[1]}'`), e.exit(1);
        return;
      } else i.push(l);
    }
    const f = A(e, "nl", i);
    if (f === null) return;
    let c = 0;
    for (const r of f)
      for (const l of E(r.text)) {
        const n = t === "a" || l !== "";
        n && c++, e.out(n ? `${String(c).padStart(o)}${a}${l}` : l);
      }
  }
}, Se = {
  name: "rev",
  usage: w("rev"),
  run(e) {
    const s = N(e.args, ""), t = [];
    for (const a of s) {
      if (a.startsWith("-") && a !== "-" && a !== "--") {
        e.err(`rev: invalid option -- '${a[1]}'`), e.exit(2);
        return;
      }
      a !== "--" && t.push(a);
    }
    const o = A(e, "rev", t);
    if (o !== null)
      for (const a of o)
        for (const i of E(a.text))
          e.out(S(i).reverse().join(""));
  }
}, Ne = {
  name: "paste",
  usage: w("paste"),
  run(e) {
    const s = N(e.args, "d");
    let t = ["	"], o = !1;
    const a = [];
    for (let l = 0; l < s.length; l++) {
      const n = s[l];
      if (n === "-d") {
        const u = s[++l];
        if (u === void 0) {
          e.err("paste: option -d requires an argument"), e.exit(1);
          return;
        }
        t = S(C(u)), t.length === 0 && (t = ["	"]);
      } else if (n === "-s" || n === "--serial") o = !0;
      else {
        if (n === "--") continue;
        if (n.startsWith("--")) {
          e.err(`paste: unrecognized option '${n}'`), e.exit(2);
          return;
        } else if (n.startsWith("-") && n !== "-") {
          e.err(`paste: invalid option -- '${n[1]}'`), e.exit(2);
          return;
        } else a.push(n);
      }
    }
    if (a.length === 0 && e.stdin === null) {
      e.err("paste: no input (pipe one in, or name a file)"), e.exit(1);
      return;
    }
    const i = [], f = (l) => {
      i.push(E(l));
    };
    if (a.length === 0)
      f(e.stdin);
    else
      for (const l of a) {
        if (l === "-") {
          f(e.stdin ?? "");
          continue;
        }
        const n = e.vfs.resolve(e.state.cwd, l), u = e.vfs.nodeAt(n);
        if (!u || u.kind === "dir") {
          e.err(`paste: ${l}: ${u ? "Is a directory" : "No such file or directory"}`);
          continue;
        }
        f(u.content);
      }
    const c = (l) => t[l % t.length];
    if (o) {
      for (const l of i) {
        let n = "";
        for (let u = 0; u < l.length; u++)
          u > 0 && (n += c(u - 1)), n += l[u];
        e.out(n);
      }
      return;
    }
    const r = i.length === 0 ? 0 : Math.max(...i.map((l) => l.length));
    for (let l = 0; l < r; l++) {
      let n = "";
      for (let u = 0; u < i.length; u++)
        u > 0 && (n += c(u - 1)), n += i[u][l] ?? "";
      e.out(n);
    }
  }
}, $e = {
  name: "column",
  usage: w("column"),
  run(e) {
    const s = N(e.args, "");
    let t = !1;
    const o = [];
    for (const r of s)
      if (r === "-t" || r === "--table") t = !0;
      else {
        if (r === "--") continue;
        if (r.startsWith("-") && r !== "-") {
          e.err(`column: unsupported option '${r}' (only -t)`), e.exit(2);
          return;
        } else o.push(r);
      }
    if (!t) {
      e.err("column: only -t is supported in this emulation"), e.exit(2);
      return;
    }
    const a = A(e, "column", o);
    if (a === null) return;
    const i = [];
    for (const r of a)
      for (const l of E(r.text)) {
        const n = l.trim();
        i.push(n === "" ? [] : n.split(/\s+/));
      }
    const f = i.length === 0 ? 0 : Math.max(...i.map((r) => r.length)), c = [];
    for (let r = 0; r < f; r++) {
      let l = 0;
      for (const n of i)
        n[r] !== void 0 && (l = Math.max(l, S(n[r]).length));
      c.push(l);
    }
    for (const r of i) {
      if (r.length === 0) {
        e.out("");
        continue;
      }
      let l = "";
      for (let n = 0; n < r.length; n++) {
        const u = r[n];
        l += u, n < r.length - 1 && (l += " ".repeat(Math.max(2, c[n] - S(u).length + 2)));
      }
      e.out(l);
    }
  }
}, Ee = {
  name: "fold",
  usage: w("fold"),
  run(e) {
    const s = N(e.args, "w");
    let t = 80, o = !1;
    const a = [];
    for (let f = 0; f < s.length; f++) {
      const c = s[f];
      if (c === "-w") {
        const r = Number(s[++f]);
        if (!Number.isInteger(r) || r < 1) {
          e.err("fold: invalid width"), e.exit(1);
          return;
        }
        t = r;
      } else if (c === "-s" || c === "--spaces") o = !0;
      else if (c.startsWith("-") && c !== "-" && c !== "--") {
        e.err(`fold: invalid option -- '${c[1]}'`), e.exit(1);
        return;
      } else a.push(c);
    }
    const i = A(e, "fold", a);
    if (i !== null)
      for (const f of i)
        for (const c of E(f.text)) {
          const r = S(c);
          let l = 0;
          for (; r.length - l > t; ) {
            let n = l + t;
            if (o) {
              let u = -1;
              for (let d = l; d < l + t; d++)
                (r[d] === " " || r[d] === "	") && (u = d);
              u >= l + 1 && (n = u + 1);
            }
            e.out(r.slice(l, n).join("")), l = n;
          }
          l < r.length && e.out(r.slice(l).join(""));
        }
  }
}, ke = {
  name: "expand",
  usage: w("expand"),
  run(e) {
    const s = N(e.args, "t");
    let t = null;
    const o = [], a = (c) => {
      const l = c.split(/[,\s]+/).filter((n) => n !== "").map((n) => Number(n));
      if (l.length === 0 || l.some((n) => !Number.isInteger(n) || n < 1))
        return e.err("expand: tab sizes must be positive integers"), !1;
      for (let n = 1; n < l.length; n++)
        if (l[n] <= l[n - 1])
          return e.err("expand: tab sizes must be ascending"), !1;
      return t = l, !0;
    };
    for (let c = 0; c < s.length; c++) {
      const r = s[c];
      if (r === "-t" || r === "--tabs") {
        const l = s[++c];
        if (l === void 0) {
          e.err("expand: option -t requires an argument"), e.exit(1);
          return;
        }
        if (!a(l)) return;
      } else if (/^--tabs=/.test(r)) {
        if (!a(r.slice(7))) return;
      } else {
        if (r === "--") continue;
        if (r.startsWith("--")) {
          e.err(`expand: unrecognized option '${r}'`), e.exit(1);
          return;
        } else if (r.startsWith("-") && r !== "-") {
          e.err(`expand: invalid option -- '${r[1]}'`), e.exit(1);
          return;
        } else o.push(r);
      }
    }
    const i = A(e, "expand", o);
    if (i === null) return;
    const f = (c) => {
      if (t === null || t.length === 1) {
        const n = t?.[0] ?? 8;
        return (Math.floor(c / n) + 1) * n;
      }
      for (const n of t)
        if (n > c) return n;
      const r = t[t.length - 1], l = r - t[t.length - 2];
      return r + (Math.floor((c - r) / l) + 1) * l;
    };
    for (const c of i)
      for (const r of E(c.text)) {
        let l = "", n = 0;
        for (const u of S(r))
          if (u === "	") {
            const d = f(n);
            l += " ".repeat(Math.max(1, d - n)), n = d;
          } else
            l += u, n++;
        e.out(l);
      }
  }
}, Ie = (e) => ({
  ...e,
  run(s) {
    if (s.args.includes("--help") || s.args.includes("-h") && e.name !== "sort") {
      const t = j.commands.find((o) => o.name === e.name);
      s.out(`${e.name} — ${t.summary}`), s.out(`usage: ${t.usage}`);
      return;
    }
    e.run(s);
  }
}), Ae = [
  re,
  fe,
  ce,
  de,
  he,
  pe,
  me,
  ye,
  be,
  ve,
  we,
  Se,
  Ne,
  $e,
  Ee,
  ke
].map(Ie), Me = {
  grep: [
    "grep — print lines matching a pattern",
    "",
    "SYNOPSIS",
    "  grep [-EFivnclLowx] [-A|-B|-C N] [--color[=when]] PATTERN [file...]",
    "",
    "Patterns are basic regular expressions by default (GNU BRE: \\| \\+ \\?",
    "\\(...\\) \\{n,m\\} are the special forms), extended with -E, or fixed",
    "strings with -F. -i ignores case, -v selects non-matching lines, -n",
    "numbers them, -c counts them, -o prints only the matched parts, -w",
    "requires a whole-word match, -x a whole-line match. -l lists files",
    "with matches, -L without. -r walks directories (`./x` labels).",
    "-A/-B/-C N print N lines of after/before/both context; groups are",
    "separated by `--`. --color=always|never|auto colors matches (auto:",
    "only when the output is a terminal). Exit status: 0 match, 1 none,",
    "2 error."
  ],
  sort: [
    "sort — sort lines of text",
    "",
    "SYNOPSIS",
    "  sort [-nruhV] [-k POS[,POS]] [-t C] [file...]",
    "",
    "-n compares by numeric prefix, -h human-numeric (1K < 1M < 1G), -V",
    "version order, -r reverses (including the last-resort whole-line",
    "comparison), -u drops lines equal under the key comparison. -k",
    "selects keys F[.C][,F[.C]] with per-key n/r/h modifiers; several",
    "-k keys compare in order. -t picks the field separator (default:",
    "blank runs). Lines are compared by code points (the C locale)."
  ],
  uniq: [
    "uniq — drop adjacent duplicate lines",
    "",
    "SYNOPSIS",
    "  uniq [-cdui] [file...]",
    "",
    "Only ADJACENT duplicates collapse — pipe through sort first unless",
    "the order matters. -c prefixes counts `%7d `, -d keeps repeated",
    "lines only, -u non-repeated only, -i compares case-insensitively."
  ],
  wc: [
    "wc — count lines, words, chars, bytes",
    "",
    "SYNOPSIS",
    "  wc [-l | -w | -c | -m] [file...]",
    "",
    "Default prints lines, words and bytes. -c counts UTF-8 bytes, -m",
    "characters (code points). Several files add a `total` line."
  ],
  head: [
    "head — print the first lines or bytes",
    "",
    "SYNOPSIS",
    "  head [-n N | -N] [-c N] [file...]",
    "",
    "Default 10 lines. -c N counts bytes (a multibyte character split by",
    "the cut decodes with a replacement marker, like the real tool).",
    "Several files get `==> f <==` headers."
  ],
  tail: [
    "tail — print the last lines or bytes",
    "",
    "SYNOPSIS",
    "  tail [-n N | -N | -n +N] [-c N] [-f] [file...]",
    "",
    "`-n +N` starts at line N. -f is SIMULATED: it prints the slice and",
    "returns — the VFS has no change-watch API yet, so nothing follows."
  ],
  cut: [
    "cut — select fields or characters per line",
    "",
    "SYNOPSIS",
    "  cut (-d C -f LIST | -c LIST) [file...]",
    "",
    "LIST is a comma list of N, N-, -M, N-M (1-based). Fields split on",
    "the -d delimiter (default TAB; selected fields are joined with it).",
    "Lines without the delimiter pass through whole (there is no -s).",
    "-c counts characters (code points)."
  ],
  tr: [
    "tr — translate, squeeze, delete characters",
    "",
    "SYNOPSIS",
    "  tr [-cds] SET1 [SET2]",
    "",
    "Reads stdin only (file operands are `extra operand` errors, like",
    "GNU). Sets accept a-z ranges, \\n \\t \\\\ escapes and [:upper:]",
    "[:lower:] [:digit:] [:alpha:] [:space:] [:alnum:] classes. A short",
    "SET2 repeats its last character; -d deletes SET1, -s squeezes",
    "repeats (of SET2 in translate mode, SET1 with -d), -c complements",
    "SET1 (with -d/-s only in this emulation)."
  ],
  tee: [
    "tee — copy stdin to files and stdout",
    "",
    "SYNOPSIS",
    "  tee [-a] [file...]",
    "",
    "-a appends instead of truncating. Read-only mounts report",
    "`Read-only file system`; one bad file does not stop the others."
  ],
  xargs: [
    "xargs — build command lines from stdin",
    "",
    "SYNOPSIS",
    "  xargs [-0] [-n N] [-I STR] [-r] [CMD [ARG...]]",
    "",
    "Whitespace-separated stdin items are appended to CMD (default",
    "echo). -0 splits on NUL, -n N chunks items per invocation, -I STR",
    "replaces STR in the arguments once per item, -r skips the run on",
    "empty input (the default runs once, GNU-style). Exit 123 when any",
    "child invocation failed (1–125), 127 when CMD is missing."
  ],
  nl: [
    "nl — number lines",
    "",
    "SYNOPSIS",
    "  nl [-b a|t] [-w N] [-s SEP] [file...]",
    "",
    "-b t (default) numbers non-empty lines only, -b a all. Numbers are",
    "right-aligned in -w columns (default 6) followed by the -s",
    "separator (default TAB)."
  ],
  rev: ["rev — reverse each line", "", "SYNOPSIS", "  rev [file...]", "", "Characters are reversed by code point (emoji survive)."],
  paste: [
    "paste — join files line-wise",
    "",
    "SYNOPSIS",
    "  paste [-d LIST] [-s] [file...]",
    "",
    "Parallel mode joins line i of every file (short files pad empty);",
    "-s pastes each file onto ONE line. -d LIST cycles delimiters per",
    "junction (default TAB); \\t \\n \\\\ escapes work. `-` reads stdin."
  ],
  column: [
    "column — align whitespace-separated columns",
    "",
    "SYNOPSIS",
    "  column [-t] [file...]",
    "",
    "Only -t (table) is supported: input splits on blank runs and every",
    "column is padded to its widest cell (two spaces between columns)."
  ],
  fold: [
    "fold — wrap long lines",
    "",
    "SYNOPSIS",
    "  fold [-w N] [-s] [file...]",
    "",
    "Default width 80, counted in characters. -s breaks after the last",
    "blank in the window (the blank ends the segment, per the GNU",
    "implementation); without a blank the break is hard."
  ],
  expand: [
    "expand — expand tabs to spaces",
    "",
    "SYNOPSIS",
    "  expand [-t N | -t LIST] [file...]",
    "",
    "Default tab stops every 8 columns. -t takes one size or an",
    "ascending comma list; tabs beyond the list repeat the last",
    "interval (util-linux behaviour). Unexpand lives in the fs lane."
  ]
};
export {
  Ae as commands,
  Ae as default,
  Me as manPages
};
