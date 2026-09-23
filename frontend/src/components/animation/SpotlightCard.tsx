import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { duration, ease, interaction } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Glow radius in px. */
  radius?: number;
  /** Radial glow colour. */
  glow?: string;
  /** Lift distance on hover, in px. */
  lift?: number;
  as?: 'div' | 'article' | 'section';
}

/**
 * SpotlightCard - surface with a pointer-following radial highlight.
 *
 * The glow is a CSS custom property updated on pointer move (no React state on
 * every pixel - only two refs are written), so it stays cheap. It also lifts a
 * couple of pixels and deepens its shadow on hover. All motion is dropped under
 * reduced-motion, leaving a static bordered surface.
 */
export function SpotlightCard({
  children,
  className = '',
  radius = interaction.spotlightRadius,
  /** Radial glow colour. Defaults to the --spotlight design token so the glow
   *  stays in sync with the theme rather than hard-coding an RGB literal. */
  glow = 'var(--spotlight)',
  lift = interaction.cardLift,
  as = 'div',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref}
      className={`spotlight-card ${className}`}
      onPointerMove={reduced ? undefined : onMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      animate={{
        y: !reduced && hovered ? -lift : 0,
      }}
      transition={{ duration: duration.base, ease: ease.out }}
      style={
        {
          '--spot-radius': `${radius}px`,
          '--spot-color': glow,
        } as React.CSSProperties
      }
      data-hovered={hovered}
    >
      {children}
    </MotionTag>
  );
}
