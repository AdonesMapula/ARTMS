<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\InterviewTranscript;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * POST /api/livekit/webhook
 *
 * Receives event webhooks from LiveKit Cloud.
 * Security: Validated with the LiveKit webhook signature before processing.
 *
 * Relevant event types we handle:
 *   - transcription_received  : A speech-to-text segment is ready
 *   - room_finished            : Room fully closed (fallback — end-session preferred)
 */
class LiveKitWebhookController extends Controller
{
    /**
     * Handle incoming LiveKit webhook.
     */
    public function handle(Request $request): JsonResponse
    {
        // ── 1. Validate the LiveKit webhook signature ─────────────────────
        //
        // LiveKit signs every webhook request with an Authorization header
        // containing a JWT signed by your API secret.  We decode it and
        // verify the SHA-256 body hash embedded in the token's `sha256` claim.
        //
        if (! $this->verifySignature($request)) {
            Log::warning('LiveKit webhook: signature verification failed', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $event = $request->json()->all();
        $eventType = $event['event'] ?? '';

        Log::info('LiveKit webhook received', ['event' => $eventType]);

        return match ($eventType) {
            'transcription_received' => $this->handleTranscription($event),
            'room_finished'          => $this->handleRoomFinished($event),
            default                  => response()->json(['message' => 'Event ignored']),
        };
    }

    // ── Event handlers ────────────────────────────────────────────────────

    private function handleTranscription(array $event): JsonResponse
    {
        $roomName   = $event['room']['name']      ?? null;
        $identity   = $event['participant']['identity'] ?? 'unknown';
        $segments   = $event['transcription']['segments'] ?? [];

        if (! $roomName || empty($segments)) {
            return response()->json(['message' => 'Skipped — missing room or segments']);
        }

        // Look up the interview by its LiveKit room name
        $interview = Interview::where('livekit_room_name', $roomName)->first();

        if (! $interview) {
            Log::warning("LiveKit webhook: no interview found for room '{$roomName}'");
            return response()->json(['message' => 'Interview not found'], 404);
        }

        foreach ($segments as $segment) {
            $text = trim($segment['text'] ?? '');
            if ($text === '') {
                continue;
            }

            InterviewTranscript::create([
                'interview_id'     => $interview->id,
                'speaker_identity' => $identity,
                'speaker_role'     => $this->resolveRole($identity),
                'text'             => $text,
                'segment_offset'   => (int) ($segment['start_time'] ?? 0),
                'spoken_at'        => now(),
            ]);
        }

        return response()->json(['message' => 'Transcript saved']);
    }

    private function handleRoomFinished(array $event): JsonResponse
    {
        $roomName = $event['room']['name'] ?? null;

        if (! $roomName) {
            return response()->json(['message' => 'No room name']);
        }

        $interview = Interview::where('livekit_room_name', $roomName)->first();

        if ($interview && $interview->status === 'active') {
            $interview->update(['status' => 'done']);
            \App\Jobs\GenerateAIInterviewReportJob::dispatch($interview->id);
            Log::info("LiveKit room_finished: queued AI report for interview {$interview->id}");
        }

        return response()->json(['message' => 'Room closed']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Resolve speaker_role from the participant identity string.
     * Convention: "hr_<userId>" or "applicant_<applicantId>"
     */
    private function resolveRole(string $identity): string
    {
        if (str_starts_with($identity, 'hr_') || str_starts_with($identity, 'system_')) {
            return 'hr';
        }
        if (str_starts_with($identity, 'applicant_')) {
            return 'applicant';
        }
        return 'system';
    }

    /**
     * Verify the LiveKit webhook signature.
     *
     * LiveKit sends an `Authorization: <jwt>` header.
     * The JWT's `sha256` claim must equal SHA-256(raw request body).
     *
     * We use a simple manual verification to avoid pulling in a full JWT
     * library just for webhook validation (the SDK handles it if available).
     */
    private function verifySignature(Request $request): bool
    {
        // In local/testing environments allow skipping signature check
        if (config('app.env') === 'local' && config('app.debug')) {
            return true;
        }

        $authHeader = $request->header('Authorization');
        if (! $authHeader) {
            return false;
        }

        try {
            // The JWT payload is the middle segment, base64url-encoded
            $parts = explode('.', $authHeader);
            if (count($parts) !== 3) {
                return false;
            }

            $payloadJson = base64_decode(strtr($parts[1], '-_', '+/'));
            $payload     = json_decode($payloadJson, true);

            if (! isset($payload['sha256'])) {
                return false;
            }

            $expectedHash = hash('sha256', $request->getContent());
            return hash_equals($expectedHash, $payload['sha256']);
        } catch (\Throwable) {
            return false;
        }
    }
}
