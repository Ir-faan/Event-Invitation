"use client";

import { useEffect } from "react";

type MovingAsset = { image: string; opening?: boolean };

// Use each distinct photo composition once before the marquee loops. Colour-only
// variations are intentionally avoided so the gallery feels varied rather than repetitive.
const firstRow: MovingAsset[] = [
  { image: "/images/builder-hero-beige.webp" },
  { image: "/images/builder-hero-ballroom-olive.webp" },
  { image: "/images/builder-hero-garden-dusty-blue.webp" },
  { image: "/images/builder-hero-islamic-hall-burgundy.webp" },
  { image: "/images/builder-interactive-henna-hands.webp" },
  { image: "/images/builder-interactive-orchid-bouquet.webp" },
  { image: "/images/builder-interactive-island-walk.webp" },
  { image: "/images/builder-interactive-bouquet.webp" },
  { image: "/images/builder-envelope-botanical-beige.webp", opening: true },
  { image: "/images/builder-curtain-classic-burgundy.webp", opening: true },
];

const secondRow: MovingAsset[] = [
  { image: "/images/builder-interactive-garden-walk.webp" },
  { image: "/images/builder-interactive-hands.webp" },
  { image: "/images/coastal-reverie.webp" },
  { image: "/images/moonlit-bloom.webp" },
  { image: "/images/rose-afterglow.webp" },
  { image: "/images/rose-couple-hands-default.webp" },
  { image: "/images/rose-scratch-hero-olive.webp" },
  { image: "/images/builder-envelope-classic-olive.webp", opening: true },
  { image: "/images/builder-curtain-botanical-dusty-blue.webp", opening: true },
];

const wordingUpdates: Record<string, string> = {
  "Countdown to the big day": "Countdown",
  "Order of Events / Our Journey": "Our Timeline",
  "Event Details & Location": "Event Details + Location",
  "Gift Preferences": "Important Notes",
};

const platformLinks = {
  Instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
  Facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/",
  TikTok: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://www.tiktok.com/",
};

function replaceText(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const value = current.nodeValue?.trim();
    if (value && wordingUpdates[value]) {
      current.nodeValue = current.nodeValue!.replace(value, wordingUpdates[value]);
    }
    current = walker.nextNode();
  }
}

function populateTrack(selector: string, assets: MovingAsset[], small = false) {
  const track = document.querySelector<HTMLElement>(selector);
  if (!track) return;

  const fragment = document.createDocumentFragment();
  [...assets, ...assets].forEach((asset) => {
    const figure = document.createElement("figure");
    figure.className = `showcase-card moving-image-card${asset.opening ? " opening-card" : ""}${small ? " small" : ""}`;

    const image = document.createElement("img");
    image.src = asset.image;
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;

    figure.appendChild(image);
    fragment.appendChild(figure);
  });

  track.replaceChildren(fragment);
}

function whatsappIcon() {
  return `<svg class="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.03 2a9.73 9.73 0 0 0-8.39 14.65L2.3 21.55l5.02-1.32A9.75 9.75 0 1 0 12.03 2Zm0 17.72a8 8 0 0 1-4.08-1.12l-.29-.17-2.98.78.8-2.91-.19-.3a8.01 8.01 0 1 1 6.74 3.72Zm4.38-5.98c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>`;
}

function createSocialAnchor(label: string, href: string, iconHtml: string) {
  const anchor = document.createElement("a");
  anchor.className = "social-button";
  anchor.href = href;
  anchor.title = label;
  anchor.setAttribute("aria-label", `Message Paperless Invites on ${label}`);
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.innerHTML = iconHtml;
  return anchor;
}

function getIconHtml(label: string) {
  const icon = document.querySelector<HTMLElement>(`.landing-refresh .consultation-socials [title="${label}"]`);
  return icon?.innerHTML ?? "";
}

function fillSocialIcons(container: HTMLElement, whatsappHref: string, iconHtml: Record<string, string>) {
  const links = [
    ["WhatsApp", whatsappHref, whatsappIcon()],
    ["Instagram", platformLinks.Instagram, iconHtml.Instagram],
    ["Facebook", platformLinks.Facebook, iconHtml.Facebook],
    ["TikTok", platformLinks.TikTok, iconHtml.TikTok],
  ] as const;

  const fragment = document.createDocumentFragment();
  links.forEach(([label, href, html]) => {
    if (!html) return;
    fragment.appendChild(createSocialAnchor(label, href, html));
  });
  container.replaceChildren(fragment);
}

export function LandingMainPolish() {
  useEffect(() => {
    const landing = document.querySelector(".landing-refresh");
    if (!landing) return;

    populateTrack(".landing-refresh .row-one .marquee-track", firstRow);
    populateTrack(".landing-refresh .row-two .marquee-track", secondRow, true);
    replaceText(landing);

    const iconHtml = {
      Instagram: getIconHtml("Instagram"),
      Facebook: getIconHtml("Facebook"),
      TikTok: getIconHtml("TikTok"),
    };

    const consultationButton = document.querySelector<HTMLAnchorElement>(".landing-refresh .consultation-actions > a.whatsapp-button");
    const consultationWhatsappHref = consultationButton?.href && !consultationButton.href.endsWith("#")
      ? consultationButton.href
      : "https://www.whatsapp.com/";
    consultationButton?.remove();

    const consultationLabel = document.querySelector<HTMLElement>(".landing-refresh .consultation-social-row > span");
    if (consultationLabel) consultationLabel.textContent = "Message us on:";
    const consultationSocials = document.querySelector<HTMLElement>(".landing-refresh .consultation-socials");
    if (consultationSocials) fillSocialIcons(consultationSocials, consultationWhatsappHref, iconHtml);

    const customButton = document.querySelector<HTMLAnchorElement>(".landing-refresh .custom-part-consultation a");
    const customWhatsappHref = customButton?.href && !customButton.href.endsWith("#")
      ? customButton.href
      : consultationWhatsappHref;
    customButton?.remove();

    const customConsultation = document.querySelector<HTMLElement>(".landing-refresh .custom-part-consultation");
    if (customConsultation && !customConsultation.querySelector(".compact-contact-row")) {
      const row = document.createElement("div");
      row.className = "compact-contact-row";
      const label = document.createElement("span");
      label.textContent = "Message us on:";
      const socials = document.createElement("div");
      socials.className = "consultation-socials";
      fillSocialIcons(socials, customWhatsappHref, iconHtml);
      row.append(label, socials);
      customConsultation.appendChild(row);
    }

    const footerSocials = document.querySelector<HTMLElement>(".landing-refresh .footer-socials-new");
    if (footerSocials) {
      const footerIconHtml = {
        Instagram: footerSocials.querySelector<HTMLElement>('[title="Instagram"]')?.innerHTML || iconHtml.Instagram,
        Facebook: footerSocials.querySelector<HTMLElement>('[title="Facebook"]')?.innerHTML || iconHtml.Facebook,
        TikTok: iconHtml.TikTok || footerSocials.querySelector<HTMLElement>('[title="TikTok"]')?.innerHTML || "♪",
      };
      fillSocialIcons(footerSocials, consultationWhatsappHref, footerIconHtml);
    }

    const startColumn = document.querySelector<HTMLElement>(".landing-refresh .footer-start-column");
    if (startColumn) {
      startColumn.querySelector("p")?.remove();
      const link = startColumn.querySelector<HTMLAnchorElement>('a[href="/design-invitation"]');
      if (link) {
        link.classList.remove("footer-arrow-link");
        link.textContent = "Design your own invitation";
      }
    }

    const existingCustomizerButton = document.querySelector<HTMLAnchorElement>('.landing-refresh .customizer-copy > a[href="/design-invitation"]');
    const customizerDemo = document.querySelector<HTMLElement>(".landing-refresh .customizer-demo");
    if (existingCustomizerButton && customizerDemo && !document.querySelector(".landing-refresh .mobile-customizer-cta")) {
      const mobileButton = existingCustomizerButton.cloneNode(true) as HTMLAnchorElement;
      mobileButton.classList.add("mobile-customizer-cta");
      customizerDemo.insertAdjacentElement("afterend", mobileButton);
    }

    const mobileMenu = document.querySelector<HTMLDetailsElement>(".landing-refresh .mobile-menu");
    const closeMenuOutside = (event: PointerEvent) => {
      if (mobileMenu?.open && event.target instanceof Node && !mobileMenu.contains(event.target)) {
        mobileMenu.removeAttribute("open");
      }
    };
    const closeMenuFromLink = () => mobileMenu?.removeAttribute("open");

    document.addEventListener("pointerdown", closeMenuOutside);
    mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenuFromLink));

    return () => {
      document.removeEventListener("pointerdown", closeMenuOutside);
      mobileMenu?.querySelectorAll("a").forEach((link) => link.removeEventListener("click", closeMenuFromLink));
    };
  }, []);

  return null;
}
