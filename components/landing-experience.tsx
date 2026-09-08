"use client";

import { useEffect } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  Gem,
  Heart,
  Leaf,
  Menu,
  Palette,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

const collection = [
  { name: "Soft & Timeless", mood: "Beige, ivory & warm neutrals", image: "/images/coastal-reverie.webp", tone: "light" },
  { name: "Olive Romance", mood: "Olive green & understated florals", image: "/images/rose-scratch-hero-olive.webp", tone: "dark" },
  { name: "Evening Elegance", mood: "Deep, cinematic & refined", image: "/images/moonlit-bloom.webp", tone: "dark" },
];

const palettes = [
  { name: "Beige", colours: ["#e8ddcf", "#f8f2ea", "#b89d7f"] },
  { name: "Olive Green", colours: ["#68704b", "#a5a77c", "#eee8d8"] },
  { name: "Dusty Blue", colours: ["#71879a", "#aebdca", "#edf1f3"] },
  { name: "Burgundy / Wine", colours: ["#54202b", "#8a4a55", "#f0dedf"] },
  { name: "Pink", colours: ["#c88e9a", "#e8bec7", "#fff0f2"] },
  { name: "Purple / Lilac", colours: ["#75617f", "#b8a2c1", "#f1eaf3"] },
];

const process = [
  { icon: Palette, number: "01", title: "Design the invitation", copy: "Choose the look, opening, hero and sections that fit your celebration." },
  { icon: Eye, number: "02", title: "Review the design", copy: "Check the complete invitation and request the final adjustments before approval." },
  { icon: CreditCard, number: "03", title: "Payment", copy: "Once the design is approved, complete payment for your chosen invitation setup." },
  { icon: Send, number: "04", title: "Share in a tap", copy: "Receive one elegant link ready to share through WhatsApp, message or social media." },
];

const mandatorySections = [
  "Countdown",
  "Order of Events (Our Journey)",
  "Event Details + Location",
  "Gift Preferences",
  "Footer",
];

const optionalSections = [
  "In Loving Memory",
  "Seating Arrangement",
  "Day Programme",
  "Glimpse Of Us",
];

const heroCards = [
  { kind: "image", image: collection[0].image, label: "coastal" },
  { kind: "paper", label: "THE MOST ELEGANT\nSAVE THE DATE" },
  { kind: "image", image: collection[1].image, label: "garden" },
  { kind: "seal", label: "You are invited" },
  { kind: "image", image: collection[2].image, label: "moonlit" },
];

const ribbonMessage = "LOVE STORIES IN MOTION ✦ WEDDINGS WITH SOUL ✦ ENGAGEMENTS TO REMEMBER ✦ SAVE THE DATES, BEAUTIFULLY MADE ✦ YOUR MOMENT, YOUR STORY ✦ WHERE FOREVER BEGINS ✦";

export function LandingExperience() {
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.14 },
    );
    reveals.forEach((element) => observer.observe(element));

    const handleScroll = () => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll-progress", `${maximum > 0 ? window.scrollY / maximum : 0}`);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const tiltCards = document.querySelectorAll<HTMLElement>(".tilt-card");
    const cleanups: Array<() => void> = [];
    tiltCards.forEach((card) => {
      const move = (event: PointerEvent) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty("--rotate-x", `${-y * 8}deg`);
        card.style.setProperty("--rotate-y", `${x * 10}deg`);
        card.style.setProperty("--spot-x", `${(x + 0.5) * 100}%`);
        card.style.setProperty("--spot-y", `${(y + 0.5) * 100}%`);
      };
      const leave = () => {
        card.style.setProperty("--rotate-x", "0deg");
        card.style.setProperty("--rotate-y", "0deg");
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      });
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <main id="top">
      <div className="scroll-progress" aria-hidden="true" />
      <div className="ambient-glow" aria-hidden="true" />
      <div className="falling-sparkles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            style={{
              "--spark-x": `${(index * 37) % 100}%`,
              "--spark-delay": `${-(index % 9) * 1.8}s`,
              "--spark-duration": `${12 + (index % 6) * 2}s`,
            } as React.CSSProperties}
          >
            {index % 3 === 0 ? "✦" : "·"}
          </span>
        ))}
      </div>

      <header className="site-nav">
        <a href="#top" className="brand" aria-label="Paperless Invites home">
          <span className="brand-seal">PI</span>
          <span>Paperless Invites</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#collection">Designs</a>
          <a href="#process">How it works</a>
          <a href="#compare">Why digital</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="#contact" className="nav-action">Start your story <ArrowRight aria-hidden="true" /></a>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu aria-hidden="true" /></summary>
          <div>
            <a href="#collection">Designs</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a><a href="#contact">Contact</a>
          </div>
        </details>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><Sparkles aria-hidden="true" /> Welcome to Paperless Invites</p>
          <h1 id="hero-title">The most elegant <em>save the date.</em></h1>
          <p>Digital invitations for modern love stories, milestone moments and every celebration worth remembering.</p>
          <div className="hero-actions">
            <a className="button button-wine" href="#collection">Explore the possibilities <ArrowRight aria-hidden="true" /></a>
            <a className="text-link" href="#process">See how it works <ArrowDownRight aria-hidden="true" /></a>
          </div>
        </div>
        <div className="showcase" aria-label="A moving preview of invitation styles">
          <div className="marquee-row row-one">
            <div className="marquee-track">
              {[...heroCards, ...heroCards].map((card, index) => <ShowcaseCard key={`one-${index}`} card={card} />)}
            </div>
          </div>
          <div className="marquee-row row-two" aria-hidden="true">
            <div className="marquee-track reverse">
              {[...heroCards.slice().reverse(), ...heroCards.slice().reverse()].map((card, index) => <ShowcaseCard key={`two-${index}`} card={card} small />)}
            </div>
          </div>
          <div className="spotlight-phone" aria-hidden="true">
            <div className="phone-speaker" />
            <img src="/images/coastal-reverie.webp" alt="" />
            <div className="phone-copy"><span>COMING SOON</span><strong>Your story<br />begins here</strong><i>Save the date</i></div>
          </div>
        </div>
        <a href="#collection" className="scroll-cue"><span>Scroll to explore</span><ChevronDown aria-hidden="true" /></a>
      </section>

      <section className="collection section" id="collection" aria-labelledby="collection-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">✦ Designed around your choices</p>
          <h2 id="collection-title">Not a fixed template.<br /><em>Your invitation, your way.</em></h2>
          <p>These are visual directions, not three fixed packages. Your final invitation is built from the colour palette, opening, hero and sections you choose.</p>
        </div>
        <div className="collection-grid">
          {collection.map((item, index) => (
            <article className={`collection-card tilt-card reveal ${item.tone}`} key={item.name} style={{ "--reveal-delay": `${index * 120}ms` } as React.CSSProperties}>
              <img src={item.image} alt={`${item.name} invitation design inspiration`} />
              <div className="card-shine" aria-hidden="true" />
              <div className="collection-number">0{index + 1}</div>
              <div className="collection-content">
                <span>{item.mood}</span>
                <h3>{item.name}</h3>
                <p>Design inspiration</p>
              </div>
              <a href="#pricing" aria-label={`See how to customise the ${item.name} direction`}><ArrowDownRight aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        <div className="palette-showcase reveal" aria-label="Available colour palettes">
          <span className="palette-showcase-label">Available palettes</span>
          <div className="palette-showcase-grid">
            {palettes.map((palette) => (
              <div className="palette-pill" key={palette.name}>
                <span className="palette-dots" aria-hidden="true">
                  {palette.colours.map((colour) => <i key={colour} style={{ background: colour }} />)}
                </span>
                <strong>{palette.name}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="ticker" aria-hidden="true">
          <div>{Array.from({ length: 4 }, (_, index) => <span key={index}>{ribbonMessage}</span>)}</div>
        </div>
      </section>

      <section className="envelope-section" aria-labelledby="envelope-title">
        <div className="envelope-visual reveal">
          <div className="envelope-halo" aria-hidden="true" />
          <img src="/images/digital-envelope.webp" alt="Ivory digital envelope with a burgundy wax seal" />
          <span className="floating-note note-one">Your colours</span>
          <span className="floating-note note-two">Your story</span>
          <span className="floating-note note-three">Your moment</span>
        </div>
        <div className="envelope-copy reveal">
          <p className="eyebrow"><span className="live-dot" /> Optional opening</p>
          <h2 id="envelope-title">The magic can begin <em>before it opens.</em></h2>
          <p>Add a tactile digital envelope with your initials on the wax seal, choose a curtain reveal, or keep the opening beautifully simple.</p>
          <div className="mini-features"><span><Palette aria-hidden="true" /> Your palette</span><span><Gem aria-hidden="true" /> Initialled seal</span><span><Heart aria-hidden="true" /> Your choice</span></div>
        </div>
      </section>

      <section className="process section" id="process" aria-labelledby="process-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">A beautifully simple process</p>
          <h2 id="process-title">From your choices to<br /><em>one unforgettable link.</em></h2>
        </div>
        <div className="process-line reveal" aria-hidden="true"><span /></div>
        <div className="process-grid">
          {process.map((step, index) => (
            <article className="process-step reveal" key={step.number} style={{ "--reveal-delay": `${index * 100}ms` } as React.CSSProperties}>
              <div className="step-icon"><step.icon aria-hidden="true" /><span>{step.number}</span></div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison section" id="compare" aria-labelledby="comparison-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">Paper or digital?</p>
          <h2 id="comparison-title">More feeling.<br /><em>Far less fuss.</em></h2>
          <p>A beautiful invitation should create anticipation—not printing lists, delivery delays and last-minute reorders.</p>
        </div>
        <div className="comparison-grid">
          <article className="paper-card reveal">
            <div className="paper-title"><span>Traditional paper</span><Clock3 aria-hidden="true" /></div>
            <div className="receipt-line"><span>Design & revisions</span><strong>Extra steps</strong></div>
            <div className="receipt-line"><span>Printing & envelopes</span><strong>Added cost</strong></div>
            <div className="receipt-line"><span>Delivery</span><strong>Days or weeks</strong></div>
            <div className="receipt-line"><span>Last-minute change</span><strong>Reprint</strong></div>
            <div className="paper-total"><span>THE HIDDEN COST</span><strong>Time, waste & worry</strong></div>
          </article>
          <article className="digital-card reveal">
            <div className="digital-label">The modern invitation</div>
            <h3>One elegant link.<br />Every detail in place.</h3>
            <ul>
              <li><Smartphone aria-hidden="true" /><span><strong>Designed for every screen</strong>Beautiful from the first tap.</span><Check aria-hidden="true" /></li>
              <li><Send aria-hidden="true" /><span><strong>Instantly shareable</strong>No postage. No waiting.</span><Check aria-hidden="true" /></li>
              <li><Leaf aria-hidden="true" /><span><strong>Less paper, less waste</strong>A lighter way to celebrate.</span><Check aria-hidden="true" /></li>
            </ul>
            <div className="digital-foot"><span>Modern, personal, effortless</span><Sparkles aria-hidden="true" /></div>
          </article>
        </div>
      </section>

      <section className="pricing section" id="pricing" aria-labelledby="pricing-title">
        <div className="pricing-heading centered reveal">
          <p className="eyebrow">Build the invitation you want</p>
          <h2 id="pricing-title">Start simple.<br /><em>Add only what you love.</em></h2>
          <p>The basic invitation starts at Rs 1,000 with the mandatory components. Your final price changes according to the interactive components and optional sections you choose.</p>
        </div>

        <div className="pricing-summary reveal">
          <div><span>Starting from</span><strong>Rs 1,000</strong></div>
          <p>Includes your chosen colour palette, a basic hero and all mandatory sections. Add an opening, interactive hero and optional sections only if you want them.</p>
        </div>

        <div className="pricing-grid pricing-config-grid">
          <article className="price-card reveal" style={{ "--reveal-delay": "0ms" } as React.CSSProperties}>
            <span className="plan-index">01 · Colour palette</span>
            <h3>Choose your palette</h3>
            <p>Pick the visual mood that will guide the invitation design.</p>
            <div className="price"><strong>Included</strong><span>in base price</span></div>
            <div className="pricing-palettes">
              {palettes.map((palette) => (
                <div className="pricing-palette" key={palette.name}>
                  <span aria-hidden="true">{palette.colours.map((colour) => <i key={colour} style={{ background: colour }} />)}</span>
                  <b>{palette.name}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="price-card reveal" style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
            <span className="plan-index">02 · Opening</span>
            <h3>Choose the opening</h3>
            <p>Keep it immediate or add a memorable reveal before the invitation begins.</p>
            <div className="price"><strong>Optional</strong><span>add-on</span></div>
            <ul className="pricing-option-list">
              <li><Check aria-hidden="true" /><span>None</span><b>Included</b></li>
              <li><Check aria-hidden="true" /><span>Envelope opening with initial on wax seal</span><b>+ Rs 200</b></li>
              <li><Check aria-hidden="true" /><span>Curtain reveal</span><b>+ Rs 200</b></li>
            </ul>
          </article>

          <article className="price-card reveal" style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
            <span className="plan-index">03 · Hero</span>
            <h3>Choose the hero</h3>
            <p>Decide how the first main section of your invitation should feel.</p>
            <div className="price"><strong>From Rs 0</strong><span>on top of base</span></div>
            <ul className="pricing-option-list">
              <li><Check aria-hidden="true" /><span>Basic hero with background image</span><b>Included</b></li>
              <li><Check aria-hidden="true" /><span>Interactive hero with uploaded or predefined photo</span><b>+ Rs 100</b></li>
            </ul>
          </article>

          <article className="price-card reveal" style={{ "--reveal-delay": "300ms" } as React.CSSProperties}>
            <span className="plan-index">04 · Sections</span>
            <h3>Choose your sections</h3>
            <p>The essentials are always included. Add the extra sections that make the invitation more personal.</p>
            <div className="section-price-columns">
              <div>
                <strong>Mandatory · Included</strong>
                <ul>{mandatorySections.map((section) => <li key={section}><Check aria-hidden="true" />{section}</li>)}</ul>
              </div>
              <div>
                <strong>Optional · Added to your quote</strong>
                <ul>{optionalSections.map((section) => <li key={section}><Sparkles aria-hidden="true" />{section}</li>)}</ul>
              </div>
            </div>
          </article>
        </div>
        <p className="pricing-note reveal">Optional section prices are added according to the sections selected. You will receive the full price before payment.</p>
      </section>

      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div className="contact-orb orb-a" aria-hidden="true" /><div className="contact-orb orb-b" aria-hidden="true" />
        <div className="contact-inner reveal">
          <p className="eyebrow">Let&apos;s create something beautiful</p>
          <h2 id="contact-title">Your date deserves<br /><em>a beautiful beginning.</em></h2>
          <p>Tell us about the celebration you are imagining and the components you would like to include.</p>
          <div className="contact-actions">
            <span className="coming-soon"><span className="live-dot" /> Bookings opening soon</span>
            <a className="button button-ivory" href="#pricing">Explore your options <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-seal">PI</span><h2>Paperless Invites</h2><p>Digital invitations for modern celebrations.</p></div>
        <div className="footer-links"><strong>Explore</strong><a href="#collection">Designs</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a></div>
        <div className="footer-note">
          <Sparkles aria-hidden="true" />
          <p>Made with care for life&apos;s most beautiful gatherings.</p>
          <div className="footer-socials" aria-label="Social media accounts coming soon">
            <span title="Facebook — coming soon" aria-label="Facebook — coming soon"><FacebookLogo /></span>
            <span title="Instagram — coming soon" aria-label="Instagram — coming soon"><InstagramLogo /></span>
            <span title="TikTok — coming soon" aria-label="TikTok — coming soon"><TikTokLogo /></span>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Paperless Invites</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </main>
  );
}

function ShowcaseCard({ card, small = false }: { card: { kind: string; image?: string; label: string }; small?: boolean }) {
  return (
    <div className={`showcase-card ${card.kind} ${small ? "small" : ""}`}>
      {card.image && <img src={card.image} alt="" />}
      {card.kind === "paper" && <><span>PAPERLESS INVITES</span><strong>{card.label.split("\n").map((line) => <i key={line}>{line}</i>)}</strong><em>✦</em></>}
      {card.kind === "seal" && <><div className="mini-seal">PI</div><strong>{card.label}</strong><span>OPEN TO BEGIN</span></>}
    </div>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.1 8.2h2.7V4.3c-.5-.1-2-.3-3.8-.3-3.7 0-6.2 2.2-6.2 6.4V14H3v4.4h3.8V24h4.7v-5.6h3.7l.6-4.4h-4.3v-3.2c0-1.3.4-2.6 2.6-2.6Z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.7" r="1" className="social-dot" />
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.2 3v11.3a4.3 4.3 0 1 1-3.7-4.3v2.6a1.8 1.8 0 1 0 1.2 1.7V3h2.5Zm0 0c.4 2.3 1.8 3.8 4.2 4.2v2.6a8.1 8.1 0 0 1-4.2-1.6V3Z" />
    </svg>
  );
}