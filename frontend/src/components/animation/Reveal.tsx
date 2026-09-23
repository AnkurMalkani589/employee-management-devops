import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { duration, ease, viewport } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSETS: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 18 },
  down: { y: -18 },
  left: { x: 18 },
  right: { x: -18 },
  none: {},
};

interface RevealProps {
  children: ReactNode;
  /** Delay before the entrance, in seconds. */
  delay?: number;
  direction?: Direction;
  /** Entrance distance override, in px. */
  distance?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li' | 'header';
}

/**
 * Reveal - viewport-triggered entrance used by every major section.
 * Falls back to a plain fade when the user prefers reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  distance,
  className,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion();
  const offset = OFFSETS[direction];
  const from = {
    opacity: 0,
    x: distance !== undefined ? (offset.x ? Math.sign(offset.x) * distance : 0) : offset.x ?? 0,
    y: distance !== undefined ? (offset.y ? Math.sign(offset.y) * distance : 0) : offset.y ?? 0,
  };
  const to = { opacity: 1, x: 0, y: 0 };
  const MotionTag = motion[as];

  if (reduced) {
    return (
      <MotionTag
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewport}
        transition={{ duration: duration.fast }}
      >
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={from}
      whileInView={to}
      viewport={viewport}
      transition={{ duration: duration.slow, ease: ease.out, delay }}
    >
      {children}
    </MotionTag>
  );
}
