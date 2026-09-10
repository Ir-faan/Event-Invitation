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
  Layers3,
  Leaf,
  Menu,
  Palette,
  Plus,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

const palettes = [
  { name: "Beige", colours: ["#e8ddcf", "#f8f2ea", "#b89d7f"] },
  { name: "Olive Green", colours: ["#68704b", "#a5a77c", "#eee8d8"] },
  { name: "Dusty Blue", colours: ["#71879a", "#aebdca", "#edf1f3"] },
  { name: "Burgundy / Wine", colours: ["#54202b", "#8a4a55", "#f0dedf"] },
  { name: "Pink", colours: ["#c88e9a", "#e8bec7", "#fff0f2"] },
  { name: "Purple / Lilac", colours: ["#75617f", "#b8a2c1", "#f1eaf3"] },
];

const examples = [
  { name: "Soft & Timeless", mood: "Beige, ivory & warm colours", image: "/images/coastal-reverie.webp" },
  { name: "Olive Romance", mood: "Olive green & soft flowers", image: "/images/rose-scratch-hero-olive.webp" },
  { name: "Evening Elegance", mood: "Deep colours & an elegant look", image: "/images/moonlit-bloom.webp" },
];

// 8 cards total: 6 hero/scratch photos + 2 opening effects = exactly 25% openings.
const movingShowcase = [
  { image: "/images/builder-hero-beige.webp", label: "Warm beige hero", type: "photo" },
  { image: "/images/builder-interactive-henna-hands.webp", label: "Scratch reveal — henna hands", type: "photo" },
  { image: "/images/builder-hero-garden-olive.webp", label: "Olive garden hero", type: "photo" },
  { image: "/images/builder-interactive-orchid-bouquet.webp", label: "Scratch reveal — orchid bouquet", type: "photo" },
  { image: "/images/builder-hero-ballroom-dusty-blue.webp", label: "Dusty blue ballroom hero", type: "photo" },
  { image: "/images/builder-interactive-island-walk.webp", label: "Scratch reveal — island walk", type: "photo" },
  { image: "/images/builder-envelope-botanical-beige.webp", label: "Botanical envelope opening", type: "opening" },
  { image: "/images/builder-curtain-classic-burgundy.webp", label: "Burgundy curtain reveal", type: "opening" },
];

const designProcess = [
  { icon: Palette, number: "01", title: "Design the invitation", copy: "Choose your colours, opening, main photo and the invitation parts you want." },
  { icon: Eye, number: "02", title: "Review the design", copy: "See your choices in the live mobile preview, then review the finished invitation link." },
  { icon: CreditCard, number: "03", title: "Payment", copy: "Pay after you receive your invitation link and are happy with the result." },
  { icon: Send, number: "04", title: "Share in a tap", copy: "Send one elegant link to family and guests on the apps you already use." },
];

const includedParts = [
  "Countdown to the big day",
  "Order of Events / Our Journey",
  "Event Details & Location",
  "Gift Preferences",
];

const extraParts = [
  "A Special Message",
  "Seating Arrangement",
  "Day Programme",
  "Glimpse Of Us",
];

export function LandingExperienceRefresh() {
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".landing-refresh .reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 },
    );
    reveals.forEach((element) => observer.observe(element));

    const handleScroll = () => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll-progress", `${maximum > 0 ? window.scrollY / maximum : 0}`);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main id="top" className="landing-refresh">
      <div className="scroll-progress" aria-hidden="true" />
      <div className="ambient-glow" aria-hidden="true" />
      <div className="falling-sparkles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            style={{
              "--spark-x": `${(index * 37) % 100}%`,
              "--spark-delay": `${-(index % 8) * 1.9}s`,
              "--spark-duration": `${13 + (index % 5) * 2}s`,
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
          <a href="#gallery">Examples</a>
          <a href="#customise">Customise</a>
          <a href="#process">How it works</a>
          <a href="#compare">Why digital</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="/design-invitation" className="nav-action">Design yours <ArrowRight aria-hidden="true" /></a>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu aria-hidden="true" /></summary>
          <div>
            <a href="#gallery">Examples</a>
            <a href="#customise">Customise</a>
            <a href="#process">How it works</a>
            <a href="#compare">Why digital</a>
            <a href="#pricing">Pricing</a>
            <a href="/design-invitation">Design yours</a>
          </div>
        </details>
      </header>

      <section className="hero landing-hero" aria-labelledby="hero-title">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><Sparkles aria-hidden="true" /> Welcome to Paperless Invites</p>
          <h1 id="hero-title">The most elegant <em>save the date.</em></h1>
          <p>Beautiful digital invitations for weddings and special days. Choose the details you love, preview them live and share your finished invitation in a tap.</p>
          <div className="hero-actions">
            <a className="button button-wine" href="/design-invitation">Design your invitation <ArrowRight aria-hidden="true" /></a>
            <a className="text-link" href="#gallery">See what you can create <ArrowDownRight aria-hidden="true" /></a>
          </div>
        </div>

        <div className="showcase landing-showcase" id="gallery" aria-label="Moving examples of invitation photos, envelopes and curtains">
          <div className="marquee-row row-one">
            <div className="marquee-track">
              {[...movingShowcase, ...movingShowcase].map((card, index) => <MovingCard key={`a-${index}`} card={card} />)}
            </div>
          </div>
          <div className="marquee-row row-two" aria-hidden="true">
            <div className="marquee-track reverse">
              {[...movingShowcase].reverse().concat([...movingShowcase].reverse()).map((card, index) => <MovingCard key={`b-${index}`} card={card} small />)}
            </div>
          </div>
          <div className="spotlight-phone" aria-hidden="true">
            <div className="phone-speaker" />
            <img src="/images/builder-hero-beige.webp" alt="" />
            <div className="phone-copy"><span>PAPERLESS INVITES</span><strong>Your story<br />begins here</strong><i>Save the date</i></div>
          </div>
        </div>
        <a href="#compare" className="scroll-cue"><span>Why digital?</span><ChevronDown aria-hidden="true" /></a>
      </section>

      <section className="comparison section landing-comparison" id="compare" aria-labelledby="comparison-title">
        <div className="comparison-orbit comparison-orbit-a" aria-hidden="true" />
        <div className="comparison-orbit comparison-orbit-b" aria-hidden="true" />
        <div className="section-heading centered reveal">
          <p className="eyebrow">Paper or digital?</p>
          <h2 id="comparison-title">Beautiful to receive.<br /><em>Effortless to share.</em></h2>
          <p>Keep the elegance of a traditional invitation, while giving your guests every detail in one easy link.</p>
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
            <div className="digital-label">Paperless invitation</div>
            <h3>One link.<br />Everything they need.</h3>
            <ul>
              <li><Smartphone aria-hidden="true" /><span><strong>Made for phones</strong>Simple for guests to open and read.</span><Check aria-hidden="true" /></li>
              <li><Send aria-hidden="true" /><span><strong>Share instantly</strong>Send it in WhatsApp or any messaging app.</span><Check aria-hidden="true" /></li>
              <li><Leaf aria-hidden="true" /><span><strong>No printing</strong>No paper, envelopes or delivery needed.</span><Check aria-hidden="true" /></li>
            </ul>
            <div className="digital-foot"><span>Elegant, personal and easy to share</span><Sparkles aria-hidden="true" /></div>
          </article>
        </div>
      </section>

      <section className="customizer-section section" id="customise" aria-labelledby="customizer-title">
        <div className="customizer-copy reveal">
          <p className="eyebrow"><Palette aria-hidden="true" /> Designed around your taste</p>
          <h2 id="customizer-title">Make the invitation<br /><em>feel completely yours.</em></h2>
          <p>Choose your colour palette, opening style, photos and invitation parts yourself. You are not locked into one fixed template — build the combination that feels right for your event.</p>
          <div className="customizer-points">
            <span><Eye aria-hidden="true" /><b>Live mobile preview</b><small>See your invitation change as you make each choice.</small></span>
            <span><Layers3 aria-hidden="true" /><b>Choose your parts</b><small>Add only the sections and interactive moments you want.</small></span>
            <span><Palette aria-hidden="true" /><b>Your colours & photos</b><small>Shape the look around your own event and style.</small></span>
          </div>
          <a className="button button-wine" href="/design-invitation">Start designing yours <ArrowRight aria-hidden="true" /></a>
        </div>

        <div className="customizer-demo reveal" aria-label="Preview of the invitation creation page">
          <div className="customizer-browser-bar" aria-hidden="true">
            <span /><span /><span />
            <strong>Paperless Invites · Invitation Designer</strong>
          </div>
          <div className="customizer-live-badge"><span className="live-dot" /> Live preview while you design</div>
          <div className="customizer-frame">
            <iframe
              src="/design-invitation"
              title="Paperless Invites invitation designer preview"
              loading="lazy"
              tabIndex={-1}
            />
          </div>
          <p>This is the same creation page you will use to design your invitation.</p>
        </div>
      </section>

      <section className="collection section" id="collection" aria-labelledby="collection-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">✦ Invitation inspiration</p>
          <h2 id="collection-title">Start with an idea.<br /><em>Then make it your own.</em></h2>
          <p>These examples show a few moods you can create. Your final invitation can mix the colours, opening, photos and parts that suit you.</p>
        </div>
        <div className="collection-grid">
          {examples.map((item, index) => (
            <article className="collection-card reveal" key={item.name} style={{ "--reveal-delay": `${index * 110}ms` } as React.CSSProperties}>
              <img src={item.image} alt={`${item.name} digital invitation example`} />
              <div className="collection-number">0{index + 1}</div>
              <div className="collection-content">
                <span>{item.mood}</span>
                <h3>{item.name}</h3>
                <p>Invitation inspiration</p>
              </div>
              <a href="/design-invitation" aria-label={`Design an invitation inspired by ${item.name}`}><ArrowDownRight aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        <div className="palette-showcase reveal" aria-label="Available colour choices">
          <span className="palette-showcase-label">Choose from these colour palettes</span>
          <div className="palette-showcase-grid">
            {palettes.map((palette) => (
              <div className="palette-pill" key={palette.name}>
                <span className="palette-dots" aria-hidden="true">{palette.colours.map((colour) => <i key={colour} style={{ background: colour }} />)}</span>
                <strong>{palette.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="opening-showcase" aria-labelledby="opening-title">
        <div className="opening-gallery reveal" aria-hidden="true">
          <figure className="opening-shot opening-shot-main"><img src="/images/builder-envelope-botanical-beige.webp" alt="" /></figure>
          <figure className="opening-shot opening-shot-side"><img src="/images/builder-curtain-classic-burgundy.webp" alt="" /></figure>
          <figure className="opening-shot opening-shot-small"><img src="/images/builder-envelope-classic-olive.webp" alt="" /></figure>
        </div>
        <div className="opening-copy reveal">
          <p className="eyebrow"><Sparkles aria-hidden="true" /> Optional opening</p>
          <h2 id="opening-title">Make the first tap<br /><em>feel special.</em></h2>
          <p>Begin with an elegant envelope, reveal the invitation behind curtains, or let guests see the invitation immediately. The opening is your choice.</p>
          <a className="text-link opening-link" href="/design-invitation">See the opening choices <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className="process section" id="process" aria-labelledby="process-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">A beautifully simple process</p>
          <h2 id="process-title">From your choices to<br /><em>one unforgettable link.</em></h2>
        </div>
        <div className="process-line reveal" aria-hidden="true"><span /></div>
        <div className="process-grid">
          {designProcess.map((step, index) => (
            <article className="process-step reveal" key={step.number} style={{ "--reveal-delay": `${index * 100}ms` } as React.CSSProperties}>
              <div className="step-icon"><step.icon aria-hidden="true" /><span>{step.number}</span></div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing section" id="pricing" aria-labelledby="pricing-title">
        <div className="pricing-heading centered reveal">
          <p className="eyebrow">Simple pricing</p>
          <h2 id="pricing-title">Start at Rs 1,000.<br /><em>Add only what you want.</em></h2>
          <p>The base invitation includes the essential parts. Extra invitation parts cost Rs 200 each, while another copy of an already-included part costs Rs 150.</p>
        </div>

        <div className="price-formula reveal" aria-label="Pricing formula">
          <div className="formula-main"><span>Your starting price</span><strong>Rs 1,000</strong></div>
          <Plus aria-hidden="true" />
          <div className="formula-extra"><span>Add your choices</span><strong>Only the extras you want</strong></div>
          <span className="formula-equals">=</span>
          <div className="formula-total"><span>Your final price</span><strong>Shown while you design</strong></div>
        </div>

        <div className="simple-pricing-layout">
          <article className="base-invite-card reveal">
            <div className="simple-price-badge">Step 1 · Start here</div>
            <div className="base-price-row"><div><span>Basic invitation</span><strong>Rs 1,000</strong></div><Check aria-hidden="true" /></div>
            <p>A complete digital invitation with the important parts already included.</p>
            <div className="base-choice-block">
              <strong>Choose your colours</strong>
              <span>Pick one of the six colour palettes.</span>
              <div className="mini-palette-row" aria-label="Six available colour styles">
                {palettes.map((palette) => <div key={palette.name} title={palette.name}>{palette.colours.slice(0, 2).map((colour) => <i key={colour} style={{ background: colour }} />)}</div>)}
              </div>
            </div>
            <div className="included-parts">
              <strong>Included once in the base invitation</strong>
              <span className="parts-help">You can add another version of any of these for Rs 150 each.</span>
              <ul>{includedParts.map((part) => <li key={part}><Check aria-hidden="true" />{part}</li>)}</ul>
            </div>
          </article>

          <article className="extras-card reveal">
            <div className="simple-price-badge">Step 2 · Add extras if you want</div>
            <h3>Choose your extras</h3>
            <p>Your designer calculates the total as you choose. Nothing extra is required.</p>

            <PricingGroup number="1" title="How should the invitation open?" note="Opening effect">
              <div className="extra-options">
                <div><span>No special opening</span><b>Included</b></div>
                <div><span>Envelope & wax seal opening</span><b>+ Rs 200</b></div>
                <div><span>Curtain reveal</span><b>+ Rs 200</b></div>
              </div>
            </PricingGroup>

            <PricingGroup number="2" title="Choose the main photo area" note="Hero interaction">
              <div className="extra-options">
                <div><span>Normal photo in the background</span><b>Included</b></div>
                <div><span>Interactive photo, such as scratch to reveal</span><b>+ Rs 100</b></div>
              </div>
            </PricingGroup>

            <PricingGroup number="3" title="Add more invitation parts" note="Rs 200 each">
              <div className="optional-parts-grid">
                {extraParts.map((part) => <span key={part}><Sparkles aria-hidden="true" /><span>{part}</span><b>+ Rs 200</b></span>)}
              </div>
              <p className="extra-note">Each additional invitation part from this list costs Rs 200.</p>
            </PricingGroup>

            <PricingGroup number="4" title="Repeat an included part" note="Rs 150 each">
              <div className="optional-parts-grid repeat-parts-grid">
                {includedParts.map((part) => <span key={part}><Plus aria-hidden="true" /><span>{part}</span><b>+ Rs 150</b></span>)}
              </div>
              <p className="extra-note">The first version is included in the base invitation. Add another countdown, event group, journey or gift section for Rs 150 each.</p>
            </PricingGroup>

            <div className="extra-group custom-part-group">
              <div className="extra-group-title"><div><span>5</span><strong>Need something that is not listed?</strong></div><b>+ Rs 500</b></div>
              <p>We can plan and create one completely custom invitation part with you.</p>
            </div>
          </article>
        </div>

        <div className="pricing-service-notes reveal">
          <article><CreditCard aria-hidden="true" /><div><strong>Pay after you review your link</strong><p>We send the finished invitation link first. Payment follows after you have reviewed it and are happy with the result.</p></div></article>
          <article><Clock3 aria-hidden="true" /><div><strong>Usually ready in around 2–5 days</strong><p>Once the invitation details are final, your invitation link will normally be prepared within 2–5 days.</p></div></article>
        </div>
        <div className="pricing-action reveal">
          <p><strong>Ready to see your price?</strong> Build the invitation you want and watch the total update from your choices.</p>
          <a className="button button-wine" href="/design-invitation">Design your invitation <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <footer className="site-footer refreshed-footer">
        <div className="footer-shell">
          <div className="footer-brand-block">
            <a href="#top" className="footer-logo"><span className="brand-seal">PI</span><span>Paperless Invites</span></a>
            <h2>Your celebration.<br /><em>Your invitation.</em></h2>
            <p>Elegant digital invitations you can shape around your own colours, photos and story.</p>
            <a className="footer-design-button" href="/design-invitation">Design yours <ArrowRight aria-hidden="true" /></a>
          </div>

          <div className="footer-column">
            <span className="footer-column-title">Explore</span>
            <a href="#gallery">Invitation examples</a>
            <a href="#customise">Customise yours</a>
            <a href="#process">How it works</a>
            <a href="#compare">Why digital</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="footer-column footer-start-column">
            <span className="footer-column-title">Start creating</span>
            <p>Choose your options and see a live phone preview before sending your design.</p>
            <a href="/design-invitation" className="footer-arrow-link">Open the invitation designer <ArrowRight aria-hidden="true" /></a>
            <div className="footer-socials-new" aria-label="Paperless Invites social media coming soon">
              <span title="Facebook"><FacebookLogo /></span>
              <span title="Instagram"><InstagramLogo /></span>
              <span className="tiktok-mark" title="TikTok">♪</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom-new">
          <span>© {new Date().getFullYear()} Paperless Invites · Mauritius</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}

function MovingCard({ card, small = false }: { card: { image: string; label: string; type: string }; small?: boolean }) {
  return (
    <figure className={`showcase-card moving-image-card ${card.type === "opening" ? "opening-card" : ""} ${small ? "small" : ""}`}>
      <img src={card.image} alt="" />
      <figcaption>{card.type === "opening" ? "OPENING STYLE" : card.label.includes("Scratch") ? "SCRATCH TO REVEAL" : "HERO PHOTO"}</figcaption>
    </figure>
  );
}

function PricingGroup({ number, title, note, children }: { number: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="extra-group">
      <div className="extra-group-title"><div><span>{number}</span><strong>{title}</strong></div><small>{note}</small></div>
      {children}
    </div>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M13.8 21v-8h2.8l.42-3.15H13.8V7.84c0-.91.26-1.53 1.62-1.53h1.73V3.5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.53-4.22 4.34v2.14H7.57V13h2.83v8h3.4Z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.55" cy="6.65" r="1" fill="currentColor" />
    </svg>
  );
}