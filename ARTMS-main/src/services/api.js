import axios from 'axios';

/**
 * Base Axios instance for all ARTMS API calls.
 * Reads the backend URL from .env — set VITE_API_URL in your .env file.
 */
const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.replace(/\/api\/api$/, '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
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

// ── In-Memory API Cache & Invalidation System ──────────────────────────────
const cacheStore = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Invalidate specific cache keys or clear all cache.
 * @param {string} [pattern] - Optional URL keyword pattern to clear (e.g., "applicants", "interviews")
 */
export const clearApiCache = (pattern) => {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  const lowerPattern = pattern.toLowerCase();
  for (const key of cacheStore.keys()) {
    if (key.toLowerCase().includes(lowerPattern)) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Auto-clear related caches when a mutation occurs.
 * We clear everything to guarantee perfectly fresh data across all tables and dashboards.
 */
const autoInvalidateForUrl = (url = "") => {
  clearApiCache(); // Clear everything on any mutation
};

// ── Wrap api.get for seamless caching ──────────────────────────────────────
const originalGet = api.get;
api.get = function (url, config = {}) {
  // Skip caching if explicitly configured or for real-time endpoints
  if (
    config.skipCache ||
    url.includes("/livekit-token") ||
    url.includes("/transcript") ||
    url.includes("/public/")
  ) {
    return originalGet.call(this, url, config);
  }

  const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`;
  const cached = cacheStore.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < (config.ttl || DEFAULT_TTL_MS)) {
    return Promise.resolve(cached.response);
  }

  return originalGet.call(this, url, config).then((response) => {
    cacheStore.set(cacheKey, {
      timestamp: Date.now(),
      response,
    });
    return response;
  });
};

// ── Wrap mutation methods (post, put, patch, delete) for auto-invalidation ──
["post", "put", "patch", "delete"].forEach((method) => {
  const originalMethod = api[method];
  api[method] = function (url, data, config) {
    autoInvalidateForUrl(url);
    return originalMethod.call(this, url, data, config);
  };
});

export default api;
