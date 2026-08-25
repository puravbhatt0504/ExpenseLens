import axios from 'axios';
import { getAccessToken, isAccessTokenExpiringSoon, refreshSession, hardLogout } from './auth';

const api = axios.create({
  baseURL: 'https://server-seven-gamma-95.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh', '/categories'];
const isPublic = (url) => PUBLIC_PATHS.some((p) => (url || '').startsWith(p));

// Refresh ahead of expiry before a request goes out, rather than waiting
// for a 401 — keeps the common case from ever seeing an auth error.
api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined' || isPublic(config.url)) {
    return config;
  }

  if (isAccessTokenExpiringSoon()) {
    await refreshSession();
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry exactly once on a TOKEN_EXPIRED response (covers the race where a
// request was already in flight when the token expired); anything else
// that comes back 401 means the session is unrecoverable, so log out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.code;

    if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && original && !original._retried) {
      original._retried = true;
      const refreshed = await refreshSession();
      if (refreshed) {
        original.headers.Authorization = `Bearer ${getAccessToken()}`;
        return api(original);
      }
    }

    if (error.response?.status === 401) {
      hardLogout();
    }

    return Promise.reject(error);
  }
);

export const fetcher = url => api.get(url).then(res => res.data);

export default api;
