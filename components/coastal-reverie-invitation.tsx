"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Coffee,
  Heart,
  Hand,
  Leaf,
  MapPin,
  Music2,
  Navigation,
  PartyPopper,
  Sparkles,
  UtensilsCrossed,
  Users,
  Wine,
} from "lucide-react";
import styles from "@/app/templates/coastal-reverie/coastal-reverie.module.css";
import { SeatingArrangement, type SeatingAssignment } from "@/components/seating-arrangement";

const coastalWeddingTime = new Date("2027-09-17T16:30:00+04:00").getTime();
const roseWeddingTime = new Date("2027-10-12T16:30:00+04:00").getTime();

const envelopeTiming = {
  sealed: 1_000,
  opening: 2_000,
  flash: 720,
} as const;

const story = [
  {
    date: "October 2025",
    title: "The First Day",
    copy: "Salma and Sam first crossed paths at a dear friend’s wedding. It was a fleeting moment, yet it left a mark neither could forget.",
  },
  {
    date: "February 2026",
    title: "The Yes Day",
    copy: "A quiet coffee in the heart of the city became hours of laughter, shared dreams and the beginning of something beautiful.",
  },
  {
    date: "June 2027",
    title: "The Best Day Ahead",
    copy: "Beneath a golden sunset, Sam asked Salma to write the next chapter together. She said yes—and here we are.",
  },
];

const events = [
  {
    name: "Mehendi Evening",
    day: "Wednesday",
    date: "15 September 2027",
    time: "4:30 PM",
    venue: "Royal Green Gardens",
    address: "Moka, Mauritius",
    map: "https://www.google.com/maps?q=Royal%20Green%20Gardens%20Moka%20Mauritius&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=Royal+Green+Gardens+Moka+Mauritius",
  },
  {
    name: "Wedding Reception",
    day: "Thursday",
    date: "16 September 2027",
    time: "6:30 PM",
    venue: "Le Château de Labourdonnais",
    address: "Mapou, Mauritius",
    map: "https://www.google.com/maps?q=Le%20Chateau%20de%20Labourdonnais%20Mauritius&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=Le+Chateau+de+Labourdonnais+Mauritius",
  },
  {
    name: "Nikkah & Dinner",
    day: "Friday",
    date: "17 September 2027",
    time: "4:30 PM",
    venue: "The Ravenala Attitude",
    address: "Balaclava, Mauritius",
    map: "https://www.google.com/maps?q=The%20Ravenala%20Attitude%20Mauritius&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=The+Ravenala+Attitude+Mauritius",
  },
];

const seatingAssignments: SeatingAssignment[] = [
  { table: "01", family: "The Rahman Family", note: "Bride's family" },
  { table: "02", family: "The Patel Family", note: "Groom's family" },
  { table: "03", family: "The Osman Family" },
  { table: "04", family: "The Issack Family" },
  { table: "05", family: "The Boodhoo Family" },
  { table: "06", family: "The Khan Family" },
  { table: "07", family: "The Peerbux Family" },
  { table: "08", family: "The Joomun Family" },
  { table: "09", family: "The Mamode Family" },
  { table: "10", family: "The Hossen Family" },
  { table: "11", family: "The Moosun Family" },
  { table: "12", family: "The Aumeer Family" },
];

const programme = [
  { time: "4:30 PM", title: "Guest Arrival", note: "Welcome & reception", icon: Users },
  { time: "5:00 PM", title: "Nikkah", note: "The ceremony", icon: Heart },
  { time: "6:00 PM", title: "Cocktail", note: "Aperitifs & drinks", icon: Wine },
  { time: "7:00 PM", title: "Dinner", note: "Wedding banquet", icon: UtensilsCrossed },
  { time: "9:00 PM", title: "Tea", note: "Tea & light snacks", icon: Coffee },
  { time: "10:30 PM", title: "Celebration", note: "Music & memories", icon: Music2 },
  { time: "11:30 PM", title: "Farewell", note: "With all our love", icon: PartyPopper },
];

function getCountdown(now: number, weddingTime: number) {
  const difference = Math.max(weddingTime - now, 0);
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  };
}

export function CoastalReverieInvitation({ variant = "coastal" }: { variant?: "coastal" | "rose" }) {
  const isRose = variant === "rose";
  const [phase, setPhase] = useState<"sealed" | "opening" | "flash" | "gone">("sealed");
  const [rosePhase, setRosePhase] = useState<"curtains" | "opening" | "scratch" | "celebrating" | "revealed">("curtains");
  const [replay, setReplay] = useState(0);
  const weddingTime = isRose ? roseWeddingTime : coastalWeddingTime;
  const [now, setNow] = useState(weddingTime);
  const countdown = getCountdown(now, weddingTime);
  const invitationUnlocked = isRose ? rosePhase === "revealed" : phase === "gone";

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (isRose) return;
    if (phase === "sealed") {
      const timer = window.setTimeout(() => setPhase("opening"), envelopeTiming.sealed);
      return () => window.clearTimeout(timer);
    }
    if (phase === "opening") {
      const timer = window.setTimeout(() => setPhase("flash"), envelopeTiming.opening);
      return () => window.clearTimeout(timer);
    }
    if (phase === "flash") {
      const timer = window.setTimeout(() => setPhase("gone"), envelopeTiming.flash);
      return () => window.clearTimeout(timer);
    }
  }, [isRose, phase, replay]);

  useEffect(() => {
    if (!isRose || rosePhase !== "opening") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setRosePhase("scratch"), reducedMotion ? 0 : 1600);
    return () => window.clearTimeout(timer);
  }, [isRose, rosePhase]);

  useEffect(() => {
    if (!isRose || rosePhase !== "celebrating") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setRosePhase("revealed"), reducedMotion ? 0 : 1150);
    return () => window.clearTimeout(timer);
  }, [isRose, rosePhase]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = invitationUnlocked ? previous : "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [invitationUnlocked]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-wedding-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.setAttribute("data-visible", "true")),
      { threshold: 0.14 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const replayOpening = () => {
    window.scrollTo({ top: 0, behavior: isRose ? "auto" : "smooth" });
    if (isRose) setRosePhase("curtains");
    else setPhase("sealed");
    setReplay((value) => value + 1);
  };

  const names = isRose ? { bride: "Sofia", groom: "Samuel", date: "12 October 2027" } : { bride: "Salma", groom: "Sam", date: "17 September 2027" };
  const invitationStory = isRose
    ? story.map((chapter) => ({ ...chapter, copy: chapter.copy.replaceAll("Salma", "Sofia").replaceAll("Sam", "Samuel") }))
    : story;

  return (
    <main className={`${styles.invitation} ${isRose ? styles.roseVariant : ""} ${isRose && invitationUnlocked ? styles.roseUnlocked : ""} ${(!isRose && (phase === "flash" || phase === "gone")) || (isRose && rosePhase !== "curtains") ? styles.invitationReady : ""}`} id="invitation-top">
      {!isRose && <div className={`${styles.envelopeIntro} ${phase === "sealed" ? styles.sealed : phase === "opening" ? styles.opening : phase === "flash" ? styles.flash : styles.gone}`} aria-hidden={phase === "gone"}>
        <div className={styles.openingFlash} aria-hidden="true" />
        <div className={`${styles.envelopePanel} ${styles.envelopePanelLeft}`} aria-hidden="true">
          <picture>
            <source media="(max-width: 760px)" srcSet="/images/ivory-envelope-mobile.webp" />
            <img src="/images/ivory-envelope-desktop.webp" alt="" />
          </picture>
        </div>
        <div className={`${styles.envelopePanel} ${styles.envelopePanelRight}`} aria-hidden="true">
          <picture>
            <source media="(max-width: 760px)" srcSet="/images/ivory-envelope-mobile.webp" />
            <img src="/images/ivory-envelope-desktop.webp" alt="" />
          </picture>
        </div>
        <div className={styles.envelopeSeam} aria-hidden="true" />
        <button className={styles.envelopeTrigger} type="button" onClick={() => setPhase("opening")} aria-label="Open Salma and Sam's wedding invitation">
          <span className={styles.sealInitials} aria-hidden="true">S &amp; S</span>
        </button>
      </div>}

      {isRose && (
        <div className={`${styles.roseCurtainIntro} ${rosePhase !== "curtains" ? styles.roseCurtainsOpening : ""} ${rosePhase !== "curtains" && rosePhase !== "opening" ? styles.roseCurtainsGone : ""}`} aria-hidden={rosePhase !== "curtains" && rosePhase !== "opening"}>
          <div className={`${styles.roseCurtainPanel} ${styles.roseCurtainLeft}`} aria-hidden="true"><img src="/images/rose-wedding-curtains.webp" alt="" /></div>
          <div className={`${styles.roseCurtainPanel} ${styles.roseCurtainRight}`} aria-hidden="true"><img src="/images/rose-wedding-curtains.webp" alt="" /></div>
          <button className={styles.roseCurtainTrigger} type="button" onClick={() => setRosePhase("opening")} aria-label="Open Sofia and Samuel's wedding invitation">
            <span className={styles.roseSeal}><Heart aria-hidden="true" /></span>
            <strong>Tap to open</strong>
            <span>Sofia &amp; Samuel&apos;s invitation</span>
          </button>
        </div>
      )}

      <a className={styles.backButton} href="/#collection"><ArrowLeft aria-hidden="true" /> <span>Collection</span></a>
      <button className={styles.replayButton} type="button" onClick={replayOpening}><Sparkles aria-hidden="true" /> <span>Replay opening</span></button>
      {!isRose && <div className={styles.pageSparkles} aria-hidden="true">
        {Array.from({ length: 22 }, (_, index) => (
          <span key={index} style={{ "--x": `${(index * 43) % 100}%`, "--delay": `${-(index % 9) * 2.1}s`, "--duration": `${15 + (index % 6) * 2.1}s` } as CSSProperties}>{index % 5 === 0 ? "♥" : index % 3 === 0 ? "❀" : index % 2 === 0 ? "✦" : "·"}</span>
        ))}
      </div>}

      {isRose ? (
        <ScratchInvitationHero phase={rosePhase} onReveal={() => setRosePhase("celebrating")} />
      ) : <section className={styles.hero} aria-labelledby="couple-names">
        <div className={styles.heroImage}><img src="/images/coastal-reverie.webp" alt="Sunlit coastal garden overlooking the sea" /></div>
        <div className={styles.heroVeil} />
        <div className={styles.petals} aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index} style={{ "--x": `${(index * 41) % 100}%`, "--delay": `${-(index % 8) * 2}s`, "--duration": `${13 + (index % 5) * 2}s` } as CSSProperties}>{index % 3 === 0 ? "❀" : index % 2 === 0 ? "❧" : "·"}</span>
          ))}
        </div>
        <div className={styles.heroCopy}>
          <p>Together with their families</p>
          <div className={styles.monogram}>S <i>&</i> S</div>
          <h1 id="couple-names"><span>Salma</span><i>&</i><span>Sam</span></h1>
          <div className={styles.heroRule}><span /><Heart aria-hidden="true" /><span /></div>
          <p className={styles.heroDate}>Friday · 17 September · 2027</p>
        </div>
        <a className={styles.scrollInvitation} href="#counting">Scroll into our story <ArrowDown aria-hidden="true" /></a>
      </section>}

      {isRose && <a className={styles.weddingDetailsButton} href="#event-details" aria-hidden={!invitationUnlocked} tabIndex={invitationUnlocked ? 0 : -1}><CalendarDays aria-hidden="true" /> Wedding details</a>}

      <section className={styles.countdownSection} id="counting" aria-labelledby="countdown-title" data-wedding-reveal>
        <div className={`${styles.gardenPortal} ${styles.portalLeft}`} data-wedding-reveal aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={`${styles.gardenPortal} ${styles.portalRight}`} data-wedding-reveal aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={styles.countdownContent} data-wedding-reveal>
          <p className={styles.eyebrow}>You are invited to our big day</p>
          <h2 id="countdown-title">Counting the days</h2>
          <p className={styles.countdownIntro}>to the most special day of our lives</p>
          <div className={styles.countdown} aria-live="polite">
            {Object.entries(countdown).map(([label, value]) => (
              <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
            ))}
          </div>
          <div className={styles.heartRule}><span /><Heart aria-hidden="true" /><span /></div>
        </div>
      </section>

      <section className={styles.storySection} aria-labelledby="story-title" data-wedding-reveal>
        <div className={`${styles.storyBloom} ${styles.storyBloomLeft}`} data-wedding-reveal aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={`${styles.storyBloom} ${styles.storyBloomRight}`} data-wedding-reveal aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={styles.sectionTitle} data-wedding-reveal>
          <p>From a beautiful beginning</p>
          <h2 id="story-title">Our Journey</h2>
          <div className={styles.heartRule}><span /><Heart aria-hidden="true" /><span /></div>
        </div>
        <div className={styles.storyTimeline}>
          {invitationStory.map((chapter, index) => (
            <article key={chapter.title} className={styles.storyChapter} data-wedding-reveal style={{ "--chapter-delay": `${index * 120}ms` } as CSSProperties}>
              <div className={styles.storyDot}><Heart aria-hidden="true" /></div>
              <div className={styles.storyText}>
                <time>{chapter.date}</time>
                <h3>{chapter.title}</h3>
                <p>{chapter.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.memorySection} aria-labelledby="memory-title" data-wedding-reveal>
        <div className={styles.memoryBackdrop} aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <article className={styles.memoryCard} data-wedding-reveal>
          <div className={styles.paperCorners} aria-hidden="true"><Leaf /><Leaf /><Leaf /><Leaf /></div>
          <p className={styles.eyebrow}>With love, always</p>
          <h2 id="memory-title">In Loving Memory</h2>
          <div className={styles.memoryRule}><span /><Leaf aria-hidden="true" /><span /></div>
          <p>On this joyful day, we lovingly remember our grandparents who are no longer with us. Their prayers, gentle guidance and beautiful examples of love remain woven into who we are.</p>
          <div className={styles.memoryDedication}>
            <small>Remembering with gratitude</small>
            <strong>Our beloved grandparents</strong>
            <span>Whose love still lights our way</span>
          </div>
          <p>Though they cannot be beside us, we carry them in our hearts as we begin this new chapter. Their memory is a blessing, and their love will always be part of our story.</p>
          <div className={styles.memorySignature}>Forever remembered · Forever loved</div>
        </article>
      </section>

      <section className={styles.eventsSection} id="event-details" aria-labelledby="events-title" data-wedding-reveal>
        <div className={styles.lightTitle} data-wedding-reveal>
          <p>Join us</p>
          <h2 id="events-title">Event Details</h2>
          <span>We can&apos;t wait to celebrate with you. Here is everything you need to know.</span>
        </div>
        <div className={styles.eventsGrid}>
          {events.map((event, index) => (
            <article className={styles.eventCard} key={event.name} data-wedding-reveal style={{ "--chapter-delay": `${index * 120}ms` } as CSSProperties}>
              <div className={styles.eventIcon}><Sparkles aria-hidden="true" /></div>
              <p>{event.day}</p>
              <h3>{event.name}</h3>
              <div className={styles.eventFacts}>
                <span><CalendarDays aria-hidden="true" />{event.date}</span>
                <span><Clock3 aria-hidden="true" />{event.time}</span>
                <span><MapPin aria-hidden="true" />{event.venue}<small>{event.address}</small></span>
              </div>
              <div className={styles.mapFrame}>
                <iframe src={event.map} title={`Map to ${event.venue}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <a href={event.directions} target="_blank" rel="noreferrer">Open directions <Navigation aria-hidden="true" /></a>
            </article>
          ))}
        </div>
      </section>

      <SeatingArrangement assignments={seatingAssignments} />

      <section className={styles.programmeSection} aria-labelledby="programme-title" data-wedding-reveal>
        <div className={styles.programmeTitle} data-wedding-reveal>
          <p>Celebrating every moment</p>
          <h2 id="programme-title">Day Programme</h2>
          <span>What we have prepared for you</span>
        </div>
        <div className={styles.programmeLine} aria-hidden="true" />
        <div className={styles.programmeGrid}>
          {programme.map((item, index) => (
            <article key={item.title} className={styles.programmeItem} data-wedding-reveal style={{ "--chapter-delay": `${index * 80}ms` } as CSSProperties}>
              <time>{item.time}</time>
              <div><item.icon aria-hidden="true" /></div>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerMonogram}>S <Heart aria-hidden="true" /> S</div>
        <h2>{names.bride} &amp; {names.groom}</h2>
        <p>{names.date}</p>
        <span>Made with <Heart aria-hidden="true" /> by <a href="/">Event Invitations</a></span>
      </footer>
    </main>
  );
}

function ScratchInvitationHero({
  phase,
  onReveal,
}: {
  phase: "curtains" | "opening" | "scratch" | "celebrating" | "revealed";
  onReveal: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const touched = useRef(new Set<string>());
  const revealed = phase === "celebrating" || phase === "revealed";

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
      gradient.addColorStop(0, "#fbf7ef");
      gradient.addColorStop(0.5, "#eadfce");
      gradient.addColorStop(1, "#f8f1e6");
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);

      context.strokeStyle = "rgba(170, 132, 86, .18)";
      context.lineWidth = 1;
      for (let inset = 18; inset < Math.min(rect.width, rect.height) * 0.28; inset += 13) {
        context.beginPath();
        context.ellipse(rect.width / 2, rect.height * 0.43, rect.width / 2 - inset, rect.height * 0.31 - inset * 0.45, 0, 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = "#79624f";
      context.textAlign = "center";
      context.font = `600 ${Math.max(10, rect.width * 0.027)}px Montserrat, Arial, sans-serif`;
      context.fillText("GENTLY SCRATCH TO REVEAL", rect.width / 2, rect.height * 0.78);
      context.font = `400 ${Math.max(32, rect.width * 0.1)}px Birthstone, Georgia, serif`;
      context.fillStyle = "#a27b56";
      context.fillText("our invitation", rect.width / 2, rect.height * 0.47);
    };

    drawCover();
    const resize = new ResizeObserver(drawCover);
    resize.observe(canvas);
    return () => resize.disconnect();
  }, [revealed]);

  const scratchAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || revealed || phase !== "scratch") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = Math.max(34, Math.min(rect.width, rect.height) * 0.115);

    context.save();
    context.globalCompositeOperation = "destination-out";
    const brush = context.createRadialGradient(x, y, 0, x, y, radius);
    brush.addColorStop(0, "rgba(0,0,0,1)");
    brush.addColorStop(0.7, "rgba(0,0,0,.98)");
    brush.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = brush;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const columns = 20;
    const rows = 28;
    const cellX = Math.floor((x / rect.width) * columns);
    const cellY = Math.floor((y / rect.height) * rows);
    const cellRadius = Math.max(1, Math.ceil((radius / rect.width) * columns));
    for (let gx = cellX - cellRadius; gx <= cellX + cellRadius; gx += 1) {
      for (let gy = cellY - cellRadius; gy <= cellY + cellRadius; gy += 1) {
        if (gx >= 0 && gx < columns && gy >= 0 && gy < rows) touched.current.add(`${gx}:${gy}`);
      }
    }
    if (touched.current.size / (columns * rows) > 0.32) onReveal();
  };

  return (
    <section className={`${styles.scratchHero} ${revealed ? styles.scratchHeroRevealed : ""}`} aria-labelledby="rose-couple-names">
      <div className={styles.rosePetals} aria-hidden="true">
        {Array.from({ length: 11 }, (_, index) => <span key={index} style={{ "--x": `${(index * 37) % 96}%`, "--delay": `${-(index % 6) * 2.4}s`, "--duration": `${16 + (index % 4) * 2.5}s` } as CSSProperties}>❀</span>)}
      </div>
      <div className={styles.scratchCardHero}>
        <img src="/images/rose-scratch-hero.webp" alt="Bride and groom reaching for one another within an ornate ivory frame" />
        <div className={styles.scratchHeroCopy}>
          <p>Together with their families</p>
          <h1 id="rose-couple-names">Sofia <i>&amp;</i> Samuel</h1>
          <span>12 October 2027 · Moka, Mauritius</span>
        </div>
        <canvas
          ref={canvasRef}
          className={styles.scratchHeroCanvas}
          aria-label="Scratch to reveal Sofia and Samuel's wedding invitation"
          role="img"
          tabIndex={phase === "scratch" ? 0 : -1}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && phase === "scratch") {
              event.preventDefault();
              onReveal();
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
          onPointerCancel={() => { drawing.current = false; }}
          onPointerLeave={() => { drawing.current = false; }}
        />
        {!revealed && phase === "scratch" && <button className={styles.tapRevealButton} type="button" onClick={onReveal}><Hand aria-hidden="true" /> Tap to reveal</button>}
      </div>
      {phase === "celebrating" && <div className={styles.revealSparkles} aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} style={{ "--angle": `${index * 15}deg`, "--distance": `${8 + (index % 5) * 2.4}rem`, "--spark-delay": `${(index % 4) * 45}ms` } as CSSProperties}>{index % 3 === 0 ? "✦" : "·"}</span>)}</div>}
      {revealed && <p className={styles.continueHint}>Your invitation is revealed</p>}
    </section>
  );
}
