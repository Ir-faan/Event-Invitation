import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FacebookLogo, getLandingContactLinks, InstagramLogo, SocialIconLink, TikTokLogo, WhatsAppLogo } from "@/components/landing/contact-links";
export function LandingFooter() {
  const links = getLandingContactLinks();
  return (<footer className="site-footer landing-footer">
        <div className="footer-shell">
          <div className="footer-brand-block">
            <a href="#top" className="footer-logo"><span className="brand-seal">PI</span><span>Paperless Invites</span></a>
            <h2>Your celebration.<br /><em>Your invitation.</em></h2>
            <p>Elegant digital invitations you can shape around your own colours, photos and story.</p>
            <Link className="footer-design-button" href="/design-invitation">Design yours <ArrowRight aria-hidden="true" /></Link>
          </div>

          <div className="footer-column">
            <span className="footer-column-title">Explore</span>
            <a href="#collection">Invitation examples</a>
            <a href="#customise">Customise yours</a>
            <a href="#process">How it works</a>
            <a href="#compare">Why digital</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="footer-column footer-start-column">
            <span className="footer-column-title">Start creating</span>
            <Link href="/design-invitation">Design your own invitation</Link>
            <div className="footer-socials" aria-label="Contact Paperless Invites">
              <SocialIconLink href={links.consultationWhatsApp} label="WhatsApp"><WhatsAppLogo /></SocialIconLink>
              <SocialIconLink href={links.facebook} label="Facebook"><FacebookLogo /></SocialIconLink>
              <SocialIconLink href={links.instagram} label="Instagram"><InstagramLogo /></SocialIconLink>
              <SocialIconLink href={links.tiktok} label="TikTok"><TikTokLogo /></SocialIconLink>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <span>© {new Date().getFullYear()} Paperless Invites · Mauritius</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>);
}
