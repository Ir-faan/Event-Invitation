"use client";

import { useEffect } from "react";

export function DesignerMobileEnhancements() {
  useEffect(() => {
    function closeOpenPicker(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      document.querySelectorAll<HTMLDetailsElement>(".designer-part-picker details[open]").forEach((picker) => {
        if (!picker.contains(target)) picker.open = false;
      });
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      document.querySelectorAll<HTMLDetailsElement>(".designer-part-picker details[open]").forEach((picker) => {
        picker.open = false;
      });
    }

    /* On mobile, start the invitation-parts editor with Countdown open and
       the other part editors closed. Setting the native details.open property
       also triggers each editor's existing toggle handler, so React state stays
       in sync without changing desktop behaviour. */
    if (window.matchMedia("(max-width: 900px)").matches) {
      window.requestAnimationFrame(() => {
        const editors = Array.from(
          document.querySelectorAll<HTMLDetailsElement>("#designer-sections .designer-section-editor"),
        );
        editors.forEach((editor, index) => {
          editor.open = index === 0;
        });
      });
    }

    document.addEventListener("pointerdown", closeOpenPicker);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOpenPicker);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return null;
}
