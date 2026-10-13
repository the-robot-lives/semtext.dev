"use client";

import { useState } from "react";

const DOC_HTML = `<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8" />
  <title>Auth notes</title>
  <link rel="stylesheet" href="https://cdn.semtext.dev/v0/semtext.css" />
  <link rel="stylesheet" href="https://cdn.semtext.dev/v0/semtext-theme-minimal-tech-light.css" />
  <script defer src="https://cdn.semtext.dev/v0/semtext.js"></script>
</head>
<body>
<sem-enhanced-document>

  <h1 data-kind="title">Auth notes</h1>

  <sem-note variant="warning">
    Refresh tokens rotate per use — each exchange retires the last one.
  </sem-note>

  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access tokens; the refresh grant issues a new pair.</conclusion>
      <sem-distractor>Store the token in localStorage for durability.</sem-distractor>
    </sem-fact>
  </sem-facts>

</sem-enhanced-document>
</body>
</html>`;

type TokenType = "kw" | "str" | "fn" | "num" | "cmt" | "type" | "default";

interface Token {
  text: string;
  type: TokenType;
}

function tokenizeHTML(code: string): Token[][] {
  const lines = code.split("\n");
  const tokenized: Token[][] = [];

  for (const line of lines) {
    const lineTokens: Token[] = [];
    let remaining = line;
    let pos = 0;

    while (pos < remaining.length) {
      const char = remaining[pos];

      // Comment
      if (char === "<" && remaining.slice(pos, pos + 4) === "<!--") {
        const end = remaining.indexOf("-->", pos);
        const endIdx = end >= 0 ? end + 3 : remaining.length;
        lineTokens.push({ text: remaining.slice(pos, endIdx), type: "cmt" });
        pos = endIdx;
        continue;
      }

      // Tag opening
      if (char === "<" && remaining[pos + 1] !== "!") {
        const end = remaining.indexOf(">", pos);
        const endIdx = end >= 0 ? end + 1 : remaining.length;
        const tagContent = remaining.slice(pos, endIdx);

        // Keywords in tag: doctype, html, head, meta, link, title, script, body, sem-*, etc.
        const isClosing = tagContent[1] === "/";
        const tagNameMatch = tagContent.match(
          /^<\/?(\w+(?:-\w+)*)/
        );
        const tagName = tagNameMatch?.[1] || "";
        const isKeyword =
          [
            "doctype",
            "html",
            "head",
            "meta",
            "link",
            "title",
            "script",
            "body",
            "sem-enhanced-document",
            "sem-note",
            "sem-facts",
            "sem-fact",
            "h1",
          ].includes(tagName.toLowerCase()) || tagName.startsWith("sem-");

        lineTokens.push({
          text: tagContent,
          type: isKeyword ? "kw" : "type",
        });
        pos = endIdx;
        continue;
      }

      // String (quoted attributes)
      if (char === '"') {
        const end = remaining.indexOf('"', pos + 1);
        const endIdx = end >= 0 ? end + 1 : remaining.length;
        lineTokens.push({
          text: remaining.slice(pos, endIdx),
          type: "str",
        });
        pos = endIdx;
        continue;
      }

      // Whitespace / normal text
      if (/\s/.test(char)) {
        let end = pos;
        while (end < remaining.length && /\s/.test(remaining[end])) {
          end++;
        }
        lineTokens.push({ text: remaining.slice(pos, end), type: "default" });
        pos = end;
        continue;
      }

      // Default fallback: consume one code point — UTF-16 astral chars
      // (emoji in authored examples) must stay ONE token, or the server
      // renders a lone surrogate as U+FFFD and hydration mismatches.
      const cp = remaining.codePointAt(pos) ?? char.codePointAt(0)!;
      const glyph = String.fromCodePoint(cp);
      lineTokens.push({ text: glyph, type: "default" });
      pos += glyph.length;
    }

    tokenized.push(lineTokens);
  }

  return tokenized;
}

/*
 * Shared code window: HTML highlighting, line numbers, Copy and Save.
 * Defaults keep the landing's minimal document; /reference passes the
 * authored example per tag (code, filename, caption, label) and slots its
 * Source/Render pills into the chrome via `actions`.
 *
 * The tokenized lines render on the server too — tokenizeHTML is pure and
 * deterministic, so the static export ships highlighted code with line
 * numbers and hydration matches with no gate.
 */
export interface CodeViewerProps {
  code?: string;
  filename?: string;
  caption?: string;
  label?: string;
  actions?: React.ReactNode;
}

const ACTION_BUTTON_CLASS =
  "ml-2 text-xs text-violet-soft hover:text-violet-soft hover:brightness-110";

/*
 * The chrome's Copy and Save pair, shared by the code window and the
 * example viewer's Render pane: Copy writes `code` (the authored source,
 * never a rendered view) to the clipboard; Save downloads it as
 * `filename`. Both actions need script, so zero-JS-critical callers gate
 * this component behind hydration (ExampleViewer does) — rendered here
 * unguarded only where the chrome is already script-only.
 */
export function CopySaveButtons({
  code,
  filename,
  mimeType = "text/html",
  buttonClassName = ACTION_BUTTON_CLASS,
}: {
  code: string;
  filename: string;
  mimeType?: string;
  buttonClassName?: string;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "error"
  >("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([code], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadStatus("downloading");
      setTimeout(() => setDownloadStatus("idle"), 1000);
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadStatus("error");
      setTimeout(() => setDownloadStatus("idle"), 2000);
    }
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className={buttonClassName}
        aria-label="Copy code"
        title={copyStatus === "copied" ? "Copied" : "Copy"}
      >
        {copyStatus === "copied" ? "✓ Copied" : "Copy"}
      </button>
      <button
        onClick={handleDownload}
        className={buttonClassName}
        aria-label={`Save ${filename}`}
        title={downloadStatus === "downloading" ? "Downloading..." : "Download"}
      >
        {downloadStatus === "downloading" ? "↓ Saving" : "Save"}
      </button>
    </>
  );
}

export function CodeViewer({
  code = DOC_HTML,
  filename = "doc.html",
  caption = "minimal SemText document",
  label = "A minimal SemText document",
  actions,
}: CodeViewerProps) {
  const tokenized = tokenizeHTML(code);

  return (
    <figure className="code-window mt-8" aria-label={label}>
      <div className="code-chrome">
        <span className="dot live" aria-hidden="true" />
        <span className="flex-1">
          {filename} · {caption}
        </span>
        {actions}
        <CopySaveButtons code={code} filename={filename} />
      </div>

      <div
        className="code-content"
        style={{
          padding: "1rem 1.1rem 1.2rem",
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: "0.8rem",
          lineHeight: "1.65",
          color: "var(--ink)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowX: "auto",
        }}
      >
        {tokenized.map((lineTokens, lineIdx) => (
          <div
            key={lineIdx}
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "2.5rem",
                textAlign: "right",
                marginRight: "1rem",
                color: "var(--code-gray)",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              {lineIdx + 1}
            </span>
            <span>
              {lineTokens.map((token, tokenIdx) => {
                const className =
                  token.type !== "default" ? `tok-${token.type}` : "";
                return (
                  <span key={tokenIdx} className={className}>
                    {token.text}
                  </span>
                );
              })}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
