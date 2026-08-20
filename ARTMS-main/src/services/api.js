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
      const isPublicPage =
        window.location.pathname.startsWith('/interview/') ||
        window.location.pathname.startsWith('/jobs') ||
        window.location.pathname === '/';

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

// ── High-Performance In-Memory Cache & In-Flight Deduplication Store ────────
const cacheStore = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds default TTL

/**
 * Invalidate specific cache keys or clear all cache.
 * @param {string} [pattern] - Optional URL keyword pattern to clear
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
 * Targeted domain-based cache invalidator on mutations (POST/PUT/PATCH/DELETE)
 */
const autoInvalidateForUrl = (url = "") => {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('applicant')) {
    clearApiCache('applicant');
    clearApiCache('pipeline');
    clearApiCache('dashboard');
    clearApiCache('sidebar');
  } else if (lowerUrl.includes('interview')) {
    clearApiCache('interview');
    clearApiCache('pipeline');
    clearApiCache('dashboard');
    clearApiCache('sidebar');
  } else if (lowerUrl.includes('job-posting') || lowerUrl.includes('job_posting')) {
    clearApiCache('job-posting');
    clearApiCache('job_posting');
    clearApiCache('dashboard');
    clearApiCache('sidebar');
  } else if (lowerUrl.includes('job-library') || lowerUrl.includes('job_library')) {
    clearApiCache('job-library');
    clearApiCache('job_library');
  } else if (lowerUrl.includes('employee')) {
    clearApiCache('employee');
    clearApiCache('dashboard');
  } else if (lowerUrl.includes('department')) {
    clearApiCache('department');
    clearApiCache('dashboard');
    clearApiCache('boot');
  } else if (lowerUrl.includes('permission') || lowerUrl.includes('role')) {
    clearApiCache('permission');
    clearApiCache('role');
    clearApiCache('boot');
  } else if (lowerUrl.includes('manpower')) {
    clearApiCache('manpower');
    clearApiCache('dashboard');
    clearApiCache('sidebar');
  } else if (lowerUrl.includes('leave') || lowerUrl.includes('attendance')) {
    clearApiCache('leave');
    clearApiCache('attendance');
    clearApiCache('dashboard');
  } else {
    // Fallback: clear entire store for unclassified mutations
    clearApiCache();
  }
};

// ── Wrap api.get with Request Deduplication & High-Performance Caching ─────
const originalGet = api.get;
api.get = function (url, config = {}) {
  // Skip caching if explicitly configured or for real-time streaming endpoints
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

  // Return cached result if fresh
  if (cached && Date.now() - cached.timestamp < (config.ttl || DEFAULT_TTL_MS)) {
    return Promise.resolve(cached.response);
  }

  // Deduplicate identical in-flight network requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = originalGet.call(this, url, config)
    .then((response) => {
      cacheStore.set(cacheKey, {
        timestamp: Date.now(),
        response,
      });
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
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
