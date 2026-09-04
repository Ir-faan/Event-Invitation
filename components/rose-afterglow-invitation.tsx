"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Hand,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";
import styles from "@/app/templates/rose-afterglow/rose-afterglow.module.css";

const memories = [
  {
    eyebrow: "A quiet beginning",
    title: "The first look",
    image: "/images/rose-afterglow.webp",
    alt: "Romantic blush wedding garden",
  },
  {
    eyebrow: "Our favourite moment",
    title: "Better together",
    image: "/images/coastal-reverie.webp",
    alt: "Sunlit coastal wedding setting",
  },
  {
    eyebrow: "The little details",
    title: "Flowers & promises",
    image: "/images/decor-photo-florals.webp",
    alt: "Soft wedding florals",
  },
];

const details = [
  { icon: CalendarDays, label: "The date", value: "Saturday, 12 October 2027" },
  { icon: MapPin, label: "The place", value: "Maison de la Roseraie · Moka" },
  { icon: Heart, label: "The celebration", value: "Ceremony · Dinner · Dancing" },
];

export function RoseAfterglowInvitation() {
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [curtainFinished, setCurtainFinished] = useState(false);

  const openCurtains = useCallback(() => {
    setCurtainOpen(true);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (!curtainFinished) document.body.style.overflow = "hidden";
    else document.body.style.overflow = previous;
    return () => {
      document.body.style.overflow = previous;
    };
  }, [curtainFinished]);

  useEffect(() => {
    if (!curtainOpen) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setCurtainFinished(true), reducedMotion ? 0 : 1550);
    return () => window.clearTimeout(timer);
  }, [curtainOpen]);

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>("[data-afterglow-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.setAttribute("data-visible", "true")),
      { threshold: 0.16 },
    );
    reveals.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.invitation} id="afterglow-top">
      <a className={styles.backButton} href="/#collection"><ArrowLeft aria-hidden="true" /> Collection</a>

      <section
        className={`${styles.curtainHero} ${curtainOpen ? styles.curtainOpened : ""} ${curtainFinished ? styles.curtainFinished : ""}`}
        aria-labelledby="afterglow-names"
      >
        <div className={styles.curtainStage}>
          <div className={styles.heroPhoto} aria-hidden="true">
            <img src="/images/rose-afterglow.webp" alt="" />
          </div>
          <div className={styles.heroWash} aria-hidden="true" />
          <div className={styles.curtainBackdrop} aria-hidden="true" />
          <div className={`${styles.curtainPanel} ${styles.curtainLeft}`} aria-hidden="true">
            <img src="/images/rose-wedding-curtains.webp" alt="" />
          </div>
          <div className={`${styles.curtainPanel} ${styles.curtainRight}`} aria-hidden="true">
            <img src="/images/rose-wedding-curtains.webp" alt="" />
          </div>

          <button
            className={styles.curtainTrigger}
            type="button"
            onClick={openCurtains}
            aria-label="Open Sofia and Samuel's wedding invitation"
          >
            <span className={styles.curtainSeal}><Heart aria-hidden="true" /></span>
            <strong>Tap to open</strong>
            <span>Sofia &amp; Samuel&apos;s invitation</span>
          </button>

          <nav className={styles.heroNav} aria-label="Invitation navigation">
            <a href="#our-story">Our story</a>
            <a href="#details">Details</a>
            <a href="#memories">Memories</a>
            <a href="#rsvp">RSVP</a>
          </nav>

          <div className={styles.heroCopy}>
            <p>The wedding of</p>
            <h1 id="afterglow-names"><span>Sofia</span><i>&amp;</i><span>Samuel</span></h1>
            <div className={styles.heroRule}><span /><Heart aria-hidden="true" /><span /></div>
            <p className={styles.heroDate}>Saturday · 12 October · 2027</p>
            <p className={styles.heroPlace}>Moka, Mauritius</p>
          </div>
        </div>
      </section>

      <section className={styles.storySection} id="our-story" aria-labelledby="story-title">
        <div className={styles.storyImage} data-afterglow-reveal>
          <div className={styles.archFrame}>
            <img src="/images/coastal-reverie.webp" alt="Romantic coastal wedding setting" />
          </div>
          <span>Together is a beautiful place</span>
        </div>
        <div className={styles.storyCopy} data-afterglow-reveal>
          <p className={styles.eyebrow}>Our story</p>
          <h2 id="story-title">Different paths,<br /><em>one beautiful tomorrow.</em></h2>
          <div className={styles.smallRule} />
          <p>
            What began as an ordinary introduction became the easiest conversation, then the best kind of friendship,
            and finally a forever we could not imagine without one another.
          </p>
          <blockquote>“Some love stories feel like home.”</blockquote>
        </div>
      </section>

      <section className={styles.detailsSection} id="details" aria-labelledby="details-title">
        <div className={styles.sectionHeading} data-afterglow-reveal>
          <p className={styles.eyebrow}>The celebration</p>
          <h2 id="details-title">A day made for <em>together.</em></h2>
          <p>Everything you need, kept beautifully simple.</p>
        </div>
        <div className={styles.detailsGrid}>
          {details.map((detail, index) => (
            <article
              className={styles.detailCard}
              key={detail.label}
              data-afterglow-reveal
              style={{ "--delay": `${index * 110}ms` } as CSSProperties}
            >
              <detail.icon aria-hidden="true" />
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.memoriesSection} id="memories" aria-labelledby="memories-title">
        <div className={styles.memoryHeading} data-afterglow-reveal>
          <p className={styles.eyebrow}><Sparkles aria-hidden="true" /> Special moments</p>
          <h2 id="memories-title">Stories worth <em>revealing.</em></h2>
          <p>Gently scratch a frame with your finger, or tap Reveal, to uncover a little piece of our story.</p>
        </div>

        <div className={styles.scratchGrid}>
          {memories.map((memory, index) => (
            <ScratchRevealCard key={memory.title} memory={memory} index={index} />
          ))}
        </div>
      </section>

      <section className={styles.quoteSection} aria-label="A romantic note">
        <p>All of my tomorrows</p>
        <h2>with you.</h2>
        <Heart aria-hidden="true" />
      </section>

      <section className={styles.rsvpSection} id="rsvp" aria-labelledby="rsvp-title">
        <div className={styles.rsvpCard} data-afterglow-reveal>
          <p className={styles.eyebrow}>One last little thing</p>
          <h2 id="rsvp-title">Will you celebrate<br /><em>with us?</em></h2>
          <p>We would love to save a place for you at our table.</p>
          <a href="mailto:hello@example.com?subject=RSVP%20Sofia%20and%20Samuel">RSVP with love <Heart aria-hidden="true" /></a>
          <span>Kindly reply by 12 September 2027</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>S <Heart aria-hidden="true" /> S</div>
        <h2>Sofia &amp; Samuel</h2>
        <p>12 October 2027</p>
        <a href="#afterglow-top">Back to the beginning ↑</a>
      </footer>
    </main>
  );
}

function ScratchRevealCard({
  memory,
  index,
}: {
  memory: { eyebrow: string; title: string; image: string; alt: string };
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);
  const touched = useRef(new Set<string>());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const drawCover = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.globalCompositeOperation = "source-over";

      const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#f8efe5");
      gradient.addColorStop(0.52, "#efe0cf");
      gradient.addColorStop(1, "#f8f1e8");
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);

      context.strokeStyle = "rgba(177, 132, 86, .23)";
      context.lineWidth = 1;
      for (let y = 8; y < rect.height; y += 11) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(rect.width, y + Math.sin(y) * 1.4);
        context.stroke();
      }

      for (let i = 0; i < 90; i += 1) {
        const x = ((i * 67) % 101) / 101 * rect.width;
        const y = ((i * 43) % 97) / 97 * rect.height;
        context.fillStyle = i % 3 === 0 ? "rgba(190, 145, 90, .35)" : "rgba(255,255,255,.4)";
        context.beginPath();
        context.arc(x, y, 0.7 + (i % 4) * 0.22, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = "#755c4b";
      context.textAlign = "center";
      context.font = "600 10px Avenir, Arial, sans-serif";
      context.fillText("SCRATCH TO REVEAL", rect.width / 2, rect.height * 0.82);
      context.font = "italic 28px Georgia, serif";
      context.fillStyle = "#9b7654";
      context.fillText(index === 1 ? "our favourite" : "a little memory", rect.width / 2, rect.height * 0.49);

      setReady(true);
    };

    drawCover();
    const resize = new ResizeObserver(drawCover);
    resize.observe(canvas);
    return () => resize.disconnect();
  }, [index, revealed]);

  const scratchAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = Math.max(34, Math.min(rect.width, rect.height) * 0.12);

    context.save();
    context.globalCompositeOperation = "destination-out";
    const brush = context.createRadialGradient(x, y, 0, x, y, radius);
    brush.addColorStop(0, "rgba(0,0,0,1)");
    brush.addColorStop(0.72, "rgba(0,0,0,.96)");
    brush.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = brush;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const columns = 22;
    const rows = 30;
    const cellX = Math.floor((x / rect.width) * columns);
    const cellY = Math.floor((y / rect.height) * rows);
    const cellRadius = Math.max(1, Math.ceil((radius / rect.width) * columns));

    for (let gx = cellX - cellRadius; gx <= cellX + cellRadius; gx += 1) {
      for (let gy = cellY - cellRadius; gy <= cellY + cellRadius; gy += 1) {
        if (gx >= 0 && gx < columns && gy >= 0 && gy < rows) touched.current.add(`${gx}:${gy}`);
      }
    }

    if (touched.current.size / (columns * rows) > 0.28) setRevealed(true);
  };

  return (
    <article className={`${styles.scratchCard} ${revealed ? styles.scratchRevealed : ""}`} data-afterglow-reveal>
      <div className={styles.scratchPhoto}>
        <img src={memory.image} alt={memory.alt} />
        <div className={styles.photoCaption}>
          <span>{memory.eyebrow}</span>
          <strong>{memory.title}</strong>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className={`${styles.scratchCanvas} ${ready ? styles.scratchCanvasReady : ""}`}
        aria-label={`Scratch to reveal ${memory.title}`}
        role="img"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setRevealed(true);
          }
        }}
        onPointerDown={(event) => {
          drawing.current = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          scratchAt(event);
        }}
        onPointerMove={scratchAt}
        onPointerUp={(event) => {
          drawing.current = false;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
        onPointerLeave={() => {
          drawing.current = false;
        }}
      />
      {!revealed && (
        <button className={styles.scratchHint} type="button" onClick={() => setRevealed(true)}>
          <Hand aria-hidden="true" />
          <span>Reveal</span>
        </button>
      )}
    </article>
  );
}
