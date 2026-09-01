import Link from "next/link";
import { ArrowRight, Check, Heart, Palette, Smartphone } from "lucide-react";
import { templates } from "@/lib/invitations/templates";

const steps = [
  { number: "01", title: "Choose a design", description: "Begin with an invitation style that feels right for your celebration." },
  { number: "02", title: "Make it yours", description: "Add your names, date, venue, words and chosen colour palette." },
  { number: "03", title: "Submit for publishing", description: "We review your invitation, contact you for payment, then publish your private link." },
];

export default function Home() {
  return (
    <main className="marketing-shell">
      <header className="site-nav">
        <Link href="/" className="brand-mark" aria-label="Event Invitations home">
          <span className="brand-monogram">EI</span><span>Event Invitations</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="#collection">Templates</Link><Link href="#process">How it works</Link><Link href="#pricing">Pricing</Link>
        </nav>
        <Link href="#collection" className="nav-cta">Create yours <ArrowRight aria-hidden="true" /></Link>
      </header>

      <section className="marketing-hero">
        <div className="hero-image" aria-hidden="true" /><div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Invitations for life&apos;s beautiful gatherings</p>
          <h1>Your celebration deserves more than a message.</h1>
          <p className="hero-lead">Create a personal invitation website that brings every name, date, place and heartfelt word together in one elegant link.</p>
          <div className="hero-actions">
            <Link href="#collection" className="button button-light">Browse the collection <ArrowRight aria-hidden="true" /></Link>
            <Link href="/templates/heritage-night" className="button button-glass">Preview an invitation</Link>
          </div>
        </div>
        <div className="hero-note"><span>Designed for mobile</span><span className="hero-note-line" /><span>Made personal</span></div>
      </section>

      <section className="trust-strip" aria-label="Product benefits">
        <div><Smartphone aria-hidden="true" /><span>Beautiful on every screen</span></div>
        <div><Palette aria-hidden="true" /><span>Personal colours and wording</span></div>
        <div><Heart aria-hidden="true" /><span>Created for your celebration</span></div>
      </section>

      <section className="collection-section" id="collection">
        <div className="section-heading">
          <p className="eyebrow dark">The launch collection</p>
          <h2>Three moods. One unforgettable first impression.</h2>
          <p>Each design has its own visual character while keeping your essential event information clear and effortless to read.</p>
        </div>
        <div className="template-grid">
          {templates.map((template, index) => (
            <article className="template-card" key={template.slug}>
              <Link href={`/templates/${template.slug}`} className="template-visual" style={{ backgroundImage: `url(${template.image})` }} aria-label={`Preview ${template.name}`}>
                <span className="template-number">0{index + 1}</span><span className="template-preview">View invitation</span>
              </Link>
              <div className="template-copy">
                <div><p>{template.category}</p><h3>{template.name}</h3><span>{template.description}</span></div>
                <Link href={`/create/${template.slug}`} className="round-link" aria-label={`Customize ${template.name}`}><ArrowRight aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="process-intro">
          <p className="eyebrow">A considered, simple process</p><h2>From your story to a link worth sharing.</h2>
          <p>You personalize the details. We make sure everything is ready before your invitation goes live.</p>
        </div>
        <div className="process-list">
          {steps.map((step) => <article key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></article>)}
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-heading centered">
          <p className="eyebrow dark">Clear and personal</p><h2>Choose the design. Receive a custom quotation.</h2>
          <p>Submit your preferred invitation and requirements. We&apos;ll contact you directly before any payment is required.</p>
        </div>
        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead><tr><th>Design</th><th>Personal wording</th><th>Custom colours</th><th>Private invitation link</th><th>Price</th></tr></thead>
            <tbody>{templates.map((template) => <tr key={template.slug}><th>{template.name}</th><td><Check aria-label="Included" /></td><td><Check aria-label="Included" /></td><td><Check aria-label="Included" /></td><td>Custom quote</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="closing-section">
        <p className="eyebrow">Your date. Your words. Your invitation.</p><h2>Begin with a design you love.</h2>
        <Link href="#collection" className="button button-dark">Explore templates <ArrowRight aria-hidden="true" /></Link>
      </section>
      <footer className="site-footer">
        <div className="brand-mark"><span className="brand-monogram">EI</span><span>Event Invitations</span></div>
        <p>Beautiful digital invitations for weddings, engagements and celebrations.</p><p>© {new Date().getFullYear()} Event Invitations</p>
      </footer>
    </main>
  );
}
