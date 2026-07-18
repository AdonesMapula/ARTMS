<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class ResumeParserService
{
    /**
     * Extract plain text from a stored resume file.
     * Supports: pdf, docx, doc, txt
     *
     * @param  string  $storagePath  Path relative to the 'local' disk (e.g. "resumes/APP-2024-00001/file.pdf")
     * @return string  Extracted plain text
     */
    public function extractText(string $storagePath): string
    {
        $absolutePath = Storage::disk('local')->path($storagePath);

        if (! file_exists($absolutePath)) {
            return '';
        }

        $ext = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

        return match ($ext) {
            'pdf'        => $this->parsePdf($absolutePath),
            'docx'       => $this->parseDocx($absolutePath),
            'doc'        => $this->parseDoc($absolutePath),
            'txt'        => file_get_contents($absolutePath) ?: '',
            default      => '',
        };
    }

    // ── PDF ──────────────────────────────────────────────────────────────────

    private function parsePdf(string $path): string
    {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($path);
            $text   = $pdf->getText();

            // Collapse excessive whitespace while preserving line breaks
            $text = preg_replace('/[ \t]+/', ' ', $text);
            $text = preg_replace('/\n{3,}/', "\n\n", $text);

            return trim($text);
        } catch (\Throwable $e) {
            return '';
        }
    }

    // ── DOCX ─────────────────────────────────────────────────────────────────

    private function parseDocx(string $path): string
    {
        try {
            $phpWord  = \PhpOffice\PhpWord\IOFactory::load($path);
            $lines    = [];

            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    $lines[] = $this->extractElementText($element);
                }
            }

            return trim(implode("\n", array_filter($lines)));
        } catch (\Throwable $e) {
            return '';
        }
    }

    // ── DOC (legacy binary) ──────────────────────────────────────────────────

    private function parseDoc(string $path): string
    {
        try {
            // Try phpWord first (it can handle some .doc files)
            $text = $this->parseDocx($path);
            if (! empty($text)) {
                return $text;
            }

            // Fallback: crude binary extraction (strips non-printable chars)
            $content = file_get_contents($path);
            $content = preg_replace('/[^\x20-\x7E\n\r\t]/', ' ', $content);
            $content = preg_replace('/\s{3,}/', "\n", $content);

            return trim($content);
        } catch (\Throwable $e) {
            return '';
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function extractElementText(mixed $element): string
    {
        $text = '';

        // TextRun / Paragraph
        if (method_exists($element, 'getElements')) {
            foreach ($element->getElements() as $child) {
                $text .= $this->extractElementText($child);
            }
        }

        // Plain text leaf
        if (method_exists($element, 'getText')) {
            $leaf = $element->getText();
            if (is_string($leaf)) {
                $text .= $leaf . ' ';
            }
        }

        // Table rows
        if ($element instanceof \PhpOffice\PhpWord\Element\Table) {
            foreach ($element->getRows() as $row) {
                foreach ($row->getCells() as $cell) {
                    foreach ($cell->getElements() as $cellEl) {
                        $text .= $this->extractElementText($cellEl) . ' ';
                    }
                }
                $text .= "\n";
            }
        }

        return $text;
    }
}
