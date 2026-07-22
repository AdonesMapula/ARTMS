<?php

namespace App\Jobs;

use App\Models\AiInterviewReport;
use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use OpenAI\Client as OpenAIClient;

/**
 * Dispatched when an interview session ends.
 *
 * 1. Fetches all transcripts for the interview.
 * 2. Formats them into a timestamped dialogue string.
 * 3. Sends a strict JSON-structured prompt to grok-4.5 via the xAI API
 *    (which is fully OpenAI-API-compatible).
 * 4. Parses the response and persists it to ai_interview_reports.
 */
class GenerateAIInterviewReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120; // seconds

    public function __construct(public readonly int $interviewId)
    {
    }

    public function handle(): void
    {
        $interview = Interview::with([
            'transcripts',
            'applicant',
            'jobPosting.jobLibrary',
        ])->find($this->interviewId);

        if (! $interview) {
            Log::error("GenerateAIInterviewReportJob: interview {$this->interviewId} not found");
            return;
        }

        $transcripts = $interview->transcripts;

        if ($transcripts->isEmpty()) {
            Log::warning("GenerateAIInterviewReportJob: no transcripts for interview {$this->interviewId}. Skipping.");
            return;
        }

        // ── 1. Build the dialogue string ──────────────────────────────────
        $dialogue = $transcripts->map(function ($t) {
            $label  = match ($t->speaker_role) {
                'hr'        => 'HR Interviewer',
                'applicant' => 'Applicant',
                default     => 'System',
            };
            $time = gmdate('H:i:s', $t->segment_offset);
            return "[{$time}] {$label}: {$t->text}";
        })->implode("\n");

        $positionTitle = $interview->jobPosting?->jobLibrary?->job_title ?? 'the applied position';
        $applicantName = $interview->applicant
            ? "{$interview->applicant->first_name} {$interview->applicant->last_name}"
            : 'the applicant';

        // ── 2. Build the strict JSON prompt ───────────────────────────────
        $prompt = <<<PROMPT
You are an expert HR analysis AI. Evaluate the following interview transcript between an HR interviewer and a job applicant.

Position: {$positionTitle}
Candidate: {$applicantName}
Interview Stage: {$interview->interview_stage}

== TRANSCRIPT ==
{$dialogue}

== INSTRUCTIONS ==
Analyse ONLY what was said in the transcript above. Do not invent information not present in the dialogue.
Evaluate the candidate's soft skills, communication quality, and overall interview performance.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text outside the JSON object.
The JSON must match this exact structure:

{
  "overall_score": <integer 0-100>,
  "communication_score": <integer 0-100>,
  "confidence_score": <integer 0-100>,
  "strengths": [
    {"point": "<specific strength observed in the transcript>"},
    {"point": "<another strength>"}
  ],
  "weaknesses": [
    {"point": "<specific weakness or area for improvement observed in the transcript>"},
    {"point": "<another weakness>"}
  ],
  "hiring_recommendation": "<one paragraph recommendation — hire, consider, or decline — based strictly on the transcript>",
  "score_rationale": "<one paragraph explaining how the overall_score was derived>"
}
PROMPT;

        // ── 3. Call xAI Grok API (OpenAI-compatible) ───────────────────────
        $apiKey = config('services.xai.key');

        if (empty($apiKey)) {
            Log::error('GenerateAIInterviewReportJob: XAI_API_KEY is not configured.');
            return;
        }

        try {
            /** @var OpenAIClient $client */
            $client = \OpenAI::factory()
                ->withApiKey($apiKey)
                ->withBaseUri('https://api.x.ai/v1')
                ->withHttpClient(new \GuzzleHttp\Client(['verify' => false, 'timeout' => 90]))
                ->make();

            $response = $client->chat()->create([
                'model'       => 'grok-4.5',
                'temperature' => 0.2,
                'max_tokens'  => 1024,
                'messages'    => [
                    [
                        'role'    => 'system',
                        'content' => 'You are a precise HR evaluation AI. Always respond with valid JSON only. No markdown, no code fences — just the raw JSON object.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

            $rawContent = $response->choices[0]->message->content ?? '';

            // Strip accidental markdown fences
            $rawContent = preg_replace('/^```json\s*/i', '', trim($rawContent));
            $rawContent = preg_replace('/```\s*$/', '', $rawContent);

            $aiData = json_decode($rawContent, true);

            if (! $aiData || ! isset($aiData['overall_score'])) {
                Log::error('GenerateAIInterviewReportJob: Failed to parse Grok response', [
                    'raw' => substr($rawContent, 0, 500),
                ]);
                return;
            }

        } catch (\Throwable $e) {
            Log::error('GenerateAIInterviewReportJob: xAI API call failed — ' . $e->getMessage());
            throw $e; // allow retry
        }

        // ── 4. Persist the report ─────────────────────────────────────────
        AiInterviewReport::updateOrCreate(
            ['interview_id' => $interview->id],
            [
                'overall_score'         => (int) ($aiData['overall_score']       ?? 0),
                'communication_score'   => (int) ($aiData['communication_score'] ?? 0),
                'confidence_score'      => (int) ($aiData['confidence_score']    ?? 0),
                'strengths'             => $aiData['strengths']  ?? [],
                'weaknesses'            => $aiData['weaknesses'] ?? [],
                'hiring_recommendation' => $aiData['hiring_recommendation'] ?? '',
                'raw_ai_response'       => $aiData,
                'model_used'            => 'grok-4.5',
                'generated_at'          => now(),
            ]
        );

        // Update the interview's ai_summary for quick display in the interviews list
        $interview->update([
            'ai_summary'       => $aiData['hiring_recommendation'] ?? null,
            'ai_recommendation' => $aiData['score_rationale']       ?? null,
        ]);

        Log::info("GenerateAIInterviewReportJob: report saved for interview {$interview->id}");
    }
}
