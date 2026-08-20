# ARTMS Full-Stack Performance & Load Balancing Guide

This document outlines the performance architecture, caching strategies, and load balancing setup implemented for the ARTMS platform.

---

## 1. High-Performance Architecture Overview

```
                        [ Internet / Clients ]
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │   Nginx Load Balancer (LB)   │
                   │  - Gzip / Brotli Compression │
                   │  - Microcaching (5s TTL)     │
                   │  - Rate Limiting Zones       │
                   │  - Keepalive Connection Pool │
                   └──────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Laravel API #1  │    │  Laravel API #2  │    │  Laravel API #3  │
│  Port: 8001      │    │  Port: 8002      │    │  Port: 8003      │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │   Redis 7 (LRU)   │           │     MySQL 8.0     │
       │ - Shared Sessions │           │ - Composite Idxs  │
       │ - Boot Payloads   │           │ - Query Cache     │
       │ - Stats Cache     │           │ - InnoDB Pool     │
       └───────────────────┘           └───────────────────┘
```

---

## 2. Implemented Optimizations Summary

### A. Frontend Layer (`ARTMS-main`)
1. **Instant Loading**: Removed the artificial 3-second delay in `AuthContext.jsx`.
2. **Dynamic Route Splitting (`React.lazy`)**: Split 50+ monolithic page imports into on-demand asynchronous modules, reducing initial download payload to **~31 kB gzipped**.
3. **Optimized Vendor Chunks**: Split libraries into distinct cacheable units:
   - `vendor-react` (React 19, React Router 7)
   - `vendor-icons` (Lucide React, React Icons)
   - `vendor-charts` (Recharts)
   - `vendor-livekit` (LiveKit Client & UI)
   - `vendor-vision` (MediaPipe Tasks Vision)
   - `vendor-maps` (MapLibre GL)
4. **In-Flight Request Deduplication**: Multiple simultaneous API calls for the same resource now share a single promise in memory.
5. **Targeted Cache Invalidation**: Mutations only invalidate affected domain caches rather than wiping the entire store.

### B. Backend API Layer (`artms-backend`)
1. **Dashboard Caching**:
   - `adminStats`: 60s cache with tag invalidation.
   - `superAdminStats`: 120s cache with unified SQL aggregation replacing 25+ loop queries.
   - `cooStats` & `departmentHeadStats`: 60s cache.
   - `sidebarCounts`: 30s user-scoped memory cache for badge counts.
2. **Entity & Lookup Caching**:
   - `DepartmentCacheService` hooked directly into `DepartmentController`.
   - `PermissionCacheService` hooked into `PermissionController`.
   - `JobCategoryController` cached for 30 minutes.
3. **Database Query Tuning**:
   - Eliminated redundant `documents` relationship eager loading on `EmployeeController::index`.
   - Replaced 5 individual count queries in Employee stats with a single grouped aggregate query.
4. **Compression Middleware**:
   - Added `GzipResponseMiddleware` adding automatic gzip compression and `ETag` generation for HTTP 304 Not Modified support.

### C. Database Layer
1. **Comprehensive Composite Indexes** added in migration `2026_08_20_000002_add_comprehensive_performance_indexes.php`:
   - `audit_logs`: `(created_at)`, `(module, created_at)`, `(user_id, created_at)`
   - `interviews`: `(scheduled_at, status)`, `(status, scheduled_at)`, `(interviewer_id, status)`
   - `leave_requests`: `(employee_id, status)`, `(status, created_at)`
   - `attendance_logs`: `(employee_id, date)`, `(date, status)`
   - `manpower_requests`: `(department_id, status)`, `(status, created_at)`
   - `employees`: `(department_id, employment_status)`, `(employment_status, created_at)`
   - `ai_evaluations`: `(applicant_id, ai_score)`

---

## 3. Production Deployment Commands

### Step 1: Pre-warm Cache & Optimize Laravel
```bash
cd artms-backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan artms:warm-cache
```

### Step 2: Build Frontend Production Bundle
```bash
cd ARTMS-main
npm run build
```

### Step 3: Run Multi-Worker Load Balancer via Docker
```bash
cd artms-backend/deployment
docker compose -f docker-compose.load-balancer.yml up -d --build
```
