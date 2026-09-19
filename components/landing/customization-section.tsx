import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, Gem, Heart, Layers3, Palette } from "lucide-react";
export function CustomizationSection() { return (<>
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
          <Link className="button button-wine" href="/design-invitation">Start designing yours <ArrowRight aria-hidden="true" /></Link>
        </div>

        <div className="customizer-demo reveal" aria-label="Preview of the invitation creation page">
          <div className="customizer-browser-bar" aria-hidden="true">
            <span /><span /><span />
            <strong>Paperless Invites · Invitation Designer</strong>
          </div>
          <div className="customizer-live-badge"><span className="live-dot" /> Live preview while you design</div>
          <div className="customizer-frame"><Image
  src="/landing/designer-preview.webp"
  alt="Preview of the Paperless Invites invitation designer"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: "cover" }}
  unoptimized
/>
          
          </div>
          <p>This is the same creation page you will use to design your invitation.</p>
        </div>
        <Link className="button button-wine mobile-customizer-cta" href="/design-invitation">Start designing yours <ArrowRight aria-hidden="true" /></Link>
      </section>
<section className="envelope-section" aria-labelledby="envelope-title">
        <div className="envelope-visual reveal">
          <div className="envelope-halo" aria-hidden="true" />
          <img src="/landing/envelope-demo.webp" alt="Ivory digital envelope with a burgundy wax seal" loading="lazy" decoding="async" />
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
</>); }
