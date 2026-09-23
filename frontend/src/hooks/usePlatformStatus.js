import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

/**
 * usePlatformStatus - polls the backend's real health endpoint.
 *
 * The only platform facts shown on the dashboard come from here; nothing is
 * synthesised. `api.health()` is the existing client method (GET /health via
 * the /api base), so no API contract changes.
 *
 * `checks` counts observed successful polls -> an honest "checked N times"
 * rather than a fabricated uptime percentage.
 */
export function usePlatformStatus({ intervalMs = 30000 } = {}) {
  const [status, setStatus] = useState(null);
  const [reachable, setReachable] = useState(null);
  const [checks, setChecks] = useState(0);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const mounted = useRef(true);

  const check = useCallback(async () => {
    try {
      const data = await api.health();
      if (!mounted.current) return;
      setStatus(data);
      setReachable(true);
      setChecks((c) => c + 1);
      setLastCheckedAt(new Date());
    } catch {
      if (!mounted.current) return;
      setReachable(false);
      setLastCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [check, intervalMs]);

  return { status, reachable, checks, lastCheckedAt, refresh: check };
}
