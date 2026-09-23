
import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import type { ReactNode } from 'react';
import { spring, interaction } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** Maximum pull distance toward the pointer, in px. */
  strength?: number;
  type?: 'button' | 'submit';
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * MagneticButton - button that leans slightly toward the pointer.
 * The pull is small (<= 6px by default) so it reads as responsiveness, not
 * gimmickry. Renders as a plain button under reduced motion.
 */
export function MagneticButton({
  children,
  className = '',
  onClick,
  strength = interaction.magneticStrength,
  type = 'button',
  disabled = false,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), spring.ui);
  const y = useSpring(useMotionValue(0), spring.ui);

  function onMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={reduced ? undefined : { x, y }}
      whileTap={reduced ? undefined : { scale: interaction.tapScale }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
