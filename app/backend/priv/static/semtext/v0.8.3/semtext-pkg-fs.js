function H(e) {
  return `semtext-pkg-${e}.js`;
}
function te(e) {
  return import(
    /* @vite-ignore */
    new URL(H(e), import.meta.url).href
  ).then(
    (n) => n
  );
}
function ne(e) {
  return e.includes("--help") || e.includes("-h");
}
function se(e, n) {
  const s = H(e.name), t = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  for (const l of e.commands)
    l.man !== void 0 && a.set(l.name, l.man);
  let u = !1, h = !1, d = null;
  const c = () => (d ??= n().then(
    (l) => {
      for (const o of l.commands) t.set(o.name, o);
      for (const [o, m] of Object.entries(l.manPages ?? {})) r.set(o, m);
      return u = !0, !0;
    },
    () => (h = !0, !1)
  ), d);
  c();
  const i = (l) => {
    const o = () => t.get(l.name);
    return {
      name: l.name,
      // Help/completion surfaces read the stub's line — never the chunk.
      usage: l.usage,
      run(m) {
        const f = o();
        if (f !== void 0)
          return f.run(m);
        if (ne(m.args)) {
          m.out(l.usage);
          return;
        }
        if (h) {
          m.err(`${l.name}: package chunk failed to load (${s})`), m.exit(1);
          return;
        }
        if (u) {
          m.err(`${l.name}: package chunk ${s} does not provide it`), m.exit(70);
          return;
        }
        m.err(`${l.name}: chunk still loading — try again`), m.exit(1);
      },
      complete(m) {
        return o()?.complete?.(m) ?? [];
      },
      app(m) {
        return o()?.app?.(m) ?? null;
      }
    };
  };
  return {
    name: e.name,
    commands: e.commands.map(i),
    ensure: c,
    loaded: () => u,
    state: () => u ? "resident" : h ? "failed" : "loading",
    manNames: () => /* @__PURE__ */ new Set([...r.keys(), ...a.keys()]),
    manPage: (l) => r.get(l) ?? a.get(l) ?? null,
    supersedes: new Set(e.supersedes ?? [])
  };
}
const K = {
  name: "fs",
  commands: [
    {
      name: "mv",
      summary: "move (rename) files",
      usage: "mv [-fnv] SOURCE... DEST",
      man: [
        "MV(1)                     semtext-sh manual",
        "",
        "NAME",
        "     mv — move (rename) files (short page; the full one prints",
        "     once the package body has loaded)."
      ]
    },
    {
      name: "ln",
      summary: "create links (VFS supports none — reports)",
      usage: "ln [-sf] TARGET... LINK",
      man: [
        "LN(1)                     semtext-sh manual",
        "",
        "NAME",
        "     ln — create links; this VFS has no symlink/hard-link nodes,",
        "     so ln validates operands then reports honestly (short page)."
      ]
    },
    {
      name: "chmod",
      summary: "change file mode bits (session-scoped)",
      usage: "chmod [-R] OCTAL-MODE FILE...",
      man: [
        "CHMOD(1)                  semtext-sh manual",
        "",
        "NAME",
        "     chmod — octal modes only, kept in a session-scoped map the",
        "     VFS cannot persist (short page until the body loads)."
      ]
    },
    {
      name: "stat",
      summary: "display file status (size, kind, mode, backend)",
      usage: "stat FILE...",
      man: [
        "STAT(1)                   semtext-sh manual",
        "",
        "NAME",
        "     stat — size, kind, access mode and the backend that would",
        "     persist the file; no timestamps exist (short page)."
      ]
    },
    {
      name: "tree",
      summary: "list directories recursively as a tree",
      usage: "tree [-ad] [-L LEVEL] [DIR...]",
      man: [
        "TREE(1)                   semtext-sh manual",
        "",
        "NAME",
        "     tree — box-drawing recursion with a summary line (-a dot",
        "     files, -d dirs only, -L depth cap; short page)."
      ]
    },
    {
      name: "du",
      summary: "estimate file space usage (bytes)",
      usage: "du [-ash] [FILE|DIR...]",
      man: [
        "DU(1)                     semtext-sh manual",
        "",
        "NAME",
        "     du — content-byte totals per directory (-s totals, -a files,",
        "     -h humanize; short page until the body loads)."
      ]
    },
    {
      name: "df",
      summary: "report mounted-backend usage",
      usage: "df [-h] [PATH...]",
      man: [
        "DF(1)                     semtext-sh manual",
        "",
        "NAME",
        "     df — one line per mounted backend: Used bytes; Avail and",
        "     Capacity are unknown (-). (Short page until the body loads.)"
      ]
    },
    {
      name: "file",
      summary: "determine file type by content",
      usage: "file [-b] [FILE...]   (- reads stdin)",
      man: [
        "FILE(1)                   semtext-sh manual",
        "",
        "NAME",
        "     file — magic sniffing: text, JSON, XML/HTML/SemText, PNG,",
        "     gzip, zip, tar, scripts (short page until the body loads)."
      ]
    },
    {
      name: "realpath",
      summary: "print resolved absolute paths",
      usage: "realpath FILE...",
      man: [
        "REALPATH(1)               semtext-sh manual",
        "",
        "NAME",
        "     realpath — normalize against the cwd; every operand must",
        "     exist (short page until the body loads)."
      ]
    },
    {
      name: "basename",
      summary: "strip directory and suffix from a name",
      usage: "basename [-a | -s SUFFIX] NAME [SUFFIX...]",
      man: [
        "BASENAME(1)               semtext-sh manual",
        "",
        "NAME",
        "     basename — the final path segment, minus an optional",
        "     suffix (-a many names; short page until the body loads)."
      ]
    },
    {
      name: "dirname",
      summary: "strip the last segment from each name",
      usage: "dirname NAME...",
      man: [
        "DIRNAME(1)                semtext-sh manual",
        "",
        "NAME",
        "     dirname — 'a/b' -> 'a', 'x' -> '.', trailing slashes off",
        "     (short page until the body loads)."
      ]
    },
    {
      name: "mktemp",
      summary: "create a unique temp file or directory",
      usage: "mktemp [-d] [-p DIR] [TEMPLATE]",
      man: [
        "MKTEMP(1)                 semtext-sh manual",
        "",
        "NAME",
        "     mktemp — unique name from a template's X-run (default",
        "     tmp.XXXXXXXXXX under /tmp; -d for a dir; short page)."
      ]
    },
    {
      name: "readlink",
      summary: "resolve links (VFS has none — reports)",
      usage: "readlink [-f] FILE...",
      man: [
        "READLINK(1)               semtext-sh manual",
        "",
        "NAME",
        "     readlink — 'not a symbolic link' for everything (no symlink",
        "     nodes exist); -f canonicalizes like realpath (short page)."
      ]
    },
    {
      name: "type",
      summary: "how the shell resolves a command word",
      usage: "type [-a] NAME...",
      man: [
        "TYPE(1)                   semtext-sh manual",
        "",
        "NAME",
        "     type — alias and/or registered command per name, or",
        "     'not found' (exit 1); complements which (short page)."
      ]
    },
    {
      name: "date",
      summary: "print or format the date and time",
      usage: "date [-u] [-d DATE] [+FORMAT]",
      man: [
        "DATE(1)                   semtext-sh manual",
        "",
        "NAME",
        "     date — GNU-style output, a strftime-subset +FORMAT, -u for",
        "     UTC and -d for fixed dates (short page until the body loads)."
      ]
    },
    {
      name: "cal",
      summary: "print a calendar",
      usage: "cal [[MONTH] YEAR]   (cal YEAR — full sheet)",
      man: [
        "CAL(1)                    semtext-sh manual",
        "",
        "NAME",
        "     cal — Sunday-first month grid; month by number or name,",
        "     or a full-year sheet (short page until the body loads)."
      ]
    },
    {
      name: "sleep",
      summary: "validate a duration (returns at once)",
      usage: "sleep SECONDS[s|m|h|d]...",
      man: [
        "SLEEP(1)                  semtext-sh manual",
        "",
        "NAME",
        "     sleep — validates GNU-style durations but cannot block: the",
        "     command path is synchronous (short page until the body loads)."
      ]
    },
    {
      name: "seq",
      summary: "print a sequence of numbers",
      usage: "seq [-w] [-f FMT] [-s SEP] [FIRST [INCR]] LAST",
      man: [
        "SEQ(1)                    semtext-sh manual",
        "",
        "NAME",
        "     seq — float sequences, -w pad, -s separator, -f printf",
        "     float form; 100000-line cap (short page until loaded)."
      ]
    },
    {
      name: "yes",
      summary: "repeat a string (bounded emission)",
      usage: "yes [STRING]",
      man: [
        "YES(1)                    semtext-sh manual",
        "",
        "NAME",
        "     yes — repeats default y (or STRING) with a 1000-line cap:",
        "     the sync shell cannot stream forever (short page)."
      ]
    },
    {
      name: "expr",
      summary: "evaluate an expression",
      usage: "expr EXPRESSION",
      man: [
        "EXPR(1)                   semtext-sh manual",
        "",
        "NAME",
        "     expr — arithmetic, comparisons, string ops and BRE :",
        "     matching with GNU precedence and exit codes (short page)."
      ]
    },
    {
      name: "test",
      summary: "evaluate a condition (exit status)",
      usage: "test EXPRESSION",
      man: [
        "TEST(1)                   semtext-sh manual",
        "",
        "NAME",
        "     test — file/string/integer conditions, ! -a -o ( ); the `[`",
        "     spelling cannot be registered (short page until loaded)."
      ]
    }
  ]
};
se(K, () => te("fs"));
const g = (e) => K.commands.find((n) => n.name === e).usage, re = new TextEncoder(), L = (e) => re.encode(e).length;
function x(e) {
  if (Math.abs(e) < 1024) return String(e);
  const s = ["K", "M", "G", "T", "P", "E"];
  let t = e, r = "";
  for (const u of s) {
    if (Math.abs(t) < 1024) break;
    t /= 1024, r = u;
  }
  return `${Math.abs(t) < 10 ? Math.round(t * 10) / 10 : Math.round(t)}${r}`;
}
const I = (e, n) => {
  e.err(`Try '${n} --help' for more information.`);
};
function v(e, n, s, t) {
  const { flagLetters: r = "", valueLetters: a = "", longFlags: u = [], longValues: h = [] } = t, d = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map(), i = [], l = (f, p) => (e.err(`${n}: ${f}${p === "" ? "" : ` '${p}'`}`), I(e, n), e.exit(1), null);
  let o = 0, m = !1;
  for (; o < s.length; ) {
    const f = s[o];
    if (m || f === "-" || /^-\d/.test(f) || /^-\.\d/.test(f) || !f.startsWith("-")) {
      i.push(f), o++;
      continue;
    }
    if (f === "--") {
      m = !0, o++;
      continue;
    }
    if (f === "--help") {
      d.add("--help"), o++;
      continue;
    }
    if (f.startsWith("--")) {
      const p = f.indexOf("="), y = p === -1 ? f : f.slice(0, p);
      if (h.includes(y)) {
        const N = p !== -1 ? f.slice(p + 1) : s[++o];
        if (N === void 0) return l(`option '${y}' requires an argument`, y);
        c.set(y, N);
      } else if (u.includes(y))
        d.add(y);
      else
        return l("unrecognized option", f);
      o++;
      continue;
    }
    for (let p = 1; p < f.length; p++) {
      const y = f[p];
      if (a.includes(y)) {
        const N = f.slice(p + 1), M = N !== "" ? N : s[++o];
        if (M === void 0) return l(`option requires an argument -- '${y}'`, "");
        c.set("-" + y, M);
        break;
      }
      if (r.includes(y))
        d.add("-" + y);
      else
        return l(`invalid option -- '${y}'`, "");
    }
    o++;
  }
  return { flags: d, values: c, operands: i };
}
const b = (e, n) => e.vfs.resolve(e.state.cwd, n), ae = (e, n) => e.vfs.nodeAt(b(e, n));
function B(e, n, s, t = "cannot access") {
  e.err(`${n}: ${t} '${s}': No such file or directory`);
}
const O = /* @__PURE__ */ new Map(), oe = (e, n, s) => O.get(n) ?? (s.kind === "dir" ? 493 : 420);
function ie(e) {
  const n = (s) => {
    const t = e >> s & 7;
    return (t & 4 ? "r" : "-") + (t & 2 ? "w" : "-") + (t & 1 ? "x" : "-");
  };
  return n(6) + n(3) + n(0);
}
const le = (e) => e.toString(8).padStart(4, "0");
function j(e, n) {
  const s = e.vfs.backendFor(b(e, n));
  return s ? { id: s.id, mountpoint: s.mountpoint } : { id: "memory", mountpoint: "/" };
}
function J(e, n) {
  const s = e.vfs.nodeAt(n);
  return s === null ? 0 : s.kind === "file" ? L(s.content) : s.children.reduce((t, r) => t + J(e, e.vfs.resolve(n, r.name)), 0);
}
const ue = {
  name: "mv",
  usage: g("mv"),
  complete: (e) => ["-f", "-n", "-v", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "mv", e.args, { flagLetters: "fnv" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      for (const c of [
        g("mv"),
        "",
        "Move (rename) SOURCE to DEST, or move every SOURCE into an",
        "existing DEST directory. -n skips existing destinations (this",
        "shell has no prompt channel, so -f is accepted as a no-op),",
        "-v prints each move as 'src -> dst'."
      ]) e.out(c);
      return;
    }
    if (t.length === 0) {
      e.err("mv: missing file operand"), e.exit(1);
      return;
    }
    if (t.length === 1) {
      e.err(`mv: missing destination file operand after '${t[0]}'`), e.exit(1);
      return;
    }
    const r = t[t.length - 1], a = b(e, r), u = t.slice(0, -1), h = e.vfs.nodeAt(a);
    if (u.length > 1 && h?.kind !== "dir") {
      e.err(`mv: target '${r}' is not a directory`), e.exit(1);
      return;
    }
    let d = !1;
    for (const c of u) {
      const i = b(e, c), l = e.vfs.nodeAt(i);
      if (l === null) {
        B(e, "mv", c, "cannot stat"), d = !0;
        continue;
      }
      const o = h?.kind === "dir" ? e.vfs.resolve(a, l.name) : a;
      if (o === i) {
        e.err(`mv: '${c}' and '${r}' are the same file`), d = !0;
        continue;
      }
      if (s.has("-n") && e.vfs.nodeAt(o) !== null) continue;
      if (e.vfs.nodeAt(e.vfs.resolve(o, ".."))?.kind !== "dir") {
        e.err(`mv: cannot move '${c}' to '${r}': No such file or directory`), d = !0;
        continue;
      }
      try {
        if (e.vfs.rename(i, o), s.has("-v")) {
          const p = h?.kind === "dir" ? `${r.replace(/\/+$/, "")}/${l.name}` : r;
          e.out(`'${c}' -> '${p}'`);
        }
        const f = O.get(i);
        f !== void 0 && (O.delete(i), O.set(o, f));
      } catch (f) {
        const p = f instanceof Error ? f.message : String(f);
        e.err(`mv: cannot move '${c}' to '${r}': ${p}`), d = !0;
      }
    }
    d && e.exit(1);
  }
}, de = {
  name: "ln",
  usage: g("ln"),
  complete: (e) => ["-s", "-f", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "ln", e.args, { flagLetters: "sf" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      e.out(g("ln"));
      return;
    }
    if (t.length === 0) {
      e.err("ln: missing file operand"), e.exit(1);
      return;
    }
    if (t.length === 1) {
      e.err(`ln: missing destination file operand after '${t[0]}'`), e.exit(1);
      return;
    }
    const r = t[t.length - 1];
    e.err(`ln: failed to create ${s.has("-s") ? "symbolic link" : "hard link"} '${r}': Operation not supported`), e.err("ln: this VFS stores 'file | dir' nodes only — no symlinks, no hard links"), e.exit(1);
  }
}, me = {
  name: "readlink",
  usage: g("readlink"),
  complete: (e) => ["-f", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "readlink", e.args, { flagLetters: "f" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      e.out(g("readlink"));
      return;
    }
    if (t.length === 0) {
      e.err("readlink: missing operand"), e.exit(1);
      return;
    }
    if (s.has("-f")) {
      for (const r of t) {
        const a = b(e, r);
        if (e.vfs.nodeAt(e.vfs.resolve(a, ".."))?.kind !== "dir") {
          e.err(`readlink: ${r}: No such file or directory`), e.exit(1);
          return;
        }
        e.out(a);
      }
      return;
    }
    e.err(`readlink: ${t[0]}: not a symbolic link`), e.err("readlink: this VFS stores no symlink nodes — nothing can ever be one"), e.exit(1);
  }
}, he = {
  name: "chmod",
  usage: g("chmod"),
  complete: (e) => ["-R", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "chmod", e.args, { flagLetters: "R" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      for (const i of [
        g("chmod"),
        "",
        "Octal modes only (0644-style). The VFS has no permission",
        "metadata: the mode is recorded in a SESSION-SCOPED map that",
        "stat reads — it never persists to a backend. -R recurses."
      ]) e.out(i);
      return;
    }
    if (t.length === 0) {
      e.err("chmod: missing operand"), I(e, "chmod"), e.exit(1);
      return;
    }
    const r = t[0], a = t.slice(1);
    if (a.length === 0) {
      e.err(`chmod: missing operand after '${r}'`), e.exit(1);
      return;
    }
    const u = /^(?:0o)?([0-7]{3,4})$/.exec(r);
    if (u === null) {
      e.err(`chmod: invalid mode: '${r}'`), e.err("chmod: this build accepts octal modes only (symbolic modes are not implemented)"), e.exit(1);
      return;
    }
    const h = parseInt(u[1], 8) & 511;
    let d = !1;
    const c = (i, l) => {
      const o = e.vfs.nodeAt(i);
      if (o === null) {
        B(e, "chmod", l), d = !0;
        return;
      }
      if (O.set(i, h), s.has("-R") && o.kind === "dir")
        for (const m of e.vfs.list(i)) c(e.vfs.resolve(i, m.name), `${l.replace(/\/+$/, "")}/${m.name}`);
    };
    for (const i of a) c(b(e, i), i);
    d && e.exit(1);
  }
}, fe = {
  name: "stat",
  usage: g("stat"),
  run(e) {
    const n = v(e, "stat", e.args, {});
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      e.out(g("stat"));
      return;
    }
    if (t.length === 0) {
      e.err("stat: missing operand"), I(e, "stat"), e.exit(1);
      return;
    }
    let r = !1;
    t.forEach((a, u) => {
      const h = b(e, a), d = e.vfs.nodeAt(h);
      if (d === null) {
        e.err(`stat: cannot stat '${a}': No such file or directory`), r = !0;
        return;
      }
      u > 0 && e.out("");
      const c = d.kind === "file" ? L(d.content) : 4096, i = d.kind === "dir" ? "directory" : "regular file", l = oe(e, h, d), o = j(e, h);
      e.out(`  File: ${h}`), e.out(`  Size: ${c}${" ".repeat(Math.max(1, 13 - String(c).length))}Kind: ${i}`), e.out(`Access: (${le(l)}/${ie(l)})`), e.out(`Backend: ${o.id} (${o.mountpoint})`);
    }), r && e.exit(1);
  }
}, ce = {
  name: "tree",
  usage: g("tree"),
  complete: (e) => ["-a", "-d", "-L", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "tree", e.args, { flagLetters: "ad", valueLetters: "L" });
    if (n === null) return;
    const { flags: s, values: t, operands: r } = n;
    if (s.has("--help")) {
      for (const d of [
        g("tree"),
        "",
        "Recursively lists each DIR (default .). Dot entries hide",
        "until -a; -d lists directories only; -L LEVEL caps the depth",
        "(1 = immediate children). Ends with a summary line."
      ]) e.out(d);
      return;
    }
    let a = 1 / 0;
    if (t.has("-L")) {
      const d = Number(t.get("-L"));
      if (!Number.isInteger(d) || d < 1) {
        e.err("tree: Invalid level, must be greater than 0."), e.exit(1);
        return;
      }
      a = d;
    }
    const u = r.length > 0 ? r : ["."];
    let h = !1;
    for (const d of u) {
      const c = b(e, d), i = e.vfs.nodeAt(c);
      if (i === null) {
        e.err(`tree: ${d}: No such file or directory`), h = !0;
        continue;
      }
      let l = 0, o = 0;
      const m = (N) => (s.has("-a") || !N.name.startsWith(".")) && (!s.has("-d") || N.kind === "dir"), f = (N, M, E) => {
        const k = N.children.filter(m).sort((w, A) => w.name.localeCompare(A.name));
        k.forEach((w, A) => {
          const $ = A === k.length - 1;
          e.out(M + ($ ? "└── " : "├── ") + w.name + (w.kind === "dir" ? "/" : "")), w.kind === "file" ? o++ : l++, w.kind === "dir" && E + 1 < a && f(w, M + ($ ? "    " : "│   "), E + 1);
        });
      };
      e.out(d), i.kind === "dir" && f(i, "", 1);
      const p = l === 1 ? "directory" : "directories", y = o === 1 ? "file" : "files";
      e.out(`${l} ${p}, ${o} ${y}`);
    }
    h && e.exit(1);
  }
}, pe = {
  name: "du",
  usage: g("du"),
  complete: (e) => ["-a", "-s", "-h", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "du", e.args, { flagLetters: "ash" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      for (const i of [
        g("du"),
        "",
        "Sums content BYTES (no disk blocks exist in the VFS).",
        "Without -s every subdirectory prints post-order, then the",
        "operand; -s prints totals only; -a also lists files; -h",
        "humanizes (K/M/G, powers of 1024)."
      ]) e.out(i);
      return;
    }
    const r = t.length > 0 ? t : ["."];
    let a = !1, u = "";
    const h = (i) => {
      const l = e.vfs.nodeAt(i);
      return l === null ? -1 : l.kind === "file" ? L(l.content) : l.children.reduce((o, m) => o + Math.max(0, h(e.vfs.resolve(i, m.name))), 0);
    }, d = (i, l) => {
      const o = h(i);
      if (o < 0) {
        e.err(`du: cannot access '${l}': No such file or directory`), a = !0;
        return;
      }
      e.out(`${s.has("-h") ? x(o) : String(o)}	${l}`);
    }, c = (i, l) => {
      const o = e.vfs.nodeAt(i);
      if (o === null) {
        d(i, l);
        return;
      }
      if (o.kind === "file") {
        (l === u || s.has("-a")) && d(i, l);
        return;
      }
      for (const m of o.children)
        c(e.vfs.resolve(i, m.name), l + (l.endsWith("/") ? "" : "/") + m.name);
      d(i, l);
    };
    for (const i of r) {
      const l = b(e, i);
      s.has("-s") ? d(l, i) : (u = i, c(l, i));
    }
    a && e.exit(1);
  }
}, ge = {
  name: "df",
  usage: g("df"),
  complete: (e) => ["-h", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "df", e.args, { flagLetters: "h" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      for (const i of [
        g("df"),
        "",
        "One line per mounted backend (or the backend covering each",
        "PATH): id, Used bytes, and '-' for Avail/Capacity — no backend",
        "exposes a quota, and guessing would be dishonest. 'memory'",
        "names the plain in-tree VFS when nothing is mounted."
      ]) e.out(i);
      return;
    }
    const r = /* @__PURE__ */ new Map();
    if (t.length > 0)
      for (const i of t) {
        const l = j(e, i);
        r.set(l.mountpoint, l);
      }
    else {
      for (const [i, l] of e.vfs.mounts)
        r.set(i, { id: l.id, mountpoint: i });
      r.size === 0 && r.set("/", { id: "memory", mountpoint: "/" });
    }
    const a = [...r.values()].map((i) => ({ ...i, used: J(e, i.mountpoint) })), u = (i) => s.has("-h") ? x(i) : String(i), h = (i, l) => i + " ".repeat(Math.max(1, l - i.length)), d = Math.max(10, ...a.map((i) => i.id.length)), c = Math.max(4, ...a.map((i) => u(i.used).length));
    e.out(h("Filesystem", d + 2) + h("Used", c + 2) + "Avail Capacity Mounted on");
    for (const i of a)
      e.out(h(i.id, d + 2) + h(u(i.used), c + 2) + h("-", 6) + h("-", 9) + i.mountpoint);
  }
}, ye = `PNG\r

`, Se = "", Ee = "PK";
function Ne(e) {
  const n = e.slice(0, 4096), s = n.toLowerCase();
  if (s.startsWith("<?xml")) return "XML document text";
  if (s.startsWith("<!doctype html") || s.startsWith("<html"))
    return s.includes("<sem-") ? "SemText HTML document text" : "HTML document text";
  const t = e.trim();
  if (t !== "" && (t.startsWith("{") || t.startsWith("[")))
    try {
      return JSON.parse(e), "JSON text data";
    } catch {
    }
  if (n.startsWith("#!"))
    return `${n.split(`
`, 1)[0].replace(/^#!\s*/, "").trim()} script text executable`;
  if (e.includes("\0")) return "data";
  const r = /^[\t\n\r\f\v\u0020-\u007e]*$/.test(e) ? "ASCII text" : "UTF-8 Unicode text";
  return e.includes(`
`) ? e.includes(`\r
`) ? `${r}, with CRLF line terminators` : r : `${r}, with no line terminators`;
}
function X(e, n) {
  if (n.startsWith(ye)) {
    const s = (n.charCodeAt(16) ?? 0) * 256 + (n.charCodeAt(17) ?? 0), t = (n.charCodeAt(20) ?? 0) * 256 + (n.charCodeAt(21) ?? 0);
    return `PNG image data, ${s} x ${t}`;
  }
  return n.startsWith(Se) ? "gzip compressed data" : n.startsWith(Ee) ? "Zip archive data" : n.length >= 262 && n.slice(257, 262) === "ustar" ? "POSIX tar archive" : e.endsWith(".sem.html") ? "SemText HTML document text" : Ne(n);
}
const ve = {
  name: "file",
  usage: g("file"),
  complete: (e) => ["-b", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "file", e.args, { flagLetters: "b" });
    if (n === null) return;
    const { flags: s, operands: t } = n;
    if (s.has("--help")) {
      e.out(g("file"));
      return;
    }
    if (t.length === 0) {
      e.err("file: missing operand"), I(e, "file"), e.exit(1);
      return;
    }
    for (const r of t) {
      let a;
      if (r === "-")
        a = X("-", e.stdin ?? "");
      else {
        const u = ae(e, r);
        if (u === null) {
          e.err(`${r}: No such file or directory`);
          continue;
        }
        if (u.kind === "dir") {
          e.err(`${r}: Is a directory`);
          continue;
        }
        a = X(r, u.content);
      }
      e.out(s.has("-b") ? a : `${r}: ${a}`);
    }
    e.exit(0);
  }
}, be = {
  name: "realpath",
  usage: g("realpath"),
  run(e) {
    const n = e.args.filter((t) => t !== "--help");
    if (e.args.includes("--help")) {
      e.out(g("realpath"));
      return;
    }
    if (n.length === 0) {
      e.err("realpath: missing operand"), e.exit(1);
      return;
    }
    let s = !1;
    for (const t of n) {
      const r = b(e, t);
      if (e.vfs.nodeAt(r) === null) {
        e.err(`realpath: ${t}: No such file or directory`), s = !0;
        continue;
      }
      e.out(r);
    }
    s && e.exit(1);
  }
}, we = {
  name: "basename",
  usage: g("basename"),
  run(e) {
    const n = v(e, "basename", e.args, { flagLetters: "a", valueLetters: "s" });
    if (n === null) return;
    const { flags: s, values: t, operands: r } = n;
    if (s.has("--help")) {
      e.out(g("basename"));
      return;
    }
    const a = s.has("-a") || t.has("-s") ? r : r.slice(0, 1), u = t.get("-s") ?? (s.has("-a") ? void 0 : r[1]);
    if (a.length === 0) {
      e.err("basename: missing operand"), I(e, "basename"), e.exit(1);
      return;
    }
    if (!s.has("-a") && !t.has("-s") && r.length > 2) {
      e.err(`basename: extra operand '${r[2]}'`), e.exit(1);
      return;
    }
    for (const h of a) {
      let d = h.replace(/\/+$/, "");
      d === "" && (d = "/");
      const c = d.lastIndexOf("/");
      d = c === -1 ? d : d.slice(c + 1), d === "" && (d = "/"), u !== void 0 && u !== "" && d !== u && d.endsWith(u) && (d = d.slice(0, -u.length)), e.out(d);
    }
  }
}, Me = {
  name: "dirname",
  usage: g("dirname"),
  run(e) {
    const n = e.args.filter((s) => s !== "--help");
    if (e.args.includes("--help")) {
      e.out(g("dirname"));
      return;
    }
    if (n.length === 0) {
      e.err("dirname: missing operand"), I(e, "dirname"), e.exit(1);
      return;
    }
    for (const s of n) {
      let t = s.replace(/\/+$/, "");
      t === "" && (t = "/");
      const r = t.lastIndexOf("/");
      if (r === -1) {
        e.out(".");
        continue;
      }
      let a = t.slice(0, r + 1).replace(/\/+$/, "");
      a === "" && (a = "/"), e.out(a);
    }
  }
}, Y = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", Ae = {
  name: "mktemp",
  usage: g("mktemp"),
  complete: (e) => ["-d", "-p", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "mktemp", e.args, { flagLetters: "d", valueLetters: "p" });
    if (n === null) return;
    const { flags: s, values: t, operands: r } = n;
    if (s.has("--help")) {
      e.out(g("mktemp"));
      return;
    }
    if (r.length > 1) {
      e.err("mktemp: too many templates"), I(e, "mktemp"), e.exit(1);
      return;
    }
    let a = r[0] ?? "tmp.XXXXXXXXXX";
    const u = [...a.matchAll(/X{6,}/g)], h = u[u.length - 1];
    if (h === void 0) {
      e.err(`mktemp: too few X's in template '${a}'`), e.exit(1);
      return;
    }
    const d = r[0] === void 0 && t.get("-p") === void 0;
    a.includes("/") || (a = `${(t.get("-p") ?? "/tmp").replace(/\/+$/, "")}/${a}`, d && e.vfs.nodeAt("/tmp") === null && e.vfs.mkdir("/tmp"));
    const c = s.has("-d");
    for (let i = 0; i < 100; i++) {
      const l = a.replace(h[0], () => {
        let f = "";
        for (let p = 0; p < h[0].length; p++)
          f += Y[Math.floor(Math.random() * Y.length)];
        return f;
      }), o = b(e, l);
      if (e.vfs.nodeAt(o) !== null) continue;
      if (e.vfs.nodeAt(e.vfs.resolve(o, ".."))?.kind !== "dir") {
        e.err(`mktemp: Failed to create file via template '${a}': No such file or directory`), e.exit(1);
        return;
      }
      c ? e.vfs.mkdir(o) : e.vfs.touch(o), e.out(o);
      return;
    }
    e.err(`mktemp: Failed to create file via template '${a}': Too many links`), e.exit(1);
  }
}, Te = {
  name: "type",
  usage: g("type"),
  complete: (e) => ["-a", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "type", e.args, { flagLetters: "a" });
    if (n === null) return;
    const { operands: s } = n;
    if (Ie(s, n.flags)) {
      for (const r of [
        g("type"),
        "",
        "Prints what the shell would run for each NAME: an alias",
        "('NAME is aliased to `expansion`') and/or a registered",
        'command ("NAME is a shell command (usage)"). -a lists every',
        "resolution; unknown names exit 1."
      ]) e.out(r);
      return;
    }
    if (s.length === 0) {
      e.err("type: missing operand"), e.exit(1);
      return;
    }
    let t = !1;
    for (const r of s) {
      const a = e.state.aliases[r], u = e.commands.get(r);
      a !== void 0 && e.out(`${r} is aliased to \`${a}\``), u !== void 0 && e.out(`${r} is a shell command (${u.usage})`), a === void 0 && u === void 0 && (e.err(`type: ${r}: not found`), t = !0);
    }
    t && e.exit(1);
  }
}, Ie = (e, n) => n.has("--help") && e.length === 0, C = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], ke = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], P = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], U = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function Z(e, n) {
  const s = n ? [e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), e.getUTCHours(), e.getUTCMinutes(), e.getUTCSeconds(), e.getUTCDay()] : [e.getFullYear(), e.getMonth(), e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds(), e.getDay()];
  return { y: s[0], m: s[1], d: s[2], h: s[3], min: s[4], s: s[5], w: s[6] };
}
const S = (e) => String(e).padStart(2, "0");
function _(e) {
  if (e) return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Local";
  } catch {
    return "Local";
  }
}
function $e(e, n, s) {
  const t = Z(e, n), r = n ? Date.UTC(t.y, 0, 1) : new Date(t.y, 0, 1).getTime(), a = Math.floor((e.getTime() - r) / 864e5) + 1, u = n ? 0 : -e.getTimezoneOffset(), h = u < 0 ? "-" : "+", d = Math.abs(u), c = t.h % 12 === 0 ? 12 : t.h % 12, i = {
    Y: String(t.y),
    C: S(Math.floor(t.y / 100)),
    y: S(t.y % 100),
    m: S(t.m + 1),
    d: S(t.d),
    e: String(t.d).padStart(2, " "),
    H: S(t.h),
    I: S(c),
    M: S(t.min),
    S: S(t.s),
    p: t.h < 12 ? "AM" : "PM",
    P: t.h < 12 ? "am" : "pm",
    a: C[t.w],
    A: ke[t.w],
    b: P[t.m],
    h: P[t.m],
    B: U[t.m],
    j: String(a).padStart(3, "0"),
    u: String(t.w === 0 ? 7 : t.w),
    w: String(t.w),
    Z: _(n),
    z: `${h}${S(Math.floor(d / 60))}${S(d % 60)}`,
    s: String(Math.floor(e.getTime() / 1e3)),
    n: `
`,
    t: "	",
    "%": "%",
    F: `${t.y}-${S(t.m + 1)}-${S(t.d)}`,
    T: `${S(t.h)}:${S(t.min)}:${S(t.s)}`,
    D: `${S(t.m + 1)}/${S(t.d)}/${S(t.y % 100)}`,
    R: `${S(t.h)}:${S(t.min)}`,
    c: `${C[t.w]} ${P[t.m]} ${S(t.d)} ${S(t.h)}:${S(t.min)}:${S(t.s)} ${t.y}`,
    x: `${S(t.m + 1)}/${S(t.d)}/${S(t.y % 100)}`,
    X: `${S(t.h)}:${S(t.min)}:${S(t.s)}`
  };
  let l = "";
  for (let o = 0; o < s.length; o++) {
    if (s[o] !== "%") {
      l += s[o];
      continue;
    }
    const m = s[o + 1];
    if (m === void 0) {
      l += "%";
      break;
    }
    l += i[m] ?? `%${m}`, o++;
  }
  return l;
}
function Oe(e, n) {
  if (e === "now") return /* @__PURE__ */ new Date();
  const s = /^@(-?\d+)$/.exec(e);
  if (s !== null) return new Date(Number(s[1]) * 1e3);
  const t = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?Z?$/.exec(e);
  if (t !== null) {
    const a = Number(t[1]), u = Number(t[2]) - 1, h = Number(t[3]);
    if (t[4] === void 0) return new Date(Date.UTC(a, u, h));
    const d = Number(t[4]), c = Number(t[5]), i = Number(t[6] ?? 0);
    return n ? new Date(Date.UTC(a, u, h, d, c, i)) : new Date(a, u, h, d, c, i);
  }
  const r = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(e);
  return r !== null ? new Date(Date.UTC(Number(r[1]), Number(r[2]) - 1, Number(r[3]))) : null;
}
const Pe = {
  name: "date",
  usage: g("date"),
  complete: (e) => ["-u", "-d", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "date", e.args, { flagLetters: "u", valueLetters: "d" });
    if (n === null) return;
    const { flags: s, values: t, operands: r } = n;
    if (r.length === 0 && s.has("--help")) {
      e.out(g("date"));
      return;
    }
    const a = s.has("-u");
    let u = /* @__PURE__ */ new Date();
    if (t.has("-d")) {
      const c = t.get("-d"), i = Oe(c, a);
      if (i === null || Number.isNaN(i.getTime())) {
        e.err(`date: invalid date '${c}'`), e.exit(1);
        return;
      }
      u = i;
    }
    const h = r.find((c) => c.startsWith("+"));
    if (h !== void 0) {
      e.out($e(u, a, h.slice(1)));
      return;
    }
    const d = Z(u, a);
    e.out(`${C[d.w]} ${P[d.m]} ${S(d.d)} ${S(d.h)}:${S(d.min)}:${S(d.s)} ${_(a)} ${d.y}`);
  }
};
function R(e, n) {
  const s = `${U[n]} ${e}`, t = [" ".repeat(Math.max(0, Math.floor((20 - s.length) / 2))) + s, "Su Mo Tu We Th Fr Sa"], r = new Date(e, n, 1).getDay(), a = new Date(e, n + 1, 0).getDate();
  let u = "   ".repeat(r);
  for (let h = 1; h <= a; h++)
    u += String(h).padStart(2, " ") + (h === a || (r + h) % 7 === 0 ? "" : " "), (r + h) % 7 === 0 && h !== a && (t.push(u.replace(/\s+$/, "")), u = "");
  return u !== "" && t.push(u.replace(/\s+$/, "")), t;
}
function Re(e) {
  const n = [String(e).padStart(31)];
  for (let s = 0; s < 4; s++) {
    const t = [0, 1, 2].map((a) => R(e, s * 3 + a)), r = Math.max(...t.map((a) => a.length));
    n.push(t.map((a) => (a[0] ?? "").padEnd(20)).join("  ").replace(/\s+$/, "")), n.push(t.map((a) => (a[1] ?? "").padEnd(20)).join("  ").replace(/\s+$/, ""));
    for (let a = 2; a < r; a++)
      n.push(t.map((u) => (u[a] ?? "").padEnd(20)).join("  ").replace(/\s+$/, ""));
  }
  return n;
}
function W(e) {
  if (/^\d{1,2}$/.test(e)) {
    const t = Number(e);
    return t >= 1 && t <= 12 ? t - 1 : null;
  }
  const n = e.toLowerCase();
  if (n.length >= 3) {
    const t = U.findIndex((r) => r.toLowerCase().startsWith(n));
    if (t !== -1) return t;
  }
  const s = P.findIndex((t) => t.toLowerCase() === n);
  return s !== -1 ? s : null;
}
const De = {
  name: "cal",
  usage: g("cal"),
  run(e) {
    const n = e.args.filter((a) => a !== "--help");
    if (e.args.includes("--help")) {
      e.out(g("cal"));
      return;
    }
    const s = /* @__PURE__ */ new Date();
    if (n.length === 0) {
      for (const a of R(s.getFullYear(), s.getMonth())) e.out(a);
      return;
    }
    if (n.length === 1) {
      const a = n[0];
      if (/^\d{3,}$/.test(a) && Number(a) >= 1e3) {
        for (const h of Re(Number(a))) e.out(h);
        return;
      }
      const u = W(a);
      if (u === null) {
        e.err(`cal: invalid month: '${a}'`), e.exit(1);
        return;
      }
      for (const h of R(s.getFullYear(), u)) e.out(h);
      return;
    }
    const t = W(n[0]);
    if (t === null) {
      e.err(`cal: invalid month: '${n[0]}'`), e.exit(1);
      return;
    }
    const r = Number(n[1]);
    if (!Number.isInteger(r) || r < 1 || r > 9999) {
      e.err(`cal: invalid year: '${n[1]}'`), e.exit(1);
      return;
    }
    for (const a of R(r, t)) e.out(a);
  }
}, Le = {
  name: "sleep",
  usage: g("sleep"),
  run(e) {
    const n = e.args.filter((s) => s !== "--help");
    if (e.args.includes("--help")) {
      for (const s of [
        g("sleep"),
        "",
        "Accepts the GNU spellings (decimals, s/m/h/d suffixes) and",
        "then RETURNS AT ONCE: the shell executes commands",
        "synchronously (CORE-V2), so blocking would freeze the tab."
      ]) e.out(s);
      return;
    }
    if (n.length === 0) {
      e.err("sleep: missing operand"), I(e, "sleep"), e.exit(1);
      return;
    }
    for (const s of n)
      if (!/^\d+(?:\.\d+)?[smhd]?$/.test(s)) {
        e.err(`sleep: invalid time interval '${s}'`), e.exit(1);
        return;
      }
  }
}, F = 1e5;
function D(e) {
  return Number.isInteger(e) ? String(e) : String(Number(e.toPrecision(12)));
}
function z(e, n) {
  const s = /^%[+-]?(?:(\d+)(?:\.(\d+))?)?[gfe]$/.exec(e);
  if (s === null) return null;
  const t = Number(s[1] ?? 0), r = Number(s[2] ?? 6), a = e.charAt(e.length - 1), u = a === "f" ? n.toFixed(r) : a === "e" ? n.toExponential(r) : D(n);
  return t > u.length ? u.padStart(t, " ") : u;
}
const Ce = {
  name: "seq",
  usage: g("seq"),
  complete: (e) => ["-w", "-f", "-s", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = v(e, "seq", e.args, { flagLetters: "w", valueLetters: "fs" });
    if (n === null) return;
    const { flags: s, values: t, operands: r } = n;
    if (r.length === 0 && s.has("--help")) {
      e.out(g("seq"));
      return;
    }
    if (r.length === 0 || r.length > 3) {
      e.err(r.length === 0 ? "seq: missing operand" : `seq: extra operand '${r[3]}'`), e.exit(1);
      return;
    }
    const a = r.map((E) => {
      const k = Number(E);
      return E === "" || Number.isNaN(k) ? (e.err(`seq: invalid floating point argument '${E}'`), e.exit(1), null) : k;
    });
    if (a.some((E) => E === null)) return;
    const [u, h, d] = a.length === 1 ? [1, 1, a[0]] : a.length === 2 ? [a[0], 1, a[1]] : [a[0], a[1], a[2]];
    if (h === 0) {
      e.err("seq: invalid Zero increment value: '0'"), e.exit(1);
      return;
    }
    const c = t.get("-f");
    if (c !== void 0 && z(c, u) === null) {
      e.err(`seq: invalid format '${c}'`), e.exit(1);
      return;
    }
    const i = Math.max(D(u).length, D(d).length), l = (E) => {
      if (c !== void 0) return z(c, E);
      const k = D(E), [w, A] = k.split("."), $ = w.startsWith("-"), Q = $ ? w.slice(1) : w, ee = Math.max(
        1,
        i - ($ ? 1 : 0) - (A !== void 0 ? A.length + 1 : 0)
      );
      return ($ ? "-" : "") + Q.padStart(ee, "0") + (A !== void 0 ? "." + A : "");
    }, o = t.get("-s") ?? `
`, m = o === `
`;
    let f = "";
    const p = (E) => {
      m ? e.out(l(E)) : f = f === "" ? l(E) : f + o + l(E);
    };
    let y = 0;
    const N = d + Number.EPSILON * Math.abs(d), M = d - Number.EPSILON * Math.abs(d);
    if (h > 0)
      for (let E = u; E <= N; E += h) {
        if (++y > F) return G(e);
        p(E);
      }
    else
      for (let E = u; E >= M; E += h) {
        if (++y > F) return G(e);
        p(E);
      }
    !m && f !== "" && e.out(f);
  }
};
function G(e) {
  e.err(`seq: output limit reached (${F} lines); the sync shell would wedge on more`), e.exit(1);
}
const q = 1e3, Fe = {
  name: "yes",
  usage: g("yes"),
  run(e) {
    if (e.args.includes("--help")) {
      for (const t of [
        g("yes"),
        "",
        "Prints STRING (default y) repeatedly — capped at 1000 lines:",
        "stages run synchronously on buffered strings, so a true",
        "infinite stream would hang the browser."
      ]) e.out(t);
      return;
    }
    const n = e.args.filter((t) => t !== "--help"), s = n.length > 0 ? n.join(" ") : "y";
    for (let t = 0; t < q; t++) e.out(s);
    e.err(`yes: emission budget reached (${q} lines) — the sync shell cannot stream forever`), e.exit(0);
  }
}, T = (e) => /^[+-]?\d+$/.test(e.trim());
function Ue(e) {
  const n = /[.*+?^${}()|[\]\\]/, s = e.replace(/\x00/g, "\\x00").replace(/\x01/g, "\\x01");
  let t = "";
  for (let r = 0; r < s.length; r++) {
    const a = s[r];
    if (a === "\\" && r + 1 < s.length) {
      const u = s[++r];
      u === "(" ? t += "\0" : u === ")" ? t += "" : u === "\\" ? t += "\\\\" : t += n.test(u) ? "\\" + u : u;
    } else a === "(" ? t += "\\(" : a === ")" ? t += "\\)" : t += a;
  }
  try {
    return new RegExp("^" + t.replace(/\x00/g, "(").replace(/\x01/g, ")"));
  } catch {
    return null;
  }
}
function V(e, n) {
  const s = Ue(n);
  if (s === null) throw new Error("Invalid regular expression");
  const t = s.exec(e);
  return t === null ? "0" : t[1] !== void 0 ? t[1] : String(t[0].length);
}
function Xe(e) {
  let n = 0;
  const s = () => e[n], t = () => e[n++] ?? "", r = () => {
    let o = a();
    for (; s() === "|"; ) {
      t();
      const m = a();
      o = o !== "" && o !== "0" ? o : m;
    }
    return o;
  }, a = () => {
    let o = u();
    for (; s() === "&"; ) {
      t();
      const m = u();
      o = o !== "" && o !== "0" && m !== "" && m !== "0" ? o : "0";
    }
    return o;
  }, u = () => {
    let o = h();
    for (; ["=", "==", "!=", "<", "<=", ">", ">="].includes(s() ?? ""); ) {
      const m = t(), f = h(), p = T(o) && T(f), y = p ? Number(o.trim()) : o, N = p ? Number(f.trim()) : f;
      o = (m === "=" || m === "==" ? y === N : m === "!=" ? y !== N : m === "<" ? y < N : m === "<=" ? y <= N : m === ">" ? y > N : y >= N) ? "1" : "0";
    }
    return o;
  }, h = () => {
    let o = d();
    for (; s() === "+" || s() === "-"; ) {
      const m = t(), f = d();
      if (!T(o) || !T(f)) throw new Error("non-integer argument");
      const p = Number(o.trim()), y = Number(f.trim());
      o = String(m === "+" ? p + y : p - y);
    }
    return o;
  }, d = () => {
    let o = c();
    for (; s() === "*" || s() === "/" || s() === "%"; ) {
      const m = t(), f = c();
      if (!T(o) || !T(f)) throw new Error("non-integer argument");
      const p = Number(o.trim()), y = Number(f.trim());
      if ((m === "/" || m === "%") && y === 0) throw new Error("division by zero");
      o = String(m === "*" ? p * y : m === "/" ? Math.trunc(p / y) : p - Math.trunc(p / y) * y);
    }
    return o;
  }, c = () => {
    let o = i();
    for (; s() === ":" || s() === "match"; ) {
      t();
      const m = i();
      o = V(o, m);
    }
    return o;
  }, i = () => {
    const o = t();
    if (o === "") throw new Error("syntax error");
    if (o === "(") {
      const m = r();
      if (t() !== ")") throw new Error("syntax error");
      return m;
    }
    if (o === "length") return String([...i()].length);
    if (o === "match") {
      const m = i(), f = i();
      return V(m, f);
    }
    if (o === "substr") {
      const m = i(), f = i(), p = i();
      if (!T(f) || !T(p)) throw new Error("non-integer argument");
      const y = [...m], N = Number(f.trim()), M = Number(p.trim()), E = Math.max(0, N - 1);
      return y.slice(E, E + Math.max(0, M)).join("");
    }
    if (o === "index") {
      const m = i(), f = i(), p = [...m].findIndex((y) => [...f].includes(y));
      return String(p + 1);
    }
    if (["|", "&", ")", ":"].includes(o)) throw new Error("syntax error");
    return o;
  }, l = r();
  if (n < e.length) throw new Error("syntax error");
  return l;
}
const Ye = {
  name: "expr",
  usage: g("expr"),
  run(e) {
    if (e.args.includes("--help")) {
      for (const t of [
        g("expr"),
        "",
        "Integer arithmetic (+ - * / %), comparisons, | & with GNU",
        "precedence and ( ) grouping; string ops length, substr,",
        "index, match and TOKEN : REGEX (BRE, anchored). Exit 0 when",
        "the value is non-null and non-zero, 1 otherwise, 2 on errors."
      ]) e.out(t);
      return;
    }
    const n = e.args;
    if (n.length === 0) {
      e.err("expr: syntax error"), e.exit(2);
      return;
    }
    let s;
    try {
      s = Xe(n);
    } catch (t) {
      const r = t instanceof Error ? t.message : String(t);
      e.err(r === "non-integer argument" ? "expr: non-integer argument" : r === "division by zero" ? "expr: division by zero" : r === "Invalid regular expression" ? "expr: Invalid regular expression" : "expr: syntax error"), e.exit(2);
      return;
    }
    e.out(s), e.exit(s !== "" && s !== "0" ? 0 : 1);
  }
};
function We(e, n, s) {
  const t = e.vfs.nodeAt(b(e, s));
  switch (n) {
    case "-e":
      return t !== null;
    case "-f":
      return t?.kind === "file";
    case "-d":
      return t?.kind === "dir";
    case "-s":
      return t?.kind === "file" && L(t.content) > 0;
    case "-r":
      return t !== null;
    case "-w": {
      if (t === null) return !1;
      const r = e.vfs.backendFor(b(e, s));
      return r === null || r.writable;
    }
    case "-x":
      return t?.kind === "dir";
    // traversal only — no exec bits exist
    default:
      return !1;
  }
}
function ze(e, n) {
  let s = 0;
  const t = () => n[s], r = () => {
    if (s >= n.length) throw new Error("argument expected");
    return n[s++];
  }, a = () => {
    let l = u();
    for (; t() === "-o"; )
      c(), l = u() || l;
    return l;
  }, u = () => {
    let l = h();
    for (; t() === "-a"; )
      c(), l = h() && l;
    return l;
  }, h = () => t() === "!" ? (c(), !h()) : d(), d = () => {
    const l = r();
    if (l === "(") {
      const m = a();
      if (s >= n.length || n[s++] !== ")") throw new Error("')' expected");
      return m;
    }
    const o = t();
    if (o !== void 0 && ["=", "!="].includes(o)) {
      c();
      const m = r();
      return o === "=" ? l === m : l !== m;
    }
    if (o !== void 0 && ["-eq", "-ne", "-lt", "-le", "-gt", "-ge"].includes(o)) {
      c();
      const m = r();
      if (!/^[+-]?\d+$/.test(l) || !/^[+-]?\d+$/.test(m)) throw new Error("integer expression expected");
      const f = Number(l), p = Number(m);
      return o === "-eq" ? f === p : o === "-ne" ? f !== p : o === "-lt" ? f < p : o === "-le" ? f <= p : o === "-gt" ? f > p : f >= p;
    }
    if (["-e", "-f", "-d", "-s", "-r", "-w", "-x"].includes(l))
      return We(e, l, r());
    if (["-z", "-n"].includes(l)) {
      const m = r();
      return l === "-z" ? m === "" : m !== "";
    }
    if (o !== void 0 && o.startsWith("-"))
      throw new Error(`${o}: unary operator expected`);
    return l !== "";
  }, c = () => n[s++] ?? "", i = a();
  if (s < n.length) throw new Error("too many arguments");
  return i;
}
const Ge = {
  name: "test",
  usage: g("test"),
  complete: (e) => ["-e", "-f", "-d", "-z", "-n", "--help"].filter((n) => n.startsWith(e.word)),
  run(e) {
    const n = e.args.filter((t) => t !== "--help");
    if (e.args.includes("--help") && n.length === 0) {
      for (const t of [
        g("test"),
        "",
        "File tests: -e -f -d -s, plus -r (exists), -w (backend",
        "writable) and -x (directories only). Strings: -z -n, = !=.",
        "Integers: -eq -ne -lt -le -gt -ge. Connectives: ! -a -o ( ).",
        "Exit 0 true / 1 false / 2 error. `[` cannot be registered."
      ]) e.out(t);
      return;
    }
    if (n.length === 0) {
      e.exit(1);
      return;
    }
    let s;
    try {
      s = ze(e, n);
    } catch (t) {
      const r = t instanceof Error ? t.message : String(t);
      e.err(`test: ${r}`), e.exit(2);
      return;
    }
    e.exit(s ? 0 : 1);
  }
}, qe = [
  ue,
  de,
  he,
  fe,
  ce,
  pe,
  ge,
  ve,
  be,
  we,
  Me,
  Ae,
  me,
  Te,
  Pe,
  De,
  Le,
  Ce,
  Fe,
  Ye,
  Ge
], Ve = {
  mv: [
    "MV(1)                     semtext-sh manual",
    "",
    "NAME",
    "     mv — move (rename) files",
    "",
    "SYNOPSIS",
    "     mv [-fnv] SOURCE... DEST",
    "",
    "DESCRIPTION",
    "     Renames SOURCE, or moves every SOURCE into an existing DEST",
    "     directory. -n skips existing destinations (no prompts exist,",
    "     so -f is a no-op); -v prints each move as 'src -> dst'.",
    "     Errors match GNU mv wording; exit 1 on any failure. A chmod",
    "     mode travels with the node."
  ],
  ln: [
    "LN(1)                     semtext-sh manual",
    "",
    "NAME",
    "     ln — create links (NOT SUPPORTED by this VFS)",
    "",
    "SYNOPSIS",
    "     ln [-sf] TARGET... LINK",
    "",
    "DESCRIPTION",
    "     The VFS node model is 'file | dir' only: there are no symlink",
    "     or inode hard links to create. ln validates its operands",
    "     (missing operands error GNU-style) and then reports",
    "     'Operation not supported' with exit 1. -s/-f pick the wording.",
    "     See readlink for the matching resolution command."
  ],
  chmod: [
    "CHMOD(1)                  semtext-sh manual",
    "",
    "NAME",
    "     chmod — change file mode bits (session-scoped)",
    "",
    "SYNOPSIS",
    "     chmod [-R] OCTAL-MODE FILE...",
    "",
    "DESCRIPTION",
    "     Records an octal mode (0644-style, 3-4 digits) per path in a",
    "     SESSION-SCOPED map: the VFS has no permission metadata, so",
    "     modes reset when the chunk reloads and never persist to a",
    "     backend. stat shows the recorded value; ls does not. -R",
    "     recurses. Symbolic modes ('u+x') are not implemented and",
    "     error honestly. Defaults: files 0644, directories 0755."
  ],
  stat: [
    "STAT(1)                   semtext-sh manual",
    "",
    "NAME",
    "     stat — display file status",
    "",
    "SYNOPSIS",
    "     stat FILE...",
    "",
    "DESCRIPTION",
    "     Per operand: the resolved path, Size in bytes (directories",
    "     report the conventional 4096), Kind, the access mode",
    "     (chmod-recorded or the 0644/0755 default, with an rwx",
    "     rendering) and the VFS backend that would persist it (memory",
    "     means the plain in-tree VFS). No timestamps exist: the VFS",
    "     stores none. Exit 1 if any operand is missing."
  ],
  tree: [
    "TREE(1)                   semtext-sh manual",
    "",
    "NAME",
    "     tree — list contents of directories in a tree-like format",
    "",
    "SYNOPSIS",
    "     tree [-ad] [-L LEVEL] [DIR...]",
    "",
    "DESCRIPTION",
    "     Recursively lists each DIR (default .) with box-drawing",
    "     branches and a summary line. Dot entries are hidden until -a;",
    "     -d lists directories only; -L LEVEL caps the depth (1 =",
    "     immediate children). Children sort with localeCompare;",
    "     directories print a trailing slash."
  ],
  du: [
    "DU(1)                     semtext-sh manual",
    "",
    "NAME",
    "     du — estimate file space usage",
    "",
    "SYNOPSIS",
    "     du [-ash] [FILE|DIR...]",
    "",
    "DESCRIPTION",
    "     Sums content bytes. Unlike GNU du there are no disk blocks:",
    "     plain numbers are BYTES (GNU defaults to 1K blocks — this man",
    "     page is the contract). Without -s every subdirectory of each",
    "     operand prints post-order, then the operand; -s prints only",
    "     each operand total; -a also lists files; -h humanizes (K/M/G,",
    "     powers of 1024)."
  ],
  df: [
    "DF(1)                     semtext-sh manual",
    "",
    "NAME",
    "     df — report mounted-backend usage",
    "",
    "SYNOPSIS",
    "     df [-h] [PATH...]",
    "",
    "DESCRIPTION",
    "     One line per mounted VFS backend (or the backend covering",
    "     each PATH): its id, Used bytes of the subtree under its",
    "     mountpoint, and '-' for Avail and Capacity — no backend",
    "     exposes a quota, and guessing would be dishonest. memory",
    "     names the plain in-tree VFS when nothing is mounted. -h",
    "     humanizes the Used column."
  ],
  file: [
    "FILE(1)                   semtext-sh manual",
    "",
    "NAME",
    "     file — determine file type by content",
    "",
    "SYNOPSIS",
    "     file [-b] [FILE...]        (- reads piped stdin)",
    "",
    "DESCRIPTION",
    "     Magic-sniffs each file: PNG (with dimensions), gzip, Zip,",
    "     POSIX tar (ustar), XML, HTML vs SemText HTML (<sem- elements",
    "     or a .sem.html name), JSON, shebang scripts, data (NUL",
    "     bytes), and ASCII/UTF-8 text (noting CRLF or a missing final",
    "     newline). Missing files and directories report on stderr",
    "     like GNU file and leave the exit status 0. -b omits the",
    "     filename prefix."
  ],
  realpath: [
    "REALPATH(1)               semtext-sh manual",
    "",
    "NAME",
    "     realpath — print the resolved absolute path",
    "",
    "SYNOPSIS",
    "     realpath FILE...",
    "",
    "DESCRIPTION",
    "     Normalizes each operand against the cwd (.., ., duplicate",
    "     slashes) and prints it. Every operand must exist — there are",
    "     no symlinks to resolve (the VFS has none), so pure string",
    "     normalization is the whole truth. Missing operands report",
    "     GNU-style and exit 1."
  ],
  basename: [
    "BASENAME(1)               semtext-sh manual",
    "",
    "NAME",
    "     basename — strip directory and suffix from a name",
    "",
    "SYNOPSIS",
    "     basename NAME [SUFFIX]",
    "     basename -a NAME...   /   basename -s SUFFIX NAME...",
    "",
    "DESCRIPTION",
    "     Prints the final path segment, trailing slashes removed",
    "     ('/' stays '/'). A SUFFIX operand (or -s) is stripped only",
    "     when the result stays non-empty. -a treats every operand as",
    "     a name. Extra operands without -a error, exit 1."
  ],
  dirname: [
    "DIRNAME(1)                semtext-sh manual",
    "",
    "NAME",
    "     dirname — strip the last segment from a name",
    "",
    "SYNOPSIS",
    "     dirname NAME...",
    "",
    "DESCRIPTION",
    "     Prints each name with its final segment and any trailing",
    "     slashes removed ('a/b/' -> 'a', 'x' -> '.', '/a' -> '/',",
    "     '/' -> '/'). Every operand is processed, like GNU dirname."
  ],
  mktemp: [
    "MKTEMP(1)                 semtext-sh manual",
    "",
    "NAME",
    "     mktemp — create a temporary file or directory",
    "",
    "SYNOPSIS",
    "     mktemp [-d] [-p DIR] [TEMPLATE]",
    "",
    "DESCRIPTION",
    "     Creates a uniquely named empty file (or directory with -d)",
    "     and prints its path. TEMPLATE needs a run of six or more X's",
    "     (default tmp.XXXXXXXXXX, created under /tmp when it names no",
    "     directory); the last X-run is replaced with random",
    "     [a-zA-Z0-9]. -p DIR supplies the base directory for bare",
    "     templates."
  ],
  readlink: [
    "READLINK(1)               semtext-sh manual",
    "",
    "NAME",
    "     readlink — resolve links (the VFS has none)",
    "",
    "SYNOPSIS",
    "     readlink [-f] FILE...",
    "",
    "DESCRIPTION",
    "     Without -f: every operand reports 'not a symbolic link' —",
    "     this VFS stores no symlink nodes, so nothing can ever be one.",
    "     With -f: prints the canonicalized absolute path (no symlink",
    "     step to resolve); every component but the last must exist,",
    "     else 'No such file or directory'."
  ],
  type: [
    "TYPE(1)                   semtext-sh manual",
    "",
    "NAME",
    "     type — how the shell resolves a command word",
    "",
    "SYNOPSIS",
    "     type [-a] NAME...",
    "",
    "DESCRIPTION",
    "     For each NAME prints what the shell would run: an alias",
    "     ('NAME is aliased to `expansion`') and/or a registered",
    '     command ("NAME is a shell command (usage)"). -a lists every',
    '     resolution. Unknown names report "type: NAME: not found" and',
    "     exit 1. See also which (posix plugin) for the terse form."
  ],
  date: [
    "DATE(1)                   semtext-sh manual",
    "",
    "NAME",
    "     date — print or format the system date and time",
    "",
    "SYNOPSIS",
    "     date [-u] [-d DATE] [+FORMAT]",
    "",
    "DESCRIPTION",
    "     Prints the current time (local, or UTC with -u) GNU-style,",
    "     or formats with +FORMAT (strftime subset: %Y %C %y %m %d %e",
    "     %H %I %M %S %p %P %a %A %b %B %h %j %u %w %Z %z %s %n %t %%",
    "     %F %T %D %R %c %x %X; unknown specs pass through). -d parses",
    "     'now', '@epoch', ISO 'YYYY-MM-DD[ HH:MM[:SS]]' and",
    "     'YYYY/MM/DD'. Date-only strings parse as UTC midnight;",
    "     date-times parse as UTC under -u, local time otherwise."
  ],
  cal: [
    "CAL(1)                    semtext-sh manual",
    "",
    "NAME",
    "     cal — print a calendar",
    "",
    "SYNOPSIS",
    "     cal [[MONTH] YEAR]   (also: cal YEAR — a full-year sheet)",
    "",
    "DESCRIPTION",
    "     Sunday-first month grid: the current month with no operands;",
    "     one numeric operand of 3+ digits (>= 1000) is a YEAR sheet,",
    "     otherwise a month of the current year; MONTH may be 1-12 or",
    "     a name ('October', 'oct', 3+ letters). Weeks start",
    "     'Su Mo Tu We Th Fr Sa'. The BSD today-highlight needs markup",
    "     this transcript does not have, so it is omitted."
  ],
  sleep: [
    "SLEEP(1)                  semtext-sh manual",
    "",
    "NAME",
    "     sleep — validate a duration (does not block)",
    "",
    "SYNOPSIS",
    "     sleep SECONDS[s|m|h|d]...",
    "",
    "DESCRIPTION",
    "     Accepts the GNU spellings (decimals, s/m/h/d suffixes,",
    "     several operands; errors match GNU) and then RETURNS AT ONCE:",
    "     the shell executes commands synchronously (CORE-V2), so",
    "     there is no yield point to sleep across — blocking would",
    "     freeze the browser tab. Scripts can rely on validation, not",
    "     on time passing."
  ],
  seq: [
    "SEQ(1)                    semtext-sh manual",
    "",
    "NAME",
    "     seq — print a sequence of numbers",
    "",
    "SYNOPSIS",
    "     seq [-w] [-f FMT] [-s SEP] [FIRST [INCR]] LAST",
    "",
    "DESCRIPTION",
    "     Floats supported; INCR may be negative (never 0). -s joins",
    "     with a custom separator (default newline); -w zero-pads the",
    "     integer part to the widest operand; -f takes a printf float",
    "     form (%[+-][width][.prec] f/g/e). GNU differs knowingly:",
    "     output is capped at 100000 lines ('output limit reached',",
    "     exit 1) because the sync shell would wedge materializing",
    "     more."
  ],
  yes: [
    "YES(1)                    semtext-sh manual",
    "",
    "NAME",
    "     yes — repeat a string (bounded emission)",
    "",
    "SYNOPSIS",
    "     yes [STRING]",
    "",
    "DESCRIPTION",
    "     Prints STRING (default y) repeatedly. KNOWING DEVIATION: the",
    "     emission is capped at 1000 lines with a one-line note — the",
    "     shell runs pipeline stages synchronously on buffered",
    "     strings, so a true infinite stream would hang the browser",
    "     and Ctrl+C could never interrupt it. `yes | head -n 3` still",
    "     demos right."
  ],
  expr: [
    "EXPR(1)                   semtext-sh manual",
    "",
    "NAME",
    "     expr — evaluate an expression",
    "",
    "SYNOPSIS",
    "     expr EXPRESSION",
    "",
    "DESCRIPTION",
    "     Integer arithmetic (+ - * / %), comparisons (= == != < <= >",
    "     >=), boolean | & with GNU precedence and ( ) grouping",
    "     (shell-escape * and parens). String ops: length, substr S L",
    "     (1-based), index, match TOKEN REGEX and TOKEN : REGEX —",
    "     BRE-anchored, \\( \\) groups capture. Exit 0 when the value",
    "     is non-null and non-zero, 1 otherwise, 2 on errors (syntax",
    "     error, non-integer argument, division by zero)."
  ],
  test: [
    "TEST(1)                   semtext-sh manual",
    "",
    "NAME",
    "     test — evaluate a conditional expression",
    "",
    "SYNOPSIS",
    "     test EXPRESSION",
    "",
    "DESCRIPTION",
    "     Exits 0 (true) / 1 (false) / 2 (error). File tests: -e -f -d",
    "     -s plus -r (exists), -w (backend writable) and -x",
    "     (directories only — no exec bits exist). Strings: -z -n,",
    "     = !=. Integers: -eq -ne -lt -le -gt -ge. Connectives: !, -a,",
    "     -o, ( ). The `[` spelling cannot be registered — the shell",
    "     command-name pattern ([a-z][a-z0-9-]*) rejects it — so test",
    "     is the only form."
  ]
}, He = { commands: qe, manPages: Ve };
export {
  qe as commands,
  qe as default,
  Ve as manPages,
  He as pkg
};
