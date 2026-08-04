import axios from 'axios';

/**
 * Base Axios instance for all ARTMS API calls.
 * Reads the backend URL from .env — set VITE_API_URL in your .env file.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
// Redirect to login on 401 (expired/invalid token) except for public routes/pages.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "An unexpected error occurred.";

    if (status === 401) {
      const isPublicUrl = error.config?.url?.includes('/public/');
      const isPublicPage = window.location.pathname.startsWith('/interview/') || window.location.pathname.startsWith('/jobs') || window.location.pathname === '/';
      
      if (!isPublicUrl && !isPublicPage) {
        localStorage.removeItem('artms_token');
        localStorage.removeItem('artms_user');
        window.location.href = '/login';
      }
    } else if (error.config?.silent !== true) {
      // Trigger visual error toast alert unless explicitly suppressed
      if (status >= 400 && status !== 404) {
        window.artmsToast?.error(
          status === 403 ? "Access Denied" : status === 422 ? "Validation Error" : "System Error",
          message
        );
      }
    }

    return Promise.reject(error);
  },
);

export default api;
