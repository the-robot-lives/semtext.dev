function j(e) {
  return `semtext-pkg-${e}.js`;
}
function V(e) {
  return import(
    /* @vite-ignore */
    new URL(j(e), import.meta.url).href
  ).then(
    (t) => t
  );
}
function Y(e) {
  return e.includes("--help") || e.includes("-h");
}
function K(e, t) {
  const r = j(e.name), s = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
  for (const a of e.commands)
    a.man !== void 0 && d.set(a.name, a.man);
  let l = !1, p = !1, m = null;
  const T = () => (m ??= t().then(
    (a) => {
      for (const o of a.commands) s.set(o.name, o);
      for (const [o, i] of Object.entries(a.manPages ?? {})) n.set(o, i);
      return l = !0, !0;
    },
    () => (p = !0, !1)
  ), m), O = (a) => {
    const o = () => s.get(a.name);
    return {
      name: a.name,
      // Help/completion surfaces read the stub's line — never the chunk.
      usage: a.usage,
      run(i) {
        const g = o();
        if (g !== void 0)
          return g.run(i);
        if (Y(i.args)) {
          i.out(a.usage);
          return;
        }
        i.err(`loading ${e.name}…`);
        const k = i.err, S = i.exit;
        let f = !1, c = !1;
        const b = () => {
          i.err = k, i.exit = S, c || S(f ? 1 : 0);
        };
        return T().then((v) => {
          if (!v) {
            i.err(`${a.name}: package chunk failed to load (${r})`), i.exit(1);
            return;
          }
          const H = o();
          if (H === void 0) {
            i.err(`${a.name}: package chunk ${r} does not provide it`), i.exit(70);
            return;
          }
          return i.err = (L) => {
            f = !0, k(L);
          }, i.exit = (L) => {
            c = !0, S(L);
          }, Promise.resolve(H.run(i)).then(b, (L) => {
            throw b(), L;
          });
        });
      },
      complete(i) {
        return o()?.complete?.(i) ?? [];
      },
      app(i) {
        return o()?.app?.(i) ?? null;
      }
    };
  };
  return {
    name: e.name,
    commands: e.commands.map(O),
    ensure: T,
    loaded: () => l,
    state: () => l ? "resident" : p ? "failed" : "loading",
    manNames: () => /* @__PURE__ */ new Set([...n.keys(), ...d.keys()]),
    manPage: (a) => n.get(a) ?? d.get(a) ?? null,
    supersedes: new Set(e.supersedes ?? [])
  };
}
const _ = {
  name: "net",
  commands: [
    {
      name: "curl",
      summary: "transfer a URL (HTTP)",
      usage: "curl [-sSifL] [-X M] [-H h] [-d d] [-u u:p] [-o f | -O] [-i | -I] [-w fmt] URL",
      man: [
        "CURL(1)                   semtext-sh manual",
        "",
        "NAME",
        "     curl — transfer a URL (short page; the full one prints once the",
        "     package body has loaded). Requests block until they complete."
      ]
    },
    {
      name: "wget",
      summary: "download a URL to a VFS file",
      usage: "wget [-q] [-O FILE | -O -] URL...",
      man: [
        "WGET(1)                   semtext-sh manual",
        "",
        "NAME",
        "     wget — download a URL into the VFS (short page until the body",
        "     loads). Server errors (4xx/5xx) exit 8 without saving."
      ]
    },
    {
      name: "http",
      summary: "HTTPie-style requests with pretty output",
      usage: "http [-vbh] [METHOD] URL [key:value | key=v | key:=v ...]",
      man: [
        "HTTP(1)                   semtext-sh manual",
        "",
        "NAME",
        "     http — HTTPie-style requests: JSON bodies from key=value items,",
        "     pretty status/headers/body output (short page until the body",
        "     loads)."
      ]
    }
  ]
};
K(_, () => V("net"));
class E extends Error {
  constructor(t, r) {
    super(r), this.name = "NetError", this.kind = t;
  }
}
let R = {};
function pe(e) {
  R = { ...R, ...e };
}
function me() {
  R = {};
}
function we() {
  return R;
}
function F(e) {
  let t;
  try {
    t = new URL(e);
  } catch {
    throw new E("url", `URL rejected: '${e}' is not a valid URL`);
  }
  if (t.protocol !== "http:" && t.protocol !== "https:")
    throw new E("url", `URL rejected: unsupported scheme '${t.protocol.replace(/:$/, "")}' (the net commands speak http and https only)`);
  const r = R.allow;
  if (r) {
    const s = r(t);
    if (s !== !0)
      throw new E("blocked", `request to '${e}' blocked by the shell's network allowlist` + (typeof s == "string" && s !== "" ? ` (${s})` : ""));
  }
  return t;
}
const M = "the request failed before a response was returned (status 0). Browsers block this for several indistinguishable reasons: a CORS refusal (the server must send Access-Control-Allow-Origin naming this page's origin), a refused connection or DNS failure, or mixed-content blocking (https page → http URL). The browser hides the exact cause from scripts.";
function Z(e) {
  const t = new XMLHttpRequest();
  try {
    t.open(e.method, e.url, !1);
    for (const [s, n] of Object.entries(e.headers))
      try {
        t.setRequestHeader(s, n);
      } catch {
      }
    t.send(e.body ?? null);
  } catch {
    throw new E("network", M);
  }
  if (t.status === 0) throw new E("network", M);
  const r = {};
  for (const s of t.getAllResponseHeaders().split(`\r
`)) {
    const n = s.indexOf(":");
    n > 0 && (r[s.slice(0, n).trim().toLowerCase()] = s.slice(n + 1).trim());
  }
  return {
    status: t.status,
    statusText: t.statusText ?? "",
    headers: r,
    bodyText: t.responseText,
    url: t.responseURL || e.url
  };
}
function Q() {
  return R.transport !== void 0 ? R.transport : ee();
}
function ee() {
  return typeof XMLHttpRequest > "u" ? null : Z;
}
function X() {
  return R.transportAsync !== void 0 ? R.transportAsync : R.transport !== void 0 ? null : typeof fetch == "function" ? te : null;
}
async function te(e) {
  let t;
  try {
    const n = new Headers();
    for (const [d, l] of Object.entries(e.headers))
      try {
        n.set(d, l);
      } catch {
      }
    t = await fetch(e.url, {
      method: e.method,
      headers: n,
      body: e.body ?? void 0,
      redirect: "follow",
      credentials: "omit"
    });
  } catch {
    throw new E(
      "network",
      "the request failed before a response was returned (fetch rejects on network/CORS/mixed-content failures; the browser hides the exact cause)"
    );
  }
  const r = {};
  t.headers.forEach((n, d) => {
    r[d.toLowerCase()] = n;
  });
  let s = "";
  try {
    s = await t.text();
  } catch {
    s = "";
  }
  return {
    status: t.status,
    statusText: t.statusText ?? "",
    headers: r,
    bodyText: s,
    url: t.url || e.url
  };
}
function z(e) {
  const t = Q();
  if (t === null)
    throw new E(
      "unsupported",
      "no network transport in this environment (the built-in one needs XMLHttpRequest; tests and embedders install one with configureNet({ transport }))"
    );
  return t(e);
}
function G(e) {
  return new TextEncoder().encode(e).length;
}
function re(e) {
  const t = new TextEncoder().encode(e);
  let r = "";
  for (const s of t) r += String.fromCharCode(s);
  return `Basic ${btoa(r)}`;
}
const P = (e) => _.commands.find((t) => t.name === e).usage;
function W(e, t) {
  const r = [];
  let s = !1;
  for (const n of e) {
    if (s || n.length <= 2 || n[0] !== "-" || n[1] === "-") {
      n === "--" && !s && (s = !0), r.push(n);
      continue;
    }
    if (t.includes(n[1]))
      r.push("-" + n[1], n.slice(2));
    else
      for (const d of n.slice(1)) r.push("-" + d);
  }
  return r;
}
function $(e, t) {
  if (t === "") return;
  const r = t.split(`
`);
  t.endsWith(`
`) && r.pop();
  for (const s of r) e.out(s);
}
function J(e) {
  return `HTTP/1.1 ${e.status}${e.statusText ? " " + e.statusText : ""}`;
}
function N(e) {
  return Object.keys(e).sort().map((t) => `${t}: ${e[t]}`);
}
function ne(e) {
  return F(e.url), z(e);
}
function I(e) {
  F(e.url);
  const t = X();
  return t === null ? z(e) : t(e);
}
function C(e) {
  switch (e.kind) {
    case "url":
      return 3;
    case "network":
      return 7;
    default:
      return 1;
  }
}
function A(e) {
  return e instanceof E ? e : new E("network", String(e));
}
const x = (e, t, r) => e ? `\x1B[${t}m${r}\x1B[0m` : r;
function se(e, t) {
  return t ? e.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (r, s, n, d, l) => s !== void 0 ? n !== void 0 ? x(!0, 36, s) + n : x(!0, 32, s) : d !== void 0 ? x(!0, 35, d) : l !== void 0 ? x(!0, 33, l) : r
  ) : e;
}
function D(e, t, r) {
  if (e.includes("json") || /^[[{]/.test(t.trim()))
    try {
      return se(JSON.stringify(JSON.parse(t), null, 2), r);
    } catch {
    }
  return t;
}
const oe = [
  P("curl"),
  "",
  "Transfer a URL over HTTP. Requests run on fetch (sync XHR fallback):",
  "the shell awaits the response (like foreground curl),",
  "and the body can be piped or redirected like any command output.",
  "",
  "  -s              silent (no error messages)",
  "  -S              show errors even with -s",
  "  -f              fail on HTTP >= 400 (exit 22, no body)",
  "  -i              include the response headers in the output",
  "  -I              HEAD request, headers only",
  "  -L              (accepted; redirects are always followed)",
  "  -X METHOD       request method (default GET, POST with -d)",
  '  -H "h: v"       add a request header (repeatable)',
  "  -d D            request body part; parts join with & (repeatable)",
  "  --data-binary D same wire effect as -d here",
  "  -u USER:PASS    Basic auth (Authorization header)",
  "  -o FILE         write the body to a VFS file (-o - = stdout)",
  "  -O              write to a file named from the URL",
  "  -w FMT          print after the body: %{http_code} %{response_code}",
  "                  %{url_effective} %{size_download} %{content_type};",
  "                  \\n and \\t in FMT are interpreted",
  "",
  "Exit codes: 0 ok (even on 4xx/5xx without -f) · 1 blocked by allowlist ·",
  "2 usage/transport unavailable · 3 bad URL/scheme · 7 network/CORS ·",
  "22 -f failure · 23 body write error.",
  "",
  "  curl -s https://api.example.com/x | grep id",
  "  curl -d name=ada https://api.example.com/users",
  '  curl -so /tmp/x.json -w "%{http_code}" https://example.com/x'
];
function B(e) {
  return (t) => e.filter((r) => r.startsWith(t.word));
}
const ae = {
  name: "curl",
  usage: P("curl"),
  complete: B(["-s", "-S", "-f", "-i", "-I", "-L", "-X", "-H", "-d", "--data-binary", "-u", "-o", "-O", "-w", "--help"]),
  run(e) {
    const t = W(e.args, "XHdouw");
    let r = !1, s = !1, n = !1, d = !1, l = !1, p = null, m = null, T = null, O = !1, a = null;
    const o = [], i = [], g = [];
    let k = !1;
    for (let u = 0; u < t.length; u++) {
      const h = t[u];
      if (h === "--help" || h === "-h") {
        for (const w of oe) e.out(w);
        e.exit(0);
        return;
      }
      if (!k && h === "--") {
        k = !0;
        continue;
      }
      if (!k && (h === "--data-binary" || h.startsWith("--data-binary="))) {
        const w = h.startsWith("--data-binary=") ? h.slice(14) : t[++u];
        if (w === void 0) {
          e.err("curl: option --data-binary: requires parameter"), e.exit(2);
          return;
        }
        i.push(w);
        continue;
      }
      if (!k && h.startsWith("-") && h !== "-") {
        if ({ "-X": !0, "-H": !0, "-d": !0, "-u": !0, "-o": !0, "-w": !0 }[h] !== void 0) {
          const y = t[++u];
          if (y === void 0) {
            e.err(`curl: option ${h}: requires parameter`), e.exit(2);
            return;
          }
          switch (h) {
            case "-X":
              p = y.toUpperCase();
              break;
            case "-H":
              o.push(y);
              break;
            case "-d":
              i.push(y);
              break;
            case "-u":
              m = y;
              break;
            case "-o":
              T = y;
              break;
            case "-w":
              a = y;
              break;
          }
          continue;
        }
        for (const y of h.slice(1))
          switch (y) {
            case "s":
              r = !0;
              break;
            case "S":
              s = !0;
              break;
            case "f":
              n = !0;
              break;
            case "i":
              d = !0;
              break;
            case "I":
              l = !0, d = !0;
              break;
            case "L":
              break;
            // accepted; the transport always follows redirects
            case "O":
              O = !0;
              break;
            default:
              e.err(`curl: option -${y}: is unknown`), e.err("curl: try 'curl --help' for more information"), e.exit(2);
              return;
          }
        continue;
      }
      g.push(h);
    }
    if (g.length === 0) {
      e.err("curl: no URL specified"), e.err("curl: try 'curl --help' for more information"), e.exit(2);
      return;
    }
    if (g.length > 1) {
      e.err("curl: only one URL per invocation is supported by this build"), e.exit(2);
      return;
    }
    if (T !== null && O) {
      e.err("curl: only one of -o and -O is allowed"), e.exit(2);
      return;
    }
    const S = g[0], f = {};
    let c = !1, b = !1;
    for (const u of o) {
      const h = u.indexOf(":");
      if (h < 0) {
        if (u.endsWith(";")) {
          f[u.slice(0, -1)] = "";
          continue;
        }
        e.err(`curl: bad --header syntax (want 'Name: value'): '${u}'`), e.exit(2);
        return;
      }
      const w = u.slice(0, h);
      let y = u.slice(h + 1);
      y.startsWith(" ") && (y = y.slice(1)), w.toLowerCase() === "content-type" && (c = !0), w.toLowerCase() === "authorization" && (b = !0), f[w] = y;
    }
    if (m !== null) {
      if (m.indexOf(":") < 0) {
        e.err("curl: --user needs USER:PASS (interactive password prompting is not supported)"), e.exit(2);
        return;
      }
      b || (f.Authorization = re(m));
    }
    const v = i.length > 0 ? i.join("&") : null;
    v !== null && !c && (f["Content-Type"] = "application/x-www-form-urlencoded");
    const H = p ?? (l ? "HEAD" : v !== null ? "POST" : "GET"), L = (u) => {
      const h = A(u);
      (!r || s) && e.err(`curl: ${h.message}`), e.exit(C(h));
    }, q = (u) => {
      if (n && u.status >= 400) {
        (!r || s) && e.err(`curl: (22) The requested URL returned error: ${u.status}${u.statusText ? " " + u.statusText : ""}`), e.exit(22);
        return;
      }
      if (d) {
        e.out(J(u));
        for (const h of N(u.headers)) e.out(h);
        l || e.out("");
      }
      if (!l) {
        const h = (w) => {
          try {
            return e.vfs.mountFile(e.vfs.resolve(e.state.cwd, w), u.bodyText), !0;
          } catch (y) {
            return e.err(`curl: ${w}: ${y instanceof Error ? y.message : String(y)}`), e.exit(23), !1;
          }
        };
        if (T === "-")
          $(e, u.bodyText);
        else if (T !== null) {
          if (!h(T)) return;
        } else if (O) {
          let w;
          try {
            w = decodeURIComponent(new URL(u.url).pathname.split("/").filter(Boolean).pop() ?? "") || "index.html";
          } catch {
            w = "index.html";
          }
          if (!h(w)) return;
        } else
          $(e, u.bodyText);
      }
      if (a !== null) {
        const h = a.replace(/\\n/g, `
`).replace(/\\t/g, "	").replace(/%\{(\w+)\}/g, (w, y) => {
          switch (y) {
            case "http_code":
            case "response_code":
              return String(u.status);
            case "url_effective":
              return u.url;
            case "size_download":
              return String(G(u.bodyText));
            case "content_type":
              return u.headers["content-type"] ?? "";
            default:
              return w;
          }
        });
        for (const w of h.split(`
`))
          w !== "" && e.out(w);
      }
      e.exit(0);
    };
    let U;
    try {
      U = I({ method: H, url: S, headers: f, body: v });
    } catch (u) {
      L(u);
      return;
    }
    if (U instanceof Promise) return U.then(q, L);
    q(U);
  }
}, ie = () => {
  const e = /* @__PURE__ */ new Date(), t = (r) => String(r).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())} ${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}, le = {
  name: "wget",
  usage: P("wget"),
  complete: B(["-q", "-O", "--help"]),
  run(e) {
    const t = W(e.args, "O");
    let r = !1, s = null;
    const n = [];
    let d = !1;
    for (let a = 0; a < t.length; a++) {
      const o = t[a];
      if (o === "--help" || o === "-h") {
        for (const i of [
          P("wget"),
          "",
          "Download each URL into the VFS. Log lines go to stderr (like GNU",
          "wget), so `wget -O- URL | grep …` pipes only the body.",
          "",
          "  -q              quiet — no log lines",
          "  -O FILE         save to FILE instead of the URL basename",
          "  -O -            write the body to stdout instead of a file",
          "",
          "The default filename is the URL path basename (index.html when it",
          "ends in / or is empty). Exit codes: 0 ok · 1 usage/blocked ·",
          "4 network/CORS/transport · 8 server error 4xx/5xx (nothing saved)."
        ]) e.out(i);
        e.exit(0);
        return;
      }
      if (!d && o === "--") {
        d = !0;
        continue;
      }
      if (!d && o === "-q") {
        r = !0;
        continue;
      }
      if (!d && o === "-O") {
        if (s = t[++a], s === void 0) {
          e.err("wget: option -O: requires an argument"), e.exit(1);
          return;
        }
        continue;
      }
      if (!d && o.startsWith("-") && o !== "-") {
        e.err(`wget: unrecognized option '${o}'`), e.exit(1);
        return;
      }
      n.push(o);
    }
    if (n.length === 0) {
      e.err("wget: missing URL"), e.err("Usage: wget [-q] [-O FILE] URL..."), e.exit(1);
      return;
    }
    const l = (a) => {
      r || e.err(a);
    };
    let p = 0;
    const m = (a, o) => {
      if (o.status >= 400) {
        l(`wget: ERROR ${o.status}: ${o.statusText || "error"}.`), p = 8;
        return;
      }
      const i = G(o.bodyText);
      if (l(`--${ie()}--  ${a}`), s === "-") {
        $(e, o.bodyText);
        return;
      }
      let g = s;
      if (g === null)
        try {
          g = decodeURIComponent(new URL(o.url).pathname.split("/").filter(Boolean).pop() ?? "") || "index.html";
        } catch {
          g = "index.html";
        }
      l(`Saving to: '${g}'`);
      try {
        e.vfs.mountFile(e.vfs.resolve(e.state.cwd, g), o.bodyText);
      } catch (k) {
        e.err(`wget: cannot write '${g}': ${k instanceof Error ? k.message : String(k)}`), p = p === 0 ? 1 : p;
        return;
      }
      l(`'${g}' saved [${i}/${i}]`);
    }, T = (a) => {
      const o = A(a);
      l(`wget: ${o.message}`), p = o.kind === "network" ? 4 : 1;
    }, O = () => e.exit(p);
    if (X() !== null)
      return (async () => {
        for (const a of n)
          try {
            m(a, await I({ method: "GET", url: a, headers: {}, body: null }));
          } catch (o) {
            T(o);
          }
        O();
      })();
    for (const a of n) {
      let o;
      try {
        o = ne({ method: "GET", url: a, headers: {}, body: null });
      } catch (i) {
        T(i);
        continue;
      }
      m(a, o);
    }
    O();
  }
}, ue = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
function de(e) {
  const t = [], r = {};
  let s = !1;
  for (const n of e) {
    const d = n.indexOf(":=");
    if (d >= 0) {
      try {
        r[n.slice(0, d)] = JSON.parse(n.slice(d + 2));
      } catch (m) {
        return { ok: !1, error: `invalid JSON in item '${n}': ${m instanceof Error ? m.message : String(m)}` };
      }
      s = !0;
      continue;
    }
    const l = n.indexOf(":"), p = n.indexOf("=");
    if (l >= 0 && (p < 0 || l < p)) {
      t.push([n.slice(0, l), n.slice(l + 1)]);
      continue;
    }
    if (p >= 0) {
      r[n.slice(0, p)] = n.slice(p + 1), s = !0;
      continue;
    }
    return { ok: !1, error: `invalid item '${n}' (want key:value, key=value or key:=json)` };
  }
  return { ok: !0, headers: t, fields: r, hasFields: s };
}
const ce = {
  name: "http",
  usage: P("http"),
  complete: (e) => {
    const t = e.word.toLowerCase();
    return [...ue.map((r) => r.toLowerCase()), "-v", "-b", "-h", "--verbose", "--body", "--headers", "--help"].filter(
      (r) => r.startsWith(t)
    );
  },
  run(e) {
    const t = [];
    let r = !1, s = !1, n = !1;
    for (let f = 0; f < e.args.length; f++) {
      const c = e.args[f];
      if (c === "--help") {
        for (const b of [
          P("http"),
          "",
          "HTTPie-style requests. METHOD is optional (default GET, or POST",
          "when body items or piped stdin are present). Items:",
          "",
          "  key:value   request header",
          "  key=value   JSON body field (string)",
          "  key:=json   JSON body field (raw JSON)",
          "",
          "  -v          also print the request",
          "  -b          print only the response body",
          "  -h          print only the response headers (--help is help; -h isn't)",
          "",
          "Piped stdin becomes the raw request body (Content-Type stays",
          "application/json unless overridden). Output colors follow the",
          "stage's tty-ness. Any completed HTTP exchange exits 0; usage/",
          "parse errors exit 1, bad URL/scheme 3, network/CORS 7, allowlist",
          "blocks 1."
        ]) e.out(b);
        e.exit(0);
        return;
      }
      if (c === "-v" || c === "--verbose") {
        r = !0;
        continue;
      }
      if (c === "-b" || c === "--body") {
        s = !0;
        continue;
      }
      if (c === "-h" || c === "--headers") {
        n = !0;
        continue;
      }
      t.push(c);
    }
    let d = null;
    t.length > 1 && /^[A-Za-z]+$/.test(t[0]) && (d = t.shift().toUpperCase());
    let l = t.shift();
    if (l === void 0 || l === "") {
      e.err("http: error: a URL is required"), e.exit(1);
      return;
    }
    /^[a-z][a-z0-9+.-]*:\/\//i.test(l) || (l = "http://" + l);
    const p = de(t);
    if (!p.ok) {
      e.err(`http: error: ${p.error}`), e.exit(1);
      return;
    }
    const m = e.stdin;
    if (p.hasFields && m !== null && m !== "") {
      e.err("http: error: request body from stdin and key=value items are mutually exclusive"), e.exit(1);
      return;
    }
    const T = p.hasFields || m !== null && m !== "", O = d ?? (T ? "POST" : "GET"), a = { Accept: "application/json, */*" };
    T && (a["Content-Type"] = "application/json");
    for (const [f, c] of p.headers) a[f] = c;
    let o = null;
    m !== null && m !== "" ? o = m : p.hasFields && (o = JSON.stringify(p.fields));
    let i;
    try {
      i = F(l);
    } catch (f) {
      const c = A(f);
      e.err(`http: error: ${c.message}`), e.exit(C(c));
      return;
    }
    a.Host = i.host;
    const g = (f) => {
      const c = A(f);
      e.err(`http: error: ${c.message}`), e.exit(C(c));
    }, k = (f) => {
      const c = e.color;
      if (r) {
        const b = i.pathname + i.search;
        e.out(x(c, 90, `${O} ${b} HTTP/1.1`));
        for (const v of N(a)) e.out(x(c, 90, v));
        if (o !== null) {
          e.out("");
          for (const v of D("application/json", o, c).split(`
`)) e.out(v);
        }
        e.out("");
      }
      if (!s) {
        e.out(x(c, f.status < 300 ? 32 : f.status < 400 ? 33 : 31, J(f)));
        for (const b of N(f.headers)) e.out(b);
      }
      if (!n) {
        s || e.out("");
        const b = D(f.headers["content-type"] ?? "", f.bodyText, c);
        if (b !== "") {
          const v = b.split(`
`);
          b.endsWith(`
`) && v.pop();
          for (const H of v) e.out(H);
        }
      }
      e.exit(0);
    };
    let S;
    try {
      S = I({ method: O, url: l, headers: a, body: o });
    } catch (f) {
      g(f);
      return;
    }
    if (S instanceof Promise) return S.then(k, g);
    k(S);
  }
}, he = [ae, le, ce], fe = {
  curl: [
    "CURL(1)                   semtext-sh manual",
    "",
    "NAME",
    "     curl — transfer a URL over HTTP",
    "",
    "SYNOPSIS",
    "     curl [-sSifL] [-X METHOD] [-H HEADER]... [-d DATA]...",
    "          [--data-binary DATA]... [-u USER:PASS] [-o FILE | -O]",
    "          [-i | -I] [-w FORMAT] URL",
    "",
    "DESCRIPTION",
    "     HTTP client modelled on GNU curl. The request runs on fetch",
    "     (transport.ts; sync XHR only where fetch is absent): the shell",
    "     awaits the response, and the body flows through stdout like any",
    "     command output — pipes and redirection work.",
    "",
    "     Ambient credentials are not attached (fetch runs with",
    "     credentials: omit): cookies and HTTP auth travel only when",
    "     you pass them explicitly (-u, an Authorization header).",
    "",
    "     -d implies POST and defaults Content-Type to",
    "     application/x-www-form-urlencoded, like curl. -I sends HEAD and",
    "     prints headers only. -f turns HTTP >= 400 into exit 22 with no",
    "     body; without -f a 4xx/5xx body prints normally and the exit is 0.",
    "",
    "DEVIATIONS from GNU curl (the synchronous browser transport):",
    "     - Redirects are ALWAYS followed (XHR gives no way not to); -L is",
    "       accepted and has no additional effect. Use -w %{url_effective}",
    "       to see where a redirect chain landed.",
    "     - No progress meter (-s accepted; there is nothing to silence",
    "       except errors, which -S shows even under -s).",
    "     - No timeouts (-m/--max-time): a synchronous request cannot be",
    "       cancelled.",
    "     - The printed status line always says HTTP/1.1 — the browser",
    "       does not expose the real protocol version to scripts.",
    "     - Output is line-oriented (the shell model); a body without a",
    "       trailing newline gains one in a pipe. -o/-O write exact bytes.",
    "",
    "CORS AND NETWORK FAILURES",
    "     A blocked request (status 0) exits 7 with the honest message:",
    "     browsers make CORS refusals, refused connections and DNS",
    "     failures indistinguishable to scripts, so the message explains",
    "     the candidates instead of guessing one. Embedders may gate",
    "     destinations with the allowlist hook (see below) — denials exit",
    "     1 and name the shell network allowlist.",
    "",
    "ALLOWLIST HOOK (embedders)",
    "     import { configureNet } from the semtext-pkg-net.js chunk (or",
    "     src/terminal/packages/net) and set configureNet({ allow: (url)",
    '     => true | "reason" }). It applies to curl, wget and http alike.',
    "",
    "EXIT CODES",
    "     0 ok (even on 4xx/5xx without -f) · 1 blocked by allowlist ·",
    "     2 usage error / no transport · 3 invalid URL or scheme ·",
    "     7 network/CORS failure · 22 -f failure · 23 body write error.",
    "",
    "EXAMPLES",
    "     curl -s https://api.example.com/x | jq .name",
    '     curl -H "Authorization: Bearer t" -d k=v https://example.com',
    '     curl -so /tmp/page.html -w "%{http_code} %{size_download}\\n" URL'
  ],
  wget: [
    "WGET(1)                   semtext-sh manual",
    "",
    "NAME",
    "     wget — download a URL into the VFS",
    "",
    "SYNOPSIS",
    "     wget [-q] [-O FILE | -O -] URL...",
    "",
    "DESCRIPTION",
    "     Non-interactive downloader modelled on GNU wget. Log lines go to",
    "     STDERR (--timestamp-- URL, Saving to, saved [bytes/bytes]), so",
    "     `wget -O- URL | grep …` pipes only the body. -q silences the log.",
    "",
    "     The default filename is the URL path basename, or index.html",
    "     when the path ends in / or is empty. -O names the file; -O -",
    "     writes the body to stdout without saving.",
    "",
    "     Server errors (HTTP >= 400) print `ERROR <code>: <text>.` and",
    "     exit 8 without saving anything — wget fails on error responses",
    "     where curl does not (there, see -f).",
    "",
    "     Same transport, credential and allowlist posture as curl: no",
    "     ambient cookies, redirects always followed, status-0 failures",
    "     exit 4 with the honest CORS/network message.",
    "",
    "EXIT CODES",
    "     0 ok · 1 usage/blocked/write error · 4 network/CORS ·",
    "     8 server error (4xx/5xx)."
  ],
  http: [
    "HTTP(1)                   semtext-sh manual",
    "",
    "NAME",
    "     http — HTTPie-style requests with pretty output",
    "",
    "SYNOPSIS",
    "     http [-vbh] [METHOD] URL [key:value | key=value | key:=json]...",
    "",
    "DESCRIPTION",
    "     Modelled on HTTPie. METHOD is optional: GET by default, POST",
    "     when body items or piped stdin are present. Items build the",
    "     request: key:value headers, key=value JSON string fields,",
    "     key:=json raw JSON fields. The first of `:` and `=` decides the",
    "     item kind (a=b:c is a body field, a:b=c a header), as in",
    "     HTTPie. Piped stdin becomes the raw request body (mutually",
    "     exclusive with body items). Defaults: Accept:",
    "     application/json, */* and, with a body, Content-Type:",
    "     application/json — user headers override both. A bare hostname",
    "     defaults to http://.",
    "",
    "     Output is the status line, sorted response headers, a blank",
    "     line, then the body — JSON pretty-printed and, on a terminal,",
    "     colorized (2xx green / 3xx yellow / 4xx+ red status line). -b",
    "     prints only the body, -h only the headers (-h is NOT help; use",
    "     --help), -v prepends the request line, request headers and body.",
    "",
    "     Any completed HTTP exchange exits 0 (4xx/5xx are valid",
    "     responses, as in HTTPie). Transport/credential/allowlist",
    "     posture matches curl: see curl(1).",
    "",
    "EXAMPLES",
    "     http GET https://api.example.com/users/1",
    "     http POST https://api.example.com/users name=ada admin:=true",
    `     echo '{"a":1}' | http POST https://api.example.com/x`,
    "     http -b PATCH https://api.example.com/users/1 name=grace"
  ]
}, ye = { commands: he, manPages: fe };
export {
  E as NetError,
  he as commands,
  pe as configureNet,
  te as fetchTransport,
  fe as manPages,
  we as netConfig,
  ye as pkg,
  me as resetNet
};
