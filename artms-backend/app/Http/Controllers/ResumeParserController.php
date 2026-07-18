<?php

namespace App\Http\Controllers;

use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ResumeParserController extends Controller
{
    /**
     * POST /api/public/parse-resume
     * Accepts PDF, DOCX, DOC, or TXT resume, extracts text, returns structured data.
     */
    public function parse(Request $request): JsonResponse
    {
        $request->validate([
            'resume' => ['required', 'file', 'mimes:pdf,doc,docx,txt', 'max:10240'],
        ]);

        try {
            $file      = $request->file('resume');
            $appId     = 'parse-' . uniqid();
            $storedPath = $file->store("temp-resumes/{$appId}", 'local');

            // Use the shared ResumeParserService (smalot/pdfparser + phpoffice/phpword)
            $parser      = new ResumeParserService();
            $rawText     = $parser->extractText($storedPath);

            // Clean up temp file
            Storage::disk('local')->delete($storedPath);

            if (empty(trim($rawText))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not extract text from this file. Please fill in the form manually.',
                ], 422);
            }

            $parsed = $this->parseResumeText($rawText);

            return response()->json([
                'success'  => true,
                'data'     => $parsed,
                'raw_text' => $rawText,   // kept for debugging; remove in production
            ]);

        } catch (\Throwable $e) {
            Log::error('Resume parsing error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse resume. Please fill in the form manually.',
            ], 500);
        }
    }

    // ── Text → structured data ────────────────────────────────────────────────

    private function parseResumeText(string $text): array
    {
        return [
            'firstName'  => $this->extractFirstName($text),
            'lastName'   => $this->extractLastName($text),
            'middleName' => $this->extractMiddleName($text),
            'email'      => $this->extractEmail($text),
            'phone'      => $this->extractPhone($text),
            'address'    => $this->extractAddress($text),
            'gender'     => $this->extractGender($text),
            'dateOfBirth'=> $this->extractDateOfBirth($text),
            'nationality'=> $this->extractNationality($text),
            'civilStatus'=> $this->extractCivilStatus($text),
            'skills'     => $this->extractSkills($text),
            'education'  => $this->extractSection($text, ['EDUCATION', 'EDUCATIONAL BACKGROUND', 'ACADEMIC BACKGROUND']),
            'experience' => $this->extractSection($text, ['EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT HISTORY', 'WORK EXPERIENCE']),
        ];
    }

    // ── Field extractors ──────────────────────────────────────────────────────

    private function extractEmail(string $text): string
    {
        if (preg_match('/[\w.+\-]+@[\w\-]+\.[\w.\-]+/', $text, $m)) {
            return strtolower(trim($m[0]));
        }
        return '';
    }

    private function extractPhone(string $text): string
    {
        // Philippine mobile: 09xxxxxxxxx or +639xxxxxxxxx
        if (preg_match('/(?:\+?63|0)[\s\-]?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}/', $text, $m)) {
            return preg_replace('/[\s\-]/', '', $m[0]);
        }
        // Generic international
        if (preg_match('/\+?\d[\d\s\-().]{8,}\d/', $text, $m)) {
            return preg_replace('/[\s\-().]+/', '', $m[0]);
        }
        return '';
    }

    private function extractFirstName(string $text): string
    {
        return $this->extractNamePart($text, 'first');
    }

    private function extractLastName(string $text): string
    {
        return $this->extractNamePart($text, 'last');
    }

    private function extractMiddleName(string $text): string
    {
        return $this->extractNamePart($text, 'middle');
    }

    /**
     * Tries to find the full name from the first non-empty lines of the resume.
     * Handles:
     *  - Title-case:  "Maria Cruz Santos"
     *  - ALL-CAPS:    "MARIA CRUZ SANTOS"
     *  - Particles:   "Juan dela Cruz", "Maria de los Santos"
     * Returns a specific part: first | last | middle.
     */
    private function extractNamePart(string $text, string $part): string
    {
        $lines = array_filter(
            array_map('trim', explode("\n", $text)),
            fn($l) => strlen($l) > 1
        );
        $lines = array_values($lines);

        // Skip lines that are clearly not names
        $skip = ['resume', 'curriculum vitae', 'cv', 'objective', 'summary', 'profile',
                  'contact', 'address', 'email', 'phone', 'mobile', 'http', '@', 'www',
                  'date', 'birth', 'gender', 'civil', 'nationality', 'skills', 'education',
                  'experience', 'references', 'page'];

        foreach (array_slice($lines, 0, 10) as $line) {
            $lower = strtolower($line);
            $isSkip = false;
            foreach ($skip as $s) {
                if (str_contains($lower, $s)) { $isSkip = true; break; }
            }
            if ($isSkip) continue;

            // Normalize ALL-CAPS line to Title Case for matching
            $normalized = preg_match('/^[A-Z\s]+$/', $line)
                ? mb_convert_case($line, MB_CASE_TITLE, 'UTF-8')
                : $line;

            // Allow particles: de, dela, del, van, von, los, las, ng, etc.
            $word     = '[A-ZÑa-záéíóúàèìòùñüÑ][a-záéíóúàèìòùñüÑ\']+\.?';
            $particle = '(?:de|dela|del|de los|de las|van|von|ng|ni|mga|jr\.?|sr\.?|ii|iii)';
            $nameRx   = "/^((?:{$particle}\s+)?{$word})(?:\s+((?:{$particle}\s+)?{$word}))?(?:\s+((?:{$particle}\s+)?{$word}))?(?:\s+((?:{$particle}\s+)?{$word}))?$/ui";

            if (preg_match($nameRx, $normalized, $m)) {
                // Collect non-empty capture groups
                $parts = array_values(array_filter(array_slice($m, 1), fn($p) => trim($p) !== ''));

                if (count($parts) >= 2) {
                    return match ($part) {
                        'first'  => trim($parts[0]),
                        'last'   => trim($parts[count($parts) - 1]),
                        'middle' => count($parts) === 3 ? trim($parts[1]) : '',
                        default  => '',
                    };
                }
            }
        }

        return '';
    }

    private function extractAddress(string $text): string
    {
        // Look for explicit address label
        if (preg_match('/(?:address|home address|location)[:\s]+([^\n]{5,80})/i', $text, $m)) {
            return trim($m[1]);
        }

        // Philippine city names
        $cities = ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Cebu City', 'Davao', 'Taguig',
                   'Parañaque', 'Caloocan', 'Las Piñas', 'Antipolo', 'Marikina', 'Muntinlupa',
                   'Pasay', 'Valenzuela', 'Malabon', 'Navotas', 'San Juan', 'Mandaluyong',
                   'Lapu-Lapu', 'Mandaue', 'Zamboanga', 'Cagayan de Oro', 'Iloilo', 'Bacolod'];

        foreach ($cities as $city) {
            if (stripos($text, $city) !== false) {
                // Grab the line containing the city name
                foreach (explode("\n", $text) as $line) {
                    if (stripos($line, $city) !== false) {
                        return trim($line);
                    }
                }
            }
        }

        return '';
    }

    private function extractGender(string $text): string
    {
        if (preg_match('/(?:gender|sex)[:\s]+(male|female|non.binary|prefer not to say)/i', $text, $m)) {
            return ucfirst(strtolower($m[1]));
        }
        // Standalone word on its own line
        if (preg_match('/^\s*(Male|Female)\s*$/im', $text, $m)) {
            return ucfirst(strtolower(trim($m[1])));
        }
        return '';
    }

    private function extractDateOfBirth(string $text): string
    {
        // Label-based
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
        // Standalone word on its own line
        foreach ($statuses as $status) {
            if (preg_match('/^\s*' . $status . '\s*$/im', $text)) {
                return ucfirst($status);
            }
        }
        return '';
    }

    private function extractSkills(string $text): array
    {
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
        return $found;
    }

    private function extractSection(string $text, array $headers): string
    {
        $pattern = implode('|', array_map('preg_quote', $headers));
        $nextHeaders = 'EDUCATION|EXPERIENCE|WORK HISTORY|SKILLS|REFERENCES|CERTIFICATES|ACHIEVEMENTS|AWARDS|OBJECTIVE|SUMMARY|CONTACT|PERSONAL';

        if (preg_match('/(?:' . $pattern . ')[\s:]*\n(.*?)(?=(?:' . $nextHeaders . ')[\s:]|\Z)/is', $text, $m)) {
            return trim($m[1]);
        }
        return '';
    }
}
