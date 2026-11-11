function $e(e) {
  return `semtext-pkg-${e}.js`;
}
function Te(e) {
  return import(
    /* @vite-ignore */
    new URL($e(e), import.meta.url).href
  ).then(
    (t) => t
  );
}
function Ue(e) {
  return e.includes("--help") || e.includes("-h");
}
function We(e, t) {
  const n = $e(e.name), s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  for (const c of e.commands)
    c.man !== void 0 && u.set(c.name, c.man);
  let r = !1, a = !1, o = null;
  const l = () => (o ??= t().then(
    (c) => {
      for (const h of c.commands) s.set(h.name, h);
      for (const [h, m] of Object.entries(c.manPages ?? {})) i.set(h, m);
      return r = !0, !0;
    },
    () => (a = !0, !1)
  ), o), p = (c) => {
    const h = () => s.get(c.name);
    return {
      name: c.name,
      // Help/completion surfaces read the stub's line — never the chunk.
      usage: c.usage,
      run(m) {
        const g = h();
        if (g !== void 0)
          return g.run(m);
        if (Ue(m.args)) {
          m.out(c.usage);
          return;
        }
        m.err(`loading ${e.name}…`);
        const d = m.err, f = m.exit;
        let w = !1, b = !1;
        const z = () => {
          m.err = d, m.exit = f, b || f(w ? 1 : 0);
        };
        return l().then((y) => {
          if (!y) {
            m.err(`${c.name}: package chunk failed to load (${n})`), m.exit(1);
            return;
          }
          const $ = h();
          if ($ === void 0) {
            m.err(`${c.name}: package chunk ${n} does not provide it`), m.exit(70);
            return;
          }
          return m.err = (A) => {
            w = !0, d(A);
          }, m.exit = (A) => {
            b = !0, f(A);
          }, Promise.resolve($.run(m)).then(z, (A) => {
            throw z(), A;
          });
        });
      },
      complete(m) {
        return h()?.complete?.(m) ?? [];
      },
      app(m) {
        return h()?.app?.(m) ?? null;
      }
    };
  };
  return {
    name: e.name,
    commands: e.commands.map(p),
    ensure: l,
    loaded: () => r,
    state: () => r ? "resident" : a ? "failed" : "loading",
    manNames: () => /* @__PURE__ */ new Set([...i.keys(), ...u.keys()]),
    manPage: (c) => i.get(c) ?? u.get(c) ?? null,
    supersedes: new Set(e.supersedes ?? [])
  };
}
const Ae = {
  name: "archive",
  commands: [
    {
      name: "base64",
      summary: "encode/decode base64",
      usage: "base64 [-d] [-w COLS] [-i] [file...]",
      man: [
        "BASE64(1)                 semtext-sh manual",
        "",
        "NAME",
        "     base64 — encode/decode base64 (short page; the full one prints",
        "     once the package body has loaded)."
      ]
    },
    {
      name: "md5sum",
      summary: "MD5 digests + check mode",
      usage: "md5sum [-b | -t] [--tag] [file...] · md5sum -c FILE",
      man: [
        "MD5SUM(1)                 semtext-sh manual",
        "",
        "NAME",
        "     md5sum — MD5 digests and -c verification (short page until the",
        "     body loads)."
      ]
    },
    {
      name: "sha1sum",
      summary: "SHA-1 digests + check mode",
      usage: "sha1sum [-b | -t] [--tag] [file...] · sha1sum -c FILE",
      man: [
        "SHA1SUM(1)                semtext-sh manual",
        "",
        "NAME",
        "     sha1sum — SHA-1 digests and -c verification (short page until",
        "     the body loads)."
      ]
    },
    {
      name: "sha256sum",
      summary: "SHA-256 digests + check mode",
      usage: "sha256sum [-b | -t] [--tag] [file...] · sha256sum -c FILE",
      man: [
        "SHA256SUM(1)              semtext-sh manual",
        "",
        "NAME",
        "     sha256sum — SHA-256 digests and -c verification (short page",
        "     until the body loads)."
      ]
    },
    {
      name: "sha512sum",
      summary: "SHA-512 digests + check mode",
      usage: "sha512sum [-b | -t] [--tag] [file...] · sha512sum -c FILE",
      man: [
        "SHA512SUM(1)              semtext-sh manual",
        "",
        "NAME",
        "     sha512sum — SHA-512 digests and -c verification (short page",
        "     until the body loads)."
      ]
    },
    {
      name: "gzip",
      summary: "compress in the gzip format",
      usage: "gzip [-cdfktv] [-1..-9] [file...]",
      man: [
        "GZIP(1)                   semtext-sh manual",
        "",
        "NAME",
        "     gzip — gzip-compress files or stdin (short page until the body",
        "     loads)."
      ]
    },
    {
      name: "gunzip",
      summary: "decompress gzip files",
      usage: "gunzip [-cfkv] [file...]",
      man: [
        "GUNZIP(1)                 semtext-sh manual",
        "",
        "NAME",
        "     gunzip — decompress gzip files or stdin (short page until the",
        "     body loads)."
      ]
    },
    {
      name: "zcat",
      summary: "decompress gzip to stdout",
      usage: "zcat [file...]",
      man: [
        "ZCAT(1)                   semtext-sh manual",
        "",
        "NAME",
        "     zcat — cat through the gzip decompressor (short page until the",
        "     body loads)."
      ]
    },
    {
      name: "tar",
      summary: "create/list/extract ustar archives",
      usage: "tar (-c | -x | -t) [-f ARCHIVE] [-v] [-z] [-C DIR] [PATH...]",
      man: [
        "TAR(1)                    semtext-sh manual",
        "",
        "NAME",
        "     tar — ustar create/list/extract, -z for gzip (short page until",
        "     the body loads)."
      ]
    },
    {
      name: "zip",
      summary: "create/update PKZIP archives",
      usage: "zip [-r] [-q] [-0] ARCHIVE PATH...",
      man: [
        "ZIP(1)                    semtext-sh manual",
        "",
        "NAME",
        "     zip — PKZIP create/update, store + deflate (short page until",
        "     the body loads)."
      ]
    },
    {
      name: "unzip",
      summary: "list/extract PKZIP archives",
      usage: "unzip [-l] [-o | -n] [-q] [-d DIR] ARCHIVE [MEMBER...]",
      man: [
        "UNZIP(1)                  semtext-sh manual",
        "",
        "NAME",
        "     unzip — PKZIP list/extract with glob members (short page until",
        "     the body loads)."
      ]
    }
  ]
};
We(Ae, () => Te("archive"));
function I(e) {
  let t = !0;
  for (let n = 0; n < e.length; n++)
    if (e.charCodeAt(n) > 255) {
      t = !1;
      break;
    }
  if (t) {
    const n = new Uint8Array(e.length);
    for (let s = 0; s < e.length; s++) n[s] = e.charCodeAt(s);
    return n;
  }
  return new TextEncoder().encode(e);
}
function F(e) {
  try {
    return new TextDecoder("utf-8", { fatal: !0 }).decode(e);
  } catch {
    let t = "";
    for (let n = 0; n < e.length; n += 32768)
      t += String.fromCharCode(...e.subarray(n, n + 32768));
    return t;
  }
}
const he = "0123456789abcdef";
function se(e) {
  let t = "";
  for (let n = 0; n < e.length; n++)
    t += he[e[n] >> 4] + he[e[n] & 15];
  return t;
}
const P = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function _e(e, t) {
  const n = [];
  let s = "", i = 0;
  for (; i + 3 <= e.length; ) {
    const r = e[i] << 16 | e[i + 1] << 8 | e[i + 2];
    s += P[r >> 18 & 63] + P[r >> 12 & 63] + P[r >> 6 & 63] + P[r & 63], i += 3, t > 0 && s.length + 4 > t && (n.push(s), s = "");
  }
  const u = e.length - i;
  if (u === 1) {
    const r = e[i] << 16;
    s += P[r >> 18 & 63] + P[r >> 12 & 63] + "==";
  } else if (u === 2) {
    const r = e[i] << 16 | e[i + 1] << 8;
    s += P[r >> 18 & 63] + P[r >> 12 & 63] + P[r >> 6 & 63] + "=";
  }
  return s !== "" && n.push(s), n;
}
const Ge = new Map([...P].map((e, t) => [e, t]));
function Ze(e, t) {
  let n = 0, s = 0;
  const i = [];
  for (const u of e.replace(/\r\n?/g, `
`)) {
    if (u === `
` || u === " " || u === "	") continue;
    const r = Ge.get(u);
    if (r === void 0) {
      if (u === "=" || t) continue;
      return `invalid input: '${u}'`;
    }
    s = s << 6 | r, n += 6, n >= 8 && (n -= 8, i.push(s >> n & 255));
  }
  return new Uint8Array(i);
}
const Ve = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let n = t;
    for (let s = 0; s < 8; s++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n >>> 0;
  }
  return e;
})();
function X(e) {
  let t = 4294967295;
  for (let n = 0; n < e.length; n++) t = Ve[(t ^ e[n]) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
const R = (e, t) => e[t] | e[t + 1] << 8, k = (e, t) => (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
function v(e, t) {
  e.push(t & 255, t >>> 8 & 255);
}
function S(e, t) {
  e.push(t & 255, t >>> 8 & 255, t >>> 16 & 255, t >>> 24 & 255);
}
function Ke(e, t) {
  if (e < 2n) return e;
  let n = 1n << BigInt(Math.ceil(e.toString(2).length / Number(t)) + 1);
  for (; ; ) {
    const s = ((t - 1n) * n + e / n ** (t - 1n)) / t;
    if (s >= n) return n;
    n = s;
  }
}
const B = (1n << 64n) - 1n;
function te(e, t, n, s) {
  const i = BigInt(s * n);
  return Ke(BigInt(e[t]) << i, BigInt(n)) & (1n << BigInt(s)) - 1n;
}
const Se = (e) => {
  const t = [];
  for (let n = 2; t.length < e; n++)
    t.some((s) => n % s === 0) || t.push(n);
  return t;
}, qe = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21], Ye = Array.from({ length: 64 }, (e, t) => Math.floor(Math.abs(Math.sin(t + 1)) * 2 ** 32)), Y = (e, t) => (e << t | e >>> 32 - t) >>> 0;
function je(e) {
  const t = e.length * 8, n = new Uint8Array((e.length + 8 >> 6) + 1 << 6);
  n.set(e), n[e.length] = 128;
  for (let l = 0; l < 4; l++) n[n.length - 8 + l] = t >>> 8 * l & 255;
  let s = 1732584193, i = 4023233417, u = 2562383102, r = 271733878;
  const a = new Int32Array(16);
  for (let l = 0; l < n.length; l += 64) {
    for (let g = 0; g < 16; g++)
      a[g] = n[l + g * 4] | n[l + g * 4 + 1] << 8 | n[l + g * 4 + 2] << 16 | n[l + g * 4 + 3] << 24 | 0;
    let p = s, c = i, h = u, m = r;
    for (let g = 0; g < 64; g++) {
      let d, f;
      g < 16 ? (d = c & h | ~c & m, f = g) : g < 32 ? (d = m & c | ~m & h, f = (5 * g + 1) % 16) : g < 48 ? (d = c ^ h ^ m, f = (3 * g + 5) % 16) : (d = h ^ (c | ~m), f = 7 * g % 16);
      const w = m;
      m = h, h = c;
      const b = p + d + Ye[g] + a[f] | 0;
      c = c + Y(b, qe[(g >> 4) * 4 + g % 4]) | 0, p = w;
    }
    s = s + p | 0, i = i + c | 0, u = u + h | 0, r = r + m | 0;
  }
  const o = new Uint8Array(16);
  for (const [l, p] of [s, i, u, r].entries())
    for (let c = 0; c < 4; c++) o[l * 4 + c] = p >>> 8 * c & 255;
  return o;
}
function Xe(e) {
  const t = e.length * 8, n = new Uint8Array((e.length + 8 >> 6) + 1 << 6);
  n.set(e), n[e.length] = 128;
  for (let r = 0; r < 4; r++) n[n.length - 8 + r] = 0;
  for (let r = 4; r < 8; r++) n[n.length - 8 + r] = t >>> 8 * (7 - r) & 255;
  const s = [1732584193, 4023233417, 2562383102, 271733878, 3285377520], i = new Int32Array(80);
  for (let r = 0; r < n.length; r += 64) {
    for (let h = 0; h < 16; h++)
      i[h] = n[r + h * 4] << 24 | n[r + h * 4 + 1] << 16 | n[r + h * 4 + 2] << 8 | n[r + h * 4 + 3];
    for (let h = 16; h < 80; h++) i[h] = Y(i[h - 3] ^ i[h - 8] ^ i[h - 14] ^ i[h - 16], 1);
    let [a, o, l, p, c] = s;
    for (let h = 0; h < 80; h++) {
      const m = h < 20 ? o & l | ~o & p : h < 40 ? o ^ l ^ p : h < 60 ? o & l | o & p | l & p : o ^ l ^ p, g = h < 20 ? 1518500249 : h < 40 ? 1859775393 : h < 60 ? 2400959708 : 3395469782, d = Y(a, 5) + m + c + g + i[h] | 0;
      c = p, p = l, l = Y(o, 30), o = a, a = d;
    }
    s[0] = s[0] + a | 0, s[1] = s[1] + o | 0, s[2] = s[2] + l | 0, s[3] = s[3] + p | 0, s[4] = s[4] + c | 0;
  }
  const u = new Uint8Array(20);
  for (const [r, a] of s.entries())
    for (let o = 0; o < 4; o++) u[r * 4 + o] = a >>> 8 * (3 - o) & 255;
  return u;
}
const J = Se(64), Je = J.map((e, t) => Number(te(J, t, 3, 32))), Qe = J.slice(0, 8).map((e, t) => Number(te(J, t, 2, 32))), H = (e, t) => (e >>> t | e << 32 - t) >>> 0;
function xe(e) {
  const t = e.length * 8, n = new Uint8Array((e.length + 8 >> 6) + 1 << 6);
  n.set(e), n[e.length] = 128;
  for (let r = 0; r < 4; r++) n[n.length - 8 + r] = 0;
  for (let r = 4; r < 8; r++) n[n.length - 8 + r] = t >>> 8 * (7 - r) & 255;
  const s = [...Qe], i = new Int32Array(64);
  for (let r = 0; r < n.length; r += 64) {
    for (let f = 0; f < 16; f++)
      i[f] = n[r + f * 4] << 24 | n[r + f * 4 + 1] << 16 | n[r + f * 4 + 2] << 8 | n[r + f * 4 + 3];
    for (let f = 16; f < 64; f++) {
      const w = H(i[f - 15], 7) ^ H(i[f - 15], 18) ^ i[f - 15] >>> 3, b = H(i[f - 2], 17) ^ H(i[f - 2], 19) ^ i[f - 2] >>> 10;
      i[f] = i[f - 16] + w + i[f - 7] + b | 0;
    }
    let [a, o, l, p, c, h, m, g] = s;
    for (let f = 0; f < 64; f++) {
      const w = H(c, 6) ^ H(c, 11) ^ H(c, 25), b = c & h ^ ~c & m, z = g + w + b + Je[f] + i[f] | 0, y = H(a, 2) ^ H(a, 13) ^ H(a, 22), $ = a & o ^ a & l ^ o & l, A = y + $ | 0;
      g = m, m = h, h = c, c = p + z | 0, p = l, l = o, o = a, a = z + A | 0;
    }
    const d = [a, o, l, p, c, h, m, g];
    for (let f = 0; f < 8; f++) s[f] = s[f] + d[f] | 0;
  }
  const u = new Uint8Array(32);
  for (const [r, a] of s.entries())
    for (let o = 0; o < 4; o++) u[r * 4 + o] = a >>> 8 * (3 - o) & 255;
  return u;
}
const Q = Se(80), et = Q.map((e, t) => te(Q, t, 3, 64)), tt = Q.slice(0, 8).map((e, t) => te(Q, t, 2, 64)), L = (e, t) => (e << BigInt(64 - t) | e >> BigInt(t)) & B;
function nt(e) {
  const t = BigInt(e.length) * 8n, n = new Uint8Array((e.length + 16 >> 7) + 1 << 7);
  n.set(e), n[e.length] = 128;
  for (let r = 0; r < 16; r++) n[n.length - 16 + r] = Number(t >> BigInt(8 * (15 - r)) & 0xffn);
  const s = [...tt], i = new Array(80);
  for (let r = 0; r < n.length; r += 128) {
    for (let f = 0; f < 16; f++) {
      let w = 0n;
      for (let b = 0; b < 8; b++) w = w << 8n | BigInt(n[r + f * 8 + b]);
      i[f] = w;
    }
    for (let f = 16; f < 80; f++) {
      const w = L(i[f - 15], 1) ^ L(i[f - 15], 8) ^ i[f - 15] >> 7n, b = L(i[f - 2], 19) ^ L(i[f - 2], 61) ^ i[f - 2] >> 6n;
      i[f] = i[f - 16] + w + i[f - 7] + b & B;
    }
    let [a, o, l, p, c, h, m, g] = s;
    for (let f = 0; f < 80; f++) {
      const w = L(c, 14) ^ L(c, 18) ^ L(c, 41), b = c & h ^ ~c & m, z = g + w + b + et[f] + i[f] & B, y = L(a, 28) ^ L(a, 34) ^ L(a, 39), $ = a & o ^ a & l ^ o & l, A = y + $ & B;
      g = m, m = h, h = c, c = p + z & B, p = l, l = o, o = a, a = z + A & B;
    }
    const d = [a, o, l, p, c, h, m, g];
    for (let f = 0; f < 8; f++) s[f] = s[f] + d[f] & B;
  }
  const u = new Uint8Array(64);
  for (const [r, a] of s.entries())
    for (let o = 0; o < 8; o++) u[r * 8 + o] = Number(a >> BigInt(8 * (7 - o)) & 0xffn);
  return u;
}
const rt = {
  md5: je,
  sha1: Xe,
  sha256: xe,
  sha512: nt
};
function ie(e, t) {
  return rt[e](t);
}
const st = { md5: 32, sha1: 40, sha256: 64, sha512: 128 }, x = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], O = (() => {
  const e = [3];
  for (let t = 1; t < x.length; t++) e.push(e[t - 1] + (1 << x[t - 1]));
  return e;
})();
O[28] = 258;
const ee = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], G = (() => {
  const e = [1];
  for (let t = 1; t < ee.length; t++) e.push(e[t - 1] + (1 << ee[t - 1]));
  return e;
})();
function it(e) {
  if (e === 258) return { code: 285, extra: 0, value: 0 };
  let t = O.length - 1;
  for (; O[t] > e; ) t--;
  return { code: 257 + t, extra: x[t], value: e - O[t] };
}
function ot(e) {
  let t = G.length - 1;
  for (; G[t] > e; ) t--;
  return { code: t, extra: ee[t], value: e - G[t] };
}
function Z(e) {
  const t = new Int32Array(16);
  for (let i = 0; i < e.length; i++) t[e[i]]++;
  t[0] = 0;
  const n = new Int32Array(16);
  for (let i = 0, u = 0; i < 15; i++)
    n[i + 1] = u + t[i], u += t[i];
  const s = new Int32Array(e.length);
  for (let i = 0; i < e.length; i++) {
    const u = e[i];
    u !== 0 && (s[n[u]++] = i);
  }
  return { counts: t, symbols: s };
}
class at {
  constructor(t, n = 0) {
    this.data = t, this.start = n, this.bitBuf = 0, this.bitCnt = 0, this.pos = n;
  }
  bits(t) {
    for (; this.bitCnt < t; ) {
      if (this.pos >= this.data.length) throw new Error("unexpected end of input");
      this.bitBuf |= this.data[this.pos++] << this.bitCnt, this.bitCnt += 8;
    }
    const n = this.bitBuf & (1 << t) - 1;
    return this.bitBuf >>>= t, this.bitCnt -= t, n;
  }
  alignByte() {
    const t = this.bitCnt & 7;
    t !== 0 && (this.bitBuf >>>= t, this.bitCnt -= t);
  }
  /** Bytes consumed RELATIVE to `start` (the gzip trailer's offset). */
  get consumed() {
    return this.pos - this.start - (this.bitCnt >> 3);
  }
}
function le(e, t) {
  let n = 0, s = 0, i = 0;
  for (let u = 1; u < 16; u++) {
    n |= e.bits(1);
    const r = t.counts[u];
    if (n - s < r) return t.symbols[i + n - s];
    i += r, s = s + r << 1, n <<= 1;
  }
  throw new Error("invalid Huffman code");
}
const Ee = (() => {
  const e = new Uint8Array(288);
  for (let t = 0; t <= 143; t++) e[t] = 8;
  for (let t = 144; t <= 255; t++) e[t] = 9;
  for (let t = 256; t <= 279; t++) e[t] = 7;
  for (let t = 280; t <= 287; t++) e[t] = 8;
  return e;
})();
let lt = null;
function ft() {
  return lt ??= { lit: Z(Ee), dist: Z(new Uint8Array(30).fill(5)) };
}
const ut = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
function ct(e) {
  const t = e.bits(5) + 257, n = e.bits(5) + 1, s = e.bits(4) + 4, i = new Uint8Array(19);
  for (let o = 0; o < s; o++) i[ut[o]] = e.bits(3);
  if (i.every((o) => o === 0)) throw new Error("invalid code lengths");
  const u = Z(i), r = new Uint8Array(t + n);
  let a = 0;
  for (; a < r.length; ) {
    const o = le(e, u);
    if (o < 16)
      r[a++] = o;
    else if (o === 16) {
      if (a === 0) throw new Error("invalid code length repeat");
      const l = r[a - 1];
      let p = 3 + e.bits(2);
      for (; p-- > 0 && a < r.length; ) r[a++] = l;
    } else o === 17 ? a += 3 + e.bits(3) : a += 11 + e.bits(7);
  }
  if (a > r.length) throw new Error("code length repeat overruns table");
  if (r[256] === 0) throw new Error("missing end-of-block code");
  return { lit: Z(r.subarray(0, t)), dist: Z(r.subarray(t)) };
}
function Ce(e, t = 0) {
  const n = new at(e, t), s = [];
  let i = 0;
  do {
    i = n.bits(1);
    const u = n.bits(2);
    if (u === 0) {
      if (n.alignByte(), n.pos + 4 > e.length) throw new Error("unexpected end of input");
      const r = e[n.pos] | e[n.pos + 1] << 8, a = e[n.pos + 2] | e[n.pos + 3] << 8;
      if (n.pos += 4, (r ^ 65535) !== a) throw new Error("invalid stored block length");
      if (n.pos + r > e.length) throw new Error("unexpected end of input");
      for (let o = 0; o < r; o++) s.push(e[n.pos++]);
    } else {
      const r = u === 1 ? ft() : ct(n);
      for (; ; ) {
        const a = le(n, r.lit);
        if (a < 256)
          s.push(a);
        else {
          if (a === 256)
            break;
          {
            const o = a - 257;
            if (o >= O.length) throw new Error("invalid length code");
            const l = O[o] + n.bits(x[o]), p = le(n, r.dist);
            if (p >= G.length) throw new Error("invalid distance code");
            const c = G[p] + n.bits(ee[p]);
            if (c > s.length) throw new Error("invalid distance too far back");
            let h = s.length - c;
            for (let m = 0; m < l; m++) s.push(s[h++]);
          }
        }
      }
    }
  } while (i !== 1);
  return n.alignByte(), { data: new Uint8Array(s), consumed: n.consumed };
}
class Ie {
  constructor() {
    this.buf = [], this.bitBuf = 0, this.bitCnt = 0;
  }
  /** Integer value, LSB-first (`extra` bits of length/distance codes). */
  put(t, n) {
    for (this.bitBuf |= (t & (1 << n) - 1) << this.bitCnt, this.bitCnt += n; this.bitCnt >= 8; )
      this.buf.push(this.bitBuf & 255), this.bitBuf >>>= 8, this.bitCnt -= 8;
  }
  /** Huffman code, MSB-first (RFC 1951 §3.1.1). */
  putCode(t, n) {
    for (let s = n - 1; s >= 0; s--) this.put(t >>> s & 1, 1);
  }
  alignByte() {
    this.bitCnt !== 0 && this.put(0, 8 - this.bitCnt);
  }
  bytes() {
    return this.alignByte(), new Uint8Array(this.buf);
  }
}
function pe(e) {
  const t = new Int32Array(e.length), n = new Int32Array(16);
  for (let i = 0; i < e.length; i++) n[e[i]]++;
  n[0] = 0;
  let s = 0;
  for (let i = 1; i <= 15; i++) {
    s <<= 1;
    for (let u = 0; u < e.length; u++)
      e[u] === i && (t[u] = s++);
  }
  return t;
}
const dt = 32768, W = 3, me = 258, ht = 128, pt = 15, ke = 1 << pt, oe = (e, t) => (e[t] << 10 ^ e[t + 1] << 5 ^ e[t + 2]) & ke - 1;
function mt(e) {
  const t = new Ie(), n = pe(Ee), s = pe(new Uint8Array(30).fill(5)), i = (l) => l <= 143 ? 8 : l <= 255 ? 9 : l <= 279 ? 7 : 8;
  t.put(1, 1), t.put(1, 2);
  const u = new Int32Array(ke).fill(-1), r = new Int32Array(e.length), a = (l, p) => {
    const c = Math.min(me, e.length - l);
    let h = 0;
    for (; h < c && e[p + h] === e[l + h]; ) h++;
    return h;
  };
  let o = 0;
  for (; o < e.length; ) {
    let l = W - 1, p = 0;
    if (o + W <= e.length) {
      const c = oe(e, o);
      let h = u[c], m = ht;
      const g = Math.min(dt, o);
      for (; h >= 0 && o - h <= g && m-- > 0; ) {
        const d = a(o, h);
        if (d > l && (l = d, p = o - h, d >= me))
          break;
        h = r[h];
      }
    }
    if (l >= W) {
      const { code: c, extra: h, value: m } = it(l);
      t.putCode(n[c], i(c)), h !== 0 && t.put(m, h);
      const { code: g, extra: d, value: f } = ot(p);
      t.putCode(s[g], 5), d !== 0 && t.put(f, d);
      for (let w = 0; w < l; w++) {
        const b = o + w;
        if (b + W <= e.length) {
          const z = oe(e, b);
          r[b] = u[z], u[z] = b;
        }
      }
      o += l;
    } else {
      if (t.putCode(n[e[o]], i(e[o])), o + W <= e.length) {
        const c = oe(e, o);
        r[o] = u[c], u[c] = o;
      }
      o++;
    }
  }
  return t.putCode(n[256], 7), t.bytes();
}
function ge(e) {
  const t = new Ie();
  let n = 0;
  do {
    const s = Math.min(65535, e.length - n);
    t.put(n + s >= e.length ? 1 : 0, 1), t.put(0, 2), t.alignByte(), t.put(s & 255, 8), t.put(s >>> 8 & 255, 8), t.put(~s & 255, 8), t.put(~s >>> 8 & 255, 8);
    for (let i = 0; i < s; i++) t.put(e[n + i], 8);
    n += s;
  } while (n < e.length);
  return t.bytes();
}
function Ne(e) {
  if (e.length === 0) return ge(e);
  const t = mt(e), n = e.length + 5 * Math.ceil(e.length / 65535);
  return t.length <= n ? t : ge(e);
}
function fe(e) {
  const t = [31, 139, 8, 0, 0, 0, 0, 0, 0, 3], n = Ne(e);
  for (const s of n) t.push(s);
  return S(t, X(e)), S(t, e.length >>> 0), new Uint8Array(t);
}
class C extends Error {
}
function j(e) {
  if (e.length < 18 || e[0] !== 31 || e[1] !== 139)
    throw new C("not in gzip format");
  if (e[2] !== 8) throw new C("unknown compression method");
  const t = e[3];
  if (t & 224) throw new C("unsupported flags set");
  let n = 10;
  if (t & 4) {
    if (n + 2 > e.length) throw new C("truncated header");
    n += 2 + R(e, n);
  }
  const s = () => {
    for (; n < e.length && e[n] !== 0; ) n++;
    n++;
  };
  if (t & 8 && s(), t & 16 && s(), t & 2) {
    if (n + 2 > e.length) throw new C("truncated header");
    const o = R(e, n);
    if ((X(e.subarray(0, n)) & 65535) !== o) throw new C("header checksum error");
    n += 2;
  }
  if (n > e.length - 8) throw new C("unexpected end of input");
  let i;
  try {
    i = Ce(e, n);
  } catch (o) {
    throw new C(o instanceof Error ? o.message : "invalid compressed data");
  }
  const u = n + i.consumed + 8, r = k(e, n + i.consumed), a = k(e, n + i.consumed + 4);
  if (X(i.data) !== r) throw new C("invalid compressed data--crc error");
  if (i.data.length >>> 0 !== a) throw new C("invalid compressed data--length error");
  return { raw: i.data, end: u };
}
const M = 512;
function _(e, t) {
  const n = Math.max(1, t - 1);
  if (e >= 8 ** n) throw new Error("value too large for ustar field");
  return [...e.toString(8).padStart(n, "0")].map((s) => s.charCodeAt(0)).concat(0);
}
function we(e, t) {
  const n = [...e].map((s) => s.charCodeAt(0));
  return n.length > t ? null : n;
}
function gt(e) {
  if (e.length <= 100) return { prefix: "", base: e };
  if (e.length > 255) return null;
  let t = e.length - 101;
  for (; t > 0 && e[t] !== "/"; ) t--;
  if (t <= 0) return null;
  const n = e.slice(t + 1);
  return n.length > 100 || t > 155 ? null : { prefix: e.slice(0, t), base: n };
}
function wt(e) {
  const t = [];
  for (const n of e) {
    const i = (n.type === "dir" && !n.name.endsWith("/") ? n.name + "/" : n.name).replace(/^\/+/, "");
    if (i === "" || i === ".") throw new Error("cannot archive the root");
    const u = gt(i);
    if (u === null) throw new Error(`${i}: name too long to be stored in a ustar archive`);
    const r = new Array(M).fill(0), a = (p, c) => {
      for (const [h, m] of p.entries()) r[c + h] = m;
    }, o = we(u.base, 100);
    if (o === null) throw new Error(`${i}: name too long to be stored in a ustar archive`);
    a(o, 0), a(_(n.mode & 4095, 8), 100), a(_(0, 8), 108), a(_(0, 8), 116), a(_(n.type === "file" ? n.data?.length ?? 0 : 0, 12), 124), a(_(Math.floor(n.mtime), 12), 136), r.fill(32, 148, 156), r[156] = n.type === "dir" ? 53 : 48, a([..."ustar\x0000"].map((p) => p.charCodeAt(0)), 257), a(we(u.prefix, 155) ?? [], 345);
    let l = 0;
    for (const p of r) l += p;
    if (a([...l.toString(8).padStart(6, "0")].map((p) => p.charCodeAt(0)).concat(0, 32), 148), t.push(...r), n.type === "file" && n.data !== void 0) {
      for (const c of n.data) t.push(c);
      const p = (M - n.data.length % M) % M;
      for (let c = 0; c < p; c++) t.push(0);
    }
  }
  for (let n = 0; n < M * 2; n++) t.push(0);
  return new Uint8Array(t);
}
function bt(e, t) {
  for (let n = t; n < t + M; n++) if (e[n] !== 0) return !1;
  return !0;
}
function V(e, t, n) {
  let s = "";
  for (let i = t; i < n && e[i] !== 0; i++)
    s += String.fromCharCode(e[i]);
  return s;
}
function K(e, t, n) {
  let s = 0, i = !1;
  for (let u = 0; u < n; u++) {
    const r = e[t + u];
    if (r === 0 || r === 32) break;
    if (r < 48 || r > 55) throw new Error("invalid octal field in ustar header");
    s = s * 8 + (r - 48), i = !0;
  }
  return i ? s : 0;
}
function vt(e) {
  const t = [];
  let n = 0, s = null, i = null;
  for (; n + M <= e.length && !bt(e, n); ) {
    const u = n, r = String.fromCharCode(e[n + 156]);
    let a = V(e, n, n + 100);
    const o = V(e, n + 345, n + 500);
    o !== "" && (a = o + "/" + a);
    const l = K(e, n + 124, 12), p = K(e, n + 148, 7);
    let c = 0;
    for (let f = 0; f < M; f++) c += f >= 148 && f < 156 ? 32 : e[n + f];
    if (c !== p) throw new Error("header checksum error");
    const h = n + M, m = h + l;
    if (m > e.length) throw new Error("unexpected end of archive");
    const g = e.subarray(h, m);
    if (n = h + l + (M - l % M) % M, r === "L") {
      s = V(g, 0, g.length);
      continue;
    }
    if (r === "x" || r === "X" || r === "g") {
      const f = V(g, 0, g.length);
      for (const w of f.split(`
`)) {
        const b = /^\d+ (?:[^=]+)=(.*)$/.exec(w);
        b !== null && w.slice(w.indexOf(" ") + 1).startsWith("path=") && r !== "g" && (i = b[1]);
      }
      continue;
    }
    const d = r === "5" ? "dir" : r === "0" || r === "\0" ? "file" : "link";
    a = i ?? s ?? a, d === "dir" && !a.endsWith("/") && (a += "/"), i = null, s = null, t.push({
      name: a,
      type: d,
      mode: K(e, u + 100, 8),
      size: l,
      mtime: K(e, u + 136, 12),
      data: d === "file" ? new Uint8Array(g) : null
    });
  }
  return t;
}
const Me = 67324752, Re = 33639248, Fe = 101010256, zt = (e) => ({
  dosTime: e.getHours() << 11 | e.getMinutes() << 5 | e.getSeconds() >> 1,
  dosDate: Math.max(1980, e.getFullYear()) - 1980 << 9 | e.getMonth() + 1 << 5 | e.getDate()
});
function yt(e) {
  const t = [], n = [];
  let s = 0;
  for (const r of e) {
    const a = [...r.name].map((d) => d.charCodeAt(0) & 255), { dosTime: o, dosDate: l } = zt(/* @__PURE__ */ new Date()), p = X(r.data);
    let c = 0, h = r.data;
    if (!r.store && r.data.length > 0) {
      const d = Ne(r.data);
      d.length < r.data.length && (c = 8, h = d);
    }
    const m = (r.mode & 65535) << 16 | (r.name.endsWith("/") ? 16 : 0), g = s;
    S(t, Me), v(t, 20), v(t, 0), v(t, c), v(t, o), v(t, l), S(t, p), S(t, h.length), S(t, r.data.length), v(t, a.length), v(t, 0);
    for (const d of a) t.push(d);
    for (const d of h) t.push(d);
    s = t.length, S(n, Re), v(n, 788), v(n, 20), v(n, 0), v(n, c), v(n, o), v(n, l), S(n, p), S(n, h.length), S(n, r.data.length), v(n, a.length), v(n, 0), v(n, 0), v(n, 0), v(n, 0), S(n, m), S(n, g);
    for (const d of a) n.push(d);
  }
  const i = t.length;
  for (const r of n) t.push(r);
  const u = t.length - i;
  return S(t, Fe), v(t, 0), v(t, 0), v(t, e.length), v(t, e.length), S(t, u), S(t, i), v(t, 0), new Uint8Array(t);
}
class N extends Error {
}
function He(e) {
  const t = Math.max(0, e.length - 22 - 65535);
  let n = -1;
  for (let a = e.length - 22; a >= t; a--)
    if (k(e, a) === Fe) {
      n = a;
      break;
    }
  if (n < 0) throw new N("End-of-central-directory signature not found (not a zip file, or unsupported trailing data)");
  const s = R(e, n + 10);
  let i = k(e, n + 16);
  const u = i + k(e, n + 12);
  if (u > n || i + 46 > e.length) throw new N("bad central directory offset");
  const r = [];
  for (let a = 0; a < s; a++) {
    if (k(e, i) !== Re) throw new N("bad central directory entry");
    const o = R(e, i + 28), l = R(e, i + 30), p = R(e, i + 32);
    let c = "";
    for (let h = 0; h < o; h++) c += String.fromCharCode(e[i + 46 + h]);
    if (r.push({
      name: c,
      method: R(e, i + 10),
      crc: k(e, i + 16),
      csize: k(e, i + 20),
      usize: k(e, i + 24),
      dosTime: R(e, i + 12),
      dosDate: R(e, i + 14),
      mode: k(e, i + 38) >>> 16,
      isDir: c.endsWith("/") || (k(e, i + 38) & 16) !== 0,
      localOffset: k(e, i + 42)
    }), i += 46 + o + l + p, i > u) throw new N("central directory overrun");
  }
  return r;
}
function Le(e, t) {
  if (t.localOffset + 30 > e.length || k(e, t.localOffset) !== Me)
    throw new N(`${t.name}: bad local header`);
  const n = R(e, t.localOffset + 26), s = R(e, t.localOffset + 28), i = t.localOffset + 30 + n + s;
  if (i + t.csize > e.length) throw new N(`${t.name}: truncated entry data`);
  const u = e.subarray(i, i + t.csize);
  if (t.method === 0) {
    if (u.length !== t.usize) throw new N(`${t.name}: stored size mismatch`);
    return new Uint8Array(u);
  }
  if (t.method === 8) {
    let r;
    try {
      r = Ce(u).data;
    } catch (a) {
      throw new N(`${t.name}: ${a instanceof Error ? a.message : "deflate error"}`);
    }
    if (r.length !== t.usize) throw new N(`${t.name}: size mismatch after inflate`);
    return r;
  }
  throw new N(`${t.name}: unsupported compression method ${t.method}`);
}
const E = (e) => Ae.commands.find((t) => t.name === e).usage;
function T(e, t) {
  const n = [];
  let s = !1;
  for (const i of e) {
    if (s || i.length <= 2 || i[0] !== "-" || i[1] === "-" || /^-\d+$/.test(i)) {
      i === "--" && !s && (s = !0), n.push(i);
      continue;
    }
    if (t.includes(i[1]))
      n.push("-" + i[1], i.slice(2));
    else
      for (const u of i.slice(1)) n.push("-" + u);
  }
  return n;
}
function U(e, t, n) {
  n.startsWith("--") ? e.err(`${t}: unrecognized option '${n}'`) : e.err(`${t}: invalid option -- '${n.replace(/^-+/, "")}'`), e.err(`Try '${t} --help' for more information.`), e.exit(2);
}
function ne(e, t, n) {
  e.err(`${t}: ${n}: No such file or directory`), e.exit(1);
}
function Pe(e, t, n) {
  const s = e.vfs.resolve(e.state.cwd, n), i = e.vfs.nodeAt(s);
  return i ? i.kind === "dir" ? (e.err(`${t}: ${n}: Is a directory`), e.exit(1), null) : I(i.content) : (ne(e, t, n), null);
}
const be = () => Math.floor(Date.now() / 1e3);
function $t(e, t) {
  const n = (i, u) => e & i ? u : "-", s = (i, u, r) => n(i, "r") + n(u, "w") + n(r, "x");
  return (t ? "d" : "-") + s(256, 128, 64) + s(32, 16, 8) + s(4, 2, 1);
}
const D = (e) => String(e).padStart(2, "0");
function At(e) {
  const t = new Date(e * 1e3);
  return `${t.getFullYear()}-${D(t.getMonth() + 1)}-${D(t.getDate())} ${D(t.getHours())}:${D(t.getMinutes())}`;
}
const St = {
  name: "base64",
  usage: E("base64"),
  complete: (e) => ["-d", "--decode", "-w", "--wrap", "-i", "--ignore-garbage", "--help"].filter((t) => t.startsWith(e.word)),
  run(e) {
    const t = T(e.args, "w");
    let n = !1, s = 76, i = !1;
    const u = [];
    for (let a = 0; a < t.length; a++) {
      const o = t[a];
      if (o === "--") {
        u.push(...t.slice(a + 1));
        break;
      }
      if (o === "-d" || o === "--decode") n = !0;
      else if (o === "-i" || o === "--ignore-garbage") i = !0;
      else if (o === "-w" || o === "--wrap") s = Number(t[++a] ?? "");
      else if (o.startsWith("--wrap=")) s = Number(o.slice(7));
      else if (o === "--help" || o === "-h") {
        e.out(E("base64")), e.out("Encode (-d decodes): 76-column output, 0 disables wrapping.");
        return;
      } else if (o.startsWith("-") && o !== "-") {
        U(e, "base64", o);
        return;
      } else u.push(o);
    }
    if (!Number.isInteger(s) || s < 0) {
      e.err("base64: invalid wrap size"), e.exit(1);
      return;
    }
    let r = "";
    if (u.length === 0) {
      if (e.stdin === null) {
        e.err("base64: no input (pipe one in, or name a file)"), e.exit(1);
        return;
      }
      r = e.stdin;
    } else {
      const a = [];
      for (const o of u) {
        const l = e.vfs.resolve(e.state.cwd, o), p = o === "-" ? e.stdin ?? "" : e.vfs.read(l);
        if (p === null) {
          ne(e, "base64", o);
          return;
        }
        a.push(p);
      }
      r = a.join("");
    }
    if (n) {
      const a = Ze(r, i);
      if (typeof a == "string") {
        e.err(`base64: ${a}`), e.exit(1);
        return;
      }
      e.out(F(a));
      return;
    }
    for (const a of _e(I(r), s)) e.out(a);
  }
};
function Et(e, t, n) {
  const s = { check: !1, binary: !1, tag: !1 }, i = [], u = T(e.args, n);
  let r = !1;
  for (let a = 0; a < u.length; a++) {
    const o = u[a];
    if (r || o === "-" || !o.startsWith("-")) {
      i.push(o);
      continue;
    }
    if (o === "--")
      r = !0;
    else if (o === "-c" || o === "--check") s.check = !0;
    else if (o === "-b" || o === "--binary") s.binary = !0;
    else if (o === "-t" || o === "--text") s.binary = !1;
    else if (o === "--tag") s.tag = !0;
    else return o === "--help" || o === "-h" ? (e.out(E(t)), e.out("-c verifies a checksum file (name: OK / FAILED), -b marks binary."), null) : (U(e, t, o), null);
  }
  return { opts: s, operands: i };
}
function q(e) {
  const t = `${e}sum`;
  return {
    name: t,
    usage: E(t),
    complete: (n) => ["-c", "--check", "-b", "--binary", "-t", "--text", "--tag", "--help"].filter((s) => s.startsWith(n.word)),
    run(n) {
      const s = Et(n, t, "");
      if (s === null) return;
      const { opts: i, operands: u } = s;
      if (!i.check) {
        const g = i.binary ? " *" : "  ", d = (f, w) => i.tag ? `${e.toUpperCase()} (${w}) = ${f}` : `${f}${g}${w}`;
        if (u.length === 0) {
          if (n.stdin === null) {
            n.err(`${t}: no input (pipe one in, or name a file)`), n.exit(1);
            return;
          }
          n.out(d(se(ie(e, I(n.stdin))), "-"));
          return;
        }
        for (const f of u) {
          const w = Pe(n, t, f);
          w !== null && n.out(d(se(ie(e, w)), f));
        }
        return;
      }
      const r = [];
      if (u.length === 0) {
        if (n.stdin === null) {
          n.err(`${t}: no checksum file (pipe one in, or name one)`), n.exit(1);
          return;
        }
        r.push(n.stdin);
      } else
        for (const g of u) {
          const d = n.vfs.read(n.vfs.resolve(n.state.cwd, g));
          if (d === null) {
            ne(n, t, g);
            return;
          }
          r.push(d);
        }
      const a = st[e], o = new RegExp(`^([0-9a-fA-F]{${a}}) ([ *])(.+)$`), l = new RegExp(`^${e.toUpperCase()} \\((.+)\\) = ([0-9a-fA-F]{${a}})$`);
      let p = 0, c = 0, h = 0, m = 0;
      for (const g of r)
        for (const d of g.split(`
`)) {
          if (d === "") continue;
          const f = d.replace(/\\(.)/g, "$1"), w = o.exec(f), b = w === null ? l.exec(f) : null, z = w !== null ? w[1] : b !== null ? b[2] : null, y = w !== null ? w[3] : b !== null ? b[1] : null;
          if (z === null || y === null) {
            m++;
            continue;
          }
          const $ = n.vfs.read(n.vfs.resolve(n.state.cwd, y));
          if ($ === null) {
            n.err(`${t}: ${y}: No such file or directory`), n.err(`${y}: FAILED open or read`), h++;
            continue;
          }
          se(ie(e, I($))) === z.toLowerCase() ? (n.out(`${y}: OK`), p++) : (n.out(`${y}: FAILED`), c++);
        }
      h > 0 && n.err(`${t}: WARNING: ${h} listed ${h === 1 ? "file" : "files"} could not be read`), c > 0 ? n.err(`${t}: WARNING: ${c} computed checksum${c === 1 ? " did" : "s did"} NOT match`) : m > 0 && p + h > 0 ? n.err(`${t}: WARNING: ${m} lines are improperly formatted`) : m > 0 && p + c + h === 0 && n.err(`${t}: no properly formatted checksum lines`), c + h > 0 ? n.exit(1) : m > 0 && n.exit(2);
    }
  };
}
const Ct = [".gz", ".tgz", ".taz"], It = [".gz", ".tgz", ".taz", ".z", ".Z", ".bz2", ".bz", ".zip", ".xz", ".lzma"];
function ae(e, t, n, s = 1) {
  const i = n instanceof Error ? n.message : String(n);
  e.err(`gzip: ${t}: ${i}`), e.exit(s);
}
function ve(e, t) {
  return e === 0 ? "  0.0" : ((1 - t / e) * 100).toFixed(1).padStart(5, " ");
}
function ue(e, t, n) {
  const s = { stdout: !1, decompress: !1, keep: !1, test: !1, verbose: !1, force: !1, ...n }, i = [], u = T(e.args, "");
  for (let o = 0; o < u.length; o++) {
    const l = u[o];
    if (l === "--") {
      i.push(...u.slice(o + 1));
      break;
    }
    if (l === "-c" || l === "--stdout" || l === "--to-stdout") s.stdout = !0;
    else if (l === "-d" || l === "--decompress" || l === "--uncompress") s.decompress = !0;
    else if (l === "-k" || l === "--keep") s.keep = !0;
    else if (l === "-t" || l === "--test") s.test = !0;
    else if (l === "-v" || l === "--verbose") s.verbose = !0;
    else if (l === "-f" || l === "--force") s.force = !0;
    else if (!(/^-[1-9]$/.test(l) || l === "--fast" || l === "--best")) if (l === "--help" || l === "-h") {
      e.out(E(t)), e.out("-c stdout, -d decompress, -k keep, -t test, -v verbose; -1..-9 accepted.");
      return;
    } else if (l === "-r" || l === "--recursive") {
      e.err(`gzip: ${t}: -r is not supported — name the files (the VFS has no globbing here)`), e.exit(2);
      return;
    } else if (l.startsWith("-") && l !== "-") {
      U(e, t, l);
      return;
    } else i.push(l);
  }
  const r = (o, l) => {
    const p = o.length - l;
    return p === 0 || p === 1 && o[l] === 10;
  }, a = (o, l) => {
    try {
      const { raw: p, end: c } = j(l);
      e.out(F(p)), r(l, c) || (e.err(`gzip: ${o}: decompression OK, trailing garbage ignored`), e.exit(2));
    } catch (p) {
      if (p instanceof C) {
        ae(e, o, p);
        return;
      }
      throw p;
    }
  };
  if (i.length === 0) {
    if (e.stdin === null) {
      e.err(`${t}: no input (pipe one in, or name a file)`), e.exit(1);
      return;
    }
    if (s.test) {
      e.err("gzip: --test operates on files, not stdin"), e.exit(1);
      return;
    }
    if (s.decompress) {
      a("stdin", I(e.stdin));
      return;
    }
    e.out(F(fe(I(e.stdin))));
    return;
  }
  for (const o of i) {
    const l = e.vfs.resolve(e.state.cwd, o), p = e.vfs.nodeAt(l);
    if (!p) {
      ne(e, "gzip", o);
      continue;
    }
    if (p.kind === "dir") {
      e.err(`gzip: ${o}: Is a directory`), e.exit(1);
      continue;
    }
    const c = I(p.content);
    if (s.test) {
      try {
        j(c);
      } catch (g) {
        if (g instanceof C) {
          ae(e, o, g);
          continue;
        }
        throw g;
      }
      continue;
    }
    if (!s.decompress) {
      const g = o.toLowerCase();
      if (Ct.some((w) => g.endsWith(w))) {
        e.err(`gzip: ${o} already has .gz suffix -- unchanged`), e.exit(2);
        continue;
      }
      if (It.some((w) => g.endsWith(w)) && !s.force) {
        e.err(`gzip: ${o} has a reserved archive suffix (use -f to compress anyway)`), e.exit(2);
        continue;
      }
      const d = fe(c), f = o + ".gz";
      if (s.stdout) {
        e.out(F(d));
        continue;
      }
      e.vfs.mountFile(l + ".gz", F(d)), s.verbose && e.err(`${o}: ${ve(c.length, d.length)}% -- replaced with ${f}`), s.keep || e.vfs.rm(l);
      continue;
    }
    const h = o.toLowerCase(), m = h.endsWith(".tgz") || h.endsWith(".taz") ? o.slice(0, -4) + ".tar" : h.endsWith(".gz") ? o.slice(0, -3) : null;
    if (m === null) {
      e.err(`gzip: ${o}: unknown suffix -- ignored`), e.exit(2);
      continue;
    }
    try {
      const { raw: g, end: d } = j(c), f = F(g);
      s.stdout ? e.out(f) : (e.vfs.mountFile(e.vfs.resolve(e.state.cwd, m), f), s.verbose && e.err(`${o}: ${ve(c.length, g.length)}% -- replaced with ${m}`), s.keep || e.vfs.rm(l)), r(c, d) || (e.err(`gzip: ${o}: decompression OK, trailing garbage ignored`), e.exit(2));
    } catch (g) {
      if (g instanceof C) {
        ae(e, o, g);
        continue;
      }
      throw g;
    }
  }
}
const ce = {
  name: "gzip",
  usage: E("gzip"),
  complete: (e) => ["-c", "-d", "-k", "-t", "-v", "-f", "--stdout", "--decompress", "--keep", "--test", "--help"].filter((t) => t.startsWith(e.word)),
  run: (e) => ue(e, "gzip", {})
}, kt = {
  name: "gunzip",
  usage: E("gunzip"),
  complete: ce.complete,
  run: (e) => ue(e, "gunzip", { decompress: !0 })
}, Nt = {
  name: "zcat",
  usage: E("zcat"),
  complete: ce.complete,
  run: (e) => ue(e, "zcat", { decompress: !0, stdout: !0 })
};
function Mt(e) {
  const t = { mode: "create", file: null, verbose: !1, gzip: !1, dir: null, operands: [] };
  let n = null;
  const s = T(e.args, "fC");
  let i = !1;
  for (let u = 0; u < s.length; u++) {
    const r = s[u];
    if (i || r === "-" || !r.startsWith("-")) {
      t.operands.push(r);
      continue;
    }
    if (r === "--")
      i = !0;
    else if (r === "-c" || r === "--create") n = "create";
    else if (r === "-x" || r === "--extract" || r === "--get") n = "extract";
    else if (r === "-t" || r === "--list") n = "list";
    else if (r === "-f" || r === "--file") t.file = s[++u] ?? null;
    else if (r.startsWith("--file=")) t.file = r.slice(7);
    else if (r === "-v" || r === "--verbose") t.verbose = !0;
    else if (r === "-z" || r === "--gzip" || r === "--gunzip") t.gzip = !0;
    else if (r === "-C" || r === "--directory") t.dir = s[++u] ?? null;
    else if (r.startsWith("--directory=")) t.dir = r.slice(12);
    else return r === "--help" || r === "-h" ? (e.out(E("tar")), e.out("One of -c/-x/-t, then -f ARCHIVE (- = stdin/stdout), -v, -z, -C DIR."), null) : ["-r", "-u", "-A", "-d", "--append", "--update", "--diff", "--compare", "--delete"].includes(r) ? (e.err(`tar: ${r}: not supported (create, list and extract only)`), e.exit(2), null) : (U(e, "tar", r), null);
  }
  return n === null ? (e.err("tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options"), e.exit(2), null) : (t.mode = n, t);
}
function Rt(e, t) {
  return t !== null && t !== "-" ? Pe(e, "tar", t) : e.stdin === null ? (e.err("tar: no archive (use -f ARCHIVE, or pipe one in)"), e.exit(2), null) : I(e.stdin);
}
function ze(e, t) {
  return t.length === 0 ? !0 : t.some((n) => {
    const s = n.endsWith("/") ? n : n + "/";
    return e === n || e === s || e.startsWith(s);
  });
}
function De(e) {
  const t = e.startsWith("/");
  return { name: e.replace(/^\/+/, ""), stripped: t };
}
function Be(e, t, n, s, i) {
  const u = e.vfs.nodeAt(t);
  if (!u)
    return e.err(`tar: ${t}: Cannot stat: No such file or directory`), !1;
  if (u.kind === "file")
    return s.push({ name: n, type: "file", data: I(u.content), mode: 420, mtime: be() }), i && e.out(n), !0;
  s.push({ name: n.endsWith("/") ? n : n + "/", type: "dir", mode: 493, mtime: be() }), i && e.out(n.endsWith("/") ? n : n + "/");
  let r = !0;
  for (const a of e.vfs.list(t)) {
    const o = (n.endsWith("/") ? n.slice(0, -1) : n) + "/" + a.name;
    Be(e, t === "/" ? `/${a.name}` : `${t}/${a.name}`, o, s, i) || (r = !1);
  }
  return r;
}
const Ft = {
  name: "tar",
  usage: E("tar"),
  complete: (e) => ["-c", "-x", "-t", "-f", "-v", "-z", "-C", "--create", "--extract", "--list", "--file", "--gzip", "--directory", "--help"].filter((t) => t.startsWith(e.word)),
  run(e) {
    const t = Mt(e);
    if (t === null) return;
    const n = () => {
      e.exit(2);
    };
    if (t.mode === "create") {
      if (t.operands.length === 0) {
        e.err("tar: Cowardly refusing to create an empty archive"), n();
        return;
      }
      const a = [];
      let o = !1;
      for (const p of t.operands) {
        if (p === "-") {
          e.err('tar: "-" is not a file operand here'), n();
          return;
        }
        const c = t.dir !== null ? e.vfs.resolve(e.state.cwd, t.dir) : e.state.cwd, h = e.vfs.resolve(c, p), m = h.startsWith(c === "/" ? "/" : c + "/") ? h.slice(c === "/" ? 1 : c.length + 1) : p, g = De(m);
        if (g.stripped && !o && (e.err("tar: Removing leading `/' from member names"), o = !0), g.name === "") {
          e.err("tar: cannot archive the root directory"), n();
          return;
        }
        Be(e, h, g.name, a, t.verbose) || n();
      }
      let l = wt(a);
      t.gzip && (l = fe(l)), t.file !== null && t.file !== "-" ? e.vfs.mountFile(e.vfs.resolve(e.state.cwd, t.file), F(l)) : e.out(F(l));
      return;
    }
    const s = Rt(e, t.file);
    if (s === null) return;
    let i = s;
    if (t.gzip || s.length > 2 && s[0] === 31 && s[1] === 139)
      try {
        i = j(s).raw;
      } catch (a) {
        if (a instanceof C) {
          e.err(`tar: ${a.message}`), n();
          return;
        }
        throw a;
      }
    let u;
    try {
      u = vt(i);
    } catch (a) {
      e.err(`tar: ${a instanceof Error ? a.message : String(a)}`), n();
      return;
    }
    for (const a of t.operands)
      if (!u.some((o) => ze(o.name, [a]))) {
        e.err(`tar: ${a}: Not found in archive`), e.err("tar: Exiting with failure status due to previous errors"), n();
        return;
      }
    const r = t.dir !== null ? e.vfs.resolve(e.state.cwd, t.dir) : e.state.cwd;
    for (const a of u) {
      if (!ze(a.name, t.operands)) continue;
      const o = a.name.replace(/\/+$/, "");
      if (t.mode === "list") {
        if (t.verbose) {
          const p = a.type === "dir" ? 0 : a.size;
          e.out(`${$t(a.mode, a.type === "dir")} 0/0 ${String(p).padStart(8)} ${At(a.mtime)} ${a.name}`);
        } else
          e.out(a.name);
        continue;
      }
      if (a.name.startsWith("/") || a.name.split("/").includes("..")) {
        e.err(`tar: ${a.name}: Member name contains '..'`), n();
        continue;
      }
      if (a.type === "link") {
        e.err(`tar: ${o}: skipping (the VFS has no links)`), n();
        continue;
      }
      const l = e.vfs.resolve(r, o);
      a.type === "dir" ? e.vfs.mkdir(l, { parents: !0 }) : e.vfs.mountFile(l, F(a.data ?? new Uint8Array())), t.verbose && e.out(o);
    }
  }
}, Ht = {
  name: "zip",
  usage: E("zip"),
  complete: (e) => ["-r", "-q", "-0", "-9", "--help"].filter((t) => t.startsWith(e.word)),
  run(e) {
    let t = !1, n = !1, s = !1;
    const i = [], u = T(e.args, "");
    for (const d of u) {
      if (d === "--") {
        i.push(...u.slice(u.indexOf(d) + 1));
        break;
      }
      if (d === "-r") t = !0;
      else if (d === "-q") n = !0;
      else if (d === "-0") s = !0;
      else if (!(d === "-9" || d === "-1")) if (d === "-e" || d.startsWith("--")) {
        if (d === "--help" || d === "-h") {
          e.out(E("zip")), e.out("ARCHIVE first; -r recurses, -0 stores, -q quiets. No encryption.");
          return;
        }
        e.err(d === "-e" ? "zip: encryption is not supported" : `zip: unsupported option ${d}`), e.exit(16);
        return;
      } else if (d.startsWith("-") && d !== "-") {
        U(e, "zip", d);
        return;
      } else i.push(d);
    }
    const [r, ...a] = i;
    if (r === void 0 || a.length === 0) {
      e.err(`zip: usage: ${E("zip")}`), e.exit(16);
      return;
    }
    const o = e.vfs.resolve(e.state.cwd, r);
    if (e.vfs.nodeAt(o)?.kind === "dir") {
      e.err(`zip: ${r}: Is a directory`), e.exit(2);
      return;
    }
    const l = /* @__PURE__ */ new Map(), p = e.vfs.read(o);
    if (p !== null)
      try {
        for (const d of He(I(p))) {
          const f = Le(I(p), d);
          l.set(d.name, { name: d.name, data: f, mode: d.mode || (d.isDir ? 493 : 420), store: !0 });
        }
      } catch (d) {
        e.err(`zip: ${r}: ${d instanceof N ? d.message : "not a zip archive (refusing to overwrite)"}`), e.exit(2);
        return;
      }
    let c = 0, h = !1;
    const m = (d) => {
      const f = e.vfs.resolve(e.state.cwd, d), w = e.vfs.nodeAt(f);
      if (!w) {
        e.err(`zip warning: name not matched: ${d}`);
        return;
      }
      const b = De(d);
      if (b.stripped && !h && (e.err("zip: stripping leading `/' from member names"), h = !0), w.kind === "file") {
        l.set(b.name, { name: b.name, data: I(w.content), mode: 420, store: s }), n || e.out(`  adding: ${b.name} (${s ? "stored" : "deflated"})`), c++;
        return;
      }
      if (!t) {
        l.set(b.name.endsWith("/") ? b.name : b.name + "/", { name: b.name.endsWith("/") ? b.name : b.name + "/", data: new Uint8Array(), mode: 493, store: !0 }), n || e.out(`  adding: ${b.name}/ (stored 0%)`), c++;
        return;
      }
      const z = (y, $) => {
        l.set($ + "/", { name: $ + "/", data: new Uint8Array(), mode: 493, store: !0 }), n || e.out(`  adding: ${$}/ (stored 0%)`);
        for (const A of e.vfs.list(y)) {
          const de = y === "/" ? `/${A.name}` : `${y}/${A.name}`;
          if (A.kind === "dir") z(de, $ + "/" + A.name);
          else {
            const Oe = e.vfs.read(de) ?? "", re = $ + "/" + A.name;
            l.set(re, { name: re, data: I(Oe), mode: 420, store: s }), n || e.out(`  adding: ${re} (${s ? "stored" : "deflated"})`);
          }
        }
      };
      z(f, b.name), c++;
    };
    for (const d of a) m(d);
    if (c === 0 && l.size === 0) {
      e.err(`zip error: Nothing to do! (${r})`), e.exit(12);
      return;
    }
    if (c === 0) {
      e.err(`zip warning: name not matched: nothing updated (${r})`), e.exit(12);
      return;
    }
    const g = yt([...l.values()]);
    e.vfs.mountFile(o, F(g));
  }
};
function ye(e, t) {
  return new RegExp(
    "^" + [...t].map((s) => s === "*" ? ".*" : s === "?" ? "." : s.replace(/[.+^${}()|[\]\\]/g, "\\$&")).join("") + "$"
  ).test(e);
}
const Lt = {
  name: "unzip",
  usage: E("unzip"),
  complete: (e) => ["-l", "-o", "-n", "-q", "-d", "--help"].filter((t) => t.startsWith(e.word)),
  run(e) {
    let t = !1, n = !1, s = !1, i = null;
    const u = [], r = T(e.args, "d");
    for (let d = 0; d < r.length; d++) {
      const f = r[d];
      if (f === "-l" || f === "--list") t = !0;
      else if (f === "-q" || f === "--quiet") n = !0;
      else if (!(f === "-o" || f === "--overwrite")) if (f === "-n" || f === "--never-overwrite") s = !0;
      else if (f === "-d" || f === "--exdir") i = r[++d] ?? null;
      else if (f === "--help" || f === "-h") {
        e.out(E("unzip")), e.out("ARCHIVE first, then member globs. -l lists, -d DIR extracts into DIR.");
        return;
      } else if (f.startsWith("-") && f !== "-") {
        U(e, "unzip", f);
        return;
      } else u.push(f);
    }
    const [a, ...o] = u;
    if (a === void 0) {
      e.err("UnZip 6.00: archive name required"), e.exit(10);
      return;
    }
    const l = e.vfs.resolve(e.state.cwd, a), p = e.vfs.read(l);
    if (p === null) {
      e.err(`unzip: cannot find ${a}`), e.exit(9);
      return;
    }
    const c = I(p);
    let h;
    try {
      h = He(c);
    } catch (d) {
      e.err(d instanceof N ? `unzip: cannot find zipfile directory in ${a} (${d.message})` : `unzip: ${a}: not a zip file`), e.exit(9);
      return;
    }
    const m = h.filter((d) => o.length === 0 || o.some((f) => ye(d.name, f)));
    for (const d of o)
      h.some((f) => ye(f.name, d)) || e.err(`caution: filename not matched: ${d}`);
    if (o.length > 0 && m.length === 0) {
      e.exit(11);
      return;
    }
    if (t) {
      e.out(`Archive:  ${a}`), e.out("  Length      Date    Time    Name"), e.out("---------  ---------- -----   ----");
      let d = 0, f = 0;
      for (const w of m) {
        const b = w.dosDate, z = w.dosTime, y = `${1980 + (b >> 9 & 127)}-${D(b >> 5 & 15)}-${D(b & 31)}`, $ = `${D(z >> 11 & 31)}:${D(z >> 5 & 63)}`;
        e.out(`${String(w.usize).padStart(9)}  ${y} ${$}   ${w.name}`), w.isDir || (d += w.usize, f++);
      }
      e.out("---------                   -------"), e.out(`${String(d).padStart(9)}                   ${f} ${f === 1 ? "file" : "files"}`);
      return;
    }
    const g = i !== null ? e.vfs.resolve(e.state.cwd, i) : e.state.cwd;
    for (const d of m) {
      if (d.name.startsWith("/") || d.name.split("/").includes("..")) {
        e.err(`unzip: ${d.name}: illegal member name (absolute or ..)`), e.exit(2);
        continue;
      }
      const f = e.vfs.resolve(g, d.name.replace(/\/+$/, ""));
      if (d.isDir) {
        e.vfs.mkdir(f, { parents: !0 });
        continue;
      }
      if (s && e.vfs.nodeAt(f) !== null) {
        n || e.out(`   skipping: ${d.name}`);
        continue;
      }
      try {
        const w = Le(c, d);
        e.vfs.mountFile(f, F(w)), n || e.out(`  ${d.method === 8 ? "inflating" : "extracting"}: ${d.name}`);
      } catch (w) {
        if (w instanceof N) {
          e.err(`unzip: ${w.message}`), e.exit(2);
          continue;
        }
        throw w;
      }
    }
  }
}, Pt = [
  St,
  q("md5"),
  q("sha1"),
  q("sha256"),
  q("sha512"),
  ce,
  kt,
  Nt,
  Ft,
  Ht,
  Lt
], Dt = {
  base64: [
    "base64 — encode/decode data as base64 (RFC 4648)",
    "",
    "SYNOPSIS",
    "  base64 [-d] [-w COLS] [-i] [file...]",
    "",
    "Encodes files (or stdin) with 76-column wrapping, like GNU coreutils;",
    "-w 0 disables wrapping, -i skips non-alphabet input bytes when",
    "decoding, -d decodes (newlines in the input are structure, not data).",
    "",
    "VFS note: file content is a string; text encodes as its UTF-8 bytes",
    "(matching GNU on real text) and binary strings — char codes ≤ 0xff —",
    "encode 1:1, so archives round-trip byte for byte."
  ],
  md5sum: [
    "md5sum — MD5 message digest (RFC 1321)",
    "",
    "SYNOPSIS",
    "  md5sum [-b | -t] [--tag] [file...]   ·   md5sum -c CHECKFILE",
    "",
    'Prints "<digest>  <name>" per file (`-` for stdin; ` *` with -b,',
    "BSD-style --tag lines also available). -c verifies a listing:",
    "<name>: OK / <name>: FAILED per line, exit 0/1/2 like GNU (1 =",
    "mismatch or unreadable, 2 = improperly formatted lines). The digest",
    "is a pure implementation cross-checked against WebCrypto in tests."
  ],
  sha1sum: [
    "sha1sum — SHA-1 message digest (FIPS 180-4)",
    "",
    "SYNOPSIS",
    "  sha1sum [-b | -t] [--tag] [file...]   ·   sha1sum -c CHECKFILE",
    "",
    "Same shape as md5sum — see that page; the digest is 40 hex digits."
  ],
  sha256sum: [
    "sha256sum — SHA-256 message digest (FIPS 180-4)",
    "",
    "SYNOPSIS",
    "  sha256sum [-b | -t] [--tag] [file...]   ·   sha256sum -c CHECKFILE",
    "",
    "Same shape as md5sum — see that page; the digest is 64 hex digits."
  ],
  sha512sum: [
    "sha512sum — SHA-512 message digest (FIPS 180-4)",
    "",
    "SYNOPSIS",
    "  sha512sum [-b | -t] [--tag] [file...]   ·   sha512sum -c CHECKFILE",
    "",
    "Same shape as md5sum — see that page; the digest is 128 hex digits."
  ],
  gzip: [
    "gzip — compress files in the gzip format (RFC 1952)",
    "",
    "SYNOPSIS",
    "  gzip [-cdfktv] [-1..-9] [file...]",
    "",
    "File mode replaces each file with file.gz (-k keeps, -v reports the",
    "ratio); stdin compresses to stdout. -c forces stdout. -1..-9 and",
    "--fast/--best are accepted; there is one algorithm, a synchronous",
    "greedy-LZ77/fixed-Huffman DEFLATE a few percent off zlib level 6 —",
    "the format is standard, so real gzip reads it (verified against",
    "Node zlib in tests).",
    "",
    "Binary through a pipe or redirect carries the shell's one trailing",
    "newline; the matching decompressors ignore exactly that byte and",
    'report any other trailing data GNU-style ("trailing garbage").'
  ],
  gunzip: [
    "gunzip — decompress gzip files",
    "",
    "SYNOPSIS",
    "  gunzip [-cfkv] [file...]",
    "",
    "gzip -d: file.gz is replaced by file (.tgz/.taz unpack to .tar);",
    "stdin decompresses to stdout. Verifies CRC32 and length, accepts",
    "FNAME/FCOMMENT/FEXTRA/FHCRC headers, warns on trailing garbage."
  ],
  zcat: [
    "zcat — decompress gzip files to stdout",
    "",
    "SYNOPSIS",
    "  zcat [file...]",
    "",
    "gzip -cd: never modifies files, always writes the decompressed bytes",
    'to stdout ("cat" through the decompressor). Non-gzip input is an',
    "error, like GNU."
  ],
  tar: [
    "tar — create, list and extract ustar archives (POSIX 1003.1)",
    "",
    "SYNOPSIS",
    "  tar -c [-f ARCHIVE] [-v] [-z] [-C DIR] PATH...",
    "  tar -t [-f ARCHIVE] [-v] [-z] [MEMBER...]",
    "  tar -x [-f ARCHIVE] [-v] [-z] [-C DIR] [MEMBER...]",
    "",
    "ustar format with the prefix field for long names, checksums, and",
    "the two-zero-block terminator; -z wraps the archive in gzip. GNU",
    "long-name (L) and pax (x) path records are honoured on read, so",
    "archives from GNU tar and macOS bsdtar both extract. Members with",
    "'..' or absolute names are refused; hard/symlinks are skipped with",
    "a note (the VFS has no links). No -f, or -f -: stdin/stdout.",
    "One -C per invocation (create re-bases later operands; extract",
    "extracts into it)."
  ],
  zip: [
    "zip — create/update PKZIP archives",
    "",
    "SYNOPSIS",
    "  zip [-r] [-q] [-0] ARCHIVE PATH...",
    "",
    "ARCHIVE comes first (Info-ZIP order). -r recurses directories;",
    "without it a directory contributes its entry only. Each entry is",
    "deflated (raw DEFLATE, method 8) or stored (method 0, -0 forces it),",
    "whichever is smaller. An existing archive is UPDATED: its members",
    "are carried over and same-named paths replaced (the archive is",
    "rewritten, so timestamps and per-entry bytes may change). No",
    "encryption (-e refuses), no zip64."
  ],
  unzip: [
    "unzip — list/extract PKZIP archives",
    "",
    "SYNOPSIS",
    "  unzip [-l] [-o | -n] [-q] [-d DIR] ARCHIVE [MEMBER...]",
    "",
    "Members are selected by exact name or glob (* and ?); -l prints the",
    "Info-ZIP listing; -d extracts into DIR. Extraction overwrites by",
    "default (-o makes that explicit; -n skips existing files). Sizes,",
    "methods and CRCs come from the central directory (streamed archives",
    "with data descriptors read fine); CRC mismatches report and exit 2.",
    "Exit codes follow Info-ZIP: 0 ok, 9 archive missing/invalid, 10 bad",
    "usage, 11 no members matched."
  ]
}, Bt = { commands: Pt, manPages: Dt };
export {
  Pt as commands,
  Pt as default,
  Dt as manPages,
  Bt as pkg
};
