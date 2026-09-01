<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Mail\InterviewInvitationMail;
use App\Models\Applicant;
use App\Models\Department;
use App\Models\Interview;
use App\Models\JobLibrary;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

echo "=================================================================\n";
echo "ARTMS INTERVIEW EMAIL INVITATION & DISPATCH TEST\n";
echo "=================================================================\n\n";

$passCount = 0;
$totalTests = 0;

function assertTest($condition, $message) {
    global $passCount, $totalTests;
    $totalTests++;
    if ($condition) {
        $passCount++;
        echo "  [PASS] {$message}\n";
    } else {
        echo "  [FAIL] {$message}\n";
    }
}

// 1. Authenticate as HR Admin
$hr = User::where('email', 'hradmin@artms.com')->first();
Auth::login($hr);

// 2. Setup Department, Job, and Applicant
$dept = Department::firstOrCreate(
    ['department_name' => 'Engineering Mails'],
    ['name' => 'Engineering Mails', 'is_active' => true]
);

$jobLib = JobLibrary::firstOrCreate(
    ['job_title' => 'QA Email Engineer'],
    [
        'job_description' => 'Test email job.',
        'qualifications' => json_encode([['id' => 1, 'title' => 'Required', 'details' => [['id' => 2, 'value' => 'QA']]]]),
        'responsibilities' => json_encode([['id' => 1, 'title' => 'Core', 'details' => [['id' => 2, 'value' => 'Testing']]]]),
        'created_by' => $hr->id,
        'department_id' => $dept->id,
        'employment_type' => 'full_time',
        'salary_min' => 45000,
        'salary_max' => 65000,
        'salary_type' => 'range',
        'approval_status' => 'approved',
        'is_active' => true,
    ]
);

$jobPosting = JobPosting::firstOrCreate(
    ['department_id' => $dept->id, 'job_library_id' => $jobLib->id, 'status' => 'published'],
    [
        'vacancies_count' => 1,
        'requested_by' => $hr->id,
        'approved_by' => $hr->id,
        'approved_at' => now(),
        'approval_status' => 'approved',
        'is_published' => true,
    ]
);

$applicant = Applicant::create([
    'job_posting_id' => $jobPosting->id,
    'application_id' => 'APP-EMAIL-' . time(),
    'first_name' => 'Jane',
    'last_name' => 'Applicant',
    'email' => 'jane.applicant.test@example.com',
    'phone' => '09991234567',
    'stage' => 'applied',
    'status' => 'active',
]);

echo "--- 1. Testing Interview Creation with Email Dispatch ---\n";
Mail::fake();

$controller = app(\App\Http\Controllers\InterviewController::class);
$request = \Illuminate\Http\Request::create('/api/interviews', 'POST', [
    'applicant_id' => $applicant->id,
    'job_posting_id' => $jobPosting->id,
    'interview_stage' => 'technical_assessment',
    'interview_type' => 'online',
    'scheduled_at' => date('Y-m-d H:i:s', strtotime('+3 days 10:00:00')),
    'location' => null,
    'notes' => 'Please bring your portfolio and prepare for a live coding session.',
    'contact_email' => 'hr@artms.com',
    'contact_number' => '+639171234567',
    'notify_applicant' => true,
    'notify_interviewer' => true,
]);

$response = $controller->store($request);
$data = $response->getData(true);

assertTest($response->status() === 201, "Interview store endpoint returned HTTP 201");
$interviewId = $data['interview']['id'] ?? null;
assertTest($interviewId !== null, "Interview ID created: {$interviewId}");

$interview = Interview::findOrFail($interviewId);
assertTest($interview->invitation_sent === 1 || $interview->invitation_sent === true, "Interview invitation_sent marked true");
assertTest(!empty($interview->meeting_link), "Meeting link auto-generated: {$interview->meeting_link}");

echo "\n--- 2. Testing InterviewInvitationMail Rendering ---\n";
$mailable = new InterviewInvitationMail($applicant, $interview, 'Technical Assessment');
$renderedHtml = $mailable->render();

assertTest(str_contains($renderedHtml, 'Technical Assessment'), "Rendered email contains 'Technical Assessment' badge");
assertTest(str_contains($renderedHtml, 'Jane Applicant'), "Rendered email addresses candidate by name");
assertTest(str_contains($renderedHtml, $interview->meeting_link), "Rendered email contains meeting link CTA");
assertTest(str_contains($renderedHtml, 'Please bring your portfolio'), "Rendered email includes special preparation notes");

echo "\n--- 3. Testing Resend Invitation Endpoint ---\n";
$resendResponse = $controller->resendInvitation($interview);
assertTest($resendResponse->status() === 200, "Resend invitation endpoint returned HTTP 200");

// Cleanup
$interview->delete();
$applicant->delete();

echo "\n=================================================================\n";
echo "TEST RESULTS: {$passCount} / {$totalTests} PASSED\n";
echo "=================================================================\n";
