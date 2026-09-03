import { type CSSProperties } from "react";
import styles from "./seating-arrangement.module.css";

export type SeatingAssignment = {
  table: string;
  family: string;
  note?: string;
};

const placements = [
  { x: 18, y: 15 },
  { x: 70, y: 11 },
  { x: 82, y: 34 },
  { x: 67, y: 59 },
  { x: 84, y: 79 },
  { x: 51, y: 82 },
  { x: 24, y: 73 },
  { x: 8, y: 51 },
  { x: 12, y: 31 },
  { x: 47, y: 25 },
  { x: 36, y: 7 },
  { x: 58, y: 45 },
];

function getPlacement(index: number) {
  const base = placements[index % placements.length];
  const cycle = Math.floor(index / placements.length);

  if (cycle === 0) return base;

  return {
    x: Math.max(5, Math.min(91, base.x + ((cycle * 13 + index * 7) % 17) - 8)),
    y: Math.max(5, Math.min(88, base.y + ((cycle * 11 + index * 5) % 15) - 7)),
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
