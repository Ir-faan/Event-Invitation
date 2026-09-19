"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sanitizeCustomSectionCss, sanitizeCustomSectionHtml } from "@/lib/custom-sections";
import { getInvitationThemeVariables, type PaletteId } from "@/lib/invitation-designer";

type CustomSectionRendererProps = {
  sectionId: string;
  sectionName: string;
  html: string;
  css: string;
  palette?: PaletteId;
  lazy?: boolean;
};

type HeightSyncReason = "load" | "observer" | "asset";

export const customSectionPreviewDebounceMs = 250;
const customSectionHeightTolerance = 1;
const maxCustomSectionHeight = 20_000;

const customSectionBaseCss = `
html, body { width: 100%; min-width: 0; margin: 0; padding: 0; background: transparent; }
body { overflow: hidden; }
*, *::before, *::after { box-sizing: border-box; }
#custom-section-root { display: flow-root; width: 100%; min-width: 0; overflow-wrap: anywhere; }
img, picture, video, canvas { max-width: 100%; }
img, video, canvas { height: auto; }
`;

function buildThemeVariableCss(palette: PaletteId) {
  const variables = getInvitationThemeVariables(palette);
  return `:root {
  color-scheme: light;
${Object.entries(variables).map(([name, value]) => `  ${name}: ${value};`).join("\n")}
}`;
}

export function buildCustomSectionDocument(html: string, css: string, palette: PaletteId = "beige") {
  const safeHtml = sanitizeCustomSectionHtml(html);
  const safeCss = sanitizeCustomSectionCss(css);
  const themeVariableCss = buildThemeVariableCss(palette);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; base-uri 'none'; form-action 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:; media-src https: data:" />
    <style>${themeVariableCss}\n${customSectionBaseCss}\n${safeCss}</style>
  </head>
  <body><div id="custom-section-root">${safeHtml}</div></body>
</html>`;
}

/**
 * A sandboxed iframe is used instead of Shadow DOM because viewport media
 * queries must follow the simulated phone width in the editor.
 */
export function CustomSectionRenderer({ sectionId, sectionName, html, css, palette = "beige", lazy = false }: CustomSectionRendererProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeAnimationFrameRef = useRef<number | null>(null);
  const observedDocumentRef = useRef<Document | null>(null);
  const imageLoadCleanupsRef = useRef<Array<() => void>>([]);
  const pendingSyncReasonRef = useRef<HeightSyncReason>("observer");
  const feedbackGuardRef = useRef({ direction: 0, lastWriteAt: 0, streak: 0 });
  const [previewSource, setPreviewSource] = useState(() => ({ html, css }));
  const documentHtml = useMemo(
    () => buildCustomSectionDocument(previewSource.html, previewSource.css, palette),
    [palette, previewSource.css, previewSource.html],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPreviewSource((current) => current.html === html && current.css === css ? current : { html, css });
    }, customSectionPreviewDebounceMs);
    return () => window.clearTimeout(timeout);
  }, [css, html]);

  const stopWatchingContent = useCallback(() => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    if (resizeAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeAnimationFrameRef.current);
      resizeAnimationFrameRef.current = null;
    }
    imageLoadCleanupsRef.current.forEach((cleanup) => cleanup());
    imageLoadCleanupsRef.current = [];
    observedDocumentRef.current = null;
    feedbackGuardRef.current = { direction: 0, lastWriteAt: 0, streak: 0 };
  }, []);

  const scheduleHeightSync = useCallback((document: Document, reason: HeightSyncReason) => {
    if (observedDocumentRef.current !== document) return;
    if (reason !== "observer") pendingSyncReasonRef.current = reason;
    if (resizeAnimationFrameRef.current !== null) return;
    pendingSyncReasonRef.current = reason;
    resizeAnimationFrameRef.current = window.requestAnimationFrame(() => {
      resizeAnimationFrameRef.current = null;
      const frame = frameRef.current;
      const root = document.getElementById("custom-section-root");
      if (!frame || !root || frame.contentDocument !== document || observedDocumentRef.current !== document) return;
      const measuredHeight = Math.max(root.scrollHeight, root.getBoundingClientRect().height, 1);
      const nextHeight = Math.min(maxCustomSectionHeight, Math.ceil(measuredHeight));
      const currentHeight = frame.getBoundingClientRect().height;
      const difference = nextHeight - currentHeight;
      if (Math.abs(difference) <= customSectionHeightTolerance) return;

      const syncReason = pendingSyncReasonRef.current;
      pendingSyncReasonRef.current = "observer";
      if (syncReason === "observer") {
        const now = performance.now();
        const direction = Math.sign(difference);
        const guard = feedbackGuardRef.current;
        const followsRecentWrite = now - guard.lastWriteAt < 120 && direction === guard.direction;
        guard.streak = followsRecentWrite ? guard.streak + 1 : 1;
        guard.direction = direction;
        if (guard.streak > 4) return;
        guard.lastWriteAt = now;
      } else {
        feedbackGuardRef.current = { direction: Math.sign(difference), lastWriteAt: performance.now(), streak: 1 };
      }

      frame.style.height = `${nextHeight}px`;
    });
  }, []);

  const watchContentSize = useCallback(() => {
    stopWatchingContent();
    const frame = frameRef.current;
    const document = frame?.contentDocument;
    const root = document?.getElementById("custom-section-root");
    if (!frame || !document || !root) return;
    observedDocumentRef.current = document;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => scheduleHeightSync(document, "observer"));
      resizeObserverRef.current.observe(root);
    }
    root.querySelectorAll("img").forEach((image) => {
      const onLoad = () => scheduleHeightSync(document, "asset");
      image.addEventListener("load", onLoad);
      image.addEventListener("error", onLoad);
      imageLoadCleanupsRef.current.push(() => {
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onLoad);
      });
    });
    void document.fonts?.ready.then(() => scheduleHeightSync(document, "asset"));
    scheduleHeightSync(document, "load");
  }, [scheduleHeightSync, stopWatchingContent]);

  useLayoutEffect(() => {
    stopWatchingContent();
    const frame = frameRef.current;
    if (frame && frame.getBoundingClientRect().height <= 1) {
      const phoneScreen = frame.closest(".designer-phone-shell")?.querySelector<HTMLElement>(".designer-phone-screen");
      frame.style.height = `${Math.max(phoneScreen?.clientHeight ?? window.innerHeight, 1)}px`;
    }
    return stopWatchingContent;
  }, [documentHtml, stopWatchingContent]);

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
