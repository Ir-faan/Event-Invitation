"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { MoveHorizontal } from "lucide-react";
import styles from "./seating-arrangement.module.css";

export type SeatingAssignment = {
  table: string;
  family: string;
  note?: string;
};

type DragState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
} | null;

const KEYBOARD_STEP = 180;
const MIN_FOCUS_SCALE = 0.72;
const MAX_FOCUS_SCALE = 1.08;

export function SeatingArrangement({ assignments }: { assignments: SeatingAssignment[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const centerGroupRef = useRef<HTMLDivElement>(null);
  const cycleWidthRef = useRef(0);
  const dragRef = useRef<DragState>(null);
  const focusFrameRef = useRef<number | null>(null);
  const motionTimerRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [moving, setMoving] = useState(false);

  const markMoving = () => {
    setMoving(true);
    if (motionTimerRef.current !== null) window.clearTimeout(motionTimerRef.current);
    motionTimerRef.current = window.setTimeout(() => setMoving(false), 180);
  };

  const updateFocusScales = () => {
    if (focusFrameRef.current !== null) return;

    focusFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = null;
      const viewport = viewportRef.current;
      if (!viewport) return;

      const viewportRect = viewport.getBoundingClientRect();
      const centerX = viewportRect.left + viewportRect.width / 2;
      const centerY = viewportRect.top + viewportRect.height / 2;
      const radius = Math.max(Math.min(viewportRect.width, viewportRect.height) * 0.52, 1);

      viewport.querySelectorAll<HTMLElement>("[data-seating-assignment]").forEach((element) => {
        const rect = element.getBoundingClientRect();
        const itemX = rect.left + rect.width / 2;
        const itemY = rect.top + rect.height / 2;
        const distance = Math.hypot(itemX - centerX, itemY - centerY);
        const proximity = Math.max(0, Math.min(1, 1 - distance / radius));
        const eased = proximity * proximity * (3 - 2 * proximity);
        const scale = MIN_FOCUS_SCALE + (MAX_FOCUS_SCALE - MIN_FOCUS_SCALE) * eased;
        element.style.setProperty("--focus-scale", scale.toFixed(3));
      });
    });
  };

  const centerInfiniteTrack = () => {
    const viewport = viewportRef.current;
    const centerGroup = centerGroupRef.current;
    if (!viewport || !centerGroup) return;

    const cycleWidth = centerGroup.offsetWidth;
    if (!cycleWidth) return;

    cycleWidthRef.current = cycleWidth;
    viewport.scrollLeft = cycleWidth;
    updateFocusScales();
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(centerInfiniteTrack);
    const centerGroup = centerGroupRef.current;
    const observer = centerGroup && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(centerInfiniteTrack)
      : null;

    if (centerGroup && observer) observer.observe(centerGroup);

    return () => {
      window.cancelAnimationFrame(frame);
      if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
      observer?.disconnect();
      if (motionTimerRef.current !== null) window.clearTimeout(motionTimerRef.current);
    };
  }, [assignments.length]);

  const normalizeInfiniteScroll = () => {
    const viewport = viewportRef.current;
    const cycleWidth = cycleWidthRef.current;
    if (!viewport || !cycleWidth) return;

    const left = viewport.scrollLeft;
    if (left < cycleWidth * 0.45) {
      viewport.scrollLeft = left + cycleWidth;
    } else if (left > cycleWidth * 1.55) {
      viewport.scrollLeft = left - cycleWidth;
    }
  };

  const handleScroll = () => {
    normalizeInfiniteScroll();
    markMoving();
    updateFocusScales();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: viewport.scrollLeft,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const drag = dragRef.current;
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return;

    viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
    markMoving();
    updateFocusScales();
  };

  const finishPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      viewport.scrollLeft += event.key === "ArrowRight" ? KEYBOARD_STEP : -KEYBOARD_STEP;
      markMoving();
      updateFocusScales();
    }
  };

  const renderAssignments = (copy: number) => (
    <div
      className={styles.assignmentGroup}
      ref={copy === 1 ? centerGroupRef : undefined}
      aria-hidden={copy !== 1 ? "true" : undefined}
      key={copy}
    >
      {assignments.map((assignment, index) => (
        <div
          className={styles.assignment}
          data-seating-assignment
          key={`${copy}-${assignment.table}-${assignment.family}`}
          style={{
            "--focus-scale": MIN_FOCUS_SCALE,
            "--float-delay": `${-(index % 7) * 0.48}s`,
            "--float-duration": `${5.2 + (index % 5) * 0.55}s`,
            "--float-x": `${((index % 3) - 1) * 3}px`,
          } as CSSProperties}
        >
          <div className={styles.assignmentContent}>
            <span>Table {assignment.table}</span>
            <strong>{assignment.family}</strong>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className={styles.section} aria-labelledby="seating-title">
      <div className={styles.layout}>
        <div className={styles.heading} data-wedding-reveal>
          <p>You&apos;re among family</p>
          <h2 id="seating-title">Seating Arrangement</h2>
          <div className={styles.flourish} aria-hidden="true"><span />✦<span /></div>
          <p className={styles.intro}>Find your family&apos;s table and gently explore the arrangement.</p>
          <div className={styles.hint}><MoveHorizontal aria-hidden="true" /> Drag to explore</div>
        </div>

        <div
          ref={viewportRef}
          className={`${styles.viewport} ${dragging ? styles.dragging : ""} ${moving ? styles.moving : ""}`}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerDrag}
          onPointerCancel={finishPointerDrag}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label="Interactive seating arrangement. Drag horizontally to browse table numbers and family names. Use the left and right arrow keys as a keyboard alternative."
        >
          <div className={styles.track}>
            {[0, 1, 2].map(renderAssignments)}
          </div>
        </div>
      </div>
    </section>
  );
}
