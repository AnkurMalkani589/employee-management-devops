import { motion as Motion } from 'motion/react';
import { duration, ease } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * DistributionMeter - department composition for the current workforce.
 *
 * A single stacked bar plus a ranked legend. Every segment width is the real
 * share of total headcount (count / total); the legend repeats the exact
 * numbers, so the visual never overstates what the data says.
 *
 * Colours come from a fixed set of tinted CSS classes (not random hues), and
 * each legend row also carries its number, so meaning is never conveyed by
 * colour alone.
 */
export default function DistributionMeter({ byDepartment = {}, total = 0 }) {
  // Hooks must run unconditionally, before any early return.
  const reduced = useReducedMotion();

  const rows = Object.entries(byDepartment)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  if (rows.length === 0 || total === 0) {
    return (
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        No department distribution to show yet.
      </p>
    );
  }

  return (
    <div className="dist">
      {/* Composition bar */}
      <div
        className="dist__bar"
        role="img"
        aria-label={`Department distribution of ${total} employees: ${rows
          .map(([n, c]) => `${n} ${Math.round((c / total) * 100)} percent`)
          .join(', ')}.`}
      >
        {rows.map(([name, count], i) => (
          <Motion.span
            key={name}
            className={`dist__seg dist__seg--${i % 6}`}
            style={{ flexGrow: count }}
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={reduced ? undefined : { scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: duration.slow, ease: ease.out, delay: i * 0.05 }}
          />
        ))}
      </div>

      {/* Ranked legend with exact values */}
      <ul className="dist__legend">
        {rows.map(([name, count], i) => {
          const pct = Math.round((count / total) * 100);
          return (
            <li className="dist__row" key={name}>
              <span className={`dist__swatch dist__seg--${i % 6}`} aria-hidden="true" />
              <span className="dist__name">{name}</span>
              <span className="dist__value">
                <strong>{count}</strong>
                <span className="muted"> · {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
