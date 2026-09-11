"use client";

import { useEffect } from "react";

export function LandingTemplateCardTilt() {
  useEffect(() => {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsHover || reduceMotion) return;

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(".landing-refresh .collection-card"),
    );

    const cleanups = cards.map((card) => {
      const handlePointerMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.setProperty("--card-tilt-x", `${(-y * 7).toFixed(2)}deg`);
        card.style.setProperty("--card-tilt-y", `${(x * 7).toFixed(2)}deg`);
        card.style.setProperty("--card-tilt-lift", "-4px");
      };

      const resetTilt = () => {
        card.style.setProperty("--card-tilt-x", "0deg");
        card.style.setProperty("--card-tilt-y", "0deg");
        card.style.setProperty("--card-tilt-lift", "0px");
      };

      card.addEventListener("pointermove", handlePointerMove);
      card.addEventListener("pointerleave", resetTilt);

      return () => {
        card.removeEventListener("pointermove", handlePointerMove);
        card.removeEventListener("pointerleave", resetTilt);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
