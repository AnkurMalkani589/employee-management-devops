/**
 * Centralized motion system.
 *
 * Every duration, easing, spring and stagger interval used anywhere in the UI
 * comes from here. Components must not define their own timing literals.
 */

export const duration = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
  cinematic: 0.7,
  /** Long-form animation, e.g. an animated counter settling on a value. */
  counter: 1.1,
} as const;

/**
 * Ambient background loop durations, in SECONDS.
 * These are intentionally long and slow. They live here (not in CSS) so the
 * whole motion system has a single source of truth; the stylesheet mirrors
 * them via the --dur-ambient-* custom properties in section 1.
 */
export const ambient = {
  driftA: 34,
  driftB: 42,
} as const;

/** Interaction geometry shared by the motion primitives (px / unitless). */
export const interaction = {
  /** Max pointer pull for <MagneticButton />, px. */
  magneticStrength: 6,
  /** Press-down scale for buttons. */
  tapScale: 0.98,
  /** Default lift for <SpotlightCard /> on hover, px. */
  cardLift: 3,
  /** Default spotlight radius, px. */
  spotlightRadius: 340,
  /** Default reveal distance for <StaggerItem />, px. */
  staggerDistance: 14,
} as const;

export const ease = {
  /** Standard out-easing for entrances. */
  out: [0.16, 1, 0.3, 1] as const,
  /** Symmetric in-out for state changes. */
  inOut: [0.4, 0, 0.2, 1] as const,
  /** Slight overshoot for confirmations. */
  emphasized: [0.22, 1, 0.36, 1] as const,
};

export const spring = {
  /** Snappy - small UI affordances. */
  ui: { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 },
  /** Softer - layout and panel transitions. */
  layout: { type: 'spring', stiffness: 260, damping: 30, mass: 1 },
  /** Gentle drift - ambient background motion. */
  ambient: { type: 'spring', stiffness: 60, damping: 24, mass: 1.2 },
} as const;

export const stagger = {
  tight: 0.04,
  base: 0.06,
  loose: 0.09,
} as const;

/** Viewport trigger config shared by all reveal components. */
export const viewport = {
  once: true,
  amount: 0.25,
  margin: '-80px',
} as const;

/**
 * Viewport trigger for a single focal element (e.g. a counter) that should
 * only start once it is clearly on screen.
 */
export const viewportFocus = {
  once: true,
  amount: 0.5,
} as const;

/** Common variants, kept declarative so sections feel consistent. */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
};

export const transition = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
} as const;
