<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Models\InterviewRecording;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckInterviewFinalizationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $interviewId;
    public int $attemptCount;

    /**
     * Create a new job instance.
     */
    public function __construct(int $interviewId, int $attemptCount = 1)
    {
        $this->interviewId = $interviewId;
        $this->attemptCount = $attemptCount;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $interview = Interview::find($this->interviewId);
        if (!$interview) {
            return;
        }

        // If pipeline has already started or completed, exit gracefully
        if (in_array($interview->transcription_status, ['processing', 'completed'])) {
            return;
        }

        // All recordings for this interview
        $allRecordings = InterviewRecording::where('interview_id', $interview->id)->get();

        // Only the completed ones are eligible for transcription
        $completedRecordings = $allRecordings->where('status', 'completed');

        // Detect failure: any recording marked 'failed'
        $failedRecordings = $allRecordings->where('status', 'failed');

        $hasApplicantCompleted = $completedRecordings->contains('participant_role', 'applicant');
        $hasHRCompleted        = $completedRecordings->contains('participant_role', 'hr');
        $hasApplicantFailed    = $failedRecordings->contains('participant_role', 'applicant');
        $hasHRFailed           = $failedRecordings->contains('participant_role', 'hr');

        // === Condition A: IDEAL — Both recordings completed ===
        $bothCompleted = $hasApplicantCompleted && $hasHRCompleted;

        // === Condition B: One recording failed — don't wait forever, proceed with what we have ===
        $oneFailedCanProceed = ($hasApplicantFailed || $hasHRFailed) && $completedRecordings->isNotEmpty();

        // === Condition C: Timeout fallback — 4 attempts (~60s) and at least one recording completed ===
        $timeoutFallback = $this->attemptCount >= 4 && $completedRecordings->isNotEmpty();

        // === Condition D: Timeout with zero completed — log warning, mark failed, do not dispatch ===
        $timeoutNoRecordings = $this->attemptCount >= 4 && $completedRecordings->isEmpty();

        if ($bothCompleted || $oneFailedCanProceed || $timeoutFallback) {
            $reason = $bothCompleted ? 'both recordings completed'
                : ($oneFailedCanProceed ? 'one recording failed, proceeding with available' : 'timeout fallback');

            Log::info("CheckInterviewFinalizationJob: triggering pipeline for interview {$interview->id} — {$reason} (attempts={$this->attemptCount}, completed={$completedRecordings->count()}, failed={$failedRecordings->count()})");

            $interview->update([
                'transcription_status' => 'processing',
                'analysis_status'      => 'processing',
                'report_status'        => 'processing',
            ]);

            FinalizeInterviewPipelineJob::dispatch($interview->id);
            return;
        }

        if ($timeoutNoRecordings) {
            Log::warning("CheckInterviewFinalizationJob: timeout reached for interview {$interview->id} with NO completed recordings — pipeline not dispatched. Manual review required.");
            $interview->update([
                'recording_status'     => 'failed',
                'transcription_status' => 'failed',
                'analysis_status'      => 'failed',
                'report_status'        => 'failed',
            ]);
            return;
        }

        // Still waiting — re-check in 15 seconds
        Log::info("CheckInterviewFinalizationJob: waiting for recordings for interview {$interview->id} (attempt {$this->attemptCount}/4, completed={$completedRecordings->count()})");
        self::dispatch($this->interviewId, $this->attemptCount + 1)->delay(now()->addSeconds(15));
    }
}
