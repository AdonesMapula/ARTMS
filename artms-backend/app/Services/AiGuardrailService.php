<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class AiGuardrailService
{
    /**
     * Common Prompt Injection & Jailbreak Patterns
     */
    protected static array $injectionPatterns = [
        '/\b(ignore|disregard|forget|override|bypass)\s+(all\s+)?(previous|prior|above|system|initial)\s+(instructions|prompts|rules|commands|context)\b/i',
        '/\b(system\s*(override|prompt|command)|you\s+are\s+now|developer\s+mode|dan\s+mode|jailbreak)\b/i',
        '/\b(always\s+give|guarantee|force|must\s+assign|must\s+output)\s+(a\s+)?(100|perfect|high|hire|pass|maximum)\s*(%|\/100|score|rating|mark|result)?\b/i',
        '/\b(bypass|disable|turn\s+off|circumvent)\s+(safety|content|guardrail|filter|policy|restrictions)\b/i',
        '/\b(reveal|show|print|output|leak|repeat)\s+(your\s+)?(system\s+prompt|hidden\s+instruction|internal\s+rules|api\s*key)\b/i',
        '/\b(BEGIN_INSTRUCTION|END_INSTRUCTION|<\|im_start\|>|<\|im_end\|>|\[SYSTEM_PROMPT\]|\[ADMIN_OVERRIDE\])\b/i',
        '/```(?:system|admin|override)\s*[\s\S]*?```/i',
    ];

    /**
     * Discriminatory and biased language patterns that must not appear in automated HR evaluations.
     */
    protected static array $unethicalTerms = [
        '/\b(too\s+old|too\s+young|elderly|childbearing|pregnant|pregnancy|marital\s+status|race|skin\s+color|religion|creed|caste|disability|handicap|unfit\s+due\s+to\s+age)\b/i',
        '/\b(dishonest|liar|deceptive|fraudulent|psychologically\s+unstable|insane|crazy)\b/i',
    ];

    /**
     * 1. Sanitize raw text: normalize encoding, strip null bytes and excessive whitespace, limit max length.
     *
     * @param string $text
     * @param int $maxLength
     * @return string
     */
    public static function sanitizeInput(string $text, int $maxLength = 10000): string
    {
        // Strip null bytes and non-printable control characters (except common whitespace)
        $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        // Normalize letter-by-letter artifacts often produced by PDF text extractors (e.g. A<>L<>E<>X)
        $clean = preg_replace('/(?<=\w)<>(?=\w)/u', '', $clean);
        $clean = str_replace('<>', ' ', $clean);

        // Normalize bullet points and weird symbols to standard markdown dashes
        $clean = preg_replace('/[▪•\x{2022}\x{2023}\x{25E6}\x{2043}\x{2219}]/u', '- ', $clean);

        // Normalize excessive consecutive newlines and whitespace
        $clean = preg_replace("/\n{3,}/", "\n\n", $clean);
        $clean = preg_replace("/[ \t]{2,}/", " ", $clean);
        $clean = trim($clean);

        // Token / Character length bounding
        if (mb_strlen($clean) > $maxLength) {
            $clean = mb_substr($clean, 0, $maxLength) . "\n[Truncated to safeguard token limits]";
        }

        return $clean;
    }

    /**
     * 2. Detect and neutralize adversarial prompt injection attempts.
     *
     * @param string $text
     * @param string|null $context
     * @param int|null $userId
     * @return string
     */
    public static function detectAndNeutralizePromptInjection(string $text, ?string $context = 'AI Request', ?int $userId = null): string
    {
        $sanitized = $text;
        $injectionsFound = [];

        foreach (self::$injectionPatterns as $pattern) {
            if (preg_match($pattern, $sanitized, $matches)) {
                $injectionsFound[] = $matches[0];
                $sanitized = preg_replace($pattern, '[PROMPT_INJECTION_DEFUSED]', $sanitized);
            }
        }

        if (! empty($injectionsFound)) {
            $matchedSnippets = implode(', ', array_unique($injectionsFound));
            try {
                Log::warning("AI Guardrail Alert: Prompt injection attempt detected in [{$context}]. Patterns: {$matchedSnippets}");
            } catch (\Throwable $e) {
                // Ignore if running outside Laravel container
            }

            try {
                AuditLog::record(
                    'security_alert',
                    'ai_guardrail',
                    "Neutralized prompt injection attack in {$context}. Detected snippets: {$matchedSnippets}",
                    $userId
                );
            } catch (\Throwable $e) {
                // Ignore audit log failure to not disrupt flow
            }
        }

        return $sanitized;
    }

    /**
     * 3. Anonymize Personally Identifiable Information (PII) to prevent bias and protect candidate privacy.
     *
     * @param string $text
     * @param array $namesToRedact
     * @param bool $redactContactInfo
     * @return string
     */
    public static function anonymizePii(string $text, array $namesToRedact = [], bool $redactContactInfo = true): string
    {
        $clean = $text;

        // 1. Redact Email addresses and Contact numbers first
        if ($redactContactInfo) {
            $clean = preg_replace('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', '[REDACTED_EMAIL]', $clean);
            $clean = preg_replace('/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', '[REDACTED_PHONE]', $clean);
        }

        // 2. Redact Philippine National IDs & Tax Numbers (SSS, TIN, PhilHealth, Pag-IBIG)
        $clean = preg_replace('/\b\d{2}-\d{7}-\d{1}\b/', '[REDACTED_SSS]', $clean);
        $clean = preg_replace('/\b\d{3}-\d{3}-\d{3}(-\d{3,5})?\b/', '[REDACTED_TIN]', $clean);
        $clean = preg_replace('/\b\d{2}-\d{9}-\d{1}\b/', '[REDACTED_PHILHEALTH]', $clean);
        $clean = preg_replace('/\b\d{4}-\d{4}-\d{4}\b/', '[REDACTED_PAGIBIG]', $clean);

        // 3. Redact specific candidate names
        foreach ($namesToRedact as $name) {
            $name = trim((string) $name);
            if (mb_strlen($name) >= 2) {
                $clean = str_ireplace($name, '[REDACTED_NAME]', $clean);
            }
        }

        return $clean;
    }

    /**
     * 4. Clamp any numeric score to strict minimum and maximum bounds.
     *
     * @param mixed $score
     * @param float $min
     * @param float $max
     * @param float $default
     * @return float
     */
    public static function clampScore(mixed $score, float $min = 0.0, float $max = 100.0, float $default = 0.0): float
    {
        if (! is_numeric($score)) {
            return $default;
        }

        $val = (float) $score;
        return round(max($min, min($max, $val)), 2);
    }

    /**
     * 5. Filter toxic or unethical language in AI-generated text, replacing with objective phrasing.
     *
     * @param string $text
     * @return string
     */
    public static function filterHarmfulLanguage(string $text): string
    {
        $clean = $text;
        foreach (self::$unethicalTerms as $pattern) {
            $clean = preg_replace($pattern, '[Objective Evaluation]', $clean);
        }
        return $clean;
    }

    /**
     * 6. Output Guardrail: Validate and enforce AI Screening Evaluation JSON schema & score boundaries.
     *
     * @param array $data
     * @param float $highFitMin
     * @param float $mediumFitMin
     * @return array
     */
    public static function enforceEvaluationSchema(array $data, float $highFitMin = 80.0, float $mediumFitMin = 60.0): array
    {
        // 1. Enforce overall and sub-scores
        $totalScore = self::clampScore($data['ai_score'] ?? 0, 0, 100, 50.0);
        $confidenceLevel = self::clampScore($data['confidence_level'] ?? 80, 0, 100, 80.0);
        $qualificationMatch = self::clampScore($data['qualification_match'] ?? $totalScore, 0, 100, $totalScore);

        // 2. Determine fit label strictly according to system thresholds
        $fitLabel = match (true) {
            $totalScore >= $highFitMin   => 'high',
            $totalScore >= $mediumFitMin => 'medium',
            default                      => 'low',
        };

        // 3. Enforce breakdown limits
        $rawBreakdown = is_array($data['score_breakdown'] ?? null) ? $data['score_breakdown'] : [];
        $scoreBreakdown = [
            'education'  => self::clampScore($rawBreakdown['education'] ?? ($totalScore * 0.25), 0, 25, 15.0),
            'experience' => self::clampScore($rawBreakdown['experience'] ?? ($totalScore * 0.35), 0, 35, 20.0),
            'skills'     => self::clampScore($rawBreakdown['skills'] ?? ($totalScore * 0.30), 0, 30, 20.0),
            'other'      => self::clampScore($rawBreakdown['other'] ?? ($totalScore * 0.10), 0, 10, 5.0),
        ];

        // 4. Sanitize skills lists
        $skillsMatched = array_values(array_filter(array_map('trim', (array) ($data['skills_matched'] ?? [])), fn($s) => !empty($s) && strlen($s) <= 100));
        $skillsMissing = array_values(array_filter(array_map('trim', (array) ($data['skills_missing'] ?? [])), fn($s) => !empty($s) && strlen($s) <= 100));

        // 5. Sanitize text remarks and summaries with harmful language filter
        $educationRemarks  = self::filterHarmfulLanguage(trim((string) ($data['education_remarks'] ?? 'Education requirements reviewed.')));
        $experienceRemarks = self::filterHarmfulLanguage(trim((string) ($data['experience_remarks'] ?? 'Experience history evaluated.')));
        $skillsRemarks     = self::filterHarmfulLanguage(trim((string) ($data['skills_remarks'] ?? 'Skill alignment evaluated.')));
        $aiSummary         = self::filterHarmfulLanguage(trim((string) ($data['ai_summary'] ?? 'Candidate evaluation completed against role requirements.')));
        $aiFeedback        = self::filterHarmfulLanguage(trim((string) ($data['ai_feedback'] ?? 'Continue developing targeted industry skills for future opportunities.')));

        $redFlags = array_values(array_filter(array_map('trim', (array) ($data['red_flags'] ?? [])), fn($s) => !empty($s) && strlen($s) <= 300));
        $interviewQuestions = array_values(array_filter(array_map('trim', (array) ($data['interview_questions'] ?? [])), fn($s) => !empty($s) && strlen($s) <= 300));
        $alternativeRoles = array_values(array_filter(array_map('trim', (array) ($data['alternative_roles'] ?? [])), fn($s) => !empty($s) && strlen($s) <= 150));

        return [
            'ai_score'            => $totalScore,
            'confidence_level'    => $confidenceLevel,
            'fit_label'           => $fitLabel,
            'qualification_match' => $qualificationMatch,
            'score_breakdown'     => $scoreBreakdown,
            'skills_matched'      => $skillsMatched,
            'skills_missing'      => $skillsMissing,
            'education_remarks'   => $educationRemarks,
            'experience_remarks'  => $experienceRemarks,
            'skills_remarks'      => $skillsRemarks,
            'ai_summary'          => $aiSummary,
            'ai_feedback'         => $aiFeedback,
            'red_flags'           => $redFlags,
            'interview_questions' => $interviewQuestions,
            'alternative_roles'   => $alternativeRoles,
        ];
    }

    /**
     * 7. Output Guardrail: Validate and enforce AI Interview Report JSON schema & score boundaries.
     *
     * @param array $data
     * @return array
     */
    public static function enforceInterviewReportSchema(array $data): array
    {
        $overallScore = self::clampScore($data['overall_score'] ?? 75, 0, 100, 75.0);
        $commScore    = self::clampScore($data['communication_score'] ?? $overallScore, 0, 100, $overallScore);
        $confScore    = self::clampScore($data['confidence_score'] ?? $overallScore, 0, 100, $overallScore);

        $strengths = [];
        if (! empty($data['strengths']) && is_array($data['strengths'])) {
            foreach ($data['strengths'] as $item) {
                $point = is_array($item) ? ($item['point'] ?? '') : (string) $item;
                $point = self::filterHarmfulLanguage(trim($point));
                if (! empty($point)) {
                    $strengths[] = ['point' => $point];
                }
            }
        }
        if (empty($strengths)) {
            $strengths[] = ['point' => 'Demonstrated professional conduct during the interview session.'];
        }

        $weaknesses = [];
        if (! empty($data['weaknesses']) && is_array($data['weaknesses'])) {
            foreach ($data['weaknesses'] as $item) {
                $point = is_array($item) ? ($item['point'] ?? '') : (string) $item;
                $point = self::filterHarmfulLanguage(trim($point));
                if (! empty($point)) {
                    $weaknesses[] = ['point' => $point];
                }
            }
        }
        if (empty($weaknesses)) {
            $weaknesses[] = ['point' => 'Can provide more granular details on past individual contributions.'];
        }

        $hiringRec = self::filterHarmfulLanguage(trim((string) ($data['hiring_recommendation'] ?? 'Candidate demonstrated relevant competencies during the interview.')));
        $scoreRationale = self::filterHarmfulLanguage(trim((string) ($data['score_rationale'] ?? 'Score is based on candidate articulation and domain responses.')));

        $dialectSummary = [];
        if (! empty($data['dialect_summary']) && is_array($data['dialect_summary'])) {
            $dialectSummary = $data['dialect_summary'];
        } else {
            $dialectSummary = [
                'dominant_dialect'  => 'English / Filipino',
                'dialect_diversity' => 'Standard code-switching observed',
                'breakdown'         => ['English' => 100.0, 'Filipino' => 0.0, 'Cebuano' => 0.0, 'Hiligaynon' => 0.0],
            ];
        }

        return [
            'overall_score'         => $overallScore,
            'communication_score'   => $commScore,
            'confidence_score'      => $confScore,
            'strengths'             => $strengths,
            'weaknesses'            => $weaknesses,
            'dialect_summary'       => $dialectSummary,
            'hiring_recommendation' => $hiringRec,
            'score_rationale'       => $scoreRationale,
        ];
    }

    /**
     * 8. Output Guardrail: Validate and enforce Live Interview Speech Analysis schema.
     *
     * @param array $data
     * @return array
     */
    public static function enforceLiveAnalysisSchema(array $data): array
    {
        $confidenceScore = self::clampScore($data['confidence_score'] ?? 80, 0, 100, 80.0);
        $enthusiasmScore = self::clampScore($data['enthusiasm_score'] ?? 75, 0, 100, 75.0);
        $calmnessScore   = self::clampScore($data['calmness_score'] ?? 85, 0, 100, 85.0);
        $overallMatch    = self::clampScore($data['overall_match'] ?? 80, 0, 100, 80.0);

        $keywords = [];
        if (! empty($data['keywords']) && is_array($data['keywords'])) {
            foreach ($data['keywords'] as $kw) {
                $cleanKw = strtoupper(trim((string) $kw));
                if (! empty($cleanKw) && strlen($cleanKw) <= 40) {
                    $keywords[] = $cleanKw;
                }
            }
        }
        if (empty($keywords)) {
            $keywords = ['COMMUNICATION SKILLS', 'PROBLEM SOLVING', 'ACTIVE LISTENING'];
        }

        return [
            'confidence_score' => (int) round($confidenceScore),
            'enthusiasm_score' => (int) round($enthusiasmScore),
            'calmness_score'   => (int) round($calmnessScore),
            'keywords'         => array_values(array_unique($keywords)),
            'overall_match'    => (int) round($overallMatch),
        ];
    }
}
