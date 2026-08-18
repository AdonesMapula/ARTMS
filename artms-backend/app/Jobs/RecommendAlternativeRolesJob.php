<?php

namespace App\Jobs;

use App\Models\Applicant;
use App\Models\JobPosting;
use App\Services\NotificationService;
use App\Services\ResumeParserService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendAlternativeRolesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $applicant;
    public $remarks;
    public $timeout = 120; // Allow 2 minutes for API call

    /**
     * Create a new job instance.
     */
    public function __construct(Applicant $applicant, ?string $remarks = null)
    {
        $this->applicant = $applicant;
        $this->remarks = $remarks;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $applicant = $this->applicant;
        
        // 1. Fetch all other published jobs
        $openJobs = JobPosting::with('jobLibrary', 'manpowerRequest')
            ->where('status', 'published')
            ->where('is_published', true)
            ->where('id', '!=', $applicant->job_posting_id)
            ->get();

        // If no other jobs, send standard rejection email
        if ($openJobs->isEmpty()) {
            NotificationService::sendScreeningRejectionEmail($applicant, $this->remarks);
            return;
        }

        // 2. Prepare applicant's resume with Guardrails
        $rawResumeText = '';
        if ($applicant->resume_path) {
            $parser = new ResumeParserService();
            $rawResumeText = $parser->extractText($applicant->resume_path);
        }

        if (empty(trim($rawResumeText))) {
            $rawResumeText = "Applicant Profile";
        }

        // Input Guardrails: Sanitize, Neutralize Prompt Injection, and Anonymize PII
        $cleanResumeText = \App\Services\AiGuardrailService::sanitizeInput($rawResumeText, 8000);
        $safeResumeText  = \App\Services\AiGuardrailService::detectAndNeutralizePromptInjection($cleanResumeText, 'Alternative Roles Job: #' . $applicant->id);
        $resumeText      = \App\Services\AiGuardrailService::anonymizePii($safeResumeText, [
            $applicant->first_name,
            $applicant->last_name,
            $applicant->middle_name,
            trim("{$applicant->first_name} {$applicant->last_name}"),
        ]);

        // 3. Prepare jobs summary
        $jobsSummary = [];
        foreach ($openJobs as $job) {
            $jobTitle = $job->jobLibrary?->job_title ?? $job->manpowerRequest?->position_needed ?? 'Position';
            $qualifications = $job->manpowerRequest?->educational_background ?? $job->jobLibrary?->qualifications ?? 'Not specified';
            $experience = $job->manpowerRequest?->work_experience ?? 'Not specified';
            
            $jobsSummary[] = [
                'id' => $job->id,
                'title' => $jobTitle,
                'qualifications' => $qualifications,
                'experience' => $experience,
            ];
        }

        $jobsJson = json_encode($jobsSummary, JSON_PRETTY_PRINT);

        // 4. Prompt AI
        $prompt = <<<EOT
You are an expert HR AI for ARTMS. 
An applicant failed the screening for their chosen job. We want to see if they are a strong fit for ANY of our OTHER open roles.
Evaluate objectively without bias.

== APPLICANT RESUME ==
{$resumeText}

== OPEN ROLES ==
{$jobsJson}

Evaluate the applicant's resume against the open roles.
If there are any roles where the applicant is a STRONG FIT, return a JSON array containing objects with 'job_posting_id' and 'reason'.
If the applicant is NOT a strong fit for any roles, return an empty JSON array [].
Your output MUST be valid JSON only. No markdown, no code blocks, no extra text.

Example Output:
[
  {
    "job_posting_id": 5,
    "reason": "The applicant has 3 years of React experience matching the Frontend Developer role."
  }
]
EOT;

        $keys = \App\Services\GeminiService::getApiKeys();
        if (empty($keys)) {
            Log::warning('No Gemini API key found. Falling back to standard rejection.');
            NotificationService::sendScreeningRejectionEmail($applicant, $this->remarks);
            return;
        }

        try {
            $systemInstruction = 'You are a precise HR evaluator. Respond ONLY with valid, raw JSON array. No markdown, no code fences, no extra text.';
            $recommendations = \App\Services\GeminiService::generateJson($prompt, $systemInstruction, 0.2, 1024, 'Alternative Roles AI');

            if (is_array($recommendations) && count($recommendations) > 0) {
                // Extract and validate job IDs
                $recommendedJobIds = collect($recommendations)->pluck('job_posting_id')->filter(fn($id) => is_numeric($id))->toArray();
                $matchedJobs = JobPosting::with('jobLibrary')->whereIn('id', $recommendedJobIds)->get();
                
                if ($matchedJobs->isNotEmpty()) {
                    // Attach the AI's reason to the matched job model dynamically with guardrail filtering
                    foreach ($matchedJobs as $matchedJob) {
                        $matchData = collect($recommendations)->firstWhere('job_posting_id', $matchedJob->id);
                        $reason = $matchData['reason'] ?? 'Your profile aligns well with this role.';
                        $matchedJob->ai_reason = \App\Services\AiGuardrailService::filterHarmfulLanguage(strip_tags((string) $reason));
                    }
                    
                    NotificationService::sendAlternativeRoleRecommendationEmail($applicant, $matchedJobs, $this->remarks);
                    return;
                }
            }
        } catch (\Throwable $e) {
            Log::error('RecommendAlternativeRolesJob Exception: ' . $e->getMessage());
        }

        // Fallback: standard rejection
        NotificationService::sendScreeningRejectionEmail($applicant, $this->remarks);
    }
}