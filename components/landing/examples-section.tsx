import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import type { InvitationExampleCard } from "@/lib/invitation-examples";
import { landingPalettePreviews } from "@/components/landing/landing-data";

export function ExamplesSection({ exampleCards }: { exampleCards: InvitationExampleCard[] }) {
  const palettes = landingPalettePreviews;
  return (<section className="collection section" id="collection" aria-labelledby="collection-title">
        <div className="section-heading centered reveal">
          <p className="eyebrow">✦ Invitation inspiration</p>
          <h2 id="collection-title">Start with an idea.<br /><em>Then make it your own.</em></h2>
          <p>These examples show a few designs you can create. Your final invitation can mix the colours, opening, photos and parts that suit you.</p>
        </div>
        <div className="collection-grid">
          {exampleCards.map((item, index) => (
            <article className="collection-card reveal" key={item.name} style={{ "--reveal-delay": `${index * 110}ms` } as React.CSSProperties}>
              <img src={item.thumbnail} alt={`${item.name} invitation for ${item.coupleNames}`} loading="lazy" decoding="async" width="420" height="600" />
              <div className="collection-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="collection-content">
                <span>{item.paletteName} · {item.eventLabel}</span>
                <h3>{item.name}</h3>
                <p>{item.coupleNames}</p>
                <strong>Approx. Rs {item.price.toLocaleString("en-US")}</strong>
              </div>
              <Link target="_blank" rel="noopener noreferrer" href={`/examples/${item.slug}`} aria-label={`Open ${item.name}, an invitation for ${item.coupleNames}`}><span>View example</span><ArrowDownRight aria-hidden="true" /></Link>
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
      </section>);
}
