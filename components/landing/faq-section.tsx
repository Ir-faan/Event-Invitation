"use client";

import { useState } from "react";

type FaqItem = { question: string; answer: string };

function faqItems(basePrice: string): FaqItem[] {
  return [
    { question: "What is Paperless Invites?", answer: "Paperless Invites helps you create a digital invitation for your wedding or special day. You choose the colours, invitation parts, pictures and information you want. After you send your design, we check it and prepare the final invitation for you. When it is ready, you receive one link that you can share with your guests." },
    { question: "How do I create my invitation?", answer: "Press “Design your invitation” to start. Choose your colours, how the invitation opens, the main photo area and the parts you want. Add your names, date, time, location, notes and pictures where needed. Use the phone preview to check how it looks. When you are happy, add your contact details and send the design to us." },
    { question: "Can I choose how my invitation looks?", answer: "Yes. You can choose one of six colour palettes, no opening or an envelope or curtain opening, and a normal or scratch-to-reveal main photo area. Your invitation starts with four main parts: Countdown, Our Timeline, Event Details + Location and Important Notes. You can also choose extra invitation parts (such as A Special Message, Seating Arrangement, Day Programme and Glimpse Of Us) and add your own pictures where available. Some choices cost extra, so the price can change as you build your invitation. The designer shows your current total while you make changes. If you need something that is not listed, you can contact us about a custom part." },
    { question: "Can I use my own pictures?", answer: "Yes. You can upload your own picture for the interactive main photo area and on 'The Glimpse Of Us' part. Clear, bright pictures usually give the best result. You can see your uploaded pictures in the preview before you send the design." },
    { question: "How much does an invitation cost?", answer: `A basic invitation starts at ${basePrice}. The main parts are already included. Extra parts, an envelope or curtain opening, an interactive main photo area, or a custom part can add to the price. The total depends on the options you choose. You will see your current total in the designer before you send it.` },
    { question: "Can I see the price before I send my design?", answer: "Yes. The designer shows your current price while you create the invitation. When you add or remove a paid option, the total changes. A price summary also shows what is included in the total." },
    { question: "I sent my invitation design. What happens now?", answer: "After you send your design, we receive it and check the information you entered. We check the names, dates, times, locations, pictures and other details. We then prepare the final invitation and make sure it works properly. If we need more information from you, we will contact you. Once all details are final, the invitation link is normally ready in around 2–5 days. We send you the finished link so you can review it before payment." },
    { question: "Can I change something after I send my design?", answer: "After you send the design, you cannot open it again and edit it yourself. If you notice a wrong name, date, time, address, picture or another mistake, contact us as soon as you can. Tell us exactly what needs to change. We will check your request and tell you what can be updated." },
    { question: "How do I pay?", answer: "First, we prepare your invitation and send you the finished link to review. Payment is made outside the website by MCB Juice or bank transfer. We will send you the payment details. If you have a problem or a question about payment, contact us before paying." },
    { question: "How will I receive my invitation and send it to my guests?", answer: "Once your invitation is ready, we will send you the invitation link using the contact details you gave us when designin your invitation. Open the link first and check the finished invitation. You can then copy the same link and send it through WhatsApp, Messenger, SMS or another messaging app. Your guests only need to press the link to open the invitation." },
    { question: "Can I contact you if I need help?", answer: "Of course! Contact us if you do not understand something, have trouble creating the invitation, notice a mistake, have a special request or have a payment question. Tell us what you need help with and we will assist you." },
  ];
}

export function FaqSection({ basePriceLabel }: { basePriceLabel: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-shell">
        <div className="faq-heading">
          <p className="eyebrow">Questions before you start?</p>
          <h2 id="faq-title">Frequently Asked <em>Questions</em></h2>
          <p>Simple answers to the questions people usually ask before creating an invitation.</p>
        </div>
        <div className="faq-list">
          {faqItems(basePriceLabel).map((item, index) => {
            const open = openIndex === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;
            return (
              <article className="faq-item" data-open={String(open)} key={item.question}>
                <h3>
                  <button className="faq-question" type="button" id={questionId} aria-expanded={open} aria-controls={answerId} onClick={() => setOpenIndex(open ? null : index)}>
                    <span>{item.question}</span><span className="faq-icon" aria-hidden="true">+</span>
                  </button>
                </h3>
                <div className="faq-answer" id={answerId} role="region" aria-labelledby={questionId} aria-hidden={!open}>
                  <div><p>{item.answer}</p></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
