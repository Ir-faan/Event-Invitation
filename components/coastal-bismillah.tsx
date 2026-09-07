"use client";

/* eslint-disable @next/next/no-img-element */

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
    <div className={styles.bismillah} aria-label="Bismillah ir-Rahman ir-Rahim">
      <img
        className={styles.artwork}
        src="/images/bismillah-header.svg"
        alt="Bismillah ir-Rahman ir-Rahim"
      />
    </div>,
    hero,
  );
}
