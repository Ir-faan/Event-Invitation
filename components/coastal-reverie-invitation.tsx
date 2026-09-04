"use client";

/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Coffee,
  Heart,
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

const weddingTime = new Date("2027-09-17T16:30:00+04:00").getTime();

const envelopeTiming = {
  sealed: 1_000,
  opening: 1_450,
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

function getCountdown(now: number) {
  const difference = Math.max(weddingTime - now, 0);
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  };
}

export function CoastalReverieInvitation() {
  const [phase, setPhase] = useState<"sealed" | "opening" | "flash" | "gone">("sealed");
  const [replay, setReplay] = useState(0);
  const [now, setNow] = useState(weddingTime);
  const countdown = getCountdown(now);

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
  }, [phase, replay]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = phase === "gone" ? previous : "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase("sealed");
    setReplay((value) => value + 1);
  };

  return (
    <main className={`${styles.invitation} ${phase === "flash" || phase === "gone" ? styles.invitationReady : ""}`} id="invitation-top">
      <div className={`${styles.envelopeIntro} ${phase === "sealed" ? styles.sealed : phase === "opening" ? styles.opening : phase === "flash" ? styles.flash : styles.gone}`} aria-hidden={phase === "gone"}>
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
      </div>

      <a className={styles.backButton} href="/#collection"><ArrowLeft aria-hidden="true" /> <span>Collection</span></a>
      <button className={styles.replayButton} type="button" onClick={replayOpening}><Sparkles aria-hidden="true" /> <span>Replay opening</span></button>
      <div className={styles.pageSparkles} aria-hidden="true">
        {Array.from({ length: 22 }, (_, index) => (
          <span key={index} style={{ "--x": `${(index * 43) % 100}%`, "--delay": `${-(index % 9) * 2.1}s`, "--duration": `${15 + (index % 6) * 2.1}s` } as CSSProperties}>{index % 5 === 0 ? "♥" : index % 3 === 0 ? "❀" : index % 2 === 0 ? "✦" : "·"}</span>
        ))}
      </div>

      <section className={styles.hero} aria-labelledby="couple-names">
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
      </section>

      <section className={styles.countdownSection} id="counting" aria-labelledby="countdown-title">
        <div className={`${styles.gardenPortal} ${styles.portalLeft}`} aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={`${styles.gardenPortal} ${styles.portalRight}`} aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
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

      <section className={styles.storySection} aria-labelledby="story-title">
        <div className={`${styles.storyBloom} ${styles.storyBloomLeft}`} aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={`${styles.storyBloom} ${styles.storyBloomRight}`} aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></div>
        <div className={styles.sectionTitle} data-wedding-reveal>
          <p>From a beautiful beginning</p>
          <h2 id="story-title">Our Journey</h2>
          <div className={styles.heartRule}><span /><Heart aria-hidden="true" /><span /></div>
        </div>
        <div className={styles.storyTimeline}>
          {story.map((chapter, index) => (
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

      <section className={styles.memorySection} aria-labelledby="memory-title">
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

      <section className={styles.eventsSection} aria-labelledby="events-title">
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

      <section className={styles.programmeSection} aria-labelledby="programme-title">
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
        <h2>Salma & Sam</h2>
        <p>17 September 2027</p>
        <span>Made with <Heart aria-hidden="true" /> by <a href="/">Event Invitations</a></span>
      </footer>
    </main>
  );
}
