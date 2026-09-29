import { useMemo, useState } from 'react';
import { motion as Motion } from 'motion/react';
import { duration, ease } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * WorkforceConstellation - the flagship workforce visualization.
 *
 * An orbit system: departments sit as hubs on a ring around a central core,
 * and every employee is a satellite tethered to its own department hub with an
 * animated connection line. Every mark maps to one real record - nothing is
 * decorative filler.
 *
 * Interaction: hovering or focusing a hub isolates that department (its links
 * and satellites brighten, others recede) and surfaces its headcount share.
 *
 * Accessibility: a labelled <figure> with the full breakdown in the
 * aria-label and a live readout that is also exposed as text.
 */
export default function WorkforceConstellation({ byDepartment = {}, total = 0 }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(null);

  const model = useMemo(() => {
    const entries = Object.entries(byDepartment)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { hubs: [], links: [], core: { x: 200, y: 190 } };

    const core = { x: 200, y: 200 };
    const hubRing = entries.length === 1 ? 0 : 96;
    const maxCount = Math.max(...entries.map(([, c]) => c));

    const hubs = entries.map(([name, count], i) => {
      const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
      return {
        name,
        count,
        angle,
        x: core.x + Math.cos(angle) * hubRing,
        y: core.y + Math.sin(angle) * hubRing,
        // Hub radius maps headcount onto 9..16 (real proportion, readable).
        r: 9 + (count / maxCount) * 7,
        share: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    // Satellites: one per employee, fanned outward from its hub.
    const links = [];
    hubs.forEach((hub) => {
      const spread = Math.PI / 2.3;
      for (let n = 0; n < hub.count; n += 1) {
        const t = hub.count === 1 ? 0.5 : n / (hub.count - 1);
        const a = hub.angle - spread / 2 + spread * t;
        const len = 30 + hub.r;
        links.push({
          key: `${hub.name}-${n}`,
          hub: hub.name,
          x1: hub.x,
          y1: hub.y,
          x2: hub.x + Math.cos(a) * len,
          y2: hub.y + Math.sin(a) * len,
        });
      }
    });

    return { hubs, links, core, hubRing };
  }, [byDepartment, total]);

  if (model.hubs.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        Add employees with a department to see the workforce map.
      </p>
    );
  }

  const desc = model.hubs.map((h) => `${h.name}: ${h.count}`).join(', ');
  const activeHub = model.hubs.find((h) => h.name === active) || null;

  return (
    <figure className="wf">
      <div className="wf__stage">
        <svg
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Workforce constellation: ${total} employees across ${model.hubs.length} departments. ${desc}.`}
          className="wf__svg"
        >
          <defs>
            <radialGradient id="wf-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.42" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Orbit rings - structure, not decoration */}
          {[0.68, 1, 1.32].map((s, i) => (
            <circle
              key={`ring-${i}`}
              cx={model.core.x}
              cy={model.core.y}
              r={model.hubRing * s + 26}
              className="wf__ring"
            />
          ))}

          {/* Core glow + core */}
          <circle cx={model.core.x} cy={model.core.y} r={54} fill="url(#wf-core-glow)" className="wf__core-glow" />
          <circle cx={model.core.x} cy={model.core.y} r={4} className="wf__core" />
          <text x={model.core.x} y={model.core.y + 24} textAnchor="middle" className="wf__core-label">
            {total}
          </text>

          {/* Link lines */}
          {model.links.map((l, i) => {
            const isActive = active === l.hub;
            const dim = Boolean(active) && !isActive;
            return (
              <Motion.line
                key={l.key}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                className="wf__link"
                data-active={isActive}
                data-dim={dim}
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                whileInView={reduced ? undefined : { pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: duration.slow, ease: ease.out, delay: 0.02 * i }}
              />
            );
          })}

          {/* Employee satellites */}
          {model.links.map((l) => (
            <Motion.circle
              key={`leaf-${l.key}`}
              cx={l.x2}
              cy={l.y2}
              r={3.2}
              className="wf__leaf"
              data-active={active === l.hub}
              data-dim={Boolean(active) && active !== l.hub}
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: duration.fast, ease: ease.out }}
            />
          ))}

          {/* Department hubs (interactive) */}
          {model.hubs.map((h) => {
            const isActive = active === h.name;
            return (
              <g
                key={h.name}
                className="wf__hub"
                data-active={isActive}
                onMouseEnter={() => setActive(h.name)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(h.name)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={`${h.name}, ${h.count} ${h.count === 1 ? 'person' : 'people'}, ${h.share} percent of workforce`}
              >
                {/* Generous invisible hit area */}
                <circle cx={h.x} cy={h.y} r={h.r + 22} fill="transparent" />
                <circle cx={h.x} cy={h.y} r={h.r + 12} className="wf__hub-halo" />
                <Motion.circle
                  cx={h.x}
                  cy={h.y}
                  r={h.r}
                  className="wf__hub-core"
                  initial={reduced ? false : { scale: 0 }}
                  whileInView={reduced ? undefined : { scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: duration.base, ease: ease.emphasized }}
                />
                <text x={h.x} y={h.y - h.r - 10} textAnchor="middle" className="wf__hub-name">
                  {h.name}
                </text>
                <text x={h.x} y={h.y + 3.6} textAnchor="middle" className="wf__hub-count">
                  {h.count}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live readout for the active hub - also readable as text */}
        <div className="wf__readout" aria-live="polite">          {activeHub ? (
            <>
              <span className="wf__readout-name">{activeHub.name}</span>
              <span className="wf__readout-meta">
                {activeHub.count} {activeHub.count === 1 ? 'person' : 'people'} · {activeHub.share}% of
                workforce
              </span>
            </>
          ) : (
            <span className="wf__readout-hint">Hover a department to isolate its people</span>
          )}
        </div>
      </div>

      <figcaption className="sr-only">
        Workforce constellation. Each hub is a department; each satellite dot is one
        employee. Hub size scales with headcount. Complete breakdown: {desc}.
      </figcaption>
    </figure>
  );
}