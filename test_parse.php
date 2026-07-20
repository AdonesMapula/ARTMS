<?php
// End-to-end test: parse + submit
$base = 'http://localhost:8000/api';

// ── 1. Parse a TXT resume ────────────────────────────────────────────────────
$txt = tempnam(sys_get_temp_dir(), 'resume_') . '.txt';
file_put_contents($txt, implode("\n", [
    "Maria Cruz Santos",
    "maria.santos@gmail.com",
    "+639171234567",
    "Date of Birth: March 10, 1995",
    "Gender: Female",
    "Civil Status: Single",
    "Nationality: Filipino",
    "Address: Cebu City, Philippines",
    "",
    "EDUCATION",
    "Bachelor of Science in Business Administration",
    "University of San Carlos, 2017",
    "",
    "WORK EXPERIENCE",
    "HR Assistant, ABC Corp, 2017–2022",
    "",
    "SKILLS",
    "Microsoft Office, Communication, Leadership, Teamwork",
]));

$ch = curl_init("$base/public/parse-resume");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['resume' => new CURLFile($txt, 'text/plain', 'resume.txt')]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
$raw  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
@curl_close($ch);
unlink($txt);

echo "=== PARSE (HTTP $code) ===\n";
$parsed = json_decode($raw, true);
echo json_encode($parsed['data'] ?? $parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

// ── 2. Submit a real application ─────────────────────────────────────────────
// Get first published job
$jobs = json_decode(file_get_contents("$base/public/job-postings"), true);
$jobId = $jobs['data'][0]['id'] ?? null;

if (!$jobId) { echo "No jobs found – seed first.\n"; exit; }

$txt2 = tempnam(sys_get_temp_dir(), 'resume2_') . '.txt';
file_put_contents($txt2, "Maria Cruz Santos\nmaria.santos@gmail.com\n09171234567");

$ch2 = curl_init("$base/public/applicants");
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, [
    'job_posting_id'   => $jobId,
    'first_name'       => 'Maria',
    'last_name'        => 'Santos',
    'middle_name'      => 'Cruz',
    'email'            => 'maria.test.' . time() . '@gmail.com',
    'phone'            => '09171234567',
    'date_of_birth'    => '1995-03-10',
    'gender'           => 'Female',
    'civil_status'     => 'Single',
    'nationality'      => 'Filipino',
    'address'          => 'Cebu City, Philippines',
    'resume'           => new CURLFile($txt2, 'text/plain', 'resume.txt'),
    'informed_consent' => '1',
]);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Accept: application/json']);
$raw2  = curl_exec($ch2);
$code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
@curl_close($ch2);
unlink($txt2);

echo "=== SUBMIT (HTTP $code2) ===\n";
echo json_encode(json_decode($raw2, true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
