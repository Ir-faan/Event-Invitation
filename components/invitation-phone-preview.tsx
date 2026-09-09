"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Gift,
  Heart,
  Image as ImageIcon,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  getEventDetails,
  getHeroImage,
  getPalette,
  openingAssets,
  type InvitationConfig,
  type InvitationSection,
} from "@/lib/invitation-designer";

type PreviewProps = {
  config: InvitationConfig;
  replayKey: number;
  onReplay: () => void;
};

export function InvitationPhonePreview({ config, replayKey, onReplay }: PreviewProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const palette = getPalette(config.palette);
  const themeStyle = {
    "--preview-bg": palette.theme.background,
    "--preview-surface": palette.theme.surface,
    "--preview-primary": palette.theme.primary,
    "--preview-secondary": palette.theme.secondary,
    "--preview-accent": palette.theme.accent,
    "--preview-ink": palette.theme.ink,
    "--preview-muted": palette.theme.muted,
  } as React.CSSProperties;

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [replayKey]);

  return (
    <aside className="designer-preview-panel" aria-label="Live mobile invitation preview">
      <div className="designer-preview-heading">
        <div>
          <span className="designer-live-dot" />
          <strong>Live mobile preview</strong>
          <small>Updates as you type</small>
        </div>
        <button type="button" onClick={onReplay} disabled={config.opening.type === "none"}>
          <RotateCcw aria-hidden="true" /> Preview opening
        </button>
      </div>

      <div className="designer-phone-shell" style={themeStyle}>
        <div className="designer-phone-top" aria-hidden="true"><span /></div>
        <div className="designer-phone-screen" ref={screenRef}>
          <OpeningPreview config={config} replayKey={replayKey} />
          <HeroPreview config={config} replayKey={replayKey} />
          {config.sections.map((section) => (
            <SectionPreview key={section.id} section={section} config={config} />
          ))}
          <footer className="invite-preview-footer">
            <Sparkles aria-hidden="true" />
            <strong>{config.hero.firstName} &amp; {config.hero.secondName}</strong>
            <span>Made with Paperless Invites</span>
          </footer>
        </div>
        <div className="designer-phone-home" aria-hidden="true" />
      </div>
      <p className="designer-preview-tip">Scroll inside the phone to review every part.</p>
    </aside>
  );
}

function OpeningPreview({ config, replayKey }: { config: InvitationConfig; replayKey: number }) {
  if (config.opening.type === "none") return null;
  const palette = getPalette(config.palette);

  if (config.opening.type === "envelope") {
    const asset = openingAssets.envelope.find((item) => item.id === config.opening.asset) ?? openingAssets.envelope[0];
    return (
      <div className="preview-opening preview-opening-envelope" key={`envelope-${replayKey}`} style={{ "--opening-tint": palette.theme.primary } as React.CSSProperties}>
        <div className="preview-opening-copy"><span>Tap to open</span></div>
        <div className="preview-envelope-art">
          <img src={asset.url} alt="" />
          <span className="preview-wax-initials">{config.opening.initials || "♥"}</span>
        </div>
      </div>
    );
  }

  const asset = openingAssets.curtain.find((item) => item.id === config.opening.asset) ?? openingAssets.curtain[0];
  return (
    <div className="preview-opening preview-opening-curtain" key={`curtain-${replayKey}`} style={{ "--curtain-image": `url(${asset.url})`, "--opening-tint": palette.theme.primary } as React.CSSProperties}>
      <div className="preview-curtain-half preview-curtain-left" />
      <div className="preview-curtain-half preview-curtain-right" />
      <span>Our story begins</span>
    </div>
  );
}

function HeroPreview({ config, replayKey }: { config: InvitationConfig; replayKey: number }) {
  const image = getHeroImage(config);
  const details = getEventDetails(config);
  const formattedDate = formatDate(details.fields.date);

  return (
    <section className={`invite-preview-hero ${config.hero.type === "interactive" ? "is-interactive" : ""}`}>
      <img className="invite-preview-hero-image" src={image} alt="Selected wedding background" />
      <div className="invite-preview-hero-shade" />
      <div className="invite-preview-hero-copy">
        <span>{config.hero.eyebrow}</span>
        <h2>{config.hero.firstName}<i>&amp;</i>{config.hero.secondName}</h2>
        <p>{config.hero.message}</p>
        <time>{formattedDate}</time>
      </div>
      {config.hero.type === "interactive" && <ScratchPhoto key={`${image}-${replayKey}`} color={getPalette(config.palette).theme.primary} />}
    </section>
  );
}

function ScratchPhoto({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const moveCountRef = useRef(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawCover = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = color;
      context.fillRect(0, 0, bounds.width, bounds.height);
      const glow = context.createRadialGradient(bounds.width * .5, bounds.height * .42, 10, bounds.width * .5, bounds.height * .42, bounds.width * .7);
      glow.addColorStop(0, "rgba(255,255,255,.28)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, bounds.width, bounds.height);
      context.fillStyle = "rgba(255,255,255,.94)";
      context.textAlign = "center";
      context.font = "italic 29px Georgia, serif";
      context.fillText("Scratch to reveal", bounds.width / 2, bounds.height / 2 - 4);
      context.font = "600 10px Arial, sans-serif";
      context.letterSpacing = "2px";
      context.fillText("MOVE YOUR FINGER OVER THE PHOTO", bounds.width / 2, bounds.height / 2 + 23);
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
    lastPointRef.current = pointFromEvent(event);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || complete) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    const previous = lastPointRef.current;
    const next = pointFromEvent(event);
    if (!context || !previous) return;
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = 44;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    context.restore();
    lastPointRef.current = next;
    moveCountRef.current += 1;
    if (moveCountRef.current % 8 === 0) checkProgress(canvas);
  }

  function end(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    lastPointRef.current = null;
    checkProgress(event.currentTarget);
  }

  function checkProgress(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let checked = 0;
    for (let index = 3; index < pixels.length; index += 80) {
      checked += 1;
      if (pixels[index] < 30) transparent += 1;
    }
    if (checked > 0 && transparent / checked >= .5) setComplete(true);
  }

  return (
    <div className={`scratch-preview ${complete ? "is-complete" : ""}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Scratch the photo to preview the interactive reveal"
      />
      <button type="button" onClick={() => setComplete(true)}>Reveal for preview</button>
      {complete && <div className="scratch-complete-sparkles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index}>✦</i>)}</div>}
    </div>
  );
}

function SectionPreview({ section, config }: { section: InvitationSection; config: InvitationConfig }) {
  switch (section.type) {
    case "countdown":
      return <CountdownPreview section={section} config={config} />;
    case "journey":
      return (
        <PreviewSection section={section} className="preview-journey">
          <div className="journey-line" aria-hidden="true" />
          {[1, 2].map((index) => (
            <article key={index}>
              <time>{section.fields[`event${index}Date`]}</time>
              <h4>{section.fields[`event${index}Title`]}</h4>
              <p>{section.fields[`event${index}Text`]}</p>
            </article>
          ))}
        </PreviewSection>
      );
    case "event-details": {
      const mapLink = section.fields.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${section.fields.venue} ${section.fields.address}`)}`;
      return (
        <PreviewSection section={section} className="preview-details">
          <div className="preview-detail-row"><CalendarDays aria-hidden="true" /><span><small>Date</small><strong>{formatDate(section.fields.date)}</strong></span></div>
          <div className="preview-detail-row"><Clock3 aria-hidden="true" /><span><small>Time</small><strong>{formatTime(section.fields.time)}</strong></span></div>
          <div className="preview-map-card">
            <MapPin aria-hidden="true" />
            <strong>{section.fields.venue}</strong>
            <span>{section.fields.address}</span>
            <a href={mapLink} target="_blank" rel="noreferrer"><Navigation aria-hidden="true" /> Open map</a>
          </div>
        </PreviewSection>
      );
    }
    case "gift":
      return <PreviewSection section={section} className="preview-gift"><Gift aria-hidden="true" /><p>{section.fields.message}</p></PreviewSection>;
    case "special-message":
      return <PreviewSection section={section} className="preview-message"><Heart aria-hidden="true" /><span>{section.fields.recipient}</span><p>{section.fields.message}</p></PreviewSection>;
    case "seating":
      return <PreviewSection section={section} className="preview-seating"><div className="preview-table-grid">{splitLines(section.fields.tables).map((table, index) => <span key={`${table}-${index}`}>{table}</span>)}</div></PreviewSection>;
    case "day-programme":
      return <PreviewSection section={section} className="preview-programme"><div>{splitLines(section.fields.items).map((item, index) => { const [time, label] = item.split("|"); return <article key={`${item}-${index}`}><time>{time}</time><span>{label || time}</span></article>; })}</div></PreviewSection>;
    case "glimpse":
      return (
        <PreviewSection section={section} className="preview-glimpse">
          <p>{section.fields.message}</p>
          <div className="preview-gallery">
            {section.images.length ? section.images.slice(0, 6).map((image, index) => <img key={`${image}-${index}`} src={image} alt="Uploaded couple preview" />) : Array.from({ length: 3 }, (_, index) => <span key={index}><ImageIcon aria-hidden="true" /><small>Your photo</small></span>)}
          </div>
        </PreviewSection>
      );
    case "custom":
      return <PreviewSection section={section} className="preview-custom"><Sparkles aria-hidden="true" /><p>{section.fields.message}</p><small>We will plan this part with you.</small></PreviewSection>;
  }
}

function PreviewSection({ section, className, children }: { section: InvitationSection; className?: string; children: React.ReactNode }) {
  return (
    <section className={`invite-preview-section ${className ?? ""}`}>
      <span className="preview-section-mark">✦</span>
      <h3>{section.title}</h3>
      {children}
    </section>
  );
}

function CountdownPreview({ section, config }: { section: InvitationSection; config: InvitationConfig }) {
  const details = useMemo(() => getEventDetails(config), [config]);
  const [days, setDays] = useState(0);
  useEffect(() => {
    const target = new Date(`${details.fields.date || ""}T${details.fields.time || "00:00"}`).getTime();
    setDays(Number.isFinite(target) ? Math.max(0, Math.ceil((target - Date.now()) / 86_400_000)) : 0);
  }, [details.fields.date, details.fields.time]);

  return (
    <PreviewSection section={section} className="preview-countdown">
      <div className="preview-countdown-number"><strong>{days}</strong><span>days</span></div>
      <p>{section.fields.message}</p>
    </PreviewSection>
  );
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

function formatTime(value = "") {
  if (!value) return "Choose a time";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date(2020, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" }).format(date);
}
