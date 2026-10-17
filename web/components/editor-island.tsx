"use client";

import { useEffect, useRef } from "react";
import { semtextAsset } from "@/lib/semtext-asset";

/*
 * The /editor island: a client-only mount of <sem-editor> from the shipped
 * semtext-editor.js bundle (the SemText editor, EDITOR.md §5/§9). The server
 * page passes the reference examples (from data/elements.json + the variants
 * supplement) as props; the document itself is resolved CLIENT-side from the
 * query string — the static export has no searchParams at build time:
 *
 *   /editor/                              → built-in starter document
 *   /editor/?example=<tag>                → that tag's reference example
 *   /editor/?example=<tag>&variant=<id>   → one labelled variant of it
 *   /editor/?src=<path>                   → a SAME-ORIGIN path, fetched as text
 *
 * Boot follows the bundle's own demo recipe (npl web/demo/editor.html):
 * load semtext.js (the element runtime), then semtext-editor.js (the shell +
 * descriptors), mount <sem-editor> with a slotted <sem-editor-code> pane,
 * and hand it the document through the public surface —
 * SemTextEditor.createDocument(source) + editor.openDocument(doc).
 *
 * Everything the boot builds (the frame, the code pane) is created with DOM
 * APIs and owned by the editor afterwards; the island renders no React state
 * that could re-render over it — status updates go through a ref'd live
 * region, the scripts load exactly once.
 */

export interface EditorExample {
  /** Canonical element name, e.g. "sem-note". */
  name: string;
  /** Authored example markup (the reference page's primary example). */
  example: string;
}

export interface EditorVariantExample {
  id: string;
  label: string;
  code: string;
}

const STARTER_DOC = [
  '<sem-heading level="2">A SemText document, live</sem-heading>',
  "<sem-paragraph>This canvas is one SemText document. Double-click any text to edit it in place, use the plus between blocks to insert an element, or switch the toolbar to Code to edit the source — both views are projections of the same document model.</sem-paragraph>",
  '<sem-note variant="tip"><sem-paragraph>Everything you change stays in this browser tab; the toolbar Export hands you the XHTML file.</sem-paragraph></sem-note>',
  '<sem-facts kind="glossary">',
  "<sem-fact><term>SemText</term><definition>One XHTML file that models read and write instead of Markdown.</definition></sem-fact>",
  "<sem-fact><term>Editor</term><definition>A local-first WYSIWYG and code editor over the same document model.</definition></sem-fact>",
  "</sem-facts>",
].join("\n");

interface EditorGlobals {
  createDocument: (source: string) => unknown;
}

function loadScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`${src} failed to load`));
    document.head.appendChild(script);
  });
}

/** Same-origin paths only: resolve against this origin, refuse anything
 *  that lands elsewhere (absolute foreign URLs, other schemes). */
function sameOriginTarget(src: string): string | null {
  try {
    const url = new URL(src, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function EditorIsland({
  examples,
  variants,
}: {
  examples: Record<string, EditorExample>;
  variants: Record<string, EditorVariantExample[]>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const nojsRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const mount = mountRef.current;
    const status = statusRef.current;
    const nojs = nojsRef.current;
    if (!mount || !status || !nojs) return;

    const say = (text: string) => {
      status.textContent = text;
    };

    const params = new URLSearchParams(window.location.search);
    const exampleSlug = params.get("example");
    const variantId = params.get("variant");
    const srcParam = params.get("src");

    /** Mount the editor over one document source. */
    const boot = (docSource: string, docLabel: string) => {
      const w = window as unknown as { SemTextEditor?: EditorGlobals };
      const editorApi = w.SemTextEditor;
      if (!editorApi || typeof editorApi.createDocument !== "function") {
        say("The editor runtime did not load. Reload the page, or read the format in the reference.");
        return;
      }
      const editor = document.createElement("sem-editor");
      editor.setAttribute("data-testid", "sem-editor-host");
      const codePane = document.createElement("sem-editor-code");
      codePane.setAttribute("slot", "code-view");
      editor.appendChild(codePane);
      mount.appendChild(editor);
      try {
        const doc = editorApi.createDocument(docSource);
        (editor as unknown as { openDocument(doc: unknown): void }).openDocument(doc);
        nojs.hidden = true;
        say(`Editing ${docLabel}.`);
      } catch {
        say("This document could not be parsed. Check the source, or start from the reference examples.");
      }
    };

    const bootScripts = (docSource: string, docLabel: string) => {
      loadScript(semtextAsset("semtext.js"))
        .then(() => loadScript(semtextAsset("semtext-editor.js")))
        .then(() => boot(docSource, docLabel))
        .catch(() => {
          say("The editor runtime could not be loaded. Reload the page, or read the format in the reference.");
        });
    };

    if (srcParam !== null) {
      const target = sameOriginTarget(srcParam);
      if (target === null) {
        say("?src= takes a path on this site only — example: /editor/?src=/semtext/VERSION.md");
      } else {
        say("Loading document…");
        fetch(target)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
          })
          .then((text) => bootScripts(text, target))
          .catch(() => {
            say(`Could not load ${target}. Check the path and try again, or start from the reference examples.`);
          });
        return;
      }
    }

    if (exampleSlug !== null) {
      const example = examples[exampleSlug];
      if (example) {
        let code = example.example;
        let label = `the <${example.name}> reference example`;
        if (variantId) {
          const variant = (variants[exampleSlug] ?? []).find((v) => v.id === variantId);
          if (variant) {
            code = variant.code;
            label = `the <${example.name}> reference example — ${variant.label}`;
          } else {
            say(`No variant “${variantId}” of <${example.name}> — showing the primary example.`);
          }
        }
        bootScripts(code, label);
        return;
      }
      say(`No reference example for “${exampleSlug}” — showing the starter document. Every tag lives in the reference.`);
    }

    bootScripts(STARTER_DOC, "the starter document");
    // The example maps are build-time data — they never change for the
    // lifetime of the page, so the boot runs exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-sem-theme="minimal-tech-light"
      data-color-mode="dark"
      data-testid="editor-island"
    >
      <p
        ref={statusRef}
        aria-live="polite"
        data-testid="editor-status"
        className="min-h-6 font-mono text-xs text-ink-mute"
      />
      {/* The no-JS tier: the static export ships this note; the boot hides
          it only once the editor is actually mounted over a document. */}
      <div
        ref={nojsRef}
        data-testid="editor-nojs"
        className="code-window px-5 py-6 text-sm leading-6 text-ink-mute"
      >
        <p>
          The editor needs JavaScript: it is a web component over the SemText
          document model. Without it you can still read every element&apos;s
          authored examples in the{" "}
          <a
            href="/reference/"
            className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
          >
            tag reference
          </a>
          .
        </p>
      </div>
      <div ref={mountRef} data-testid="editor-mount" className="min-h-[60vh]" />
    </div>
  );
}
