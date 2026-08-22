<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Primary and reserve Gemini models in order of preference.
     */
    protected static array $models = [
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.7-flash',
    ];

    /**
     * Maximum requests per minute per API key at the service level (Free-tier safe boundary).
     */
    protected static int $maxRequestsPerMinutePerKey = 14;

    /**
     * Retrieve available API keys (Primary first, then Reserve).
     */
    public static function getApiKeys(): array
    {
        $keys = [
            config('services.gemini.key') ?: env('GEMINI_API_KEY'),
            config('services.gemini.reserve_key') ?: env('RESERVE_GEMINI_API_KEY'),
        ];

        return array_values(array_unique(array_filter(array_map('trim', $keys))));
    }

    /**
     * Check if a specific API key has hit its service-level rate limit window.
     */
    protected static function isKeyRateLimited(string $apiKey): bool
    {
        $cacheKey = 'gemini_rpm_' . substr(md5($apiKey), 0, 12);
        $currentCount = (int) Cache::get($cacheKey, 0);

        return $currentCount >= self::$maxRequestsPerMinutePerKey;
    }

    /**
     * Increment the request count for a given API key within a 60-second window.
     */
    protected static function recordKeyUsage(string $apiKey): void
    {
        $cacheKey = 'gemini_rpm_' . substr(md5($apiKey), 0, 12);
        
        if (! Cache::has($cacheKey)) {
            Cache::put($cacheKey, 1, 60);
        } else {
            Cache::increment($cacheKey);
        }
    }

    /**
     * Execute a prompt expecting a structured JSON object response with dual-key & multi-model fallback,
     * integrated with AI Guardrails and service-level rate limit control.
     *
     * @param string $prompt
     * @param string|null $systemInstruction
     * @param float $temperature
     * @param int $maxTokens
     * @param string|null $guardrailContext
     * @return array|null
     * @throws \Exception
     */
    public static function generateJson(
        string $prompt,
        ?string $systemInstruction = null,
        float $temperature = 0.2,
        int $maxTokens = 2048,
        ?string $guardrailContext = 'Gemini JSON Generation'
    ): ?array {
        $keys = self::getApiKeys();

        if (empty($keys)) {
            throw new \Exception('Gemini API key is not configured. Please set GEMINI_API_KEY or RESERVE_GEMINI_API_KEY in your environment.');
        }

        // ── Input Guardrail: Sanitize and Neutralize Prompt Injections ────
        $sanitizedPrompt = AiGuardrailService::sanitizeInput($prompt, 16000);
        $safePrompt = AiGuardrailService::detectAndNeutralizePromptInjection($sanitizedPrompt, $guardrailContext);

        $lastError = null;

        foreach ($keys as $keyIndex => $apiKey) {
            $keyLabel = $keyIndex === 0 ? 'Primary Key' : 'Reserve Key';

            // Check service-level key throttle
            if (self::isKeyRateLimited($apiKey)) {
                Log::warning("GeminiService: {$keyLabel} reached service-level rate limit buffer (14 RPM). Checking next key...");
                continue;
            }

            foreach (self::$models as $model) {
                try {
                    self::recordKeyUsage($apiKey);

                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                    $payload = [
                        'contents' => [
                            [
                                'role'  => 'user',
                                'parts' => [
                                    ['text' => $safePrompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'temperature'     => $temperature,
                            'maxOutputTokens' => $maxTokens,
                            'responseMimeType' => 'application/json',
                        ],
                    ];

                    if (! empty($systemInstruction)) {
                        $payload['systemInstruction'] = [
                            'parts' => [
                                ['text' => $systemInstruction],
                            ],
                        ];
                    }

                    $response = Http::withHeaders([
                        'Content-Type'   => 'application/json',
                        'x-goog-api-key' => $apiKey,
                    ])
                        ->withOptions(['verify' => false])
                        ->timeout(45)
                        ->post($url, $payload);

                    if ($response->successful()) {
                        $rawText = $response->json('candidates.0.content.parts.0.text');

                        if (! empty($rawText)) {
                            // Strip markdown code fences if model returned them despite JSON mode
                            $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($rawText));
                            $cleanJson = preg_replace('/```\s*$/', '', $cleanJson);

                            $parsed = json_decode(trim($cleanJson), true);
                            if (is_array($parsed)) {
                                return $parsed; // Success!
                            }
                        }
                    } else {
                        $status = $response->status();
                        $errorBody = $response->json('error.message') ?? "HTTP {$status} error";
                        $lastError = "[{$keyLabel} - {$model}] {$errorBody}";
                        
                        // If rate limited (HTTP 429), perform a short backoff before trying fallback
                        if ($status === 429) {
                            Log::warning("Gemini API 429 Too Many Requests on {$keyLabel} ({$model}). Backing off briefly...");
                            usleep(400000); // 400ms jitter
                        } else {
                            Log::warning("Gemini API call failed using {$keyLabel} with model {$model}: {$errorBody}. Trying next fallback...");
                        }
                    }
                } catch (\Throwable $e) {
                    $lastError = "[{$keyLabel} - {$model}] " . $e->getMessage();
                    Log::warning("Gemini exception on {$keyLabel} with {$model}: {$e->getMessage()}. Trying next fallback...");
                }
            }

            Log::warning("Exhausted all models for {$keyLabel}. Failing over to next key if available...");
        }

        throw new \Exception("Gemini generation failed across all keys and models. Last error: {$lastError}");
    }

    /**
     * Execute a prompt expecting a plain text response with dual-key & multi-model fallback,
     * rate limiter protection, and input guardrails.
     */
    public static function generateText(
        string $prompt,
        ?string $systemInstruction = null,
        float $temperature = 0.2,
        int $maxTokens = 2048,
        ?string $guardrailContext = 'Gemini Text Generation'
    ): ?string {
        $keys = self::getApiKeys();

        if (empty($keys)) {
            throw new \Exception('Gemini API key is not configured. Please set GEMINI_API_KEY or RESERVE_GEMINI_API_KEY in your environment.');
        }

        $sanitizedPrompt = AiGuardrailService::sanitizeInput($prompt, 16000);
        $safePrompt = AiGuardrailService::detectAndNeutralizePromptInjection($sanitizedPrompt, $guardrailContext);

        $lastError = null;

        foreach ($keys as $keyIndex => $apiKey) {
            $keyLabel = $keyIndex === 0 ? 'Primary Key' : 'Reserve Key';

            if (self::isKeyRateLimited($apiKey)) {
                Log::warning("GeminiService: {$keyLabel} reached service-level rate limit buffer. Checking next key...");
                continue;
            }

            foreach (self::$models as $model) {
                try {
                    self::recordKeyUsage($apiKey);

                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                    $payload = [
                        'contents' => [
                            [
                                'role'  => 'user',
                                'parts' => [
                                    ['text' => $safePrompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'temperature'     => $temperature,
                            'maxOutputTokens' => $maxTokens,
                        ],
                    ];

                    if (! empty($systemInstruction)) {
                        $payload['systemInstruction'] = [
                            'parts' => [
                                ['text' => $systemInstruction],
                            ],
                        ];
                    }

                    $response = Http::withHeaders([
                        'Content-Type'   => 'application/json',
                        'x-goog-api-key' => $apiKey,
                    ])
                        ->withOptions(['verify' => false])
                        ->timeout(45)
                        ->post($url, $payload);

                    if ($response->successful()) {
                        $rawText = $response->json('candidates.0.content.parts.0.text');
                        if (! empty($rawText)) {
                            return trim($rawText);
                        }
                    } else {
                        $status = $response->status();
                        $errorBody = $response->json('error.message') ?? "HTTP {$status} error";
                        $lastError = "[{$keyLabel} - {$model}] {$errorBody}";
                        
                        if ($status === 429) {
                            usleep(400000);
                        }
                        Log::warning("Gemini text call failed on {$keyLabel} ({$model}): {$errorBody}");
                    }
                } catch (\Throwable $e) {
                    $lastError = "[{$keyLabel} - {$model}] " . $e->getMessage();
                    Log::warning("Gemini text exception on {$keyLabel} ({$model}): " . $e->getMessage());
                }
            }
        }

        throw new \Exception("Gemini text generation failed across all keys and models. Last error: {$lastError}");
    }
}

