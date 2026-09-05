"use client";

import { useEffect } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Gem,
  Heart,
  Leaf,
  Mail,
  Menu,
  Palette,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

const collection = [
  { name: "Coastal Reverie", mood: "Sun-washed & timeless", image: "/images/coastal-reverie.webp", tone: "light" },
  { name: "Rose Afterglow", mood: "Olive & ivory", image: "/images/rose-scratch-hero-olive.webp", tone: "dark" },
  { name: "Moonlit Bloom", mood: "Cinematic & refined", image: "/images/moonlit-bloom.webp", tone: "dark" },
];

const process = [
  { icon: Gem, number: "01", title: "Choose your mood", copy: "Browse the collection and find the atmosphere that feels like your event." },
  { icon: Palette, number: "02", title: "Make it personal", copy: "We shape the colours, words and finishing details around your story." },
  { icon: Mail, number: "03", title: "Approve the details", copy: "Review every part of the experience before your invitation goes live." },
  { icon: Send, number: "04", title: "Share in a tap", copy: "Send one beautiful link through WhatsApp, message or social media." },
];

const plans = [
  { name: "Essential", description: "A polished digital save the date for intimate celebrations.", features: ["One signature design", "Personal wording", "Mobile-ready link"], featured: false },
  { name: "Signature", description: "The complete invitation experience, designed around your event.", features: ["Premium design direction", "Custom colour palette", "Animated digital envelope", "Unlimited guest sharing"], featured: true },
  { name: "Bespoke", description: "A one-of-one art direction for a celebration unlike any other.", features: ["Original creative concept", "Extended storytelling", "Priority design service"], featured: false },
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
        <a href="#top" className="brand" aria-label="Event Invitations home">
          <span className="brand-seal">EI</span>
          <span>Event Invitations</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#collection">Collection</a>
          <a href="#process">How it works</a>
          <a href="#compare">Why digital</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="#contact" className="nav-action">Start your story <ArrowRight aria-hidden="true" /></a>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu aria-hidden="true" /></summary>
          <div>
            <a href="#collection">Collection</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a><a href="#contact">Contact</a>
          </div>
        </details>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><Sparkles aria-hidden="true" /> Welcome to Event Invitations</p>
          <h1 id="hero-title">The most elegant <em>save the date.</em></h1>
          <p>Digital invitations for modern love stories, milestone moments and every celebration worth remembering.</p>
          <div className="hero-actions">
            <a className="button button-wine" href="#collection">Discover the collection <ArrowRight aria-hidden="true" /></a>
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
        <div className="section-heading reveal">
          <p className="eyebrow">✦ The first collection</p>
          <h2 id="collection-title">Choose your style,<br /><em>make it unforgettable.</em></h2>
          <p>Three art directions are taking shape. For now, explore the feeling of each world—the full invitations are the next chapter.</p>
        </div>
        <div className="collection-grid">
          {collection.map((item, index) => (
            <article className={`collection-card tilt-card reveal ${item.tone}`} key={item.name} style={{ "--reveal-delay": `${index * 120}ms` } as React.CSSProperties}>
              <img src={item.image} alt={`${item.name} invitation artwork`} />
              <div className="card-shine" aria-hidden="true" />
              <div className="collection-number">0{index + 1}</div>
              <div className="collection-content">
                <span>{item.mood}</span>
                <h3>{item.name}</h3>
                <p>Collection preview</p>
              </div>
              <a href={index === 0 ? "/templates/coastal-reverie" : "#contact"} aria-label={index === 0 ? `Open the ${item.name} invitation` : `Enquire about ${item.name}`}><ArrowDownRight aria-hidden="true" /></a>
            </article>
          ))}
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
          <p className="eyebrow"><span className="live-dot" /> Signature detail</p>
          <h2 id="envelope-title">The magic begins <em>before it opens.</em></h2>
          <p>Every invitation can arrive inside a tactile digital envelope—finished with your chosen colour, paper texture and elegant wax seal.</p>
          <div className="mini-features"><span><Palette aria-hidden="true" /> Custom colour</span><span><Gem aria-hidden="true" /> Signature seal</span><span><Heart aria-hidden="true" /> Made for you</span></div>
        </div>
      </section>

      <section className="process section" id="process" aria-labelledby="process-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">A beautifully simple process</p>
          <h2 id="process-title">From an idea to<br /><em>one unforgettable link.</em></h2>
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
        <div className="pricing-heading reveal">
          <p className="eyebrow">Simple, considered pricing</p>
          <h2 id="pricing-title">Choose how far<br /><em>your story travels.</em></h2>
          <p>Every celebration is different, so pricing stays personal. Select a direction and receive a clear quotation before any work begins.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <article className={`price-card reveal ${plan.featured ? "featured" : ""}`} key={plan.name} style={{ "--reveal-delay": `${index * 100}ms` } as React.CSSProperties}>
              {plan.featured && <div className="popular">Most loved</div>}
              <span className="plan-index">0{index + 1}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="price"><strong>Custom</strong><span>quotation</span></div>
              <ul>{plan.features.map((feature) => <li key={feature}><Check aria-hidden="true" />{feature}</li>)}</ul>
              <a href="#contact">Enquire about {plan.name} <ArrowRight aria-hidden="true" /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div className="contact-orb orb-a" aria-hidden="true" /><div className="contact-orb orb-b" aria-hidden="true" />
        <div className="contact-inner reveal">
          <p className="eyebrow">Let&apos;s create something beautiful</p>
          <h2 id="contact-title">Your date deserves<br /><em>a beautiful beginning.</em></h2>
          <p>Tell us about the celebration you are imagining. Enquiries will open with the first invitation collection.</p>
          <div className="contact-actions">
            <span className="coming-soon"><span className="live-dot" /> Bookings opening soon</span>
            <a className="button button-ivory" href="#collection">Explore the collection <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-seal">EI</span><h2>Event Invitations</h2><p>Digital invitations for modern celebrations.</p></div>
        <div className="footer-links"><strong>Explore</strong><a href="#collection">Collection</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a></div>
        <div className="footer-note"><Sparkles aria-hidden="true" /><p>Made with care for life&apos;s most beautiful gatherings.</p></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Event Invitations</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </main>
  );
}

function ShowcaseCard({ card, small = false }: { card: { kind: string; image?: string; label: string }; small?: boolean }) {
  return (
    <div className={`showcase-card ${card.kind} ${small ? "small" : ""}`}>
      {card.image && <img src={card.image} alt="" />}
      {card.kind === "paper" && <><span>EVENT INVITATIONS</span><strong>{card.label.split("\n").map((line) => <i key={line}>{line}</i>)}</strong><em>✦</em></>}
      {card.kind === "seal" && <><div className="mini-seal">EI</div><strong>{card.label}</strong><span>OPEN TO BEGIN</span></>}
    </div>
  );
}
