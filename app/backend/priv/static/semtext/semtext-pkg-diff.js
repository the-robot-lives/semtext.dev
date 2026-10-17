function V(e, t, i, u, n) {
  const s = [];
  return c(0, t, 0, u), J(s);
  function c(o, r, l, p) {
    for (; o < r && l < p && n(e[o], i[l]); )
      s.push({ t: "eq", ai: o, bi: l }), o++, l++;
    let h = [];
    for (; r > o && p > l && n(e[r - 1], i[p - 1]); )
      h.push({ t: "eq", ai: r - 1, bi: p - 1 }), r--, p--;
    if (h.reverse(), o === r)
      for (let m = l; m < p; m++) s.push({ t: "ins", bi: m });
    else if (l === p)
      for (let m = o; m < r; m++) s.push({ t: "del", ai: m });
    else if (r - o + (p - l) > 4096)
      a(o, r, l, p);
    else {
      const m = Q(e, o, r, i, l, p, n);
      if (m !== null && (m.u > o || m.v > l) && (m.x < r || m.y < p)) {
        c(o, m.x, l, m.y);
        for (let $ = m.x, d = m.y; $ < m.u; $++, d++) s.push({ t: "eq", ai: $, bi: d });
        c(m.u, r, m.v, p);
      } else
        a(o, r, l, p);
    }
    for (const m of h) s.push(m);
  }
  function a(o, r, l, p) {
    const h = o + r >> 1, m = l + Math.round((p - l) * (h - o) / (r - o));
    c(o, h, l, Math.max(l, Math.min(p, m))), c(h, r, Math.max(l, Math.min(p, m)), p);
  }
}
function J(e) {
  const t = [];
  let i = 0;
  for (; i < e.length; ) {
    if (e[i].t === "eq") {
      t.push(e[i++]);
      continue;
    }
    const u = [], n = [];
    for (; i < e.length && e[i].t !== "eq"; )
      (e[i].t === "del" ? u : n).push(e[i++]);
    for (const s of u) t.push(s);
    for (const s of n) t.push(s);
  }
  return t;
}
function Q(e, t, i, u, n, s, c) {
  const a = i - t, o = s - n, r = a - o, l = (r & 1) !== 0, p = a + o + 1 >> 1, h = p + 2, m = new Int32Array(2 * h + 1), $ = new Int32Array(2 * h + 1).fill(-1), d = new Int32Array(2 * h + 1), f = new Int32Array(2 * h + 1).fill(-1);
  for (let w = 0; w <= p; w++) {
    const b = -w, v = w;
    for (let g = b; g <= v; g += 2) {
      let N;
      if (w === 0 && g === 0)
        N = 0;
      else {
        const W = g > b && $[h + g - 1] === w - 1, O = g < v && $[h + g + 1] === w - 1, C = W ? m[h + g - 1] + 1 : Number.MAX_SAFE_INTEGER, M = O ? m[h + g + 1] : Number.MAX_SAFE_INTEGER, y = W && C <= a, A = O && M <= a && M - g <= o;
        if (!y && !A) continue;
        N = y && A ? Math.max(C, M) : y ? C : M;
      }
      let k = N - g;
      const D = N, R = k;
      for (; N < a && k < o && c(e[t + N], u[n + k]); )
        N++, k++;
      if (m[h + g] = N, $[h + g] = w, l && f[h + g] !== -1 && d[h + g] <= N)
        return { x: t + D, y: n + R, u: t + N, v: n + k };
    }
    const S = r - w, E = r + w;
    for (let g = S; g <= E; g += 2) {
      let N;
      if (w === 0 && g === r)
        N = a;
      else {
        const W = g < E && f[h + g + 1] === w - 1, O = g > S && f[h + g - 1] === w - 1, C = W ? d[h + g + 1] - 1 : -1, M = O ? d[h + g - 1] : -1, y = W && C >= 0, A = O && d[h + g - 1] - g >= 0;
        if (!y && !A) continue;
        N = y && A ? Math.min(C, M) : y ? C : M;
      }
      let k = N - g;
      const D = N, R = k;
      for (; N > 0 && k > 0 && c(e[t + N - 1], u[n + k - 1]); )
        N--, k--;
      if (d[h + g] = N, f[h + g] = w, !l && $[h + g] !== -1 && N <= m[h + g])
        return { x: t + N, y: n + k, u: t + D, v: n + R };
    }
  }
  return null;
}
function H(e) {
  if (e === "") return { lines: [], eol: !0 };
  const t = e.split(`
`);
  return t[t.length - 1] === "" ? (t.pop(), { lines: t, eol: !0 }) : { lines: t, eol: !1 };
}
const F = {
  header: "\x1B[1;35m",
  // file headers (--- +++) — GNU's magenta
  hunk: "\x1B[36m",
  // @@ ranges — GNU's cyan
  del: "\x1B[31m",
  // old lines — GNU's red
  ins: "\x1B[32m",
  // new lines — GNU's green
  reset: "\x1B[0m"
};
function I(e, t, i) {
  return e ? `${t}${i}${F.reset}` : i;
}
function _(e, t) {
  let i = e;
  return t.ignoreAllSpace ? i = i.replace(/\s/g, "") : t.ignoreSpaceChange && (i = i.replace(/\s+/g, " ").replace(/^ | $/g, "")), t.ignoreCase && (i = i.toLowerCase()), i;
}
function U(e, t, i) {
  e.err(t.startsWith("--") ? `${i}: unrecognized option '${t}'` : `${i}: invalid option -- '${t.slice(-1)}'`), e.err(`Try '${i} --help' for more information.`), e.exit(2);
}
function P(e, t) {
  if (t === "-") return { kind: "file", text: e.stdin ?? "" };
  const i = e.vfs.resolve(e.state.cwd, t), u = e.vfs.nodeAt(i);
  return u === null ? { kind: "missing" } : u.kind === "dir" ? { kind: "dir" } : { kind: "file", text: u.content };
}
function q(e) {
  const t = e.word.lastIndexOf("/"), i = t === -1 ? "" : e.word.slice(0, t + 1), u = t === -1 ? e.word : e.word.slice(t + 1), n = i.startsWith("~") ? e.home + i.slice(1) : i, s = e.vfs.resolve(e.cwd, n === "" ? "." : n), c = [];
  for (const a of e.vfs.list(s))
    a.name.startsWith(u) && c.push(i + a.name + (a.kind === "dir" ? "/" : ""));
  return c.sort((a, o) => a.localeCompare(o));
}
function Z(e) {
  const t = e.lastIndexOf("/");
  return t === -1 ? e : e.slice(t + 1);
}
function z(e, t) {
  return e === t ? `${e}` : `${e},${t}`;
}
function ee(e) {
  const t = [];
  let i = 0, u = 0, n = 0;
  for (; n < e.length; ) {
    if (e[n].t === "eq") {
      i++, u++, n++;
      continue;
    }
    const s = { aStart: i, aLen: 0, bStart: u, bLen: 0 };
    for (; n < e.length && e[n].t !== "eq"; )
      e[n].t === "del" ? (s.aLen++, i++) : (s.bLen++, u++), n++;
    t.push(s);
  }
  return t;
}
function B(e, t, i) {
  const u = H(e), n = H(t), s = u.lines.map((r) => _(r, i)), c = n.lines.map((r) => _(r, i)), a = V(s, s.length, c, c.length, (r, l) => r === l);
  let o = ee(a);
  if (o.length === 0 && u.eol !== n.eol && u.lines.length > 0 && n.lines.length > 0) {
    const r = u.lines.length - 1;
    o = [{ aStart: r, aLen: 1, bStart: r, bLen: 1 }];
  }
  return { aLines: u.lines, aEol: u.eol, bLines: n.lines, bEol: n.eol, runs: o };
}
function T(e, t) {
  t !== null && e(t);
}
function L(e, t, i) {
  const u = e === "a" ? t.aLines.length - 1 : t.bLines.length - 1;
  return i !== u ? null : (e === "a" ? !t.aEol : !t.bEol) ? "\\ No newline at end of file" : null;
}
function te(e, t, i) {
  for (const u of e.runs) {
    const n = u.aStart + 1, s = u.aStart + u.aLen, c = u.bStart + 1, a = u.bStart + u.bLen;
    u.aLen === 0 ? i(`${u.aStart}a${z(c, a)}`) : u.bLen === 0 ? i(`${z(n, s)}d${u.bStart}`) : i(`${z(n, s)}c${z(c, a)}`);
    for (let o = 0; o < u.aLen; o++) {
      const r = u.aStart + o;
      i(I(t.color, F.del, `< ${e.aLines[r]}`));
      const l = L("a", e, r);
      l !== null && i(l);
    }
    u.aLen > 0 && u.bLen > 0 && i("---");
    for (let o = 0; o < u.bLen; o++) {
      const r = u.bStart + o;
      i(I(t.color, F.ins, `> ${e.bLines[r]}`));
      const l = L("b", e, r);
      l !== null && i(l);
    }
  }
}
function K(e, t) {
  if (e.length === 0) return [];
  const i = [[e[0]]];
  for (let u = 1; u < e.length; u++) {
    const n = i[i.length - 1], s = n[n.length - 1];
    e[u].aStart - (s.aStart + s.aLen) <= 2 * t ? n.push(e[u]) : i.push([e[u]]);
  }
  return i;
}
function Y(e, t, i) {
  const u = e[0], n = e[e.length - 1];
  return {
    aStart: Math.max(0, u.aStart - i),
    aEnd: Math.min(t.aLines.length, n.aStart + n.aLen + i),
    bStart: Math.max(0, u.bStart - i),
    bEnd: Math.min(t.bLines.length, n.bStart + n.bLen + i),
    group: e
  };
}
function x(e, t) {
  const i = t - e;
  return i === 1 ? `${e + 1}` : i === 0 ? `${e},0` : `${e + 1},${i}`;
}
function ne(e, t, i, u, n) {
  n(I(t.color, F.header, `--- ${i}`)), n(I(t.color, F.header, `+++ ${u}`));
  for (const s of K(e.runs, t.context)) {
    const c = Y(s, e, t.context);
    n(I(t.color, F.hunk, `@@ -${x(c.aStart, c.aEnd)} +${x(c.bStart, c.bEnd)} @@`));
    let a = c.aStart, o = c.bStart;
    for (const r of c.group) {
      for (; a < r.aStart; )
        n(` ${e.aLines[a]}`), T(n, L("a", e, a) ?? L("b", e, o)), a++, o++;
      for (let l = 0; l < r.aLen; l++) {
        const p = r.aStart + l;
        n(I(t.color, F.del, `-${e.aLines[p]}`)), T(n, L("a", e, p));
      }
      for (let l = 0; l < r.bLen; l++) {
        const p = r.bStart + l;
        n(I(t.color, F.ins, `+${e.bLines[p]}`)), T(n, L("b", e, p));
      }
      a += r.aLen, o += r.bLen;
    }
    for (; a < c.aEnd; )
      n(` ${e.aLines[a]}`), T(n, L("a", e, a) ?? L("b", e, o)), a++, o++;
  }
}
function re(e, t, i, u, n) {
  n(I(t.color, F.header, `*** ${i}`)), n(I(t.color, F.header, `--- ${u}`));
  for (const s of K(e.runs, t.context)) {
    const c = Y(s, e, t.context);
    n("***************"), n(`*** ${x(c.aStart, c.aEnd)} ****`);
    let a = c.aStart;
    for (const r of c.group) {
      for (; a < r.aStart; )
        n(`  ${e.aLines[a]}`), T(n, L("a", e, a)), a++;
      for (let l = 0; l < r.aLen; l++) {
        const p = r.aStart + l;
        n(I(t.color, F.del, `${r.bLen > 0 ? "! " : "- "}${e.aLines[p]}`)), T(n, L("a", e, p));
      }
      a += r.aLen;
    }
    for (; a < c.aEnd; )
      n(`  ${e.aLines[a]}`), T(n, L("a", e, a)), a++;
    n(`--- ${x(c.bStart, c.bEnd)} ----`);
    let o = c.bStart;
    for (const r of c.group) {
      for (; o < r.bStart; )
        n(`  ${e.bLines[o]}`), T(n, L("b", e, o)), o++;
      for (let l = 0; l < r.bLen; l++) {
        const p = r.bStart + l;
        n(I(t.color, F.ins, `${r.aLen > 0 ? "! " : "+ "}${e.bLines[p]}`)), T(n, L("b", e, p));
      }
      o += r.bLen;
    }
    for (; o < c.bEnd; )
      n(`  ${e.bLines[o]}`), T(n, L("b", e, o)), o++;
  }
}
const ie = [
  "diff [OPTION...] FILE1 FILE2 — compare files line by line",
  "",
  "  -u, -U N, --unified[=N]   unified output (default context 3)",
  "  -c, -C N, --context[=N]   context output (default context 3)",
  "  -q, --brief               report only whether files differ",
  "  -r, --recursive           compare directory trees",
  "  -s, --report-identical-files",
  "  -i, --ignore-case         ignore case in line comparisons",
  "  -w, --ignore-all-space    ignore all whitespace",
  "  -b, --ignore-space-change ignore runs of whitespace",
  "  --color[=WHEN]            colorize: always (default), auto, never",
  "",
  "A `-` operand reads stdin. Exit status: 0 same, 1 differs, 2 trouble.",
  "Output formats follow GNU diff: normal (default), unified (-u) and",
  "context (-c), including `\\ No newline at end of file` markers."
], se = /* @__PURE__ */ new Set(["unified", "context", "brief", "recursive", "report-identical-files", "ignore-case", "ignore-all-space", "ignore-space-change", "color", "help"]);
function oe(e) {
  const t = {
    mode: "normal",
    context: 3,
    recursive: !1,
    brief: !1,
    identical: !1,
    ignoreCase: !1,
    ignoreAllSpace: !1,
    ignoreSpaceChange: !1,
    color: !1
  }, i = [];
  let u = !1;
  const n = (c, a) => !Number.isInteger(c) || c < 0 ? !1 : (t.context = c, t.mode = a, !0);
  let s = 0;
  for (; s < e.length; ) {
    const c = e[s];
    if (c === "--") {
      i.push(...e.slice(s + 1));
      break;
    }
    if (c.startsWith("--")) {
      const a = c.indexOf("="), o = a === -1 ? c.slice(2) : c.slice(2, a), r = a === -1 ? void 0 : c.slice(a + 1);
      if (!se.has(o)) return { error: c };
      if (o === "unified" || o === "context") {
        const l = o === "unified" ? "unified" : "context";
        if (r === void 0)
          t.mode = l, t.context = 3;
        else if (!n(Number(r), l)) return { error: c };
      } else if (o === "brief") t.brief = !0;
      else if (o === "recursive") t.recursive = !0;
      else if (o === "report-identical-files") t.identical = !0;
      else if (o === "ignore-case") t.ignoreCase = !0;
      else if (o === "ignore-all-space") t.ignoreAllSpace = !0;
      else if (o === "ignore-space-change") t.ignoreSpaceChange = !0;
      else if (o === "color") {
        const l = r ?? "always";
        if (!["always", "auto", "never"].includes(l)) return { error: c };
        t.color = l !== "never";
      } else o === "help" && (u = !0);
      s++;
      continue;
    }
    if (c.length > 1 && c[0] === "-") {
      let a = !1;
      for (let o = 1; o < c.length && !a; o++) {
        const r = c[o];
        if (r === "u")
          t.mode = "unified", t.context = 3;
        else if (r === "c")
          t.mode = "context", t.context = 3;
        else if (r === "q") t.brief = !0;
        else if (r === "r") t.recursive = !0;
        else if (r === "s") t.identical = !0;
        else if (r === "i") t.ignoreCase = !0;
        else if (r === "w") t.ignoreAllSpace = !0;
        else if (r === "b") t.ignoreSpaceChange = !0;
        else if (r === "U" || r === "C") {
          const l = c.slice(o + 1);
          let p;
          l !== "" ? p = Number(l) : (p = Number(e[s + 1]), s++), n(p, r === "U" ? "unified" : "context") || (a = !0), o = c.length;
        } else a = !0;
      }
      if (a) return { error: c };
      s++;
      continue;
    }
    i.push(c), s++;
  }
  return { opts: t, operands: i, help: u };
}
function j(e, t, i, u, n, s, c) {
  const a = B(i, u, t);
  if (a.runs.length === 0) {
    t.identical && e.out(`Files ${n} and ${s} are identical`), e.exit(0);
    return;
  }
  if (t.brief) {
    e.out(`Files ${n} and ${s} differ`), e.exit(1);
    return;
  }
  c !== null && e.out(c);
  const o = (r) => e.out(r);
  t.mode === "unified" ? ne(a, t, n, s, o) : t.mode === "context" ? re(a, t, n, s, o) : te(a, t, o), e.exit(1);
}
function le(e, t, i, u) {
  let n = !1, s = !1;
  const c = (a, o) => {
    const r = new Map(e.vfs.list(e.vfs.resolve(e.state.cwd, a)).map((h) => [h.name, h.kind])), l = new Map(e.vfs.list(e.vfs.resolve(e.state.cwd, o)).map((h) => [h.name, h.kind])), p = [.../* @__PURE__ */ new Set([...r.keys(), ...l.keys()])].sort();
    for (const h of p) {
      const m = r.get(h), $ = l.get(h), d = `${a}/${h}`, f = `${o}/${h}`;
      if (m === "file" && $ === "file") {
        const w = e.vfs.read(e.vfs.resolve(e.state.cwd, d)) ?? "", b = e.vfs.read(e.vfs.resolve(e.state.cwd, f)) ?? "";
        if (B(w, b, t).runs.length === 0)
          t.identical && (e.out(`Files ${d} and ${f} are identical`), n = !0);
        else if (t.brief)
          e.out(`Files ${d} and ${f} differ`), n = !0;
        else {
          const S = t.mode === "normal" ? "" : t.mode === "unified" ? "u" : "c", E = `${t.recursive ? "r" : ""}${S}`, g = `diff ${E === "" ? "" : `-${E} `}${d} ${f}`;
          j(e, t, w, b, d, f, g), n = !0;
        }
      } else m === "dir" && $ === "dir" ? t.recursive ? c(d, f) : e.out(`Common subdirectories: ${d} and ${f}`) : m !== void 0 && $ !== void 0 ? (e.err(`File ${d} is a ${m} while ${f} is a ${$}`), s = !0) : (e.out(`Only in ${m === void 0 ? o : a}: ${h}`), n = !0);
    }
  };
  c(i.replace(/\/+$/, ""), u.replace(/\/+$/, "")), e.exit(s ? 2 : n ? 1 : 0);
}
function ae() {
  return {
    name: "diff",
    usage: "diff [-ruqiswb] [-u|-c] [-U N] [--color[=WHEN]] FILE1 FILE2",
    complete: (e) => e.word.startsWith("-") ? ["-u", "-c", "-r", "-q", "-i", "-w", "-b", "-s", "--unified", "--context", "--brief", "--recursive", "--ignore-case", "--ignore-all-space", "--color"].filter((t) => t.startsWith(e.word)) : q(e),
    run(e) {
      const t = oe(e.args);
      if ("error" in t) {
        U(e, t.error, "diff");
        return;
      }
      if (t.help) {
        for (const h of ie) e.out(h);
        e.exit(0);
        return;
      }
      const { opts: i, operands: u } = t;
      if (u.length < 2) {
        e.err(u.length === 0 ? "diff: missing operand" : `diff: missing operand after '${u[0]}'`), e.exit(2);
        return;
      }
      if (u.length > 2) {
        e.err(`diff: extra operand '${u[2]}'`), e.exit(2);
        return;
      }
      const [n, s] = u, c = e.args.find((h) => h === "--color" || h.startsWith("--color=")), a = c === void 0 ? null : c === "--color" ? "always" : c.slice(8), o = {
        ...i,
        color: a === "always" ? !0 : a === "auto" ? e.color : !1
      }, r = P(e, n), l = P(e, s), p = r.kind === "missing" ? n : l.kind === "missing" ? s : null;
      if (p !== null) {
        e.err(`diff: ${p}: No such file or directory`), e.exit(2);
        return;
      }
      if (r.kind === "dir" && l.kind === "dir") {
        le(e, o, n, s);
        return;
      }
      if (r.kind === "dir" || l.kind === "dir") {
        const h = r.kind === "dir" ? n : s, m = r.kind === "dir" ? s : n, $ = `${h.replace(/\/+$/, "")}/${Z(m)}`, d = P(e, $);
        if (d.kind !== "file") {
          e.err(`diff: ${$}: No such file or directory`), e.exit(2);
          return;
        }
        const f = r.kind === "file" ? r.text : d.text, w = l.kind === "file" ? l.text : d.text, b = r.kind === "file" ? n : $, v = l.kind === "file" ? s : $;
        j(e, o, f, w, b, v, null);
        return;
      }
      j(e, o, r.kind === "file" ? r.text : "", l.kind === "file" ? l.text : "", n, s, null);
    }
  };
}
function G(e) {
  const t = e.indexOf("	");
  return (t === -1 ? e : e.slice(0, t)).trim();
}
function fe(e) {
  const t = e.split(`
`);
  t.length > 0 && t[t.length - 1] === "" && t.pop();
  const i = [], u = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/, n = /^(\d+)(?:,(\d+))?([acd])(\d+)(?:,(\d+))?$/;
  let s = 0;
  for (; s < t.length; ) {
    const c = t[s];
    if (c.startsWith("--- ") && s + 1 < t.length && t[s + 1].startsWith("+++ ")) {
      const a = s + 1, o = G(c.slice(4)), r = G(t[s + 1].slice(4));
      s += 2;
      const l = [];
      let p = null;
      for (; s < t.length; ) {
        const h = u.exec(t[s]);
        if (h === null) break;
        const m = {
          oldStart: Number(h[1]),
          oldCount: h[2] === void 0 ? 1 : Number(h[2]),
          newStart: Number(h[3]),
          newCount: h[4] === void 0 ? 1 : Number(h[4]),
          lines: [],
          noEolOld: !1,
          noEolNew: !1
        };
        s++;
        let $ = 0, d = 0, f = -1, w = -1;
        for (; ; ) {
          const b = $ < m.oldCount, v = d < m.newCount;
          if (!b && !v) break;
          const S = t[s] ?? null;
          if (S === null) break;
          if (S.startsWith("\\")) {
            f === m.lines.length - 1 && (m.noEolOld = !0), w === m.lines.length - 1 && (m.noEolNew = !0), s++;
            continue;
          }
          const E = S === "" ? " " : S[0];
          if (E !== " " && E !== "-" && E !== "+" || E === " " && !b && !v || E === "-" && !b || E === "+" && !v) break;
          m.lines.push({ op: E, text: S === "" ? "" : S.slice(1) }), E !== "+" && ($++, f = m.lines.length - 1), E !== "-" && (d++, w = m.lines.length - 1), s++;
        }
        if ($ !== m.oldCount || d !== m.newCount) {
          p = `patch: **** malformed patch at line ${s + 1}: ${t[s] ?? ""}`;
          break;
        }
        for (; s < t.length && t[s].startsWith("\\"); )
          f === m.lines.length - 1 && (m.noEolOld = !0), w === m.lines.length - 1 && (m.noEolNew = !0), s++;
        l.push(m);
      }
      if (p !== null) return { patches: [], malformed: p };
      if (l.length === 0)
        return { patches: [], malformed: `patch: **** malformed patch at line ${s + 1}: ${t[s] ?? ""}` };
      i.push({ oldName: o, newName: r, hunks: l, inputLine: a, format: "unified" });
      continue;
    }
    if (n.test(c)) {
      const a = s + 1, o = [];
      let r = null;
      for (; s < t.length; ) {
        const l = n.exec(t[s]);
        if (l === null) break;
        const p = Number(l[1]), h = l[2] === void 0 ? p : Number(l[2]), m = l[3], $ = Number(l[4]), d = l[5] === void 0 ? $ : Number(l[5]);
        s++;
        const f = { oldStart: 0, oldCount: 0, newStart: 0, newCount: 0, lines: [], noEolOld: !1, noEolNew: !1 }, w = { "-": "< ", "+": "> ", " ": "  " }, b = (v, S) => {
          for (let E = 0; E < v; E++) {
            const g = t[s] ?? null;
            if (g === null) return `patch: **** malformed patch at line ${s + 1}: (unexpected end of input)`;
            if (g.startsWith("\\")) {
              S === "-" ? f.noEolOld = !0 : f.noEolNew = !0, s++, E--;
              continue;
            }
            const N = w[S];
            if (!g.startsWith(N))
              return `patch: **** malformed patch at line ${s + 1}: ${g}`;
            f.lines.push({ op: S, text: g.slice(2) }), s++;
          }
          return null;
        };
        if (m === "a" ? (f.oldStart = p, f.oldCount = 0, f.newStart = $, f.newCount = d - $ + 1, r = b(f.newCount, "+")) : m === "d" ? (f.oldStart = p, f.oldCount = h - p + 1, f.newStart = $, f.newCount = 0, r = b(f.oldCount, "-")) : (f.oldStart = p, f.oldCount = h - p + 1, f.newStart = $, f.newCount = d - $ + 1, r = b(f.oldCount, "-"), r === null && (t[s] !== "---" ? r = `patch: **** malformed patch at line ${s + 1}: ${t[s] ?? ""}` : s++), r === null && (r = b(f.newCount, "+"))), r !== null) break;
        for (; s < t.length && t[s].startsWith("\\"); )
          m === "d" ? f.noEolOld = !0 : f.noEolNew = !0, s++;
        o.push(f);
      }
      if (r !== null) return { patches: [], malformed: r };
      o.length > 0 && i.push({ oldName: "", newName: "", hunks: o, inputLine: a, format: "normal" });
      continue;
    }
    s++;
  }
  return { patches: i, malformed: null };
}
function X(e, t) {
  if (e === "/dev/null" || e === "") return e;
  let i = e;
  if (t < 0) {
    const u = i.lastIndexOf("/");
    return u === -1 ? i : i.slice(u + 1);
  }
  for (let u = 0; u < t; u++) {
    const n = i.indexOf("/");
    if (n === -1) break;
    i = i.slice(n + 1);
  }
  return i;
}
function ue(e, t, i, u) {
  const n = [];
  for (const l of i.lines) l.op !== "+" && n.push(l.text);
  const s = n.length, c = i.lines.filter((l) => l.op === " ").length, a = Math.max(0, Math.min(u, c)), o = (l, p) => {
    if (l < 0 || l + s > e.length) return !1;
    let h = 0, m = 0;
    for (const $ of i.lines) {
      if ($.op === "+") continue;
      if ($.op === " " && (m < p || s - h <= p))
        m < p && m++;
      else if (e[l + h] !== n[h]) return !1;
      h++;
    }
    return !0;
  }, r = e.length;
  for (let l = 0; l <= a; l++)
    for (let p = 0; p <= r; p++) {
      const h = p === 0 ? [t] : [t + p, t - p];
      for (const m of h)
        if (o(m, l)) return { pos: m, fuzz: l };
    }
  return null;
}
function ce(e, t, i, u, n, s, c) {
  const a = { target: "", applied: 0, failed: 0, ignored: 0, result: null, deleteFile: !1, rejects: null }, o = X(t.oldName, i), r = X(t.newName, i), l = u ? r : o, p = u ? o : r, h = l === "/dev/null", m = p === "/dev/null", $ = u ? t.hunks.map((g) => ({
    ...g,
    lines: g.lines.map((N) => ({ ...N, op: N.op === "+" ? "-" : N.op === "-" ? "+" : N.op })),
    oldStart: g.newStart,
    oldCount: g.newCount,
    noEolOld: g.noEolNew,
    noEolNew: g.noEolOld
  })) : t.hunks, d = (g) => g !== "" && e.vfs.nodeAt(e.vfs.resolve(e.state.cwd, g)) !== null;
  let f;
  if (c !== null ? f = c : h ? f = p : m ? f = l : f = d(p) ? p : d(l) ? l : p, a.target = f, h && d(f))
    return e.err(`The next patch would create the file ${f},`), e.err("which already exists!"), e.err("Skipping patch."), a.ignored += $.length, a;
  if (!h) {
    const g = e.vfs.nodeAt(e.vfs.resolve(e.state.cwd, f));
    if (g === null || g.kind !== "file") {
      e.err(`can't find file to patch at input line ${t.inputLine}`), e.err("Perhaps you should have used the -p or --strip option?"), e.err("The text leading up to this was:"), e.err("--------------------------");
      for (const N of [`--- ${t.oldName}`, `+++ ${t.newName}`]) e.err(`|${N}`);
      return e.err("--------------------------"), e.err("Skipping patch."), a.ignored += $.length, a;
    }
  }
  n ? e.out(`checking file ${f}`) : e.out(`patching file ${f}`);
  const w = h ? { lines: [], eol: !0 } : H(e.vfs.read(e.vfs.resolve(e.state.cwd, f)) ?? ""), b = [...w.lines];
  let v = 0, S = w.eol;
  const E = [];
  return $.forEach((g, N) => {
    const k = (g.oldCount === 0 ? g.oldStart : g.oldStart - 1) + v, D = h ? { pos: 0, fuzz: 0 } : ue(b, k, g, s);
    if (D === null) {
      a.failed++, e.err(`Hunk #${N + 1} FAILED at ${Math.max(1, k + 1)}.`), E.push(g);
      return;
    }
    const { pos: R, fuzz: W } = D, O = [], C = [];
    for (const A of g.lines)
      A.op !== "+" && O.push(A.text), A.op !== "-" && C.push(A.text);
    b.splice(R, O.length, ...C), (h || R + O.length === w.lines.length + v) && (S = !g.noEolNew), v += C.length - O.length, a.applied++;
    const M = R - k, y = [];
    W > 0 && y.push(`with fuzz ${W}`), M !== 0 && y.push(`(offset ${M} lines)`), e.err(`Hunk #${N + 1} succeeded at ${R + 1}${y.length > 0 ? " " + y.join(" ") : ""}.`);
  }), a.failed > 0 && (a.rejects = E), m && a.failed === 0 ? (a.deleteFile = !0, a.result = null, a) : (a.result = b.length === 0 ? "" : b.join(`
`) + (S ? `
` : ""), a);
}
function de(e) {
  const t = [`@@ -${e.oldStart}${e.oldCount === 1 ? "" : `,${e.oldCount}`} +${e.newStart}${e.newCount === 1 ? "" : `,${e.newCount}`} @@`];
  for (const i of e.lines) t.push(`${i.op}${i.text}`);
  return (e.noEolOld || e.noEolNew) && t.push("\\ No newline at end of file"), t;
}
function pe(e) {
  const t = (e.oldCount === 0, e.oldStart), i = e.oldStart + Math.max(0, e.oldCount - 1), u = e.newStart, n = e.newStart + Math.max(0, e.newCount - 1), s = e.oldCount === 0 ? "a" : e.newCount === 0 ? "d" : "c", c = [`${z(t, i)}${s}${z(u, n)}`];
  for (const a of e.lines) a.op === "-" && c.push(`< ${a.text}`);
  e.oldCount > 0 && e.newCount > 0 && c.push("---");
  for (const a of e.lines) a.op === "+" && c.push(`> ${a.text}`);
  return c;
}
const he = [
  "patch [OPTION...] [<ORIGFILE [<PATCHFILE>]] — apply a diff to a file",
  "",
  "  -p NUM, --strip=NUM  strip NUM leading path components (default: all)",
  "  -R, --reverse        assume the patch was created reversed",
  "  --dry-run            report what would happen, change nothing",
  "  -F N, --fuzz=N       max context-fuzz factor (default 2, GNU default)",
  "  -i FILE              read the patch from FILE instead of stdin",
  "",
  "Applies unified and normal-format diffs in place through the VFS.",
  "Failed hunks land in <target>.rej; /dev/null headers create/delete",
  "files. Exit: 0 applied, 1 some hunks failed/ignored, 2 malformed."
];
function me() {
  return {
    name: "patch",
    usage: "patch [-p NUM] [-R] [-F N] [--dry-run] [<ORIGFILE [<PATCHFILE>]]",
    complete: (e) => e.word.startsWith("-") ? ["-p0", "-p1", "-R", "--dry-run", "--strip", "--reverse", "--fuzz"].filter((t) => t.startsWith(e.word)) : q(e),
    run(e) {
      const t = [];
      let i = -1, u = !1, n = !1, s = 2, c = null;
      const a = e.args;
      for (let d = 0; d < a.length; d++) {
        const f = a[d];
        if (f === "--") {
          t.push(...a.slice(d + 1));
          break;
        }
        if (f.startsWith("--")) {
          const w = f.indexOf("="), b = w === -1 ? f.slice(2) : f.slice(2, w), v = w === -1 ? void 0 : f.slice(w + 1);
          if (b === "strip")
            i = v === void 0 ? -1 : Number(v);
          else if (b === "reverse") u = !0;
          else if (b === "dry-run") n = !0;
          else if (b === "fuzz") s = v === void 0 ? 2 : Number(v);
          else if (b === "help") {
            for (const S of he) e.out(S);
            e.exit(0);
            return;
          } else {
            U(e, f, "patch");
            return;
          }
          if (Number.isNaN(i) || Number.isNaN(s)) {
            e.err(`patch: invalid argument to '${f.split("=")[0]}'`), e.exit(2);
            return;
          }
          continue;
        }
        if (f.length > 1 && f[0] === "-") {
          let w = !1;
          for (let b = 1; b < f.length && !w; b++) {
            const v = f[b];
            if (v === "R") u = !0;
            else if (v === "p") {
              const S = f.slice(b + 1);
              S === "" ? i = -1 : (i = Number(S), Number.isNaN(i) && (w = !0)), b = f.length;
            } else if (v === "F") {
              const S = f.slice(b + 1);
              S === "" ? (s = Number(a[d + 1]), d++) : s = Number(S), Number.isNaN(s) && (w = !0), b = f.length;
            } else if (v === "i") {
              const S = f.slice(b + 1);
              S === "" ? (c = a[d + 1] ?? null, d++) : c = S, b = f.length;
            } else w = !0;
          }
          if (w) {
            U(e, f, "patch");
            return;
          }
          continue;
        }
        t.push(f);
      }
      if (t.length > 2) {
        e.err(`patch: extra operand '${t[2]}'`), e.exit(2);
        return;
      }
      const o = t.length > 0 ? t[0] : null;
      let r;
      if (c !== null) {
        const d = P(e, c);
        if (d.kind !== "file") {
          e.err(`patch: ${c}: No such file or directory`), e.exit(2);
          return;
        }
        r = d.text;
      } else if (t.length > 1) {
        const d = P(e, t[1]);
        if (d.kind !== "file") {
          e.err(`patch: ${t[1]}: No such file or directory`), e.exit(2);
          return;
        }
        r = d.text;
      } else
        r = e.stdin ?? "";
      const { patches: l, malformed: p } = fe(r);
      if (p !== null) {
        e.err(p), e.exit(2);
        return;
      }
      if (l.length === 0) {
        e.err("patch: **** Only garbage was found in the patch input."), e.exit(2);
        return;
      }
      let h = 0, m = 0, $ = !1;
      for (const d of l) {
        const f = ce(e, d, i, u, n, s, o);
        if (h += f.failed, m += f.ignored, f.result !== null && !n)
          try {
            e.vfs.mountFile(e.vfs.resolve(e.state.cwd, f.target), f.result);
          } catch (w) {
            e.err(`patch: cannot write ${f.target}: ${w instanceof Error ? w.message : String(w)}`), $ = !0;
          }
        if (f.deleteFile && !n)
          try {
            e.vfs.rm(e.vfs.resolve(e.state.cwd, f.target), { recursive: !1 });
          } catch {
            e.err(`patch: cannot remove ${f.target}`), $ = !0;
          }
        if (f.rejects !== null && !n) {
          const w = [`--- ${d.oldName}`, `+++ ${d.newName}`];
          for (const b of f.rejects)
            w.push(...d.format === "unified" ? de(b) : pe(b));
          e.vfs.mountFile(e.vfs.resolve(e.state.cwd, `${f.target}.rej`), w.join(`
`) + `
`), e.err(`${f.failed} out of ${d.hunks.length} hunk${d.hunks.length === 1 ? "" : "s"} FAILED -- saving rejects to file ${f.target}.rej`);
        }
      }
      $ ? e.exit(2) : h > 0 || m > 0 ? e.exit(1) : e.exit(0);
    }
  };
}
const ge = [
  "cmp [OPTION...] FILE1 [FILE2] — compare two files byte by byte",
  "",
  "  -l, --verbose  list every differing byte (offset + octal values)",
  "  -s, --silent   print nothing, exit status only",
  "",
  "A `-` operand reads stdin. Exit status: 0 same, 1 differ/EOF, 2 trouble."
];
function we() {
  return {
    name: "cmp",
    usage: "cmp [-l | -s] FILE1 [FILE2]",
    complete: (e) => e.word.startsWith("-") ? ["-l", "-s", "--verbose", "--silent", "--quiet"].filter((t) => t.startsWith(e.word)) : q(e),
    run(e) {
      if (e.args.includes("--help") || e.args.includes("-h")) {
        for (const d of ge) e.out(d);
        e.exit(0);
        return;
      }
      let t = !1, i = !1;
      const u = [];
      let n = !1;
      for (const d of e.args) {
        if (!n && d === "--") {
          n = !0;
          continue;
        }
        if (!n && d === "-l") t = !0;
        else if (!n && d === "-s") i = !0;
        else if (!n && d === "--verbose") t = !0;
        else if (!n && (d === "--silent" || d === "--quiet")) i = !0;
        else if (!n && d.length > 1 && d[0] === "-") {
          U(e, d, "cmp");
          return;
        } else u.push(d);
      }
      if (u.length === 0) {
        e.err("cmp: missing operand"), e.exit(2);
        return;
      }
      const s = P(e, u[0]);
      if (s.kind !== "file") {
        e.err(`cmp: ${u[0]}: No such file or directory`), e.exit(2);
        return;
      }
      let c;
      if (u.length > 1) {
        const d = P(e, u[1]);
        if (d.kind !== "file") {
          e.err(`cmp: ${u[1]}: No such file or directory`), e.exit(2);
          return;
        }
        c = d.text;
      } else
        c = e.stdin ?? "";
      const a = new TextEncoder(), o = a.encode(s.text), r = a.encode(c), l = Math.min(o.length, r.length);
      let p = -1;
      for (let d = 0; d < l; d++)
        if (o[d] !== r[d]) {
          p = d;
          break;
        }
      const h = u[0], m = u.length > 1 ? u[1] : "-";
      if (p === -1 && o.length === r.length) {
        e.exit(0);
        return;
      }
      if (i) {
        e.exit(1);
        return;
      }
      const $ = o.length < r.length ? h : m;
      if (t) {
        const d = String(Math.max(o.length, r.length, 1)).length;
        for (let f = 0; f < l; f++)
          o[f] !== r[f] && e.out(`${String(f + 1).padStart(d)} ${o[f].toString(8)} ${r[f].toString(8)}`);
        p === -1 && e.out(`cmp: EOF on ${$}`), e.exit(1);
        return;
      }
      if (p !== -1) {
        let d = 1;
        for (let f = 0; f < p; f++)
          o[f] === 10 && d++;
        e.out(`${h} ${m} differ: byte ${p + 1}, line ${d}`);
      } else
        e.out(`cmp: EOF on ${$}`);
      e.exit(1);
    }
  };
}
const $e = [ae(), me(), we()], be = {
  diff: [
    "DIFF(1)                   semtext-sh manual",
    "",
    "NAME",
    "     diff — compare files line by line",
    "",
    "SYNOPSIS",
    "     diff [-ruqiswb] [-u|-c] [-U N] [--color[=WHEN]] FILE1 FILE2",
    "     diff -r DIR1 DIR2",
    "",
    "DESCRIPTION",
    "     Compares two files (or, with -r, two directory trees) and",
    "     prints their differences. Default output is the normal format;",
    "     -u gives unified, -c context diffs, the formats `patch(1)`",
    "     consumes. `-` reads stdin. Line comparisons honour -i (case),",
    "     -w (all whitespace) and -b (whitespace runs). Diffs are",
    "     minimal (Myers linear space). Directory trees report",
    "     `Only in DIR: name`; shallow walks report",
    "     `Common subdirectories: A and B`.",
    "",
    "EXIT STATUS",
    "     0 identical, 1 differences found, 2 trouble.",
    "",
    "EXAMPLES",
    "     diff -u old.txt new.txt",
    "     diff -r tree-a tree-b",
    "     diff -u a.txt b.txt > fix.diff && patch a.txt < fix.diff"
  ],
  patch: [
    "PATCH(1)                  semtext-sh manual",
    "",
    "NAME",
    "     patch — apply a diff to a file",
    "",
    "SYNOPSIS",
    "     patch [-p NUM] [-R] [-F N] [--dry-run] [<ORIGFILE [<PATCHFILE>]]",
    "",
    "DESCRIPTION",
    "     Applies unified and normal-format diffs in place through the",
    "     VFS. Without an operand the target names come from the patch",
    "     headers (---/+++ or the normal ranges); -p strips NUM leading",
    "     path components (GNU default: all but the basename). -R",
    "     reverses; --dry-run changes nothing; -F raises the context",
    "     fuzz factor (default 2). Hunks apply with offset search and",
    "     report `(offset N lines)` / `with fuzz N`. Failures append to",
    "     <target>.rej. /dev/null headers create or delete the file.",
    "",
    "EXIT STATUS",
    "     0 applied clean, 1 some hunks failed or were ignored,",
    "     2 malformed patch.",
    "",
    "EXAMPLES",
    "     diff -u a.txt b.txt > fix.diff",
    "     patch a.txt < fix.diff",
    "     patch -p1 --dry-run < change.diff"
  ],
  cmp: [
    "CMP(1)                    semtext-sh manual",
    "",
    "NAME",
    "     cmp — compare two files byte by byte",
    "",
    "SYNOPSIS",
    "     cmp [-l | -s] FILE1 [FILE2]",
    "",
    "DESCRIPTION",
    "     Compares files byte by byte (UTF-8 bytes). Default prints the",
    "     first difference: `f1 f2 differ: byte N, line M`. When one",
    "     file is a prefix of the other: `cmp: EOF on <name>`. -l lists",
    "     every differing byte in octal; -s prints nothing.",
    "",
    "EXIT STATUS",
    "     0 identical, 1 differ or EOF, 2 trouble."
  ]
}, Ne = { commands: $e, manPages: be };
export {
  $e as commands,
  be as manPages,
  Ne as pkg
};
