"use client";

import { useEffect } from "react";

export function LandingInteractions() {
  useEffect(() => {
    const landing = document.querySelector(".landing-page");
    if (!landing) return;

    const reveals = landing.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 },
    );
    reveals.forEach((element) => observer.observe(element));

    const handleScroll = () => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll-progress", `${maximum > 0 ? window.scrollY / maximum : 0}`);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const mobileMenu = landing.querySelector<HTMLDetailsElement>(".mobile-menu");
    const closeMenuOutside = (event: PointerEvent) => {
      if (mobileMenu?.open && event.target instanceof Node && !mobileMenu.contains(event.target)) {
        mobileMenu.removeAttribute("open");
      }
    };
    const closeMenuFromLink = () => mobileMenu?.removeAttribute("open");
    document.addEventListener("pointerdown", closeMenuOutside);
    mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenuFromLink));

    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cardCleanups = supportsHover && !reduceMotion
      ? Array.from(landing.querySelectorAll<HTMLElement>(".collection-card")).map((card) => {
          const handlePointerMove = (event: PointerEvent) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty("--card-tilt-x", `${(-y * 7).toFixed(2)}deg`);
            card.style.setProperty("--card-tilt-y", `${(x * 7).toFixed(2)}deg`);
            card.style.setProperty("--card-tilt-lift", "-4px");
          };
          const resetTilt = () => {
            card.style.setProperty("--card-tilt-x", "0deg");
            card.style.setProperty("--card-tilt-y", "0deg");
            card.style.setProperty("--card-tilt-lift", "0px");
          };
          card.addEventListener("pointermove", handlePointerMove);
          card.addEventListener("pointerleave", resetTilt);
          return () => {
            card.removeEventListener("pointermove", handlePointerMove);
            card.removeEventListener("pointerleave", resetTilt);
          };
        })
      : [];

    const faqLinks = Array.from(landing.querySelectorAll<HTMLAnchorElement>('a[href="#faq"]'));
    const handleFaqNavigation = (event: MouseEvent) => {
      const faq = document.getElementById("faq");
      if (!faq) return;
      event.preventDefault();
      mobileMenu?.removeAttribute("open");
      window.history.replaceState(null, "", "#faq");
      faq.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    };
    faqLinks.forEach((link) => link.addEventListener("click", handleFaqNavigation));

    if (window.location.hash === "#faq") {
      window.requestAnimationFrame(() => document.getElementById("faq")?.scrollIntoView({ block: "start" }));
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("pointerdown", closeMenuOutside);
      mobileMenu?.querySelectorAll("a").forEach((link) => link.removeEventListener("click", closeMenuFromLink));
      faqLinks.forEach((link) => link.removeEventListener("click", handleFaqNavigation));
      cardCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
