<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Central caching wrapper for the ARTMS application.
 *
 * Responsibilities:
 *  - Graceful Redis failure fallback (cache miss → DB query instead of 500)
 *  - Tag-aware remember() with fallback to tagless for unsupported drivers
 *  - Stampede protection via Cache::lock() for expensive queries
 *  - Debug-mode hit/miss logging (never logs cached values)
 */
class CacheService
{
    /** @var bool Whether we're in debug/development mode */
    protected bool $debug;

    public function __construct()
    {
        $this->debug = config('app.debug', false);
    }

    /**
     * Cache-aside: return cached value or execute callback and cache result.
     *
     * Failures in Redis gracefully fall through to the callback (MySQL).
     */
    public function remember(string $key, int $ttlSeconds, \Closure $callback): mixed
    {
        try {
            $hit = Cache::has($key);
            $this->logOperation($hit ? 'HIT' : 'MISS', $key);

            return Cache::remember($key, $ttlSeconds, $callback);
        } catch (\Throwable $e) {
            $this->logError($key, $e);
            // Fallback to source of truth
            return $callback();
        }
    }

    /**
     * Cache-aside with tag support (Redis) — falls back to tagless remember().
     * On Redis failure, falls back to the callback.
     */
    public function rememberTagged(string $key, array $tags, int $ttlSeconds, \Closure $callback): mixed
    {
        try {
            if ($this->supportsTags()) {
                $hit = Cache::tags($tags)->has($key);
                $this->logOperation($hit ? 'HIT(tagged)' : 'MISS(tagged)', $key);
                return Cache::tags($tags)->remember($key, $ttlSeconds, $callback);
            }

            return $this->remember($key, $ttlSeconds, $callback);
        } catch (\Throwable $e) {
            $this->logError($key, $e);
            return $callback();
        }
    }

    /**
     * Stampede-protected remember for expensive queries.
     *
     * Only ONE concurrent request will execute the callback.
     * All others wait briefly then hit the freshly-populated cache.
     */
    public function rememberLocked(string $key, int $ttlSeconds, \Closure $callback, int $lockSeconds = 10): mixed
    {
        // Fast path: already cached
        try {
            if (Cache::has($key)) {
                $this->logOperation('HIT', $key);
                return Cache::get($key);
            }
        } catch (\Throwable $e) {
            $this->logError($key, $e);
            return $callback();
        }

        // Acquire lock so only one process executes the query
        $lock = Cache::lock("lock:{$key}", $lockSeconds);

        try {
            $lock->block($lockSeconds);

            // Re-check after acquiring lock (another process may have populated it)
            if ($value = Cache::get($key)) {
                $this->logOperation('HIT(post-lock)', $key);
                return $value;
            }

            $this->logOperation('MISS(locked)', $key);
            $value = $callback();
            Cache::put($key, $value, $ttlSeconds);
            return $value;
        } catch (\Throwable $e) {
            $this->logError($key, $e);
            return $callback();
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Delete a single cache key. Silently ignores Redis failures.
     */
    public function forget(string $key): void
    {
        try {
            Cache::forget($key);
            $this->logOperation('DEL', $key);
        } catch (\Throwable $e) {
            $this->logError($key, $e);
        }
    }

    /**
     * Delete multiple cache keys.
     */
    public function forgetMany(array $keys): void
    {
        foreach ($keys as $key) {
            $this->forget($key);
        }
    }

    /**
     * Flush all keys under a tag group (Redis only).
     * Silently skips if tags are not supported.
     */
    public function flushTag(string $tag): void
    {
        try {
            if ($this->supportsTags()) {
                Cache::tags([$tag])->flush();
                $this->logOperation('FLUSH_TAG', $tag);
            }
        } catch (\Throwable $e) {
            $this->logError($tag, $e);
        }
    }

    /**
     * Flush all keys under multiple tag groups.
     */
    public function flushTags(array $tags): void
    {
        try {
            if ($this->supportsTags()) {
                Cache::tags($tags)->flush();
                $this->logOperation('FLUSH_TAGS', implode(',', $tags));
            }
        } catch (\Throwable $e) {
            $this->logError(implode(',', $tags), $e);
        }
    }

    /**
     * Store a value directly.
     */
    public function put(string $key, mixed $value, int $ttlSeconds): void
    {
        try {
            Cache::put($key, $value, $ttlSeconds);
            $this->logOperation('PUT', $key);
        } catch (\Throwable $e) {
            $this->logError($key, $e);
        }
    }

    /**
     * Increment a numeric cache value (used for version counters).
     */
    public function increment(string $key, int $amount = 1): int
    {
        try {
            return (int) Cache::increment($key, $amount);
        } catch (\Throwable $e) {
            $this->logError($key, $e);
            return 1;
        }
    }

    /**
     * Get current value without fallback logic.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        try {
            return Cache::get($key, $default);
        } catch (\Throwable $e) {
            $this->logError($key, $e);
            return $default;
        }
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    protected function supportsTags(): bool
    {
        try {
            return Cache::supportsTags();
        } catch (\Throwable) {
            return false;
        }
    }

    protected function logOperation(string $operation, string $key): void
    {
        if ($this->debug) {
            Log::debug("[ARTMS Cache] {$operation} | key={$key}");
        }
    }

    protected function logError(string $key, \Throwable $e): void
    {
        Log::warning("[ARTMS Cache] ERROR | key={$key} | {$e->getMessage()}");
    }
}
