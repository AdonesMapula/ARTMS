<?php

namespace App\Services\Cache;

use App\Models\User;
use App\Models\Department;
use App\Models\JobPosting;
use Illuminate\Support\Facades\Cache;

class BootCacheService
{
    /**
     * Cache TTL in seconds (e.g., 6 hours).
     */
    protected const CACHE_TTL_SECONDS = 21600;

    /**
     * Retrieve the consolidated boot payload for an authenticated user.
     * Uses Cache-Aside strategy with tag support if available.
     *
     * @param User $user
     * @return array
     */
    public function getBootPayload(User $user): array
    {
        $cacheKey = "boot_payload:user:{$user->id}";
        $tags = ["user_{$user->id}", "department_{$user->department_id}", "boot_data"];

        $callback = function () use ($user) {
            return $this->buildBootPayload($user);
        };

        return $this->rememberWithTags($cacheKey, $tags, self::CACHE_TTL_SECONDS, $callback);
    }

    /**
     * Retrieve system-wide initial configuration and public job library data.
     *
     * @return array
     */
    public function getPublicBootPayload(): array
    {
        $cacheKey = "boot_payload:public";
        $tags = ["public_boot", "job_postings"];

        $callback = function () {
            return [
                'active_jobs' => JobPosting::where('status', 'published')
                    ->where('is_active', true)
                    ->with('department:id,department_name,department_code')
                    ->select(['id', 'title', 'department_id', 'location', 'employment_type', 'created_at'])
                    ->orderBy('created_at', 'desc')
                    ->get(),
                'departments' => Department::where('is_active', true)
                    ->select(['id', 'department_name', 'department_code'])
                    ->get(),
            ];
        };

        return $this->rememberWithTags($cacheKey, $tags, self::CACHE_TTL_SECONDS, $callback);
    }

    /**
     * Invalidate boot payload cache for a specific user.
     *
     * @param int $userId
     * @return void
     */
    public function invalidateUserCache(int $userId): void
    {
        $this->flushTags(["user_{$userId}"]);
        Cache::forget("boot_payload:user:{$userId}");
    }

    /**
     * Invalidate all boot payloads (e.g., after systemic updates).
     *
     * @return void
     */
    public function invalidateAllBootCache(): void
    {
        $this->flushTags(["boot_data", "public_boot"]);
        Cache::forget("boot_payload:public");
    }

    /**
     * Helper to build the actual boot payload array from DB queries.
     */
    protected function buildBootPayload(User $user): array
    {
        // Load relationships efficiently in 1 step
        $user->loadMissing(['department:id,department_name,department_code']);

        return [
            'user' => [
                'id' => $user->id,
                'employee_id' => $user->employee_id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department_id' => $user->department_id,
            ],
            'department' => $user->department ? [
                'id' => $user->department->id,
                'name' => $user->department->department_name,
                'code' => $user->department->department_code,
            ] : null,
            'unread_notifications_count' => $user->unreadNotifications()->count(),
            'cached_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Safely executes Cache::remember using Cache Tags if supported by current store,
     * otherwise falls back to standard key-based caching.
     */
    protected function rememberWithTags(string $key, array $tags, int $ttl, \Closure $callback): array
    {
        if ($this->supportsTags()) {
            return Cache::tags($tags)->remember($key, $ttl, $callback);
        }

        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Safely flushes tags if supported by current cache driver.
     */
    protected function flushTags(array $tags): void
    {
        if ($this->supportsTags()) {
            Cache::tags($tags)->flush();
        }
    }

    /**
     * Check if the current default cache store supports tags (e.g. Redis, Memcached, Array).
     */
    protected function supportsTags(): bool
    {
        return Cache::supportsTags();
    }
}
