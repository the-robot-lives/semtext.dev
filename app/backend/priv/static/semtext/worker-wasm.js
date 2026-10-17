const i = Object.freeze({
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
class y {
  constructor(t) {
    this.code = t;
  }
}
const h = {
  CHAR_DEVICE: 2,
  DIRECTORY: 3,
  REGULAR_FILE: 4
}, b = 0x0000000000000006n, k = b | 0x40n;
function O() {
  const a = BigInt(Date.now()) * 1000000n, t = typeof performance == "object" && performance !== null && typeof performance.now == "function" ? BigInt(Math.round(performance.now() * 1e6)) : a;
  return { realtime: a, monotonic: t };
}
function I(a) {
  const t = globalThis.crypto;
  if (t !== void 0 && typeof t.getRandomValues == "function") {
    t.getRandomValues(a);
    return;
  }
  for (let n = 0; n < a.length; n++) a[n] = Math.floor(Math.random() * 256);
}
function w(a) {
  const t = [];
  for (const n of a.split("/"))
    if (!(n === "" || n === ".")) {
      if (n === "..") {
        t.pop();
        continue;
      }
      t.push(n);
    }
  return "/" + t.join("/");
}
class N {
  #o;
  #a;
  #c;
  #t = /* @__PURE__ */ new Map();
  #r = 0;
  #s = null;
  constructor(t) {
    this.args = t.args ?? [], this.env = Object.entries(t.env ?? {}), this.#o = t.stdio, this.#a = t.stdin, this.#c = t.environment ?? { now: O, random: I }, this.#t.set(0, { kind: "stdin", filetype: h.CHAR_DEVICE }), this.#t.set(1, { kind: "stdout", filetype: h.CHAR_DEVICE }), this.#t.set(2, { kind: "stderr", filetype: h.CHAR_DEVICE });
    for (const n of t.preopens ?? [])
      this.#t.set(this.#u(), { kind: "preopen", filetype: h.DIRECTORY, preopen: n });
  }
  /** The import object for WebAssembly instantiation. */
  get imports() {
    return { wasi_snapshot_preview1: this.#k() };
  }
  /** Bind module memory (called by the engine after instantiation). */
  bind(t) {
    this.#s = t;
  }
  #e() {
    if (this.#s === null) throw new Error("wasi: memory not bound");
    return new DataView(this.#s.buffer);
  }
  #n() {
    if (this.#s === null) throw new Error("wasi: memory not bound");
    return new Uint8Array(this.#s.buffer);
  }
  #u() {
    for (; this.#t.has(this.#r); ) this.#r++;
    const t = this.#r;
    return this.#r++, t;
  }
  /* -- memory helpers --------------------------------------------------- */
  #f(t, n) {
    const e = this.#e(), s = [];
    for (let r = 0; r < n; r++) {
      const o = t + r * 8;
      s.push([e.getUint32(o, !0), e.getUint32(o + 4, !0)]);
    }
    return s;
  }
  #O(t, n = 4096) {
    const e = this.#n();
    let s = t;
    const r = Math.min(e.length, t + n);
    for (; s < r && e[s] !== 0; ) s++;
    return new TextDecoder().decode(e.subarray(t, s));
  }
  /* -- args / env -------------------------------------------------------- */
  #d(t, n) {
    let e = 0;
    for (const r of this.args) e += C(r).length + 1;
    const s = this.#e();
    return s.setUint32(t, this.args.length, !0), s.setUint32(n, e, !0), i.SUCCESS;
  }
  #h(t, n) {
    const e = this.#e(), s = this.#n();
    let r = n;
    for (let o = 0; o < this.args.length; o++) {
      const u = this.args[o];
      e.setUint32(t + o * 4, r, !0);
      const c = new TextEncoder().encode(u);
      s.set(c, r), s[r + c.length] = 0, r += c.length + 1;
    }
    return i.SUCCESS;
  }
  #l(t, n) {
    let e = 0;
    for (const [r, o] of this.env) e += C(`${r}=${o}`).length + 1;
    const s = this.#e();
    return s.setUint32(t, this.env.length, !0), s.setUint32(n, e, !0), i.SUCCESS;
  }
  #E(t, n) {
    const e = this.#e(), s = this.#n();
    let r = n;
    for (let o = 0; o < this.env.length; o++) {
      const u = `${this.env[o][0]}=${this.env[o][1]}`;
      e.setUint32(t + o * 4, r, !0);
      const c = new TextEncoder().encode(u);
      s.set(c, r), s[r + c.length] = 0, r += c.length + 1;
    }
    return i.SUCCESS;
  }
  /* -- stdio + fds -------------------------------------------------------- */
  #p(t, n, e, s) {
    const r = this.#t.get(t);
    if (r === void 0 || r.kind !== "stdout" && r.kind !== "stderr") return i.EBADF;
    let o = 0;
    const u = [];
    for (const [c, f] of this.#f(n, e))
      f !== 0 && (u.push(this.#n().slice(c, c + f)), o += f);
    return o > 0 && (r.kind === "stdout" ? this.#o.stdout : this.#o.stderr)(D(u, o)), this.#e().setUint32(s, o, !0), i.SUCCESS;
  }
  /**
   * Read into iovs. Sync paths return a plain errno; a stdin source that
   * returns a Promise yields a Promise (the JSPI engine's Suspending
   * wrapper suspends the guest until it settles — batch callers must pass
   * sync-only sources, per the WasiStdinSource contract).
   */
  #S(t, n, e, s) {
    const r = this.#t.get(t);
    if (r === void 0) return i.EBADF;
    const o = this.#f(n, e);
    if (o.length === 0)
      return this.#e().setUint32(s, 0, !0), i.SUCCESS;
    if (r.kind === "stdin") {
      const u = o.reduce((d, [, l]) => d + l, 0), c = this.#a.pull(Math.max(1, u));
      if (T(c))
        return c.then((d) => {
          const l = v(this.#n(), d, o);
          return this.#e().setUint32(s, l, !0), i.SUCCESS;
        });
      const f = v(this.#n(), c, o);
      return this.#e().setUint32(s, f, !0), i.SUCCESS;
    }
    if (r.kind === "file" && r.bytes !== void 0) {
      const u = r.bytes, c = r.pos ?? 0, f = B(this.#n(), u, c, o);
      return r.pos = c + f, this.#e().setUint32(s, f, !0), i.SUCCESS;
    }
    return i.EBADF;
  }
  #g(t) {
    return this.#t.get(t) === void 0 ? i.EBADF : (t <= 2 || this.#t.delete(t), i.SUCCESS);
  }
  #_(t, n, e, s) {
    const r = this.#t.get(t);
    if (r === void 0) return i.EBADF;
    if (r.kind !== "file") return i.ESPIPE;
    const o = r.bytes?.length ?? 0, u = e === 0 ? 0 : e === 1 ? r.pos ?? 0 : e === 2 ? o : NaN;
    if (!Number.isFinite(u)) return i.EINVAL;
    const c = Math.max(0, Math.min(o, u + n));
    return r.pos = c, this.#e().setBigUint64(s, BigInt(c), !0), i.SUCCESS;
  }
  #m(t, n) {
    const e = this.#t.get(t);
    if (e === void 0) return i.EBADF;
    const s = this.#e();
    return s.setUint8(n, e.filetype), s.setUint16(n + 2, 0, !0), s.setBigUint64(n + 8, e.kind === "stderr" || e.kind === "stdout" ? k : b, !0), s.setBigUint64(n + 16, 0n, !0), i.SUCCESS;
  }
  #y(t, n) {
    const e = this.#t.get(t);
    return e === void 0 ? i.EBADF : (this.#i(n, e.filetype, e.bytes?.length ?? 0), i.SUCCESS);
  }
  #i(t, n, e) {
    const s = this.#e();
    s.setBigUint64(t, 1n, !0), s.setBigUint64(t + 8, 0n, !0), s.setUint8(t + 16, n), s.setBigUint64(t + 24, 1n, !0), s.setBigUint64(t + 32, BigInt(e), !0), s.setBigUint64(t + 40, 0n, !0), s.setBigUint64(t + 48, 0n, !0), s.setBigUint64(t + 56, 0n, !0);
  }
  /* -- preopens + path_open ---------------------------------------------- */
  #U(t, n) {
    const e = this.#t.get(t);
    if (e === void 0) return i.EBADF;
    if (e.kind !== "preopen" || e.preopen === void 0) return i.EINVAL;
    const s = this.#e();
    return s.setUint8(n, 0), s.setUint32(n + 4, e.preopen.name.length, !0), i.SUCCESS;
  }
  #w(t, n, e) {
    const s = this.#t.get(t);
    if (s === void 0) return i.EBADF;
    if (s.kind !== "preopen" || s.preopen === void 0) return i.EINVAL;
    const r = s.preopen.name, o = Math.min(e, r.length);
    return this.#n().set(new TextEncoder().encode(r.slice(0, o)), n), i.SUCCESS;
  }
  #C(t, n, e, s, r, o, u, c) {
    const f = this.#t.get(t);
    if (f === void 0) return i.EBADF;
    if (f.kind !== "preopen" || f.preopen === void 0) return i.ENOTDIR;
    const d = new TextDecoder().decode(this.#n().subarray(e, e + s)), l = w(d);
    if ((r & 1) !== 0 || (r & 2) !== 0) return i.EROFS;
    const g = f.preopen.files.get(l);
    if (g === void 0) return i.ENOENT;
    const U = this.#u();
    return this.#t.set(U, { kind: "file", filetype: h.REGULAR_FILE, bytes: g, pos: 0 }), this.#e().setUint32(c, U, !0), i.SUCCESS;
  }
  #v(t, n, e, s, r) {
    const o = this.#t.get(t);
    if (o === void 0) return i.EBADF;
    if (o.kind !== "preopen" || o.preopen === void 0) return i.ENOTDIR;
    const u = new TextDecoder().decode(this.#n().subarray(e, e + s)), c = w(u);
    if (c === "/")
      return this.#i(r, h.DIRECTORY, 0), i.SUCCESS;
    const f = o.preopen.files.get(c);
    if (f === void 0) {
      for (const d of o.preopen.files.keys())
        if (d.startsWith(c + "/"))
          return this.#i(r, h.DIRECTORY, 0), i.SUCCESS;
      return i.ENOENT;
    }
    return this.#i(r, h.REGULAR_FILE, f.length), i.SUCCESS;
  }
  /* -- clock / random / misc ---------------------------------------------- */
  #b(t, n, e) {
    const { realtime: s, monotonic: r } = this.#c.now();
    return this.#e().setBigUint64(e, t === 1 ? r : s, !0), i.SUCCESS;
  }
  #A(t, n) {
    const e = this.#n().subarray(t, t + n);
    return this.#c.random(e), i.SUCCESS;
  }
  /* -- the import surface -------------------------------------------------- */
  #k() {
    const t = this;
    return {
      args_sizes_get: (n, e) => t.#d(n, e),
      args_get: (n, e) => t.#h(n, e),
      environ_sizes_get: (n, e) => t.#l(n, e),
      environ_get: (n, e) => t.#E(n, e),
      clock_time_get: (n, e, s) => t.#b(n, e, s),
      fd_write: (n, e, s, r) => t.#p(n, e, s, r),
      // async: resolves now for file/preopen reads, may await the stdin
      // source (JSPI suspends the guest for the duration).
      fd_read: (n, e, s, r) => t.#S(n, e, s, r),
      fd_close: (n) => t.#g(n),
      fd_seek: (n, e, s, r) => t.#_(n, e, s, r),
      fd_fdstat_get: (n, e) => t.#m(n, e),
      fd_filestat_get: (n, e) => t.#y(n, e),
      fd_prestat_get: (n, e) => t.#U(n, e),
      fd_prestat_dir_name: (n, e, s) => t.#w(n, e, s),
      path_open: (n, e, s, r, o, u, c, f) => t.#C(n, e, s, r, o, u, c, f),
      path_filestat_get: (n, e, s, r, o) => t.#v(n, e, s, r, o),
      random_get: (n, e) => t.#A(n, e),
      sched_yield: () => i.SUCCESS,
      // Everything else a wasi libc may probe at boot: answer, never wedge.
      fd_datasync: () => i.ENOTSUP,
      fd_sync: () => i.SUCCESS,
      fd_tell: () => i.ENOTSUP,
      fd_advise: () => i.SUCCESS,
      fd_allocate: () => i.ENOTSUP,
      fd_readdir: () => i.ENOTSUP,
      fd_renumber: () => i.ENOTSUP,
      fd_dup: () => i.ENOTSUP,
      poll_oneoff: () => i.ENOTSUP,
      proc_raise: () => i.ENOTSUP,
      path_create_directory: () => i.EROFS,
      path_remove_directory: () => i.EROFS,
      path_unlink_file: () => i.EROFS,
      path_rename: () => i.EROFS,
      path_link: () => i.EROFS,
      path_symlink: () => i.ENOTSUP,
      path_readlink: () => i.ENOENT,
      sock_send: () => i.ENOTSUP,
      sock_recv: () => i.ENOTSUP,
      sock_shutdown: () => i.ENOTSUP,
      proc_exit: (n) => {
        throw new y(n);
      }
    };
  }
}
function T(a) {
  return typeof a?.then == "function";
}
const R = new TextEncoder();
function C(a) {
  return R.encode(a);
}
function D(a, t) {
  const n = new Uint8Array(t);
  let e = 0;
  for (const s of a)
    n.set(s, e), e += s.length;
  return n;
}
function v(a, t, n) {
  let e = 0;
  for (const [s, r] of n) {
    if (e >= t.length) break;
    const o = Math.min(r, t.length - e);
    a.set(t.subarray(e, e + o), s), e += o;
  }
  return e;
}
function B(a, t, n, e) {
  let s = n;
  for (const [r, o] of e) {
    if (s >= t.length) break;
    const u = Math.min(o, t.length - s);
    a.set(t.subarray(s, s + u), r), s += u;
  }
  return s - n;
}
function F() {
  const a = WebAssembly;
  return typeof a.Suspending == "function" && typeof a.promising == "function";
}
function M(a) {
  for (const t of WebAssembly.Module.imports(a))
    if (t.kind === "memory") return !0;
  return !1;
}
function x(a) {
  if (WebAssembly.Module.exports(a).find((e) => e.name === "_start" && e.kind === "function") === void 0)
    throw new Error("wasm: module exports no _start (not a WASI command module)");
}
function A(a, t, n) {
  const e = E(), s = new WebAssembly.Module(new Uint8Array(a));
  x(s);
  const r = E(), o = new N(t), u = o.imports;
  if (n) {
    const g = WebAssembly.Suspending;
    u.wasi_snapshot_preview1.fd_read = new g(u.wasi_snapshot_preview1.fd_read);
  }
  const c = { ...u };
  M(s) && (c.env = { ...c.env ?? {}, memory: new WebAssembly.Memory({ initial: 1 }) });
  const f = new WebAssembly.Instance(s, c), d = f.exports.memory;
  if (d === void 0) throw new Error("wasm: module has no linear memory");
  o.bind(d);
  const l = E();
  return {
    host: o,
    start: f.exports._start,
    timings: { compileMs: r - e, instantiateMs: l - r }
  };
}
function E() {
  return typeof performance == "object" && performance !== null && typeof performance.now == "function" ? performance.now() : Date.now();
}
function L(a, t) {
  const { start: n, timings: e } = A(a, t, !1), s = E();
  let r = 0, o = null;
  try {
    n();
  } catch (u) {
    typeof process < "u" && process.env.WASM_DEBUG && console.error("WASM-DEBUG batch crash:", u), u instanceof y ? r = u.code : o = u instanceof Error ? u.message : String(u);
  }
  return { code: r, crash: o, ...e, runMs: E() - s };
}
async function W(a, t) {
  const { start: n, timings: e } = A(a, t, !0), s = WebAssembly.promising(
    n
  ), r = E();
  let o = 0, u = null;
  try {
    await s();
  } catch (c) {
    typeof process < "u" && process.env.WASM_DEBUG && console.error("WASM-DEBUG interactive crash:", c), c instanceof y ? o = c.code : u = c instanceof Error ? c.message : String(c);
  }
  return { code: o, crash: u, ...e, runMs: E() - r };
}
const S = [];
let p = [], _ = !1, m = !1;
function P() {
  return S.length > 0 ? S.shift() : _ || m ? new Uint8Array(0) : new Promise((a) => p.push(a));
}
self.addEventListener("message", (a) => {
  const t = a.data;
  if (t.type === "stdin") {
    if (m || t.bytes.length === 0) return;
    for (S.push(t.bytes); S.length > 0 && p.length > 0; ) p.shift()(S.shift());
    return;
  }
  if (t.type === "stdin-eof") {
    _ = !0;
    for (const r of p.splice(0)) r(new Uint8Array(0));
    return;
  }
  if (t.type === "kill") {
    m = !0, S.length = 0;
    for (const r of p.splice(0)) r(new Uint8Array(0));
    return;
  }
  const n = (r) => self.postMessage(r), e = (r) => n({ type: "done", result: r }), s = {
    args: t.args,
    env: t.env,
    preopens: t.preopens,
    stdio: {
      stdout: (r) => n({ type: "stdout", bytes: r }),
      stderr: (r) => n({ type: "stderr", bytes: r })
    },
    stdin: { pull: P }
  };
  if (F()) {
    n({ type: "status", text: "worker" }), W(t.bytes, s).then(e, (r) => {
      e({ code: 1, crash: r instanceof Error ? r.message : String(r), compileMs: 0, instantiateMs: 0, runMs: 0 });
    });
    return;
  }
  n({ type: "status", text: "batch (no JSPI: stdin closed)" }), _ = !0;
  for (const r of p.splice(0)) r(new Uint8Array(0));
  e(L(t.bytes, s));
});
