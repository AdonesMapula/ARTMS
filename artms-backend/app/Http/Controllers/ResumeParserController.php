<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ResumeParserController extends Controller
{
    /**
     * POST /api/public/parse-resume
     * Accepts image or PDF resume, extracts text using OCR, and returns structured data
     */
    public function parse(Request $request): JsonResponse
    {
        $request->validate([
            'resume' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'], // 10MB max
        ]);

        try {
            $file = $request->file('resume');
            $extension = $file->getClientOriginalExtension();
            
            // Store temporarily
            $path = $file->store('temp-resumes', 'local');
            $fullPath = storage_path('app/' . $path);

            // Extract text based on file type
            $extractedText = '';
            
            if (in_array($extension, ['jpg', 'jpeg', 'png'])) {
                // For images, we'll use a simple regex-based extraction
                // In production, integrate with Tesseract OCR or cloud OCR service
                $extractedText = $this->extractTextFromImage($fullPath);
            } elseif ($extension === 'pdf') {
                // For PDFs, we'll use a simple text extraction
                // In production, use libraries like Smalot\PdfParser or pdftotext
                $extractedText = $this->extractTextFromPdf($fullPath);
            }

            // Parse the extracted text into structured data
            $parsedData = $this->parseResumeText($extractedText);

            // Clean up temporary file
            Storage::disk('local')->delete($path);

            return response()->json([
                'success' => true,
                'data' => $parsedData,
                'raw_text' => $extractedText, // For debugging
            ]);

        } catch (\Exception $e) {
            Log::error('Resume parsing error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse resume. Please try again or enter details manually.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Extract text from image file
     * This is a placeholder - in production, integrate with Tesseract or cloud OCR
     */
    private function extractTextFromImage(string $path): string
    {
        // Check if Tesseract is available
        if ($this->isTesseractAvailable()) {
            try {
                // Using shell_exec to call tesseract directly
                $output = shell_exec("tesseract \"$path\" stdout 2>&1");
                if ($output) {
                    return trim($output);
                }
            } catch (\Exception $e) {
                Log::warning('Tesseract OCR failed: ' . $e->getMessage());
            }
        }

        // Fallback: Return empty string with note
        // In production, use cloud OCR services like:
        // - Google Cloud Vision API
        // - AWS Textract
        // - Azure Computer Vision
        return "OCR_NOT_AVAILABLE: Please install Tesseract OCR or integrate a cloud OCR service.";
    }

    /**
     * Extract text from PDF file
     */
    private function extractTextFromPdf(string $path): string
    {
        // Simple approach using pdftotext if available
        if ($this->isPdfToTextAvailable()) {
            try {
                $output = shell_exec("pdftotext \"$path\" - 2>&1");
                if ($output) {
                    return trim($output);
                }
            } catch (\Exception $e) {
                Log::warning('pdftotext failed: ' . $e->getMessage());
            }
        }

        // Fallback
        return "PDF_PARSING_NOT_AVAILABLE: Please install pdftotext or use a PHP PDF parser library.";
    }

    /**
     * Parse resume text into structured data using regex patterns
     */
    private function parseResumeText(string $text): array
    {
        $data = [
            'firstName' => '',
            'lastName' => '',
            'email' => '',
            'phone' => '',
            'location' => '',
            'skills' => [],
            'education' => '',
            'experience' => '',
        ];

        // Extract email
        if (preg_match('/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/', $text, $matches)) {
            $data['email'] = $matches[1];
        }

        // Extract phone (Philippine format and international)
        if (preg_match('/(\+?63|0)?[\s\-]?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}/', $text, $matches)) {
            $data['phone'] = preg_replace('/[\s\-]/', '', $matches[0]);
        } elseif (preg_match('/(\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/', $text, $matches)) {
            $data['phone'] = preg_replace('/[\s\-\(\)]/', '', $matches[0]);
        }

        // Extract name (usually at the top, before email)
        $lines = explode("\n", $text);
        $topLines = array_slice($lines, 0, 5);
        foreach ($topLines as $line) {
            $line = trim($line);
            // Look for a line with 2-4 words, likely a name
            if (preg_match('/^([A-Z][a-z]+)\s+([A-Z][a-z]+)(\s+[A-Z][a-z]+)?$/i', $line, $matches)) {
                $data['firstName'] = $matches[1] ?? '';
                $data['lastName'] = $matches[2] ?? '';
                if (isset($matches[3])) {
                    $data['lastName'] .= ' ' . trim($matches[3]);
                }
                break;
            }
        }

        // Extract location (look for city/province patterns)
        if (preg_match('/(Manila|Quezon City|Makati|Pasig|Cebu|Davao|Taguig|Parañaque|Caloocan|Las Piñas|Antipolo|Marikina|Muntinlupa|Pasay|Valenzuela|Malabon|Navotas|San Juan|Mandaluyong)[,\s]+(Philippines|Metro Manila|NCR)?/i', $text, $matches)) {
            $data['location'] = trim($matches[0]);
        }

        // Extract skills (common keywords)
        $skillKeywords = [
            'PHP', 'JavaScript', 'Python', 'Java', 'React', 'Vue', 'Angular', 'Node.js', 'Laravel',
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Git', 'Docker', 'AWS', 'Azure',
            'HTML', 'CSS', 'TypeScript', 'C++', 'C#', '.NET', 'Spring', 'Django',
            'Project Management', 'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
            'Microsoft Office', 'Excel', 'PowerPoint', 'Data Analysis', 'Marketing', 'Sales'
        ];

        foreach ($skillKeywords as $skill) {
            if (stripos($text, $skill) !== false) {
                $data['skills'][] = $skill;
            }
        }

        // Extract education section
        if (preg_match('/(?:EDUCATION|EDUCATIONAL BACKGROUND)(.*?)(?:EXPERIENCE|WORK HISTORY|SKILLS|$)/is', $text, $matches)) {
            $data['education'] = trim($matches[1]);
        }

        // Extract experience section
        if (preg_match('/(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT)(.*?)(?:EDUCATION|SKILLS|REFERENCES|$)/is', $text, $matches)) {
            $data['experience'] = trim($matches[1]);
        }

        return $data;
    }

    /**
     * Check if Tesseract OCR is available
     */
    private function isTesseractAvailable(): bool
    {
        $output = shell_exec('tesseract --version 2>&1');
        return $output && stripos($output, 'tesseract') !== false;
    }

    /**
     * Check if pdftotext is available
     */
    private function isPdfToTextAvailable(): bool
    {
        $output = shell_exec('pdftotext -v 2>&1');
        return $output && (stripos($output, 'pdftotext') !== false || stripos($output, 'version') !== false);
    }
}
