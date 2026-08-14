<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\DB;

/**
 * Cache service for the RBAC Permissions table.
 *
 * Permissions are a boolean matrix stored in the `permissions` table
 * (one row per permission, columns for each role). Very stable data
 * but security-sensitive — invalidated immediately on any change.
 *
 * TTL: 30 minutes, with event-driven invalidation.
 */
class PermissionCacheService
{
    // 30 minutes — but invalidated immediately on permission change
    public const TTL = 1800;

    protected CacheService $cache;
    protected BootCacheService $bootCache;

    public function __construct(CacheService $cache, BootCacheService $bootCache)
    {
        $this->cache     = $cache;
        $this->bootCache = $bootCache;
    }

    /**
     * All permissions, grouped by resource — used in PermissionController.
     * Returns the full permissions table with all role columns.
     */
    public function all(): array
    {
        return $this->cache->remember(
            CacheKeyService::permissionsAll(),
            self::TTL,
            function () {
                $permissions = DB::table('permissions')
                    ->orderBy('resource')
                    ->orderBy('name')
                    ->get();

                return [
                    'permissions' => $permissions,
                    'grouped'     => collect($permissions)->groupBy('resource'),
                    'total'       => $permissions->count(),
                ];
            }
        );
    }

    /**
     * Permission matrix for a specific role.
     * Used for RBAC checks without loading all permissions.
     */
    public function forRole(string $role): mixed
    {
        return $this->cache->remember(
            CacheKeyService::permissionsForRole($role),
            self::TTL,
            fn () => DB::table('permissions')
                ->select(['name', 'resource', $role])
                ->get()
        );
    }

    /**
     * Invalidate all permission caches AND all boot caches.
     * Called immediately when any permission is changed.
     * Boot caches must also be invalidated since permissions affect
     * what the frontend can render after login.
     */
    public function invalidateAll(): void
    {
        // Clear all role-specific permission caches
        $systemRoles = ['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'];
        foreach ($systemRoles as $role) {
            $this->cache->forget(CacheKeyService::permissionsForRole($role));
        }

        $this->cache->forget(CacheKeyService::permissionsAll());

        // Permissions affect what the app renders — invalidate all boot caches too
        $this->bootCache->invalidateAllBootCache();
    }
}
