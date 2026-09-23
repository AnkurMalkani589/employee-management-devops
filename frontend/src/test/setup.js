import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; the theme hook calls it on first load.
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// A resilient localStorage stub (some jsdom setups expose a partial object).
if (typeof window.localStorage?.getItem !== 'function') {
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  });
}

// jsdom does not implement IntersectionObserver, which the motion primitives
// (Reveal / Stagger / AnimatedCounter) rely on for viewport-triggered reveal.
// The stub immediately reports every observed element as intersecting, so
// content renders in tests exactly as it would once scrolled into view.
if (typeof window.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(element) {
      this.callback(
        [{ isIntersecting: true, target: element, intersectionRatio: 1 }],
        this,
      );
    }

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return [];
    }
  }

  window.IntersectionObserver = MockIntersectionObserver;
  globalThis.IntersectionObserver = MockIntersectionObserver;
}
