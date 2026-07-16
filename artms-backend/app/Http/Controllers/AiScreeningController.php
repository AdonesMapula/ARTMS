<?php

namespace App\Http\Controllers;

use App\Models\AiEvaluation;
use App\Models\Applicant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AiScreeningController extends Controller
{
    /**
     * POST /api/ai/screen/{applicant}
     * Sends resume to OpenAI, stores evaluation.
     */
    public function screen(Applicant $applicant): JsonResponse
    {
        if (! $applicant->resume_path) {
            return response()->json(['message' => 'No resume found for this applicant.'], 422);
        }

        $jobPosting = $applicant->jobPosting->load('jobLibrary');
        $jobLib = $jobPosting->jobLibrary;

        // Read resume text (PDF parsing would need a library like smalot/pdfparser in production)
        $resumeContent = "Resume file: {$applicant->resume_original_name}";
        if (Storage::disk('local')->exists($applicant->resume_path)) {
            // In production: use smalot/pdfparser or spatie/pdf-to-text to extract text
            $resumeContent = "Applicant: {$applicant->first_name} {$applicant->last_name}\nEmail: {$applicant->email}";
        }

        $prompt = <<<EOT
You are an HR AI assistant for ARTMS. Evaluate the following job applicant's resume against the job requirements.

JOB TITLE: {$jobLib->job_title}
JOB QUALIFICATIONS: {$jobLib->qualifications}
JOB RESPONSIBILITIES: {$jobLib->responsibilities}

APPLICANT RESUME DATA:
{$resumeContent}

Respond ONLY in valid JSON with this exact structure:
{
  "ai_score": <number 0-100>,
  "confidence_level": <number 0-100>,
  "fit_label": "<high|medium|low>",
  "qualification_match": <number 0-100>,
  "skills_matched": ["skill1", "skill2"],
  "skills_missing": ["skill1", "skill2"],
  "score_breakdown": {
    "education": <0-25>,
    "experience": <0-25>,
    "skills": <0-25>,
    "overall_fit": <0-25>
  },
  "ai_summary": "<2-3 sentence summary>",
  "ai_feedback": "<constructive feedback for the applicant>"
}
EOT;

        try {
            $response = Http::withToken(config('services.openai.key'))
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'    => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are an HR AI screening assistant. Always respond with valid JSON only.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.3,
                ]);

            if (! $response->successful()) {
                return response()->json(['message' => 'AI service temporarily unavailable.'], 503);
            }

            $content = $response->json('choices.0.message.content');
            $aiData  = json_decode($content, true);

            if (! $aiData) {
                return response()->json(['message' => 'Failed to parse AI response.'], 500);
            }

        } catch (\Exception $e) {
            return response()->json(['message' => 'AI screening failed: ' . $e->getMessage()], 500);
        }

        // Store or update evaluation
        $evaluation = AiEvaluation::updateOrCreate(
            ['applicant_id' => $applicant->id],
            [
                'ai_score'            => $aiData['ai_score'] ?? null,
                'confidence_level'    => $aiData['confidence_level'] ?? null,
                'fit_label'           => $aiData['fit_label'] ?? null,
                'qualification_match' => $aiData['qualification_match'] ?? null,
                'skills_matched'      => $aiData['skills_matched'] ?? [],
                'skills_missing'      => $aiData['skills_missing'] ?? [],
                'score_breakdown'     => $aiData['score_breakdown'] ?? [],
                'ai_summary'          => $aiData['ai_summary'] ?? null,
                'ai_feedback'         => $aiData['ai_feedback'] ?? null,
            ]
        );

        // Update applicant score and status
        $applicant->update([
            'overall_score' => $aiData['ai_score'] ?? null,
            'status'        => 'ai_screening',
        ]);

        return response()->json([
            'message'    => 'AI screening completed.',
            'evaluation' => $evaluation,
        ]);
    }

    /**
     * PATCH /api/ai/review/{applicant}
     * HR reviews and finalizes the AI interpretation.
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

        // Update applicant status based on HR decision
        $newStatus = $data['hr_decision'] === 'qualified' ? 'screening_passed' : 'screening_failed';
        $applicant->update(['status' => $newStatus]);

        return response()->json([
            'message'    => 'HR review saved.',
            'evaluation' => $evaluation->fresh(),
        ]);
    }

    /**
     * GET /api/ai/rankings/{job_posting}
     * Returns ranked applicants for a job posting.
     */
    public function rankings(Request $request): JsonResponse
    {
        $jobPostingId = $request->job_posting_id;

        $applicants = Applicant::with('aiEvaluation')
            ->where('job_posting_id', $jobPostingId)
            ->whereNotNull('overall_score')
            ->orderByDesc('overall_score')
            ->get()
            ->map(function ($app, $index) {
                $app->ranking = $index + 1;
                $app->save();
                return $app;
            });

        return response()->json(['rankings' => $applicants]);
    }
}
