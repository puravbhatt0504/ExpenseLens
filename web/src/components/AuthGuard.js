'use client';

import { useEffect, useState } from 'react';
import { getRefreshToken, isAccessTokenExpiringSoon, refreshSession, hardLogout } from '@/lib/auth';

// How often to proactively re-check while the tab sits open and idle.
// Access tokens live 15 minutes server-side; checking every 5 keeps one
// comfortably ahead of expiry without hammering the refresh endpoint.
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Gates the dashboard behind a valid session, and keeps checking for as
 * long as the tab stays open — not just once on page load. Three triggers:
 * an interval while idle, a check whenever the tab regains focus (the
 * "left it open all day, came back" case), and a `storage` listener so
 * logging out in one tab logs out every other open tab.
 */
export default function AuthGuard({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (!getRefreshToken()) {
        hardLogout();
        return;
      }
      if (isAccessTokenExpiringSoon()) {
        const ok = await refreshSession();
        if (!ok) {
          hardLogout();
          return;
        }
      }
      if (!cancelled) setReady(true);
    }

    checkSession();

    const interval = setInterval(checkSession, CHECK_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onStorage = (e) => {
      if (e.key === 'refresh_token' && e.newValue === null) {
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!ready) return null;

  return children;
}
