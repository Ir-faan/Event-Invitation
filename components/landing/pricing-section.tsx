import Link from "next/link";
import { ArrowRight, Check, Clock3, CreditCard, Plus, Smartphone, Sparkles } from "lucide-react";
import { landingPalettePreviews } from "@/components/landing/landing-data";
import { FacebookLogo, getLandingContactLinks, InstagramLogo, SocialIconLink, TikTokLogo, WhatsAppLogo } from "@/components/landing/contact-links";
const includedParts = ["Countdown", "Our Timeline", "Event Details + Location", "Important Notes"];
const extraParts = ["A Special Message", "Seating Arrangement", "Day Programme", "Glimpse Of Us"];
export function PricingSection() {
  const links = getLandingContactLinks();
  return (<section className="pricing section" id="pricing" aria-labelledby="pricing-title">
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
                {landingPalettePreviews.map((palette) => (
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
                <span>Your custom part will be planned with you. If you already have something in mind or a design readily available, share it with us.</span>
                <div className="compact-contact-row">
                  <span>Message us on:</span>
                  <div className="consultation-socials" aria-label="Contact Paperless Invites about a custom part">
                    <SocialIconLink href={links.customPartWhatsApp} label="WhatsApp"><WhatsAppLogo /></SocialIconLink>
                    <SocialIconLink href={links.instagram} label="Instagram"><InstagramLogo /></SocialIconLink>
                    <SocialIconLink href={links.facebook} label="Facebook"><FacebookLogo /></SocialIconLink>
                    <SocialIconLink href={links.tiktok} label="TikTok"><TikTokLogo /></SocialIconLink>
                  </div>
                </div>
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
              <div className="consultation-title-row"><strong>Free Assistance</strong><span className="free-consultation-badge">Free</span></div>
              <p><b>Having trouble designing your invitation?</b> We can assist you through your choices and help you put the invitation together.</p>
            </div>
            <div className="consultation-actions">
              <div className="consultation-social-row">
                <span>Message us on:</span>
                <div className="consultation-socials" aria-label="Contact Paperless Invites">
                  <SocialIconLink href={links.consultationWhatsApp} label="WhatsApp"><WhatsAppLogo /></SocialIconLink>
                  <SocialIconLink href={links.instagram} label="Instagram"><InstagramLogo /></SocialIconLink>
                  <SocialIconLink href={links.facebook} label="Facebook"><FacebookLogo /></SocialIconLink>
                  <SocialIconLink href={links.tiktok} label="TikTok"><TikTokLogo /></SocialIconLink>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="pricing-action reveal">
          <p><strong>Ready to start?</strong> Choose your options and build the invitation you want.</p>
          <Link className="button button-wine" href="/design-invitation">Design your invitation <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>);
}
