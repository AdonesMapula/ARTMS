<?php

namespace App\Services\Cache;

use App\Models\Department;

/**
 * Cache service for Department data.
 *
 * Departments are referenced across many modules (users, employees,
 * job postings, manpower requests). Very stable data — TTL 30 minutes.
 * Invalidated immediately on create/update/delete via DepartmentObserver.
 */
class DepartmentCacheService
{
    // 30 minutes — very stable data
    public const TTL = 1800;

    protected CacheService $cache;

    public function __construct(CacheService $cache)
    {
        $this->cache = $cache;
    }

    /**
     * All departments with employee/user counts and department heads.
     * Note: If a search param is provided, always bypass cache.
     */
    public function all(?string $search = null): mixed
    {
        // Dynamic search queries are never cached
        if ($search !== null) {
            return Department::withCount(['employees', 'users'])
                ->with('departmentHeads')
                ->where(fn ($q) =>
                    $q->where('department_name', 'like', "%{$search}%")
                      ->orWhere('department_code', 'like', "%{$search}%")
                )
                ->orderBy('department_name')
                ->get();
        }

        return $this->cache->remember(
            CacheKeyService::departmentsAll(),
            self::TTL,
            fn () => Department::withCount(['employees', 'users'])
                ->with('departmentHeads')
                ->orderBy('department_name')
                ->get()
        );
    }

    /**
     * Only active departments — used in boot payloads, dropdowns.
     */
    public function active(): mixed
    {
        return $this->cache->remember(
            CacheKeyService::departmentsActive(),
            self::TTL,
            fn () => Department::where('is_active', true)
                ->select(['id', 'department_name', 'department_code'])
                ->orderBy('department_name')
                ->get()
        );
    }

    /**
     * Invalidate all department list caches + optionally a single department.
     */
    public function invalidate(?int $departmentId = null): void
    {
        $this->cache->forgetMany([
            CacheKeyService::departmentsAll(),
            CacheKeyService::departmentsActive(),
        ]);

        if ($departmentId !== null) {
            $this->cache->forget(CacheKeyService::department($departmentId));
        }
    }
}
