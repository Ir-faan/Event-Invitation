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
  Plus,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

const collection = [
  { name: "Soft & Timeless", mood: "Beige, ivory & warm colours", image: "/images/coastal-reverie.webp", tone: "light" },
  { name: "Olive Romance", mood: "Olive green & soft flowers", image: "/images/rose-scratch-hero-olive.webp", tone: "dark" },
  { name: "Evening Elegance", mood: "Deep colours & an elegant look", image: "/images/moonlit-bloom.webp", tone: "dark" },
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

const includedParts = [
  "Countdown",
  "Order of Events (Our Journey)",
  "Event Details + Location",
  "Gift Preferences",
  "Footer",
];

const optionalParts = [
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
          <a href="#collection">Examples</a>
          <a href="#process">How it works</a>
          <a href="#compare">Why digital</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="/design-invitation" className="nav-action">Design yours <ArrowRight aria-hidden="true" /></a>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu aria-hidden="true" /></summary>
          <div>
            <a href="#collection">Examples</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a><a href="/design-invitation">Design yours</a>
          </div>
        </details>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><Sparkles aria-hidden="true" /> Welcome to Paperless Invites</p>
          <h1 id="hero-title">The most elegant <em>save the date.</em></h1>
          <p>Beautiful digital invitations for weddings and special days. Easy to open, easy to share and made to feel personal.</p>
          <div className="hero-actions">
            <a className="button button-wine" href="/design-invitation">Design your invitation <ArrowRight aria-hidden="true" /></a>
            <a className="text-link" href="#collection">See invitation examples <ArrowDownRight aria-hidden="true" /></a>
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
            <div className="phone-copy"><span>PAPERLESS INVITES</span><strong>Your story<br />begins here</strong><i>Save the date</i></div>
          </div>
        </div>
        <a href="#collection" className="scroll-cue"><span>Scroll to explore</span><ChevronDown aria-hidden="true" /></a>
      </section>

      <section className="collection section" id="collection" aria-labelledby="collection-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">✦ Invitation examples</p>
          <h2 id="collection-title">See what your invitation<br /><em>can look like.</em></h2>
          <p>Have a look at some ready-made invitation examples. Use them for ideas, then choose the colours and features you want for your own invitation.</p>
        </div>
        <div className="collection-grid">
          {collection.map((item, index) => (
            <article className={`collection-card tilt-card reveal ${item.tone}`} key={item.name} style={{ "--reveal-delay": `${index * 120}ms` } as React.CSSProperties}>
              <img src={item.image} alt={`${item.name} invitation example`} />
              <div className="card-shine" aria-hidden="true" />
              <div className="collection-number">0{index + 1}</div>
              <div className="collection-content">
                <span>{item.mood}</span>
                <h3>{item.name}</h3>
                <p>Invitation example</p>
              </div>
              <a href="#pricing" aria-label={`See how to create an invitation inspired by ${item.name}`}><ArrowDownRight aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        <div className="palette-showcase reveal" aria-label="Available colour choices">
          <span className="palette-showcase-label">Choose from these colours</span>
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
        <div className="collection-cta reveal">
          <a className="button button-wine" href="/design-invitation">Design your own invitation <ArrowRight aria-hidden="true" /></a>
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
          <h2 id="envelope-title">Make the first tap <em>feel special.</em></h2>
          <p>You can start with a digital envelope, a curtain opening, or no opening at all. Choose the one you like best.</p>
          <div className="mini-features"><span><Palette aria-hidden="true" /> Your colours</span><span><Gem aria-hidden="true" /> Your initials</span><span><Heart aria-hidden="true" /> Your choice</span></div>
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
          <h2 id="comparison-title">Beautiful to receive.<br /><em>Easy to share.</em></h2>
          <p>A digital invitation gives your guests all the important details in one place, without printing or delivery.</p>
        </div>
        <div className="comparison-grid">
          <article className="paper-card reveal">
            <div className="paper-title"><span>Traditional paper</span><Clock3 aria-hidden="true" /></div>
            <div className="receipt-line"><span>Design changes</span><strong>More steps</strong></div>
            <div className="receipt-line"><span>Printing & envelopes</span><strong>Extra cost</strong></div>
            <div className="receipt-line"><span>Delivery</span><strong>Can take days</strong></div>
            <div className="receipt-line"><span>Last-minute change</span><strong>Print again</strong></div>
            <div className="paper-total"><span>WHAT IT CAN ADD</span><strong>More time and cost</strong></div>
          </article>
          <article className="digital-card reveal">
            <div className="digital-label">Digital invitation</div>
            <h3>One link.<br />All your details.</h3>
            <ul>
              <li><Smartphone aria-hidden="true" /><span><strong>Made for phones</strong>Easy for guests to open and read.</span><Check aria-hidden="true" /></li>
              <li><Send aria-hidden="true" /><span><strong>Easy to share</strong>Send it in a few taps.</span><Check aria-hidden="true" /></li>
              <li><Leaf aria-hidden="true" /><span><strong>Less paper</strong>No printing or envelopes needed.</span><Check aria-hidden="true" /></li>
            </ul>
            <div className="digital-foot"><span>Simple, personal and easy to share</span><Sparkles aria-hidden="true" /></div>
          </article>
        </div>
      </section>

      <section className="pricing section" id="pricing" aria-labelledby="pricing-title">
        <div className="pricing-heading centered reveal">
          <p className="eyebrow">Simple pricing</p>
          <h2 id="pricing-title">Start at Rs 1,000.<br /><em>Add only what you want.</em></h2>
          <p>Your invitation starts with the main parts already included. You only pay more when you choose an extra feature or an extra part.</p>
        </div>

        <div className="price-formula reveal" aria-label="Pricing formula">
          <div className="formula-main"><span>Your starting price</span><strong>Rs 1,000</strong></div>
          <Plus aria-hidden="true" />
          <div className="formula-extra"><span>Add your choices</span><strong>Only the extras you want</strong></div>
          <span className="formula-equals">=</span>
          <div className="formula-total"><span>Your final price</span><strong>Shown before payment</strong></div>
        </div>

        <div className="simple-pricing-layout">
          <article className="base-invite-card reveal">
            <div className="simple-price-badge">Step 1 · Start here</div>
            <div className="base-price-row">
              <div>
                <span>Basic invitation</span>
                <strong>Rs 1,000</strong>
              </div>
              <Check aria-hidden="true" />
            </div>
            <p>This gives you a complete invitation with the important parts already included.</p>

            <div className="base-choice-block">
              <strong>Choose your colours</strong>
              <span>Pick 1 of the 6 colour styles.</span>
              <div className="mini-palette-row" aria-label="Six available colour styles">
                {palettes.map((palette) => (
                  <div key={palette.name} title={palette.name}>
                    {palette.colours.slice(0, 2).map((colour) => <i key={colour} style={{ background: colour }} />)}
                  </div>
                ))}
              </div>
            </div>

            <div className="included-parts">
              <strong>These parts are included</strong>
              <span className="parts-help">A “part” is one block of the invitation, such as the countdown or event details.</span>
              <ul>
                {includedParts.map((part) => <li key={part}><Check aria-hidden="true" />{part}</li>)}
              </ul>
            </div>
          </article>

          <article className="extras-card reveal">
            <div className="simple-price-badge">Step 2 · Add extras if you want</div>
            <h3>Choose your extras</h3>
            <p>You do not need to add anything. Choose only the extras that matter to you.</p>

            <div className="extra-group">
              <div className="extra-group-title">
                <div><span>1</span><strong>How should the invitation open?</strong></div>
                <small>Opening effect</small>
              </div>
              <div className="extra-options">
                <div><span>No special opening</span><b>Included</b></div>
                <div><span>Envelope opening with initials on wax seal</span><b>+ Rs 200</b></div>
                <div><span>Curtain opening</span><b>+ Rs 200</b></div>
              </div>
            </div>

            <div className="extra-group">
              <div className="extra-group-title">
                <div><span>2</span><strong>Choose the main photo area</strong></div>
                <small>The first big area guests see</small>
              </div>
              <div className="extra-options">
                <div><span>Normal photo in the background</span><b>Included</b></div>
                <div><span>Photo guests can interact with, such as scratch to reveal</span><b>+ Rs 100</b></div>
              </div>
            </div>

            <div className="extra-group">
              <div className="extra-group-title">
                <div><span>3</span><strong>Add more invitation parts</strong></div>
                <small>Rs 150 each</small>
              </div>
              <div className="optional-parts-grid">
                {optionalParts.map((part) => (
                  <span key={part}><Sparkles aria-hidden="true" /><span>{part}</span><b>+ Rs 150</b></span>
                ))}
              </div>
              <p className="extra-note">Each extra invitation part costs Rs 150. Choose as many as you would like and the total will be shown before payment.</p>
            </div>

            <div className="extra-group custom-part-group">
              <div className="extra-group-title">
                <div><span>4</span><strong>Need something that is not listed?</strong></div>
                <b>+ Rs 500</b>
              </div>
              <p>We can add one custom part made specially for your invitation. This is for something that is not already available in the choices above. Your custom part will be planned with you during a video consultation.</p>
            </div>
          </article>
        </div>

        <div className="pricing-service-notes reveal">
          <article>
            <CreditCard aria-hidden="true" />
            <div>
              <strong>Payment is made outside the website</strong>
              <p>After your invitation is approved, the payment details will be sent to you. You can pay by MCB Juice or bank transfer.</p>
            </div>
          </article>
          <article>
            <Smartphone aria-hidden="true" />
            <div>
              <strong>Need help designing your invitation?</strong>
              <p>If you are not sure what to choose, I can assist you through a video consultation. Custom parts are also planned together with you during a video consultation.</p>
            </div>
          </article>
        </div>

        <div className="pricing-action reveal">
          <p><strong>Ready to start?</strong> Choose your options and build the invitation you want.</p>
          <a className="button button-wine" href="/design-invitation">Design your invitation <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div className="contact-orb orb-a" aria-hidden="true" /><div className="contact-orb orb-b" aria-hidden="true" />
        <div className="contact-inner reveal">
          <p className="eyebrow">Let&apos;s create something beautiful</p>
          <h2 id="contact-title">Your date deserves<br /><em>a beautiful beginning.</em></h2>
          <p>Tell us about the celebration you are imagining and the components you would like to include.</p>
          <div className="contact-actions">
            <span className="coming-soon"><span className="live-dot" /> Enquiries welcome</span>
            <a className="button button-ivory" href="#pricing">Explore your options <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-seal">PI</span><h2>Paperless Invites</h2><p>Beautiful digital invitations, made easy.</p></div>
        <div className="footer-links"><strong>Explore</strong><a href="#collection">Examples</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a></div>
        <div className="footer-note">
          <Sparkles aria-hidden="true" />
          <p>Made with care for life&apos;s most beautiful gatherings.</p>
          <div className="footer-socials" aria-label="Paperless Invites social media">
            <span className="social-button" title="Facebook" aria-label="Facebook"><FacebookLogo /></span>
            <span className="social-button" title="Instagram" aria-label="Instagram"><InstagramLogo /></span>
            <span className="social-button" title="TikTok" aria-label="TikTok"><TikTokLogo /></span>
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
    <svg className="brand-icon brand-facebook" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.8 21v-8h2.8l.42-3.15H13.8V7.84c0-.91.26-1.53 1.62-1.53h1.73V3.5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.53-4.22 4.34v2.14H7.57V13h2.83v8h3.4Z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg className="brand-icon brand-instagram" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.55" cy="6.65" r="1" className="social-dot" />
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg className="brand-icon brand-tiktok" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.15 3.1c.18 1.63 1.1 3.03 2.49 3.79a5.7 5.7 0 0 0 2.38.66v3.03a8.47 8.47 0 0 1-4.87-1.55v6.2a5.32 5.32 0 1 1-4.58-5.27v3.08a2.28 2.28 0 1 0 1.55 2.16V3.1h3.03Z" />
    </svg>
  );
}