import axios from 'axios';

/**
 * Base Axios instance for all ARTMS API calls.
 * Reads the backend URL from .env — set VITE_API_URL in your .env file.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: false, // Bearer token auth — no cookies needed
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request Interceptor ─────────────────────────────────────────────────────
// Attach the Sanctum token from localStorage to every request automatically.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('artms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────────────────────
// Redirect to login on 401 (expired/invalid token).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('artms_token');
      localStorage.removeItem('artms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
