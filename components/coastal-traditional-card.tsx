"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Heart, IdCard, X } from "lucide-react";
import styles from "./coastal-traditional-card.module.css";

export type TraditionalCardDetails = {
  familyLine: string;
  invitationMessage: string;
  brideName: string;
  groomName: string;
  date: string;
  timePrefix: string;
  time: string;
  venue: string;
  location: string;
  giftHeading: string;
  giftPreference: string;
};

const defaultDetails: TraditionalCardDetails = {
  familyLine: "Together with their families",
  invitationMessage: "Request the honour of your presence at the wedding celebration of",
  brideName: "Salma",
  groomName: "Sam",
  date: "Friday, 17 September 2027",
  timePrefix: "at",
  time: "4:30 PM",
  venue: "The Ravenala Attitude",
  location: "Balaclava, Mauritius",
  giftHeading: "Humble request",
  giftPreference: "No gift box please",
};

export function CoastalTraditionalCard({
  details = defaultDetails,
}: {
  details?: TraditionalCardDetails;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        className={styles.cardLauncher}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View traditional wedding card"
        aria-haspopup="dialog"
      >
        <IdCard aria-hidden="true" />
        <span>View card</span>
      </button>

      {open && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className={styles.dialogShell}
            role="dialog"
            aria-modal="true"
            aria-labelledby="traditional-card-title"
          >
            <button
              className={styles.closeButton}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close traditional wedding card"
              autoFocus
            >
              <X aria-hidden="true" />
            </button>

            <article className={styles.card}>
              <img
                className={styles.borderArtwork}
                src="/images/traditional-card-border.webp"
                alt=""
                aria-hidden="true"
              />

              <div className={styles.cardContent}>
                <span
                  className={styles.bismillahArtwork}
                  role="img"
                  aria-label="Bismillah ir-Rahman ir-Rahim"
                />

                <p className={styles.familyLine}>{details.familyLine}</p>
                <p className={styles.invitationLine}>{details.invitationMessage}</p>

                <h2 className={styles.names} id="traditional-card-title">
                  <span>{details.brideName}</span>
                  <Heart aria-hidden="true" />
                  <span>{details.groomName}</span>
                </h2>

                <div className={styles.divider} aria-hidden="true">
                  <span />
                  <Heart />
                  <span />
                </div>

                <p className={styles.date}>{details.date}</p>
                <p className={styles.time}>{details.timePrefix} {details.time}</p>

                <div className={styles.venueBlock}>
                  <strong>{details.venue}</strong>
                  <span>{details.location}</span>
                </div>

                <div className={styles.giftNote}>
                  <small>{details.giftHeading}</small>
                  <strong>{details.giftPreference}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </>
  );
}
