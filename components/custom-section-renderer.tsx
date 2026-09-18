"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sanitizeCustomSectionCss, sanitizeCustomSectionHtml } from "@/lib/custom-sections";

type CustomSectionRendererProps = {
  sectionId: string;
  sectionName: string;
  html: string;
  css: string;
  lazy?: boolean;
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
export function CustomSectionRenderer({ sectionId, sectionName, html, css, lazy = false }: CustomSectionRendererProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [source, setSource] = useState({ html, css });
  const frameRequest = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastHeight = useRef(0);
  const resizeStreak = useRef({ count: 0, started: 0 });
  useEffect(() => {
    const timer = window.setTimeout(() => setSource({ html, css }), 350);
    return () => window.clearTimeout(timer);
  }, [html, css]);
  const documentHtml = useMemo(() => buildCustomSectionDocument(source.html, source.css), [source]);

  function syncHeight() {
    if (frameRequest.current) return;
    frameRequest.current = requestAnimationFrame(() => {
      frameRequest.current = 0;
      const frame = frameRef.current;
      const root = frame?.contentDocument?.getElementById("custom-section-root");
      if (!frame || !root) return;
      const height = Math.min(20_000, Math.max(1, Math.ceil(Math.max(root.scrollHeight, root.getBoundingClientRect().height))));
      if (Math.abs(height - lastHeight.current) < 2) return;
      const now = performance.now();
      const streak = resizeStreak.current;
      if (now - streak.started > 1000) { streak.started = now; streak.count = 0; }
      // A viewport-height-dependent custom rule must not grow without bound.
      if (++streak.count > 12) return;
      lastHeight.current = height;
      frame.style.height = `${height}px`;
    });
  }

  function watchContentSize() {
    cleanupRef.current?.();
    resizeStreak.current = { count: 0, started: 0 };
    const frame = frameRef.current;
    const root = frame?.contentDocument?.getElementById("custom-section-root");
    if (!frame || !root) return;
    let active = true;
    const schedule = () => { if (active) syncHeight(); };
    schedule();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(schedule);
      resizeObserverRef.current.observe(root);
    }
    void frame.contentDocument?.fonts?.ready.then(schedule);
    const images = [...root.querySelectorAll("img")];
    images.forEach((image) => { image.addEventListener("load", schedule); image.addEventListener("error", schedule); });
    cleanupRef.current = () => {
      active = false;
      resizeObserverRef.current?.disconnect();
      cancelAnimationFrame(frameRequest.current);
      frameRequest.current = 0;
      images.forEach((image) => { image.removeEventListener("load", schedule); image.removeEventListener("error", schedule); });
    };
  }

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const phoneScreen = frame.closest(".designer-phone-shell")?.querySelector<HTMLElement>(".designer-phone-screen");
    cleanupRef.current?.();
    lastHeight.current = Math.max(phoneScreen?.clientHeight ?? window.innerHeight, 1);
    frame.style.height = `${lastHeight.current}px`;
  }, [documentHtml]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <section className="custom-section-renderer" data-preview-section={sectionId}>
      <iframe
        ref={frameRef}
        className="custom-section-frame"
        title={`Custom section: ${sectionName || "Untitled"}`}
        srcDoc={documentHtml}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        loading={lazy ? "lazy" : "eager"}
        onLoad={watchContentSize}
      />
    </section>
  );
}
