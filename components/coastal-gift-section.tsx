"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Leaf, Sparkles } from "lucide-react";
import styles from "./coastal-gift-section.module.css";

export function CoastalGiftSection() {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const invitation = document.querySelector<HTMLElement>("main#invitation-top");
    const footer = invitation?.querySelector<HTMLElement>("footer");
    const parent = footer?.parentElement;

    if (!invitation || !footer || !parent) return;

    const existing = invitation.querySelector<HTMLElement>("[data-coastal-gift-section]");
    if (existing) {
      setMountNode(existing);
      return;
    }

    const node = document.createElement("div");
    node.dataset.coastalGiftSection = "true";
    parent.insertBefore(node, footer);
    setMountNode(node);

    return () => {
      setMountNode(null);
      node.remove();
    };
  }, []);

  useEffect(() => {
    if (!mountNode) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(mountNode);
    return () => observer.disconnect();
  }, [mountNode]);

  if (!mountNode) return null;

  return createPortal(
    <section className={`${styles.giftSection} ${visible ? styles.visible : ""}`} aria-labelledby="gift-title">
      <article className={styles.giftCard}>
        <Leaf className={styles.cornerLeaf} aria-hidden="true" />
        <Leaf className={styles.cornerLeaf} aria-hidden="true" />

        <div className={styles.ornament} aria-hidden="true">
          <span />
          <Sparkles />
          <span />
        </div>

        <h2 id="gift-title">Humble request</h2>
        <p className={styles.request}>No gift box please.</p>
      </article>
    </section>,
    mountNode,
  );
}
