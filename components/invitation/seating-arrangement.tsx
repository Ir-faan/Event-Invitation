import { type CSSProperties } from "react";
import styles from "./seating-arrangement.module.css";

export type SeatingAssignment = {
  table: string;
  family: string;
  note?: string;
};

const placements = [
  { x: 24, y: 18 },
  { x: 50, y: 14 },
  { x: 76, y: 20 },
  { x: 14, y: 39 },
  { x: 38, y: 34 },
  { x: 62, y: 38 },
  { x: 86, y: 41 },
  { x: 24, y: 58 },
  { x: 50, y: 54 },
  { x: 76, y: 59 },
  { x: 38, y: 77 },
  { x: 64, y: 77 },
];

function getPlacement(index: number) {
  const base = placements[index % placements.length];
  const cycle = Math.floor(index / placements.length);

  if (cycle === 0) return base;

  return {
    x: Math.max(10, Math.min(90, base.x + ((cycle * 9 + index * 5) % 9) - 4)),
    y: Math.max(10, Math.min(86, base.y + ((cycle * 7 + index * 3) % 9) - 4)),
  };
}

export function SeatingArrangement({ assignments }: { assignments: SeatingAssignment[] }) {
  return (
    <section className={styles.section} aria-labelledby="seating-title">
      <div className={styles.layout}>
        <div className={styles.heading} data-wedding-reveal>
          <p>You&apos;re among family</p>
          <h2 id="seating-title">Seating Arrangement</h2>
          <div className={styles.flourish} aria-hidden="true"><span />✦<span /></div>
          <p className={styles.intro}>Find your family&apos;s table among the people celebrating beside you.</p>
        </div>

        <div className={styles.seatingField} aria-label="Wedding seating arrangement">
          {assignments.map((assignment, index) => {
            const placement = getPlacement(index);
            return (
              <article
                className={styles.assignment}
                key={`${assignment.table}-${assignment.family}`}
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  "--float-delay": `${-(index % 7) * 0.52}s`,
                  "--float-duration": `${5.4 + (index % 5) * 0.6}s`,
                  "--float-x": `${((index % 5) - 2) * 1.25}px`,
                  "--float-y": `${((index % 4) - 1.5) * 1.1}px`,
                } as CSSProperties}
              >
                <span>Table {assignment.table}</span>
                <strong>{assignment.family}</strong>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
