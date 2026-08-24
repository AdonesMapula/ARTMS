import axios from 'axios';

/**
 * Base Axios instance for all ARTMS API calls.
 * Reads the backend URL from .env — set VITE_API_URL in your .env file.
 * Automatically guarantees the base URL always ends with `/api`.
 */
const getBaseApiUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (!envUrl) {
    return '/api';
  }
  if (envUrl.endsWith('/api')) {
    return envUrl;
  }
  return `${envUrl}/api`;
};

export const API_BASE_URL = getBaseApiUrl();

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

// ── Multi-Tier High-Performance Cache & In-Flight Request Deduplication ────
const cacheStore = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds default TTL
const SESSION_CACHE_PREFIX = 'artms_cache_';

/**
 * Read from SessionStorage cache if in-memory cache missed
 */
const getSessionCache = (key, ttl) => {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp < ttl) {
      return item.response;
    }
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + key);
  } catch {
    // Ignore storage parse issues
  }
  return null;
};

/**
 * Write to SessionStorage cache
 */
const setSessionCache = (key, response) => {
  try {
    // Only store standard JSON objects, skip large binaries
    if (response && response.data && typeof response.data === 'object') {
      sessionStorage.setItem(
        SESSION_CACHE_PREFIX + key,
        JSON.stringify({ timestamp: Date.now(), response: { data: response.data, status: response.status } })
      );
    }
  } catch {
    // Ignore quota exceed errors
  }
};

/**
 * Invalidate specific cache keys or clear all cache.
 * @param {string} [pattern] - Optional URL keyword pattern to clear
 */
export const clearApiCache = (pattern) => {
  if (!pattern) {
    cacheStore.clear();
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith(SESSION_CACHE_PREFIX)) sessionStorage.removeItem(k);
      });
    } catch {}
    return;
  }
  const lowerPattern = pattern.toLowerCase();
  for (const key of cacheStore.keys()) {
    if (key.toLowerCase().includes(lowerPattern)) {
      cacheStore.delete(key);
    }
  }
  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith(SESSION_CACHE_PREFIX) && k.toLowerCase().includes(lowerPattern)) {
        sessionStorage.removeItem(k);
      }
    });
  } catch {}
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
    clearApiCache('public/job-postings');
    clearApiCache('boot');
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
  // Only skip real-time streaming endpoints or explicit skipCache flags
  const isRealtimeEndpoint =
    config.skipCache ||
    url.includes("/livekit-token") ||
    url.includes("/transcript") ||
    url.includes("/processing-status");

  if (isRealtimeEndpoint) {
    return originalGet.call(this, url, config);
  }

  const ttl = config.ttl || (url.includes('/public/') ? 120 * 1000 : DEFAULT_TTL_MS);
  const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`;

  // 1. Level 1: In-Memory Memory Cache Hit (0ms)
  const cached = cacheStore.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.response);
  }

  // 2. Level 2: SessionStorage Cache Hit (0ms after page refresh)
  const sessionCached = getSessionCache(cacheKey, ttl);
  if (sessionCached) {
    cacheStore.set(cacheKey, { timestamp: Date.now(), response: sessionCached });
    return Promise.resolve(sessionCached);
  }

  // 3. Deduplicate identical in-flight network requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = originalGet.call(this, url, config)
    .then((response) => {
      cacheStore.set(cacheKey, {
        timestamp: Date.now(),
        response,
      });
      setSessionCache(cacheKey, response);
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

/**
 * Preload an API endpoint into cache ahead of time (e.g. on mouse hover or idle)
 */
api.prefetch = function (url, config = {}) {
  const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`;
  const ttl = config.ttl || (url.includes('/public/') ? 120 * 1000 : DEFAULT_TTL_MS);

  if (cacheStore.has(cacheKey) || inFlightRequests.has(cacheKey) || getSessionCache(cacheKey, ttl)) {
    return; // Already cached or in-flight
  }

  // Run in background without blocking UI
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => api.get(url, config).catch(() => {}));
  } else {
    setTimeout(() => api.get(url, config).catch(() => {}), 50);
  }
};

/**
 * Stale-While-Revalidate: Immediately return cached data if present, while fetching fresh in background
 */
api.staleWhileRevalidate = async function (url, config = {}, onUpdate = null) {
  const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`;
  const cached = cacheStore.get(cacheKey) || getSessionCache(cacheKey, 600000);

  if (cached && onUpdate) {
    onUpdate(cached.data || cached);
  }

  const res = await originalGet.call(this, url, config);
  cacheStore.set(cacheKey, { timestamp: Date.now(), response: res });
  setSessionCache(cacheKey, res);

  if (onUpdate) {
    onUpdate(res.data);
  }
  return res;
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
