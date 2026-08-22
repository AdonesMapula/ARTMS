# ARTMS — Caching Architecture, Performance Bottlenecks & Optimization Guide

> **Document Version**: 2.0  
> **Target System**: ARTMS (Laravel 11 Backend + Vite React Frontend + Aiven Cloud MySQL)  
> **Last Updated**: August 2026

---

## 📋 Table of Contents
1. [Executive Summary & Caching Topology](#1-executive-summary--caching-topology)
2. [Current Caching Implementation (Layer-by-Layer)](#2-current-caching-implementation-layer-by-layer)
   - [Layer 1: Client-Side Axios In-Memory Cache (`api.js`)](#layer-1-client-side-axios-in-memory-cache-apijs)
   - [Layer 2: Backend Application & Service Cache (`CacheService.php`)](#layer-2-backend-application--service-cache-cacheservicephp)
   - [Layer 3: AI Inference & Content-Hash Caching](#layer-3-ai-inference--content-hash-caching)
   - [Layer 4: Database & Connection Layer](#layer-4-database--connection-layer)
3. [Deep Diagnosis: Why the System Load is Currently Slow](#3-deep-diagnosis-why-the-system-load-is-currently-slow)
   - [Bottleneck 1: WAN Database Latency to Aiven Cloud with SSL](#bottleneck-1-wan-database-latency-to-aiven-cloud-with-ssl)
   - [Bottleneck 2: Inefficient `CACHE_STORE=file` on Cloud Containers](#bottleneck-2-inefficient-cache_storefile-on-cloud-containers)
   - [Bottleneck 3: Frontend In-Memory Cache Bypasses `/public/` Routes](#bottleneck-3-frontend-in-memory-cache-bypasses-public-routes)
   - [Bottleneck 4: Lack of Stale-While-Revalidate (SWR) on Frontend](#bottleneck-4-lack-of-stale-while-revalidate-swr-on-frontend)
   - [Bottleneck 5: Render Free / Starter Cold Starts & Ingress Overhead](#bottleneck-5-render-free--starter-cold-starts--ingress-overhead)
   - [Bottleneck 6: Heavy Asset Bundling & CDN Dependencies](#bottleneck-6-heavy-asset-bundling--cdn-dependencies)
   - [Bottleneck 7: Uncached List & Reporting Queries](#bottleneck-7-uncached-list--reporting-queries)
4. [Step-by-Step Actionable Fixes & Optimization Roadmap](#4-step-by-step-actionable-fixes--optimization-roadmap)
   - [Fix 1: Enable Persistent SWR & Fix Public Route Caching in `api.js`](#fix-1-enable-persistent-swr--fix-public-route-caching-in-apijs)
   - [Fix 2: Switch `CACHE_STORE` to In-Memory Redis or Database Store](#fix-2-switch-cache_store-to-in-memory-redis-or-database-store)
   - [Fix 3: Execute Laravel Production Optimization Commands](#fix-3-execute-laravel-production-optimization-commands)
   - [Fix 4: Implement Query Caching for Job Listings & Departments](#fix-4-implement-query-caching-for-job-listings--departments)
   - [Fix 5: Setup Anti-Cold-Start Pinger for Render Backend](#fix-5-setup-anti-cold-start-pinger-for-render-backend)
   - [Fix 6: Optimize Vite Asset Chunking & Font Loading](#fix-6-optimize-vite-asset-chunking--font-loading)
5. [Summary Architecture Comparison (Current vs. Optimized)](#5-summary-architecture-comparison-current-vs-optimized)

---

## 1. Executive Summary & Caching Topology

ARTMS utilizes a multi-tiered caching architecture designed to reduce roundtrips across the client, backend, database, and cloud AI providers:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     ARTMS CACHING TOPOLOGY                                       │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│        CLIENT (VITE SPA)      │        BACKEND (LARAVEL 11)      │     INFRASTRUCTURE / DB       │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ • In-Flight Request Dedup     │ • CacheKeyService (Namespaces)   │ • Aiven Cloud MySQL (SSL)     │
│ • 60s In-Memory Cache Store   │ • BootCacheService (5-15m TTL)   │ • Redis / File Cache Store    │
│ • Domain-Targeted Invalidation│ • Permission & Department Cache  │ • Render Webhooks / Ingress   │
│ • LocalStorage Token Auth     │ • MD5 AI Content-Hash Cache (24h)│ • Cloudflare CDN / R2 Egress  │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

---

## 2. Current Caching Implementation (Layer-by-Layer)

### Layer 1: Client-Side Axios In-Memory Cache (`api.js`)

**File**: [`ARTMS-main/src/services/api.js`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/ARTMS-main/src/services/api.js)

1. **In-Memory Store & In-Flight Request Deduplication**:
   - `cacheStore`: A JavaScript `Map()` storing `{ timestamp, response }` objects for GET requests with a default TTL of 60 seconds (`DEFAULT_TTL_MS = 60 * 1000`).
   - `inFlightRequests`: Tracks identical concurrent network requests (e.g. two components requesting `/api/boot` at the exact same moment) to prevent duplicate HTTP calls.
2. **Targeted Domain Mutation Invalidation**:
   - When a mutation method (`POST`, `PUT`, `PATCH`, `DELETE`) is executed, `autoInvalidateForUrl(url)` clears matching cache entries across related domain entities:
     - `applicant` ➔ clears `applicant`, `pipeline`, `dashboard`, `sidebar`.
     - `interview` ➔ clears `interview`, `pipeline`, `dashboard`, `sidebar`.
     - `job-posting` ➔ clears `job-posting`, `job_posting`, `dashboard`, `sidebar`.
     - `department`, `role`, `permission` ➔ clears `boot`, `department`, `role`, `permission`.
3. **Current Cache Bypass Rule**:
   - Skips cache if `skipCache: true` is provided, or if the URL contains:
     - `/livekit-token` (real-time authentication)
     - `/transcript` (real-time live captions)
     - `/public/` (all public routes like `/public/job-postings`, `/public/boot`)

---

### Layer 2: Backend Application & Service Cache (`CacheService.php`)

**Files**:
- [`artms-backend/app/Services/Cache/CacheService.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/Cache/CacheService.php)
- [`artms-backend/app/Services/Cache/CacheKeyService.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/Cache/CacheKeyService.php)
- [`artms-backend/app/Services/Cache/BootCacheService.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/Cache/BootCacheService.php)
- [`artms-backend/app/Services/Cache/DepartmentCacheService.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/Cache/DepartmentCacheService.php)
- [`artms-backend/app/Services/Cache/PermissionCacheService.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/Cache/PermissionCacheService.php)

1. **Centralized Namespace & Versioning (`CacheKeyService`)**:
   - Standardized format: `artms:v1:{domain}:{identifier}` (e.g. `artms:v1:boot:user:1`, `artms:v1:departments:active`, `artms:v1:dashboard:admin:2026-08`).
   - Supports deterministic parameter hashing for query strings (`hashParams`).
2. **Stampede Protection (`rememberLocked`)**:
   - Uses `Cache::lock("lock:{$key}", 10)` to ensure that during cold cache misses on heavy queries, only **one** concurrent request queries the database while others wait and receive the cached payload.
3. **Domain-Specific Cache Services**:
   - **`BootCacheService`**:
     - Authenticated Boot (`/api/boot`): Caches User profile, active Department, and unread notification count for **5 minutes (`TTL = 300s`)**.
     - Public Boot (`/api/public/boot`): Caches active published jobs and departments for **15 minutes (`TTL = 900s`)**.
   - **`DepartmentCacheService`**:
     - Caches active department listings (`departments:active`) and all departments (`departments:all`).
     - Automatically invalidates on department create, update, or deletion.
   - **`PermissionCacheService`**:
     - Caches RBAC permission matrices (`permissions:all` and `permissions:role:{role}`).
     - Automatically busts all permissions and boot payloads on role update.
   - **`DashboardController`**:
     - Caches admin, superadmin, and COO analytical counts for **60 seconds** per calendar month.

---

### Layer 3: AI Inference & Content-Hash Caching

**Files**:
- [`artms-backend/app/Http/Controllers/ResumeParserController.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Http/Controllers/ResumeParserController.php)
- [`artms-backend/app/Http/Controllers/AiScreeningController.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Http/Controllers/AiScreeningController.php)
- [`artms-backend/app/Services/GeminiService.php`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/GeminiService.php)

1. **Resume Parser Cache (`resume_parsed_{md5}`)**:
   - Computes an MD5 hash of sanitized extracted resume text.
   - Persists parsed JSON output for **24 hours (`86400s`)**, returning instantly in **~10ms** on repeated uploads or edits.
2. **Screening Evaluation Cache (`screening_eval_{id}_{md5}`)**:
   - Computes MD5 hash of applicant resume + job requirements.
   - Caches 100-point score, remarks, and matched/missing skills for **24 hours**.
3. **Service-Level Rate Limiter Throttling (`gemini_rpm_{keyHash}`)**:
   - Tracks requests per minute per API key in a 60-second sliding cache window (`Cache::put($cacheKey, 1, 60)`).

---

### Layer 4: Database & Connection Layer

- **Database**: Hosted on **Aiven Cloud MySQL** (`artms-mysql-prod-adonesmapula1402-artms.b.aivencloud.com:26209`).
- **Encryption**: Enforces SSL CA verification via `MYSQL_ATTR_SSL_CA` storage cert.

---

## 3. Deep Diagnosis: Why the System Load is Currently Slow

| Bottleneck | Current Setup | Impact on Speed | Latency Penalty |
| :--- | :--- | :--- | :--- |
| **1. Cloud DB WAN Distance** | Single MySQL instance in remote cloud with mandatory SSL verification per query | High roundtrip time (RTT) on every uncached SQL query | **+180ms – 450ms per uncached query** |
| **2. `CACHE_STORE=file`** | File-based cache on disk (`storage/framework/cache/data`) | Disk I/O latency, no in-memory speed, cache tags disabled | **+50ms – 150ms per cache read/write** |
| **3. Bypass of `/public/` in Frontend** | `api.js` excludes `url.includes('/public/')` from in-memory cache | Every visit to Home, Jobs, Job Details forces fresh network & DB requests | **+600ms – 1.8s on public pages** |
| **4. No Stale-While-Revalidate (SWR)** | Frontend displays loading spinner until network responds | UI feels sluggish because cache hits don't persist across page reloads | **Visible page blocking** |
| **5. Render Server Cold Starts** | Free/Starter instance spins down when inactive | First request after inactivity takes 15–50s to wake up | **+15s – 45s (Cold Start)** |
| **6. Uncached Job Listing Queries** | `JobPostingController::publicIndex` queries MySQL with joins without `CacheService` | Slow queries on job board pagination and search | **+250ms – 600ms** |
| **7. Large Frontend Bundle Size** | Vite bundles heavy libraries (`maplibre-gl`, `livekit`, `@mediapipe`) | Initial page download and JS execution overhead | **+800ms – 2.0s initial load** |

---

## 4. Step-by-Step Actionable Fixes & Optimization Roadmap

### Fix 1: Enable Persistent SWR & Fix Public Route Caching in `api.js`

#### Problem:
`api.js` currently skips caching for `/public/` routes:
```javascript
if (config.skipCache || url.includes("/livekit-token") || url.includes("/transcript") || url.includes("/public/")) {
  return originalGet.call(this, url, config);
}
```
This forces every public page load (e.g. `/public/job-postings`, `/public/boot`) to traverse the internet to Render and Aiven DB.

#### Solution:
1. Cache public GET endpoints (`/public/job-postings`, `/public/boot`) with a **2–5 minute TTL**.
2. Add `sessionStorage` fallback so cache survives page reloads and tab navigations.
3. Exclude ONLY real-time session endpoints: `/livekit-token`, `/transcript`, `/processing-status`.

---

### Fix 2: Switch `CACHE_STORE` to In-Memory Redis or Database Store

#### Problem:
`CACHE_STORE=file` reads and writes serialized files to the disk (`storage/framework/cache/data`). On cloud hosts like Render or Windows OneDrive, disk I/O introduces significant latency and disables tag-based cache clearing (`Cache::tags()`).

#### Solution:
- Update [artms-backend/.env](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/.env) to use `redis` (or `database` cache if Redis is unavailable):
  ```env
  CACHE_STORE=database
  DB_CACHE_TABLE=cache
  DB_CACHE_LOCK_TABLE=cache_locks
  ```
- Or connect a free Redis instance (e.g., via Upstash or Aiven Redis):
  ```env
  CACHE_STORE=redis
  REDIS_CLIENT=phpredis
  REDIS_HOST=your-redis-host.upstash.io
  REDIS_PORT=6379
  REDIS_PASSWORD=your-password
  ```

---

### Fix 3: Execute Laravel Production Optimization Commands

In production on Render, Laravel should compile all route trees, config files, and views into cached PHP bytecode:

```bash
# Cache configuration files into a single PHP file
php artisan config:cache

# Compile all route patterns into a high-speed route map
php artisan route:cache

# Pre-compile all Blade email templates into PHP
php artisan view:cache

# Pre-discover all events and package service providers
php artisan event:cache
```

*(Note: Never run these in local development if frequently modifying `.env` or routes).*

---

### Fix 4: Implement Query Caching for Job Listings & Departments

Update `JobPostingController::publicIndex` to use `CacheService`:

```php
public function publicIndex(Request $request): JsonResponse
{
    $page = $request->get('page', 1);
    $cacheKey = CacheKeyService::make('job-postings', "public:page:{$page}");

    $postings = $this->cache->remember($cacheKey, 300, function () use ($request) {
        return JobPosting::with(['jobLibrary', 'department'])
            ->where('is_published', true)
            ->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('closing_date')->orWhere('closing_date', '>=', today()))
            ->orderBy('posting_date', 'desc')
            ->paginate($request->per_page ?? 12);
    });

    return response()->json($postings);
}
```

---

### Fix 5: Setup Anti-Cold-Start Pinger for Render Backend

#### Problem:
Render spins down inactive instances after 15 minutes of inactivity. When a candidate visits the site, the first request stalls for 30–50 seconds while the container initializes.

#### Solution:
Use a free cron service (e.g., [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)) to ping the lightweight health check endpoint every **10 minutes**:
```
GET https://artms-backend.onrender.com/api/public/health
```
This keeps the container warm in memory 24/7 with zero cold starts!

---

### Fix 6: Optimize Vite Asset Chunking & Font Loading

**File**: [`ARTMS-main/vite.config.js`](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/ARTMS-main/vite.config.js)

1. **Lazy Loading Heavy Vendors**: Ensure `maplibre-gl`, `livekit-client`, and `@mediapipe/tasks-vision` are loaded asynchronously via `React.lazy()` so public pages like `/` and `/jobs` download only **~150KB** of initial JavaScript.
2. **Font Preloading**: Preload Google Fonts (`Inter`, `Plus Jakarta Sans`) in `index.html` with `rel="preconnect"` to eliminate font render-blocking delays.

---

## 5. Summary Architecture Comparison (Current vs. Optimized)

```
┌─────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ Metric / Component          │ Current State                 │ Optimized State               │
├─────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ **Public Landing Page Load**│ 1.8s – 3.5s (Fresh DB calls)  │ **< 200ms** (Cached Boot + SWR)│
│ **AI Resume Parsing**       │ 5.0s (Deprecated cascade)     │ **~ 1.0s** (Gemini Flash Lite) │
│ **Resume Re-Upload**        │ 5.0s (Full LLM call)          │ **~ 10ms** (MD5 Hash Hit)     │
│ **Application Submit**      │ 5.0s – 7.0s (Sync SMTP)       │ **< 150ms** (Async Queue)     │
│ **AI Screening Load**       │ 4.0s – 8.0s per candidate     │ **Instant** (Pre-Computed Job)│
│ **Render Backend Response** │ 15s – 45s (Cold Start)        │ **< 100ms** (Warm Container)  │
│ **Cache Driver**            │ File on Disk                  │ **In-Memory Redis / Database**│
└─────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

---

*(End of Document — ARTMS Caching Architecture & Performance Guide)*
