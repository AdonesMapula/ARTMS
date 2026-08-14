<?php

namespace App\Services\Cache;

use App\Models\Department;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Manages caching for the application boot payloads.
 *
 * Uses CacheKeyService for consistent key naming and CacheService
 * for graceful Redis failure handling.
 *
 * TTL: 5 minutes (reduced from 6h — includes unread notification count
 * which changes regularly, and dashboard data that should be fresh)
 */
class BootCacheService
{
    // 5 minutes — boot includes notification count which changes regularly
    public const TTL = 300;

    // 15 minutes for public payload (job postings change less frequently)
    public const TTL_PUBLIC = 900;

    protected CacheService $cache;

    public function __construct(CacheService $cache)
    {
        $this->cache = $cache;
    }

    /**
     * Retrieve the consolidated boot payload for an authenticated user.
     * Cache-aside with tag support where available.
     */
    public function getBootPayload(User $user): array
    {
        $key  = CacheKeyService::bootUser($user->id);
        $tags = ["boot_data", "user_{$user->id}"];

        return $this->cache->rememberTagged($key, $tags, self::TTL, function () use ($user) {
            return $this->buildBootPayload($user);
        });
    }

    /**
     * Retrieve system-wide config and public job listing for unauthenticated pages.
     */
    public function getPublicBootPayload(): array
    {
        $key  = CacheKeyService::bootPublic();
        $tags = ['boot_data', 'public_boot', 'job_postings'];

        return $this->cache->rememberTagged($key, $tags, self::TTL_PUBLIC, function () {
            return [
                'active_jobs'  => JobPosting::where('status', 'published')
                    ->where('is_published', true)
                    ->with([
                        'department:id,department_name,department_code',
                        'jobLibrary:id,job_title,employment_type',
                    ])
                    ->select(['id', 'job_library_id', 'department_id', 'location', 'created_at'])
                    ->orderBy('created_at', 'desc')
                    ->get(),
                'departments' => Department::where('is_active', true)
                    ->select(['id', 'department_name', 'department_code'])
                    ->get(),
            ];
        });
    }

    /**
     * Invalidate boot payload cache for a specific user.
     */
    public function invalidateUserCache(int $userId): void
    {
        $key = CacheKeyService::bootUser($userId);
        $this->cache->flushTags(["user_{$userId}"]);
        $this->cache->forget($key);
    }

    /**
     * Invalidate all boot payloads — call after department/permission/role changes.
     */
    public function invalidateAllBootCache(): void
    {
        $this->cache->flushTags(['boot_data', 'public_boot']);
        $this->cache->forget(CacheKeyService::bootPublic());
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    protected function buildBootPayload(User $user): array
    {
        $user->loadMissing(['department:id,department_name,department_code']);

        return [
            'user' => [
                'id'            => $user->id,
                'employee_id'   => $user->employee_id,
                'first_name'    => $user->first_name,
                'last_name'     => $user->last_name,
                'name'          => $user->name,
                'email'         => $user->email,
                'role'          => $user->role,
                'department_id' => $user->department_id,
                'is_active'     => $user->is_active,
            ],
            'department' => $user->department ? [
                'id'   => $user->department->id,
                'name' => $user->department->department_name,
                'code' => $user->department->department_code,
            ] : null,
            'unread_notifications_count' => $user->unreadNotifications()->count(),
            'cached_at' => now()->toIso8601String(),
        ];
    }
}
