"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Move, RotateCcw } from "lucide-react";
import styles from "./seating-arrangement.module.css";

export type SeatingAssignment = {
  table: string;
  family: string;
  note?: string;
};

type Pan = { x: number; y: number };

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null;

const placements = [
  { x: 15, y: 26, scale: 0.9, rotate: -4 },
  { x: 33, y: 16, scale: 1.04, rotate: 3 },
  { x: 52, y: 29, scale: 0.94, rotate: -2 },
  { x: 72, y: 15, scale: 1.08, rotate: 4 },
  { x: 88, y: 34, scale: 0.88, rotate: -5 },
  { x: 20, y: 66, scale: 1.06, rotate: 3 },
  { x: 39, y: 52, scale: 0.9, rotate: -3 },
  { x: 60, y: 67, scale: 1.02, rotate: 2 },
  { x: 78, y: 55, scale: 0.94, rotate: -4 },
  { x: 91, y: 76, scale: 1.08, rotate: 3 },
  { x: 48, y: 84, scale: 0.88, rotate: -2 },
  { x: 8, y: 84, scale: 0.96, rotate: 4 },
];

const PAN_LIMIT_X = 620;
const PAN_LIMIT_Y = 360;
const KEYBOARD_STEP = 64;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function SeatingArrangement({ assignments }: { assignments: SeatingAssignment[] }) {
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<DragState>(null);

  const moveTo = (x: number, y: number) => {
    setPan({
      x: clamp(x, -PAN_LIMIT_X, PAN_LIMIT_X),
      y: clamp(y, -PAN_LIMIT_Y, PAN_LIMIT_Y),
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    moveTo(
      activeDrag.originX + event.clientX - activeDrag.startX,
      activeDrag.originY + event.clientY - activeDrag.startY,
    );
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const movement: Record<string, Pan> = {
      ArrowLeft: { x: KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: -KEYBOARD_STEP, y: 0 },
      ArrowUp: { x: 0, y: KEYBOARD_STEP },
      ArrowDown: { x: 0, y: -KEYBOARD_STEP },
    };

    if (event.key === "Home") {
      event.preventDefault();
      moveTo(0, 0);
      return;
    }

    const direction = movement[event.key];
    if (!direction) return;

    event.preventDefault();
    moveTo(pan.x + direction.x, pan.y + direction.y);
  };

  return (
    <section className={styles.section} aria-labelledby="seating-title">
      <div className={styles.heading} data-wedding-reveal>
        <p>A place for everyone</p>
        <h2 id="seating-title">Seating Arrangements</h2>
        <span>Find your family&apos;s table. Drag the arrangement to explore every seat in the celebration.</span>
      </div>

      <div className={styles.toolbar} data-wedding-reveal>
        <div className={styles.dragHint}><Move aria-hidden="true" /> Drag to explore</div>
        <button type="button" onClick={() => moveTo(0, 0)} aria-label="Reset seating arrangement position">
          <RotateCcw aria-hidden="true" /> Reset view
        </button>
      </div>

      <div
        className={`${styles.viewport} ${dragging ? styles.dragging : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Interactive seating arrangement. Drag with a mouse or finger, or use the arrow keys to explore. Press Home to reset the view."
        style={{ "--pan-x": `${pan.x}px`, "--pan-y": `${pan.y}px` } as CSSProperties}
      >
        <div className={styles.stars} aria-hidden="true">
          {Array.from({ length: 34 }, (_, index) => (
            <span
              key={index}
              style={{
                "--star-x": `${(index * 37 + 11) % 100}%`,
                "--star-y": `${(index * 53 + 17) % 100}%`,
                "--star-delay": `${-(index % 8) * 0.7}s`,
              } as CSSProperties}
            />
          ))}
        </div>

        <div className={styles.canvas}>
          <div className={styles.orbitLarge} aria-hidden="true" />
          <div className={styles.orbitSmall} aria-hidden="true" />
          {assignments.map((assignment, index) => {
            const placement = placements[index % placements.length];
            return (
              <div
                className={styles.seatPosition}
                key={`${assignment.table}-${assignment.family}`}
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  "--seat-scale": placement.scale,
                  "--seat-rotate": `${placement.rotate}deg`,
                  "--float-delay": `${-(index % 6) * 0.75}s`,
                  "--float-duration": `${5.4 + (index % 4) * 0.7}s`,
                } as CSSProperties}
              >
                <article className={styles.seatCard}>
                  <span>Table {assignment.table}</span>
                  <strong>{assignment.family}</strong>
                  {assignment.note && <small>{assignment.note}</small>}
                </article>
              </div>
            );
          })}
        </div>

        <div className={styles.edgeHint} aria-hidden="true">Drag · Discover · Find your table</div>
      </div>
    </section>
  );
}
