"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./coastal-bismillah.module.css";

export function CoastalBismillah() {
  const [hero, setHero] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const heroSection = document.querySelector<HTMLElement>("section[aria-labelledby='couple-names']");
    setHero(heroSection);
  }, []);

  if (!hero) return null;

  return createPortal(
    <div className={styles.bismillah} lang="ar" dir="rtl" aria-label="Bismillah ir-Rahman ir-Rahim">
      بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
    </div>,
    hero,
  );
}
