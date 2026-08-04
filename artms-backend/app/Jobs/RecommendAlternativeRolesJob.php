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

        // 2. Prepare applicant's resume
        $resumeText = '';
        if ($applicant->resume_path) {
            $parser = new ResumeParserService();
            $resumeText = $parser->extractText($applicant->resume_path);
        }

        if (empty(trim($resumeText))) {
            // Fallback
            $resumeText = "Applicant Name: {$applicant->first_name} {$applicant->last_name}\nEmail: {$applicant->email}";
        }

        if (strlen($resumeText) > 8000) {
            $resumeText = substr($resumeText, 0, 8000) . "\n[Truncated]";
        }

        // 3. Prepare jobs summary
        $jobsSummary = [];
        foreach ($openJobs as $job) {
            $jobTitle = $job->jobLibrary?->job_title ?? $job->manpowerRequest?->position_needed ?? 'Position';
            $qualifications = $job->manpowerRequest?->educational_background ?? $job->jobLibrary?->qualifications ?? 'Not specified';
            $experience = $job->manpowerRequest?->work_experience ?? 'Not specified';
            
            $jobsSummary[] = [
                'id' => $job->id,
                'title' => $jobTitle,
                'qualifications' => is_array($qualifications) ? implode(', ', $qualifications) : $qualifications,
                'experience' => is_array($experience) ? implode(', ', $experience) : $experience,
            ];
        }

        $jobsJson = json_encode($jobsSummary, JSON_PRETTY_PRINT);

        // 4. Prompt Gemini
        $prompt = <<<EOT
You are an expert HR AI for ARTMS. 
An applicant failed the screening for their chosen job. We want to see if they are a strong fit for ANY of our OTHER open roles.

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

        $apiKey = env('GEMINI_API_KEY') ?? config('services.gemini.api_key');
        if (!$apiKey) {
            Log::warning('No Gemini API key found. Falling back to standard rejection.');
            NotificationService::sendScreeningRejectionEmail($applicant, $this->remarks);
            return;
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'topK' => 1,
                    'topP' => 1,
                    'maxOutputTokens' => 1024,
                ]
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $aiText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
                
                // Clean markdown if AI ignored instruction
                $aiText = preg_replace('/```json\s*/', '', $aiText);
                $aiText = preg_replace('/```\s*/', '', $aiText);
                $aiText = trim($aiText);

                $recommendations = json_decode($aiText, true);

                if (is_array($recommendations) && count($recommendations) > 0) {
                    // Extract job IDs
                    $recommendedJobIds = collect($recommendations)->pluck('job_posting_id')->toArray();
                    $matchedJobs = JobPosting::with('jobLibrary')->whereIn('id', $recommendedJobIds)->get();
                    
                    if ($matchedJobs->isNotEmpty()) {
                        // We attach the AI's reason to the matched job model dynamically for the blade template
                        foreach ($matchedJobs as $matchedJob) {
                            $matchData = collect($recommendations)->firstWhere('job_posting_id', $matchedJob->id);
                            $matchedJob->ai_reason = $matchData['reason'] ?? 'Your profile aligns well with this role.';
                        }
                        
                        NotificationService::sendAlternativeRoleRecommendationEmail($applicant, $matchedJobs, $this->remarks);
                        return;
                    }
                }
            } else {
                Log::error('RecommendAlternativeRolesJob API Error: ' . $response->body());
            }

        } catch (\Exception $e) {
            Log::error('RecommendAlternativeRolesJob Exception: ' . $e->getMessage());
        }

        // Fallback: standard rejection
        NotificationService::sendScreeningRejectionEmail($applicant, $this->remarks);
    }
}
