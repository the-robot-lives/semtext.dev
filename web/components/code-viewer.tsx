"use client";

import { useEffect, useRef, useState } from "react";

const DOC_HTML = `<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Auth notes</title>
  <link rel="stylesheet" href="https://cdn.semtext.dev/semtext.css">
  <link rel="stylesheet" href="https://cdn.semtext.dev/semtext-theme-minimal-tech-light.css">
  <script src="https://cdn.semtext.dev/semtext.js"></script>
</head>
<body>
<sem-enhanced-document>

  <h1>Auth notes</h1>

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

      // Default fallback: consume one char
      lineTokens.push({ text: char, type: "default" });
      pos++;
    }

    tokenized.push(lineTokens);
  }

  return tokenized;
}

export function CodeViewer() {
  const [mounted, setMounted] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "error"
  >("idle");

  useEffect(() => setMounted(true), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DOC_HTML);
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
      const blob = new Blob([DOC_HTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "doc.html";
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

  const tokenized = tokenizeHTML(DOC_HTML);

  return (
    <figure
      className="code-window mt-8"
      aria-label="A minimal SemText document"
    >
      <div className="code-chrome">
        <span className="dot live" aria-hidden="true" />
        <span className="flex-1">doc.html · minimal SemText document</span>
        <button
          onClick={handleCopy}
          className="ml-2 text-xs text-violet-soft hover:text-violet-soft hover:brightness-110"
          aria-label="Copy code"
          title={copyStatus === "copied" ? "Copied!" : "Copy"}
        >
          {copyStatus === "copied" ? "✓ Copied" : "Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="ml-2 text-xs text-violet-soft hover:text-violet-soft hover:brightness-110"
          aria-label="Download doc.html"
          title={downloadStatus === "downloading" ? "Downloading..." : "Download"}
        >
          {downloadStatus === "downloading" ? "↓ Saving" : "Save"}
        </button>
      </div>

      {mounted ? (
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
      ) : (
        <pre>
          <code>{DOC_HTML}</code>
        </pre>
      )}
    </figure>
  );
}
