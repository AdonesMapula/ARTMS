<?php

namespace App\Jobs;

use App\Models\AiEvaluation;
use App\Models\Applicant;
use App\Services\AiGuardrailService;
use App\Services\GeminiService;
use App\Services\NotificationService;
use App\Services\ResumeParserService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AutoScreenApplicantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(public readonly int $applicantId)
    {
    }

    /**
     * Execute the background screening job.
     */
    public function handle(): void
    {
        $applicant = Applicant::with([
            'jobPosting.jobLibrary',
            'jobPosting.manpowerRequest',
            'jobPosting.department',
            'aiEvaluation',
        ])->find($this->applicantId);

        if (! $applicant || ! $applicant->resume_path) {
            return;
        }

        // If already evaluated, skip to avoid double processing
        if ($applicant->aiEvaluation) {
            return;
        }

        try {
            // 1. Extract and guardrail resume text
            $parser = new ResumeParserService();
            $rawResumeText = $parser->extractText($applicant->resume_path);

            if (empty(trim($rawResumeText))) {
                $rawResumeText = "Applicant Profile for Screening";
            }

            $cleanResumeText = AiGuardrailService::sanitizeInput($rawResumeText, 8000);
            $safeResumeText  = AiGuardrailService::detectAndNeutralizePromptInjection($cleanResumeText, 'Auto-Screening: #' . $applicant->id);
            $resumeText      = AiGuardrailService::anonymizePii($safeResumeText, [
                $applicant->first_name,
                $applicant->last_name,
                $applicant->middle_name,
                trim("{$applicant->first_name} {$applicant->last_name}"),
            ]);

            // 2. Build PRF requirements
            $jobPosting = $applicant->jobPosting;
            $jobLib     = $jobPosting?->jobLibrary;
            $prf        = $jobPosting?->manpowerRequest;

            $positionTitle = $this->formatRequirement($jobLib?->job_title ?? $prf?->position_needed ?? 'Position');
            $educationReq  = $this->formatRequirement($prf?->educational_background ?? $jobLib?->qualifications ?? 'Not specified');
            $experienceReq = $this->formatRequirement($prf?->work_experience ?? 'Not specified');
            $skillsReq     = $this->formatRequirement($prf?->skills ?? 'Not specified');
            $otherReq      = $this->formatRequirement($prf?->other_preferred ?? 'Not specified');
            $highFitMin    = (float) ($prf?->high_fit_min_score ?? 75);
            $mediumFitMin  = (float) ($prf?->medium_fit_min_score ?? 50);

            // 3. Build Prompt
            $prompt = <<<EOT
You are an expert HR screening AI for ARTMS. Evaluate the resume below objectively against the job requirements.
Do NOT use discriminatory criteria. Evaluate strictly on merit, skills, education, and relevant experience.

== POSITION ==
Title: {$positionTitle}

== JOB REQUIREMENTS ==
Educational Background : {$educationReq}
Work Experience        : {$experienceReq}
Skills Required        : {$skillsReq}
Other / Licenses       : {$otherReq}

== SCORING WEIGHTS ==
Education    : 25 points max
Experience   : 35 points max
Skills       : 30 points max
Other/Licenses: 10 points max
Total        : 100 points

== FIT THRESHOLDS ==
High Fit   : >= {$highFitMin}
Medium Fit : >= {$mediumFitMin}
Low Fit    : < {$mediumFitMin}

== RESUME ==
{$resumeText}

Respond with ONLY valid JSON:
{
  "ai_score": <0-100>,
  "confidence_level": <0-100>,
  "fit_label": "<high|medium|low>",
  "qualification_match": <0-100>,
  "score_breakdown": {
    "education": <0-25>,
    "experience": <0-35>,
    "skills": <0-30>,
    "other": <0-10>
  },
  "skills_matched": ["skill1", "skill2"],
  "skills_missing": ["skill1", "skill2"],
  "education_remarks": "<one sentence>",
  "experience_remarks": "<one sentence>",
  "skills_remarks": "<one sentence>",
  "ai_summary": "<2-3 sentence overall assessment>",
  "ai_feedback": "<constructive feedback for the applicant>"
}
EOT;

            $systemInstruction = 'You are a precise HR screening AI. Always respond with valid JSON only matching the schema exactly. Evaluate purely on merit and qualifications.';
            $rawAiData = GeminiService::generateJson($prompt, $systemInstruction, 0.1, 1024, 'Auto-Screening: #' . $applicant->id);

            if (! $rawAiData || ! is_array($rawAiData)) {
                return;
            }

            $aiData = AiGuardrailService::enforceEvaluationSchema($rawAiData, $highFitMin, $mediumFitMin);

            $totalScore = $aiData['ai_score'];
            $fitLabel   = $aiData['fit_label'];

            $scoreBreakdown = $aiData['score_breakdown'];
            $scoreBreakdown['education_remarks']  = $aiData['education_remarks'];
            $scoreBreakdown['experience_remarks'] = $aiData['experience_remarks'];
            $scoreBreakdown['skills_remarks']     = $aiData['skills_remarks'];

            AiEvaluation::updateOrCreate(
                ['applicant_id' => $applicant->id],
                [
                    'ai_score'            => $totalScore,
                    'confidence_level'    => $aiData['confidence_level'],
                    'fit_label'           => $fitLabel,
                    'qualification_match' => $aiData['qualification_match'],
                    'skills_matched'      => $aiData['skills_matched'],
                    'skills_missing'      => $aiData['skills_missing'],
                    'score_breakdown'     => $scoreBreakdown,
                    'ai_summary'          => $aiData['ai_summary'],
                    'ai_feedback'         => $aiData['ai_feedback'],
                ]
            );

            $applicant->update([
                'overall_score' => $totalScore,
                'status'        => 'ai_screening',
            ]);

            // Re-calculate rankings for this job posting
            Applicant::where('job_posting_id', $applicant->job_posting_id)
                ->whereNotNull('overall_score')
                ->orderByDesc('overall_score')
                ->get()
                ->each(function ($app, $index) {
                    $app->update(['ranking' => $index + 1]);
                });

            Log::info("AutoScreenApplicantJob completed for applicant #{$applicant->id} (Score: {$totalScore}, Fit: {$fitLabel})");

        } catch (\Throwable $e) {
            Log::error("AutoScreenApplicantJob error for applicant #{$applicant->id}: " . $e->getMessage());
        }
    }

    private function formatRequirement(mixed $value): string
    {
        if (is_null($value)) return 'Not specified';
        if (is_string($value)) return trim($value) === '' ? 'Not specified' : $value;
        if (is_array($value) || is_object($value)) {
            $lines = [];
            foreach ((array) $value as $item) {
                if (is_string($item) || is_numeric($item)) {
                    $lines[] = (string) $item;
                } elseif (is_array($item) || is_object($item)) {
                    $item = (array) $item;
                    $title = $item['title'] ?? '';
                    $details = $item['details'] ?? ($item['value'] ?? null);
                    if (!empty($title)) $lines[] = $title . ':';
                    if (is_array($details)) {
                        foreach ($details as $d) $lines[] = "  - " . (is_array($d) ? ($d['value'] ?? $d['title'] ?? '') : $d);
                    } elseif ($details) {
                        $lines[] = "  - " . $details;
                    }
                }
            }
            return !empty($lines) ? implode("\n", $lines) : json_encode($value);
        }
        return (string) $value;
    }
}
