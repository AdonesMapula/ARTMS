<?php

namespace App\Http\Controllers;

use App\Models\JobCategory;
use App\Services\Cache\CacheKeyService;
use App\Services\Cache\CacheService;
use Illuminate\Http\Request;

class JobCategoryController extends Controller
{
    protected CacheService $cache;

    public function __construct(CacheService $cache)
    {
        $this->cache = $cache;
    }

    public function index()
    {
        $categories = $this->cache->remember(CacheKeyService::jobCategories(), 1800, function () {
            return JobCategory::orderBy('created_at', 'desc')->get();
        });

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:job_categories,name',
        ]);

        $category = JobCategory::create($validated);
        $this->cache->forget(CacheKeyService::jobCategories());

        return response()->json($category, 201);
    }
}
