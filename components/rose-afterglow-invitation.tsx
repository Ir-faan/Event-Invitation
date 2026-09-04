"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  CalendarDays,
  Flower2,
  Heart,
  MapPin,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import styles from "@/app/templates/rose-afterglow/rose-afterglow.module.css";

type RibbonPhase = "sealed" | "opening" | "gone";

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
  const [ribbonPhase, setRibbonPhase] = useState<RibbonPhase>("sealed");
  const [ribbonProgress, setRibbonProgress] = useState(0);
  const ribbonStartX = useRef<number | null>(null);
  const curtainRef = useRef<HTMLElement | null>(null);
  const petalLayerRef = useRef<HTMLDivElement | null>(null);

  const openInvitation = useCallback(() => {
    if (ribbonPhase !== "sealed") return;
    setRibbonProgress(1);
    setRibbonPhase("opening");
    window.setTimeout(() => setRibbonPhase("gone"), 900);
  }, [ribbonPhase]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (ribbonPhase !== "gone") document.body.style.overflow = "hidden";
    else document.body.style.overflow = previous;
    return () => {
      document.body.style.overflow = previous;
    };
  }, [ribbonPhase]);

  const updateRibbon = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (ribbonPhase !== "sealed" || ribbonStartX.current === null) return;
    const distance = Math.max(0, event.clientX - ribbonStartX.current);
    const travel = Math.min(window.innerWidth * 0.46, 520);
    setRibbonProgress(Math.min(distance / travel, 1));
  };

  const releaseRibbon = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (ribbonStartX.current === null) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    ribbonStartX.current = null;
    if (ribbonProgress > 0.62) openInvitation();
    else setRibbonProgress(0);
  };

  useEffect(() => {
    const section = curtainRef.current;
    if (!section) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progressed = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      section.style.setProperty("--curtain-progress", progressed.toFixed(3));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const layer = petalLayerRef.current;
    if (!layer) return;

    let last = 0;

    const spawn = (x: number, y: number, burst = 1) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      for (let index = 0; index < burst; index += 1) {
        const petal = document.createElement("span");
        petal.className = styles.cursorPetal;
        const size = 8 + Math.random() * 10;
        petal.style.left = `${x + (Math.random() - 0.5) * 18}px`;
        petal.style.top = `${y + (Math.random() - 0.5) * 18}px`;
        petal.style.width = `${size}px`;
        petal.style.height = `${size * 0.72}px`;
        petal.style.setProperty("--petal-drift", `${(Math.random() - 0.5) * 70}px`);
        petal.style.setProperty("--petal-rotate", `${80 + Math.random() * 220}deg`);
        petal.style.animationDuration = `${1.2 + Math.random() * 0.9}s`;
        layer.appendChild(petal);
        window.setTimeout(() => petal.remove(), 2300);
      }
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - last < 75) return;
      last = now;
      spawn(event.clientX, event.clientY);
    };

    const tap = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      spawn(event.clientX, event.clientY, 4);
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", tap, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", tap);
      layer.replaceChildren();
    };
  }, []);

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
      <div ref={petalLayerRef} className={styles.cursorPetalLayer} aria-hidden="true" />

      <div
        className={`${styles.ribbonIntro} ${ribbonPhase === "opening" ? styles.ribbonOpening : ribbonPhase === "gone" ? styles.ribbonGone : ""}`}
        style={{ "--ribbon-progress": ribbonProgress } as CSSProperties}
        aria-hidden={ribbonPhase === "gone"}
      >
        <div className={styles.introFlowers} aria-hidden="true">
          <img src="/images/coastal-floral-corner.svg" alt="" />
        </div>
        <div className={styles.invitationBox}>
          <div className={styles.invitationSleeve}>
            <span>S &amp; S</span>
            <Flower2 aria-hidden="true" />
          </div>
          <div className={styles.invitationCard}>
            <p>You&apos;re invited to the wedding of</p>
            <h1>Sofia <i>&amp;</i> Samuel</h1>
            <span>12 · 10 · 2027</span>
            <small>Moka, Mauritius</small>
          </div>
        </div>
        <div className={styles.ribbonBand} aria-hidden="true">
          <span />
          <i />
        </div>
        <button
          className={styles.ribbonHandle}
          type="button"
          aria-label="Pull the ribbon to open Sofia and Samuel's invitation"
          onClick={openInvitation}
          onPointerDown={(event) => {
            if (ribbonPhase !== "sealed") return;
            ribbonStartX.current = event.clientX;
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={updateRibbon}
          onPointerUp={releaseRibbon}
          onPointerCancel={releaseRibbon}
        >
          <span>Pull to open</span>
          <ArrowDown aria-hidden="true" />
        </button>
        <p className={styles.ribbonHint}>Drag the silk ribbon or tap to begin</p>
      </div>

      <a className={styles.backButton} href="/#collection"><ArrowLeft aria-hidden="true" /> Collection</a>

      <section ref={curtainRef} className={styles.curtainHero} aria-labelledby="afterglow-names">
        <div className={styles.curtainStage}>
          <div className={styles.heroPhoto} aria-hidden="true">
            <img src="/images/rose-afterglow.webp" alt="" />
          </div>
          <div className={styles.heroWash} aria-hidden="true" />
          <div className={`${styles.curtain} ${styles.curtainLeft}`} aria-hidden="true">
            <span />
          </div>
          <div className={`${styles.curtain} ${styles.curtainRight}`} aria-hidden="true">
            <span />
          </div>
          <div className={styles.heroFlorals} aria-hidden="true">
            <img src="/images/coastal-floral-corner.svg" alt="" />
            <img src="/images/coastal-floral-corner.svg" alt="" />
          </div>

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

          <div className={styles.scrollNote}>
            <span>Scroll to reveal</span>
            <ArrowDown aria-hidden="true" />
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
          <p>Scratch each frame with your mouse or finger to uncover a little piece of our story.</p>
        </div>

        <div className={styles.scratchGrid}>
          {memories.map((memory, index) => (
            <ScratchRevealCard key={memory.title} memory={memory} index={index} />
          ))}
        </div>
      </section>

      <section className={styles.quoteSection} aria-label="A romantic note">
        <div className={styles.quotePetals} aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => (
            <span
              key={index}
              style={{
                "--petal-x": `${(index * 39) % 100}%`,
                "--petal-delay": `${-(index % 7) * 1.7}s`,
                "--petal-duration": `${10 + (index % 5) * 1.8}s`,
              } as CSSProperties}
            />
          ))}
        </div>
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
    const radius = Math.max(24, Math.min(rect.width, rect.height) * 0.085);

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

    if (touched.current.size / (columns * rows) > 0.5) setRevealed(true);
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
      {!revealed && <div className={styles.scratchHint}><MousePointer2 aria-hidden="true" /><span>Scratch</span></div>}
    </article>
  );
}
