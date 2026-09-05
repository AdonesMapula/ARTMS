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
        // Helper to format standardized rate limited responses
        $format429 = function (string $message, array $headers) {
            $retryAfter = (int) ($headers['Retry-After'] ?? 60);
            return response()->json([
                'status'      => 'rate_limited',
                'message'     => $message,
                'retry_after' => $retryAfter,
            ], 429, [
                'Retry-After' => $retryAfter,
                'X-RateLimit-Status' => 'rate_limited',
            ]);
        };

        // 1. Public Resume Parsing (10 requests per minute per IP)
        RateLimiter::for('ai-public-parser', function (Request $request) use ($format429) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(fn (Request $r, array $h) => $format429('Too many resume parsing attempts. Please wait a moment before submitting again.', $h));
        });

        // 2. HR Admin / Super Admin AI Candidate Screening (45 requests per minute per user/IP)
        RateLimiter::for('ai-screening', function (Request $request) use ($format429) {
            $key = $request->user()?->id ? 'user_' . $request->user()->id : 'ip_' . $request->ip();
            return Limit::perMinute(45)
                ->by($key)
                ->response(fn (Request $r, array $h) => $format429('AI Candidate Screening rate limit reached. Please wait a moment before running more screenings.', $h));
        });

        // 3. Audio Speech-To-Text Transcription (60 requests per minute per session/IP)
        RateLimiter::for('ai-transcription', function (Request $request) use ($format429) {
            $interviewId = $request->route('interview') ? (is_object($request->route('interview')) ? $request->route('interview')->id : $request->route('interview')) : 'general';
            $key = 'transcribe_' . $interviewId . '_' . $request->ip();
            return Limit::perMinute(60)
                ->by($key)
                ->response(fn (Request $r, array $h) => $format429('Audio transcription rate limit exceeded. Please wait for the current audio processing to complete.', $h));
        });

        // 4. Job Document Parser (20 requests per minute per user/IP)
        RateLimiter::for('ai-document-parser', function (Request $request) use ($format429) {
            $key = $request->user()?->id ? 'user_' . $request->user()->id : 'ip_' . $request->ip();
            return Limit::perMinute(20)
                ->by($key)
                ->response(fn (Request $r, array $h) => $format429('Job document parser rate limit exceeded. Please wait before uploading more documents.', $h));
        });

        // 5. Live Interview AI Sentiment & Keywords Analysis (30 requests per minute per interview)
        RateLimiter::for('ai-live-analysis', function (Request $request) use ($format429) {
            $interviewId = $request->route('interview') ? (is_object($request->route('interview')) ? $request->route('interview')->id : $request->route('interview')) : $request->ip();
            return Limit::perMinute(30)
                ->by('live_analysis_' . $interviewId)
                ->response(fn (Request $r, array $h) => $format429('Live analysis rate limit reached. Waiting for next analysis window.', $h));
        });

        // 6. AI Interview Evaluation Report Generation (15 requests per minute per interview)
        RateLimiter::for('ai-report', function (Request $request) use ($format429) {
            $interviewId = $request->route('interview') ? (is_object($request->route('interview')) ? $request->route('interview')->id : $request->route('interview')) : $request->ip();
            return Limit::perMinute(15)
                ->by('ai_report_' . $interviewId)
                ->response(fn (Request $r, array $h) => $format429('Interview report is already generating. Please wait a moment.', $h));
        });

        // 7. General AI Fallback Limiter (60 requests per minute)
        RateLimiter::for('ai-general', function (Request $request) use ($format429) {
            $key = $request->user()?->id ? 'user_' . $request->user()->id : 'ip_' . $request->ip();
            return Limit::perMinute(60)
                ->by($key)
                ->response(fn (Request $r, array $h) => $format429('AI service rate limit reached. Please retry shortly.', $h));
        });
    }
}

