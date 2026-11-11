const l = Object.freeze({
  SUCCESS: 0,
  E2BIG: 1,
  EACCES: 2,
  EAGAIN: 6,
  EBADF: 8,
  EFAULT: 21,
  EINVAL: 28,
  EIO: 29,
  EISDIR: 31,
  ELOOP: 33,
  EMFILE: 34,
  ENFILE: 41,
  ENOENT: 44,
  ENOMEM: 48,
  ENOSPC: 51,
  ENOSYS: 52,
  ENOTDIR: 54,
  ENOTSUP: 58,
  EPERM: 63,
  ESPIPE: 70,
  EROFS: 69,
  ENOTCAPABLE: 76
});
class S {
  constructor(t) {
    this.code = t;
  }
}
const d = {
  CHAR_DEVICE: 2,
  DIRECTORY: 3,
  REGULAR_FILE: 4
}, b = 0x0000000000000006n, O = b | 0x40n;
function R() {
  const r = BigInt(Date.now()) * 1000000n, t = typeof performance == "object" && performance !== null && typeof performance.now == "function" ? BigInt(Math.round(performance.now() * 1e6)) : r;
  return { realtime: r, monotonic: t };
}
function N(r) {
  const t = globalThis.crypto;
  if (t !== void 0 && typeof t.getRandomValues == "function") {
    t.getRandomValues(r);
    return;
  }
  for (let e = 0; e < r.length; e++) r[e] = Math.floor(Math.random() * 256);
}
function _(r) {
  const t = [];
  for (const e of r.split("/"))
    if (!(e === "" || e === ".")) {
      if (e === "..") {
        t.pop();
        continue;
      }
      t.push(e);
    }
  return "/" + t.join("/");
}
class B {
  #n;
  #c;
  #h;
  #t = /* @__PURE__ */ new Map();
  #o = 0;
  #i = null;
  constructor(t) {
    this.args = t.args ?? [], this.env = Object.entries(t.env ?? {}), this.#n = t.stdio, this.#c = t.stdin, this.#h = t.environment ?? { now: R, random: N }, this.#t.set(0, { kind: "stdin", filetype: d.CHAR_DEVICE }), this.#t.set(1, { kind: "stdout", filetype: d.CHAR_DEVICE }), this.#t.set(2, { kind: "stderr", filetype: d.CHAR_DEVICE });
    for (const e of t.preopens ?? [])
      this.#t.set(this.#r(), { kind: "preopen", filetype: d.DIRECTORY, preopen: e });
  }
  /** The import object for WebAssembly instantiation. */
  get imports() {
    return { wasi_snapshot_preview1: this.#T() };
  }
  /** Bind module memory (called by the engine after instantiation). */
  bind(t) {
    this.#i = t;
  }
  #e() {
    if (this.#i === null) throw new Error("wasi: memory not bound");
    return new DataView(this.#i.buffer);
  }
  #s() {
    if (this.#i === null) throw new Error("wasi: memory not bound");
    return new Uint8Array(this.#i.buffer);
  }
  #r() {
    for (; this.#t.has(this.#o); ) this.#o++;
    const t = this.#o;
    return this.#o++, t;
  }
  /* -- memory helpers --------------------------------------------------- */
  #a(t, e) {
    const n = this.#e(), s = [];
    for (let i = 0; i < e; i++) {
      const o = t + i * 8;
      s.push([n.getUint32(o, !0), n.getUint32(o + 4, !0)]);
    }
    return s;
  }
  #d(t, e = 4096) {
    const n = this.#s();
    let s = t;
    const i = Math.min(n.length, t + e);
    for (; s < i && n[s] !== 0; ) s++;
    return new TextDecoder().decode(n.subarray(t, s));
  }
  /* -- args / env -------------------------------------------------------- */
  #u(t, e) {
    let n = 0;
    for (const i of this.args) n += U(i).length + 1;
    const s = this.#e();
    return s.setUint32(t, this.args.length, !0), s.setUint32(e, n, !0), l.SUCCESS;
  }
  #f(t, e) {
    const n = this.#e(), s = this.#s();
    let i = e;
    for (let o = 0; o < this.args.length; o++) {
      const a = this.args[o];
      n.setUint32(t + o * 4, i, !0);
      const c = new TextEncoder().encode(a);
      s.set(c, i), s[i + c.length] = 0, i += c.length + 1;
    }
    return l.SUCCESS;
  }
  #p(t, e) {
    let n = 0;
    for (const [i, o] of this.env) n += U(`${i}=${o}`).length + 1;
    const s = this.#e();
    return s.setUint32(t, this.env.length, !0), s.setUint32(e, n, !0), l.SUCCESS;
  }
  #l(t, e) {
    const n = this.#e(), s = this.#s();
    let i = e;
    for (let o = 0; o < this.env.length; o++) {
      const a = `${this.env[o][0]}=${this.env[o][1]}`;
      n.setUint32(t + o * 4, i, !0);
      const c = new TextEncoder().encode(a);
      s.set(c, i), s[i + c.length] = 0, i += c.length + 1;
    }
    return l.SUCCESS;
  }
  /* -- stdio + fds -------------------------------------------------------- */
  #g(t, e, n, s) {
    const i = this.#t.get(t);
    if (i === void 0 || i.kind !== "stdout" && i.kind !== "stderr") return l.EBADF;
    let o = 0;
    const a = [];
    for (const [c, h] of this.#a(e, n))
      h !== 0 && (a.push(this.#s().slice(c, c + h)), o += h);
    return o > 0 && (i.kind === "stdout" ? this.#n.stdout : this.#n.stderr)(x(a, o)), this.#e().setUint32(s, o, !0), l.SUCCESS;
  }
  /**
   * Read into iovs. Sync paths return a plain errno; a stdin source that
   * returns a Promise yields a Promise (the JSPI engine's Suspending
   * wrapper suspends the guest until it settles — batch callers must pass
   * sync-only sources, per the WasiStdinSource contract).
   */
  #E(t, e, n, s) {
    const i = this.#t.get(t);
    if (i === void 0) return l.EBADF;
    const o = this.#a(e, n);
    if (o.length === 0)
      return this.#e().setUint32(s, 0, !0), l.SUCCESS;
    if (i.kind === "stdin") {
      const a = o.reduce((u, [, f]) => u + f, 0), c = this.#c.pull(Math.max(1, a));
      if (F(c))
        return c.then((u) => {
          const f = C(this.#s(), u, o);
          return this.#e().setUint32(s, f, !0), l.SUCCESS;
        });
      const h = C(this.#s(), c, o);
      return this.#e().setUint32(s, h, !0), l.SUCCESS;
    }
    if (i.kind === "file" && i.bytes !== void 0) {
      const a = i.bytes, c = i.pos ?? 0, h = W(this.#s(), a, c, o);
      return i.pos = c + h, this.#e().setUint32(s, h, !0), l.SUCCESS;
    }
    return l.EBADF;
  }
  #w(t) {
    return this.#t.get(t) === void 0 ? l.EBADF : (t <= 2 || this.#t.delete(t), l.SUCCESS);
  }
  #S(t, e, n, s) {
    const i = this.#t.get(t);
    if (i === void 0) return l.EBADF;
    if (i.kind !== "file") return l.ESPIPE;
    const o = i.bytes?.length ?? 0, a = n === 0 ? 0 : n === 1 ? i.pos ?? 0 : n === 2 ? o : NaN;
    if (!Number.isFinite(a)) return l.EINVAL;
    const c = Math.max(0, Math.min(o, a + e));
    return i.pos = c, this.#e().setBigUint64(s, BigInt(c), !0), l.SUCCESS;
  }
  #y(t, e) {
    const n = this.#t.get(t);
    if (n === void 0) return l.EBADF;
    const s = this.#e();
    return s.setUint8(e, n.filetype), s.setUint16(e + 2, 0, !0), s.setBigUint64(e + 8, n.kind === "stderr" || n.kind === "stdout" ? O : b, !0), s.setBigUint64(e + 16, 0n, !0), l.SUCCESS;
  }
  #_(t, e) {
    const n = this.#t.get(t);
    return n === void 0 ? l.EBADF : (this.#m(e, n.filetype, n.bytes?.length ?? 0), l.SUCCESS);
  }
  #m(t, e, n) {
    const s = this.#e();
    s.setBigUint64(t, 1n, !0), s.setBigUint64(t + 8, 0n, !0), s.setUint8(t + 16, e), s.setBigUint64(t + 24, 1n, !0), s.setBigUint64(t + 32, BigInt(n), !0), s.setBigUint64(t + 40, 0n, !0), s.setBigUint64(t + 48, 0n, !0), s.setBigUint64(t + 56, 0n, !0);
  }
  /* -- preopens + path_open ---------------------------------------------- */
  #U(t, e) {
    const n = this.#t.get(t);
    if (n === void 0) return l.EBADF;
    if (n.kind !== "preopen" || n.preopen === void 0) return l.EINVAL;
    const s = this.#e();
    return s.setUint8(e, 0), s.setUint32(e + 4, n.preopen.name.length, !0), l.SUCCESS;
  }
  #C(t, e, n) {
    const s = this.#t.get(t);
    if (s === void 0) return l.EBADF;
    if (s.kind !== "preopen" || s.preopen === void 0) return l.EINVAL;
    const i = s.preopen.name, o = Math.min(n, i.length);
    return this.#s().set(new TextEncoder().encode(i.slice(0, o)), e), l.SUCCESS;
  }
  #A(t, e, n, s, i, o, a, c) {
    const h = this.#t.get(t);
    if (h === void 0) return l.EBADF;
    if (h.kind !== "preopen" || h.preopen === void 0) return l.ENOTDIR;
    const u = new TextDecoder().decode(this.#s().subarray(n, n + s)), f = _(u);
    if ((i & 1) !== 0 || (i & 2) !== 0) return l.EROFS;
    const g = h.preopen.files.get(f);
    if (g === void 0) return l.ENOENT;
    const y = this.#r();
    return this.#t.set(y, { kind: "file", filetype: d.REGULAR_FILE, bytes: g, pos: 0 }), this.#e().setUint32(c, y, !0), l.SUCCESS;
  }
  #k(t, e, n, s, i) {
    const o = this.#t.get(t);
    if (o === void 0) return l.EBADF;
    if (o.kind !== "preopen" || o.preopen === void 0) return l.ENOTDIR;
    const a = new TextDecoder().decode(this.#s().subarray(n, n + s)), c = _(a);
    if (c === "/")
      return this.#m(i, d.DIRECTORY, 0), l.SUCCESS;
    const h = o.preopen.files.get(c);
    if (h === void 0) {
      for (const u of o.preopen.files.keys())
        if (u.startsWith(c + "/"))
          return this.#m(i, d.DIRECTORY, 0), l.SUCCESS;
      return l.ENOENT;
    }
    return this.#m(i, d.REGULAR_FILE, h.length), l.SUCCESS;
  }
  /* -- clock / random / misc ---------------------------------------------- */
  #b(t, e, n) {
    const { realtime: s, monotonic: i } = this.#h.now();
    return this.#e().setBigUint64(n, t === 1 ? i : s, !0), l.SUCCESS;
  }
  #v(t, e) {
    const n = this.#s().subarray(t, t + e);
    return this.#h.random(n), l.SUCCESS;
  }
  /* -- the import surface -------------------------------------------------- */
  #T() {
    const t = this;
    return {
      args_sizes_get: (e, n) => t.#u(e, n),
      args_get: (e, n) => t.#f(e, n),
      environ_sizes_get: (e, n) => t.#p(e, n),
      environ_get: (e, n) => t.#l(e, n),
      clock_time_get: (e, n, s) => t.#b(e, n, s),
      fd_write: (e, n, s, i) => t.#g(e, n, s, i),
      // async: resolves now for file/preopen reads, may await the stdin
      // source (JSPI suspends the guest for the duration).
      fd_read: (e, n, s, i) => t.#E(e, n, s, i),
      fd_close: (e) => t.#w(e),
      fd_seek: (e, n, s, i) => t.#S(e, n, s, i),
      fd_fdstat_get: (e, n) => t.#y(e, n),
      fd_filestat_get: (e, n) => t.#_(e, n),
      fd_prestat_get: (e, n) => t.#U(e, n),
      fd_prestat_dir_name: (e, n, s) => t.#C(e, n, s),
      path_open: (e, n, s, i, o, a, c, h) => t.#A(e, n, s, i, o, a, c, h),
      path_filestat_get: (e, n, s, i, o) => t.#k(e, n, s, i, o),
      random_get: (e, n) => t.#v(e, n),
      sched_yield: () => l.SUCCESS,
      // Everything else a wasi libc may probe at boot: answer, never wedge.
      fd_datasync: () => l.ENOTSUP,
      fd_sync: () => l.SUCCESS,
      fd_tell: () => l.ENOTSUP,
      fd_advise: () => l.SUCCESS,
      fd_allocate: () => l.ENOTSUP,
      fd_readdir: () => l.ENOTSUP,
      fd_renumber: () => l.ENOTSUP,
      fd_dup: () => l.ENOTSUP,
      poll_oneoff: () => l.ENOTSUP,
      proc_raise: () => l.ENOTSUP,
      path_create_directory: () => l.EROFS,
      path_remove_directory: () => l.EROFS,
      path_unlink_file: () => l.EROFS,
      path_rename: () => l.EROFS,
      path_link: () => l.EROFS,
      path_symlink: () => l.ENOTSUP,
      path_readlink: () => l.ENOENT,
      sock_send: () => l.ENOTSUP,
      sock_recv: () => l.ENOTSUP,
      sock_shutdown: () => l.ENOTSUP,
      proc_exit: (e) => {
        throw new S(e);
      }
    };
  }
}
function F(r) {
  return typeof r?.then == "function";
}
const $ = new TextEncoder();
function U(r) {
  return $.encode(r);
}
function x(r, t) {
  const e = new Uint8Array(t);
  let n = 0;
  for (const s of r)
    e.set(s, n), n += s.length;
  return e;
}
function C(r, t, e) {
  let n = 0;
  for (const [s, i] of e) {
    if (n >= t.length) break;
    const o = Math.min(i, t.length - n);
    r.set(t.subarray(n, n + o), s), n += o;
  }
  return n;
}
function W(r, t, e, n) {
  let s = e;
  for (const [i, o] of n) {
    if (s >= t.length) break;
    const a = Math.min(o, t.length - s);
    r.set(t.subarray(s, s + a), i), s += a;
  }
  return s - e;
}
function P() {
  const r = WebAssembly;
  return typeof r.Suspending == "function" && typeof r.promising == "function";
}
function L(r) {
  for (const t of WebAssembly.Module.imports(r))
    if (t.kind === "memory") return !0;
  return !1;
}
function G(r) {
  if (WebAssembly.Module.exports(r).find((n) => n.name === "_start" && n.kind === "function") === void 0)
    throw new Error("wasm: module exports no _start (not a WASI command module)");
}
function v(r, t, e) {
  const n = p(), s = new WebAssembly.Module(new Uint8Array(r));
  G(s);
  const i = p(), o = new B(t), a = o.imports;
  if (e) {
    const g = WebAssembly.Suspending;
    a.wasi_snapshot_preview1.fd_read = new g(a.wasi_snapshot_preview1.fd_read);
  }
  const c = { ...a };
  L(s) && (c.env = { ...c.env ?? {}, memory: new WebAssembly.Memory({ initial: 1 }) });
  const h = new WebAssembly.Instance(s, c), u = h.exports.memory;
  if (u === void 0) throw new Error("wasm: module has no linear memory");
  o.bind(u);
  const f = p();
  return {
    host: o,
    start: h.exports._start,
    timings: { compileMs: i - n, instantiateMs: f - i }
  };
}
function p() {
  return typeof performance == "object" && performance !== null && typeof performance.now == "function" ? performance.now() : Date.now();
}
function T(r, t) {
  const { start: e, timings: n } = v(r, t, !1), s = p();
  let i = 0, o = null;
  try {
    e();
  } catch (a) {
    typeof process < "u" && process.env.WASM_DEBUG && console.error("WASM-DEBUG batch crash:", a), a instanceof S ? i = a.code : o = a instanceof Error ? a.message : String(a);
  }
  return { code: i, crash: o, ...n, runMs: p() - s };
}
async function V(r, t) {
  const { start: e, timings: n } = v(r, t, !0), s = WebAssembly.promising(
    e
  ), i = p();
  let o = 0, a = null;
  try {
    await s();
  } catch (c) {
    typeof process < "u" && process.env.WASM_DEBUG && console.error("WASM-DEBUG interactive crash:", c), c instanceof S ? o = c.code : a = c instanceof Error ? c.message : String(c);
  }
  return { code: o, crash: a, ...n, runMs: p() - i };
}
class z {
  #n = [];
  #c = [];
  #h = !1;
  #t = !1;
  pull() {
    return this.#n.length > 0 ? this.#n.shift() : this.#h || this.#t ? new Uint8Array(0) : new Promise((t, e) => {
      this.#c.push((n) => {
        this.#t ? e(new Error("wasm: killed")) : t(n);
      });
    });
  }
  write(t) {
    this.#t || t.length === 0 || (this.#n.push(t), this.#o());
  }
  eof() {
    this.#h = !0;
    for (const t of this.#c.splice(0)) t(new Uint8Array(0));
  }
  kill() {
    this.#t = !0, this.#n = [];
    for (const t of this.#c.splice(0)) t(new Uint8Array(0));
  }
  #o() {
    for (; this.#n.length > 0 && this.#c.length > 0; )
      this.#c.shift()(this.#n.shift());
  }
}
function w(r, t, e) {
  const n = new z(), s = P();
  s || e.status("batch (no JSPI: stdin closes at start)");
  const i = (a) => e.done(a), o = {
    args: t.args,
    env: t.env,
    preopens: t.preopens,
    stdio: {
      stdout: e.stdout,
      stderr: e.stderr
    },
    stdin: { pull: () => n.pull() }
  };
  return s ? V(r, o).then(i, (a) => {
    typeof process < "u" && process.env.WASM_DEBUG && console.error("WASM-DEBUG runner rejection:", a), i({ code: 1, crash: a instanceof Error ? a.message : String(a), compileMs: 0, instantiateMs: 0, runMs: 0 });
  }) : (n.eof(), i(T(r, o))), { write: (a) => n.write(a), eof: () => n.eof(), kill: () => n.kill() };
}
function H(r, t, e) {
  if (typeof Worker > "u") return w(r, t, e);
  let n;
  try {
    n = new Worker(new URL(
      /* @vite-ignore */
      "" + new URL("worker-wasm.js", import.meta.url).href,
      import.meta.url
    ), { type: "module" });
  } catch {
    return w(r, t, e);
  }
  e.status("worker");
  let s = null, i = !1;
  const o = (a) => {
    i || s !== null || (e.status(`worker unavailable (${a}) — in-thread`), s = w(r, t, {
      ...e,
      done: (c) => {
        i = !0, e.done(c);
      }
    }));
  };
  return n.addEventListener("message", (a) => {
    const c = a.data;
    c.type === "stdout" ? e.stdout(c.bytes) : c.type === "stderr" ? e.stderr(c.bytes) : c.type === "status" ? e.status(c.text) : (i = !0, e.done(c.result));
  }), n.addEventListener("error", (a) => {
    o(a.message || "error");
  }), n.postMessage({ type: "run", bytes: r, args: t.args, env: t.env, preopens: t.preopens }), {
    write: (a) => {
      s !== null ? s.write(a) : n.postMessage({ type: "stdin", bytes: a });
    },
    eof: () => {
      s !== null ? s.eof() : n.postMessage({ type: "stdin-eof" });
    },
    kill: () => {
      s !== null ? s.kill() : n.terminate();
    }
  };
}
const I = "\x1B[36m", E = "\x1B[2m", m = "\x1B[0m", j = I + "›" + m + " ";
class Y {
  constructor(t, e, n, s) {
    this.id = "wasm", this.#o = null, this.#i = null, this.#e = [], this.#s = "", this.#r = "", this.#a = null, this.#d = null, this.#u = "starting", this.#n = t, this.#c = e, this.#h = n, this.#t = s;
  }
  #n;
  #c;
  #h;
  #t;
  #o;
  #i;
  #e;
  #s;
  #r;
  #a;
  #d;
  #u;
  start(t) {
    this.#o = t, t.setTitle(`wasm ${this.#n}`), t.setStatus(`wasm: ${this.#n} — running`, "busy"), this.#l(), this.#i = H(
      this.#c,
      { args: this.#h, preopens: this.#t },
      {
        stdout: (e) => this.#p(new TextDecoder().decode(e), !1),
        stderr: (e) => this.#p(new TextDecoder().decode(e), !0),
        status: (e) => {
          this.#u = e, this.#l();
        },
        done: (e) => {
          this.#a = e.code, this.#d = e.crash, t.setStatus(
            e.crash === null ? `wasm: ${this.#n} — exit ${e.code}` : `wasm: ${this.#n} — crashed`,
            e.crash === null && e.code === 0 ? "idle" : "alert"
          ), this.#l();
        }
      }
    ), this.#l();
  }
  key(t) {
    if (t.ctrl && t.key === "c") {
      this.#i?.kill(), this.#o?.exit(130);
      return;
    }
    if (this.#a !== null) {
      (t.key === "Enter" || t.ctrl && t.key === "d") && this.#o?.exit(this.#a ?? 0);
      return;
    }
    if (t.ctrl && t.key === "d") {
      const e = this.#r;
      this.#r = "", e.length > 0 && this.#f(e + `
`), this.#i?.eof(), this.#l();
      return;
    }
    if (!(t.alt || t.meta || t.ctrl)) {
      if (t.key === "Enter") {
        this.#f(this.#r + `
`), this.#r = "", this.#l();
        return;
      }
      if (t.key === "Backspace") {
        this.#r = this.#r.slice(0, -1), this.#l();
        return;
      }
      t.key.length === 1 && (this.#r += t.key, this.#l());
    }
  }
  resize(t, e) {
    this.#l();
  }
  stop() {
    this.#i?.kill(), this.#i = null;
  }
  a11ySummary() {
    return this.#a !== null ? `wasm ${this.#n}: finished, exit ${this.#a}${this.#d === null ? "" : `, ${this.#d}`}` : `wasm ${this.#n}: ${this.#e.length} output lines, input line ready (${this.#u})`;
  }
  /* -- internals ---------------------------------------------------------- */
  #f(t) {
    this.#i?.write(new TextEncoder().encode(t));
  }
  #p(t, e) {
    this.#s += t;
    const n = this.#s.split(`
`);
    this.#s = n.pop() ?? "";
    for (const s of n) this.#e.push(e ? E + s + m : s);
    this.#e.length > 5e3 && this.#e.splice(0, this.#e.length - 5e3), this.#l();
  }
  #l() {
    const t = this.#o;
    if (t === null) return;
    const { screen: e, cols: n, rows: s } = t;
    e.eraseDisplay(2), e.moveTo(0, 0);
    const i = this.#a !== null ? `exit ${this.#a}` : this.#u;
    e.write(`${I}wasm ${this.#n}${m}  ${E}${i} · Ctrl+D eof · Ctrl+C kill${m}`), e.moveTo(0, 1), e.write(E + "─".repeat(Math.max(0, n - 1)) + m);
    const o = s - 4, a = this.#e.slice(Math.max(0, this.#e.length - o));
    for (let c = 0; c < a.length; c++)
      e.moveTo(0, 2 + c), e.write(a[c].slice(0, n - 1));
    e.moveTo(0, Math.max(2, s - 2)), this.#a !== null ? e.write(`${E}finished — Enter to return${m}`) : e.write(j + this.#r.slice(-(n - 4))), e.moveTo(Math.min(n - 1, 2 + this.#r.length), Math.max(2, s - 2)), e.setCursorVisible(!0);
  }
}
const J = "usage: wasm <module.wasm> [args...]", A = 500, k = 2 * 1024 * 1024;
function M(r, t) {
  if (r.endsWith(".b64"))
    try {
      const n = atob(t.replace(/\s+/g, "")), s = new Uint8Array(n.length);
      for (let i = 0; i < n.length; i++) s[i] = n.charCodeAt(i);
      return s;
    } catch {
      return "wasm: invalid base64 in " + r;
    }
  const e = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) e[n] = t.charCodeAt(n) & 255;
  return e;
}
function D(r, t = "/") {
  const e = /* @__PURE__ */ new Map();
  let n = 0;
  const s = (i, o) => {
    if (!(o > 6 || e.size >= A || n >= k))
      for (const a of r.list(i)) {
        const c = i === "/" ? `/${a.name}` : `${i}/${a.name}`;
        if (a.kind === "dir") {
          s(c, o + 1);
          continue;
        }
        const h = r.read(c);
        if (h === null) continue;
        const u = new TextEncoder().encode(h);
        if (n += u.length, e.set(c, u), e.size >= A || n >= k) return;
      }
  };
  return s(t === "/" ? "" : t, 0), { name: "/", files: e };
}
function q(r) {
  const t = r.args[0];
  if (t === void 0) return null;
  const e = r.vfs.resolve(r.state.cwd, t), n = r.vfs.read(e);
  if (n === null) return null;
  const s = M(e, n);
  return s instanceof Uint8Array && s.length === 0 || typeof s == "string" ? null : new Y(t, s, [t, ...r.args.slice(1)], [D(r.vfs)]);
}
const K = {
  name: "wasm",
  usage: "wasm <module.wasm> [args...] — run a WASI command module (tty: interactive; piped: batch)",
  app: q,
  run(r) {
    const t = r.args[0];
    if (t === void 0) {
      r.err(J), r.exit(2);
      return;
    }
    const e = r.vfs.resolve(r.state.cwd, t), n = r.vfs.read(e);
    if (n === null) {
      r.err(`wasm: no such module: ${t}`), r.exit(66);
      return;
    }
    const s = M(e, n);
    if (typeof s == "string") {
      r.err(s), r.exit(65);
      return;
    }
    if (s.length === 0 || !(s[0] === 0 && s[1] === 97)) {
      r.err(`wasm: not a wasm module: ${t}`), r.exit(65);
      return;
    }
    const i = r.stdin ?? "";
    let o = !1;
    const a = T(s, {
      args: [t, ...r.args.slice(1)],
      preopens: [D(r.vfs)],
      stdio: {
        stdout: (c) => {
          const h = new TextDecoder().decode(c);
          for (const u of h.split(`
`)) u !== "" && r.out(u);
        },
        stderr: (c) => {
          const h = new TextDecoder().decode(c);
          for (const u of h.split(`
`)) u !== "" && r.err(u);
        }
      },
      stdin: {
        pull: () => o ? new Uint8Array(0) : (o = !0, new TextEncoder().encode(i))
      }
    });
    if (a.crash !== null) {
      r.err(`wasm: ${t}: ${a.crash}`), r.exit(1);
      return;
    }
    r.exit(a.code);
  }
}, Q = [K], X = {
  wasm: [
    "WASM(1)                   semtext-sh manual",
    "",
    "NAME",
    "     wasm — run a WASI command module (the CORE-V2 Appendix-A spike)",
    "",
    "SYNOPSIS",
    "     wasm <module.wasm> [args...]",
    "",
    "DESCRIPTION",
    "     Runs a WASI command module from the VFS. `.wasm` files carry a",
    "     binary string (charCodeAt <= 0xff, the vfs.write convention);",
    "     `.b64` files carry base64. On a terminal the module claims the",
    "     screen (WasmRunApp); piped or redirected it runs batch with the",
    "     pipeline feeding stdin. Execution is worker-first and falls back",
    "     in-thread where Workers are unavailable. The VFS snapshot given",
    "     to the module is read-only and capped (500 files / 2 MiB).",
    "     Module fixtures: poc/wasm/bin (hello, wcat, wargs, wtype)."
  ]
}, Z = { commands: Q, manPages: X };
export {
  Q as commands,
  X as manPages,
  Z as pkg
};
