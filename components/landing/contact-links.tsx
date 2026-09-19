import type { ReactNode } from "react";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const platformLinks = {
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://www.tiktok.com/",
};
const consultationMessage = "Hi, I would like some help designing my invitation and would like some assistance.";
const customPartMessage = "Hi, I would like to add a custom part to my invitation.";

function whatsappLink(message: string) {
  return whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : undefined;
}

export function getLandingContactLinks() {
  const consultationWhatsApp = whatsappLink(consultationMessage) ?? "https://www.whatsapp.com/";
  return {
    consultationWhatsApp,
    customPartWhatsApp: whatsappLink(customPartMessage) ?? consultationWhatsApp,
    ...platformLinks,
  };
}

export function SocialIconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return <a className="social-button" href={href} title={label} aria-label={`Message Paperless Invites on ${label}`} target="_blank" rel="noreferrer">{children}</a>;
}

export function WhatsAppLogo() {
  return <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.03 2a9.73 9.73 0 0 0-8.39 14.65L2.3 21.55l5.02-1.32A9.75 9.75 0 1 0 12.03 2Zm0 17.72a8 8 0 0 1-4.08-1.12l-.29-.17-2.98.78.8-2.91-.19-.3a8.01 8.01 0 1 1 6.74 3.72Zm4.38-5.98c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
}
export function FacebookLogo() {
  return <svg className="brand-icon brand-facebook" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.8 21v-8h2.8l.42-3.15H13.8V7.84c0-.91.26-1.53 1.62-1.53h1.73V3.5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.53-4.22 4.34v2.14H7.57V13h2.83v8h3.4Z" /></svg>;
}
export function InstagramLogo() {
  return <svg className="brand-icon brand-instagram" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" /><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.9" /><circle cx="17.55" cy="6.65" r="1" fill="currentColor" /></svg>;
}
export function TikTokLogo() {
  return <svg className="brand-icon brand-tiktok" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.15 3.1c.18 1.63 1.1 3.03 2.49 3.79a5.7 5.7 0 0 0 2.38.66v3.03a8.47 8.47 0 0 1-4.87-1.55v6.2a5.32 5.32 0 1 1-4.58-5.27v3.08a2.28 2.28 0 1 0 1.55 2.16V3.1h3.03Z" /></svg>;
}
