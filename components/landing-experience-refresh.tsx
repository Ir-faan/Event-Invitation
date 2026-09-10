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

// Each marquee row has its own images. Six photo cards + two opening cards keeps openings at 25%.
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

const movingShowcaseSecondRow = [
  { image: "/images/builder-hero-burgundy.webp", label: "Burgundy wedding hero", type: "photo" },
  { image: "/images/builder-interactive-bouquet.webp", label: "Scratch reveal — bridal bouquet", type: "photo" },
  { image: "/images/builder-hero-islamic-hall-lilac.webp", label: "Lilac wedding hall hero", type: "photo" },
  { image: "/images/builder-interactive-garden-walk.webp", label: "Scratch reveal — garden walk", type: "photo" },
  { image: "/images/builder-hero-ballroom-pink.webp", label: "Pink ballroom hero", type: "photo" },
  { image: "/images/builder-interactive-hands.webp", label: "Scratch reveal — couple hands", type: "photo" },
  { image: "/images/builder-envelope-classic-olive.webp", label: "Olive envelope opening", type: "opening" },
  { image: "/images/builder-curtain-botanical-dusty-blue.webp", label: "Dusty blue curtain reveal", type: "opening" },
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

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const socialLinks = { facebook: "", instagram: "", tiktok: "" };
const consultationMessage = "Hi, I would like some help designing my invitation and would like to arrange a free video consultation.";
const customPartMessage = "Hi, I would like to add a custom part to my invitation and discuss it during the free video consultation.";

function getWhatsAppLink(message: string) {
  return whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : "#";
}

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

  const consultationWhatsAppLink = getWhatsAppLink(consultationMessage);
  const customPartWhatsAppLink = getWhatsAppLink(customPartMessage);

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
          <a href="#collection">Examples</a>
          <a href="#customise">Customise</a>
          <a href="#process">How it works</a>
          <a href="#compare">Why digital</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="/design-invitation" className="nav-action">Design yours <ArrowRight aria-hidden="true" /></a>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu aria-hidden="true" /></summary>
          <div>
            <a href="#collection">Examples</a>
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
            <a className="text-link" href="#collection">See what you can create <ArrowDownRight aria-hidden="true" /></a>
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
              {[...movingShowcaseSecondRow, ...movingShowcaseSecondRow].map((card, index) => <MovingCard key={`b-${index}`} card={card} small />)}
            </div>
          </div>
          <div className="spotlight-phone" aria-hidden="true">
            <div className="phone-speaker" />
            <img src="/images/builder-hero-beige.webp" alt="" />
            <div className="phone-copy"><span>PAPERLESS INVITES</span><strong>Your story<br />begins here</strong><i>Save the date</i></div>
          </div>
        </div>
        <a href="#collection" className="scroll-cue"><span>Browse invitations</span><ChevronDown aria-hidden="true" /></a>
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
            <iframe src="/design-invitation" title="Paperless Invites invitation designer preview" loading="lazy" tabIndex={-1} />
          </div>
          <p>This is the same creation page you will use to design your invitation.</p>
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
              <div><span>Basic invitation</span><strong>Rs 1,000</strong></div>
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
              <ul>{includedParts.map((part) => <li key={part}><Check aria-hidden="true" />{part}</li>)}</ul>
              <span className="parts-help">Want another copy of one of these included parts? Add it for Rs 150 each.</span>
            </div>
          </article>

          <article className="extras-card reveal">
            <div className="simple-price-badge">Step 2 · Add extras if you want</div>
            <h3>Choose your extras</h3>
            <p>You do not need to add anything. Choose only the extras that matter to you.</p>

            <div className="extra-group">
              <div className="extra-group-title"><div><span>1</span><strong>How should the invitation open?</strong></div><small>Opening effect</small></div>
              <div className="extra-options">
                <div><span>No special opening</span><b>Included</b></div>
                <div><span>Envelope opening with initials on wax seal</span><b>+ Rs 200</b></div>
                <div><span>Curtain opening</span><b>+ Rs 200</b></div>
              </div>
            </div>

            <div className="extra-group">
              <div className="extra-group-title"><div><span>2</span><strong>Choose the main photo area</strong></div><small>The first big area guests see</small></div>
              <div className="extra-options">
                <div><span>Normal photo in the background</span><b>Included</b></div>
                <div><span>Photo guests can interact with, such as scratch to reveal</span><b>+ Rs 200</b></div>
              </div>
            </div>

            <div className="extra-group">
              <div className="extra-group-title"><div><span>3</span><strong>Add more invitation parts</strong></div><small>Rs 200 each</small></div>
              <div className="optional-parts-grid">
                {extraParts.map((part) => <span key={part}><Sparkles aria-hidden="true" /><span>{part}</span><b>+ Rs 200</b></span>)}
              </div>
              <p className="extra-note">Each extra invitation part costs Rs 200. Choose as many as you would like and the total price will be shown.</p>
            </div>

            <div className="extra-group custom-part-group">
              <div className="extra-group-title"><div><span>4</span><strong>Need something that is not listed?</strong></div><b>+ Rs 500</b></div>
              <p>We can add one custom part made specially for your invitation. This is for something that is not already available in the choices above.</p>
              <div className="custom-part-consultation">
                <span>Your custom part will be planned with you during a free video consultation. If you already have something in mind or a design readily available, share it with us.</span>
                <a
                  className="button button-wine"
                  href={customPartWhatsAppLink}
                  aria-disabled={!whatsappNumber}
                  onClick={(event) => !whatsappNumber && event.preventDefault()}
                  target={whatsappNumber ? "_blank" : undefined}
                  rel={whatsappNumber ? "noreferrer" : undefined}
                >
                  Discuss your custom idea <Send aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>
        </div>

        <div className="pricing-service-notes reveal">
          <article className="service-note-card payment-note">
            <CreditCard aria-hidden="true" />
            <div>
              <strong>Pay only after you receive your link</strong>
              <p>We send you the finished invitation link first so you can review it and make sure you are happy. Payment is then made outside the website by MCB Juice or bank transfer. The payment details will be sent to you.</p>
            </div>
          </article>

          <article className="service-note-card delivery-note">
            <Clock3 aria-hidden="true" />
            <div>
              <strong>Ready in around 2–5 days</strong>
              <p>Once all invitation details are final, your invitation link will normally be ready within 2–5 days. You can review the live invitation before making payment.</p>
              <span className="delivery-time">Your satisfaction comes first — payment is requested only after you receive the link.</span>
            </div>
          </article>

          <article className="service-note-card consultation-note" id="consultation">
            <Smartphone aria-hidden="true" />
            <div className="consultation-copy">
              <div className="consultation-title-row"><strong>Free video consultation</strong><span className="free-consultation-badge">Free</span></div>
              <p><b>Having trouble designing your invitation?</b> We can assist you through your choices and help you put the invitation together during a free video consultation.</p>
            </div>
            <div className="consultation-actions">
              <a
                className="button button-wine whatsapp-button"
                href={consultationWhatsAppLink}
                aria-disabled={!whatsappNumber}
                onClick={(event) => !whatsappNumber && event.preventDefault()}
                target={whatsappNumber ? "_blank" : undefined}
                rel={whatsappNumber ? "noreferrer" : undefined}
              >
                <WhatsAppLogo /> Message us on WhatsApp
              </a>
              <div className="consultation-social-row">
                <span>Or message us on</span>
                <div className="consultation-socials" aria-label="Contact Paperless Invites on social media">
                  <SocialIconLink href={socialLinks.instagram} label="Instagram"><InstagramLogo /></SocialIconLink>
                  <SocialIconLink href={socialLinks.facebook} label="Facebook"><FacebookLogo /></SocialIconLink>
                  <SocialIconLink href={socialLinks.tiktok} label="TikTok"><TikTokLogo /></SocialIconLink>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="pricing-action reveal">
          <p><strong>Ready to start?</strong> Choose your options and build the invitation you want.</p>
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
            <a href="#collection">Invitation examples</a>
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

function SocialIconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href) return <span className="social-button" title={label} aria-label={label}>{children}</span>;
  return <a className="social-button" href={href} title={label} aria-label={label} target="_blank" rel="noreferrer">{children}</a>;
}

function WhatsAppLogo() {
  return (
    <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.03 2a9.73 9.73 0 0 0-8.39 14.65L2.3 21.55l5.02-1.32A9.75 9.75 0 1 0 12.03 2Zm0 17.72a8 8 0 0 1-4.08-1.12l-.29-.17-2.98.78.8-2.91-.19-.3a8.01 8.01 0 1 1 6.74 3.72Zm4.38-5.98c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg className="brand-icon brand-facebook" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M13.8 21v-8h2.8l.42-3.15H13.8V7.84c0-.91.26-1.53 1.62-1.53h1.73V3.5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.53-4.22 4.34v2.14H7.57V13h2.83v8h3.4Z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg className="brand-icon brand-instagram" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.55" cy="6.65" r="1" fill="currentColor" />
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg className="brand-icon brand-tiktok" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M14.15 3.1c.18 1.63 1.1 3.03 2.49 3.79a5.7 5.7 0 0 0 2.38.66v3.03a8.47 8.47 0 0 1-4.87-1.55v6.2a5.32 5.32 0 1 1-4.58-5.27v3.08a2.28 2.28 0 1 0 1.55 2.16V3.1h3.03Z" />
    </svg>
  );
}