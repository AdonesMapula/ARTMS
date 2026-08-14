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
    public function extractText(string $storagePath, ?string $explicitExt = null): string
    {
        $absolutePath = Storage::disk('local')->path($storagePath);

        if (! file_exists($absolutePath)) {
            return '';
        }

        $ext = $explicitExt ? strtolower(ltrim($explicitExt, '.')) : strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

        // If ext is bin or empty, auto-detect from magic bytes
        if (empty($ext) || $ext === 'bin') {
            $handle = @fopen($absolutePath, 'rb');
            if ($handle) {
                $bytes = fread($handle, 8);
                fclose($handle);
                if (str_starts_with($bytes, '%PDF')) {
                    $ext = 'pdf';
                } elseif (str_starts_with($bytes, "PK\x03\x04")) {
                    $ext = 'docx';
                } elseif (str_starts_with($bytes, "\xD0\xCF\x11\xE0")) {
                    $ext = 'doc';
                }
            }
        }

        return match ($ext) {
            'pdf'        => $this->parsePdf($absolutePath),
            'docx'       => $this->parseDocx($absolutePath),
            'doc'        => $this->parseDoc($absolutePath),
            'txt'        => file_get_contents($absolutePath) ?: '',
            default      => $this->parseDocx($absolutePath) ?: (file_get_contents($absolutePath) ?: ''),
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
            \Log::error("PDF Parser Error", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return '';
        }
    }

    // ── DOCX ─────────────────────────────────────────────────────────────────

    // ── DOCX ─────────────────────────────────────────────────────────────────

    private function parseDocx(string $path): string
    {
        // 1. Try ZipArchive if extension is loaded
        if (class_exists(\ZipArchive::class)) {
            try {
                $zip = new \ZipArchive();
                if ($zip->open($path) === true) {
                    if (($xmlIndex = $zip->locateName('word/document.xml')) !== false) {
                        $xml = $zip->getFromIndex($xmlIndex);
                        $zip->close();
                        if ($xml) {
                            return $this->cleanDocxXml($xml);
                        }
                    }
                    $zip->close();
                }
            } catch (\Throwable $e) {
                \Log::warning("ZipArchive DOCX load error: " . $e->getMessage());
            }
        }

        // 2. Pure PHP fallback: direct PKZIP header parsing + gzinflate (No extension needed)
        $content = @file_get_contents($path);
        if ($content) {
            $extractedXml = $this->extractZipEntryPurePhp($content, 'word/document.xml');
            if ($extractedXml) {
                return $this->cleanDocxXml($extractedXml);
            }
        }

        // 3. Try PhpWord IOFactory
        try {
            if (class_exists(\PhpOffice\PhpWord\IOFactory::class)) {
                $phpWord = \PhpOffice\PhpWord\IOFactory::load($path);
                $lines = [];
                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        $lines[] = $this->extractElementText($element);
                    }
                }
                $result = trim(implode("\n", array_filter($lines)));
                if (!empty($result)) {
                    return $result;
                }
            }
        } catch (\Throwable $e) {
            \Log::warning("PhpWord fallback failed: " . $e->getMessage());
        }

        // 4. Raw text fallback from binary
        if ($content) {
            $text = preg_replace('/[^\x20-\x7E\n\r\t]/', ' ', $content);
            $text = preg_replace('/\s{2,}/', ' ', $text);
            return trim($text);
        }

        return '';
    }

    /**
     * Extract a specific entry from a ZIP/DOCX binary string in pure PHP without ZipArchive.
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
                if ($compressionMethod === 8) { // DEFLATE
                    $uncompressed = @gzinflate($compressedData);
                    if ($uncompressed !== false) {
                        return $uncompressed;
                    }
                } elseif ($compressionMethod === 0) { // STORED (uncompressed)
                    return $compressedData;
                }
            }

            // Find next local file header
            $pos = strpos($binary, "PK\x03\x04", $pos + 4);
        }

        return null;
    }

    /**
     * Clean and strip XML tags from word/document.xml to produce clean formatted text.
     */
    private function cleanDocxXml(string $xml): string
    {
        // Replace paragraph and row endings with newlines
        $xml = str_replace(['</w:p>', '</w:tr>'], "\n", $xml);
        // Replace tabs and line breaks
        $xml = str_replace(['<w:tab/>', '<w:tab />'], "\t", $xml);
        $xml = str_replace(['<w:br/>', '<w:br />', '<w:cr/>'], "\n", $xml);
        // Strip remaining XML tags
        $text = strip_tags($xml);
        // Decode XML entities
        $text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
        // Normalize whitespace and multiple consecutive blank lines
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
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
            \Log::error("DOC Parser Error", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

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
