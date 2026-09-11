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

    document.addEventListener("pointerdown", closeOpenPicker);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOpenPicker);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return null;
}
