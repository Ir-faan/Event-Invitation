"use client";

import { useEffect } from "react";

export function TemplateCardRouter() {
  useEffect(() => {
    const secondTemplateLink = document.querySelector<HTMLAnchorElement>(".collection-grid .collection-card:nth-child(2) > a");
    if (!secondTemplateLink) return;

    secondTemplateLink.href = "/templates/rose-afterglow";
    secondTemplateLink.setAttribute("aria-label", "Open the Rose Afterglow invitation");
  }, []);

  return null;
}
