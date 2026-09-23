import { useEffect, useState } from 'react';

/**
 * Minimal hash-based router (no dependency).
 *
 * Route keys map to pages; the hash (#/employees) is the source of truth, so
 * deep links work and the browser back/forward buttons behave. Kept tiny and
 * dependency-free on purpose.
 */
export function useHashRoute(defaultRoute = 'dashboard') {
  const parse = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    return hash || defaultRoute;
  };

  const [route, setRoute] = useState(parse);

  useEffect(() => {
    const onHashChange = () => setRoute(parse());
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = `#/${defaultRoute}`;
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (next) => {
    window.location.hash = `#/${next}`;
  };

  return [route, navigate];
}
