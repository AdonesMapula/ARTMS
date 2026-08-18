<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') || str_starts_with(config('app.url'), 'https://') || request()->header('X-Forwarded-Proto') === 'https') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        $this->configureAiRateLimiters();
    }

    /**
     * Configure rate limiters for AI and high-cost endpoints.
     */
    protected function configureAiRateLimiters(): void
    {
        // 1. Public Resume Parsing (Strict: 5 requests per minute per IP)
        RateLimiter::for('ai-public-parser', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'status'      => 'rate_limited',
                        'message'     => 'Too many resume parsing attempts. Please wait a minute before submitting again.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 2. HR Admin / Super Admin AI Candidate Screening (30 requests per minute per user/IP)
        RateLimiter::for('ai-screening', function (Request $request) {
            $key = $request->user()?->id ? 'user_' . $request->user()->id : 'ip_' . $request->ip();
            return Limit::perMinute(30)
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'status'      => 'rate_limited',
                        'message'     => 'AI Candidate Screening rate limit reached. Please wait a moment before running more screenings.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 3. Audio Speech-To-Text Transcription (60 requests per minute per session/IP)
        RateLimiter::for('ai-transcription', function (Request $request) {
            $interviewId = $request->route('interview') ? (is_object($request->route('interview')) ? $request->route('interview')->id : $request->route('interview')) : 'general';
            $key = 'transcribe_' . $interviewId . '_' . $request->ip();
            return Limit::perMinute(60)
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'status'      => 'rate_limited',
                        'message'     => 'Audio transcription rate limit exceeded. Please wait for audio chunks to process.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 4. Job Document Parser (15 requests per minute per user/IP)
        RateLimiter::for('ai-document-parser', function (Request $request) {
            $key = $request->user()?->id ? 'user_' . $request->user()->id : 'ip_' . $request->ip();
            return Limit::perMinute(15)
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'status'      => 'rate_limited',
                        'message'     => 'Job document parser rate limit exceeded. Please wait before uploading more documents.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 5. Live Interview AI Sentiment & Keywords Analysis (20 requests per minute per interview)
        RateLimiter::for('ai-live-analysis', function (Request $request) {
            $interviewId = $request->route('interview') ? (is_object($request->route('interview')) ? $request->route('interview')->id : $request->route('interview')) : $request->ip();
            return Limit::perMinute(20)
                ->by('live_analysis_' . $interviewId)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'status'      => 'rate_limited',
                        'message'     => 'Live analysis rate limit reached. Waiting for next analysis window.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 6. General AI Fallback Limiter (45 requests per minute)
        RateLimiter::for('ai-general', function (Request $request) {
            $key = $request->user()?->id ? 'user_' . $request->user()->id : 'ip_' . $request->ip();
            return Limit::perMinute(45)
                ->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'status'      => 'rate_limited',
                        'message'     => 'AI service rate limit reached. Please retry shortly.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });
    }
}

