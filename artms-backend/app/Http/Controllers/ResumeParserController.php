<?php

namespace App\Http\Controllers;

use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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

            Storage::disk('local')->delete($storedPath);

            if (empty(trim($rawText))) {
                Log::warning('Empty text extracted from resume');
                return response()->json([
                    'success' => true,
                    'data' => $this->emptyParsedData(),
                    'message' => 'Resume uploaded. Could not extract text from this file - please fill in the form manually.',
                ]);
            }

            // Clean PDF artifacts (e.g. A<>L<>E<>X or stray null markers from font kerning)
            $cleanedText = $this->cleanRawPdfText($rawText);
            Log::info('Cleaned raw text length', ['length' => strlen($cleanedText)]);

            // 1. AI-assisted extraction using xAI / Groq API
            $parsed = $this->parseResumeWithAI($cleanedText);

            // 2. Validate, Clean, & Apply Confidence Scores
            $finalData = $this->processAndValidateData($parsed, $cleanedText);

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
     * Clean PDF kerning artifacts (such as A<>L<>E<>X or stray null characters).
     */
    private function cleanRawPdfText(string $text): string
    {
        // Fix letter-by-letter <> tags from PDF parsers (e.g., A<>L<>E<>X -> ALEX)
        $text = preg_replace('/(?<=\w)<>(?=\w)/u', '', $text);
        // Replace remaining <> with spaces
        $text = str_replace('<>', ' ', $text);
        // Normalize bullet points and weird symbols
        $text = preg_replace('/[▪•\x{2022}\x{2023}\x{25E6}\x{2043}\x{2219}]/u', '- ', $text);
        // Clean null characters and control codes
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        // Normalize space sequences
        return preg_replace('/[ \t]+/', ' ', $text);
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
  "firstName": "string (Candidate's first name)",
  "lastName": "string (Candidate's last name)",
  "middleName": "string (Candidate's middle name, or empty if none)",
  "email": "string (valid email address)",
  "phone": "string (contact phone number)",
  "address": "string (city/location/address)",
  "gender": "string (Male, Female, Non-binary, or empty)",
  "dateOfBirth": "string (YYYY-MM-DD format if found, otherwise empty)",
  "nationality": "string (e.g. Filipino, American, etc.)",
  "civilStatus": "string (Single, Married, Divorced, Widowed, etc.)",
  "skills": ["string"],
  "education": "string (summary of degrees, institutions, and dates)",
  "experience": "string (summary of job titles, companies, and responsibilities)"
}

== RAW RESUME TEXT ==
{$inputText}
EOT;

        try {
            $isGroq = str_starts_with($apiKey, 'gsk_');
            $baseUri = $isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
            $modelsToTry = $isGroq
                ? ['llama-3.3-70b-versatile', 'llama-3.3-70b-specdec', 'llama-3.1-8b-instant', 'gemma2-9b-it']
                : ['grok-4.5', 'grok-3-mini', 'grok-2-latest', 'grok-beta'];

            foreach ($modelsToTry as $model) {
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
                    $aiText = preg_replace('/^```json\s*/i', '', trim($aiText));
                    $aiText = preg_replace('/```\s*$/', '', $aiText);

                    $extracted = json_decode(trim($aiText), true);
                    if (is_array($extracted)) {
                        return array_merge($this->emptyParsedData(), $extracted);
                    }
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

        // 1. Name Verification & Fallback
        $firstName = trim($validated['firstName'] ?? '');
        $lastName = trim($validated['lastName'] ?? '');
        if (empty($firstName) || empty($lastName)) {
            $fallbackName = $this->extractNameParts($rawText);
            if (empty($firstName)) $validated['firstName'] = $fallbackName['first'];
            if (empty($lastName)) $validated['lastName'] = $fallbackName['last'];
            if (empty($validated['middleName'])) $validated['middleName'] = $fallbackName['middle'];
        }

        foreach (['firstName', 'lastName'] as $field) {
            $val = trim($validated[$field] ?? '');
            $confidence[$field] = !empty($val) ? 0.95 : 0.0;
        }
        $confidence['middleName'] = empty($validated['middleName']) ? 0.0 : 0.7;

        // 2. Email Verification and Fallback
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

        // 3. Phone Verification and Fallback (International & Philippine support)
        $phoneRaw = trim($validated['phone'] ?? '');
        $phoneClean = preg_replace('/[^\d+]/', '', $phoneRaw);
        if (strlen($phoneClean) >= 7) {
            $validated['phone'] = $phoneRaw;
            $confidence['phone'] = 0.95;
        } else {
            $fallbackPhone = $this->extractPhone($rawText);
            if (!empty($fallbackPhone)) {
                $validated['phone'] = $fallbackPhone;
                $confidence['phone'] = 0.85;
            } else {
                $validated['phone'] = '';
                $confidence['phone'] = 0.0;
            }
        }

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
            $pos = stripos($text, $header);
            if ($pos !== false) {
                $sub = substr($text, $pos + strlen($header));
                
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