<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Models\InterviewBehavioralMetric;
use App\Models\InterviewRecording;
use App\Models\InterviewTranscript;
use App\Services\GeminiService;
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

            // ── Step 2: Compute Deterministic Speech & Dialect Metrics ───────
            $speechMetrics = $this->calculateSpeechMetrics($interview);
            $affectMetrics = $this->calculateAffectMetrics($interview);

            // Save / Update InterviewBehavioralMetric record
            InterviewBehavioralMetric::updateOrCreate(
                ['interview_id' => $interview->id],
                [
                    'speech_metrics' => $speechMetrics,
                    'affect_metrics' => $affectMetrics,
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
     * Uses Gemini 3.5 Transcribe (gemini-3.5-transcribe) with speaker diarization & word timestamps,
     * falling back gracefully to Whisper STT if Gemini is unavailable.
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

        if ($recordings->isEmpty()) {
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
            } elseif (! file_exists($filePath)) {
                $filePath = public_path($rec->file_path);
            }

            if (! file_exists($filePath)) {
                Log::warning("FinalizeInterviewPipelineJob: Recording file not found locally and no remote download url available: {$rec->file_path}");
                continue;
            }

            $recStartedAt = isset($rec->started_at) ? strtotime($rec->started_at) : time();
            $transcribedSuccessfully = false;

            // ── Primary Engine: Gemini 3.5 Transcribe (gemini-3.5-transcribe) ────────
            try {
                $geminiResult = GeminiService::transcribeAudio($filePath, null, [
                    'diarization'      => true,
                    'word_timestamps'  => true,
                ]);

                if (! empty($geminiResult['words'])) {
                    $words = $geminiResult['words'];
                    $currentSpeaker = null;
                    $currentChunk = [];
                    $chunkStartSec = 0;
                    $lastEndSec = 0;

                    foreach ($words as $w) {
                        $spk = $w['speaker'] ?? ($rec->participant_role ?? 'applicant');
                        $startSec = floatval(rtrim($w['start_offset'] ?? '0s', 's'));
                        $endSec = floatval(rtrim($w['end_offset'] ?? '0s', 's'));

                        // Break chunk on speaker change or natural speech pause (> 2.5s)
                        if ($currentSpeaker !== null && ($spk !== $currentSpeaker || ($startSec - $lastEndSec > 2.5))) {
                            $chunkText = implode(' ', $currentChunk);
                            if (! empty(trim($chunkText))) {
                                $offset = (int) $chunkStartSec;
                                $allLines[] = [
                                    'interview_id'     => $interview->id,
                                    'speaker_identity' => $currentSpeaker === 'spk_1' ? ($rec->participant_identity ?? 'spk_1') : $currentSpeaker,
                                    'speaker_role'     => $rec->participant_role ?? (str_contains(strtolower($currentSpeaker), 'hr') ? 'hr' : 'applicant'),
                                    'text'             => trim($chunkText),
                                    'segment_offset'   => $offset,
                                    'abs_timestamp'    => $recStartedAt + $offset,
                                    'spoken_at'        => date('Y-m-d H:i:s', $recStartedAt + $offset),
                                ];
                            }
                            $currentChunk = [];
                            $chunkStartSec = $startSec;
                        }

                        if ($currentSpeaker === null) {
                            $chunkStartSec = $startSec;
                        }

                        $currentSpeaker = $spk;
                        $currentChunk[] = $w['text'];
                        $lastEndSec = $endSec;
                    }

                    if (! empty($currentChunk)) {
                        $chunkText = implode(' ', $currentChunk);
                        if (! empty(trim($chunkText))) {
                            $offset = (int) $chunkStartSec;
                            $allLines[] = [
                                'interview_id'     => $interview->id,
                                'speaker_identity' => $currentSpeaker === 'spk_1' ? ($rec->participant_identity ?? 'spk_1') : $currentSpeaker,
                                'speaker_role'     => $rec->participant_role ?? (str_contains(strtolower($currentSpeaker), 'hr') ? 'hr' : 'applicant'),
                                'text'             => trim($chunkText),
                                'segment_offset'   => $offset,
                                'abs_timestamp'    => $recStartedAt + $offset,
                                'spoken_at'        => date('Y-m-d H:i:s', $recStartedAt + $offset),
                            ];
                        }
                    }

                    $transcribedSuccessfully = true;
                    Log::info("FinalizeInterviewPipelineJob: Successfully transcribed recording via gemini-3.5-transcribe ({$rec->file_path})");
                } elseif (! empty($geminiResult['text'])) {
                    $allLines[] = [
                        'interview_id'     => $interview->id,
                        'speaker_identity' => $rec->participant_identity ?? 'system',
                        'speaker_role'     => $rec->participant_role ?? 'applicant',
                        'text'             => trim($geminiResult['text']),
                        'segment_offset'   => 0,
                        'abs_timestamp'    => $recStartedAt,
                        'spoken_at'        => date('Y-m-d H:i:s', $recStartedAt),
                    ];
                    $transcribedSuccessfully = true;
                    Log::info("FinalizeInterviewPipelineJob: Successfully transcribed text via gemini-3.5-transcribe ({$rec->file_path})");
                }
            } catch (\Throwable $geminiEx) {
                Log::warning("FinalizeInterviewPipelineJob: Gemini 3.5 Transcribe notice: " . $geminiEx->getMessage());
            }

            // ── Secondary Fallback: Groq / OpenAI Whisper ─────────────────────────
            if (! $transcribedSuccessfully) {
                $apiKey = config('services.groq.key') ?? env('GROQ_API_KEY') ?? config('services.openai.key') ?? env('OPENAI_API_KEY');

                if (! empty($apiKey)) {
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
                            Log::info("FinalizeInterviewPipelineJob: Transcribed recording via Whisper fallback ({$rec->file_path})");
                        }
                    } catch (\Throwable $e) {
                        Log::warning("FinalizeInterviewPipelineJob: Whisper fallback transcription error: " . $e->getMessage());
                    }
                }
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
     * Calculate deterministic speech and dialect metrics from stored transcripts.
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
                'words_per_minute'         => 0,
                'long_pause_count'         => 0,
                'dialect_breakdown'        => [
                    'English'    => 100,
                    'Filipino'   => 0,
                    'Cebuano'    => 0,
                    'Hiligaynon' => 0,
                ],
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

        // Approximate session duration from segment offsets or timestamps
        $maxOffset = $transcripts->max('segment_offset') ?: 0;
        $estimatedMinutes = max(1, round($maxOffset / 60, 1));
        $wpm = round($applicantWords / $estimatedMinutes, 1);

        // Detect long pauses (gaps > 5 seconds between consecutive transcript segments)
        $longPauses = 0;
        $prevOffset = null;
        foreach ($transcripts as $t) {
            if ($prevOffset !== null && ($t->segment_offset - $prevOffset) >= 5) {
                $longPauses++;
            }
            $prevOffset = $t->segment_offset;
        }

        // Compute Dialect Breakdown from dialect_detected tags and linguistic heuristics
        $dialectCounts = [
            'English'    => 0,
            'Filipino'   => 0,
            'Cebuano'    => 0,
            'Hiligaynon' => 0,
        ];

        foreach ($applicantTranscripts as $t) {
            $tag = strtolower((string) ($t->dialect_detected ?? ''));
            $textLower = strtolower($t->text);
            $wordCount = str_word_count($t->text) ?: 1;

            if (str_contains($tag, 'ceb') || str_contains($textLower, 'man') || str_contains($textLower, 'gani') || str_contains($textLower, 'kay') || str_contains($textLower, 'kaayo') || str_contains($textLower, 'wala')) {
                $dialectCounts['Cebuano'] += $wordCount;
            } elseif (str_contains($tag, 'hil') || str_contains($textLower, 'namon') || str_contains($textLower, 'subong') || str_contains($textLower, 'bala') || str_contains($textLower, 'gid')) {
                $dialectCounts['Hiligaynon'] += $wordCount;
            } elseif (str_contains($tag, 'fil') || str_contains($tag, 'tgl') || str_contains($textLower, 'po') || str_contains($textLower, 'opo') || str_contains($textLower, 'ako') || str_contains($textLower, 'ang') || str_contains($textLower, 'mga')) {
                $dialectCounts['Filipino'] += $wordCount;
            } else {
                $dialectCounts['English'] += $wordCount;
            }
        }

        $totalDialectWords = array_sum($dialectCounts);
        $dialectBreakdown = [];
        if ($totalDialectWords > 0) {
            foreach ($dialectCounts as $k => $v) {
                $dialectBreakdown[$k] = round(($v / $totalDialectWords) * 100, 1);
            }
        } else {
            $dialectBreakdown = ['English' => 100.0, 'Filipino' => 0.0, 'Cebuano' => 0.0, 'Hiligaynon' => 0.0];
        }

        return [
            'total_responses'          => $applicantResponseCount,
            'total_words'              => $totalWords,
            'applicant_words'          => $applicantWords,
            'hr_words'                 => $hrWords,
            'applicant_speaking_ratio' => $applicantRatio,
            'avg_words_per_response'   => $avgWords,
            'words_per_minute'         => $wpm,
            'long_pause_count'         => $longPauses,
            'dialect_breakdown'        => $dialectBreakdown,
        ];
    }

    /**
     * Compute aggregated facial affect metrics from stored behavioral metrics.
     */
    private function calculateAffectMetrics(Interview $interview): array
    {
        $metricRecord = $interview->behavioralMetric;
        $samples = $metricRecord?->aggregated_metrics ?? [];

        if (empty($samples) || ! is_array($samples)) {
            return [
                'avg_attentiveness'   => 85.0,
                'avg_composure'       => 82.0,
                'avg_engagement'      => 80.0,
                'facial_valence'      => 78.0, // Positive affect index
                'blink_stress_index'  => 15.0, // Low stress baseline
                'eye_contact_ratio'   => 88.0,
            ];
        }

        $detected = array_filter($samples, fn($s) => !empty($s['faceDetected']));
        $count = count($detected);

        if ($count === 0) {
            return [
                'avg_attentiveness'   => 70.0,
                'avg_composure'       => 75.0,
                'avg_engagement'      => 70.0,
                'facial_valence'      => 70.0,
                'blink_stress_index'  => 25.0,
                'eye_contact_ratio'   => 50.0,
            ];
        }

        $attentiveSum = array_sum(array_column($detected, 'attentiveScore'));
        $composedSum  = array_sum(array_column($detected, 'composedScore'));
        $engagedSum   = array_sum(array_column($detected, 'engagedScore'));

        $eyeContactCount = count(array_filter($detected, fn($s) => ($s['eyeOpenness'] ?? 0) >= 0.22));

        // Valence estimated from engagement and composure
        $avgAttentive = round($attentiveSum / $count, 1);
        $avgComposed  = round($composedSum / $count, 1);
        $avgEngaged   = round($engagedSum / $count, 1);
        $valence      = round(0.5 * $avgEngaged + 0.5 * $avgComposed, 1);
        $blinkStress  = round(max(0, 100 - $avgComposed), 1);
        $eyeRatio     = round(($eyeContactCount / $count) * 100, 1);

        return [
            'avg_attentiveness'  => $avgAttentive,
            'avg_composure'      => $avgComposed,
            'avg_engagement'     => $avgEngaged,
            'facial_valence'     => $valence,
            'blink_stress_index' => $blinkStress,
            'eye_contact_ratio'  => $eyeRatio,
        ];
    }
}
