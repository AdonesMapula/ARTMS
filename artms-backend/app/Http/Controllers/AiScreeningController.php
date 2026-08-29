<?php

namespace App\Http\Controllers;

use App\Models\AiEvaluation;
use App\Models\Applicant;
use App\Services\NotificationService;
use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AiScreeningController extends Controller
{
    /**
     * GET /api/ai/applicants
     * Returns applicants who have a resume but NO evaluation yet (pending screening queue).
     */
    public function pendingQueue(Request $request): JsonResponse
    {
        $applicants = Applicant::with([
                'jobPosting.jobLibrary',
                'jobPosting.department',
            ])
            ->whereNotNull('resume_path')
            ->doesntHave('aiEvaluation')
            ->when($request->job_posting_id, fn ($q) =>
                $q->where('job_posting_id', $request->job_posting_id)
            )
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('first_name', 'like', "%{$request->search}%")
                       ->orWhere('last_name',  'like', "%{$request->search}%")
                       ->orWhere('email',       'like', "%{$request->search}%")
                       ->orWhere('application_id', 'like', "%{$request->search}%")
                )
            )
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($applicants);
    }

    /**
     * GET /api/ai/evaluations
     * Returns all applicants that have been screened, with evaluation data.
     */
    public function index(Request $request): JsonResponse
    {
        $applicants = Applicant::with([
                'jobPosting.jobLibrary',
                'jobPosting.department',
                'jobPosting.manpowerRequest',
                'aiEvaluation',
            ])
            ->whereHas('aiEvaluation')
            ->when($request->job_posting_id, fn ($q) =>
                $q->where('job_posting_id', $request->job_posting_id)
            )
            ->when($request->fit_label, fn ($q) =>
                $q->whereHas('aiEvaluation', fn ($q2) =>
                    $q2->where('fit_label', $request->fit_label)
                )
            )
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('first_name', 'like', "%{$request->search}%")
                       ->orWhere('last_name',  'like', "%{$request->search}%")
                       ->orWhere('email',       'like', "%{$request->search}%")
                )
            )
            ->orderByDesc(fn ($q) =>
                $q->select('ai_score')
                  ->from('ai_evaluations')
                  ->whereColumn('applicant_id', 'applicants.id')
                  ->limit(1)
            )
            ->paginate($request->per_page ?? 20);

        return response()->json($applicants);
    }

    /**
     * POST /api/ai/screen/{applicant}
     * Parses the resume, evaluates with Gemini, stores evaluation.
     */
    public function screen(Applicant $applicant): JsonResponse
    {
        if (! $applicant->resume_path) {
            return response()->json(['message' => 'No resume found for this applicant.'], 422);
        }

        // ── 1. Parse & Guardrail resume text ───────────────────────────────────
        $parser     = new ResumeParserService();
        $rawResumeText = $parser->extractText($applicant->resume_path);

        // Also capture structured fields from the CV for display in the screening UI
        $parsedFields = [];
        if (! empty(trim($rawResumeText))) {
            $parsedFields = $this->extractStructuredFields($rawResumeText);
        }

        if (empty(trim($rawResumeText))) {
            $rawResumeText = "Applicant Profile for Screening";
        }

        // Apply Input Guardrails: Sanitize, Bound Length, Neutralize Injections, and Anonymize PII
        $cleanResumeText = \App\Services\AiGuardrailService::sanitizeInput($rawResumeText, 8000);
        $safeResumeText  = \App\Services\AiGuardrailService::detectAndNeutralizePromptInjection($cleanResumeText, 'AI Screening: Candidate #' . $applicant->id, auth()->id());
        $resumeText      = \App\Services\AiGuardrailService::anonymizePii($safeResumeText, [
            $applicant->first_name,
            $applicant->last_name,
            $applicant->middle_name,
            trim("{$applicant->first_name} {$applicant->last_name}"),
        ]);

        // ── 2. Build PRF requirements from job posting chain ─────────────────
        $jobPosting = $applicant->jobPosting->load('jobLibrary', 'manpowerRequest');
        $jobLib     = $jobPosting?->jobLibrary;
        $prf        = $jobPosting?->manpowerRequest;

        $positionTitle        = $this->formatRequirementAsString($jobLib?->job_title            ?? $prf?->position_needed ?? 'N/A');
        $educationReq         = $this->formatRequirementAsString($prf?->educational_background  ?? $jobLib?->qualifications ?? 'Not specified');
        $experienceReq        = $this->formatRequirementAsString($prf?->work_experience         ?? 'Not specified');
        $skillsReq            = $this->formatRequirementAsString($prf?->skills                  ?? 'Not specified');
        $otherReq             = $this->formatRequirementAsString($prf?->other_preferred         ?? 'Not specified');
        $highFitMin           = (float) ($prf?->high_fit_min_score      ?? 75);
        $mediumFitMin         = (float) ($prf?->medium_fit_min_score    ?? 50);

        // ── 3. Build AI prompt ───────────────────────────────────────────────
        $prompt = <<<EOT
You are an expert HR screening AI for ARTMS. Evaluate the resume below objectively against the job requirements.
Do NOT use discriminatory criteria. Evaluate strictly based on skills, education, and relevant experience.
If the candidate is a low fit for this specific position but shows strong potential in other areas, suggest 1-2 alternative roles.
Also, extract the top 3 most impressive, quantifiable achievements from the candidate's resume (e.g. "Increased sales by 30%").
Generate 7 to 10 recommended interview questions to thoroughly evaluate the candidate's technical skills and cultural fit.

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
  "ai_feedback": "<constructive feedback for the applicant>",
  "red_flags": ["<employment gap concern>", "<missing critical requirement>", "etc"],
  "interview_questions": ["<custom question 1>", "<custom question 2>", "...", "<custom question 7-10>"],
  "alternative_roles": ["<role 1>", "<role 2>"],
  "top_achievements": ["<achievement 1>", "<achievement 2>", "<achievement 3>"]
}
EOT;

        // ── 4. Call Google Gemini with Guardrails & Key Rotation ────
        try {
            $cacheKey = 'screening_eval_' . $applicant->id . '_' . md5($cleanResumeText . $positionTitle);
            
            // Force a fresh AI evaluation when Re-running by clearing the old cache
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            
            $rawAiData = \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400, function () use ($prompt, $applicant) {
                $systemInstruction = 'You are a precise HR screening AI. Always respond with valid JSON only matching the schema exactly. Evaluate purely on merit and qualifications.';
                return \App\Services\GeminiService::generateJson($prompt, $systemInstruction, 0.1, 1024, 'AI Screening: #' . $applicant->id);
            });

            if (! $rawAiData || ! is_array($rawAiData)) {
                return response()->json(['message' => 'Failed to parse Gemini AI response structure.'], 500);
            }

            // ── Output Guardrail: Validate Schema, Clamp Numeric Scores, Filter Bias ────
            $aiData = \App\Services\AiGuardrailService::enforceEvaluationSchema($rawAiData, $highFitMin, $mediumFitMin);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'AI screening failed: ' . $e->getMessage()], 503);
        }

        // ── 5. Extract guarded fit & score metrics ───────────────────────────
        $totalScore = $aiData['ai_score'];
        $fitLabel   = $aiData['fit_label'];

        // ── 6. Persist evaluation ────────────────────────────────────────────
        $scoreBreakdown = $aiData['score_breakdown'];
        $scoreBreakdown['education_remarks']  = $aiData['education_remarks'];
        $scoreBreakdown['experience_remarks'] = $aiData['experience_remarks'];
        $scoreBreakdown['skills_remarks']     = $aiData['skills_remarks'];
        $scoreBreakdown['red_flags']          = $aiData['red_flags'];
        $scoreBreakdown['interview_questions']= $aiData['interview_questions'];
        $scoreBreakdown['alternative_roles']  = $aiData['alternative_roles'] ?? [];
        $scoreBreakdown['top_achievements']   = $aiData['top_achievements'] ?? [];
        $scoreBreakdown['parsed_cv']          = $parsedFields;

        $evaluation = AiEvaluation::updateOrCreate(
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

        // ── 7. Update applicant ──────────────────────────────────────────────
        $applicant->update([
            'overall_score' => $totalScore,
            'status'        => 'ai_screening',
        ]);

        // ── 8. Trigger in-app notification & email to Admin on AI screening completion ──
        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'Job Position';
        $candidateName = "{$applicant->first_name} {$applicant->last_name}";
        $fitUpper = strtoupper($fitLabel);

        NotificationService::notifyRoles(
            ['hr_admin', 'super_admin'],
            'AI Screening Completed',
            "AI screening completed for {$candidateName} ({$jobTitle}) — Score: {$totalScore}/100 ({$fitUpper} FIT).",
            '/admin/ai-screening',
            'application'
        );

        return response()->json([
            'message'    => 'AI screening completed.',
            'evaluation' => $evaluation->load('applicant'),
        ]);
    }

    /**
     * POST /api/ai/screen-batch
     * Batch-screens multiple applicants in one request.
     */
    public function screenBatch(Request $request): JsonResponse
    {
        $applicantIds = $request->input('applicant_ids', []);
        if (empty($applicantIds)) {
            return response()->json(['message' => 'No applicant IDs provided.'], 422);
        }

        $results = [];
        $applicants = Applicant::whereIn('id', $applicantIds)->with('jobPosting.jobLibrary', 'jobPosting.manpowerRequest')->get();

        foreach ($applicants as $applicant) {
            if (!$applicant->resume_path) continue;
            try {
                \App\Jobs\AutoScreenApplicantJob::dispatchSync($applicant->id);
                $evaluation = AiEvaluation::where('applicant_id', $applicant->id)->first();
                if ($evaluation) {
                    $results[] = [
                        'applicant_id' => $applicant->id,
                        'ai_score'     => $evaluation->ai_score,
                        'fit_label'    => $evaluation->fit_label,
                        'status'       => 'success',
                    ];
                }
            } catch (\Throwable $e) {
                $results[] = [
                    'applicant_id' => $applicant->id,
                    'status'       => 'error',
                    'message'      => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'message' => 'Batch screening completed.',
            'results' => $results,
        ]);
    }

    /**
     * PATCH /api/ai/review/{applicant}
     * HR saves their interpretation + decision.
     */
    public function hrReview(Request $request, Applicant $applicant): JsonResponse
    {
        $data = $request->validate([
            'hr_interpretation' => ['nullable', 'string'],
            'hr_decision'       => ['required', 'in:qualified,not_qualified,pending'],
        ]);

        $evaluation = $applicant->aiEvaluation;
        if (! $evaluation) {
            return response()->json(['message' => 'No AI evaluation found. Run screening first.'], 404);
        }

        $evaluation->update([
            'hr_interpretation' => $data['hr_interpretation'],
            'hr_decision'       => $data['hr_decision'],
            'reviewed_by'       => auth()->id(),
            'reviewed_at'       => now(),
        ]);

        $newStatus = $data['hr_decision'] === 'qualified' ? 'screening_passed' : 'screening_failed';
        $applicant->update(['status' => $newStatus]);

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'the position';
        $readableStatus = $data['hr_decision'] === 'qualified' ? 'Screening Passed' : 'Screening Not Passed';

        // Instant email update to Candidate
        if ($newStatus === 'screening_failed') {
            \App\Jobs\RecommendAlternativeRolesJob::dispatch($applicant, $data['hr_interpretation'] ?? null);
        } else {
            NotificationService::notifyEmail(
                $applicant->email,
                "Application Status Update — {$readableStatus}",
                "Hello {$applicant->first_name}, your application status for {$jobTitle} has been updated to: {$readableStatus}.",
                null,
                'application'
            );
        }

        return response()->json([
            'message'    => 'HR review saved.',
            'evaluation' => $evaluation->fresh()->load('applicant'),
        ]);
    }

    /**
     * GET /api/ai/rankings
     * Returns ranked applicants for a job posting.
     */
    public function rankings(Request $request): JsonResponse
    {
        $jobPostingId = $request->job_posting_id;

        $applicants = Applicant::with('aiEvaluation', 'jobPosting.jobLibrary')
            ->where('job_posting_id', $jobPostingId)
            ->whereNotNull('overall_score')
            ->orderByDesc('overall_score')
            ->get()
            ->each(function ($app, $index) {
                $app->update(['ranking' => $index + 1]);
            });

        return response()->json(['rankings' => $applicants]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Extract structured personal / professional fields from raw resume text.
     * Mirrors the logic in ResumeParserController so the screening UI can
     * display what was found in the CV even without a separate parse call.
     */
    private function extractStructuredFields(string $text): array
    {
        // Email
        $email = '';
        if (preg_match('/[\w.+\-]+@[\w\-]+\.[\w.\-]+/', $text, $m)) {
            $email = strtolower(trim($m[0]));
        }

        // Phone
        $phone = '';
        if (preg_match('/(?:\+?63|0)[\s\-]?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}/', $text, $m)) {
            $phone = preg_replace('/[\s\-]/', '', $m[0]);
        } elseif (preg_match('/\+?\d[\d\s\-().]{8,}\d/', $text, $m)) {
            $phone = preg_replace('/[\s\-().]+/', '', $m[0]);
        }

        // Education section
        $education = '';
        $eduHeaders = ['EDUCATION', 'EDUCATIONAL BACKGROUND', 'ACADEMIC BACKGROUND'];
        $nextSections = 'EDUCATION|EXPERIENCE|WORK HISTORY|SKILLS|REFERENCES|CERTIFICATES|ACHIEVEMENTS|AWARDS|OBJECTIVE|SUMMARY|CONTACT|PERSONAL';
        $eduPattern = implode('|', array_map('preg_quote', $eduHeaders));
        if (preg_match('/(?:' . $eduPattern . ')[\s:]*\n(.*?)(?=(?:' . $nextSections . ')[\s:]|\Z)/is', $text, $m)) {
            $education = trim($m[1]);
        }

        // Experience section
        $experience = '';
        $expHeaders = ['EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT HISTORY', 'WORK EXPERIENCE'];
        $expPattern = implode('|', array_map('preg_quote', $expHeaders));
        if (preg_match('/(?:' . $expPattern . ')[\s:]*\n(.*?)(?=(?:' . $nextSections . ')[\s:]|\Z)/is', $text, $m)) {
            $experience = trim($m[1]);
        }

        // Skills keywords
        $skillKeywords = [
            'PHP', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++',
            'React', 'Vue', 'Angular', 'Node.js', 'Laravel', 'MySQL', 'PostgreSQL',
            'MongoDB', 'SQL', 'Docker', 'AWS', 'Git', 'HTML', 'CSS',
            'Microsoft Office', 'Excel', 'PowerPoint', 'Leadership', 'Communication',
            'Teamwork', 'Data Analysis', 'Marketing', 'Sales', 'Customer Service', 'Accounting',
        ];
        $skills = [];
        foreach ($skillKeywords as $skill) {
            if (preg_match('/\b' . preg_quote($skill, '/') . '\b/i', $text)) {
                $skills[] = $skill;
            }
        }

        return [
            'email'      => $email,
            'phone'      => $phone,
            'education'  => $education,
            'experience' => $experience,
            'skills'     => $skills,
            'raw_length' => strlen($text),
        ];
    }

    /**
     * Safely format requirement fields (strings, arrays, JSON structures) into string text for prompts.
     */
    private function formatRequirementAsString(mixed $value): string
    {
        if (is_null($value)) {
            return 'Not specified';
        }
        if (is_string($value)) {
            return trim($value) === '' ? 'Not specified' : $value;
        }
        if (is_array($value) || is_object($value)) {
            $lines = [];
            $arr = (array) $value;
            foreach ($arr as $item) {
                if (is_string($item) || is_numeric($item)) {
                    $lines[] = (string) $item;
                } elseif (is_array($item) || is_object($item)) {
                    $item = (array) $item;
                    $title = $item['title'] ?? '';
                    $details = $item['details'] ?? ($item['value'] ?? null);

                    if (!empty($title)) {
                        $lines[] = $title . ':';
                    }
                    if (is_array($details)) {
                        foreach ($details as $d) {
                            if (is_string($d) || is_numeric($d)) {
                                $lines[] = "  - " . $d;
                            } elseif (is_array($d) || is_object($d)) {
                                $d = (array) $d;
                                if (isset($d['value'])) {
                                    $lines[] = "  - " . $d['value'];
                                } elseif (isset($d['title'])) {
                                    $lines[] = "  - " . $d['title'];
                                }
                            }
                        }
                    } elseif (is_string($details) || is_numeric($details)) {
                        $lines[] = "  - " . $details;
                    }
                }
            }
            if (!empty($lines)) {
                return implode("\n", $lines);
            }
            return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        }
        return (string) $value;
    }
}
