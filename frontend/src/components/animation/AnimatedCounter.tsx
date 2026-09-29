import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { duration as motionDuration, viewportFocus } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

interface AnimatedCounterProps {
  /** The final value to count up to. */
  value: number;
  /** Animation length in seconds. */
  duration?: number;
  /** Fixed decimal places. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * AnimatedCounter - counts from 0 to `value` once, when scrolled into view.
 *
 * Uses requestAnimationFrame with an ease-out curve (cheap, no reflow storm)
 * and renders the final value immediately under reduced motion.
 */
export function AnimatedCounter({
  value,
  duration = motionDuration.counter,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, viewportFocus);
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return undefined;
    }
    if (!inView) return undefined;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
