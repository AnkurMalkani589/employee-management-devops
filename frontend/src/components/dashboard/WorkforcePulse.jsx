import { useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'motion/react';
import { Users, Building2, TrendingUp, Activity } from 'lucide-react';
import { AnimatedCounter } from '../animation/AnimatedCounter.jsx';
import { duration, ease } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * WorkforcePulse - the hero instrument card.
 *
 * A command-center "readout" built entirely from real data:
 *   employees   <- GET /api/employees
 *   departments <- derived from those records
 *   recent      <- records created in the last 30 days
 *   platform    <- GET /api/health (status + database)
 *
 * The visualization is a truthful sparkline of employee records bucketed by
 * creation date. It contains only real rows; when history is too short to
 * plot, it says so rather than drawing invented shape.
 */
export default function WorkforcePulse({
  total = 0,
  departmentCount = 0,
  recentlyAdded = 0,
  employees = [],
  platform,
  loading = false,
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // ---- Department shares for the composition arc (real proportions) ----
  const composition = Object.entries(
    employees.reduce((acc, e) => {
      if (!e.department) return acc;
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      name,
      count,
      share: total > 0 ? count / total : 0,
      tone: i % 4,
    }));

  const healthOk = platform?.reachable && platform?.status?.database === 'ok';

  return (
    <div ref={wrapRef} className="pulse" data-loading={loading}>
      {/* Ambient instrument glow */}
      <div className="pulse__glow" aria-hidden="true" />

      <div className="pulse__head">
        <span className="pulse__label">
          <span
            className={`pulse__dot ${healthOk ? 'pulse__dot--ok' : ''}`}
            aria-hidden="true"
          />
          Workforce Pulse
        </span>
        <span className="pulse__state">
          {platform?.reachable === null || platform?.reachable === undefined
            ? 'Checking'
            : healthOk
              ? 'Live'
              : 'Degraded'}
        </span>
      </div>

      {/* Primary readout */}
      <div className="pulse__primary">
        <span className="pulse__value">
          {loading ? (
            <span className="skeleton pulse__skeleton" aria-hidden="true" />
          ) : (
            <AnimatedCounter value={total} />
          )}
        </span>
        <span className="pulse__unit">
          {total === 1 ? 'person' : 'people'}
          <span className="pulse__unit-sub">in the directory</span>
        </span>      </div>

      {/* Composition arc: department share as stacked proportions, which stays
          legible at any data volume (a sparse directory has no meaningful
          timeline). Every arc is a real share of total headcount. */}
      <div className="pulse__composition">
        <div className="pulse__ring" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="pulse__ring-svg">
            <circle cx="50" cy="50" r="42" className="pulse__ring-track" />
            {(() => {
              const C = 2 * Math.PI * 42;
              let offset = 0;
              return composition.map((d) => {
                const len = d.share * C;
                const seg = (
                  <Motion.circle
                    key={d.name}
                    cx="50"
                    cy="50"
                    r="42"
                    className={`pulse__ring-arc pulse__ring-arc--${d.tone}`}
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-offset}
                    initial={reduced || !mounted ? false : { opacity: 0 }}
                    animate={reduced || !mounted ? undefined : { opacity: 1 }}
                    transition={{ duration: duration.base, ease: ease.out }}
                  />
                );
                offset += len;
                return seg;
              });
            })()}
          </svg>
          <span className="pulse__ring-center">{composition.length}</span>
        </div>
        <div className="pulse__ring-legend">
          {composition.length === 0 ? (
            <span className="pulse__ring-empty">No departments recorded yet</span>
          ) : (
            composition.slice(0, 4).map((d) => (
              <span className="pulse__ring-item" key={d.name}>
                <span
                  className={`pulse__ring-dot pulse__ring-arc--${d.tone}`}
                  aria-hidden="true"
                />
                <span className="pulse__ring-name">{d.name}</span>
                <span className="pulse__ring-pct">{Math.round(d.share * 100)}%</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Secondary readouts */}
      <div className="pulse__grid">
        <div className="pulse__stat">
          <span className="pulse__stat-icon" aria-hidden="true">
            <Building2 size={14} />
          </span>
          <span className="pulse__stat-label">Departments</span>
          <span className="pulse__stat-value">
            {loading ? '—' : <AnimatedCounter value={departmentCount} />}
          </span>
        </div>

        <div className="pulse__stat">
          <span className="pulse__stat-icon" aria-hidden="true">
            <TrendingUp size={14} />
          </span>
          <span className="pulse__stat-label">Added · 30d</span>
          <span className="pulse__stat-value">
            {loading ? '—' : <AnimatedCounter value={recentlyAdded} />}
          </span>
        </div>

        <div className="pulse__stat">
          <span className="pulse__stat-icon" aria-hidden="true">
            <Activity size={14} />
          </span>
          <span className="pulse__stat-label">Database</span>
          <span className="pulse__stat-value pulse__stat-value--text">
            {platform?.status?.database ?? '—'}
          </span>
        </div>

        <div className="pulse__stat">
          <span className="pulse__stat-icon" aria-hidden="true">
            <Users size={14} />
          </span>
          <span className="pulse__stat-label">API</span>
          <span className="pulse__stat-value pulse__stat-value--text">
            {platform?.status?.status ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}