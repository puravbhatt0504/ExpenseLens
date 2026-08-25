import axios from 'axios';

const BASE_URL = 'https://server-seven-gamma-95.vercel.app';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const EXPIRES_KEY = 'access_expires_at';

// A plain axios instance with none of api.js's interceptors — refreshing
// must never recurse back through the interceptor stack that calls it.
const authApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setSession({ accessToken, refreshToken, expiresIn }) {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem('token'); // legacy key from before server-issued sessions
}

export function isAccessTokenExpiringSoon(skewMs = 60000) {
  if (typeof window === 'undefined') return true;
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY));
  if (!expiresAt) return true;
  return Date.now() > expiresAt - skewMs;
}

let refreshPromise = null;

/**
 * Attempts to refresh the session. Single-flighted: concurrent callers
 * (several SWR hooks firing on the same page load) share one network call
 * instead of racing separate refreshes.
 */
export function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const { data } = await authApi.post('/auth/refresh', { refreshToken, device: 'web' });
    setSession(data);
    return true;
  } catch {
    return false;
  }
}

export async function loginWithGoogleIdToken(idToken) {
  const { data } = await authApi.post('/auth/login', { idToken, device: 'web' });
  setSession(data);
  return data.user;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.post('/auth/logout', { refreshToken });
    } catch {
      // Clear locally regardless of whether the revoke call reached the server.
    }
  }
  clearSession();
}

/**
 * The session could not be refreshed — expired, revoked, or reuse was
 * detected. Clears everything and sends the user back to login with a
 * message, from wherever in the app this was called.
 */
export function hardLogout() {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/login?reason=expired';
  }
}
