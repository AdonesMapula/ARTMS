<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateAIInterviewReportJob;
use App\Mail\InterviewInvitationMail;
use App\Models\AuditLog;
use App\Models\Interview;
use App\Models\InterviewTranscript;
use App\Services\GeminiService;
use App\Services\LiveKitService;
use App\Services\NotificationRecipientResolver;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InterviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $interviews = Interview::with(['applicant', 'jobPosting.jobLibrary', 'interviewer'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->stage, fn ($q) => $q->where('interview_stage', $request->stage))
            ->when($request->applicant_id, fn ($q) => $q->where('applicant_id', $request->applicant_id))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($interviews);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'applicant_id'    => ['required', 'exists:applicants,id'],
            'job_posting_id'  => ['required', 'exists:job_postings,id'],
            'interview_stage' => ['required', 'string'],
            'scheduled_at'    => ['required', 'date'],
            'location'        => ['nullable', 'string'],
            'meeting_link'       => ['nullable', 'url'],
            'interview_type'     => ['required', 'in:in_person,online,phone'],
            'interviewer_id'     => ['nullable', 'exists:users,id'],
            'notes'              => ['nullable', 'string'],
            'contact_email'      => ['nullable', 'string'],
            'contact_number'     => ['nullable', 'string'],
            'notify_applicant'   => ['nullable', 'boolean'],
            'notify_interviewer' => ['nullable', 'boolean'],
        ]);

        $interview = Interview::create($data);

        // Auto-generate meeting link for online interviews if not specified
        if ($interview->interview_type === 'online' && empty($interview->meeting_link)) {
            $baseUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $interview->update(['meeting_link' => "{$baseUrl}/interview/{$interview->id}/room"]);
        }

        // Send invitation email using the proper template with stage label
        $applicant = $interview->applicant;
        $formattedTime = \Carbon\Carbon::parse($interview->scheduled_at)->format('M d, Y \a\t g:i A');

        $stageLabels = [
            'technical_assessment' => 'Technical Assessment',
            'initial_screening'    => 'Initial Screening',
            'hr_interview'         => 'HR Interview',
            'managerial_interview' => 'Managerial Interview',
            'final'                => 'Final Interview',
            'interview_1'          => 'Initial Interview',
            'interview_2'          => 'Second Interview',
        ];
        $stageLabel = $stageLabels[$interview->interview_stage] ?? ucwords(str_replace('_', ' ', $interview->interview_stage));

        $shouldNotifyApplicant = $request->input('notify_applicant', true);

        if ($applicant && !empty($applicant->email) && $shouldNotifyApplicant) {
            $interview->update(['invitation_sent' => true]);
            NotificationService::dispatchAsyncMail(function () use ($applicant, $interview, $stageLabel) {
                try {
                    Mail::to($applicant->email)->send(new InterviewInvitationMail($applicant, $interview, $stageLabel));
                } catch (\Throwable $e) {
                    \Log::error("Failed to send interview invitation to {$applicant->email}: " . $e->getMessage());
                }
            });
        }

        // Notify targeted interviewer & scheduler
        $recipients = NotificationRecipientResolver::resolve('interview.scheduled', $interview, auth()->user());
        NotificationService::notifyRecipients(
            $recipients,
            'New Interview Scheduled',
            "{$stageLabel} session scheduled for {$applicant?->first_name} {$applicant?->last_name} on {$formattedTime}.",
            '/admin/interviews',
            'interview',
            'interview',
            $interview->id
        );

        // Update applicant status
        $stageStatus = [
            'technical_assessment' => 'interview_1_scheduled',
            'initial_screening'    => 'interview_1_scheduled',
            'hr_interview'         => 'interview_2_scheduled',
            'managerial_interview' => 'interview_2_scheduled',
            'final'                => 'interview_2_scheduled',
            'interview_1'          => 'interview_1_scheduled',
            'interview_2'          => 'interview_2_scheduled',
        ];
        $applicant->update(['status' => $stageStatus[$data['interview_stage']] ?? $applicant->status]);

        AuditLog::record('create', 'interview', "Scheduled interview for applicant ID {$data['applicant_id']}");

        return response()->json(['message' => 'Interview scheduled. Invitation sent.', 'interview' => $interview], 201);
    }

    public function show(Interview $interview): JsonResponse
    {
        return response()->json([
            'interview' => $interview->load([
                'applicant.aiEvaluation',
                'applicant.jobPosting.jobLibrary',
                'jobPosting.jobLibrary',
                'interviewer',
            ]),
        ]);
    }

    public function update(Request $request, Interview $interview): JsonResponse
    {
        $data = $request->validate([
            'scheduled_at'     => ['sometimes', 'date'],
            'status'           => ['sometimes', 'in:scheduled,confirmed,done,cancelled,no_show'],
            'rating_score'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'evaluation_notes' => ['nullable', 'string'],
            'rubric_scores'    => ['nullable', 'array'],
            'hr_decision'      => ['sometimes', 'in:pass,fail,pending'],
            'ai_summary'       => ['nullable', 'string'],
            'ai_recommendation' => ['nullable', 'string'],
        ]);

        $interview->update($data);

        // Update applicant status if marked done
        if (isset($data['status']) && $data['status'] === 'done') {
            $stageStatus = [
                'interview_1' => 'interview_1_done',
                'interview_2' => 'interview_2_done',
                'final'       => 'interview_2_done',
            ];
            $interview->applicant->update([
                'status' => $stageStatus[$interview->interview_stage] ?? $interview->applicant->status,
            ]);
        }

        return response()->json(['message' => 'Interview updated.', 'interview' => $interview->fresh()]);
    }

    /**
     * /api/interviews/{id}/confirm — applicant confirms attendance
     */
    public function confirm(Request $request, Interview $interview)
    {
        $interview->update([
            'applicant_confirmed'    => true,
            'applicant_confirmed_at' => now(),
            'status'                 => 'confirmed',
        ]);

        $applicantName = $interview->applicant ? "{$interview->applicant->first_name} {$interview->applicant->last_name}" : "Applicant";
        $recipients = NotificationRecipientResolver::resolve('interview.scheduled', $interview);
        NotificationService::notifyRecipients(
            $recipients,
            'Interview Confirmed by Candidate',
            "Candidate {$applicantName} confirmed attendance for their interview session.",
            '/admin/interviews',
            'interview',
            'interview',
            $interview->id
        );

        if ($request->wantsJson() && ! $request->isMethod('get')) {
            return response()->json(['message' => 'Interview confirmed. A reminder will be sent before the interview.']);
        }

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $roomUrl = "{$frontendUrl}/interview/{$interview->id}/room";
        return redirect()->away($roomUrl);
    }

    /**
     * POST /api/interviews/{id}/send-reminder
     */
    public function sendReminder(Interview $interview): JsonResponse
    {
        $applicant = $interview->applicant;

        Mail::send('emails.interview_reminder', [
            'applicant' => $applicant,
            'interview' => $interview,
        ], function ($mail) use ($applicant) {
            $mail->to($applicant->email)
                 ->subject('Interview Reminder — ARTMS');
        });

        $interview->update(['reminder_sent' => true]);

        return response()->json(['message' => 'Reminder sent.']);
    }

    // ── Video Session Endpoints ───────────────────────────────────────────

    /**
     * POST /api/interviews/{id}/livekit-token
     *
     * Validates that the authenticated user belongs to this interview
     * (either as the assigned interviewer/HR or as the applicant via email),
     * then returns a signed LiveKit JWT so the client can join the room.
     */
    public function generateToken(Request $request, Interview $interview): JsonResponse
    {
        $user = $request->user();

        // ── Authorisation: must be the interviewer or a super_admin/hr_admin ──
        $isHr = in_array($user->role, ['hr_admin', 'super_admin', 'coo']);
        $isAssignedInterviewer = $interview->interviewer_id === $user->id;

        if (! $isHr && ! $isAssignedInterviewer) {
            return response()->json(['message' => 'Forbidden. You are not part of this interview.'], 403);
        }

        // ── Lazily create / reuse a room name ─────────────────────────────
        if (! $interview->livekit_room_name) {
            $roomName = 'artms-interview-' . $interview->id . '-' . Str::random(8);
            $interview->update(['livekit_room_name' => $roomName]);
        } else {
            $roomName = $interview->livekit_room_name;
        }

        // ── Build participant identity and display name ───────────────────
        $identity    = 'hr_' . $user->id;
        $displayName = $user->name . ' (HR)';

        try {
            $liveKit = new LiveKitService();

            // Ensure the room exists in LiveKit Cloud
            $liveKit->ensureRoom($roomName);

            $token = $liveKit->generateToken(
                roomName:              $roomName,
                participantIdentity:   $identity,
                participantName:       $displayName,
                canPublish:            true,
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to generate LiveKit token: ' . $e->getMessage(),
            ], 500);
        }

        // Mark session as active
        if ($interview->status === 'confirmed' || $interview->status === 'scheduled') {
            $interview->update(['status' => 'active']);
        }

        AuditLog::record('livekit_join', 'interview', "User {$user->id} joined interview room {$interview->id}");

        $interview->load([
            'applicant.aiEvaluation',
            'applicant.jobPosting.jobLibrary',
            'jobPosting.jobLibrary',
            'interviewer',
        ]);

        return response()->json([
            'token'        => $token,
            'room_name'    => $roomName,
            'livekit_host' => config('services.livekit.host'),
            'identity'     => $identity,
            'interview'    => $interview,
            'applicant'    => $interview->applicant,
            'job_title'    => $interview->jobPosting?->jobLibrary?->job_title ?? $interview->applicant?->jobPosting?->jobLibrary?->job_title ?? 'Interview Session',
        ]);
    }

    /**
     * POST /api/interviews/{id}/end-session
     *
     * Marks the interview as done and triggers the pipeline job.
     */
    public function endSession(Interview $interview): JsonResponse
    {
        $interview->update([
            'status'               => 'done',
            'recording_status'     => 'completed',
            'transcription_status' => 'processing',
            'analysis_status'      => 'processing',
            'report_status'        => 'processing',
        ]);

        // Queue post-interview pipeline job asynchronously
        try {
            \App\Jobs\FinalizeInterviewPipelineJob::dispatch($interview->id);
        } catch (\Throwable $e) {
            \Log::warning("endSession pipeline dispatch notice: " . $e->getMessage());
        }

        // Update applicant status
        $stageStatus = [
            'interview_1' => 'interview_1_done',
            'interview_2' => 'interview_2_done',
            'final'       => 'interview_2_done',
        ];
        if ($interview->applicant) {
            $interview->applicant->update([
                'status' => $stageStatus[$interview->interview_stage] ?? $interview->applicant->status,
            ]);
        }

        AuditLog::record('end_session', 'interview', "Interview session ended: {$interview->id}");

        return response()->json([
            'message'           => 'Session ended successfully. Post-interview processing queued.',
            'processing_status' => [
                'recording'     => $interview->recording_status,
                'transcription' => $interview->transcription_status,
                'analysis'      => $interview->analysis_status,
                'report'        => $interview->report_status,
            ],
        ]);
    }

    /**
     * GET /api/interviews/{id}/processing-status
     */
    public function getProcessingStatus(Interview $interview): JsonResponse
    {
        return response()->json([
            'interview_id' => $interview->id,
            'status'       => $interview->status,
            'recording'    => $interview->recording_status ?? 'completed',
            'transcription' => $interview->transcription_status ?? 'completed',
            'analysis'     => $interview->analysis_status ?? 'completed',
            'report'       => $interview->report_status ?? ($interview->aiReport ? 'completed' : 'pending'),
        ]);
    }

    /**
     * POST /api/interviews/{id}/behavioral-metrics
     * Save applicant aggregated MediaPipe facial metrics at session end.
     */
    public function saveBehavioralMetrics(Request $request, Interview $interview): JsonResponse
    {
        $metrics = $request->input('metrics', []);
        $affectMetrics = $request->input('affect_metrics', null);

        $payload = [
            'aggregated_metrics' => $metrics,
            'is_mocked'          => false,
        ];

        if ($affectMetrics !== null) {
            $payload['affect_metrics'] = $affectMetrics;
        }

        \App\Models\InterviewBehavioralMetric::updateOrCreate(
            ['interview_id' => $interview->id],
            $payload
        );

        return response()->json(['message' => 'Behavioral and affect metrics stored successfully']);
    }

    /**
     * GET /api/interviews/{id}/report
     *
     * Returns the AI report + full transcript for an interview.
     */
    public function report(Interview $interview): JsonResponse
    {
        $interview->load([
            'applicant',
            'jobPosting.jobLibrary',
            'aiReport',
            'transcripts',
        ]);

        // Auto-generate report on the spot if missing
        if (! $interview->aiReport) {
            GenerateAIInterviewReportJob::dispatchSync($interview->id);
            $interview->load('aiReport');
        }

        return response()->json(['interview' => $interview]);
    }

    /**
     * POST /api/public/interviews/{id}/livekit-token
     *
     * Generates a signed LiveKit JWT for the applicant to join the video room.
     */
    public function publicGenerateToken(Request $request, Interview $interview): JsonResponse
    {
        $applicant = $interview->applicant;
        if (! $applicant) {
            return response()->json(['message' => 'Applicant record not found for this interview.'], 404);
        }

        // Check if applicant entered email matches registered email in system
        $email = trim($request->input('email', ''));
        if (! empty($email) && strtolower($email) !== strtolower($applicant->email)) {
            return response()->json([
                'message' => 'The entered email address does not match the registered applicant for this interview.',
            ], 403);
        }

        // Lazily create / reuse a room name
        if (! $interview->livekit_room_name) {
            $roomName = 'artms-interview-' . $interview->id . '-' . Str::random(8);
            $interview->update(['livekit_room_name' => $roomName]);
        } else {
            $roomName = $interview->livekit_room_name;
        }

        $identity    = 'applicant_' . $applicant->id;
        $displayName = $applicant->first_name . ' ' . $applicant->last_name . ' (Applicant)';

        try {
            $liveKit = new LiveKitService();
            $liveKit->ensureRoom($roomName);

            $token = $liveKit->generateToken(
                roomName:            $roomName,
                participantIdentity: $identity,
                participantName:     $displayName,
                canPublish:          true,
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to generate LiveKit token: ' . $e->getMessage(),
            ], 500);
        }

        if ($interview->status === 'confirmed' || $interview->status === 'scheduled') {
            $interview->update(['status' => 'active']);
        }

        return response()->json([
            'token'        => $token,
            'room_name'    => $roomName,
            'livekit_host' => config('services.livekit.host'),
            'identity'     => $identity,
            'applicant'    => [
                'name'  => $applicant->first_name . ' ' . $applicant->last_name,
                'email' => $applicant->email,
            ],
        ]);
    }

    /**
     * POST /api/interviews/{interview}/transcript
     * Save a real-time transcript segment (authenticated HR).
     */
    public function storeTranscript(Request $request, Interview $interview): JsonResponse
    {
        $validated = $request->validate([
            'text'             => ['required', 'string'],
            'speaker_role'     => ['required', 'in:hr,applicant,system'],
            'speaker_identity' => ['nullable', 'string'],
            'segment_offset'   => ['nullable', 'integer'],
            'dialect_detected' => ['nullable', 'string', 'max:50'],
            'translated_text'  => ['nullable', 'string'],
        ]);

        $transcript = InterviewTranscript::create([
            'interview_id'     => $interview->id,
            'speaker_identity' => $validated['speaker_identity'] ?? ($validated['speaker_role'] === 'hr' ? 'hr_' . $request->user()?->id : 'applicant'),
            'speaker_role'     => $validated['speaker_role'],
            'text'             => trim($validated['text']),
            'dialect_detected' => $validated['dialect_detected'] ?? null,
            'translated_text'  => !empty($validated['translated_text']) ? trim($validated['translated_text']) : null,
            'segment_offset'   => $validated['segment_offset'] ?? 0,
            'spoken_at'        => now(),
        ]);

        return response()->json(['message' => 'Transcript saved', 'transcript' => $transcript], 201);
    }

    /**
     * POST /api/public/interviews/{interview}/transcript
     * Save a real-time transcript segment (public applicant).
     */
    public function storePublicTranscript(Request $request, Interview $interview): JsonResponse
    {
        $validated = $request->validate([
            'text'             => ['required', 'string'],
            'speaker_role'     => ['nullable', 'in:hr,applicant,system'],
            'speaker_identity' => ['nullable', 'string'],
            'segment_offset'   => ['nullable', 'integer'],
            'dialect_detected' => ['nullable', 'string', 'max:50'],
            'translated_text'  => ['nullable', 'string'],
        ]);

        $applicant = $interview->applicant;
        $speakerRole = $validated['speaker_role'] ?? 'applicant';

        $transcript = InterviewTranscript::create([
            'interview_id'     => $interview->id,
            'speaker_identity' => $validated['speaker_identity'] ?? ($speakerRole === 'hr' ? 'hr_interviewer' : 'applicant_' . ($applicant?->id ?? '0')),
            'speaker_role'     => $speakerRole,
            'text'             => trim($validated['text']),
            'dialect_detected' => $validated['dialect_detected'] ?? null,
            'translated_text'  => !empty($validated['translated_text']) ? trim($validated['translated_text']) : null,
            'segment_offset'   => $validated['segment_offset'] ?? 0,
            'spoken_at'        => now(),
        ]);

        return response()->json(['message' => 'Transcript saved', 'transcript' => $transcript], 201);
    }

    /**
     * POST /api/interviews/{interview}/transcribe-audio
     * POST /api/public/interviews/{interview}/transcribe-audio
     */
    public function transcribeAudio(Request $request, Interview $interview): JsonResponse
    {
        return $this->processAudioTranscription($request, $interview, defaultRole: 'hr');
    }

    public function publicTranscribeAudio(Request $request, Interview $interview): JsonResponse
    {
        return $this->processAudioTranscription($request, $interview, defaultRole: 'applicant');
    }

    private function processAudioTranscription(Request $request, Interview $interview, string $defaultRole): JsonResponse
    {
        $request->validate([
            'audio'            => ['nullable', 'file'],
            'audio_file'       => ['nullable', 'file'],
            'speaker_role'     => ['nullable', 'in:hr,applicant,system'],
            'speaker_identity' => ['nullable', 'string'],
            'dialect_detected' => ['nullable', 'string', 'max:50'],
        ]);

        $audioFile = $request->file('audio') ?? $request->file('audio_file');
        if (! $audioFile || ! $audioFile->isValid()) {
            return response()->json(['message' => 'No valid audio chunk provided', 'transcript' => null], 200);
        }

        $speakerRole = $request->input('speaker_role', $defaultRole);
        $identity = $request->input('speaker_identity') ?? ($speakerRole === 'hr' ? 'hr_' . ($request->user()?->id ?? '0') : 'applicant_' . ($interview->applicant_id ?? '0'));
        $dialectDetected = $request->input('dialect_detected', null);

        // ── Primary Engine: Gemini 3.5 Transcribe (gemini-3.5-transcribe) ────────
        try {
            $options = [];
            if (! empty($dialectDetected)) {
                $options['language_codes'] = [$dialectDetected];
            }

            $geminiResult = GeminiService::transcribeAudio(
                $audioFile->getRealPath(),
                $audioFile->getClientMimeType() ?: 'audio/webm',
                $options
            );

            $text = trim($geminiResult['text'] ?? '');

            if (! empty($text)) {
                $transcript = InterviewTranscript::create([
                    'interview_id'     => $interview->id,
                    'speaker_identity' => $identity,
                    'speaker_role'     => $speakerRole,
                    'text'             => $text,
                    'dialect_detected' => $dialectDetected,
                    'segment_offset'   => 0,
                    'spoken_at'        => now(),
                ]);

                return response()->json([
                    'message'    => 'Audio transcribed successfully via Gemini 3.5 Transcribe',
                    'transcript' => $transcript,
                    'model'      => 'gemini-3.5-transcribe',
                ], 201);
            }
        } catch (\Throwable $geminiEx) {
            \Illuminate\Support\Facades\Log::warning("Gemini 3.5 Transcribe notice in controller: " . $geminiEx->getMessage());
        }

        // ── Secondary Fallback: Groq / OpenAI Whisper ─────────────────────────
        $apiKey = config('services.groq.key') ?? env('GROQ_API_KEY') ?? config('services.openai.key') ?? env('OPENAI_API_KEY');

        if (! empty($apiKey)) {
            try {
                $isGroq = str_starts_with($apiKey, 'gsk_');
                $endpoint = $isGroq
                    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
                    : 'https://api.openai.com/v1/audio/transcriptions';
                $model = $isGroq ? 'whisper-large-v3-turbo' : 'whisper-1';

                $client = new \GuzzleHttp\Client(['verify' => false, 'timeout' => 20]);
                $response = $client->post($endpoint, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $apiKey,
                    ],
                    'multipart' => [
                        [
                            'name'     => 'file',
                            'contents' => fopen($audioFile->getRealPath(), 'r'),
                            'filename' => $audioFile->getClientOriginalName() ?: 'audio.webm',
                        ],
                        [
                            'name'     => 'model',
                            'contents' => $model,
                        ],
                    ],
                ]);

                $result = json_decode((string) $response->getBody(), true);
                $text = trim($result['text'] ?? '');

                if (! empty($text)) {
                    $transcript = InterviewTranscript::create([
                        'interview_id'     => $interview->id,
                        'speaker_identity' => $identity,
                        'speaker_role'     => $speakerRole,
                        'text'             => $text,
                        'dialect_detected' => $dialectDetected,
                        'segment_offset'   => 0,
                        'spoken_at'        => now(),
                    ]);

                    return response()->json([
                        'message'    => 'Audio transcribed successfully via Whisper fallback',
                        'transcript' => $transcript,
                        'model'      => $model,
                    ], 201);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Whisper STT fallback notice: " . $e->getMessage());
            }
        }

        return response()->json(['message' => 'No speech detected', 'transcript' => null], 200);
    }

    /**
     * GET /api/interviews/{interview}/transcripts
     * Fetch all stored transcripts for an interview.
     */
    public function getTranscripts(Interview $interview): JsonResponse
    {
        $transcripts = $interview->transcripts()
            ->select(['id', 'interview_id', 'speaker_identity', 'speaker_role', 'text', 'dialect_detected', 'translated_text', 'segment_offset', 'spoken_at', 'created_at'])
            ->orderBy('spoken_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json(['transcripts' => $transcripts]);
    }

    /**
     * POST /api/interviews/{interview}/notes
     * Save interviewer live evaluation notes.
     */
    public function saveNotes(Request $request, Interview $interview): JsonResponse
    {
        $notes = $request->input('notes', '');
        $interview->update(['evaluation_notes' => $notes]);

        return response()->json(['message' => 'Notes saved successfully']);
    }

    /**
     * POST /api/interviews/{interview}/analyze-live
     * Analyzes recent speech transcripts using xAI Grok API to provide live sentiment & keyword breakdown.
     */
    public function analyzeLive(Request $request, Interview $interview): JsonResponse
    {
        $transcripts = $interview->transcripts()->orderBy('created_at', 'asc')->get();

        if ($transcripts->isEmpty()) {
            return response()->json([
                'confidence_score' => 80,
                'enthusiasm_score' => 75,
                'calmness_score'   => 85,
                'keywords'         => ['COMMUNICATION SKILLS', 'PROBLEM SOLVING', 'ACTIVE LISTENING', 'LEADERSHIP'],
                'overall_match'    => 82,
                'source'           => 'default_baseline',
            ]);
        }

        $dialogueText = $transcripts->map(fn($t) => strtoupper($t->speaker_role) . ': ' . $t->text)->implode("\n");
        
        // Apply Input Guardrails: Sanitize dialogue and defuse prompt injections
        $cleanDialogue = \App\Services\AiGuardrailService::sanitizeInput($dialogueText, 8000);
        $safeDialogue = \App\Services\AiGuardrailService::detectAndNeutralizePromptInjection($cleanDialogue, 'Live Interview Analysis: Interview #' . $interview->id);

        $apiKey = config('services.xai.key');

        if (empty($apiKey)) {
            // Smart local keyword extraction fallback
            $allText = strtolower($safeDialogue);
            $possibleKeywords = ['COMMUNICATION SKILLS', 'LEADERSHIP', 'PROBLEM SOLVING', 'SCALABILITY', 'ACTIVE LISTENING', 'CUSTOMER HANDLING', 'TEAMWORK', 'CRITICAL THINKING'];
            $foundKeywords = array_values(array_filter($possibleKeywords, fn($k) => str_contains($allText, strtolower($k))));

            $heuristicData = [
                'confidence_score' => 84,
                'enthusiasm_score' => 78,
                'calmness_score'   => 82,
                'keywords'         => !empty($foundKeywords) ? $foundKeywords : ['COMMUNICATION SKILLS', 'LEADERSHIP', 'PROBLEM SOLVING'],
                'overall_match'    => 85,
                'source'           => 'heuristic',
            ];

            return response()->json(\App\Services\AiGuardrailService::enforceLiveAnalysisSchema($heuristicData));
        }

        try {
            $client = \OpenAI::factory()
                ->withApiKey($apiKey)
                ->withBaseUri('https://api.x.ai/v1')
                ->withHttpClient(new \GuzzleHttp\Client(['verify' => false, 'timeout' => 15]))
                ->make();

            $prompt = <<<PROMPT
Analyze the following live interview speech snippet and extract:
1. Confidence score (0-100)
2. Enthusiasm score (0-100)
3. Calmness score (0-100)
4. Top 6 professional skills/keywords mentioned or displayed (UPPERCASE string array)
5. Overall job match percentage (0-100)

Transcript:
{$safeDialogue}

Respond ONLY with valid JSON in this format:
{
  "confidence_score": 85,
  "enthusiasm_score": 75,
  "calmness_score": 80,
  "keywords": ["COMMUNICATION SKILLS", "PROBLEM SOLVING", "LEADERSHIP", "SCALABILITY"],
  "overall_match": 88
}
PROMPT;

            $response = $client->chat()->create([
                'model'       => 'grok-4.5',
                'temperature' => 0.2,
                'max_tokens'  => 300,
                'messages'    => [
                    ['role' => 'system', 'content' => 'You are an HR analytics AI. Output valid JSON only.'],
                    ['role' => 'user',   'content' => $prompt],
                ],
            ]);

            $content = $response->choices[0]->message->content ?? '';
            $content = preg_replace('/^```json\s*/i', '', trim($content));
            $content = preg_replace('/```\s*$/', '', $content);
            $parsed = json_decode($content, true);

            if ($parsed && isset($parsed['confidence_score'])) {
                $guarded = \App\Services\AiGuardrailService::enforceLiveAnalysisSchema($parsed);
                $guarded['source'] = 'grok-4.5';
                return response()->json($guarded);
            }
        } catch (\Throwable $e) {
            // Graceful fallback
        }

        $fallbackData = [
            'confidence_score' => 82,
            'enthusiasm_score' => 76,
            'calmness_score'   => 84,
            'keywords'         => ['COMMUNICATION SKILLS', 'PROBLEM SOLVING', 'ACTIVE LISTENING', 'LEADERSHIP'],
            'overall_match'    => 84,
            'source'           => 'fallback',
        ];

        return response()->json(\App\Services\AiGuardrailService::enforceLiveAnalysisSchema($fallbackData));
    }

    /**
     * DELETE /api/interviews/{interview}
     * Delete an interview record and its associated transcripts.
     */
    /**
     * DELETE /api/interviews/{interview}
     * Delete an interview record and its associated transcripts.
     */
    public function destroy(Interview $interview): JsonResponse
    {
        $id = $interview->id;
        $applicantName = $interview->applicant ? "{$interview->applicant->first_name} {$interview->applicant->last_name}" : "Applicant";

        $interview->transcripts()->delete();
        $interview->delete();

        AuditLog::record('delete', 'interview', "Deleted interview session #{$id} for {$applicantName}");

        return response()->json([
            'message' => 'Interview record deleted successfully.',
        ]);
    }

    /**
     * POST /api/interviews/{interview}/resend-invitation
     * Resend interview invitation email to applicant.
     */
    public function resendInvitation(Interview $interview): JsonResponse
    {
        $applicant = $interview->applicant;
        if (! $applicant || empty($applicant->email)) {
            return response()->json(['message' => 'Applicant email not found.'], 422);
        }

        $stageLabels = [
            'technical_assessment' => 'Technical Assessment',
            'initial_screening'    => 'Initial Screening',
            'hr_interview'         => 'HR Interview',
            'managerial_interview' => 'Managerial Interview',
            'final'                => 'Final Interview',
            'interview_1'          => 'Initial Interview',
            'interview_2'          => 'Second Interview',
        ];
        $stageLabel = $stageLabels[$interview->interview_stage] ?? ucwords(str_replace('_', ' ', $interview->interview_stage ?? 'interview'));

        NotificationService::dispatchAsyncMail(function () use ($applicant, $interview, $stageLabel) {
            try {
                Mail::to($applicant->email)->send(new InterviewInvitationMail($applicant, $interview, $stageLabel));
            } catch (\Throwable $e) {
                \Log::error("Failed to resend interview invitation to {$applicant->email}: " . $e->getMessage());
            }
        });

        $interview->update(['invitation_sent' => true]);

        return response()->json(['message' => "Interview invitation resent to {$applicant->email}."]);
    }
}
