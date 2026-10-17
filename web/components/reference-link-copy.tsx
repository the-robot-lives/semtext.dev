"use client";

import { useEffect } from "react";

/*
 * Rendered `sem-references` examples carry a per-citation back arrow
 * (`span.sem-references-backlinks a`, the "↩" glyph). Following it jumps
 * this docs page to the in-document anchor and the viewer boot pass makes
 * the jump read as a page refresh — SEMTEX-010: the arrow should copy the
 * link, not navigate.
 *
 * Delegated capture-phase click handler, scoped to the reference pages this
 * component is mounted on: a plain left click on a back arrow is prevented
 * and its absolute href goes to the clipboard; modifier clicks (new tab,
 * window) keep native behaviour. Feedback lands on the arrow itself — a
 * `data-copied` marker plus a transient title — so no chrome is added to
 * the example document. Clipboard failure degrades to the resolved link in
 * the title so the URL is still recoverable.
 */
export function ReferenceLinkCopy() {
  useEffect(() => {
    let revert: number | undefined;

    const flash = (anchor: HTMLAnchorElement, message: string) => {
      anchor.setAttribute("data-copied", message.startsWith("Link copied") ? "true" : "error");
      anchor.setAttribute("title", message);
      window.clearTimeout(revert);
      revert = window.setTimeout(() => {
        anchor.removeAttribute("data-copied");
        anchor.removeAttribute("title");
      }, 1800);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("span.sem-references-backlinks a");
      if (!anchor) return;
      const raw = anchor.getAttribute("href");
      if (!raw) return;
      let href: string;
      try {
        href = new URL(raw, window.location.href).toString();
      } catch {
        return;
      }
      event.preventDefault();
      const copied = () => flash(anchor, "Link copied to clipboard");
      const failed = () => flash(anchor, `Copy failed — link: ${href}`);
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(href).then(copied, failed);
      } else {
        failed();
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(revert);
    };
  }, []);

  return null;
}
