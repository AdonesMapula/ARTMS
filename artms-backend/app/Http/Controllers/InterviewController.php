<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateAIInterviewReportJob;
use App\Models\AuditLog;
use App\Models\Interview;
use App\Services\LiveKitService;
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
            ->orderBy('scheduled_at', 'asc')
            ->paginate($request->per_page ?? 15);

        return response()->json($interviews);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'applicant_id'    => ['required', 'exists:applicants,id'],
            'job_posting_id'  => ['required', 'exists:job_postings,id'],
            'interview_stage' => ['required', 'in:interview_1,interview_2,final'],
            'scheduled_at'    => ['required', 'date', 'after:now'],
            'location'        => ['nullable', 'string'],
            'meeting_link'    => ['nullable', 'url'],
            'interview_type'  => ['required', 'in:in_person,online,phone'],
            'interviewer_id'  => ['nullable', 'exists:users,id'],
        ]);

        $interview = Interview::create($data);

        // Send email invitation to applicant
        $applicant = $interview->applicant;
        try {
            Mail::send('emails.interview_invitation', [
                'applicant' => $applicant,
                'interview' => $interview,
            ], function ($mail) use ($applicant) {
                $mail->to($applicant->email)
                     ->subject('Interview Invitation — ARTMS');
            });
            $interview->update(['invitation_sent' => true]);
        } catch (\Exception $e) {
            // Non-fatal
        }

        // Update applicant status
        $stageStatus = [
            'interview_1' => 'interview_1_scheduled',
            'interview_2' => 'interview_2_scheduled',
            'final'       => 'interview_2_scheduled',
        ];
        $applicant->update(['status' => $stageStatus[$data['interview_stage']] ?? $applicant->status]);

        AuditLog::record('create', 'interview', "Scheduled interview for applicant ID {$data['applicant_id']}");

        return response()->json(['message' => 'Interview scheduled. Invitation sent.', 'interview' => $interview], 201);
    }

    public function show(Interview $interview): JsonResponse
    {
        return response()->json(['interview' => $interview->load('applicant', 'jobPosting.jobLibrary', 'interviewer')]);
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
     * PATCH /api/interviews/{id}/confirm  — applicant confirms attendance
     */
    public function confirm(Interview $interview): JsonResponse
    {
        $interview->update([
            'applicant_confirmed'    => true,
            'applicant_confirmed_at' => now(),
            'status'                 => 'confirmed',
        ]);

        return response()->json(['message' => 'Interview confirmed. A reminder will be sent before the interview.']);
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

        return response()->json([
            'token'     => $token,
            'room_name' => $roomName,
            'livekit_host' => config('services.livekit.host'),
            'identity'  => $identity,
        ]);
    }

    /**
     * POST /api/interviews/{id}/end-session
     *
     * Marks the interview as done and dispatches the Grok AI report job.
     */
    public function endSession(Interview $interview): JsonResponse
    {
        $interview->update(['status' => 'done']);

        // Dispatch AI analysis — runs async via the queue
        GenerateAIInterviewReportJob::dispatch($interview->id);

        // Update applicant status
        $stageStatus = [
            'interview_1' => 'interview_1_done',
            'interview_2' => 'interview_2_done',
            'final'       => 'interview_2_done',
        ];
        $interview->applicant->update([
            'status' => $stageStatus[$interview->interview_stage] ?? $interview->applicant->status,
        ]);

        AuditLog::record('end_session', 'interview', "Interview session ended: {$interview->id}");

        return response()->json(['message' => 'Session ended. AI analysis has been queued.']);
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

        return response()->json(['interview' => $interview]);
    }
}
