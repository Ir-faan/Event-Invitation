import Link from "next/link";
import { ArrowDownRight, ArrowRight, Sparkles } from "lucide-react";

const firstRow = [
  { image: "/invitation/heroes/signature/beige.webp", label: "Warm beige hero", type: "photo" },
  { image: "/invitation/heroes/ballroom/olive.webp", label: "Olive ballroom hero", type: "photo" },
  { image: "/invitation/heroes/garden/dusty-blue.webp", label: "Dusty blue garden hero", type: "photo" },
  { image: "/invitation/heroes/islamic-hall/burgundy.webp", label: "Burgundy wedding hall hero", type: "photo" },
  { image: "/invitation/heroes/interactive/henna-hands.webp", label: "Scratch reveal — henna hands", type: "photo" },
  { image: "/invitation/heroes/interactive/orchid-bouquet.webp", label: "Scratch reveal — orchid bouquet", type: "photo" },
  { image: "/invitation/heroes/interactive/island-walk.webp", label: "Scratch reveal — island walk", type: "photo" },
  { image: "/invitation/heroes/interactive/bouquet.webp", label: "Scratch reveal — bridal bouquet", type: "photo" },
  { image: "/invitation/openings/envelopes/botanical/beige.webp", label: "Botanical envelope opening", type: "opening" },
  { image: "/invitation/openings/curtains/classic/burgundy.webp", label: "Burgundy curtain reveal", type: "opening" },
];
const secondRow = [
  { image: "/invitation/heroes/interactive/garden-walk.webp", label: "Scratch reveal — garden walk", type: "photo" },
  { image: "/invitation/heroes/interactive/hands.webp", label: "Scratch reveal — couple hands", type: "photo" },
  { image: "/templates/coastal-reverie/coastal-reverie.webp", label: "Coastal wedding invitation", type: "photo" },
  { image: "/templates/rose-afterglow/moonlit-bloom.webp", label: "Moonlit wedding invitation", type: "photo" },
  { image: "/templates/rose-afterglow/rose-afterglow.webp", label: "Rose wedding invitation", type: "photo" },
  { image: "/templates/rose-afterglow/couple-hands.webp", label: "Couple hands invitation", type: "photo" },
  { image: "/templates/rose-afterglow/scratch/hero-olive.webp", label: "Olive scratch invitation", type: "photo" },
  { image: "/invitation/openings/envelopes/classic/olive.webp", label: "Olive envelope opening", type: "opening" },
  { image: "/invitation/openings/curtains/botanical/dusty-blue.webp", label: "Dusty blue curtain reveal", type: "opening" },
];

export function HeroSection() {
  return (<section className="hero landing-hero" aria-labelledby="hero-title">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><Sparkles aria-hidden="true" /> Welcome to Paperless Invites</p>
          <h1 id="hero-title">The most elegant <em>save the date.</em></h1>
          <p>Beautiful digital invitations for weddings and special days. Choose the details you love, preview them live and share your finished invitation in a tap.</p>
          <div className="hero-actions">
            <Link className="button button-wine" href="/design-invitation">Design your invitation <ArrowRight aria-hidden="true" /></Link>
            <a className="text-link" href="#collection">See what you can create <ArrowDownRight aria-hidden="true" /></a>
          </div>
        </div>

        <div className="showcase landing-showcase" id="gallery" aria-label="Moving examples of invitation photos, envelopes and curtains">
          <div className="marquee-row row-one">
            <div className="marquee-track">
              {[...firstRow, ...firstRow].map((card, index) => <MovingCard key={`a-${index}`} card={card} />)}
            </div>
          </div>
          <div className="marquee-row row-two" aria-hidden="true">
            <div className="marquee-track reverse">
              {[...secondRow, ...secondRow].map((card, index) => <MovingCard key={`b-${index}`} card={card} small />)}
            </div>
          </div>
          <div className="spotlight-phone" aria-hidden="true">
            <div className="phone-speaker" />
            <img src="/invitation/heroes/signature/beige.webp" alt="" fetchPriority="high" />
            <div className="phone-copy"><span>PAPERLESS INVITES</span><strong>Your story<br />begins here</strong><i>Save the date</i></div>
          </div>
        </div>
      </section>);
}
function MovingCard({ card, small = false }: { card: { image: string; label: string; type: string }; small?: boolean }) {
  return <figure className={`showcase-card moving-image-card ${card.type === "opening" ? "opening-card" : ""} ${small ? "small" : ""}`}><img src={card.image} alt="" loading="lazy" decoding="async" /><figcaption>{card.type === "opening" ? "OPENING STYLE" : card.label.includes("Scratch") ? "SCRATCH TO REVEAL" : "HERO PHOTO"}</figcaption></figure>;
}
