const L = [1518500249, 1859775393, 2400959708, 3395469782];
function se(e) {
  const n = e.length, t = Math.ceil((n + 1 + 8) / 64) * 64, r = new Uint8Array(t);
  r.set(e), r[n] = 128;
  const s = new DataView(r.buffer), o = n * 8;
  s.setUint32(t - 8, Math.floor(o / 4294967296)), s.setUint32(t - 4, o >>> 0);
  const i = new Int32Array(80);
  let a = 1732584193, l = 4023233417, f = 2562383102, u = 271733878, d = 3285377520;
  for (let g = 0; g < t; g += 64) {
    for (let m = 0; m < 16; m++) i[m] = s.getUint32(g + m * 4);
    for (let m = 16; m < 80; m++) {
      const $ = i[m - 3] ^ i[m - 8] ^ i[m - 14] ^ i[m - 16];
      i[m] = $ << 1 | $ >>> 31;
    }
    let c = a, h = l, p = f, w = u, b = d;
    for (let m = 0; m < 80; m++) {
      let $, y;
      m < 20 ? ($ = h & p | ~h & w, y = L[0]) : m < 40 ? ($ = h ^ p ^ w, y = L[1]) : m < 60 ? ($ = h & p | h & w | p & w, y = L[2]) : ($ = h ^ p ^ w, y = L[3]);
      const O = (c << 5 | c >>> 27) + $ + b + y + i[m] | 0;
      b = w, w = p, p = h << 30 | h >>> 2, h = c, c = O;
    }
    a = a + c | 0, l = l + h | 0, f = f + p | 0, u = u + w | 0, d = d + b | 0;
  }
  return [a, l, f, u, d].map((g) => (g >>> 0).toString(16).padStart(8, "0")).join("");
}
new TextEncoder();
const oe = 4e3;
function N(e) {
  if (e === "") return { lines: [], endsWithNewline: !0 };
  const n = e.endsWith(`
`), t = e.split(`
`);
  return n && t.pop(), { lines: t, endsWithNewline: n };
}
function re(e, n, t, r, s, o) {
  const i = r - t, a = o - s;
  if (i === 0 && a === 0) return [];
  if (i === 0) return n.slice(s, o).map((w, b) => ({ type: "add", bLine: s + b, text: w }));
  if (a === 0) return e.slice(t, r).map((w, b) => ({ type: "del", aLine: t + b, text: w }));
  if (i + a > oe)
    return [
      ...e.slice(t, r).map((w, b) => ({ type: "del", aLine: t + b, text: w })),
      ...n.slice(s, o).map((w, b) => ({ type: "add", bLine: s + b, text: w }))
    ];
  const l = i + a, f = l, u = new Int32Array(2 * l + 3), d = [];
  let g = -1;
  e: for (let w = 0; w <= l; w++) {
    d.push(u.slice());
    for (let b = -w; b <= w; b += 2) {
      let m;
      b === -w || b !== w && u[f + b - 1] < u[f + b + 1] ? m = u[f + b + 1] : m = u[f + b - 1] + 1;
      let $ = m - b;
      for (; m < i && $ < a && e[t + m] === n[s + $]; )
        m++, $++;
      if (u[f + b] = m, m >= i && $ >= a) {
        g = w;
        break e;
      }
    }
  }
  if (g < 0) return [];
  const c = [];
  let h = i, p = a;
  for (let w = g; w > 0; w--) {
    const b = d[w], m = h - p, $ = m === -w || m !== w && b[f + m - 1] < b[f + m + 1] ? m + 1 : m - 1, y = b[f + $], O = y - $;
    for (; h > y && p > O; )
      h--, p--, c.push({ type: "eq", aLine: t + h, bLine: s + p, text: e[t + h] });
    h === y ? (p--, c.push({ type: "add", bLine: s + p, text: n[s + p] })) : (h--, c.push({ type: "del", aLine: t + h, text: e[t + h] }));
  }
  for (; h > 0 && p > 0; )
    h--, p--, c.push({ type: "eq", aLine: t + h, bLine: s + p, text: e[t + h] });
  for (; h > 0; )
    h--, c.push({ type: "del", aLine: t + h, text: e[t + h] });
  for (; p > 0; )
    p--, c.push({ type: "add", bLine: s + p, text: n[s + p] });
  return c.reverse(), c;
}
function C(e, n) {
  let t = 0;
  const r = Math.min(e.length, n.length);
  for (; t < r && e[t] === n[t]; ) t++;
  let s = e.length, o = n.length;
  for (; s > t && o > t && e[s - 1] === n[o - 1]; )
    s--, o--;
  const i = [];
  for (let a = 0; a < t; a++) i.push({ type: "eq", aLine: a, bLine: a, text: e[a] });
  i.push(...re(e, n, t, s, t, o));
  for (let a = s; a < e.length; a++)
    i.push({ type: "eq", aLine: a, bLine: o + (a - s), text: e[a] });
  return i;
}
function z(e) {
  let n = 0, t = 0;
  for (const r of e)
    r.type === "add" ? n++ : r.type === "del" && t++;
  return { adds: n, dels: t };
}
const U = "\\ No newline at end of file";
function ie(e, n, t) {
  const r = [];
  for (let l = 0; l < e.length; l++) e[l].type !== "eq" && r.push(l);
  if (r.length === 0) return [];
  const s = [];
  let o = r[0], i = r[0];
  for (const l of r.slice(1))
    l - i <= n * 2 + 1 || (s.push([o, i]), o = l), i = l;
  s.push([o, i]);
  const a = [];
  for (const [l, f] of s) {
    const u = Math.max(0, l - n), d = Math.min(e.length - 1, f + n);
    let g = 0, c = 0, h = -1, p = -1;
    const w = [];
    for (let b = u; b <= d; b++) {
      const m = e[b];
      m.type === "add" ? (w.push({ marker: "+", op: m }), c++, p === -1 && (p = m.bLine ?? 0)) : m.type === "del" ? (w.push({ marker: "-", op: m }), g++, h === -1 && (h = m.aLine ?? 0)) : (w.push({ marker: " ", op: m }), g++, c++, h === -1 && (h = m.aLine ?? 0), p === -1 && (p = m.bLine ?? 0));
    }
    a.push(
      `@@ -${g === 0 ? 0 : h + 1},${g} +${c === 0 ? 0 : p + 1},${c} @@`
    );
    for (const { marker: b, op: m } of w)
      a.push(b + m.text), (b === "-" && !t.aEndsNewline && m.aLine === t.aLen - 1 || b === "+" && !t.bEndsNewline && m.bLine === t.bLen - 1) && a.push(U);
  }
  return a;
}
const ae = new TextEncoder(), le = new TextDecoder();
function S(e) {
  return ae.encode(e);
}
function A(e) {
  return le.decode(e);
}
function ue(e) {
  let n = "";
  for (let t = 0; t < e.length; t += 8192)
    n += String.fromCharCode(...e.subarray(t, t + 8192));
  return btoa(n);
}
function fe(e) {
  const n = atob(e), t = new Uint8Array(n.length);
  for (let r = 0; r < n.length; r++) t[r] = n.charCodeAt(r);
  return t;
}
function ce(e, n) {
  const t = e.startsWith("/") ? e : "/" + e, r = n === "" ? t : n.startsWith("/") ? n : t + "/" + n, s = [];
  for (const o of r.split("/"))
    if (!(o === "" || o === ".")) {
      if (o === "..") {
        s.pop();
        continue;
      }
      s.push(o);
    }
  return "/" + s.join("/");
}
function G(e, n) {
  const t = S(`${e} ${n.length}\0`), r = new Uint8Array(t.length + n.length);
  return r.set(t), r.set(n, t.length), r;
}
function V(e, n) {
  return se(G(e, n));
}
function D(e) {
  return V("blob", S(e));
}
const W = "100644", E = "40000";
function he(e) {
  const n = [...e].sort((i, a) => {
    const l = i.mode === E ? i.name + "/" : i.name, f = a.mode === E ? a.name + "/" : a.name;
    return l < f ? -1 : l > f ? 1 : 0;
  }), t = [];
  let r = 0;
  for (const i of n) {
    const a = S(`${i.mode} ${i.name}\0`);
    t.push(a, de(i.sha)), r += a.length + 20;
  }
  const s = new Uint8Array(r);
  let o = 0;
  for (const i of t)
    s.set(i, o), o += i.length;
  return s;
}
function de(e) {
  const n = new Uint8Array(20);
  for (let t = 0; t < 20; t++) n[t] = parseInt(e.slice(t * 2, t * 2 + 2), 16);
  return n;
}
function me(e) {
  const n = [];
  let t = 0;
  for (; t < e.length; ) {
    let r = t;
    for (; e[r] !== 32; ) r++;
    let s = r;
    for (; e[s] !== 0; ) s++;
    const o = A(e.subarray(t, r)), i = A(e.subarray(r + 1, s));
    let a = "";
    for (let l = 0; l < 20; l++) a += e[s + 1 + l].toString(16).padStart(2, "0");
    n.push({ mode: o, name: i, sha: a }), t = s + 21;
  }
  return n;
}
function ge(e) {
  const n = `${e.name} <${e.email}> ${e.when} ${_(e.offset)}`;
  let t = `tree ${e.tree}
`;
  for (const r of e.parents) t += `parent ${r}
`;
  return t += `author ${n}
committer ${n}

${e.message}`, t.endsWith(`
`) || (t += `
`), S(t);
}
function T(e, n) {
  const t = A(n), r = t.indexOf(`

`), s = r === -1 ? t : t.slice(0, r), o = r === -1 ? "" : t.slice(r + 2);
  let i = "";
  const a = [];
  let l = "", f = "";
  for (const d of s.split(`
`))
    d.startsWith("tree ") ? i = d.slice(5) : d.startsWith("parent ") ? a.push(d.slice(7)) : d.startsWith("author ") ? l = d.slice(7) : d.startsWith("committer ") && (f = d.slice(10));
  const u = P(l);
  return {
    sha: e,
    tree: i,
    parents: a,
    authorName: u.name,
    authorEmail: u.email,
    authorWhen: u.when,
    authorOffset: u.offset,
    committerName: P(f).name,
    committerEmail: P(f).email,
    message: o
  };
}
function P(e) {
  const n = e.lastIndexOf(" <"), t = e.indexOf("> ", n);
  if (n === -1 || t === -1) return { name: e, email: "", when: 0, offset: 0 };
  const r = e.slice(t + 2).trim().split(/\s+/);
  return {
    name: e.slice(0, n),
    email: e.slice(n + 2, t),
    when: Number(r[0] ?? 0),
    offset: pe(r[1] ?? "+0000")
  };
}
function _(e) {
  const n = e < 0 ? "-" : "+", t = Math.abs(e);
  return n + String(Math.floor(t / 60)).padStart(2, "0") + String(t % 60).padStart(2, "0");
}
function pe(e) {
  const n = /^([+-])(\d{2})(\d{2})$/.exec(e);
  if (!n) return 0;
  const t = Number(n[2]) * 60 + Number(n[3]);
  return n[1] === "-" ? -t : t;
}
const we = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], be = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function J(e, n) {
  const t = new Date((e + n * 60) * 1e3), r = (s) => String(s).padStart(2, "0");
  return `${we[t.getUTCDay()]} ${be[t.getUTCMonth()]} ${r(t.getUTCDate())} ${r(t.getUTCHours())}:${r(t.getUTCMinutes())}:${r(t.getUTCSeconds())} ${t.getUTCFullYear()} ${_(n)}`;
}
function $e() {
  return -(/* @__PURE__ */ new Date()).getTimezoneOffset();
}
const ke = "fatal: not a git repository (or any of the parent directories): .git";
class M {
  constructor(n, t) {
    this.vfs = n, this.root = t, this.homeOverride = null;
  }
  /** Walk up from `cwd` looking for `.git`; null when there is no repo. */
  static discover(n, t) {
    let r = t;
    for (; ; ) {
      if (n.nodeAt(r + "/.git") !== null) return new M(n, r);
      if (r === "/" || r === "") return null;
      r = r.slice(0, r.lastIndexOf("/")) || "/";
    }
  }
  /** Create the skeleton (git init). Returns the repo (re-init keeps history). */
  static create(n, t) {
    const r = t === "/" ? "/.git" : t + "/.git";
    for (const s of ["objects", "refs/heads", "refs/tags"]) {
      const o = r + "/" + s;
      n.nodeAt(o) === null && n.mkdir(o, { parents: !0 });
    }
    return n.nodeAt(r + "/HEAD") === null && n.mountFile(r + "/HEAD", `ref: refs/heads/main
`), n.nodeAt(r + "/config") === null && n.mountFile(
      r + "/config",
      `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
`
    ), new M(n, t);
  }
  static notFound() {
    return ke;
  }
  /** `.git`-relative path → absolute VFS path. */
  gitPath(n) {
    return (this.root === "/" ? "" : this.root) + "/.git/" + n;
  }
  /** Repo-relative worktree path → absolute VFS path. */
  workPath(n) {
    return (this.root === "/" ? "" : this.root) + "/" + n;
  }
  /** Absolute VFS path → repo-relative ('' for the root itself). */
  relOf(n) {
    return n === this.root ? "" : this.root === "/" ? n.slice(1) : n.slice(this.root.length + 1);
  }
  /** True when `abs` lives inside `.git`. */
  inGitDir(n) {
    const t = this.root === "/" ? "/.git" : this.root + "/.git";
    return n === t || n.startsWith(t + "/");
  }
  /* objects */
  readObject(n) {
    const t = this.gitPath(`objects/${n.slice(0, 2)}/${n.slice(2)}`), r = this.vfs.read(t);
    if (r === null) return null;
    const s = fe(r), o = s.indexOf(0);
    return { type: A(s.subarray(0, o)).split(" ")[0], payload: s.subarray(o + 1) };
  }
  writeObject(n, t) {
    const r = V(n, t), s = this.gitPath(`objects/${r.slice(0, 2)}`), o = `${s}/${r.slice(2)}`;
    return this.vfs.nodeAt(o) === null && (this.vfs.nodeAt(s) === null && this.vfs.mkdir(s, { parents: !0 }), this.vfs.mountFile(o, ue(G(n, t)))), r;
  }
  writeBlob(n) {
    return this.writeObject("blob", S(n));
  }
  objectText(n) {
    const t = this.readObject(n);
    return t ? A(t.payload) : null;
  }
  /** All object names (for short-sha resolution). */
  allObjects() {
    const n = [], t = this.gitPath("objects");
    for (const r of this.vfs.list(t))
      if (!(r.kind !== "dir" || r.name.length !== 2))
        for (const s of this.vfs.list(t + "/" + r.name))
          n.push(r.name + s.name);
    return n;
  }
  /* refs + HEAD */
  /** Current branch name (empty string when HEAD is detached). */
  currentBranch() {
    const n = this.vfs.read(this.gitPath("HEAD")) ?? "", t = /^ref: refs\/heads\/(.*)\n?$/.exec(n);
    return t ? t[1] : "";
  }
  /** Resolve the current HEAD commit sha, or null before the first commit. */
  headSha() {
    const n = this.currentBranch();
    if (n !== "") return this.refSha(n);
    const t = (this.vfs.read(this.gitPath("HEAD")) ?? "").trim();
    return /^[0-9a-f]{40}$/.test(t) ? t : null;
  }
  refSha(n) {
    const t = this.vfs.read(this.gitPath(`refs/heads/${n}`));
    return t === null ? null : t.trim();
  }
  writeRef(n, t) {
    this.vfs.mountFile(this.gitPath(`refs/heads/${n}`), t + `
`);
  }
  listBranches() {
    const n = this.gitPath("refs/heads"), t = [], r = (s, o) => {
      for (const i of this.vfs.list(s))
        i.kind === "dir" ? r(s + "/" + i.name, o + i.name + "/") : t.push(o + i.name);
    };
    return r(n, ""), t.sort();
  }
  /* index */
  readIndex() {
    const n = this.vfs.read(this.gitPath("index")), t = /* @__PURE__ */ new Map();
    if (n === null) return t;
    try {
      const r = JSON.parse(n);
      for (const [s, o] of Object.entries(r.entries ?? {}))
        t.set(s, { sha: o.sha, size: o.size });
    } catch {
    }
    return t;
  }
  writeIndex(n) {
    const t = {};
    for (const [r, s] of [...n.entries()].sort()) t[r] = s;
    this.vfs.mountFile(
      this.gitPath("index"),
      JSON.stringify({ version: 1, entries: t }, null, 1) + `
`
    );
  }
  /* trees */
  /** Flatten a tree object into `path → sha` (files only, recursive). */
  flattenTree(n, t = "") {
    const r = /* @__PURE__ */ new Map(), s = this.readObject(n);
    if (s === null) return r;
    for (const o of me(s.payload)) {
      const i = t + o.name;
      if (o.mode === E)
        for (const [a, l] of this.flattenTree(o.sha, i + "/")) r.set(a, l);
      else
        r.set(i, o.sha);
    }
    return r;
  }
  /** Tree of a commit sha (empty map for the synthetic empty tree). */
  commitTree(n) {
    if (n === null) return /* @__PURE__ */ new Map();
    const t = this.readObject(n);
    if (t === null || t.type !== "commit") return /* @__PURE__ */ new Map();
    const r = /^tree ([0-9a-f]{40})/m.exec(A(t.payload));
    return r ? this.flattenTree(r[1]) : /* @__PURE__ */ new Map();
  }
  /** Build nested tree objects from staged entries; returns the root tree sha. */
  writeTreeFromIndex(n) {
    const t = { files: [], dirs: /* @__PURE__ */ new Map() };
    for (const [s, o] of n) {
      const i = s.split("/");
      let a = t;
      for (let l = 0; l < i.length - 1; l++) {
        const f = i[l];
        let u = a.dirs.get(f);
        u || (u = { files: [], dirs: /* @__PURE__ */ new Map() }, a.dirs.set(f, u)), a = u;
      }
      a.files.push({ mode: W, name: i[i.length - 1], sha: o.sha });
    }
    const r = (s) => {
      const o = [...s.files];
      for (const [i, a] of s.dirs)
        o.push({ mode: E, name: i, sha: r(a) });
      return this.writeObject("tree", he(o));
    };
    return r(t);
  }
  /* worktree */
  /** Scan the working tree (`.git` skipped) → `relpath → content`. */
  worktree() {
    const n = /* @__PURE__ */ new Map(), t = (r, s) => {
      for (const o of this.vfs.list(r)) {
        const i = r === "/" ? "/" + o.name : r + "/" + o.name;
        if (this.inGitDir(i)) continue;
        const a = s === "" ? o.name : s + "/" + o.name;
        o.kind === "dir" ? t(i, a) : n.set(a, o.content);
      }
    };
    return t(this.root, ""), n;
  }
  /** Blob sha of a worktree file without writing the object. */
  worktreeSha(n) {
    return D(n);
  }
  /* status */
  status() {
    const n = this.commitTree(this.headSha()), t = this.readIndex(), r = this.worktree(), s = [], o = [], i = [], a = /* @__PURE__ */ new Set([...n.keys(), ...t.keys(), ...r.keys()]);
    for (const l of [...a].sort()) {
      const f = n.get(l), u = t.get(l)?.sha, d = r.get(l), g = d === void 0 ? void 0 : D(d);
      f !== u && (f === void 0 ? s.push({ path: l, kind: "added" }) : u === void 0 ? s.push({ path: l, kind: "deleted" }) : s.push({ path: l, kind: "modified" })), u !== g && (u === void 0 ? i.push(l) : g === void 0 ? o.push({ path: l, kind: "deleted" }) : o.push({ path: l, kind: "modified" }));
    }
    return { staged: s, unstaged: o, untracked: i };
  }
  /** Stage worktree state for tracked paths (commit -a helper); writes blobs. */
  stageAllTracked() {
    const n = this.readIndex(), t = this.worktree();
    for (const [r, s] of n) {
      const o = t.get(r);
      o === void 0 ? n.delete(r) : D(o) !== s.sha && n.set(r, { sha: this.writeBlob(o), size: S(o).length });
    }
    this.writeIndex(n);
  }
  /* revision parsing */
  /**
   * Resolve a revision: HEAD (+ ~n/^n chains), a branch, a full sha, or a
   * unique ≥4-char sha prefix. Null when nothing matches.
   */
  revParse(n) {
    let t = n;
    const r = [];
    for (; ; ) {
      const o = /^(.*?)(~(\d+))$/.exec(t), i = /^(.*?)(\^(\d*))$/.exec(t);
      if (o)
        r.push({ kind: "tilde", n: Number(o[3]) }), t = o[1];
      else if (i)
        r.push({ kind: "caret", n: i[3] === "" ? 1 : Number(i[3]) }), t = i[1];
      else
        break;
    }
    let s = null;
    if (t === "HEAD" ? s = this.headSha() : s = this.refSha(t), s === null && /^[0-9a-f]{4,40}$/.test(t))
      if (t.length === 40) s = this.readObject(t) ? t : null;
      else {
        const o = this.allObjects().filter((i) => i.startsWith(t));
        if (o.length === 1) s = o[0];
        else if (o.length > 1) return null;
      }
    if (s === null) return null;
    for (const o of r) {
      if (s === null) return null;
      const i = this.readObject(s);
      if (i === null || i.type !== "commit") return null;
      const a = T(s, i.payload).parents;
      if (o.kind === "caret") {
        const l = a[o.n - 1];
        if (l === void 0) return null;
        s = l;
      } else
        for (let l = 0; l < o.n; l++) {
          if (a.length === 0) return null;
          const f = a[0];
          s = f;
          const u = this.readObject(f);
          if (u === null || u.type !== "commit") return null;
          a.splice(0, a.length, ...T(f, u.payload).parents);
        }
    }
    return s;
  }
  /* config */
  /** Read one config key (`section.key`); repo config first, then $HOME/.gitconfig. */
  configGet(n) {
    const t = H(this.vfs.read(this.gitPath("config")) ?? "", n);
    if (t !== null) return t;
    const r = this.vfs.resolve("/", this.homeDir() + "/.gitconfig");
    return H(this.vfs.read(r) ?? "", n);
  }
  homeDir() {
    return this.homeOverride ?? "/home";
  }
  configSet(n, t, r) {
    const s = r ? ce("/", this.homeDir() + "/.gitconfig") : this.gitPath("config"), o = this.vfs.read(s) ?? "";
    this.vfs.mountFile(s, ye(o, n, t));
  }
  configList() {
    return K(this.vfs.read(this.gitPath("config")) ?? "");
  }
  /* diffs (worktree/index/commits) */
  /**
   * One file's unified diff, git-style header included. Sides carry both
   * the blob sha (for the `index a..b` header; null = the /dev/null side
   * of an add or delete) and the text — worktree files diff from raw
   * content because `git diff` must not write objects for unstaged edits.
   */
  fileDiff(n, t, r) {
    const s = N(t.text ?? ""), o = N(r.text ?? ""), i = [`diff --git a/${n} b/${n}`];
    if (t.sha === null ? (i.push("new file mode " + W), i.push(`index ${"0".repeat(7)}..${j(r.sha)}`), i.push("--- /dev/null"), i.push(`+++ b/${n}`)) : r.sha === null ? (i.push("deleted file mode " + W), i.push(`index ${j(t.sha)}..${"0".repeat(7)}`), i.push(`--- a/${n}`), i.push("+++ /dev/null")) : (i.push(`index ${j(t.sha)}..${j(r.sha)} ${W}`), i.push(`--- a/${n}`), i.push(`+++ b/${n}`)), t.text !== r.text) {
      const l = C(s.lines, o.lines);
      i.push(
        ...ie(l, 3, {
          aLen: s.lines.length,
          aEndsNewline: s.endsWithNewline,
          bLen: o.lines.length,
          bEndsNewline: o.endsWithNewline
        })
      );
    }
    const a = z(C(s.lines, o.lines));
    return { rows: i, adds: a.adds, dels: a.dels };
  }
}
function j(e) {
  return e.slice(0, 7);
}
function K(e) {
  const n = [];
  let t = "";
  for (const r of e.split(`
`)) {
    const s = r.trim();
    if (s === "" || s.startsWith("#") || s.startsWith(";")) continue;
    const o = /^\[(.*)\]$/.exec(s);
    if (o) {
      t = o[1].trim().toLowerCase();
      continue;
    }
    const i = s.indexOf("=");
    if (i === -1) {
      t !== "" && n.push([`${t}.${s.toLowerCase()}`, "true"]);
      continue;
    }
    if (t === "") continue;
    const a = s.slice(0, i).trim().toLowerCase();
    let l = s.slice(i + 1).trim();
    l.length >= 2 && l.startsWith('"') && l.endsWith('"') && (l = l.slice(1, -1)), n.push([`${t}.${a}`, l]);
  }
  return n;
}
function H(e, n) {
  const t = n.toLowerCase();
  for (const [r, s] of K(e)) if (r === t) return s;
  return null;
}
function ye(e, n, t) {
  const r = n.indexOf("."), s = n.slice(0, r).toLowerCase(), o = n.slice(r + 1).toLowerCase(), i = e.split(`
`);
  let a = !1, l = !1;
  for (let f = 0; f < i.length; f++) {
    const u = i[f], d = /^\s*\[(.*)\]\s*$/.exec(u);
    if (d) {
      a = d[1].trim().toLowerCase() === s;
      continue;
    }
    if (!a) continue;
    const g = u.indexOf("=");
    if (g !== -1 && u.slice(0, g).trim().toLowerCase() === o) {
      i[f] = `	${o} = ${t}`, l = !0;
      break;
    }
  }
  if (!l) {
    let f = -1;
    for (let u = 0; u < i.length; u++) {
      const d = /^\s*\[(.*)\]\s*$/.exec(i[u]);
      d && d[1].trim().toLowerCase() === s && (f = u);
    }
    if (f === -1) {
      for (; i.length > 0 && i[i.length - 1] === ""; ) i.pop();
      i.push(`[${s}]`, `	${o} = ${t}`, "");
    } else
      i.splice(f + 1, 0, `	${o} = ${t}`);
  }
  return i.join(`
`);
}
function Y(e) {
  return `semtext-pkg-${e}.js`;
}
function ve(e) {
  return import(
    /* @vite-ignore */
    new URL(Y(e), import.meta.url).href
  ).then(
    (n) => n
  );
}
function Se(e) {
  return e.includes("--help") || e.includes("-h");
}
function Oe(e, n) {
  const t = Y(e.name), r = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const d of e.commands)
    d.man !== void 0 && o.set(d.name, d.man);
  let i = !1, a = !1, l = null;
  const f = () => (l ??= n().then(
    (d) => {
      for (const g of d.commands) r.set(g.name, g);
      for (const [g, c] of Object.entries(d.manPages ?? {})) s.set(g, c);
      return i = !0, !0;
    },
    () => (a = !0, !1)
  ), l);
  f();
  const u = (d) => {
    const g = () => r.get(d.name);
    return {
      name: d.name,
      // Help/completion surfaces read the stub's line — never the chunk.
      usage: d.usage,
      run(c) {
        const h = g();
        if (h !== void 0)
          return h.run(c);
        if (Se(c.args)) {
          c.out(d.usage);
          return;
        }
        if (a) {
          c.err(`${d.name}: package chunk failed to load (${t})`), c.exit(1);
          return;
        }
        if (i) {
          c.err(`${d.name}: package chunk ${t} does not provide it`), c.exit(70);
          return;
        }
        c.err(`${d.name}: chunk still loading — try again`), c.exit(1);
      },
      complete(c) {
        return g()?.complete?.(c) ?? [];
      },
      app(c) {
        return g()?.app?.(c) ?? null;
      }
    };
  };
  return {
    name: e.name,
    commands: e.commands.map(u),
    ensure: f,
    loaded: () => i,
    state: () => i ? "resident" : a ? "failed" : "loading",
    manNames: () => /* @__PURE__ */ new Set([...s.keys(), ...o.keys()]),
    manPage: (d) => s.get(d) ?? o.get(d) ?? null,
    supersedes: new Set(e.supersedes ?? [])
  };
}
const X = {
  name: "git",
  commands: [
    {
      name: "git",
      summary: "the stupid content tracker, over the VFS",
      usage: "git <command> [<args>] — init add status commit log diff branch checkout show config rev-parse",
      man: [
        "GIT(1)                    semtext-sh manual",
        "",
        "NAME",
        "     git — version control over the VFS (short page: the package",
        "     body has not loaded; the full page prints once it has)."
      ]
    }
  ]
};
Oe(X, () => ve("git"));
const Q = (e) => X.commands.find((n) => n.name === e).usage, Ae = "git version 2.43.0.semtext", Z = [
  ["init", "create an empty repository"],
  ["add", "stage file contents for the next commit"],
  ["status", "show working-tree and index state"],
  ["commit", "record staged changes"],
  ["log", "show commit history"],
  ["diff", "show changes between commits, index and worktree"],
  ["branch", "list, create or delete branches"],
  ["checkout", "switch branches or restore worktree files"],
  ["switch", "switch branches (checkout, branch-only)"],
  ["show", "show one commit with its diff"],
  ["config", "get or set repository or global options"],
  ["rev-parse", "resolve a revision to a commit sha"]
], Te = /* @__PURE__ */ new Set(["clone", "push", "pull", "fetch", "remote", "submodule"]);
function k(e, n, t = 128) {
  e.err(n), e.exit(t);
}
function v(e) {
  const n = M.discover(e.vfs, e.state.cwd);
  return n === null ? (k(e, "fatal: not a git repository (or any of the parent directories): .git"), null) : n;
}
function x(e, n, t) {
  const r = e.vfs.resolve(n, t);
  return !r.startsWith(e.root === "/" ? "/" : e.root + "/") && r !== e.root ? null : r;
}
function ee(e, n) {
  return e.relOf(n);
}
function te(e) {
  return e.length > 0 && !e.startsWith("-") && !e.endsWith("/") && !e.endsWith(".") && !e.endsWith(".lock") && !e.includes("..") && !e.includes("//") && !e.includes("@{") && !e.includes(" ") && !/[\x00-\x1f\x7f~^:?*[\\]/.test(e);
}
function F(e, n, t) {
  const r = [], s = /* @__PURE__ */ new Set([...e.keys(), ...n.keys()]);
  for (const o of [...s].sort()) {
    const i = e.get(o) ?? null, a = n.get(o) ?? null;
    i !== a && r.push({
      path: o,
      old: { sha: i, text: i === null ? null : t(i) },
      neu: { sha: a, text: a === null ? null : t(a) }
    });
  }
  return r;
}
function ne(e) {
  const n = [];
  let t = 0, r = 0, s = 0;
  const o = [];
  for (const l of e) {
    const f = C(N(l.old.text ?? "").lines, N(l.neu.text ?? "").lines), u = z(f);
    t += u.adds, r += u.dels, s = Math.max(s, l.path.length), o.push({ label: l.path, count: u.adds + u.dels, a: u.adds, d: u.dels });
  }
  for (const l of o) {
    const f = Math.min(l.count, 40), u = l.count === 0 ? 0 : Math.round(l.a / l.count * f), d = f - u;
    n.push(
      ` ${l.label.padEnd(s)} | ${String(l.count).padStart(3)} ${"+".repeat(u)}${"-".repeat(d)}`
    );
  }
  const i = o.length, a = [`${i} file${i === 1 ? "" : "s"} changed`];
  return t > 0 && a.push(`${t} insertion${t === 1 ? "" : "s"}(+)`), r > 0 && a.push(`${r} deletion${r === 1 ? "" : "s"}(-)`), i > 0 && n.push(" " + a.join(", ")), n;
}
function Me(e, n) {
  let t = !1;
  const r = [];
  for (const a of n)
    if (a === "-q" || a === "--quiet") t = !0;
    else if (a.startsWith("-")) {
      k(e, `error: unknown option \`${a}'`);
      return;
    } else r.push(a);
  const s = r.length > 1 ? null : r[0] ?? "";
  if (s === null) {
    k(e, "usage: git init [<directory>]");
    return;
  }
  const o = e.vfs.resolve(e.state.cwd, s), i = e.vfs.nodeAt((o === "/" ? "" : o) + "/.git") !== null;
  if (M.create(e.vfs, o), !t) {
    const a = i ? "Reinitialized existing" : "Initialized empty";
    e.out(`${a} Git repository in ${o === "/" ? "" : o}/.git/`);
  }
  e.exit(0);
}
function De(e, n, t) {
  let r = !1, s = !1;
  const o = [];
  for (const u of n)
    if (u === "-A" || u === "--all" || u === ".") r = !0;
    else if (u === "-u" || u === "--update") s = !0;
    else if (!(u === "-v" || u === "--verbose" || u === "-f" || u === "--force")) {
      if (u === "--") continue;
      if (u.startsWith("-")) {
        k(e, `error: unknown option \`${u}'`);
        return;
      } else o.push(u);
    }
  const i = r || o.length === 0 ? [""] : o, a = t.readIndex(), l = t.worktree();
  let f = !1;
  for (const u of i) {
    const d = x(t, e.state.cwd, u);
    if (d === null) {
      k(e, `fatal: ${u}: '${u}' is outside repository at '${t.root}'`);
      return;
    }
    const g = ee(t, d), c = t.vfs.nodeAt(d);
    if (c !== null && c.kind === "dir")
      f = !0, Le(t, g, a, l, s);
    else if (c !== null && c.kind === "file")
      f = !0, I(t, a, g, c.content);
    else if (a.has(g) || g === "")
      g !== "" && (f = !0, a.delete(g));
    else if (!(s && !a.has(g))) {
      k(e, `fatal: pathspec '${u}' did not match any files`);
      return;
    }
  }
  if (!f && !r && !s) {
    k(e, `fatal: nothing specified, nothing added.
hint: Maybe you wanted to say 'git add .'?`);
    return;
  }
  t.writeIndex(a), e.exit(0);
}
function Le(e, n, t, r, s) {
  const o = n === "" ? "" : n + "/";
  if (s) {
    for (const i of [...t.keys()]) {
      if (!i.startsWith(o)) continue;
      const a = r.get(i);
      a === void 0 ? t.delete(i) : I(e, t, i, a);
    }
    return;
  }
  for (const [i, a] of r)
    i.startsWith(o) && I(e, t, i, a);
  for (const i of [...t.keys()])
    i.startsWith(o) && !r.has(i) && t.delete(i);
}
function I(e, n, t, r) {
  n.set(t, { sha: e.writeBlob(r), size: S(r).length });
}
const R = {
  added: "new file:   ",
  modified: "modified:   ",
  deleted: "deleted:    "
};
function q(e, n) {
  const t = /* @__PURE__ */ new Set();
  for (const o of e.readIndex().keys()) t.add(o);
  for (const o of e.commitTree(e.headSha()).keys()) t.add(o);
  const r = (o) => {
    const i = o + "/";
    for (const a of t) if (a.startsWith(i)) return !0;
    return !1;
  }, s = /* @__PURE__ */ new Set();
  for (const o of n) {
    const i = o.split("/");
    let a = o;
    for (let l = 1; l < i.length; l++) {
      const f = i.slice(0, l).join("/");
      if (!r(f)) {
        a = f + "/";
        break;
      }
    }
    s.add(a);
  }
  return [...s].sort();
}
function We(e, n, t) {
  const r = n.includes("--short") || n.includes("-s"), s = t.status(), o = t.currentBranch();
  if (r) {
    const i = { added: "A", modified: "M", deleted: "D" }, a = { added: "A", modified: "M", deleted: "D" }, l = /* @__PURE__ */ new Set();
    for (const f of s.staged) {
      l.add(f.path);
      const u = s.unstaged.find((g) => g.path === f.path), d = u ? a[u.kind] : " ";
      e.out(`${i[f.kind]}${d} ${f.path}`);
    }
    for (const f of s.unstaged)
      l.has(f.path) || e.out(` ${a[f.kind]} ${f.path}`);
    for (const f of q(t, s.untracked)) e.out(`?? ${f}`);
    e.exit(0);
    return;
  }
  if (e.out(o !== "" ? `On branch ${o}` : "HEAD detached"), t.headSha() === null && (e.out(""), e.out("No commits yet")), s.staged.length > 0) {
    e.out(""), e.out("Changes to be committed:"), e.out('  (use "git restore --staged <file>..." to unstage)');
    for (const i of s.staged) e.out(`	${R[i.kind]}${i.path}`);
  }
  if (s.unstaged.length > 0) {
    e.out(""), e.out("Changes not staged for commit:"), e.out('  (use "git add <file>..." to update what will be committed)'), e.out('  (use "git restore <file>..." to discard changes in working directory)');
    for (const i of s.unstaged) e.out(`	${R[i.kind]}${i.path}`);
  }
  if (s.untracked.length > 0) {
    e.out(""), e.out("Untracked files:"), e.out('  (use "git add <file>..." to include in what will be committed)');
    for (const i of q(t, s.untracked)) e.out(`	${i}`);
  }
  s.staged.length === 0 && s.unstaged.length === 0 && s.untracked.length === 0 ? (e.out(""), e.out("nothing to commit, working tree clean")) : s.staged.length === 0 && s.unstaged.length === 0 && (e.out(""), e.out('nothing added to commit but untracked files present (use "git add" to track)')), e.exit(0);
}
function je(e) {
  const n = e.configGet("user.name"), t = e.configGet("user.email");
  return n === null || n === "" || t === null || t === "" ? null : { name: n, email: t };
}
function Ne(e, n, t) {
  let r = null, s = !1, o = !1, i = !1;
  for (let $ = 0; $ < n.length; $++) {
    const y = n[$];
    if ((y === "-m" || y === "--message") && $ + 1 < n.length)
      r = n[++$];
    else if (/^-[a-z]+$/i.test(y) && y.includes("m")) {
      o === !1 && (o = y.slice(1).includes("a"));
      const O = y.slice(y.indexOf("m") + 1);
      O.length > 0 ? r = O : $ + 1 < n.length && (r = n[++$]);
    } else if (y.startsWith("-m") && y.length > 2)
      r = y.slice(2);
    else if (y === "--amend")
      s = !0;
    else if (y === "-a" || y === "--all")
      o = !0;
    else if (y === "--allow-empty")
      i = !0;
    else if (!(y === "-q" || y === "--quiet" || y === "--no-verify" || y === "--signoff")) {
      if (y.startsWith("-")) {
        k(e, `error: unknown option \`${y}'
hint: semtext git cannot open an editor — pass -m <message>`);
        return;
      }
    }
  }
  if (r === null) {
    k(e, "fatal: no commit message given (semtext git has no editor; use -m <message>)");
    return;
  }
  const a = je(t);
  if (a === null) {
    e.err("Author identity unknown"), e.err(""), e.err("*** Please tell me who you are."), e.err(""), e.err("Run"), e.err(""), e.err('  git config --global user.email "you@example.com"'), e.err('  git config --global user.name "Your Name"'), e.err(""), e.err("to set your account's default identity."), e.err("Omit --global to set the identity only in this repository."), e.err(""), e.err("fatal: unable to auto-detect email address (got 'you@semtext.(none)')"), e.exit(128);
    return;
  }
  o && t.stageAllTracked();
  const l = t.headSha();
  if (s && l === null) {
    k(e, "fatal: --amend: no commit to amend (the branch has no history)");
    return;
  }
  const f = s ? T(l, t.readObject(l).payload).parents[0] ?? null : l, u = t.commitTree(f), d = t.readIndex(), g = F(
    u,
    new Map([...d].map(([$, y]) => [$, y.sha])),
    ($) => t.objectText($)
  );
  if (g.length === 0 && !i) {
    e.out(`On branch ${t.currentBranch()}`), e.out("nothing to commit, working tree clean"), e.exit(1);
    return;
  }
  const c = t.writeTreeFromIndex(d), h = Math.floor(Date.now() / 1e3), p = $e(), w = t.writeObject(
    "commit",
    ge({
      tree: c,
      parents: f === null ? [] : [f],
      name: a.name,
      email: a.email,
      when: h,
      offset: p,
      message: r
    })
  );
  t.writeRef(t.currentBranch(), w);
  const b = t.currentBranch(), m = f === null ? " (root-commit)" : "";
  if (e.out(`[${b}${m} ${w.slice(0, 7)}] ${r.split(`
`)[0]}`), g.length > 0) {
    for (const $ of ne(g)) e.out($);
    for (const $ of g)
      $.old.sha === null && e.out(` create mode 100644 ${$.path}`), $.neu.sha === null && e.out(` delete mode 100644 ${$.path}`);
  }
  e.exit(0);
}
function Ee(e, n, t) {
  let r = !1, s = 1 / 0, o = null;
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    if (u === "--oneline") r = !0;
    else if (u === "-n" && f + 1 < n.length) s = Number(n[++f]);
    else if (u.startsWith("--max-count=")) s = Number(u.slice(12));
    else if (/^-\d+$/.test(u)) s = Number(u.slice(1));
    else if (!(u === "--graph" || u === "--decorate" || u === "--all" || u === "--stat")) if (u.startsWith("-")) {
      k(e, `fatal: unrecognized argument: ${u}`);
      return;
    } else if (o === null) o = u;
    else {
      k(e, `fatal: unrecognized argument: ${u}`);
      return;
    }
  }
  const i = t.revParse(o ?? "HEAD");
  if (i === null) {
    t.headSha() === null ? k(
      e,
      `fatal: your current branch '${t.currentBranch() || "HEAD"}' does not have any commits yet`
    ) : k(e, `fatal: ambiguous argument '${o ?? "HEAD"}': unknown revision or path not in the working tree.`);
    return;
  }
  let a = 0, l = i;
  for (; l !== null && a < s; ) {
    const f = T(l, t.readObject(l).payload);
    if (r)
      e.out(`${l.slice(0, 7)} ${f.message.split(`
`)[0]}`);
    else {
      e.out(`commit ${l}`), e.out(
        `Author: ${f.authorName} <${f.authorEmail}>`
      ), e.out(`Date:   ${J(f.authorWhen, f.authorOffset)}`), e.out("");
      for (const u of f.message.replace(/\n$/, "").split(`
`)) e.out(`    ${u}`);
      e.out("");
    }
    a++, l = f.parents[0] ?? null;
  }
  e.exit(0);
}
function Pe(e, n, t) {
  let r = !1;
  const s = [];
  for (const c of n)
    if (c === "--cached" || c === "--staged") r = !0;
    else if (c !== "--stat") {
      if (c !== "--exit-code") if (c === "-s" || c === "--name-only" || c === "--color" || c === "--color=always") {
        if (c !== "--color" && c !== "--color=always")
          return k(e, `fatal: unrecognized argument: ${c}`), null;
      } else {
        if (c.startsWith("-"))
          return k(e, `fatal: unrecognized argument: ${c}`), null;
        s.push(c);
      }
    }
  const o = (c) => t.objectText(c), i = new Map([...t.readIndex()].map(([c, h]) => [c, h.sha])), a = t.commitTree(t.headSha()), l = t.worktree();
  let f, u, d = null;
  if (s.length >= 2) {
    const c = t.revParse(s[0]), h = t.revParse(s[1]);
    if (c === null || h === null)
      return k(e, `fatal: ambiguous argument '${c === null ? s[0] : s[1]}': unknown revision or path not in the working tree.`), null;
    f = t.commitTree(c), u = t.commitTree(h);
  } else if (s.length === 1) {
    const c = t.revParse(s[0]);
    if (c === null)
      return k(
        e,
        `fatal: ambiguous argument '${s[0]}': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'`
      ), null;
    f = t.commitTree(c), u = i, d = l;
  } else if (r)
    f = a, u = i;
  else {
    f = i, u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
    for (const [c, h] of i) {
      const p = l.get(c);
      p !== void 0 && (u.set(c, D(p)), d.set(c, p));
    }
  }
  const g = F(f, u, o);
  if (d !== null)
    for (const c of g) {
      const h = d.get(c.path);
      h !== void 0 && c.neu.sha !== null && (c.neu.text = h);
    }
  return { changes: g, textOf: o };
}
function Ce(e, n, t) {
  const r = Pe(e, n, t);
  if (r === null) return;
  const { changes: s } = r, o = n.includes("--stat"), i = n.includes("--exit-code");
  if (o)
    for (const a of ne(s)) e.out(a);
  else
    for (const a of s) {
      const l = t.fileDiff(a.path, a.old, a.neu);
      for (const f of l.rows) e.out(f);
    }
  e.exit(i && s.length > 0 ? 1 : 0);
}
function Ie(e, n, t) {
  const s = n.filter((f) => !f.startsWith("-"))[0] ?? "HEAD", o = t.revParse(s);
  if (o === null) {
    k(
      e,
      `fatal: ambiguous argument '${s}': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'`
    );
    return;
  }
  const i = T(o, t.readObject(o).payload);
  e.out(`commit ${o}`);
  for (const f of i.parents) e.out(`Merge: ${f.slice(0, 7)}`);
  e.out(`Author: ${i.authorName} <${i.authorEmail}>`), e.out(`Date:   ${J(i.authorWhen, i.authorOffset)}`), e.out("");
  for (const f of i.message.replace(/\n$/, "").split(`
`)) e.out(`    ${f}`);
  e.out("");
  const a = t.commitTree(i.parents[0] ?? null), l = t.commitTree(o);
  for (const f of F(a, l, (u) => t.objectText(u))) {
    const u = t.fileDiff(f.path, f.old, f.neu);
    for (const d of u.rows) e.out(d);
  }
  e.exit(0);
}
function Be(e, n, t) {
  let r = !1;
  const s = [];
  for (const a of n)
    if (a === "-d" || a === "--delete") r = !0;
    else if (!(a === "-a" || a === "--all" || a === "-l" || a === "--list")) if (a.startsWith("-")) {
      k(e, `error: unknown option \`${a}'`);
      return;
    } else s.push(a);
  if (r) {
    for (const a of s) {
      if (a === t.currentBranch()) {
        k(e, `error: cannot delete branch '${a}' used by worktree at '${t.root}'`, 1);
        return;
      }
      const l = t.refSha(a);
      if (l === null) {
        k(e, `error: branch '${a}' not found.`, 1);
        return;
      }
      if (!Fe(t, l)) {
        e.err(`error: the branch '${a}' is not fully merged.`), e.err("hint: If you are sure you want to delete it, run 'git branch -D <branch-name>'."), e.exit(1);
        return;
      }
      t.vfs.rm(t.gitPath(`refs/heads/${a}`)), e.out(`Deleted branch ${a} (was ${l.slice(0, 7)}).`);
    }
    e.exit(0);
    return;
  }
  if (s.length === 0) {
    const a = t.currentBranch();
    for (const l of t.listBranches()) e.out(`${l === a ? "* " : "  "}${l}`);
    e.exit(0);
    return;
  }
  const o = s[0], i = s[1] !== void 0 ? t.revParse(s[1]) : t.headSha();
  if (i === null) {
    k(e, `fatal: not a valid object name: '${s[1] ?? "HEAD"}'`);
    return;
  }
  if (!te(o)) {
    k(e, `fatal: '${o}' is not a valid branch name`);
    return;
  }
  if (t.refSha(o) !== null) {
    k(e, `fatal: a branch named '${o}' already exists`);
    return;
  }
  t.writeRef(o, i), e.exit(0);
}
function Fe(e, n) {
  const t = /* @__PURE__ */ new Set();
  let r = e.headSha();
  for (; r !== null && !t.has(r); ) {
    if (r === n) return !0;
    t.add(r);
    const s = e.readObject(r);
    if (s === null) return !1;
    r = T(r, s.payload).parents[0] ?? null;
  }
  return !1;
}
function B(e, n, t, r, s) {
  if (!te(t))
    return k(e, `fatal: '${t}' is not a valid branch name`), !1;
  let o;
  if (r)
    if (n.refSha(t) !== null) {
      if (!s)
        return k(e, `fatal: a branch named '${t}' already exists`), !1;
      o = n.headSha();
    } else {
      const h = n.headSha();
      if (h === null)
        return k(e, "fatal: not a valid object name: 'HEAD'"), !1;
      n.writeRef(t, h), o = h;
    }
  else {
    const h = n.refSha(t);
    if (h === null)
      return k(e, `error: pathspec '${t}' did not match any file(s) known to git`, 1), !1;
    o = h;
  }
  if (n.currentBranch() === t && !r)
    return e.out(`Already on '${t}'`), e.exit(0), !0;
  const i = n.commitTree(n.headSha()), a = n.commitTree(o), l = n.worktree(), f = n.readIndex(), u = [], d = [], g = /* @__PURE__ */ new Set([...i.keys(), ...a.keys()]);
  for (const h of g) {
    const p = i.get(h), w = a.get(h);
    if (p === w) continue;
    const b = f.get(h)?.sha, m = l.get(h), $ = m === void 0 ? void 0 : D(m);
    if (p === void 0 && b === void 0 && $ !== void 0) {
      d.push(h);
      continue;
    }
    ((b ?? null) !== (p ?? null) || ($ ?? null) !== (p ?? null)) && u.push(h);
  }
  if (u.length > 0 || d.length > 0) {
    if (u.length > 0) {
      e.err("error: Your local changes to the following files would be overwritten by checkout:");
      for (const h of u.sort()) e.err(`	${h}`);
      e.err("Please commit your changes or stash them before you switch branches.");
    }
    if (d.length > 0) {
      e.err("error: The following untracked working tree files would be overwritten by checkout:");
      for (const h of d.sort()) e.err(`	${h}`);
      e.err("Please move or remove them before you switch branches.");
    }
    return e.err("Aborting"), e.exit(1), !1;
  }
  for (const h of g) {
    if (a.has(h)) continue;
    const p = n.workPath(h);
    n.vfs.nodeAt(p) !== null && n.vfs.rm(p);
  }
  for (const [h, p] of a)
    n.vfs.mountFile(n.workPath(h), n.objectText(p) ?? "");
  const c = /* @__PURE__ */ new Map();
  for (const [h, p] of a) c.set(h, { sha: p, size: S(n.objectText(p) ?? "").length });
  return n.writeIndex(c), n.vfs.mountFile(n.gitPath("HEAD"), `ref: refs/heads/${t}
`), e.out(r ? `Switched to a new branch '${t}'` : `Switched to branch '${t}'`), e.exit(0), !0;
}
function Ue(e, n, t) {
  const r = n.readIndex();
  let s = !1;
  for (const o of t) {
    const i = x(n, e.state.cwd, o);
    if (i === null) {
      k(e, `error: pathspec '${o}' did not match any file(s) known to git`, 1), s = !0;
      continue;
    }
    const a = ee(n, i), l = r.get(a);
    if (l === void 0) {
      e.err(`error: pathspec '${o}' did not match any file(s) known to git`), e.exit(1), s = !0;
      continue;
    }
    n.vfs.mountFile(i, n.objectText(l.sha) ?? "");
  }
  return !s;
}
function He(e, n, t) {
  let r = !1, s = !1;
  const o = [];
  let i = !1;
  for (const l of n) {
    if (i) {
      o.push(l);
      continue;
    }
    if (l === "--")
      i = !0;
    else if (l === "-b")
      r = !0;
    else if (l === "-B")
      r = !0, s = !0;
    else if (l === "-f" || l === "--force" || l === "-q" || l === "--quiet")
      s ||= l !== "-q" && l !== "--quiet";
    else if (l.startsWith("-")) {
      k(e, `error: unknown option \`${l}'`);
      return;
    } else o.push(l);
  }
  if (r) {
    const l = o[0];
    if (l === void 0) {
      k(e, "fatal: missing branch name with -b");
      return;
    }
    B(e, t, l, !0, s);
    return;
  }
  if (o.length === 0) {
    e.exit(0);
    return;
  }
  const a = o[0];
  if (o.length === 1 && t.refSha(a) !== null) {
    B(e, t, a, !1, s);
    return;
  }
  Ue(e, t, o) && e.exit(0);
}
function Re(e, n, t) {
  let r = !1;
  const s = [];
  for (const i of n)
    if (i === "-c") r = !0;
    else if (i === "-C") r = !0;
    else if (i.startsWith("-")) {
      k(e, `error: unknown option \`${i}'`);
      return;
    } else s.push(i);
  const o = s[0];
  if (o === void 0) {
    k(e, "fatal: missing branch or commit operand");
    return;
  }
  B(e, t, o, r, !1);
}
function qe(e, n, t) {
  let r = !1, s = !1, o = !1;
  const i = [];
  for (const l of n)
    if (l === "--global") r = !0;
    else if (l === "--list" || l === "-l") s = !0;
    else if (l === "--unset") o = !0;
    else if (!(l === "--local" || l === "--get")) if (l.startsWith("-")) {
      k(e, `error: unknown option \`${l}'`);
      return;
    } else i.push(l);
  if (s) {
    for (const [l, f] of t.configList()) e.out(`${l}=${f}`);
    e.exit(0);
    return;
  }
  const a = i[0];
  if (a === void 0 || !a.includes(".")) {
    k(e, "error: key does not contain a section (like user.name)");
    return;
  }
  if (o) {
    k(e, "error: --unset is not supported in semtext git (edit the config file)");
    return;
  }
  if (i.length === 1) {
    const l = t.configGet(a);
    if (l === null) {
      e.exit(1);
      return;
    }
    e.out(l), e.exit(0);
    return;
  }
  t.configSet(a, i.slice(1).join(" "), r), e.exit(0);
}
function ze(e, n, t) {
  const r = n.includes("--short"), s = n.filter((i) => !i.startsWith("-"));
  if (s.length === 0) {
    k(e, "usage: git rev-parse [--short] <revision>...");
    return;
  }
  let o = !1;
  for (const i of s) {
    const a = t.revParse(i);
    if (a === null) {
      e.err(
        `fatal: ambiguous argument '${i}': unknown revision or path not in the working tree.`
      ), o = !0;
      continue;
    }
    e.out(r ? a.slice(0, 7) : a);
  }
  e.exit(o ? 128 : 0);
}
function Ge(e) {
  const n = e.args, t = (o) => {
    e.out(Q("git")), e.out("");
    for (const [i, a] of Z) e.out(`   ${i.padEnd(12)} ${a}`);
    e.exit(o);
  };
  if (n.length === 0) {
    t(1);
    return;
  }
  const r = n[0], s = n.slice(1);
  if (r === "--help" || r === "-h" || r === "help") {
    t(0);
    return;
  }
  if (r === "--version" || r === "version") {
    e.out(Ae), e.exit(0);
    return;
  }
  if (Te.has(r)) {
    e.err(
      `git: '${r}' is not supported in semtext-sh — there is no CORS-capable git transport over the VFS. Local history (init/add/commit/log/diff/branch/checkout) works everywhere.`
    ), e.exit(1);
    return;
  }
  switch (r) {
    case "init":
      Me(e, s);
      return;
    case "add": {
      const o = v(e);
      o !== null && De(e, s, o);
      return;
    }
    case "status": {
      const o = v(e);
      o !== null && We(e, s, o);
      return;
    }
    case "commit": {
      const o = v(e);
      o !== null && Ne(e, s, o);
      return;
    }
    case "log": {
      const o = v(e);
      o !== null && Ee(e, s, o);
      return;
    }
    case "diff": {
      const o = v(e);
      o !== null && Ce(e, s, o);
      return;
    }
    case "show": {
      const o = v(e);
      o !== null && Ie(e, s, o);
      return;
    }
    case "branch": {
      const o = v(e);
      o !== null && Be(e, s, o);
      return;
    }
    case "checkout": {
      const o = v(e);
      o !== null && He(e, s, o);
      return;
    }
    case "switch": {
      const o = v(e);
      o !== null && Re(e, s, o);
      return;
    }
    case "config": {
      const o = v(e);
      o !== null && qe(e, s, o);
      return;
    }
    case "rev-parse": {
      const o = v(e);
      o !== null && ze(e, s, o);
      return;
    }
    default:
      e.err(`git: '${r}' is not a git command. See 'git --help'.`), e.exit(1);
  }
}
function Ve(e) {
  const n = e.word.lastIndexOf("/"), t = n === -1 ? "" : e.word.slice(0, n + 1), r = n === -1 ? e.word : e.word.slice(n + 1), s = e.vfs.resolve(e.cwd, t === "" ? "." : t), o = [];
  for (const i of e.vfs.list(s))
    !i.name.startsWith(r) || i.name === ".git" || o.push(t + i.name + (i.kind === "dir" ? "/" : ""));
  return o;
}
function _e(e) {
  const n = M.discover(e.vfs, e.cwd);
  return n === null ? [] : n.listBranches().filter((t) => t.startsWith(e.word));
}
const Je = {
  name: "git",
  usage: Q("git"),
  run: Ge,
  complete(e) {
    if (e.args.length === 0) return Z.map(([t]) => t).filter((t) => t.startsWith(e.word));
    const n = e.args[0];
    return n === "checkout" || n === "switch" || n === "branch" ? [..._e(e), ...Ke(n).filter((t) => t.startsWith(e.word))] : (n === "add" || n === "status" || n === "diff" || n === "show" || n === "restore") && e.args.length >= 1 ? Ve(e) : [];
  }
};
function Ke(e) {
  return e === "checkout" ? ["-b", "-B", "--"] : e === "switch" ? ["-c", "-C"] : e === "branch" ? ["-d", "--delete", "-a", "--all"] : [];
}
const Ye = [Je], Xe = {
  git: [
    "GIT(1)                    semtext-sh manual",
    "",
    "NAME",
    "     git — the stupid content tracker, over the shell VFS",
    "",
    "SYNOPSIS",
    "     git <command> [<args>]",
    "",
    "DESCRIPTION",
    "     Version control on the virtual file system, backed by a pure-JS",
    "     loose-object store (SHA-1 names, real ref/commit/tree layouts).",
    "",
    "COMMANDS",
    "     init [dir]        create an empty repository (default branch: main)",
    "     add [-A] [-u] [path...]        stage content (stages deletions too)",
    "     status [--short]  working-tree / index state",
    "     commit -m <msg> [-a] [--amend] [--allow-empty]",
    "     log [--oneline] [-n N] [<rev>]",
    "     diff [--cached] [--stat] [--exit-code] [<rev> [<rev>]]",
    "     branch [-d] [<name> [<start>]]",
    "     checkout [-b <new> | <branch> | -- <paths...>]",
    "     switch [-c] <branch>",
    "     show [<rev>]      one commit + its diff",
    "     config [--global] <key> [<value>] | --list",
    "     rev-parse [--short] <revision>...",
    "",
    "REVISIONS",
    "     HEAD, HEAD~n, HEAD^n, a branch name, a full or unique-prefix sha.",
    "",
    "DEVIATIONS from on-disk git (documented, deliberate):",
    "     - objects are stored uncompressed (no zlib): the synchronous",
    "       command path cannot deflate; all other formats match loose git.",
    "     - .git/index is JSON, not the binary index.",
    "     - no network transport: clone/push/pull/fetch explain and stop.",
    "     - no tags, no .gitignore, no editor (commit needs -m).",
    "     - ^n only navigates merge parents; no tag peeling (^0 == ^1).",
    "",
    "EXIT STATUS",
    "     0 success · 1 clean-but-nothing / conflicts · 128 fatal",
    "",
    "SEMTEXT-SH                 2026-10-17                    GIT(1)"
  ]
}, Qe = { commands: Ye, manPages: Xe };
export {
  Ye as commands,
  Xe as manPages,
  Qe as pkg
};
