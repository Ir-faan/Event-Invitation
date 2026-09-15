"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { sanitizeCustomSectionCss, sanitizeCustomSectionHtml } from "@/lib/custom-sections";

type CustomSectionRendererProps = {
  sectionId: string;
  sectionName: string;
  html: string;
  css: string;
};

const customSectionBaseCss = `
:root { color-scheme: light; }
html, body { width: 100%; min-width: 0; margin: 0; padding: 0; background: transparent; }
body { overflow: hidden; }
*, *::before, *::after { box-sizing: border-box; }
#custom-section-root { display: flow-root; width: 100%; min-width: 0; overflow-wrap: anywhere; }
img, picture, video, canvas { max-width: 100%; }
img, video, canvas { height: auto; }
`;

export function buildCustomSectionDocument(html: string, css: string) {
  const safeHtml = sanitizeCustomSectionHtml(html);
  const safeCss = sanitizeCustomSectionCss(css);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; base-uri 'none'; form-action 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:; media-src https: data:" />
    <style>${customSectionBaseCss}\n${safeCss}</style>
  </head>
  <body><div id="custom-section-root">${safeHtml}</div></body>
</html>`;
}

/**
 * A sandboxed iframe is used instead of Shadow DOM because viewport media
 * queries must follow the simulated phone width in the editor.
 */
export function CustomSectionRenderer({ sectionId, sectionName, html, css }: CustomSectionRendererProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const documentHtml = useMemo(() => buildCustomSectionDocument(html, css), [html, css]);

  function syncHeight() {
    const frame = frameRef.current;
    const root = frame?.contentDocument?.getElementById("custom-section-root");
    if (!frame || !root) return;
    const height = Math.max(root.scrollHeight, root.getBoundingClientRect().height, 1);
    frame.style.height = `${Math.ceil(height)}px`;
  }

  function watchContentSize() {
    const frame = frameRef.current;
    const root = frame?.contentDocument?.getElementById("custom-section-root");
    if (!frame || !root) return;
    resizeObserverRef.current?.disconnect();
    syncHeight();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(syncHeight);
      resizeObserverRef.current.observe(root);
    }
    void frame.contentDocument?.fonts?.ready.then(syncHeight);
    root.querySelectorAll("img").forEach((image) => image.addEventListener("load", syncHeight, { once: true }));
  }

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const phoneScreen = frame.closest(".designer-phone-shell")?.querySelector<HTMLElement>(".designer-phone-screen");
    frame.style.height = `${Math.max(phoneScreen?.clientHeight ?? window.innerHeight, 1)}px`;
  }, [documentHtml]);

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  return (
    <section className="custom-section-renderer" data-preview-section={sectionId}>
      <iframe
        ref={frameRef}
        className="custom-section-frame"
        title={`Custom section: ${sectionName || "Untitled"}`}
        srcDoc={documentHtml}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        loading="eager"
        onLoad={watchContentSize}
      />
    </section>
  );
}
