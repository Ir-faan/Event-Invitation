"use client";

import { useEffect } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

function getFaqItems(basePrice: string): FaqItem[] {
  return [
    {
      question: "What is Paperless Invites?",
      answer: "Paperless Invites helps you create a digital invitation for your wedding or special day. You choose the colours, invitation parts, pictures and information you want. After you send your design, we check it and prepare the final invitation for you. When it is ready, you receive one link that you can share with your guests.",
    },
    {
      question: "How do I create my invitation?",
      answer: "Press “Design your invitation” to start. Choose your colours, how the invitation opens, the main photo area and the parts you want. Add your names, date, time, location, notes and pictures where needed. Use the phone preview to check how it looks. When you are happy, add your contact details and send the design to us. You do not need design or computer skills.",
    },
    {
      question: "Can I choose how my invitation looks?",
      answer: "Yes. You can choose one of six colour palettes, no opening or an envelope or curtain opening, and a normal or scratch-to-reveal main photo area. You can also choose extra invitation parts and add your own pictures where available. Some choices cost extra, so the price can change as you build your invitation. The designer shows your current total while you make changes.",
    },
    {
      question: "Can I use my own pictures?",
      answer: "Yes. You can upload your own picture for the interactive main photo area. The Glimpse Of Us part also lets you add your own photos. If a part does not need a picture, you will not be asked to add one. Clear, bright pictures usually give the best result. You can see your uploaded pictures in the preview before you send the design.",
    },
    {
      question: "Can I add or remove parts of my invitation?",
      answer: "Your invitation starts with four main parts: Countdown, Our Timeline, Event Details + Location and Important Notes. You can add other parts such as A Special Message (for example, In Loving Memory), Seating Arrangement, Day Programme and Glimpse Of Us. You can remove extra parts that you added before sending your design. Extra parts can increase the price. If you need something that is not listed, you can contact us about a custom part.",
    },
    {
      question: "How much does an invitation cost?",
      answer: `A basic invitation starts at ${basePrice}. The main parts are already included. Extra parts, an envelope or curtain opening, an interactive main photo area, or a custom part can add to the price. The total depends on the options you choose. You will see your current total in the designer before you send it.`,
    },
    {
      question: "Can I see the price before I send my design?",
      answer: "Yes. The designer shows your current price while you create the invitation. When you add or remove a paid option, the total changes. A price summary also shows what is included in the total. Check this amount before you send your design.",
    },
    {
      question: "I sent my invitation design. What happens now?",
      answer: "After you send your design, we receive it and check the information you entered. We check the names, dates, times, locations, pictures and other details. We then prepare the final invitation and make sure it works properly. If we need more information from you, we will contact you. Once all details are final, the invitation link is normally ready in around 2–5 days. We send you the finished link so you can review it before payment.",
    },
    {
      question: "Can I change something after I send my design?",
      answer: "After you send the design, you cannot open it again and edit it yourself. If you notice a wrong name, date, time, address, picture or another mistake, contact us as soon as you can. Tell us exactly what needs to change. We will check your request and tell you what can be updated. Please review the finished link carefully before you pay.",
    },
    {
      question: "What if I make a mistake while creating my invitation?",
      answer: "Before sending, use the preview and check the names, event date, time, location, pictures and notes. You can go back through the designer and correct your choices before you press the final send button. If you only notice the mistake after sending, contact us as soon as possible. Tell us what is wrong so we can check it with you.",
    },
    {
      question: "How do I pay?",
      answer: "First, we prepare your invitation and send you the finished link to review. Payment is made outside the website by MCB Juice or bank transfer. We will send you the payment details. If you have a problem or a question about payment, contact us before paying.",
    },
    {
      question: "How will I receive my invitation and send it to my guests?",
      answer: "Once your invitation is ready, we will send you the invitation link using the contact details you gave us. Open the link first and check the finished invitation. You can then copy the same link and send it through WhatsApp, Messenger, SMS or another messaging app. Your guests only need to press the link to open the invitation.",
    },
    {
      question: "Can I contact you if I need help?",
      answer: "Yes. Use the WhatsApp option in the Free Assistance area on this page. Contact us if you do not understand something, have trouble creating the invitation, notice a mistake, have a special request or have a payment question. Tell us what you need help with and we will guide you.",
    },
  ];
}

function makeElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function createFaqNavigationLink(label = "FAQ") {
  const link = document.createElement("a");
  link.href = "#faq";
  link.textContent = label;
  link.dataset.faqNavigationLink = "true";
  return link;
}

export function LandingFaq() {
  useEffect(() => {
    const pricingSection = document.querySelector<HTMLElement>(".landing-refresh #pricing");
    if (!pricingSection || document.getElementById("faq")) return;

    const displayedBasePrice = document.querySelector<HTMLElement>(".landing-refresh .base-price-row strong")?.textContent?.trim() || "Rs 1,000";
    const faqItems = getFaqItems(displayedBasePrice);

    const section = makeElement("section", "faq-section");
    section.id = "faq";
    section.setAttribute("aria-labelledby", "faq-title");

    const shell = makeElement("div", "faq-shell");
    const heading = makeElement("div", "faq-heading");
    const eyebrow = makeElement("p", "eyebrow");
    eyebrow.textContent = "Questions before you start?";
    const title = makeElement("h2");
    title.id = "faq-title";
    title.append("Frequently Asked ");
    const titleAccent = makeElement("em");
    titleAccent.textContent = "Questions";
    title.append(titleAccent);
    const introduction = makeElement("p");
    introduction.textContent = "Simple answers to the questions people usually ask before creating an invitation.";
    heading.append(eyebrow, title, introduction);

    const list = makeElement("div", "faq-list");
    let openIndex: number | null = null;

    const setOpenItem = (nextIndex: number | null) => {
      openIndex = nextIndex;
      list.querySelectorAll<HTMLElement>(".faq-item").forEach((item, index) => {
        const isOpen = index === openIndex;
        item.dataset.open = String(isOpen);
        const button = item.querySelector<HTMLButtonElement>(".faq-question");
        const answer = item.querySelector<HTMLElement>(".faq-answer");
        button?.setAttribute("aria-expanded", String(isOpen));
        answer?.setAttribute("aria-hidden", String(!isOpen));
      });
    };

    faqItems.forEach((item, index) => {
      const questionId = `faq-question-${index}`;
      const answerId = `faq-answer-${index}`;

      const article = makeElement("article", "faq-item");
      article.dataset.open = "false";
      const questionHeading = makeElement("h3");
      const button = makeElement("button", "faq-question");
      button.type = "button";
      button.id = questionId;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", answerId);

      const questionText = makeElement("span");
      questionText.textContent = item.question;
      const icon = makeElement("span", "faq-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "+";
      button.append(questionText, icon);

      const answer = makeElement("div", "faq-answer");
      answer.id = answerId;
      answer.setAttribute("role", "region");
      answer.setAttribute("aria-labelledby", questionId);
      answer.setAttribute("aria-hidden", "true");
      const answerInner = makeElement("div");
      const answerText = makeElement("p");
      answerText.textContent = item.answer;
      answerInner.append(answerText);
      answer.append(answerInner);

      button.addEventListener("click", () => setOpenItem(openIndex === index ? null : index));
      questionHeading.append(button);
      article.append(questionHeading, answer);
      list.append(article);
    });

    shell.append(heading, list);
    section.append(shell);
    pricingSection.after(section);

    const createdLinks: HTMLAnchorElement[] = [];
    const desktopPricingLink = document.querySelector<HTMLAnchorElement>('.landing-refresh .site-nav nav a[href="#pricing"]');
    if (desktopPricingLink && !document.querySelector('.landing-refresh .site-nav nav a[href="#faq"]')) {
      const link = createFaqNavigationLink();
      desktopPricingLink.insertAdjacentElement("afterend", link);
      createdLinks.push(link);
    }

    const mobilePricingLink = document.querySelector<HTMLAnchorElement>('.landing-refresh .mobile-menu a[href="#pricing"]');
    if (mobilePricingLink && !document.querySelector('.landing-refresh .mobile-menu a[href="#faq"]')) {
      const link = createFaqNavigationLink();
      mobilePricingLink.insertAdjacentElement("afterend", link);
      createdLinks.push(link);
    }

    const footerExplore = document.querySelector<HTMLElement>(".landing-refresh .footer-column");
    if (footerExplore && !footerExplore.querySelector('a[href="#faq"]')) {
      const link = createFaqNavigationLink();
      footerExplore.append(link);
      createdLinks.push(link);
    }

    const mobileMenu = document.querySelector<HTMLDetailsElement>(".landing-refresh .mobile-menu");
    const handleFaqNavigation = (event: MouseEvent) => {
      event.preventDefault();
      mobileMenu?.removeAttribute("open");
      window.history.replaceState(null, "", "#faq");
      section.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    };
    createdLinks.forEach((link) => link.addEventListener("click", handleFaqNavigation));

    if (window.location.hash === "#faq") {
      window.requestAnimationFrame(() => section.scrollIntoView({ block: "start" }));
    }

    return () => {
      createdLinks.forEach((link) => {
        link.removeEventListener("click", handleFaqNavigation);
        link.remove();
      });
      section.remove();
    };
  }, []);

  return null;
}
