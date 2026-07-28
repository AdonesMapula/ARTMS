<?php

namespace App\Observers;

use App\Models\User;
use App\Services\Cache\BootCacheService;

class UserObserver
{
    protected BootCacheService $bootCacheService;

    public function __construct(BootCacheService $bootCacheService)
    {
        $this->bootCacheService = $bootCacheService;
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        $this->bootCacheService->invalidateUserCache($user->id);
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->bootCacheService->invalidateUserCache($user->id);
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        $this->bootCacheService->invalidateUserCache($user->id);
    }
}
