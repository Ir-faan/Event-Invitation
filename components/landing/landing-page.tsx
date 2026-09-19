import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import type { InvitationExampleCard } from "@/lib/invitation-examples";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { CustomizationSection } from "@/components/landing/customization-section";
import { ExamplesSection } from "@/components/landing/examples-section";
import { FaqSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingInteractions } from "@/components/landing/landing-interactions";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProcessSection } from "@/components/landing/process-section";

export function LandingPage({ exampleCards }: { exampleCards: InvitationExampleCard[] }) {
  return (
    <main id="top" className="landing-page">
      <LandingInteractions />
      <div className="scroll-progress" aria-hidden="true" />
      <div className="ambient-glow" aria-hidden="true" />
      <div className="falling-sparkles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <span key={index} style={{ "--spark-x": `${(index * 37) % 100}%`, "--spark-delay": `${-(index % 8) * 1.9}s`, "--spark-duration": `${13 + (index % 5) * 2}s` } as React.CSSProperties}>{index % 3 === 0 ? "✦" : "·"}</span>)}
      </div>
      <header className="site-nav">
        <a href="#top" className="brand" aria-label="Paperless Invites home"><span className="brand-seal">PI</span><span>Paperless Invites</span></a>
        <nav aria-label="Main navigation">
          <a href="#collection">Examples</a><a href="#customise">Customise</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
        </nav>
        <Link href="/design-invitation" className="nav-action">Design yours <ArrowRight aria-hidden="true" /></Link>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><Menu aria-hidden="true" /></summary>
          <div><a href="#collection">Examples</a><a href="#customise">Customise</a><a href="#process">How it works</a><a href="#compare">Why digital</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><Link href="/design-invitation">Design yours</Link></div>
        </details>
      </header>
      <HeroSection />
      <ExamplesSection exampleCards={exampleCards} />
      <ComparisonSection />
      <CustomizationSection />
      <ProcessSection />
      <PricingSection />
      <FaqSection basePriceLabel="Rs 1,000" />
      <LandingFooter />
    </main>
  );
}
