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
     * API version to use for Gemini.
     */
    protected static string $apiVersion = 'v1beta';

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
     * Retrieve available API keys dynamically load-balanced by active usage (least-loaded key first).
     */
    public static function getBalancedApiKeys(): array
    {
        $keys = self::getApiKeys();
        if (count($keys) <= 1) {
            return $keys;
        }

        // Sort keys by current RPM usage count ascending (least-loaded first)
        usort($keys, function ($a, $b) {
            $countA = (int) Cache::get('gemini_rpm_' . substr(md5($a), 0, 12), 0);
            $countB = (int) Cache::get('gemini_rpm_' . substr(md5($b), 0, 12), 0);
            return $countA <=> $countB;
        });

        return $keys;
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
        $keys = self::getBalancedApiKeys();

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

                    $url = "https://generativelanguage.googleapis.com/" . self::$apiVersion . "/models/{$model}:generateContent?key={$apiKey}";

                    // Thinking models need higher token budgets
                    $effectiveMaxTokens = max($maxTokens, 4096);

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
                            'maxOutputTokens' => $effectiveMaxTokens,
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
                        // Extract text from parts, skipping thoughtSignature parts (thinking models)
                        $rawText = self::extractTextFromResponse($response->json());

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
        $keys = self::getBalancedApiKeys();

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

                    $url = "https://generativelanguage.googleapis.com/" . self::$apiVersion . "/models/{$model}:generateContent?key={$apiKey}";

                    // Thinking models need higher token budgets
                    $effectiveMaxTokens = max($maxTokens, 4096);

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
                            'maxOutputTokens' => $effectiveMaxTokens,
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
                        $rawText = self::extractTextFromResponse($response->json());
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

    /**
     * Transcribe an audio file using the new gemini-3.5-transcribe model via the Interactions API.
     * Supports automatic language detection, custom vocabulary, speaker diarization,
     * word-level timestamps, and smart transcription mode with dual-key fallback.
     *
     * @param string $filePath Absolute path to the audio file
     * @param string|null $mimeType Optional MIME type (e.g. audio/webm, audio/mp3, audio/wav)
     * @param array $options Optional configuration:
     *                      - 'language_codes': array of BCP-47 strings (e.g. ['fil-PH', 'en-US', 'ceb'])
     *                      - 'custom_vocabulary': array of strings (up to 1,000 phrases)
     *                      - 'mode': string ('smart') or array (['type' => 'verbatim', ...])
     *                      - 'smart': bool (convenience flag for mode => 'smart')
     *                      - 'diarization': bool (enables speaker diarization in verbatim mode)
     *                      - 'word_timestamps': bool (enables word-level timestamps in verbatim mode)
     * @return array|null Associative array with ['text', 'words', 'raw'] or null on failure
     * @throws \Exception
     */
    public static function transcribeAudio(
        string $filePath,
        ?string $mimeType = null,
        array $options = []
    ): ?array {
        if (! file_exists($filePath) || filesize($filePath) === 0) {
            throw new \InvalidArgumentException("Audio file not found or empty: {$filePath}");
        }

        $resolvedMimeType = $mimeType ?: self::detectAudioMimeType($filePath);
        $keys = self::getBalancedApiKeys();

        if (empty($keys)) {
            throw new \Exception('Gemini API key is not configured. Please set GEMINI_API_KEY or RESERVE_GEMINI_API_KEY in your environment.');
        }

        $lastError = null;

        foreach ($keys as $keyIndex => $apiKey) {
            $keyLabel = $keyIndex === 0 ? 'Primary Key' : 'Reserve Key';

            if (self::isKeyRateLimited($apiKey)) {
                Log::warning("GeminiService [Transcribe]: {$keyLabel} reached service-level rate limit buffer. Checking next key...");
                continue;
            }

            try {
                self::recordKeyUsage($apiKey);

                // ── Step 1: Upload Audio via Gemini Files API ───────────────
                $fileSize = filesize($filePath);
                $uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?key={$apiKey}";

                $uploadResponse = Http::withHeaders([
                    'x-goog-api-key'                      => $apiKey,
                    'X-Goog-Upload-Command'               => 'start, upload, finalize',
                    'X-Goog-Upload-Header-Content-Length' => (string) $fileSize,
                    'X-Goog-Upload-Header-Content-Type'   => $resolvedMimeType,
                    'Content-Type'                        => $resolvedMimeType,
                ])
                    ->withOptions(['verify' => false])
                    ->withBody(file_get_contents($filePath), $resolvedMimeType)
                    ->timeout(60)
                    ->post($uploadUrl);

                if (! $uploadResponse->successful()) {
                    $uploadError = $uploadResponse->json('error.message') ?? "Upload HTTP {$uploadResponse->status()}";
                    $lastError = "[{$keyLabel} - Files API] {$uploadError}";
                    Log::warning("Gemini Files API upload failed on {$keyLabel}: {$uploadError}");
                    continue;
                }

                $uploadData = $uploadResponse->json();
                $fileUri = $uploadData['file']['uri'] ?? null;
                $fileName = $uploadData['file']['name'] ?? null;

                if (empty($fileUri)) {
                    $lastError = "[{$keyLabel} - Files API] No file URI returned from upload";
                    Log::warning($lastError);
                    continue;
                }

                // ── Step 2: Build Transcription Configuration ───────────────
                $transcriptionConfig = [];

                if (! empty($options['language_codes'])) {
                    $transcriptionConfig['language_codes'] = is_array($options['language_codes'])
                        ? array_values($options['language_codes'])
                        : [$options['language_codes']];
                }

                if (! empty($options['custom_vocabulary']) && is_array($options['custom_vocabulary'])) {
                    $transcriptionConfig['custom_vocabulary'] = array_slice(array_values($options['custom_vocabulary']), 0, 1000);
                }

                if (! empty($options['mode'])) {
                    $transcriptionConfig['mode'] = $options['mode'];
                } elseif (! empty($options['smart'])) {
                    $transcriptionConfig['mode'] = 'smart';
                } elseif (! empty($options['diarization']) || ! empty($options['word_timestamps'])) {
                    $mode = ['type' => 'verbatim'];
                    if (! empty($options['diarization'])) {
                        $mode['diarization_mode'] = 'speaker';
                    }
                    if (! empty($options['word_timestamps'])) {
                        $mode['timestamp_granularities'] = ['word'];
                    }
                    $transcriptionConfig['mode'] = $mode;
                }

                $payload = [
                    'model' => 'gemini-3.5-transcribe',
                    'input' => [
                        [
                            'type'      => 'audio',
                            'uri'       => $fileUri,
                            'mime_type' => $resolvedMimeType,
                        ],
                    ],
                ];

                if (! empty($transcriptionConfig)) {
                    $payload['generation_config'] = [
                        'transcription_config' => $transcriptionConfig,
                    ];
                }

                // ── Step 3: Invoke gemini-3.5-transcribe on Interactions API ─
                $interactionUrl = "https://generativelanguage.googleapis.com/v1beta/interactions?key={$apiKey}";

                $interactionResponse = Http::withHeaders([
                    'Content-Type'   => 'application/json',
                    'x-goog-api-key' => $apiKey,
                ])
                    ->withOptions(['verify' => false])
                    ->timeout(120)
                    ->post($interactionUrl, $payload);

                if ($interactionResponse->successful()) {
                    $resData = $interactionResponse->json();
                    $outputText = $resData['output_text'] ?? '';

                    $words = [];
                    $steps = $resData['steps'] ?? [];
                    foreach ($steps as $step) {
                        $contents = $step['content'] ?? [];
                        foreach ($contents as $content) {
                            if (empty($outputText) && ! empty($content['text'])) {
                                $outputText = $content['text'];
                            }
                            $annotations = $content['annotations'] ?? [];
                            foreach ($annotations as $ann) {
                                if (($ann['type'] ?? '') === 'word_info') {
                                    $words[] = [
                                        'text'         => $ann['text'] ?? '',
                                        'speaker'      => $ann['speaker'] ?? null,
                                        'start_offset' => $ann['start_offset'] ?? null,
                                        'end_offset'   => $ann['end_offset'] ?? null,
                                    ];
                                }
                            }
                        }
                    }

                    // Optional cleanup of uploaded file in background
                    if ($fileName) {
                        try {
                            Http::withHeaders(['x-goog-api-key' => $apiKey])
                                ->withOptions(['verify' => false])
                                ->timeout(5)
                                ->delete("https://generativelanguage.googleapis.com/v1beta/{$fileName}?key={$apiKey}");
                        } catch (\Throwable) {}
                    }

                    return [
                        'text'  => trim($outputText),
                        'words' => $words,
                        'raw'   => $resData,
                    ];
                } else {
                    $status = $interactionResponse->status();
                    $errorBody = $interactionResponse->json('error.message') ?? "HTTP {$status} error";
                    $lastError = "[{$keyLabel} - gemini-3.5-transcribe] {$errorBody}";

                    if ($status === 429) {
                        Log::warning("Gemini 3.5 Transcribe 429 Too Many Requests on {$keyLabel}. Backing off...");
                        usleep(400000);
                    } else {
                        Log::warning("Gemini 3.5 Transcribe failed on {$keyLabel}: {$errorBody}");
                    }
                }
            } catch (\Throwable $e) {
                $lastError = "[{$keyLabel} - gemini-3.5-transcribe] " . $e->getMessage();
                Log::warning("Gemini 3.5 Transcribe exception on {$keyLabel}: " . $e->getMessage());
            }
        }

        throw new \Exception("gemini-3.5-transcribe failed across all keys. Last error: {$lastError}");
    }

    /**
     * Detect audio MIME type based on file extension and binary content.
     */
    public static function detectAudioMimeType(string $filePath): string
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $map = [
            'webm' => 'audio/webm',
            'mp3'  => 'audio/mp3',
            'wav'  => 'audio/wav',
            'ogg'  => 'audio/ogg',
            'm4a'  => 'audio/m4a',
            'aac'  => 'audio/aac',
            'flac' => 'audio/flac',
            'aiff' => 'audio/aiff',
            'opus' => 'audio/opus',
            'mpeg' => 'audio/mpeg',
        ];

        if (isset($map[$extension])) {
            return $map[$extension];
        }

        if (function_exists('mime_content_type') && file_exists($filePath)) {
            $detected = @mime_content_type($filePath);
            if (! empty($detected) && str_starts_with($detected, 'audio/')) {
                return $detected;
            }
        }

        return 'audio/webm';
    }

    /**
     * Extract the actual text content from a Gemini response, skipping
     * thoughtSignature parts that thinking models (e.g. gemini-3.6-flash) include.
     */
    protected static function extractTextFromResponse(?array $responseData): ?string
    {
        if (empty($responseData)) {
            return null;
        }

        $parts = $responseData['candidates'][0]['content']['parts'] ?? [];

        // Find the part that has a 'text' key but NOT a 'thoughtSignature' or 'thought' key
        $textParts = [];
        foreach ($parts as $part) {
            if (isset($part['text']) && !isset($part['thought'])) {
                $textParts[] = $part['text'];
            }
        }

        // Return the last non-thought text part (the actual response)
        if (!empty($textParts)) {
            return end($textParts);
        }

        // Fallback: just grab any text from parts[0]
        return $parts[0]['text'] ?? null;
    }
}
