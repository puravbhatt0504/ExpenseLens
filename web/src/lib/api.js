import axios from 'axios';

const api = axios.create({
  baseURL: 'https://server-seven-gamma-95.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const fetcher = url => api.get(url).then(res => res.data);

export default api;
