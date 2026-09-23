import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { duration, ease, interaction, stagger, viewport } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

interface StaggerProps {
  children: ReactNode;
  /** Interval between children, in seconds. Defaults to `stagger.base`. */
  interval?: number;
  /** Initial delay before the first child. */
  delay?: number;
  className?: string;
}

/** StaggerContainer - parent that orchestrates child entrance timing. */
export function StaggerContainer({
  children,
  interval = stagger.base,
  delay = 0,
  className,
}: StaggerProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : interval,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** StaggerItem - a child of StaggerContainer; inherits the orchestration. */
export function StaggerItem({
  children,
  className,
  distance = interaction.staggerDistance,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  as?: 'div' | 'article' | 'li' | 'section';
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  const variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
      hidden: { opacity: 0, y: distance },
      visible: {
        opacity: 1,
        y: 0,
          transition: { duration: duration.slow, ease: ease.out },
      },
    };

  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
