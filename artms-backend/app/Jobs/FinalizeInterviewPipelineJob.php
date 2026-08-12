<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Models\InterviewBehavioralMetric;
use App\Models\InterviewRecording;
use App\Models\InterviewTranscript;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Pipeline Job that coordinates post-interview processing:
 * 1. Finalizes audio recordings & runs Whisper Speech-to-Text.
 * 2. Computes deterministic speech metrics (speaking ratio, word count, response length).
 * 3. Aggregates MediaPipe behavioral metrics.
 * 4. Triggers AI Evaluation Report Generation.
 */
class FinalizeInterviewPipelineJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 300; // 5 minutes

    public function __construct(public readonly int $interviewId)
    {
    }

    public function handle(): void
    {
        $interview = Interview::with(['transcripts', 'recordings', 'behavioralMetric'])->find($this->interviewId);

        if (! $interview) {
            Log::error("FinalizeInterviewPipelineJob: Interview {$this->interviewId} not found.");
            return;
        }

        Log::info("FinalizeInterviewPipelineJob started for interview {$this->interviewId}");

        $interview->update([
            'recording_status'     => 'completed',
            'transcription_status' => 'processing',
            'analysis_status'      => 'processing',
            'report_status'        => 'processing',
        ]);

        try {
            // ── Step 1: Process Audio Recordings via Whisper STT (if pending audio) ──
            $this->processAudioRecordings($interview);
            $interview->update(['transcription_status' => 'completed']);

            // Reload transcripts after Whisper processing
            $interview->load('transcripts');

            // ── Step 2: Compute Deterministic Speech Metrics ─────────────────
            $speechMetrics = $this->calculateSpeechMetrics($interview);

            // Save / Update InterviewBehavioralMetric record
            InterviewBehavioralMetric::updateOrCreate(
                ['interview_id' => $interview->id],
                [
                    'speech_metrics' => $speechMetrics,
                ]
            );

            // ── Step 3: Trigger AI Report Generation ─────────────────────────
            GenerateAIInterviewReportJob::dispatchSync($interview->id);

            $interview->update([
                'analysis_status' => 'completed',
                'report_status'   => 'completed',
                'status'          => 'done',
            ]);

            Log::info("FinalizeInterviewPipelineJob completed successfully for interview {$this->interviewId}");
        } catch (\Throwable $e) {
            Log::error("FinalizeInterviewPipelineJob error for interview {$this->interviewId}: " . $e->getMessage());

            $interview->update([
                'transcription_status' => $interview->transcription_status === 'processing' ? 'failed' : $interview->transcription_status,
                'analysis_status'      => 'failed',
                'report_status'        => 'failed',
            ]);
        }
    }

    /**
     * Transcribe any pending audio recordings for this interview.
     */
    private function processAudioRecordings(Interview $interview): void
    {
        $recordings = InterviewRecording::where('interview_id', $interview->id)
            ->where('status', 'completed')
            ->whereNotNull('file_path')
            ->get();

        if ($recordings->isEmpty() && ! empty($interview->audio_recording_path)) {
            $recordings = collect([
                (object) [
                    'file_path'            => $interview->audio_recording_path,
                    'participant_role'     => 'room_composite',
                    'participant_identity' => 'system',
                ],
            ]);
        }

        $apiKey = config('services.groq.key') ?? env('GROQ_API_KEY') ?? config('services.openai.key') ?? env('OPENAI_API_KEY');

        if (empty($apiKey) || $recordings->isEmpty()) {
            return;
        }

        $allLines = [];

        foreach ($recordings as $rec) {
            $filePath = storage_path('app/' . $rec->file_path);

            if (! file_exists($filePath) && ! empty($rec->file_url)) {
                try {
                    $tempDir = storage_path('app/temp-recordings');
                    if (! is_dir($tempDir)) {
                        mkdir($tempDir, 0755, true);
                    }
                    $tempFilePath = $tempDir . '/' . basename($rec->file_path);

                    Log::info("FinalizeInterviewPipelineJob: Downloading remote recording from {$rec->file_url} to {$tempFilePath}");

                    $client = new \GuzzleHttp\Client(['verify' => false, 'timeout' => 60]);
                    $client->get($rec->file_url, ['sink' => $tempFilePath]);

                    if (file_exists($tempFilePath)) {
                        $filePath = $tempFilePath;
                    }
                } catch (\Throwable $dlEx) {
                    Log::error("FinalizeInterviewPipelineJob: Failed to download remote recording from {$rec->file_url} - " . $dlEx->getMessage());
                }
            } else if (! file_exists($filePath)) {
                $filePath = public_path($rec->file_path);
            }

            if (! file_exists($filePath)) {
                Log::warning("FinalizeInterviewPipelineJob: Recording file not found locally and no remote download url available: {$rec->file_path}");
                continue;
            }

            $recStartedAt = isset($rec->started_at) ? strtotime($rec->started_at) : time();

            try {
                $isGroq = str_starts_with($apiKey, 'gsk_');
                $endpoint = $isGroq
                    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
                    : 'https://api.openai.com/v1/audio/transcriptions';
                $model = $isGroq ? 'whisper-large-v3-turbo' : 'whisper-1';

                $client = new \GuzzleHttp\Client(['verify' => false, 'timeout' => 90]);
                $response = $client->post($endpoint, [
                    'headers' => ['Authorization' => 'Bearer ' . $apiKey],
                    'multipart' => [
                        [
                            'name'     => 'file',
                            'contents' => fopen($filePath, 'r'),
                            'filename' => basename($filePath),
                        ],
                        [
                            'name'     => 'model',
                            'contents' => $model,
                        ],
                        [
                            'name'     => 'response_format',
                            'contents' => 'verbose_json',
                        ],
                    ],
                ]);

                $result = json_decode((string) $response->getBody(), true);
                $text = trim($result['text'] ?? '');

                if (! empty($text)) {
                    $segments = $result['segments'] ?? [];

                    if (! empty($segments)) {
                        foreach ($segments as $seg) {
                            $segText = trim($seg['text'] ?? '');
                            if (! empty($segText)) {
                                $offset = (int) ($seg['start'] ?? 0);
                                $allLines[] = [
                                    'interview_id'     => $interview->id,
                                    'speaker_identity' => $rec->participant_identity ?? 'system',
                                    'speaker_role'     => $rec->participant_role ?? 'applicant',
                                    'text'             => $segText,
                                    'segment_offset'   => $offset,
                                    'abs_timestamp'    => $recStartedAt + $offset,
                                    'spoken_at'        => date('Y-m-d H:i:s', $recStartedAt + $offset),
                                ];
                            }
                        }
                    } else {
                        $allLines[] = [
                            'interview_id'     => $interview->id,
                            'speaker_identity' => $rec->participant_identity ?? 'system',
                            'speaker_role'     => $rec->participant_role ?? 'applicant',
                            'text'             => $text,
                            'segment_offset'   => 0,
                            'abs_timestamp'    => $recStartedAt,
                            'spoken_at'        => date('Y-m-d H:i:s', $recStartedAt),
                        ];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Whisper transcription error for recording: " . $e->getMessage());
            }
        }

        // Sort all lines chronologically across participants by absolute timestamp
        usort($allLines, fn($a, $b) => $a['abs_timestamp'] <=> $b['abs_timestamp']);

        foreach ($allLines as $line) {
            unset($line['abs_timestamp']);
            InterviewTranscript::create($line);
        }
    }

    /**
     * Calculate deterministic speech metrics from stored transcripts.
     */
    private function calculateSpeechMetrics(Interview $interview): array
    {
        $transcripts = $interview->transcripts;

        if ($transcripts->isEmpty()) {
            return [
                'total_responses'          => 0,
                'total_words'              => 0,
                'applicant_words'          => 0,
                'hr_words'                 => 0,
                'applicant_speaking_ratio' => 50.0,
                'avg_words_per_response'   => 0,
                'long_pause_count'         => 0,
            ];
        }

        $applicantTranscripts = $transcripts->where('speaker_role', 'applicant');
        $hrTranscripts        = $transcripts->where('speaker_role', 'hr');

        $applicantText = $applicantTranscripts->pluck('text')->implode(' ');
        $hrText        = $hrTranscripts->pluck('text')->implode(' ');

        $applicantWords = str_word_count($applicantText);
        $hrWords        = str_word_count($hrText);
        $totalWords     = $applicantWords + $hrWords;

        $applicantRatio = $totalWords > 0 ? round(($applicantWords / $totalWords) * 100, 1) : 50.0;
        $applicantResponseCount = $applicantTranscripts->count();
        $avgWords = $applicantResponseCount > 0 ? round($applicantWords / $applicantResponseCount, 1) : 0;

        // Detect long pauses (gaps > 5 seconds between consecutive transcript segments)
        $longPauses = 0;
        $prevOffset = null;
        foreach ($transcripts as $t) {
            if ($prevOffset !== null && ($t->segment_offset - $prevOffset) >= 5) {
                $longPauses++;
            }
            $prevOffset = $t->segment_offset;
        }

        return [
            'total_responses'          => $applicantResponseCount,
            'total_words'              => $totalWords,
            'applicant_words'          => $applicantWords,
            'hr_words'                 => $hrWords,
            'applicant_speaking_ratio' => $applicantRatio,
            'avg_words_per_response'   => $avgWords,
            'long_pause_count'         => $longPauses,
        ];
    }
}
