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
  const started = useRef(false);

  // Visibility gate. Motion's `useInView` is used when it reports true, but it
  // is never the only path: if the element is laid out on screen we consider it
  // visible. Measured on mount and whenever the value changes.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.getBoundingClientRect !== 'function') return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    setOnScreen(rect.top < vh && rect.bottom > 0);
  }, [value, reduced]);

  const visible = inView || onScreen || value > 0;

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return undefined;
    }
    if (!visible) return undefined;

    // Re-run only when the value actually changes (e.g. 0 -> loaded).
    let raf = 0;
    const from = started.current ? display : 0;
    const to = value;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else started.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `display` is intentionally excluded: it is the animated output, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value, duration, reduced]);

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
