"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export function OrderConfirmationModal({ icon, eyebrow, title, description, confirmLabel, tone = "wine", busy, error, onCancel, onConfirm }: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "wine" | "danger";
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
        event.preventDefault();
        controls[0].focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="orders-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section ref={dialogRef} className={`orders-confirm-modal is-${tone}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <button className="orders-modal-close" type="button" onClick={onCancel} disabled={busy} aria-label="Close confirmation"><X aria-hidden="true" /></button>
        <span className="orders-confirm-icon">{icon}</span>
        <p className="orders-modal-eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="orders-confirm-description">{description}</p>
        {error && <p className="orders-confirm-error" role="alert">{error}</p>}
        <div className="orders-confirm-actions">
          <button type="button" ref={cancelRef} onClick={onCancel} disabled={busy}>Keep as it is</button>
          <button type="button" onClick={onConfirm} disabled={busy}>{busy ? <Loader2 className="is-spinning" aria-hidden="true" /> : icon}{busy ? "Working…" : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
