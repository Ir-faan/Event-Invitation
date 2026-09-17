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
      answer: "Paperless Invites helps you make a digital invitation for your wedding or special day. Your guests open it from a simple link.",
    },
    {
      question: "How do I create my invitation?",
      answer: "Press “Design your invitation”. Choose your colours and invitation parts, add your details and pictures, then send the design to us.",
    },
    {
      question: "Can I choose how my invitation looks?",
      answer: "Yes. You can choose the colours, invitation parts, opening style, pictures and other choices shown in the designer.",
    },
    {
      question: "Can I use my own pictures?",
      answer: "Yes. When an invitation part allows pictures, you can upload your own pictures while you design it.",
    },
    {
      question: "How much does an invitation cost?",
      answer: `A basic invitation starts at ${basePrice}. Extra invitation parts and special effects cost more. Your total is shown before payment.`,
    },
    {
      question: "I sent my invitation design. What happens now?",
      answer: "We receive your design, check the details and prepare the final invitation. If we need anything from you, we will contact you. Once all details are final, the link is normally ready in 2–5 days.",
    },
    {
      question: "Can I make changes after I send my design?",
      answer: "You cannot go back and edit the sent design yourself. If you need a change, contact us. You can review the finished invitation link before you pay.",
    },
    {
      question: "How do I pay?",
      answer: "We send you the payment details after your finished invitation link is ready. Payment is made by MCB Juice or bank transfer.",
    },
    {
      question: "How will I receive my invitation?",
      answer: "We send you a link to your finished invitation. You can open the link to check it, then share the same link with your guests.",
    },
    {
      question: "How do I send the invitation to my guests?",
      answer: "Copy the invitation link and send it through WhatsApp, Messenger, SMS or another messaging app you use.",
    },
    {
      question: "Do my guests need an app?",
      answer: "No. Guests only need to tap the invitation link. They do not need to install an app.",
    },
    {
      question: "Does the invitation work on a phone?",
      answer: "Yes. The invitation is made to be easy to open and read on a phone. It can also be opened on a computer.",
    },
    {
      question: "Is it easy for older guests to open?",
      answer: "Yes. Guests only need to tap the link and move through the invitation. We keep the guest view simple to open and read.",
    },
    {
      question: "Can I add something that is not in the list?",
      answer: "Yes. We can make a custom invitation part for something that is not already in the choices. Message us on WhatsApp to discuss what you need and the extra cost.",
    },
    {
      question: "Can I contact you if I need help?",
      answer: "Yes. Use the WhatsApp option in the Free Assistance area on this page if you need help with your invitation or have a question.",
    },
  ];
}

function makeElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

export function LandingFaq() {
  useEffect(() => {
    const pricingAction = document.querySelector<HTMLElement>(".landing-refresh .pricing-action");
    if (!pricingAction || document.getElementById("faq")) return;

    const displayedBasePrice = document.querySelector<HTMLElement>(".landing-refresh .base-price-row strong")?.textContent?.trim() || "Rs 1,000";
    const faqItems = getFaqItems(displayedBasePrice);

    const section = makeElement("section", "faq-section");
    section.id = "faq";
    section.setAttribute("aria-labelledby", "faq-title");

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
    introduction.textContent = "Here are some common questions about Paperless Invites.";
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

    section.append(heading, list);
    pricingAction.before(section);

    const footerExplore = document.querySelector<HTMLElement>(".landing-refresh .footer-column");
    let footerFaqLink: HTMLAnchorElement | null = null;
    if (footerExplore && !footerExplore.querySelector('a[href="#faq"]')) {
      footerFaqLink = document.createElement("a");
      footerFaqLink.href = "#faq";
      footerFaqLink.textContent = "FAQ";
      footerFaqLink.dataset.faqFooterLink = "true";
      footerExplore.append(footerFaqLink);
    }

    return () => {
      footerFaqLink?.remove();
      section.remove();
    };
  }, []);

  return null;
}
