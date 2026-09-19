import { Check, Clock3, Leaf, Send, Smartphone, Sparkles } from "lucide-react";
export function ComparisonSection() { return (<section className="comparison section landing-comparison" id="compare" aria-labelledby="comparison-title">
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
      </section>); }
