<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Primary and reserve Gemini models in order of preference.
     */
    protected static array $models = [
        'gemini-3.6-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
    ];

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
     * Execute a prompt expecting a structured JSON object response with dual-key & multi-model fallback.
     *
     * @param string $prompt
     * @param string|null $systemInstruction
     * @param float $temperature
     * @param int $maxTokens
     * @return array|null
     * @throws \Exception
     */
    public static function generateJson(
        string $prompt,
        ?string $systemInstruction = null,
        float $temperature = 0.2,
        int $maxTokens = 2048
    ): ?array {
        $keys = self::getApiKeys();

        if (empty($keys)) {
            throw new \Exception('Gemini API key is not configured. Please set GEMINI_API_KEY or RESERVE_GEMINI_API_KEY in your environment.');
        }

        $lastError = null;

        foreach ($keys as $keyIndex => $apiKey) {
            $keyLabel = $keyIndex === 0 ? 'Primary Key' : 'Reserve Key';

            foreach (self::$models as $model) {
                try {
                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                    $payload = [
                        'contents' => [
                            [
                                'role'  => 'user',
                                'parts' => [
                                    ['text' => $prompt],
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
                        ->timeout(60)
                        ->post($url, $payload);

                    if ($response->successful()) {
                        $rawText = $response->json('candidates.0.content.parts.0.text');

                        if (! empty($rawText)) {
                            // Strip any accidental markdown formatting
                            $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($rawText));
                            $cleanJson = preg_replace('/```\s*$/', '', $cleanJson);

                            $parsed = json_decode(trim($cleanJson), true);
                            if (is_array($parsed)) {
                                return $parsed; // Success!
                            }
                        }
                    } else {
                        $errorBody = $response->json('error.message') ?? "HTTP {$response->status()} error";
                        $lastError = "[{$keyLabel} - {$model}] {$errorBody}";
                        Log::warning("Gemini API call failed using {$keyLabel} with model {$model}: {$errorBody}. Trying next fallback...");
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
     * Execute a prompt expecting a plain text response with dual-key & multi-model fallback.
     */
    public static function generateText(
        string $prompt,
        ?string $systemInstruction = null,
        float $temperature = 0.2,
        int $maxTokens = 2048
    ): ?string {
        $keys = self::getApiKeys();

        if (empty($keys)) {
            throw new \Exception('Gemini API key is not configured. Please set GEMINI_API_KEY or RESERVE_GEMINI_API_KEY in your environment.');
        }

        $lastError = null;

        foreach ($keys as $keyIndex => $apiKey) {
            $keyLabel = $keyIndex === 0 ? 'Primary Key' : 'Reserve Key';

            foreach (self::$models as $model) {
                try {
                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                    $payload = [
                        'contents' => [
                            [
                                'role'  => 'user',
                                'parts' => [
                                    ['text' => $prompt],
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
                        ->timeout(60)
                        ->post($url, $payload);

                    if ($response->successful()) {
                        $rawText = $response->json('candidates.0.content.parts.0.text');
                        if (! empty($rawText)) {
                            return trim($rawText);
                        }
                    } else {
                        $errorBody = $response->json('error.message') ?? "HTTP {$response->status()} error";
                        $lastError = "[{$keyLabel} - {$model}] {$errorBody}";
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
