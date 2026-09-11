"use client";

import { useEffect } from "react";

const footerSocialLinks: Record<string, string> = {
  Facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/",
  Instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
  TikTok: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://www.tiktok.com/",
};

export function FooterSocialLinkFix() {
  useEffect(() => {
    const socialIcons = Array.from(
      document.querySelectorAll<HTMLElement>(".refreshed-footer .footer-socials-new > span[title]"),
    );

    const cleanup: Array<() => void> = [];

    socialIcons.forEach((icon) => {
      const label = icon.getAttribute("title") || "";
      const href = footerSocialLinks[label];
      if (!href) return;

      icon.setAttribute("role", "link");
      icon.setAttribute("tabindex", "0");
      icon.setAttribute("aria-label", `Open Paperless Invites on ${label}`);
      icon.style.cursor = "pointer";

      const openLink = () => {
        window.open(href, "_blank", "noopener,noreferrer");
      };

      const handleClick = () => openLink();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLink();
        }
      };

      icon.addEventListener("click", handleClick);
      icon.addEventListener("keydown", handleKeyDown);

      cleanup.push(() => {
        icon.removeEventListener("click", handleClick);
        icon.removeEventListener("keydown", handleKeyDown);
      });
    });

    return () => cleanup.forEach((dispose) => dispose());
  }, []);

  return null;
}
