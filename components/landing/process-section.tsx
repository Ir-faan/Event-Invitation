import { CreditCard, Eye, Palette, Send } from "lucide-react";
const designProcess = [
  { icon: Palette, number: "01", title: "Design the invitation", copy: "Choose your colours, opening, main photo and the invitation parts you want." },
  { icon: Eye, number: "02", title: "Review the design", copy: "See your choices in the live mobile preview, then review the finished invitation link." },
  { icon: CreditCard, number: "03", title: "Payment", copy: "Pay after you receive your invitation link and are happy with the result." },
  { icon: Send, number: "04", title: "Share in a tap", copy: "Send one elegant link to family and guests on the apps you already use." },
];
export function ProcessSection() { return (<section className="process section" id="process" aria-labelledby="process-title">
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
      </section>); }
