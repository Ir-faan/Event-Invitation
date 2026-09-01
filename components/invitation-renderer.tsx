import type { CSSProperties } from "react";
import { Clock3, MapPin } from "lucide-react";
import {
  formatEventDate,
  formatEventTime,
  type InvitationContent,
  type TemplateDefinition,
} from "@/lib/invitations/templates";

interface InvitationRendererProps {
  template: TemplateDefinition;
  content: InvitationContent;
  preview?: boolean;
}

type InvitationStyle = CSSProperties & {
  "--invite-primary": string;
  "--invite-secondary": string;
  "--invite-accent": string;
};

export function InvitationRenderer({ template, content, preview = false }: InvitationRendererProps) {
  const style: InvitationStyle = {
    "--invite-primary": content.primaryColor,
    "--invite-secondary": content.secondaryColor,
    "--invite-accent": content.accentColor,
  };

  return (
    <article className={`invitation invitation-${template.slug}${preview ? " invitation-preview" : ""}`} style={style}>
      <section className="invitation-cover" style={{ backgroundImage: `url(${template.image})` }}>
        <div className="invitation-cover-shade" />
        <div className="invitation-cover-copy">
          <p>{content.intro}</p>
          <h1><span>{content.personOneName}</span><i>&amp;</i><span>{content.personTwoName}</span></h1>
          <div className="invitation-date-rule" />
          <time dateTime={content.eventDate}>{formatEventDate(content.eventDate)}</time>
        </div>
      </section>
      <section className="invitation-message">
        <p className="invitation-kicker">With love and joy</p>
        <blockquote>{content.message}</blockquote>
        <span className="invitation-ornament">✦</span>
      </section>
      <section className="invitation-details">
        <p className="invitation-kicker">The celebration</p>
        <h2>Join us on our special day</h2>
        <div className="detail-grid">
          <div><Clock3 aria-hidden="true" /><span>Date &amp; time</span><strong>{formatEventDate(content.eventDate)}</strong><p>{formatEventTime(content.eventTime)}</p></div>
          <div><MapPin aria-hidden="true" /><span>Venue</span><strong>{content.venue}</strong><p>{content.address}</p></div>
        </div>
      </section>
      <footer className="invitation-footer">
        <span>{content.personOneName.charAt(0)}</span><i>&amp;</i><span>{content.personTwoName.charAt(0)}</span>
        <p>We cannot wait to celebrate with you.</p>
      </footer>
    </article>
  );
}
