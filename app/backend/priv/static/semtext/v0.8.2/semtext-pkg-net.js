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
  for (const o of e.commands)
    o.man !== void 0 && d.set(o.name, o.man);
  let i = !1, h = !1, m = null;
  const b = () => (m ??= t().then(
    (o) => {
      for (const a of o.commands) s.set(a.name, a);
      for (const [a, l] of Object.entries(o.manPages ?? {})) n.set(a, l);
      return i = !0, !0;
    },
    () => (h = !0, !1)
  ), m);
  b();
  const k = (o) => {
    const a = () => s.get(o.name);
    return {
      name: o.name,
      // Help/completion surfaces read the stub's line — never the chunk.
      usage: o.usage,
      run(l) {
        const g = a();
        if (g !== void 0)
          return g.run(l);
        if (Y(l.args)) {
          l.out(o.usage);
          return;
        }
        if (h) {
          l.err(`${o.name}: package chunk failed to load (${r})`), l.exit(1);
          return;
        }
        if (i) {
          l.err(`${o.name}: package chunk ${r} does not provide it`), l.exit(70);
          return;
        }
        l.err(`${o.name}: chunk still loading — try again`), l.exit(1);
      },
      complete(l) {
        return a()?.complete?.(l) ?? [];
      },
      app(l) {
        return a()?.app?.(l) ?? null;
      }
    };
  };
  return {
    name: e.name,
    commands: e.commands.map(k),
    ensure: b,
    loaded: () => i,
    state: () => i ? "resident" : h ? "failed" : "loading",
    manNames: () => /* @__PURE__ */ new Set([...n.keys(), ...d.keys()]),
    manPage: (o) => n.get(o) ?? d.get(o) ?? null,
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
class S extends Error {
  constructor(t, r) {
    super(r), this.name = "NetError", this.kind = t;
  }
}
let R = {};
function fe(e) {
  R = { ...R, ...e };
}
function pe() {
  R = {};
}
function me() {
  return R;
}
function C(e) {
  let t;
  try {
    t = new URL(e);
  } catch {
    throw new S("url", `URL rejected: '${e}' is not a valid URL`);
  }
  if (t.protocol !== "http:" && t.protocol !== "https:")
    throw new S("url", `URL rejected: unsupported scheme '${t.protocol.replace(/:$/, "")}' (the net commands speak http and https only)`);
  const r = R.allow;
  if (r) {
    const s = r(t);
    if (s !== !0)
      throw new S("blocked", `request to '${e}' blocked by the shell's network allowlist` + (typeof s == "string" && s !== "" ? ` (${s})` : ""));
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
    throw new S("network", M);
  }
  if (t.status === 0) throw new S("network", M);
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
function z() {
  return R.transportAsync !== void 0 ? R.transportAsync : null;
}
async function we(e) {
  let t;
  try {
    const n = new Headers();
    for (const [d, i] of Object.entries(e.headers))
      try {
        n.set(d, i);
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
    throw new S(
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
function G(e) {
  const t = Q();
  if (t === null)
    throw new S(
      "unsupported",
      "no network transport in this environment (the built-in one needs XMLHttpRequest; tests and embedders install one with configureNet({ transport }))"
    );
  return t(e);
}
function W(e) {
  return new TextEncoder().encode(e).length;
}
function te(e) {
  const t = new TextEncoder().encode(e);
  let r = "";
  for (const s of t) r += String.fromCharCode(s);
  return `Basic ${btoa(r)}`;
}
const x = (e) => _.commands.find((t) => t.name === e).usage;
function X(e, t) {
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
function A(e, t) {
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
function $(e) {
  return Object.keys(e).sort().map((t) => `${t}: ${e[t]}`);
}
function re(e) {
  return C(e.url), G(e);
}
function F(e) {
  C(e.url);
  const t = z();
  return t === null ? G(e) : t(e);
}
function N(e) {
  switch (e.kind) {
    case "url":
      return 3;
    case "network":
      return 7;
    default:
      return 1;
  }
}
function U(e) {
  return e instanceof S ? e : new S("network", String(e));
}
const L = (e, t, r) => e ? `\x1B[${t}m${r}\x1B[0m` : r;
function ne(e, t) {
  return t ? e.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (r, s, n, d, i) => s !== void 0 ? n !== void 0 ? L(!0, 36, s) + n : L(!0, 32, s) : d !== void 0 ? L(!0, 35, d) : i !== void 0 ? L(!0, 33, i) : r
  ) : e;
}
function D(e, t, r) {
  if (e.includes("json") || /^[[{]/.test(t.trim()))
    try {
      return ne(JSON.stringify(JSON.parse(t), null, 2), r);
    } catch {
    }
  return t;
}
const se = [
  x("curl"),
  "",
  "Transfer a URL over HTTP. Requests run on a synchronous transport:",
  "the shell blocks until the response arrives (like foreground curl),",
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
const oe = {
  name: "curl",
  usage: x("curl"),
  complete: B(["-s", "-S", "-f", "-i", "-I", "-L", "-X", "-H", "-d", "--data-binary", "-u", "-o", "-O", "-w", "--help"]),
  run(e) {
    const t = X(e.args, "XHdouw");
    let r = !1, s = !1, n = !1, d = !1, i = !1, h = null, m = null, b = null, k = !1, o = null;
    const a = [], l = [], g = [];
    let v = !1;
    for (let u = 0; u < t.length; u++) {
      const c = t[u];
      if (c === "--help" || c === "-h") {
        for (const w of se) e.out(w);
        e.exit(0);
        return;
      }
      if (!v && c === "--") {
        v = !0;
        continue;
      }
      if (!v && (c === "--data-binary" || c.startsWith("--data-binary="))) {
        const w = c.startsWith("--data-binary=") ? c.slice(14) : t[++u];
        if (w === void 0) {
          e.err("curl: option --data-binary: requires parameter"), e.exit(2);
          return;
        }
        l.push(w);
        continue;
      }
      if (!v && c.startsWith("-") && c !== "-") {
        if ({ "-X": !0, "-H": !0, "-d": !0, "-u": !0, "-o": !0, "-w": !0 }[c] !== void 0) {
          const y = t[++u];
          if (y === void 0) {
            e.err(`curl: option ${c}: requires parameter`), e.exit(2);
            return;
          }
          switch (c) {
            case "-X":
              h = y.toUpperCase();
              break;
            case "-H":
              a.push(y);
              break;
            case "-d":
              l.push(y);
              break;
            case "-u":
              m = y;
              break;
            case "-o":
              b = y;
              break;
            case "-w":
              o = y;
              break;
          }
          continue;
        }
        for (const y of c.slice(1))
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
              i = !0, d = !0;
              break;
            case "L":
              break;
            // accepted; the transport always follows redirects
            case "O":
              k = !0;
              break;
            default:
              e.err(`curl: option -${y}: is unknown`), e.err("curl: try 'curl --help' for more information"), e.exit(2);
              return;
          }
        continue;
      }
      g.push(c);
    }
    if (g.length === 0) {
      e.err("curl: no URL specified"), e.err("curl: try 'curl --help' for more information"), e.exit(2);
      return;
    }
    if (g.length > 1) {
      e.err("curl: only one URL per invocation is supported by this build"), e.exit(2);
      return;
    }
    if (b !== null && k) {
      e.err("curl: only one of -o and -O is allowed"), e.exit(2);
      return;
    }
    const E = g[0], p = {};
    let f = !1, T = !1;
    for (const u of a) {
      const c = u.indexOf(":");
      if (c < 0) {
        if (u.endsWith(";")) {
          p[u.slice(0, -1)] = "";
          continue;
        }
        e.err(`curl: bad --header syntax (want 'Name: value'): '${u}'`), e.exit(2);
        return;
      }
      const w = u.slice(0, c);
      let y = u.slice(c + 1);
      y.startsWith(" ") && (y = y.slice(1)), w.toLowerCase() === "content-type" && (f = !0), w.toLowerCase() === "authorization" && (T = !0), p[w] = y;
    }
    if (m !== null) {
      if (m.indexOf(":") < 0) {
        e.err("curl: --user needs USER:PASS (interactive password prompting is not supported)"), e.exit(2);
        return;
      }
      T || (p.Authorization = te(m));
    }
    const O = l.length > 0 ? l.join("&") : null;
    O !== null && !f && (p["Content-Type"] = "application/x-www-form-urlencoded");
    const H = h ?? (i ? "HEAD" : O !== null ? "POST" : "GET"), I = (u) => {
      const c = U(u);
      (!r || s) && e.err(`curl: ${c.message}`), e.exit(N(c));
    }, q = (u) => {
      if (n && u.status >= 400) {
        (!r || s) && e.err(`curl: (22) The requested URL returned error: ${u.status}${u.statusText ? " " + u.statusText : ""}`), e.exit(22);
        return;
      }
      if (d) {
        e.out(J(u));
        for (const c of $(u.headers)) e.out(c);
        i || e.out("");
      }
      if (!i) {
        const c = (w) => {
          try {
            return e.vfs.mountFile(e.vfs.resolve(e.state.cwd, w), u.bodyText), !0;
          } catch (y) {
            return e.err(`curl: ${w}: ${y instanceof Error ? y.message : String(y)}`), e.exit(23), !1;
          }
        };
        if (b === "-")
          A(e, u.bodyText);
        else if (b !== null) {
          if (!c(b)) return;
        } else if (k) {
          let w;
          try {
            w = decodeURIComponent(new URL(u.url).pathname.split("/").filter(Boolean).pop() ?? "") || "index.html";
          } catch {
            w = "index.html";
          }
          if (!c(w)) return;
        } else
          A(e, u.bodyText);
      }
      if (o !== null) {
        const c = o.replace(/\\n/g, `
`).replace(/\\t/g, "	").replace(/%\{(\w+)\}/g, (w, y) => {
          switch (y) {
            case "http_code":
            case "response_code":
              return String(u.status);
            case "url_effective":
              return u.url;
            case "size_download":
              return String(W(u.bodyText));
            case "content_type":
              return u.headers["content-type"] ?? "";
            default:
              return w;
          }
        });
        for (const w of c.split(`
`))
          w !== "" && e.out(w);
      }
      e.exit(0);
    };
    let P;
    try {
      P = F({ method: H, url: E, headers: p, body: O });
    } catch (u) {
      I(u);
      return;
    }
    if (P instanceof Promise) return P.then(q, I);
    q(P);
  }
}, ae = () => {
  const e = /* @__PURE__ */ new Date(), t = (r) => String(r).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())} ${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}, ie = {
  name: "wget",
  usage: x("wget"),
  complete: B(["-q", "-O", "--help"]),
  run(e) {
    const t = X(e.args, "O");
    let r = !1, s = null;
    const n = [];
    let d = !1;
    for (let o = 0; o < t.length; o++) {
      const a = t[o];
      if (a === "--help" || a === "-h") {
        for (const l of [
          x("wget"),
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
        ]) e.out(l);
        e.exit(0);
        return;
      }
      if (!d && a === "--") {
        d = !0;
        continue;
      }
      if (!d && a === "-q") {
        r = !0;
        continue;
      }
      if (!d && a === "-O") {
        if (s = t[++o], s === void 0) {
          e.err("wget: option -O: requires an argument"), e.exit(1);
          return;
        }
        continue;
      }
      if (!d && a.startsWith("-") && a !== "-") {
        e.err(`wget: unrecognized option '${a}'`), e.exit(1);
        return;
      }
      n.push(a);
    }
    if (n.length === 0) {
      e.err("wget: missing URL"), e.err("Usage: wget [-q] [-O FILE] URL..."), e.exit(1);
      return;
    }
    const i = (o) => {
      r || e.err(o);
    };
    let h = 0;
    const m = (o, a) => {
      if (a.status >= 400) {
        i(`wget: ERROR ${a.status}: ${a.statusText || "error"}.`), h = 8;
        return;
      }
      const l = W(a.bodyText);
      if (i(`--${ae()}--  ${o}`), s === "-") {
        A(e, a.bodyText);
        return;
      }
      let g = s;
      if (g === null)
        try {
          g = decodeURIComponent(new URL(a.url).pathname.split("/").filter(Boolean).pop() ?? "") || "index.html";
        } catch {
          g = "index.html";
        }
      i(`Saving to: '${g}'`);
      try {
        e.vfs.mountFile(e.vfs.resolve(e.state.cwd, g), a.bodyText);
      } catch (v) {
        e.err(`wget: cannot write '${g}': ${v instanceof Error ? v.message : String(v)}`), h = h === 0 ? 1 : h;
        return;
      }
      i(`'${g}' saved [${l}/${l}]`);
    }, b = (o) => {
      const a = U(o);
      i(`wget: ${a.message}`), h = a.kind === "network" ? 4 : 1;
    }, k = () => e.exit(h);
    if (z() !== null)
      return (async () => {
        for (const o of n)
          try {
            m(o, await F({ method: "GET", url: o, headers: {}, body: null }));
          } catch (a) {
            b(a);
          }
        k();
      })();
    for (const o of n) {
      let a;
      try {
        a = re({ method: "GET", url: o, headers: {}, body: null });
      } catch (l) {
        b(l);
        continue;
      }
      m(o, a);
    }
    k();
  }
}, le = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
function ue(e) {
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
    const i = n.indexOf(":"), h = n.indexOf("=");
    if (i >= 0 && (h < 0 || i < h)) {
      t.push([n.slice(0, i), n.slice(i + 1)]);
      continue;
    }
    if (h >= 0) {
      r[n.slice(0, h)] = n.slice(h + 1), s = !0;
      continue;
    }
    return { ok: !1, error: `invalid item '${n}' (want key:value, key=value or key:=json)` };
  }
  return { ok: !0, headers: t, fields: r, hasFields: s };
}
const de = {
  name: "http",
  usage: x("http"),
  complete: (e) => {
    const t = e.word.toLowerCase();
    return [...le.map((r) => r.toLowerCase()), "-v", "-b", "-h", "--verbose", "--body", "--headers", "--help"].filter(
      (r) => r.startsWith(t)
    );
  },
  run(e) {
    const t = [];
    let r = !1, s = !1, n = !1;
    for (let p = 0; p < e.args.length; p++) {
      const f = e.args[p];
      if (f === "--help") {
        for (const T of [
          x("http"),
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
        ]) e.out(T);
        e.exit(0);
        return;
      }
      if (f === "-v" || f === "--verbose") {
        r = !0;
        continue;
      }
      if (f === "-b" || f === "--body") {
        s = !0;
        continue;
      }
      if (f === "-h" || f === "--headers") {
        n = !0;
        continue;
      }
      t.push(f);
    }
    let d = null;
    t.length > 1 && /^[A-Za-z]+$/.test(t[0]) && (d = t.shift().toUpperCase());
    let i = t.shift();
    if (i === void 0 || i === "") {
      e.err("http: error: a URL is required"), e.exit(1);
      return;
    }
    /^[a-z][a-z0-9+.-]*:\/\//i.test(i) || (i = "http://" + i);
    const h = ue(t);
    if (!h.ok) {
      e.err(`http: error: ${h.error}`), e.exit(1);
      return;
    }
    const m = e.stdin;
    if (h.hasFields && m !== null && m !== "") {
      e.err("http: error: request body from stdin and key=value items are mutually exclusive"), e.exit(1);
      return;
    }
    const b = h.hasFields || m !== null && m !== "", k = d ?? (b ? "POST" : "GET"), o = { Accept: "application/json, */*" };
    b && (o["Content-Type"] = "application/json");
    for (const [p, f] of h.headers) o[p] = f;
    let a = null;
    m !== null && m !== "" ? a = m : h.hasFields && (a = JSON.stringify(h.fields));
    let l;
    try {
      l = C(i);
    } catch (p) {
      const f = U(p);
      e.err(`http: error: ${f.message}`), e.exit(N(f));
      return;
    }
    o.Host = l.host;
    const g = (p) => {
      const f = U(p);
      e.err(`http: error: ${f.message}`), e.exit(N(f));
    }, v = (p) => {
      const f = e.color;
      if (r) {
        const T = l.pathname + l.search;
        e.out(L(f, 90, `${k} ${T} HTTP/1.1`));
        for (const O of $(o)) e.out(L(f, 90, O));
        if (a !== null) {
          e.out("");
          for (const O of D("application/json", a, f).split(`
`)) e.out(O);
        }
        e.out("");
      }
      if (!s) {
        e.out(L(f, p.status < 300 ? 32 : p.status < 400 ? 33 : 31, J(p)));
        for (const T of $(p.headers)) e.out(T);
      }
      if (!n) {
        s || e.out("");
        const T = D(p.headers["content-type"] ?? "", p.bodyText, f);
        if (T !== "") {
          const O = T.split(`
`);
          T.endsWith(`
`) && O.pop();
          for (const H of O) e.out(H);
        }
      }
      e.exit(0);
    };
    let E;
    try {
      E = F({ method: k, url: i, headers: o, body: a });
    } catch (p) {
      g(p);
      return;
    }
    if (E instanceof Promise) return E.then(v, g);
    v(E);
  }
}, ce = [oe, ie, de], he = {
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
    "     HTTP client modelled on GNU curl. The request runs on the",
    "     synchronous transport (transport.ts): the shell blocks until the",
    "     response arrives, and the body flows through stdout like any",
    "     command output — pipes and redirection work.",
    "",
    "     No ambient credentials are ever attached (the transport never",
    "     enables withCredentials): cookies and HTTP auth travel only when",
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
}, ye = { commands: ce, manPages: he };
export {
  S as NetError,
  ce as commands,
  fe as configureNet,
  we as fetchTransport,
  he as manPages,
  me as netConfig,
  ye as pkg,
  pe as resetNet
};
