<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Cache\BootCacheService;

class AppBootController extends Controller
{
    protected BootCacheService $bootCacheService;

    public function __construct(BootCacheService $bootCacheService)
    {
        $this->bootCacheService = $bootCacheService;
    }

    /**
     * Authenticated initial boot endpoint.
     * Returns cached user profile, permissions, and department data.
     */
    public function boot(Request $request)
    {
        $payload = $this->bootCacheService->getBootPayload($request->user());

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    /**
     * Public initial boot endpoint.
     * Returns cached departments and active job postings for unauthenticated landing pages.
     */
    public function publicBoot()
    {
        $payload = $this->bootCacheService->getPublicBootPayload();

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }
}
