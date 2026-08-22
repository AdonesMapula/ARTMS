<?php

namespace App\Http\Controllers;

use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class JobDocumentParserController extends Controller
{
    /**
     * Parse an uploaded document (PDF, DOCX, DOC, XLSX, XLS, CSV, TXT)
     * and return structured Job Library data via AI extraction.
     */
    public function parse(Request $request): JsonResponse
    {
        $request->validate([
            'document' => ['required', 'file', 'max:10240'], // 10MB max
        ]);

        $file = $request->file('document');
        $allowedExt = ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'csv', 'txt'];
        $ext = strtolower($file->getClientOriginalExtension());

        if (!in_array($ext, $allowedExt)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid file type. Please upload a PDF, DOCX, DOC, XLSX, XLS, CSV, or TXT file.',
            ], 422);
        }

        try {
            $storedPath = $file->storeAs('temp-job-docs/' . uniqid(), 'doc_' . uniqid() . '.' . $ext, 'local');

            Log::info('Job document uploaded for parsing', [
                'original_name' => $file->getClientOriginalName(),
                'ext' => $ext,
                'stored_path' => $storedPath,
            ]);

            // Extract text based on file type
            $rawText = $this->extractText($storedPath, $ext);

            // Clean up temp file
            Storage::disk('local')->delete($storedPath);

            if (empty(trim($rawText)) || strlen(trim($rawText)) < 25) {
                return response()->json([
                    'success' => false,
                    'is_invalid_document' => true,
                    'message' => 'The uploaded file appears to be empty or contains insufficient text. Please upload a file with full job description details.',
                    'data' => $this->emptyJobData(),
                ], 422);
            }

            // Clean text artifacts
            $cleanedText = $this->cleanRawText($rawText);

            Log::info('Job document text extracted', ['length' => strlen($cleanedText)]);

            // Parse with AI
            $parsed = $this->parseWithAI($cleanedText);

            $hasTitle = !empty(trim($parsed['job_title'] ?? ''));
            $hasRequirements = !empty($parsed['qualifications']) || !empty($parsed['responsibilities']) || !empty(trim($parsed['job_description'] ?? ''));
            $isValid = ($parsed['is_valid_job_document'] ?? true) && $hasTitle && $hasRequirements;

            if (!$isValid) {
                $feedback = !empty($parsed['validation_feedback']) 
                    ? $parsed['validation_feedback']
                    : (!$hasTitle 
                        ? 'The uploaded file does not contain a recognizable Job Title or Position Name.' 
                        : 'The uploaded file does not appear to be a Job Description document. It is missing job qualifications or responsibilities.');

                return response()->json([
                    'success' => false,
                    'is_invalid_document' => true,
                    'missing_fields' => $parsed['missing_fields'] ?? (!$hasTitle ? ['job_title'] : []),
                    'message' => $feedback,
                    'data' => $this->emptyJobData(),
                ], 422);
            }

            return response()->json([
                'success' => true,
                'data' => $parsed,
                'message' => 'Document parsed successfully! Review the auto-filled fields below.',
            ]);

        } catch (\Throwable $e) {
            Log::error('Job document parsing error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'is_invalid_document' => true,
                'message' => 'An error occurred while parsing the document. Please ensure the document is a valid Job Description file.',
                'data' => $this->emptyJobData(),
            ], 422);
        }
    }

    /**
     * Extract text from the uploaded file based on extension.
     */
    private function extractText(string $storedPath, string $ext): string
    {
        // Reuse ResumeParserService for PDF/DOCX/DOC/TXT
        if (in_array($ext, ['pdf', 'docx', 'doc', 'txt'])) {
            $parser = new ResumeParserService();
            return $parser->extractText($storedPath, $ext);
        }

        // Handle Excel / CSV
        if (in_array($ext, ['xlsx', 'xls', 'csv'])) {
            return $this->extractSpreadsheetText($storedPath, $ext);
        }

        return '';
    }

    /**
     * Extract text from spreadsheet files (xlsx, xls, csv).
     */
    private function extractSpreadsheetText(string $storedPath, string $ext): string
    {
        $absolutePath = Storage::disk('local')->path($storedPath);

        if (!file_exists($absolutePath)) {
            return '';
        }

        try {
            // For CSV, use built-in PHP parsing
            if ($ext === 'csv') {
                return $this->parseCsv($absolutePath);
            }

            // For XLSX/XLS, try PhpSpreadsheet if available
            if (class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
                try {
                    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($absolutePath);
                    $lines = [];

                    foreach ($spreadsheet->getAllSheets() as $sheet) {
                        $sheetTitle = $sheet->getTitle();
                        $lines[] = "=== Sheet: {$sheetTitle} ===";

                        foreach ($sheet->toArray() as $row) {
                            $rowText = implode(' | ', array_filter(array_map('trim', $row)));
                            if (!empty($rowText)) {
                                $lines[] = $rowText;
                            }
                        }
                        $lines[] = '';
                    }

                    $res = trim(implode("\n", $lines));
                    if (!empty($res)) {
                        return $res;
                    }
                } catch (\Throwable $e) {
                    Log::warning('PhpSpreadsheet load error: ' . $e->getMessage());
                }
            }

            // Pure PHP fallback for XLSX without extensions
            $binary = @file_get_contents($absolutePath);
            if ($binary) {
                $xlsxText = $this->extractXlsxPurePhp($binary);
                if (!empty($xlsxText)) {
                    return $xlsxText;
                }
            }

            return '';

        } catch (\Throwable $e) {
            Log::error('Spreadsheet parsing error: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Pure PHP extractor for XLSX shared strings / sheet XML.
     */
    private function extractXlsxPurePhp(string $binary): string
    {
        $sharedStringsXml = $this->extractZipEntryPurePhp($binary, 'xl/sharedStrings.xml');
        if ($sharedStringsXml) {
            $sharedStringsXml = str_replace(['</t>', '</si>'], "\n", $sharedStringsXml);
            $text = strip_tags($sharedStringsXml);
            $text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
            return trim(preg_replace('/\n{3,}/', "\n\n", $text));
        }

        $sheetXml = $this->extractZipEntryPurePhp($binary, 'xl/worksheets/sheet1.xml');
        if ($sheetXml) {
            $sheetXml = str_replace(['</row>', '</v>'], "\n", $sheetXml);
            $text = strip_tags($sheetXml);
            $text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
            return trim(preg_replace('/\n{3,}/', "\n\n", $text));
        }

        return '';
    }

    /**
     * Extract a specific entry from a ZIP/DOCX/XLSX binary string in pure PHP without ZipArchive.
     */
    private function extractZipEntryPurePhp(string $binary, string $targetFilename): ?string
    {
        $pos = strpos($binary, "PK\x03\x04");
        while ($pos !== false) {
            $header = substr($binary, $pos, 30);
            if (strlen($header) < 30) {
                break;
            }

            $compressionMethod = unpack('v', substr($header, 8, 2))[1] ?? 0;
            $compressedSize = unpack('V', substr($header, 18, 4))[1] ?? 0;
            $filenameLength = unpack('v', substr($header, 26, 2))[1] ?? 0;
            $extraFieldLength = unpack('v', substr($header, 28, 2))[1] ?? 0;

            $offset = $pos + 30;
            $entryFilename = substr($binary, $offset, $filenameLength);
            $offset += $filenameLength + $extraFieldLength;

            if ($entryFilename === $targetFilename) {
                $compressedData = substr($binary, $offset, $compressedSize);
                if ($compressionMethod === 8) {
                    $uncompressed = @gzinflate($compressedData);
                    if ($uncompressed !== false) {
                        return $uncompressed;
                    }
                } elseif ($compressionMethod === 0) {
                    return $compressedData;
                }
            }

            $pos = strpos($binary, "PK\x03\x04", $pos + 4);
        }

        return null;
    }

    /**
     * Parse CSV file using native PHP.
     */
    private function parseCsv(string $path): string
    {
        $lines = [];
        if (($handle = fopen($path, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                $rowText = implode(' | ', array_filter(array_map('trim', $row)));
                if (!empty($rowText)) {
                    $lines[] = $rowText;
                }
            }
            fclose($handle);
        }
        return implode("\n", $lines);
    }

    /**
     * Clean raw text artifacts (PDF kerning, bullets, control chars).
     */
    private function cleanRawText(string $text): string
    {
        $text = preg_replace('/(?<=\w)<>(?=\w)/u', '', $text);
        $text = str_replace('<>', ' ', $text);
        $text = preg_replace('/[▪•\x{2022}\x{2023}\x{25E6}\x{2043}\x{2219}]/u', '- ', $text);
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        return preg_replace('/[ \t]+/', ' ', $text);
    }

    /**
     * Call xAI/Groq API to extract structured Job Library data from document text.
     */
    private function parseWithAI(string $rawText): array
    {
        $apiKey = config('services.xai.key') ?? env('XAI_API_KEY') ?? env('GROQ_API_KEY');
        if (!$apiKey) {
            Log::warning('xAI/Groq API Key missing for Job Document parsing.');
            return $this->emptyJobData();
        }

        $inputText = strlen($rawText) > 12000 ? substr($rawText, 0, 12000) . "\n[Truncated]" : $rawText;

        $prompt = <<<EOT
You are an expert HR document parser for a Job Library system. 
Analyze the document text below to determine if it is a valid Job Description / Position Specification / Job Requirements document.
Extract all job-related information and return a valid JSON object matching the schema.

CRITICAL RULES:
1. "is_valid_job_document": Set to true ONLY if this document describes an open job position or job description with a title and role duties/requirements. Set to false if it is a personal resume/CV, invoice, receipt, school paper, blank, or completely unrelated document.
2. "validation_feedback": If is_valid_job_document is false or if key fields like Job Title/Qualifications are missing, provide a clear 1-2 sentence explanation of what is wrong or missing.
3. "missing_fields": List any required fields that could not be found (e.g. ["job_title", "qualifications", "responsibilities"]).
4. For qualifications and responsibilities, group related items into categorized blocks with a title and bullet detail items.
5. For employment_type, use one of: full_time, part_time, contractual, project_based, probationary, ojt.
6. For salary values, extract numeric values only (no currency symbols). If a range is found, set both salary_min and salary_max.
7. Your response must be valid JSON only. No markdown, no code fences, no explanation.

== SCHEMA ==
{
  "is_valid_job_document": true,
  "validation_feedback": "string",
  "missing_fields": ["string"],
  "job_title": "string (the job position title, or empty string if not found)",
  "job_description": "string (a 2-4 sentence overview of the role, or empty string)",
  "job_category": "string (e.g. Operations, IT, Finance, Engineering, Marketing, HR, etc.)",
  "employment_type": "string (full_time | part_time | contractual | project_based | probationary | ojt)",
  "salary_min": "number or null (monthly salary minimum in PHP)",
  "salary_max": "number or null (monthly salary maximum in PHP)",
  "qualifications": [
    {
      "title": "string (category name, e.g. 'Education & Experience', 'Technical Skills')",
      "details": [
        { "value": "string (specific qualification item)" }
      ]
    }
  ],
  "responsibilities": [
    {
      "title": "string (category name, e.g. 'Core Duties', 'Administrative Tasks')",
      "details": [
        { "value": "string (specific responsibility item)" }
      ]
    }
  ]
}

== DOCUMENT TEXT ==
{$inputText}
EOT;

        try {
            $isGroq = str_starts_with($apiKey, 'gsk_');
            $baseUri = $isGroq
                ? 'https://api.groq.com/openai/v1/chat/completions'
                : 'https://api.x.ai/v1/chat/completions';
            $model = $isGroq ? 'llama-3.3-70b-versatile' : 'grok-3-mini';

            $response = Http::withToken($apiKey)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->timeout(30)
                ->post($baseUri, [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a precise HR document parser. Respond ONLY with valid, raw JSON. No markdown, no code fences, no extra text.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.1,
                    'max_tokens' => 4096,
                ]);

            if ($response->successful()) {
                $aiText = $response->json('choices.0.message.content') ?? '{}';

                // Clean code fences
                $aiText = preg_replace('/```json\s*/i', '', $aiText);
                $aiText = preg_replace('/```\s*/', '', $aiText);
                $aiText = trim($aiText);

                $extracted = json_decode($aiText, true);
                if (is_array($extracted)) {
                    // Ensure proper block IDs for frontend
                    $extracted = $this->normalizeBlockIds($extracted);
                    return array_merge($this->emptyJobData(), $extracted);
                }
            }

            Log::warning('AI parsing returned non-JSON or failed', [
                'status' => $response->status(),
            ]);

        } catch (\Throwable $e) {
            Log::error('xAI/Groq Job Document Parsing Failed: ' . $e->getMessage());
        }

        return $this->emptyJobData();
    }

    /**
     * Ensure qualification/responsibility blocks have proper IDs for frontend React keys.
     */
    private function normalizeBlockIds(array $data): array
    {
        foreach (['qualifications', 'responsibilities'] as $field) {
            if (!empty($data[$field]) && is_array($data[$field])) {
                foreach ($data[$field] as $i => &$block) {
                    // If block is a string instead of an array, wrap it
                    if (is_string($block)) {
                        $block = ['title' => $block, 'details' => []];
                    }

                    if (!isset($block['id'])) {
                        $block['id'] = intval(microtime(true) * 1000) + $i;
                    }
                    if (!empty($block['details']) && is_array($block['details'])) {
                        foreach ($block['details'] as $j => &$detail) {
                            // AI returns details as plain strings like ["Detail 1", "Detail 2"]
                            // Frontend expects objects like [{id: 1, value: "Detail 1"}]
                            if (is_string($detail)) {
                                $detail = [
                                    'id' => intval(microtime(true) * 1000) + $i * 100 + $j,
                                    'value' => $detail,
                                ];
                            } elseif (is_array($detail) && !isset($detail['id'])) {
                                $detail['id'] = intval(microtime(true) * 1000) + $i * 100 + $j;
                            }
                        }
                    }
                }
            }
        }
        return $data;
    }

    /**
     * Return empty default structure for the Job Library form.
     */
    private function emptyJobData(): array
    {
        return [
            'job_title' => '',
            'job_description' => '',
            'job_category' => '',
            'employment_type' => 'full_time',
            'salary_min' => null,
            'salary_max' => null,
            'qualifications' => [],
            'responsibilities' => [],
        ];
    }
}
