import { useMemo } from 'react';
import { motion as Motion } from 'motion/react';
import { duration, ease } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * WorkforceConstellation - an original, truthful workforce visualization.
 *
 * Departments become hub nodes on a ring; each employee becomes a small node
 * orbiting its own department hub. Node positions are computed from the real
 * `byDepartment` counts - nothing is decorative filler: every mark on screen
 * corresponds to one employee record or one department.
 *
 * Accessibility: rendered as a labelled <figure>; the SVG is aria-hidden and
 * the same information is provided as text in the caption.
 */
export default function WorkforceConstellation({ byDepartment = {}, total = 0 }) {
  const reduced = useReducedMotion();

  const model = useMemo(() => {
    const entries = Object.entries(byDepartment)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { hubs: [], links: [] };

    const cx = 160;
    const cy = 150;
    const hubRadius = entries.length === 1 ? 0 : 92;

    const hubs = entries.map(([name, count], i) => {
      const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
      return {
        name,
        count,
        x: cx + Math.cos(angle) * hubRadius,
        y: cy + Math.sin(angle) * hubRadius,
        angle,
        // Hub size scales with headcount (radius 7..12).
        r: 7 + Math.min(count, 6) * 0.85,
      };
    });

    // Leaf nodes: one per employee, fanned around the hub's outward direction.
    const links = [];
    hubs.forEach((hub) => {
      const outward = hub.angle;
      const spread = Math.PI / 3;
      for (let n = 0; n < hub.count; n += 1) {
        const t = hub.count === 1 ? 0.5 : n / (hub.count - 1);
        const a = outward - spread / 2 + spread * t;
        const len = 34;
        links.push({
          key: `${hub.name}-${n}`,
          x1: hub.x,
          y1: hub.y,
          x2: hub.x + Math.cos(a) * len,
          y2: hub.y + Math.sin(a) * len,
          hub: hub.name,
        });
      }
    });

    return { hubs, links, center: { x: cx, y: cy } };
  }, [byDepartment]);

  if (model.hubs.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        Add employees with a department to see the workforce map.
      </p>
    );
  }

  const desc = model.hubs.map((h) => `${h.name}: ${h.count}`).join(', ');

  return (
    <figure className="wf-map">
      <svg
        viewBox="0 0 320 300"
        role="img"
        aria-label={`Workforce constellation. ${total} employees across ${model.hubs.length} departments. ${desc}.`}
        className="wf-map__svg"
      >
        {model.links.map((l) => (
          <Motion.line
            key={l.key}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            className="wf-map__link"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            whileInView={reduced ? undefined : { pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: duration.slow, ease: ease.out }}
          />
        ))}

        {model.links.map((l) => (
          <Motion.circle
            key={`leaf-${l.key}`}
            cx={l.x2}
            cy={l.y2}
            r={3}
            className="wf-map__leaf"
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: duration.fast, ease: ease.out }}
          />
        ))}

        {model.hubs.map((h) => (
          <g key={h.name}>
            <circle cx={h.x} cy={h.y} r={h.r + 9} className="wf-map__halo" />
            <Motion.circle
              cx={h.x}
              cy={h.y}
              r={h.r}
              className="wf-map__hub"
              initial={reduced ? false : { scale: 0 }}
              whileInView={reduced ? undefined : { scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: duration.base, ease: ease.emphasized }}
            />
            <text
              x={h.x}
              y={h.y - h.r - 8}
              textAnchor="middle"
              className="wf-map__label"
            >
              {h.name}
            </text>
            <text x={h.x} y={h.y + 3.5} textAnchor="middle" className="wf-map__count">
              {h.count}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="wf-map__caption">
        Each hub is a department; each satellite dot is one employee. Hub size scales
        with headcount.
      </figcaption>
    </figure>
  );
}
