<?php

namespace App\Services\Cache;

/**
 * Centralized, versioned cache key factory.
 *
 * All cache keys in ARTMS are generated here — never scattered as
 * raw strings across controllers or services.
 *
 * Format: artms:v1:{domain}:{identifier}
 *
 * Change CACHE_VERSION to bust the entire cache namespace at once.
 */
class CacheKeyService
{
    public const CACHE_VERSION = 'v1';
    public const NS             = 'artms';

    // ── Boot ────────────────────────────────────────────────────────────────

    public static function bootUser(int $userId): string
    {
        return self::make('boot', "user:{$userId}");
    }

    public static function bootPublic(): string
    {
        return self::make('boot', 'public');
    }

    // ── Departments ─────────────────────────────────────────────────────────

    public static function departmentsAll(): string
    {
        return self::make('departments', 'all');
    }

    public static function departmentsActive(): string
    {
        return self::make('departments', 'active');
    }

    public static function department(int $id): string
    {
        return self::make('departments', (string) $id);
    }

    // ── Roles ────────────────────────────────────────────────────────────────

    public static function rolesAll(): string
    {
        return self::make('roles', 'all');
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    public static function permissionsAll(): string
    {
        return self::make('permissions', 'all');
    }

    public static function permissionsForRole(string $role): string
    {
        return self::make('permissions', "role:{$role}");
    }

    // ── Job Categories ───────────────────────────────────────────────────────

    public static function jobCategories(): string
    {
        return self::make('job-categories', 'all');
    }

    // ── Job Library ──────────────────────────────────────────────────────────

    public static function jobLibraryApproved(): string
    {
        return self::make('job-library', 'approved');
    }

    public static function jobLibrary(int $id): string
    {
        return self::make('job-library', (string) $id);
    }

    // ── Job Postings ─────────────────────────────────────────────────────────

    /**
     * Versioned list key to allow bulk invalidation via version bump.
     * Version is stored in its own cache key.
     */
    public static function jobPostingsList(string $paramsHash, int $version = 1): string
    {
        return self::make('job-postings', "list:v{$version}:{$paramsHash}");
    }

    public static function jobPostingsPublic(string $paramsHash, int $version = 1): string
    {
        return self::make('job-postings', "public:v{$version}:{$paramsHash}");
    }

    public static function jobPosting(int $id): string
    {
        return self::make('job-postings', (string) $id);
    }

    /** Key that holds the current list version (increment to bust all list caches) */
    public static function jobPostingsVersion(): string
    {
        return self::make('job-postings', 'version');
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    public static function dashboardAdmin(string $date): string
    {
        return self::make('dashboard', "admin:{$date}");
    }

    public static function dashboardSuperAdmin(string $date): string
    {
        return self::make('dashboard', "superadmin:{$date}");
    }

    public static function dashboardCoo(string $date): string
    {
        return self::make('dashboard', "coo:{$date}");
    }

    public static function dashboardDeptHead(int $deptId, string $date): string
    {
        return self::make('dashboard', "dept:{$deptId}:{$date}");
    }

    public static function sidebarCounts(int $userId): string
    {
        return self::make('sidebar', "user:{$userId}");
    }

    // ── Notifications ────────────────────────────────────────────────────────

    public static function notificationsUnreadCount(int $userId): string
    {
        return self::make('notifications', "unread-count:{$userId}");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Build a namespaced, versioned cache key.
     */
    public static function make(string $domain, string $identifier): string
    {
        return sprintf('%s:%s:%s:%s', self::NS, self::CACHE_VERSION, $domain, $identifier);
    }

    /**
     * Build a deterministic hash from a params array for list cache keys.
     * Sort the params so key ordering doesn't cause duplicates.
     */
    public static function hashParams(array $params): string
    {
        ksort($params);
        return md5(serialize(array_filter($params, fn ($v) => $v !== null && $v !== '')));
    }
}
