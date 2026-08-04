<?php

namespace App\Http\Controllers;

use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ResumeParserController extends Controller
{
    public function parse(Request $request): JsonResponse
    {
        Log::info('Resume parse request received', [
            'has_file' => $request->hasFile('resume'),
            'file_info' => $request->hasFile('resume') ? [
                'name' => $request->file('resume')->getClientOriginalName(),
                'size' => $request->file('resume')->getSize(),
                'mime' => $request->file('resume')->getMimeType(),
                'ext' => $request->file('resume')->getClientOriginalExtension(),
            ] : null
        ]);

        $request->validate([
            'resume' => ['required', 'file', 'max:10240'], // 10MB max
        ]);

        $file = $request->file('resume');
        $allowedExt = ['pdf', 'doc', 'docx', 'txt'];
        $ext = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($ext, $allowedExt)) {
            Log::warning('Invalid file extension', ['ext' => $ext, 'allowed' => $allowedExt]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid file type. Please upload a PDF, DOCX, DOC, or TXT file.',
                'errors' => ['resume' => ['The resume must be a file of type: pdf, doc, docx, txt.']]
            ], 422);
        }

        try {
            $appId = 'parse-' . uniqid();
            $storedPath = $file->store("temp-resumes/{$appId}", 'local');
            
            Log::info('File stored', ['path' => $storedPath]);

            switch ($ext) {
                case 'pdf':
                    if (!class_exists(\Smalot\PdfParser\Parser::class)) {
                        throw new \Exception("PDF parser missing.");
                    }
                    break;
                case 'doc':
                case 'docx':
                    if (!class_exists(\PhpOffice\PhpWord\IOFactory::class)) {
                        throw new \Exception("PHPWord missing.");
                    }
                    break;
            }

            $parser = new ResumeParserService();
            $rawText = $parser->extractText($storedPath);

            Log::info('Text extracted', ['length' => strlen($rawText)]);

            Storage::disk('local')->delete($storedPath);

            if (empty(trim($rawText))) {
                Log::warning('Empty text extracted from resume');
                return response()->json([
                    'success' => true,
                    'data' => $this->emptyParsedData(),
                    'message' => 'Resume uploaded. Could not extract text from this file - please fill in the form manually.',
                ]);
            }

            // 1. Locally extract name parts to redact them from AI payload for privacy concerns
            $nameParts = $this->extractNameParts($rawText);
            
            $redactedText = $rawText;
            $first = $nameParts['first'];
            $last = $nameParts['last'];
            $middle = $nameParts['middle'];
            
            if (!empty($first)) {
                $redactedText = str_ireplace($first, '[REDACTED NAME]', $redactedText);
            }
            if (!empty($last)) {
                $redactedText = str_ireplace($last, '[REDACTED NAME]', $redactedText);
            }
            if (!empty($middle)) {
                $redactedText = str_ireplace($middle, '[REDACTED NAME]', $redactedText);
            }
            $fullName = trim("{$first} {$middle} {$last}");
            if (!empty($fullName)) {
                $redactedText = str_ireplace($fullName, '[REDACTED NAME]', $redactedText);
            }
            $shortName = trim("{$first} {$last}");
            if (!empty($shortName)) {
                $redactedText = str_ireplace($shortName, '[REDACTED NAME]', $redactedText);
            }

            // AI-assisted extraction using xAI / Groq API
            $parsed = $this->parseResumeWithAI($redactedText);

            // Re-merge locally extracted name parts
            $parsed['firstName'] = $nameParts['first'];
            $parsed['lastName'] = $nameParts['last'];
            $parsed['middleName'] = $nameParts['middle'];
            
            // 2. Validate, Clean, & Apply Confidence Scores
            $finalData = $this->processAndValidateData($parsed, $rawText);

            // 3. Robustly sanitize UTF-8 to prevent JSON serialization errors
            $sanitizedData = $this->sanitizeUtf8($finalData);

            return response()->json([
                'success' => true,
                'data' => $sanitizedData,
                'message' => 'Resume parsed successfully',
            ]);

        } catch (\Throwable $e) {
            Log::error('Resume parsing error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $this->emptyParsedData(),
                'message' => 'Resume uploaded. Auto-parsing not available - please fill in the form manually.',
            ]);
        }
    }

    /**
     * Call the xAI/Groq API to get structured JSON data from resume text.
     */
    private function parseResumeWithAI(string $rawText): array
    {
        $apiKey = config('services.xai.key') ?? env('XAI_API_KEY') ?? env('GROQ_API_KEY');
        if (!$apiKey) {
            Log::warning('xAI/Groq API Key missing. Falling back to local regex parser.');
            return $this->parseResumeTextFallback($rawText);
        }

        // Limit raw text length for prompt limits
        $inputText = strlen($rawText) > 8000 ? substr($rawText, 0, 8000) . "\n[Truncated]" : $rawText;

        $prompt = <<<EOT
You are an expert ATS resume extraction parser. 
Extract the candidate's details from the raw resume text below and return a valid JSON object matching the JSON schema.
If a field is not present in the resume, return an empty string (or an empty array for skills).
Your response must be valid JSON only. Do not wrap in markdown or backticks.

== SCHEMA ==
{
  "email": "string (valid email)",
  "phone": "string (contact number)",
  "address": "string",
  "gender": "string (Male, Female, Non-binary, or empty)",
  "dateOfBirth": "string (YYYY-MM-DD format if found, otherwise empty)",
  "nationality": "string (e.g. Filipino, American, etc.)",
  "civilStatus": "string (Single, Married, Divorced, Widowed, etc.)",
  "skills": ["string"],
  "education": "string (summary of educational background)",
  "experience": "string (summary of work experience)"
}

== RAW RESUME TEXT ==
{$inputText}
EOT;

        try {
            $isGroq = str_starts_with($apiKey, 'gsk_');
            $baseUri = $isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
            $model = $isGroq ? 'llama-3.3-70b-versatile' : 'grok-4.5';

            $response = Http::withToken($apiKey)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->timeout(15)
                ->post($baseUri, [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a precise resume parser evaluator. Respond ONLY with valid, raw JSON. No markdown, no code fences, no extra text.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.1,
                    'max_tokens' => 2048,
                ]);

            if ($response->successful()) {
                $aiText = $response->json('choices.0.message.content') ?? '{}';
                
                // Clean codeblocks
                $aiText = preg_replace('/```json\s*/i', '', $aiText);
                $aiText = preg_replace('/```\s*/', '', $aiText);
                $aiText = trim($aiText);

                $extracted = json_decode($aiText, true);
                if (is_array($extracted)) {
                    // Ensure all schema keys exist in the response
                    return array_merge($this->emptyParsedData(), $extracted);
                }
            }
        } catch (\Throwable $e) {
            Log::error('xAI/Groq Resume Parsing Failed: ' . $e->getMessage());
        }

        return $this->parseResumeTextFallback($rawText);
    }

    /**
     * Post-process the extracted data, perform local regex validations, and assign confidence scores.
     */
    private function processAndValidateData(array $aiData, string $rawText): array
    {
        $validated = $aiData;
        $confidence = [];

        // 1. Email Verification and Fallback
        $email = trim($validated['email'] ?? '');
        $emailRegex = '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/';
        if (preg_match($emailRegex, $email, $match)) {
            $validated['email'] = strtolower($match[0]);
            $confidence['email'] = 1.0;
        } else {
            if (preg_match($emailRegex, $rawText, $match)) {
                $validated['email'] = strtolower($match[0]);
                $confidence['email'] = 0.9;
            } else {
                $validated['email'] = '';
                $confidence['email'] = 0.0;
            }
        }

        // 2. Phone Verification and Fallback
        $phone = preg_replace('/[\s\-().]/', '', trim($validated['phone'] ?? ''));
        $phoneRegex = '/(?:\+?63|0)9\d{9}/';
        if (preg_match($phoneRegex, $phone, $match)) {
            $validated['phone'] = $match[0];
            $confidence['phone'] = 1.0;
        } else {
            if (preg_match($phoneRegex, preg_replace('/[\s\-().]/', '', $rawText), $match)) {
                $validated['phone'] = $match[0];
                $confidence['phone'] = 0.85;
            } else {
                $validated['phone'] = $phone;
                $confidence['phone'] = empty($phone) ? 0.0 : 0.6;
            }
        }

        // 3. Names Verification
        foreach (['firstName', 'lastName'] as $field) {
            $val = trim($validated[$field] ?? '');
            if (!empty($val)) {
                $lines = array_slice(explode("\n", strtolower($rawText)), 0, 15);
                $found = false;
                foreach ($lines as $line) {
                    if (str_contains($line, strtolower($val))) {
                        $found = true;
                        break;
                    }
                }
                $confidence[$field] = $found ? 0.95 : 0.75;
            } else {
                $confidence[$field] = 0.0;
            }
        }
        $confidence['middleName'] = empty($validated['middleName']) ? 0.0 : 0.7;

        // 4. Date of Birth
        $dob = trim($validated['dateOfBirth'] ?? '');
        if (!empty($dob) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) {
            $confidence['dateOfBirth'] = 1.0;
        } else if (!empty($dob)) {
            try {
                $time = strtotime($dob);
                if ($time) {
                    $validated['dateOfBirth'] = date('Y-m-d', $time);
                    $confidence['dateOfBirth'] = 0.9;
                } else {
                    $validated['dateOfBirth'] = '';
                    $confidence['dateOfBirth'] = 0.0;
                }
            } catch (\Throwable) {
                $validated['dateOfBirth'] = '';
                $confidence['dateOfBirth'] = 0.0;
            }
        } else {
            $confidence['dateOfBirth'] = 0.0;
        }

        // 5. Gender / Status / Nationality Normalizations
        $gender = strtolower(trim($validated['gender'] ?? ''));
        if (in_array($gender, ['male', 'female', 'non-binary'])) {
            $validated['gender'] = ucfirst($gender);
            $confidence['gender'] = 0.95;
        } else {
            $validated['gender'] = '';
            $confidence['gender'] = 0.0;
        }

        $civilStatus = strtolower(trim($validated['civilStatus'] ?? ''));
        $validStatuses = ['single', 'married', 'divorced', 'widowed', 'separated', 'annulled'];
        if (in_array($civilStatus, $validStatuses)) {
            $validated['civilStatus'] = ucfirst($civilStatus);
            $confidence['civilStatus'] = 0.95;
        } else {
            $validated['civilStatus'] = '';
            $confidence['civilStatus'] = 0.0;
        }

        $validated['nationality'] = ucfirst(trim($validated['nationality'] ?? ''));
        $confidence['nationality'] = empty($validated['nationality']) ? 0.0 : 0.85;

        // 6. Section Fields
        $confidence['address'] = empty(trim($validated['address'] ?? '')) ? 0.0 : 0.8;
        $confidence['skills'] = empty($validated['skills']) ? 0.0 : 0.85;
        $confidence['education'] = empty(trim($validated['education'] ?? '')) ? 0.0 : 0.8;
        $confidence['experience'] = empty(trim($validated['experience'] ?? '')) ? 0.0 : 0.8;

        $validated['confidenceScores'] = $confidence;

        return $validated;
    }

    /**
     * Fallback local regex parser in case Gemini/xAI fails.
     */
    private function parseResumeTextFallback(string $text): array
    {
        $nameParts = $this->extractNameParts($text);

        return [
            'firstName' => $nameParts['first'],
            'lastName' => $nameParts['last'],
            'middleName' => $nameParts['middle'],
            'email' => $this->extractEmail($text),
            'phone' => $this->extractPhone($text),
            'address' => $this->extractAddress($text),
            'gender' => $this->extractGender($text),
            'dateOfBirth' => $this->extractDateOfBirth($text),
            'nationality' => $this->extractNationality($text),
            'civilStatus' => $this->extractCivilStatus($text),
            'skills' => $this->extractSkills($text),
            'education' => $this->extractSection($text, ['EDUCATION', 'EDUCATIONAL BACKGROUND', 'ACADEMIC BACKGROUND', 'ACADEMIC HISTORY']),
            'experience' => $this->extractSection($text, ['EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT HISTORY', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE']),
        ];
    }

    private function emptyParsedData(): array
    {
        return [
            'firstName' => '',
            'lastName' => '',
            'middleName' => '',
            'email' => '',
            'phone' => '',
            'address' => '',
            'gender' => '',
            'dateOfBirth' => '',
            'nationality' => '',
            'civilStatus' => '',
            'skills' => [],
            'education' => '',
            'experience' => '',
        ];
    }

    /**
     * Recursively sanitize all array values to ensure valid UTF-8 encoding.
     * Prevents JsonResponse serialization failures.
     */
    private function sanitizeUtf8(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
            } elseif (is_array($value)) {
                $data[$key] = $this->sanitizeUtf8($value);
            }
        }
        return $data;
    }

    private function extractEmail(string $text): string
    {
        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $m)) {
            return strtolower(trim($m[0]));
        }
        return '';
    }

    private function extractPhone(string $text): string
    {
        // Matches PH numbers and standard global variations
        if (preg_match('/(?:\+?63|0)[\s\-]?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}/', $text, $m)) {
            return preg_replace('/[\s\-]/', '', $m[0]);
        }
        if (preg_match('/(?:phone|mobile|cell|tel|contact)[:\s]*(\+?\d[\d\s\-().]{8,15}\d)/i', $text, $m)) {
            return preg_replace('/[\s\-().]+/', '', $m[1]);
        }
        return '';
    }

    private function extractNameParts(string $text): array
    {
        $lines = array_filter(
            array_map('trim', explode("\n", $text)),
            fn($l) => strlen($l) > 1
        );
        $lines = array_values($lines);

        $skip = ['resume', 'curriculum vitae', 'cv', 'objective', 'summary', 'profile',
                  'contact', 'address', 'email', 'phone', 'mobile', 'http', '@', 'www',
                  'date', 'birth', 'gender', 'civil', 'nationality', 'skills', 'education',
                  'experience', 'references', 'page'];

        // Scan deeper (up to 15 lines) to locate the applicant's name
        foreach (array_slice($lines, 0, 15) as $line) {
            $lower = strtolower($line);
            $isSkip = false;
            foreach ($skip as $s) {
                if (str_contains($lower, $s)) { $isSkip = true; break; }
            }
            if ($isSkip) continue;

            $normalized = preg_match('/^[A-Z\s]+$/', $line)
                ? mb_convert_case($line, MB_CASE_TITLE, 'UTF-8')
                : $line;

            $word = '[A-ZÑa-záéíóúàèìòùñüÑ][a-záéíóúàèìòùñüÑ\']+\.?';
            $particle = '(?:de|dela|del|de los|de las|van|von|ng|ni|mga|jr\.?|sr\.?|ii|iii)';
            $nameRx = "/^((?:{$particle}\s+)?{$word})(?:\s+((?:{$particle}\s+)?{$word}))?(?:\s+((?:{$particle}\s+)?{$word}))?(?:\s+((?:{$particle}\s+)?{$word}))?(?:\s+((?:{$particle}\s+)?{$word}))?$/ui";

            if (preg_match($nameRx, $normalized, $m)) {
                $parts = array_values(array_filter(array_slice($m, 1), fn($p) => trim($p) !== ''));

                if (count($parts) >= 2) {
                    $last = array_pop($parts);
                    $first = array_shift($parts);
                    $middle = implode(' ', $parts);

                    return [
                        'first' => trim($first),
                        'middle' => trim($middle),
                        'last' => trim($last)
                    ];
                }
            }
        }

        return ['first' => '', 'middle' => '', 'last' => ''];
    }

    private function extractAddress(string $text): string
    {
        if (preg_match('/(?:address|home address|location)[:\s]+([^\n]{5,80})/i', $text, $m)) {
            return trim($m[1]);
        }

        $addressKeywords = ['street', 'st.', 'avenue', 'ave.', 'blvd', 'brgy', 'barangay', 'subd', 'subdivision', 'city', 'province'];
        
        foreach (explode("\n", $text) as $line) {
            $lowerLine = strtolower($line);
            foreach ($addressKeywords as $kw) {
                if (str_contains($lowerLine, $kw) && strlen(trim($line)) > 10 && strlen(trim($line)) < 100) {
                    if (!preg_match('/(worked|developed|managed|assisted|created|Led|Responsible)/i', $line)) {
                        return trim($line);
                    }
                }
            }
        }

        $cities = ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Cebu City', 'Davao', 'Taguig', 'Cagayan de Oro', 'Iloilo', 'Bacolod', 'Lapu-Lapu', 'Mandaue'];
        foreach ($cities as $city) {
            if (stripos($text, $city) !== false) {
                foreach (explode("\n", $text) as $line) {
                    if (stripos($line, $city) !== false && strlen(trim($line)) < 100) {
                        return trim($line);
                    }
                }
            }
        }

        return '';
    }

    private function extractGender(string $text): string
    {
        if (preg_match('/(?:gender|sex)[:\s]+(male|female|non-binary|prefer not to say)/i', $text, $m)) {
            return ucfirst(strtolower($m[1]));
        }
        if (preg_match('/^\s*(Male|Female)\s*$/im', $text, $m)) {
            return ucfirst(strtolower(trim($m[1])));
        }
        return '';
    }

    private function extractDateOfBirth(string $text): string
    {
        if (preg_match('/(?:date of birth|birthday|dob)[:\s]+(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4}|\w+ \d{1,2},?\s*\d{4}|\d{4}[\-\/]\d{2}[\-\/]\d{2})/i', $text, $m)) {
            $date = trim($m[1]);
            try {
                return date('Y-m-d', strtotime($date)) ?: '';
            } catch (\Throwable) {
                return '';
            }
        }
        return '';
    }

    private function extractNationality(string $text): string
    {
        if (preg_match('/(?:nationality|citizenship)[:\s]+([A-Za-z]+)/i', $text, $m)) {
            return trim($m[1]);
        }
        if (stripos($text, 'Filipino') !== false) return 'Filipino';
        return '';
    }

    private function extractCivilStatus(string $text): string
    {
        $statuses = ['single', 'married', 'divorced', 'widowed', 'separated', 'annulled'];
        if (preg_match('/(?:civil status|marital status)[:\s]+(single|married|divorced|widowed|separated|annulled)/i', $text, $m)) {
            return ucfirst(strtolower($m[1]));
        }
        foreach ($statuses as $status) {
            if (preg_match('/^\s*' . $status . '\s*$/im', $text)) {
                return ucfirst($status);
            }
        }
        return '';
    }

    private function extractSkills(string $text): array
    {
        $skillsSection = $this->extractSection($text, ['SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'EXPERTISE', 'TECHNOLOGIES']);
        
        if (!empty($skillsSection)) {
            $items = preg_split('/[\n,•*·|-]+/', $skillsSection);
            $skills = array_filter(array_map('trim', $items), function($s) {
                return strlen($s) > 1 && strlen($s) < 40; 
            });
            
            if (!empty($skills)) {
                return array_values(array_unique($skills));
            }
        }

        $keywords = [
            'PHP', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Ruby',
            'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Laravel', 'Django', 'Spring',
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQL', 'Docker', 'Kubernetes',
            'AWS', 'Azure', 'GCP', 'Git', 'Linux', 'HTML', 'CSS', 'REST', 'GraphQL',
            'Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'SAP', 'Salesforce',
            'Project Management', 'Leadership', 'Communication', 'Teamwork',
            'Data Analysis', 'Marketing', 'Sales', 'Customer Service', 'Accounting',
            'AutoCAD', 'Photoshop', 'Illustrator', 'Figma', 'Canva',
        ];

        $found = [];
        foreach ($keywords as $skill) {
            if (preg_match('/\b' . preg_quote($skill, '/') . '\b/i', $text)) {
                $found[] = $skill;
            }
        }
        return array_values(array_unique($found));
    }

    private function extractSection(string $text, array $headers): string
    {
        foreach ($headers as $header) {
            // Find where the header occurs case-insensitively anywhere in the text
            $pos = stripos($text, $header);
            if ($pos !== false) {
                // Slice from the header onward
                $sub = substr($text, $pos + strlen($header));
                
                // Cut off at the next major heading boundary
                $nextHeaders = ['EDUCATION', 'EDUCATIONAL BACKGROUND', 'EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT HISTORY', 'SKILLS', 'REFERENCES', 'CERTIFICATES', 'PROJECTS', 'SUMMARY', 'OBJECTIVE'];
                $minPos = strlen($sub);
                
                foreach ($nextHeaders as $next) {
                    $nPos = stripos($sub, $next);
                    if ($nPos !== false && $nPos > 5 && $nPos < $minPos) {
                        $minPos = $nPos;
                    }
                }
                
                return trim(substr($sub, 0, $minPos));
            }
        }

        return '';
    }
}