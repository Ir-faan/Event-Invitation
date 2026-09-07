"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Leaf, Sparkles } from "lucide-react";
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

        <p className={styles.eyebrow}>A humble request</p>
        <h2 id="gift-title">Your Presence Is Our Gift</h2>
        <p className={styles.intro}>
          Celebrating this beautiful day with you is already more than we could ask for.
        </p>

        <p className={styles.request}>Humble request, no gift box please.</p>

        <div className={styles.signature}>
          <Heart aria-hidden="true" />
          <span>With love, Salma &amp; Sam</span>
        </div>
      </article>
    </section>,
    mountNode,
  );
}
