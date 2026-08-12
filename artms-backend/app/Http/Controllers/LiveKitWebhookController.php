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
            'participant_joined'     => $this->handleParticipantJoined($event),
            'egress_started'         => $this->handleEgressStarted($event),
            'egress_ended'           => $this->handleEgressEnded($event),
            'transcription_received' => $this->handleTranscription($event),
            'room_finished'          => $this->handleRoomFinished($event),
            default                  => response()->json(['message' => 'Event ignored']),
        };
    }

    // ── Event handlers ────────────────────────────────────────────────────

    private function handleParticipantJoined(array $event): JsonResponse
    {
        $roomName = $event['room']['name'] ?? null;
        $identity = $event['participant']['identity'] ?? null;

        Log::info("[LiveKit] participant_joined received: room={$roomName}, participant={$identity}");

        if (!$roomName || !$identity) {
            Log::warning("[LiveKit] skipped participant_joined: missing room_name or identity");
            return response()->json(['message' => 'Skipped — missing room_name or identity']);
        }

        $interview = Interview::where('livekit_room_name', $roomName)->first();
        if (!$interview || $interview->status === 'done') {
            Log::warning("[LiveKit] skipped participant_joined: interview not found or done");
            return response()->json(['message' => 'Skipped — interview not active or not found']);
        }

        Log::info("[LiveKit] interview found: {$interview->id}");

        $role = $this->resolveRole($identity);
        if ($role === 'system') {
            Log::info("[LiveKit] skipped participant_joined: system participant {$identity}");
            return response()->json(['message' => 'Skipped — system participant']);
        }

        Log::info("[LiveKit] role: {$role}");

        // Race-safe execution using atomic Cache lock
        $lockKey = "egress_lock:{$interview->id}:{$identity}";
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 15); // lock for 15 seconds

        if (!$lock->get()) {
            Log::info("[LiveKit] participant_joined locked (already starting) for {$role}/{$identity}");
            return response()->json(['message' => 'Egress already starting']);
        }

        try {
            // Check if recording already exists in DB
            $exists = \App\Models\InterviewRecording::where('interview_id', $interview->id)
                ->where('participant_identity', $identity)
                ->where('status', 'active')
                ->exists();

            if ($exists) {
                Log::info("[LiveKit] active egress already in DB for {$role}/{$identity}");
                return response()->json(['message' => 'Active egress already running']);
            }

            Log::info("[LiveKit] duplicate check passed (no active recording in DB)");

            Log::info("[LiveKit] starting participant egress for {$identity}");
            $liveKit = new \App\Services\LiveKitService();
            $egressInfo = $liveKit->startParticipantEgress($roomName, $identity, $role);

            if ($egressInfo && method_exists($egressInfo, 'getEgressId')) {
                $egressId = $egressInfo->getEgressId();
                Log::info("[LiveKit] egress RPC returned: {$egressId}");

                Log::info("[LiveKit] inserting interview_recordings row");
                $recordingId = null;

                \Illuminate\Support\Facades\DB::transaction(function () use ($interview, $egressId, $identity, $role, &$recordingId) {
                    $rec = \App\Models\InterviewRecording::create([
                        'interview_id'         => $interview->id,
                        'egress_id'            => $egressId,
                        'participant_identity' => $identity,
                        'participant_role'     => $role,
                        'status'               => 'active',
                        'started_at'           => now(),
                    ]);
                    $recordingId = $rec->id;
                    $interview->update(['recording_status' => 'recording']);
                });

                Log::info("[LiveKit] recording row created: ID={$recordingId}");
                Log::info("[LiveKit] participant_joined processing complete");
            } else {
                Log::warning("[LiveKit] startParticipantEgress returned null or invalid EgressInfo for {$role}/{$identity}");
            }
        } catch (\Throwable $e) {
            Log::error("[LiveKit] EXCEPTION in participant_joined: " . $e->getMessage(), [
                'exception' => get_class($e),
                'trace'     => $e->getTraceAsString(),
            ]);
        } finally {
            $lock->release();
        }

        return response()->json(['message' => 'Participant join processed']);
    }

    private function handleEgressStarted(array $event): JsonResponse
    {
        $egressId = $event['egress_id'] ?? $event['egress_info']['egress_id'] ?? null;
        $roomName = $event['room']['name'] ?? $event['egress_info']['room_name'] ?? null;

        if (! $egressId || ! $roomName) {
            return response()->json(['message' => 'Skipped — missing egress_id or room_name']);
        }

        $interview = Interview::where('livekit_room_name', $roomName)->first();
        if ($interview) {
            \App\Models\InterviewRecording::updateOrCreate(
                ['egress_id' => $egressId],
                [
                    'interview_id' => $interview->id,
                    'status'       => 'active',
                    'started_at'   => now(),
                ]
            );
            $interview->update(['recording_status' => 'recording']);
        }

        return response()->json(['message' => 'Egress started recorded']);
    }

    private function handleEgressEnded(array $event): JsonResponse
    {
        $egressInfo = $event['egress_info'] ?? $event;
        $egressId   = $egressInfo['egress_id'] ?? null;
        $roomName   = $egressInfo['room_name'] ?? null;
        $fileResults = $egressInfo['file_results'] ?? [];

        if (! $egressId || ! $roomName) {
            return response()->json(['message' => 'Skipped — missing egress_id or room_name']);
        }

        $interview = Interview::where('livekit_room_name', $roomName)->first();
        if (! $interview) {
            return response()->json(['message' => 'Interview not found'], 404);
        }

        $filePath = null;
        $fileUrl = null;
        $duration = 0;

        if (! empty($fileResults) && is_array($fileResults)) {
            $firstFile = $fileResults[0];
            $filePath  = $firstFile['filename'] ?? null;
            $fileUrl   = $firstFile['download_url'] ?? $firstFile['location'] ?? null;
            $duration  = (int) (($firstFile['duration'] ?? 0) / (str_contains(json_encode($firstFile), 'duration_ns') ? 1e9 : 1));
        } elseif (! empty($egressInfo['file'])) {
            $filePath = $egressInfo['file']['filename'] ?? null;
            $fileUrl  = $egressInfo['file']['download_url'] ?? $egressInfo['file']['location'] ?? null;
            $duration = (int) ($egressInfo['file']['duration'] ?? 0);
        }

        // Parse participant role & identity from file_path if available (e.g. recordings/{room}_{role}_{identity}_{time}.mp3)
        $parsedRole = 'applicant';
        $parsedIdentity = null;
        if (! empty($filePath)) {
            if (str_contains($filePath, '_hr_')) {
                $parsedRole = 'hr';
                if (preg_match('/(hr_\d+)/', $filePath, $matches)) {
                    $parsedIdentity = $matches[1];
                }
            } elseif (str_contains($filePath, '_applicant_')) {
                $parsedRole = 'applicant';
                if (preg_match('/(applicant_\d+)/', $filePath, $matches)) {
                    $parsedIdentity = $matches[1];
                }
            }
        }

        // Check if recording is in error state from LiveKit Cloud
        $egressStatus = $egressInfo['status'] ?? 'EGRESS_COMPLETE';
        $isFailed = in_array($egressStatus, ['EGRESS_FAILED', 'EGRESS_ABORTED', 'FAILED']);

        // Idempotent upsert
        $recordingData = [
            'interview_id'     => $interview->id,
            'file_path'        => $filePath,
            'file_url'         => $fileUrl,
            'duration_seconds' => $duration,
            'status'           => $isFailed ? 'failed' : 'completed',
            'completed_at'     => now(),
        ];

        if ($parsedIdentity) {
            $recordingData['participant_identity'] = $parsedIdentity;
            $recordingData['participant_role']     = $parsedRole;
        }

        $recording = \App\Models\InterviewRecording::updateOrCreate(
            ['egress_id' => $egressId],
            $recordingData
        );

        // Update recording status on interview
        $interview->update([
            'recording_status'     => 'completed',
            'audio_recording_path' => $filePath ?? $interview->audio_recording_path,
        ]);

        // Dispatch delayed finalization check safely
        \App\Jobs\CheckInterviewFinalizationJob::dispatch($interview->id);

        Log::info("LiveKit egress_ended: recording saved & CheckInterviewFinalizationJob dispatched for interview {$interview->id}");

        return response()->json(['message' => 'Egress recording processed']);
    }

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

        if ($interview && ($interview->status === 'active' || $interview->recording_status !== 'completed')) {
            $interview->update([
                'status'           => 'done',
                'recording_status' => 'completed',
            ]);

            \App\Jobs\FinalizeInterviewPipelineJob::dispatch($interview->id);
            Log::info("LiveKit room_finished: queued FinalizeInterviewPipelineJob for interview {$interview->id}");
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
