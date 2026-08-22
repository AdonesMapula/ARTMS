import api from '../services/api';

/**
 * Registry of dynamic route importers and their associated API endpoints for prefetching.
 */
const ROUTE_REGISTRY = {
  '/': {
    importComponent: () => import('../pages/Public/Home'),
    prefetchApis: ['/public/boot'],
  },
  '/jobs': {
    importComponent: () => import('../pages/Public/Jobs'),
    prefetchApis: ['/public/job-postings?per_page=12', '/public/boot'],
  },
  '/application-guide': {
    importComponent: () => import('../pages/Public/ApplicationGuide'),
    prefetchApis: [],
  },
  '/about': {
    importComponent: () => import('../pages/Public/About'),
    prefetchApis: [],
  },
  '/contact': {
    importComponent: () => import('../pages/Public/Contact'),
    prefetchApis: [],
  },
  '/login': {
    importComponent: () => import('../pages/Auth/Login'),
    prefetchApis: [],
  },
  '/admin/dashboard': {
    importComponent: () => import('../pages/Admin/Dashboard'),
    prefetchApis: ['/dashboard/admin', '/boot'],
  },
  '/admin/applicants': {
    importComponent: () => import('../pages/Admin/Applicants'),
    prefetchApis: ['/applicants?per_page=15'],
  },
  '/admin/ai-screening': {
    importComponent: () => import('../pages/Admin/AiScreening'),
    prefetchApis: ['/ai/applicants?per_page=50', '/ai/evaluations?per_page=50'],
  },
  '/admin/job-posting': {
    importComponent: () => import('../pages/Admin/JobPosting'),
    prefetchApis: ['/job-postings?per_page=15'],
  },
  '/admin/interviews': {
    importComponent: () => import('../pages/Admin/Interviews'),
    prefetchApis: ['/interviews?per_page=15'],
  },
  '/admin/pipeline': {
    importComponent: () => import('../pages/Admin/Pipeline'),
    prefetchApis: ['/applicants?per_page=300', '/job-postings?per_page=100'],
  },
};

const preloadedRoutes = new Set();

/**
 * Preload both the JavaScript chunk and API data for a specific route.
 * @param {string} routePath - The path to preload (e.g. '/jobs' or '/admin/ai-screening')
 */
export function preloadRoute(routePath) {
  if (!routePath || preloadedRoutes.has(routePath)) return;

  const normalized = routePath.split('?')[0].replace(/\/+$/, '') || '/';
  const entry = ROUTE_REGISTRY[normalized];

  if (!entry) return;

  preloadedRoutes.add(routePath);

  // 1. Preload Component Chunk
  try {
    entry.importComponent().catch(() => {});
  } catch {}

  // 2. Prefetch API Data
  if (entry.prefetchApis && entry.prefetchApis.length > 0) {
    entry.prefetchApis.forEach((endpoint) => {
      api.prefetch(endpoint);
    });
  }
}

/**
 * Automatically preload high-priority routes during browser idle time.
 * @param {string[]} routes - Array of route paths to preload during idle
 */
export function preloadIdleRoutes(routes = ['/jobs', '/application-guide', '/about', '/login']) {
  if (typeof window === 'undefined') return;

  const runPreload = () => {
    routes.forEach((route, idx) => {
      setTimeout(() => {
        preloadRoute(route);
      }, idx * 250); // Stagger by 250ms to keep main thread completely unblocked
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runPreload, { timeout: 3000 });
  } else {
    setTimeout(runPreload, 1500);
  }
}
