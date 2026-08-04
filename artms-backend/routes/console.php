<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('manpower:clean-rejected', function () {
    $count = \App\Models\ManpowerRequest::where('status', 'rejected')
        ->where('updated_at', '<=', now()->subDays(7))
        ->delete();
    $this->info("Cleaned up {$count} rejected manpower request(s) older than 7 days.");
})->purpose('Delete manpower requests rejected for over 7 days');

\Illuminate\Support\Facades\Schedule::command('manpower:clean-rejected')->weekly();
