<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\Cache\BootCacheService;

class WarmCacheCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'artms:warm-cache {--active-only : Warm cache only for active users}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pre-fetch heavy initial boot payloads into Redis cache asynchronously';

    /**
     * Execute the console command.
     */
    public function handle(BootCacheService $bootCacheService): int
    {
        $this->info("⚡ Starting ARTMS Cache Warming Process...");

        // 1. Warm Public Boot Payload
        $this->line("Warming public job posting and department payloads...");
        $bootCacheService->getPublicBootPayload();
        $this->info("✓ Public boot cache warmed.");

        // 2. Warm Active User Payloads in Chunks to Prevent Memory Spikes
        $this->line("Warming active user boot payloads...");
        $query = User::query();

        if ($this->option('active-only')) {
            $query->where('is_active', true);
        }

        $warmedCount = 0;
        $query->chunk(100, function ($users) use ($bootCacheService, &$warmedCount) {
            foreach ($users as $user) {
                $bootCacheService->getBootPayload($user);
                $warmedCount++;
            }
        });

        $this->info("✓ Successfully pre-warmed boot payloads for {$warmedCount} users!");
        $this->info("🚀 Cache warming complete. Application is ready for low-latency traffic.");

        return Command::SUCCESS;
    }
}
