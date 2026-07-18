<?php

namespace App\Http\Controllers;

use App\Models\AiEvaluation;
use App\Models\Applicant;
use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AiScreeningController extends Controller
{
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
     * Parses the resume, sends to OpenAI, stores evaluation.
     */
    public function screen(Applicant $applicant): JsonResponse
    {
        if (! $applicant->resume_path) {
            return response()->json(['message' => 'No resume found for this applicant.'], 422);
        }

        // ── 1. Parse resume text ─────────────────────────────────────────────
        $parser     = new ResumeParserService();
        $resumeText = $parser->extractText($applicant->resume_path);

        if (empty(trim($resumeText))) {
            $resumeText = "Applicant Name: {$applicant->first_name} {$applicant->last_name}\nEmail: {$applicant->email}";
        }

        // Truncate to avoid token limits (~12 000 chars ≈ 3 000 tokens)
        if (strlen($resumeText) > 12000) {
            $resumeText = substr($resumeText, 0, 12000) . "\n[Resume truncated for processing]";
        }

        // ── 2. Build PRF requirements from job posting chain ─────────────────
        $jobPosting = $applicant->jobPosting->load('jobLibrary', 'manpowerRequest');
        $jobLib     = $jobPosting->jobLibrary;
        $prf        = $jobPosting->manpowerRequest;

        $positionTitle        = $jobLib?->job_title            ?? $prf?->position_needed ?? 'N/A';
        $educationReq         = $prf?->educational_background  ?? $jobLib?->qualifications ?? 'Not specified';
        $experienceReq        = $prf?->work_experience         ?? 'Not specified';
        $skillsReq            = $prf?->skills                  ?? 'Not specified';
        $otherReq             = $prf?->other_preferred         ?? 'Not specified';
        $highFitMin           = $prf?->high_fit_min_score      ?? 75;
        $mediumFitMin         = $prf?->medium_fit_min_score    ?? 50;

        // ── 3. Build OpenAI prompt ───────────────────────────────────────────
        $prompt = <<<EOT
You are an expert HR screening AI for ARTMS. Evaluate the resume below against the job requirements.

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

Respond with ONLY valid JSON — no markdown, no extra text:
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

        // ── 4. Call OpenAI ───────────────────────────────────────────────────
        $apiKey = config('services.openai.key');

        if (empty($apiKey)) {
            return response()->json(['message' => 'OpenAI API key is not configured.'], 503);
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(90)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'           => 'gpt-4o-mini',
                    'messages'        => [
                        [
                            'role'    => 'system',
                            'content' => 'You are a precise HR screening AI. Always respond with valid JSON only, no markdown.',
                        ],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature'     => 0.2,
                    'response_format' => ['type' => 'json_object'],
                ]);

            if (! $response->successful()) {
                return response()->json([
                    'message' => 'AI service error: ' . $response->json('error.message', 'Unknown error'),
                ], 503);
            }

            $content = $response->json('choices.0.message.content');
            $aiData  = json_decode($content, true);

            if (! $aiData || ! isset($aiData['ai_score'])) {
                return response()->json(['message' => 'Failed to parse AI response.'], 500);
            }

        } catch (\Exception $e) {
            return response()->json(['message' => 'AI screening failed: ' . $e->getMessage()], 500);
        }

        // ── 5. Apply fit thresholds ──────────────────────────────────────────
        $totalScore = (float) ($aiData['ai_score'] ?? 0);
        $fitLabel   = match (true) {
            $totalScore >= $highFitMin   => 'high',
            $totalScore >= $mediumFitMin => 'medium',
            default                      => 'low',
        };

        // ── 6. Persist evaluation ────────────────────────────────────────────
        $scoreBreakdown = $aiData['score_breakdown'] ?? [];
        // Attach remarks into breakdown for frontend display
        $scoreBreakdown['education_remarks']  = $aiData['education_remarks']  ?? null;
        $scoreBreakdown['experience_remarks'] = $aiData['experience_remarks'] ?? null;
        $scoreBreakdown['skills_remarks']     = $aiData['skills_remarks']     ?? null;

        $evaluation = AiEvaluation::updateOrCreate(
            ['applicant_id' => $applicant->id],
            [
                'ai_score'            => $totalScore,
                'confidence_level'    => $aiData['confidence_level']    ?? null,
                'fit_label'           => $fitLabel,
                'qualification_match' => $aiData['qualification_match'] ?? null,
                'skills_matched'      => $aiData['skills_matched']      ?? [],
                'skills_missing'      => $aiData['skills_missing']      ?? [],
                'score_breakdown'     => $scoreBreakdown,
                'ai_summary'          => $aiData['ai_summary']          ?? null,
                'ai_feedback'         => $aiData['ai_feedback']         ?? null,
            ]
        );

        // ── 7. Update applicant ──────────────────────────────────────────────
        $applicant->update([
            'overall_score' => $totalScore,
            'status'        => 'ai_screening',
        ]);

        return response()->json([
            'message'    => 'AI screening completed.',
            'evaluation' => $evaluation->load('applicant'),
        ]);
    }

    /**
     * PATCH /api/ai/review/{applicant}
     * HR saves their interpretation + decision.
     */
    public function hrReview(Request $request, Applicant $applicant): JsonResponse
    {
        $data = $request->validate([
            'hr_interpretation' => ['required', 'string'],
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
}
