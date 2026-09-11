"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Heart,
  Image as ImageIcon,
  Leaf,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  bismillahAssets,
  getHeroImage,
  getHeroPreset,
  getPalette,
  getSectionItems,
  interactiveFrameAssets,
  openingAssets,
  type InvitationConfig,
  type InvitationSection,
  type InvitationSectionItem,
} from "@/lib/invitation-designer";

type PreviewProps = {
  config: InvitationConfig;
  replayKey: number;
  focusTarget: string;
  focusKey: number;
  onReplay: () => void;
  priceTotal?: number;
};

export function InvitationPhonePreview({ config, replayKey, focusTarget, focusKey, onReplay, priceTotal }: PreviewProps) {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    if (focusTarget === "opening" || focusTarget === "bismillah") {
      screen.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = Array.from(screen.querySelectorAll<HTMLElement>("[data-preview-section]"))
      .find((element) => element.dataset.previewSection === focusTarget);
    if (!target) return;
    const sectionTop = target.offsetTop;
    const sectionBottom = sectionTop + target.offsetHeight;
    const viewportMiddle = screen.scrollTop + (screen.clientHeight / 2);
    if (viewportMiddle >= sectionTop && viewportMiddle <= sectionBottom) return;
    const top = Math.max(0, sectionTop - 12);
    screen.scrollTo({ top, behavior: "smooth" });
  }, [focusTarget, focusKey]);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [replayKey]);

  return (
    <aside className="designer-preview-panel" aria-label="Live mobile invitation preview">
      {typeof priceTotal === "number" && (
        <div className="designer-preview-price" role="status" aria-live="polite">
          <small>Total price</small>
          <strong>Rs {priceTotal.toLocaleString("en-US")}</strong>
        </div>
      )}
      <div className="designer-preview-heading">
        <div>
          <span className="designer-live-dot" />
          <strong>Live mobile preview</strong>
        </div>
        <button type="button" onClick={onReplay} disabled={config.opening.type === "none"}>
          <RotateCcw aria-hidden="true" /> Preview opening
        </button>
      </div>

      <div className="designer-phone-shell" style={getThemeStyle(config)}>
        <div className="designer-phone-top" aria-hidden="true"><span /></div>
        <div className="designer-phone-screen" ref={screenRef}>
          <InvitationPreviewContent config={config} replayKey={replayKey} />
        </div>
        <div className="designer-phone-home" aria-hidden="true" />
      </div>
      <p className="designer-preview-tip">You can also scroll inside the phone at any time.</p>
    </aside>
  );
}

/** The full invitation without the builder's decorative phone frame. */
export function PublishedInvitation({ config }: { config: InvitationConfig }) {
  return (
    <main className="published-invitation" style={getThemeStyle(config)}>
      <div className="designer-phone-screen published-invitation-screen">
        <InvitationPreviewContent config={config} replayKey={0} />
      </div>
    </main>
  );
}

function InvitationPreviewContent({ config, replayKey }: { config: InvitationConfig; replayKey: number }) {
  const footerDate = formatDate(config.hero.date);
  return (
    <>
      <OpeningPreview config={config} replayKey={replayKey} />
      <PreviewAmbience />
      <HeroPreview config={config} replayKey={replayKey} />
      {config.sections.map((section) => <SectionPreview key={section.id} section={section} />)}
      <footer className="invite-preview-footer">
        <div className="invite-preview-footer-monogram">{config.hero.firstName.charAt(0)}<Heart aria-hidden="true" />{config.hero.secondName.charAt(0)}</div>
        <strong>{config.hero.firstName} &amp; {config.hero.secondName}</strong>
        <time>{footerDate}</time>
        <span>Made with <Heart aria-hidden="true" /> by Paperless Invites</span>
      </footer>
    </>
  );
}

function PreviewAmbience() {
  const petals = [
    [7, 8.8, -6], [18, 11.4, -2], [31, 9.6, -8], [44, 13.2, -4], [57, 10.8, -10],
    [68, 12.5, -1], [79, 9.2, -7], [89, 14.1, -5], [25, 15.2, -12], [73, 16.4, -9],
  ];
  return (
    <div className="invite-preview-ambience" aria-hidden="true">
      {petals.map(([left, duration, delay], index) => (
        <span key={index} style={{ "--preview-petal-left": `${left}%`, "--preview-petal-duration": `${duration}s`, "--preview-petal-delay": `${delay}s` } as CSSProperties}>
          {index % 3 === 0 ? "✦" : "❀"}
        </span>
      ))}
    </div>
  );
}

function getThemeStyle(config: InvitationConfig) {
  const palette = getPalette(config.palette);
  return {
    "--preview-bg": palette.theme.background,
    "--preview-surface": palette.theme.surface,
    "--preview-primary": palette.theme.primary,
    "--preview-secondary": palette.theme.secondary,
    "--preview-accent": palette.theme.accent,
    "--preview-ink": palette.theme.ink,
    "--preview-muted": palette.theme.muted,
  } as CSSProperties;
}

function OpeningPreview({ config, replayKey }: { config: InvitationConfig; replayKey: number }) {
  if (config.opening.type === "none") return null;
  const palette = getPalette(config.palette);

  if (config.opening.type === "envelope") {
    const asset = openingAssets.envelope.find((item) => item.id === config.opening.asset) ?? openingAssets.envelope[0];
    return (
      <div className="preview-opening preview-opening-envelope" key={`envelope-${replayKey}`} style={{ "--opening-tint": palette.theme.primary } as CSSProperties}>
        <div className="preview-envelope-panel preview-envelope-left"><img src={asset.urls[config.palette]} alt="" /></div>
        <div className="preview-envelope-panel preview-envelope-right"><img src={asset.urls[config.palette]} alt="" /></div>
        <span className="preview-opening-label">Tap to open</span>
      </div>
    );
  }

  const asset = openingAssets.curtain.find((item) => item.id === config.opening.asset) ?? openingAssets.curtain[0];
  return (
    <div className="preview-opening preview-opening-curtain" key={`curtain-${replayKey}`} style={{ "--curtain-image": `url(${asset.urls[config.palette]})`, "--opening-tint": palette.theme.primary } as CSSProperties}>
      <div className="preview-curtain-half preview-curtain-left" />
      <div className="preview-curtain-half preview-curtain-right" />
      <span>Our story begins</span>
    </div>
  );
}

function HeroPreview({ config, replayKey }: { config: InvitationConfig; replayKey: number }) {
  const image = getHeroImage(config);
  const preset = getHeroPreset(config);
  const formattedDate = formatDate(config.hero.date);
  const imageStyle = config.hero.photoSource === "preset"
    ? { objectPosition: preset.objectPosition, transform: `scale(${preset.zoom})` }
    : undefined;

  if (config.hero.type === "interactive") {
    return <InteractiveHeroPreview key={`${image}-${config.palette}-${replayKey}`} config={config} image={image} imageStyle={imageStyle} formattedDate={formattedDate} />;
  }

  return (
    <section className={`invite-preview-hero ${config.bismillah.enabled ? "has-bismillah" : ""}`} data-preview-section="hero">
      <img className="invite-preview-hero-image" src={image} alt="Selected wedding background" style={imageStyle} />
      <div className="invite-preview-hero-shade" />
      {config.bismillah.enabled && <BismillahArtwork config={config} />}
      <div className="invite-preview-hero-copy">
        <span>{config.hero.eyebrow}</span>
        <h2>{config.hero.firstName}<i>&amp;</i>{config.hero.secondName}</h2>
        <div className="invite-preview-hero-rule"><i /><Heart aria-hidden="true" /><i /></div>
        <p>{config.hero.message}</p>
        <time>{formattedDate}</time>
      </div>
      <span className="invite-preview-scroll-cue">Scroll into our story <i>↓</i></span>
    </section>
  );
}

function BismillahArtwork({ config }: { config: InvitationConfig }) {
  return (
    <div className="invite-preview-bismillah" data-preview-section="bismillah" aria-label="Bismillah ir-Rahman ir-Rahim">
      <img src={bismillahAssets[config.palette]} alt="Bismillah ir-Rahman ir-Rahim" />
    </div>
  );
}

function InteractiveHeroPreview({ config, image, imageStyle, formattedDate }: { config: InvitationConfig; image: string; imageStyle?: CSSProperties; formattedDate: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className={`invite-preview-hero is-interactive ${revealed ? "is-revealed" : ""} ${config.bismillah.enabled ? "has-bismillah" : ""}`} data-preview-section="hero">
      <div className="interactive-hero-glow" aria-hidden="true" />
      {config.bismillah.enabled && <BismillahArtwork config={config} />}
      <div className="interactive-frame-composition">
        <div className="interactive-photo-viewport">
          <img src={image} alt="Selected wedding photo" style={imageStyle} />
          <ScratchPhoto color={getPalette(config.palette).theme.primary} onReveal={() => setRevealed(true)} />
        </div>
        <img className="interactive-ornate-frame" src={interactiveFrameAssets[config.palette]} alt="" />
        {revealed && (
          <div className="scratch-complete-sparkles" aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => (
              <i key={index} style={{ "--spark-angle": `${index * 15}deg`, "--spark-distance": `${4.5 + (index % 5) * .8}rem`, "--spark-delay": `${(index % 4) * 45}ms` } as CSSProperties}>{index % 3 === 0 ? "✦" : "·"}</i>
            ))}
          </div>
        )}
      </div>
      <div className="interactive-hero-copy" aria-live="polite">
        <span>{config.hero.eyebrow}</span>
        <h2>{config.hero.firstName}<i>&amp;</i>{config.hero.secondName}</h2>
        <p className="interactive-hero-message">{config.hero.message}</p>
        <time className="interactive-hero-date">{formattedDate}</time>
      </div>
    </section>
  );
}

function ScratchPhoto({ color, onReveal }: { color: string; onReveal: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const touchedRef = useRef(new Set<string>());
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawCover = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return;
      touchedRef.current.clear();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = .78;
      context.fillStyle = color;
      context.fillRect(0, 0, bounds.width, bounds.height);
      const glow = context.createRadialGradient(bounds.width * .5, bounds.height * .42, 8, bounds.width * .5, bounds.height * .42, bounds.width * .72);
      glow.addColorStop(0, "rgba(255,255,255,.44)");
      glow.addColorStop(1, "rgba(255,255,255,.05)");
      context.fillStyle = glow;
      context.fillRect(0, 0, bounds.width, bounds.height);
      context.globalAlpha = 1;
      context.strokeStyle = "rgba(255,255,255,.18)";
      context.lineWidth = 1;
      for (let y = 10; y < bounds.height; y += 8) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(bounds.width, y);
        context.stroke();
      }
      context.fillStyle = "rgba(255,255,255,.96)";
      context.textAlign = "center";
      context.font = '42px "Birthstone", "Segoe Script", cursive';
      context.fillText("Scratch Me", bounds.width / 2, bounds.height / 2 + 2);
      context.font = "600 8px Montserrat, Arial, sans-serif";
      context.fillText("MOVE YOUR FINGER OVER THE PHOTO", bounds.width / 2, bounds.height / 2 + 28);
    };
    drawCover();
    const observer = new ResizeObserver(drawCover);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [color]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function begin(event: React.PointerEvent<HTMLCanvasElement>) {
    if (complete) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    scratchAt(event);
  }

  function scratchAt(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || complete) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    const bounds = canvas.getBoundingClientRect();
    const point = pointFromEvent(event);
    if (!context || !bounds.width || !bounds.height) return;
    const radius = Math.max(22, Math.min(bounds.width, bounds.height) * .115);
    context.save();
    context.globalCompositeOperation = "destination-out";
    const brush = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    brush.addColorStop(0, "rgba(0,0,0,1)");
    brush.addColorStop(.72, "rgba(0,0,0,.98)");
    brush.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = brush;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const columns = 18;
    const rows = 24;
    const cellX = Math.floor((point.x / bounds.width) * columns);
    const cellY = Math.floor((point.y / bounds.height) * rows);
    const cellRadiusX = Math.max(1, Math.ceil((radius / bounds.width) * columns));
    const cellRadiusY = Math.max(1, Math.ceil((radius / bounds.height) * rows));
    let eligibleCells = 0;
    for (let gx = 0; gx < columns; gx += 1) {
      for (let gy = 0; gy < rows; gy += 1) {
        const normalizedX = ((gx + .5) / columns - .5) * 2;
        const normalizedY = ((gy + .5) / rows - .5) * 2;
        if ((normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1) eligibleCells += 1;
      }
    }
    for (let gx = cellX - cellRadiusX; gx <= cellX + cellRadiusX; gx += 1) {
      for (let gy = cellY - cellRadiusY; gy <= cellY + cellRadiusY; gy += 1) {
        const normalizedX = ((gx + .5) / columns - .5) * 2;
        const normalizedY = ((gy + .5) / rows - .5) * 2;
        const pointX = ((gx + .5) / columns) * bounds.width;
        const pointY = ((gy + .5) / rows) * bounds.height;
        const insideBrush = ((pointX - point.x) ** 2) + ((pointY - point.y) ** 2) <= radius ** 2;
        if (gx >= 0 && gx < columns && gy >= 0 && gy < rows && insideBrush && (normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1) {
          touchedRef.current.add(`${gx}:${gy}`);
        }
      }
    }
    if (eligibleCells && touchedRef.current.size / eligibleCells >= .75) finishReveal();
  }

  function end(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function finishReveal() {
    if (complete) return;
    setComplete(true);
    onReveal();
  }

  return (
    <div className={`scratch-preview ${complete ? "is-complete" : ""}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={begin}
        onPointerMove={scratchAt}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={() => { drawingRef.current = false; }}
        aria-label="Scratch at least 75 percent of the framed photo to reveal the couple names"
      />
    </div>
  );
}

function SectionPreview({ section }: { section: InvitationSection }) {
  const items = getSectionItems(section);
  switch (section.type) {
    case "countdown":
      return <CountdownPreview section={section} />;
    case "journey":
      return (
        <PreviewSection section={section} className="preview-journey" eyebrow={section.fields.introduction}>
          <div className="preview-heart-rule preview-title-rule"><i /><Heart aria-hidden="true" /><i /></div>
          <div className="journey-timeline">
            {items.map((item, index) => (
              <article key={index}>
                <span className="journey-heart"><Heart aria-hidden="true" /></span>
                <time>{item.date}</time>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </PreviewSection>
      );
    case "event-details":
      return (
        <PreviewSection section={section} className="preview-details" eyebrow="Join us" introduction={section.fields.introduction}>
          <div className="preview-event-list">
            {items.map((event, index) => <EventCard event={event} key={index} />)}
          </div>
        </PreviewSection>
      );
    case "gift":
      return (
        <section className="invite-preview-section preview-gift" data-preview-section={section.id}>
          <div className="preview-gift-ornament" aria-hidden="true"><i /><Sparkles /><i /></div>
          <h3>{section.title}</h3>
          <p>{section.fields.message}</p>
        </section>
      );
    case "special-message":
      const hasMessage = Boolean(section.fields.message?.trim());
      const hasDedication = Boolean(
        section.fields.dedicationLabel?.trim()
        || section.fields.recipient?.trim()
        || section.fields.dedicationNote?.trim(),
      );
      return (
        <section className="invite-preview-section preview-message" data-preview-section={section.id}>
          <article className="preview-memory-card">
            <span className="preview-paper-corners" aria-hidden="true"><Leaf /><Leaf /><Leaf /><Leaf /></span>
            {section.fields.eyebrow?.trim() && <span className="preview-section-eyebrow">{section.fields.eyebrow}</span>}
            <h3>{section.title}</h3>
            {hasMessage && <div className="preview-memory-rule"><i /><Leaf aria-hidden="true" /><i /></div>}
            {hasMessage && <p>{section.fields.message}</p>}
            {hasDedication && (
              <div className="preview-memory-dedication">
                {section.fields.dedicationLabel?.trim() && <small>{section.fields.dedicationLabel}</small>}
                {section.fields.recipient?.trim() && <strong>{section.fields.recipient}</strong>}
                {section.fields.dedicationNote?.trim() && <span>{section.fields.dedicationNote}</span>}
              </div>
            )}
            {section.fields.signature?.trim() && <div className="preview-memory-signature">{section.fields.signature}</div>}
          </article>
        </section>
      );
    case "seating":
      return (
        <section className="invite-preview-section preview-seating" data-preview-section={section.id}>
          <div className="preview-seating-heading">
            <span className="preview-section-eyebrow">You&apos;re among family</span>
            <h3>{section.title}</h3>
            <div className="preview-seating-flourish" aria-hidden="true"><i />✦<i /></div>
            <p>{section.fields.introduction}</p>
          </div>
          <div className="preview-table-list" aria-label="Wedding seating arrangement">
            {items.map((table, index) => (
              <article key={index}>
                <div className="preview-table-name"><strong>{table.table}</strong></div>
                <div className="preview-family-list">{splitLines(table.families).map((family, familyIndex) => <span key={familyIndex}>{family}</span>)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    case "day-programme":
      return (
        <PreviewSection section={section} className="preview-programme" eyebrow="Celebrating every moment" introduction={section.fields.introduction}>
          <div className="preview-programme-list">
            {items.map((item, index) => (
              <article key={index}>
                <div className="programme-icon"><Sparkles aria-hidden="true" /></div>
                <time>{formatTime(item.time)}</time>
                <h4>{item.details}</h4>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </PreviewSection>
      );
    case "glimpse":
      return (
        <PreviewSection section={section} className="preview-glimpse" eyebrow="A few favourite memories">
          <p>{section.fields.message}</p>
          <div className={`preview-gallery ${section.images.length ? "has-photos" : ""}`}>
            {section.images.length
              ? section.images.map((image, index) => <figure key={`${image}-${index}`}><img src={image} alt={`Uploaded couple memory ${index + 1}`} /></figure>)
              : Array.from({ length: 5 }, (_, index) => <span key={index}><ImageIcon aria-hidden="true" /><small>Your photo</small></span>)}
          </div>
        </PreviewSection>
      );
    case "custom":
      return <PreviewSection section={section} className="preview-custom"><Sparkles aria-hidden="true" /><p>This custom part will be discussed and designed with you during a video consultation or by message.</p><small>Your final preview will be prepared after we discuss it together.</small></PreviewSection>;
  }
}

function EventCard({ event }: { event: InvitationSectionItem }) {
  const query = `${event.venue ?? ""} ${event.address ?? ""}`.trim();
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(query || "Mauritius")}&output=embed`;
  const directions = event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "Mauritius")}`;
  return (
    <article className="preview-event-card">
      <div className="preview-event-icon"><Sparkles aria-hidden="true" /></div>
      <p>{formatWeekday(event.date)}</p>
      <h4>{event.name || "Celebration"}</h4>
      <div className="preview-event-facts">
        <span><CalendarDays aria-hidden="true" />{formatDate(event.date)}</span>
        <span><Clock3 aria-hidden="true" />{formatTime(event.time)}</span>
        <span><MapPin aria-hidden="true" />{event.venue || "Choose a venue"}<small>{event.address}</small></span>
      </div>
      <div className="preview-map-frame"><iframe src={mapEmbed} title={`Map to ${event.venue || "event"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
      <a href={directions} target="_blank" rel="noreferrer">Open directions <Navigation aria-hidden="true" /></a>
    </article>
  );
}

function PreviewSection({ section, className, eyebrow, introduction, children }: { section: InvitationSection; className?: string; eyebrow?: string; introduction?: string; children: ReactNode }) {
  return (
    <section className={`invite-preview-section ${className ?? ""}`} data-preview-section={section.id}>
      {eyebrow && <span className="preview-section-eyebrow">{eyebrow}</span>}
      <h3>{section.title}</h3>
      {introduction && <p className="preview-section-introduction">{introduction}</p>}
      {children}
    </section>
  );
}

function CountdownPreview({ section }: { section: InvitationSection }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => setCountdown(getCountdownParts(section.fields.date));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [section.fields.date]);

  return (
    <section className="invite-preview-section preview-countdown" data-preview-section={section.id}>
      <span className="preview-garden-portal preview-portal-left" aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></span>
      <span className="preview-garden-portal preview-portal-right" aria-hidden="true"><img src="/images/rose-afterglow.webp" alt="" /></span>
      <span className="preview-section-eyebrow">{section.fields.eyebrow || "You are invited to our big day"}</span>
      <h3>{section.title}</h3>
      <p className="preview-countdown-intro">{section.fields.message}</p>
      <div className="preview-countdown-grid" aria-live="polite">
        {(Object.entries(countdown) as Array<[keyof typeof countdown, number]>).map(([label, value]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
      </div>
      <div className="preview-heart-rule"><i /><Heart aria-hidden="true" /><i /></div>
    </section>
  );
}

function getCountdownParts(dateValue = "", timeValue = "00:00") {
  const target = new Date(`${dateValue || ""}T${timeValue || "00:00"}`).getTime();
  const distance = Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0;
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function splitLines(value = "") {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function formatDate(value = "") {
  if (!value) return "Choose a date";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatWeekday(value = "") {
  if (!value) return "Choose a day";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date);
}

function formatTime(value = "") {
  if (!value) return "Choose a time";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
