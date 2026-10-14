/*
 * semtext-editor.js — PLACEHOLDER for the real SemText editor bundle.
 *
 * The npl-enhanced-content editor build (Phase 3, LANE=integrate) ships the
 * real `semtext-editor.js` — an esbuild IIFE exposing global `SemTextEditor`
 * ({ claim, version }), registering light-DOM `<sem-editor>` (window-chrome
 * frame, WYSIWYG | Code | Split, model-backed editing), and draining
 * `drainPending()` (EDITOR.md §4.1/§5/§9.2). Until that bundle is synced
 * into priv/static/semtext/, THIS file stands in at the exact same path so
 * the /editor page, the "Open in editor" links and the lazy-hook URL
 * contract all resolve today. Replace byte-for-byte at the final sync; no
 * site-side code needs to change.
 *
 * Placeholder scope (deliberately honest, no fake affordances):
 *   - Code view is the editor of record (plain textarea over the exact
 *     source bytes; the real model's byte-exact parse/serialize is NOT
 *     reimplemented here).
 *   - WYSIWYG pane is a preview: sanitized source rendered, then upgraded
 *     by the site's island bridge (semtext-island.js) with the tag's
 *     shipped runtime files. It never executes: scripts/frames are dropped
 *     and javascript:/data: URLs (except data:image/) are scrubbed before
 *     anything renders (EDITOR.md §8 posture).
 *   - Undo/Redo buttons are rendered disabled with a title saying the
 *     model history arrives with the real bundle.
 *   - claim(el) is a marker-only shell-less stub (data-sem-editing).
 *
 * Page contract served to /js/editor-boot.js:
 *   el = document.createElement('sem-editor'); root.appendChild(el);
 *   el.runtime = { files, themeCss, lazy };   // optional, from
 *                                             // /editor/examples/<tag>
 *   el.setDocument(source, name);             // sets code + preview
 *   el.mode; el.mode = 'wysiwyg'|'code'|'split';
 *   el.getDocument();                         // current source text
 *
 * This file is part of the semtext.dev replatform (site-editor lane), not
 * the npl-enhanced-content editor source tree. Class prefix `seu-*` is
 * placeholder-local and dies with this file (the real editor reserves
 * `sem-ed-*` — EDITOR.md §0 — which this file never claims).
 */
(function () {
  "use strict";

  if (window.SemTextEditor) return;

  var VERSION = "0.0.0-placeholder+semtext.dev";

  // ————— safety (EDITOR.md §8, placeholder scope) —————
  // Parse the authored source, drop script/frame-capable nodes entirely
  // (the real editor keeps them inert in the model — here there is no
  // model, so the preview simply does not show them), strip event-handler
  // attributes, and reject non-readsafe URL schemes. The textarea always
  // holds the untouched source; export writes those bytes back unchanged.
  var DROP_TAGS = "script,iframe,frame,frameset,object,embed,applet,base,link,meta";
  var URL_ATTRS = ["src", "href", "action", "formaction", "xlink:href", "poster", "background"];

  function urlAllowed(value) {
    var v = String(value || "").trim().toLowerCase();
    if (v === "" || v.charAt(0) === "#") return true;
    if (v.indexOf("javascript:") === 0 || v.indexOf("vbscript:") === 0) return false;
    if (v.indexOf("data:") === 0) return v.indexOf("data:image/") === 0;
    return true; // relative, same-doc, http(s), mailto — browser-CORS governs fetches
  }

  function sanitizeSource(source) {
    var doc = new DOMParser().parseFromString(String(source == null ? "" : source), "text/html");
    var dropped = doc.querySelectorAll(DROP_TAGS);
    for (var i = 0; i < dropped.length; i++) dropped[i].remove();

    var all = doc.querySelectorAll("*");
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      var attrs = [].slice.call(el.attributes);
      for (var k = 0; k < attrs.length; k++) {
        var a = attrs[k];
        var name = a.name.toLowerCase();
        if (name.indexOf("on") === 0) {
          el.removeAttribute(a.name);
        } else if (URL_ATTRS.indexOf(name) !== -1 && !urlAllowed(a.value)) {
          el.removeAttribute(a.name);
        }
      }
    }
    return doc.body;
  }

  // ————— placeholder stylesheet (injected once; dies with this file) —————
  var CSS = [
    "sem-editor{display:block}",
    ".seu-frame{border:1px solid rgba(255,255,255,.14);border-radius:.6rem;overflow:hidden;",
    "background:rgba(255,255,255,.03);margin-top:.25rem}",
    ".seu-bar{display:flex;align-items:center;gap:.5rem;padding:.4rem .7rem;",
    "border-bottom:1px solid rgba(255,255,255,.1);font-size:.75rem;color:#9aa3b2}",
    ".seu-dot{width:.5rem;height:.5rem;border-radius:9999px;background:#4ade80;flex:none}",
    ".seu-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#e5e9f0}",
    ".seu-badge{margin-left:auto;border:1px solid rgba(255,255,255,.18);border-radius:9999px;",
    "padding:.05rem .5rem;font-size:.65rem;letter-spacing:.04em;text-transform:uppercase}",
    ".seu-toolbar{display:flex;align-items:center;gap:.4rem;padding:.35rem .6rem;flex-wrap:wrap;",
    "border-bottom:1px solid rgba(255,255,255,.1)}",
    ".seu-modes{display:inline-flex;border:1px solid rgba(255,255,255,.16);border-radius:.45rem;overflow:hidden}",
    ".seu-modes button{appearance:none;border:0;background:transparent;color:#9aa3b2;",
    "font:inherit;font-size:.75rem;padding:.25rem .7rem;cursor:pointer}",
    ".seu-modes button[aria-checked='true']{background:rgba(255,255,255,.12);color:#f3f5f7}",
    ".seu-modes button:focus-visible{outline:2px solid #7aa2ff;outline-offset:-2px}",
    ".seu-tbtn{appearance:none;border:1px solid rgba(255,255,255,.16);border-radius:.45rem;",
    "background:transparent;color:#c9d0da;font:inherit;font-size:.75rem;padding:.25rem .6rem;cursor:pointer}",
    ".seu-tbtn:disabled{opacity:.4;cursor:not-allowed}",
    ".seu-tbtn:focus-visible{outline:2px solid #7aa2ff;outline-offset:1px}",
    ".seu-spring{flex:1}",
    ".seu-body{display:none;min-height:22rem}",
    ".seu-body[data-mode='code'] .seu-codepane{display:block}",
    ".seu-body[data-mode='wysiwyg'] .seu-previewpane{display:block}",
    "@media (min-width:900px){.seu-body[data-mode='split'] .seu-codepane,.seu-body[data-mode='split'] .seu-previewpane{display:block;width:50%}}",
    "@media (max-width:899.98px){.seu-body[data-mode='split'] .seu-codepane{display:block;border-bottom:1px solid rgba(255,255,255,.1)}}",
    ".seu-body[data-mode='split']{display:flex;flex-direction:column}",
    "@media (min-width:900px){.seu-body[data-mode='split']{flex-direction:row}",
    ".seu-body[data-mode='split'] .seu-codepane{border-right:1px solid rgba(255,255,255,.1);border-bottom:0}}",
    ".seu-codepane,.seu-previewpane{display:none;min-width:0}",
    ".seu-code{display:block;width:100%;min-height:22rem;max-height:70vh;border:0;resize:vertical;",
    "background:rgba(0,0,0,.25);color:#dfe4ea;padding:.8rem 1rem;",
    "font:12.5px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre;overflow:auto}",
    ".seu-code:focus-visible{outline:2px solid #7aa2ff;outline-offset:-2px}",
    ".seu-previewpane{background:#181c23}",
    ".seu-preview{padding:1rem 1.1rem;min-height:22rem}",
    ".seu-preview[data-sem-booting]{opacity:.6}",
    ".seu-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    "[data-sem-editing]{outline:2px dashed #7aa2ff;outline-offset:2px}"
  ].join("");

  function injectCss() {
    if (document.getElementById("seu-css")) return;
    var style = document.createElement("style");
    style.id = "seu-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ————— the <sem-editor> placeholder element —————
  class SemEditorPlaceholder extends HTMLElement {
    connectedCallback() {
      if (this.__built) return;
      this.__built = true;
      injectCss();
      this.__runtime = { files: [], themeCss: [], lazy: false };
      this.__build();
      var initial = this.getAttribute("data-mode") || "split";
      this.mode = initial;
    }

    disconnectedCallback() {
      if (this.__debounce) clearTimeout(this.__debounce);
    }

    __build() {
      this.textContent = "";

      var frame = document.createElement("div");
      frame.className = "seu-frame";

      var bar = document.createElement("div");
      bar.className = "seu-bar";
      var dot = document.createElement("span");
      dot.className = "seu-dot";
      dot.setAttribute("aria-hidden", "true");
      var name = document.createElement("span");
      name.className = "seu-name";
      name.textContent = this.getAttribute("document-name") || "untitled.html";
      var badge = document.createElement("span");
      badge.className = "seu-badge";
      badge.textContent = "placeholder editor";
      bar.append(dot, name, badge);
      this.__name = name;

      var toolbar = document.createElement("div");
      toolbar.className = "seu-toolbar";
      toolbar.setAttribute("role", "toolbar");
      toolbar.setAttribute("aria-label", "Editor toolbar");

      var modes = document.createElement("div");
      modes.className = "seu-modes";
      modes.setAttribute("role", "radiogroup");
      modes.setAttribute("aria-label", "View mode");
      var modeBtns = {};
      ["wysiwyg", "code", "split"].forEach(
        function (m) {
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("role", "radio");
          b.dataset.modeBtn = m;
          b.textContent = m === "wysiwyg" ? "WYSIWYG" : m.charAt(0).toUpperCase() + m.slice(1);
          b.addEventListener("click", this.__setMode.bind(this, m));
          modes.appendChild(b);
          modeBtns[m] = b;
        }.bind(this)
      );
      this.__modeBtns = modeBtns;

      var spring = document.createElement("span");
      spring.className = "seu-spring";

      var undo = document.createElement("button");
      undo.type = "button";
      undo.className = "seu-tbtn";
      undo.disabled = true;
      undo.textContent = "Undo";
      undo.title = "Model history arrives with the real editor bundle";
      var redo = undo.cloneNode(true);
      redo.textContent = "Redo";

      var exp = document.createElement("button");
      exp.type = "button";
      exp.className = "seu-tbtn";
      exp.dataset.act = "export";
      exp.textContent = "Export";
      exp.title = "Download the document (Ctrl/Cmd+S)";
      exp.addEventListener("click", this.export.bind(this));

      toolbar.append(modes, spring, undo, redo, exp);

      var body = document.createElement("div");
      body.className = "seu-body";
      body.dataset.mode = "split";
      this.__body = body;

      var codepane = document.createElement("section");
      codepane.className = "seu-codepane";
      codepane.setAttribute("aria-label", "Document source");
      var code = document.createElement("textarea");
      code.className = "seu-code";
      code.spellcheck = false;
      code.setAttribute("aria-label", "Document source (XHTML)");
      code.addEventListener(
        "input",
        function () {
          var self = this;
          if (this.__debounce) clearTimeout(this.__debounce);
          this.__debounce = setTimeout(function () {
            self.renderPreview();
          }, 300);
        }.bind(this)
      );
      this.__code = code;
      codepane.appendChild(code);

      var prevpane = document.createElement("section");
      prevpane.className = "seu-previewpane";
      prevpane.setAttribute("aria-label", "Preview");
      var preview = document.createElement("div");
      preview.className = "seu-preview";
      preview.setAttribute("data-sem-theme", "minimal-tech-light");
      this.__preview = preview;
      prevpane.appendChild(preview);

      body.append(codepane, prevpane);

      var live = document.createElement("div");
      live.className = "seu-live";
      live.setAttribute("aria-live", "polite");
      this.__live = live;

      frame.append(bar, toolbar, body, live);
      this.appendChild(frame);

      this.addEventListener("keydown", this.__onKeydown.bind(this));
    }

    __onKeydown(e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && (e.key === "E" || e.key === "e")) {
        e.preventDefault();
        var order = ["wysiwyg", "code", "split"];
        var next = order[(order.indexOf(this.mode) + 1) % order.length];
        this.mode = next;
        this.announce("View mode " + next);
      } else if (mod && !e.shiftKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        this.export();
      }
    }

    __setMode(m) {
      this.mode = m;
      this.announce("View mode " + m);
    }

    // ————— public surface —————

    get mode() {
      return this.__body ? this.__body.dataset.mode : "split";
    }

    set mode(m) {
      if (["wysiwyg", "code", "split"].indexOf(m) === -1) m = "split";
      if (this.__body) this.__body.dataset.mode = m;
      this.setAttribute("data-mode", m);
      var btns = this.__modeBtns || {};
      Object.keys(btns).forEach(function (k) {
        btns[k].setAttribute("aria-checked", k === m ? "true" : "false");
        btns[k].tabIndex = k === m ? 0 : -1;
      });
    }

    get runtime() {
      return this.__runtime;
    }

    set runtime(spec) {
      this.__runtime = {
        files: (spec && spec.files) || [],
        themeCss: (spec && spec.themeCss) || [],
        lazy: !!(spec && spec.lazy),
      };
    }

    setDocument(source, name) {
      if (!this.__built) this.connectedCallback();
      this.__code.value = String(source == null ? "" : source);
      this.__name.textContent = name || "untitled.html";
      this.setAttribute("document-name", this.__name.textContent);
    }

    getDocument() {
      return this.__code ? this.__code.value : "";
    }

    announce(msg) {
      if (this.__live) {
        this.__live.textContent = "";
        window.setTimeout(
          function () {
            this.__live.textContent = msg;
          }.bind(this),
          30
        );
      }
    }

    // Preview through the site's island bridge: sanitized HTML + the tag's
    // shipped runtime files, pane-scoped. A fresh pane per render keeps the
    // bridge's first-sync injection contract; already-loaded files are
    // cached by the bridge so re-renders do not re-download. Without the
    // bridge the sanitized static markup still renders (no enhancements).
    renderPreview() {
      var body = sanitizeSource(this.__code.value);
      var pane = document.createElement("div");
      pane.className = "seu-preview";
      pane.setAttribute("data-sem-theme", "minimal-tech-light");

      var files = this.__runtime.files || [];
      var spec = {
        files: files,
        themeCss: this.__runtime.themeCss || [],
        lazy: !!this.__runtime.lazy,
        wire: files.length > 0,
        html: body.innerHTML,
      };
      pane.setAttribute("data-sem-pane", JSON.stringify(spec));

      this.__preview.replaceWith(pane);
      this.__preview = pane;

      if (window.SemtextIsland && typeof window.SemtextIsland.syncPane === "function") {
        window.SemtextIsland.syncPane(pane);
      } else {
        pane.appendChild(document.importNode(body, true));
      }
    }

    export() {
      var name = (this.__name.textContent || "untitled.html").replace(/[^\w.-]+/g, "_");
      var blob = new Blob([this.getDocument()], { type: "text/html;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.announce("Exported " + name);
    }
  }

  if (!customElements.get("sem-editor")) {
    customElements.define("sem-editor", SemEditorPlaceholder);
  }

  // ————— the SemTextEditor global (EDITOR.md §9.2 shape, stub scope) —————
  window.SemTextEditor = {
    version: VERSION,

    // Shell-less claim (EDITOR.md §4.8) — placeholder stub: mark the
    // element and return a release handle. Real editing arrives with the
    // real bundle; the marker is honest chrome, not a fake editor.
    claim(el) {
      if (!el || el.nodeType !== 1) return null;
      el.setAttribute("data-sem-editing", "");
      return {
        el: el,
        release() {
          el.removeAttribute("data-sem-editing");
        },
      };
    },

    // Exposed for the page layer: the preview never renders unsanitized.
    sanitize: sanitizeSource,
  };
})();
