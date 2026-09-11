"use client";

import { useEffect } from "react";

type MovingAsset = { image: string; opening?: boolean };

const firstRow: MovingAsset[] = [
  { image: "/images/builder-hero-beige.webp" },
  { image: "/images/builder-hero-olive.webp" },
  { image: "/images/builder-hero-dusty-blue.webp" },
  { image: "/images/builder-hero-burgundy.webp" },
  { image: "/images/builder-hero-pink.webp" },
  { image: "/images/builder-hero-lilac.webp" },
  { image: "/images/builder-interactive-henna-hands.webp" },
  { image: "/images/builder-interactive-orchid-bouquet.webp" },
  { image: "/images/builder-interactive-island-walk.webp" },
  { image: "/images/builder-hero-ballroom-beige.webp" },
  { image: "/images/builder-hero-ballroom-olive.webp" },
  { image: "/images/builder-hero-ballroom-dusty-blue.webp" },
  { image: "/images/builder-envelope-botanical-beige.webp", opening: true },
  { image: "/images/builder-envelope-classic-olive.webp", opening: true },
  { image: "/images/builder-curtain-classic-burgundy.webp", opening: true },
  { image: "/images/builder-curtain-botanical-dusty-blue.webp", opening: true },
];

const secondRow: MovingAsset[] = [
  { image: "/images/builder-hero-ballroom-burgundy.webp" },
  { image: "/images/builder-hero-ballroom-pink.webp" },
  { image: "/images/builder-hero-ballroom-lilac.webp" },
  { image: "/images/builder-hero-garden-beige.webp" },
  { image: "/images/builder-hero-garden-olive.webp" },
  { image: "/images/builder-hero-garden-dusty-blue.webp" },
  { image: "/images/builder-hero-garden-burgundy.webp" },
  { image: "/images/builder-hero-garden-pink.webp" },
  { image: "/images/builder-hero-garden-lilac.webp" },
  { image: "/images/builder-hero-islamic-hall-beige.webp" },
  { image: "/images/builder-hero-islamic-hall-olive.webp" },
  { image: "/images/builder-hero-islamic-hall-dusty-blue.webp" },
  { image: "/images/builder-envelope-classic-burgundy.webp", opening: true },
  { image: "/images/builder-envelope-botanical-pink.webp", opening: true },
  { image: "/images/builder-curtain-classic-olive.webp", opening: true },
  { image: "/images/builder-curtain-botanical-lilac.webp", opening: true },
];

const wordingUpdates: Record<string, string> = {
  "Countdown to the big day": "Countdown",
  "Order of Events / Our Journey": "Our Timeline",
  "Event Details & Location": "Event Details + Location",
  "Gift Preferences": "Important Notes",
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

export function LandingMainPolish() {
  useEffect(() => {
    const landing = document.querySelector(".landing-refresh");
    if (!landing) return;

    populateTrack(".landing-refresh .row-one .marquee-track", firstRow);
    populateTrack(".landing-refresh .row-two .marquee-track", secondRow, true);
    replaceText(landing);

    const customButton = document.querySelector<HTMLAnchorElement>(".landing-refresh .custom-part-consultation a");
    if (customButton) {
      customButton.classList.add("whatsapp-button");
      customButton.innerHTML = `${whatsappIcon()}<span>Message us on WhatsApp</span>`;
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
  }, []);

  return null;
}
