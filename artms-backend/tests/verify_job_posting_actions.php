<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Department;
use App\Models\JobLibrary;
use App\Models\JobPosting;
use App\Models\ManpowerRequest;
use App\Models\Applicant;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

echo "=================================================================\n";
echo "ARTMS JOB POSTING ACTIONS & DELETION COMPREHENSIVE TEST\n";
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

// 2. Setup Department and Job Library Position
$dept = Department::firstOrCreate(
    ['department_name' => 'Engineering Tests'],
    ['name' => 'Engineering Tests', 'is_active' => true]
);

$jobLib = JobLibrary::firstOrCreate(
    ['job_title' => 'QA Automation Lead'],
    [
        'job_description' => 'Test lead for QA automation suites.',
        'qualifications' => json_encode([['id' => 1, 'title' => 'Required', 'details' => [['id' => 2, 'value' => 'QA experience']]]]),
        'responsibilities' => json_encode([['id' => 1, 'title' => 'Core', 'details' => [['id' => 2, 'value' => 'Automation']]]]),
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

echo "--- 1. Testing PRF Creation & Job Posting Creation ---\n";
$prf = ManpowerRequest::create([
    'position_needed' => 'QA Automation Lead',
    'job_library_id' => $jobLib->id,
    'department_id' => $dept->id,
    'requested_by' => $hr->id,
    'approved_by' => $hr->id,
    'approved_at' => now(),
    'headcount' => 2,
    'urgency' => 'high',
    'status' => 'approved',
]);

$controller = app(\App\Http\Controllers\JobPostingController::class);

$request = \Illuminate\Http\Request::create('/api/job-postings', 'POST', [
    'job_library_id' => $jobLib->id,
    'department_id' => $dept->id,
    'manpower_request_id' => $prf->id,
    'vacancies_count' => 2,
    'location' => 'Cebu City, Philippines',
    'closing_date' => date('Y-m-d', strtotime('+30 days')),
    'description' => 'Test posting description',
    'qualifications' => [['id' => 1, 'title' => 'General', 'details' => [['id' => 10, 'value' => '5+ years experience']]]],
    'responsibilities' => [['id' => 2, 'title' => 'Core', 'details' => [['id' => 20, 'value' => 'Automate test suites']]]],
]);

$response = $controller->store($request);
$data = $response->getData(true);

assertTest($response->status() === 201 || $response->status() === 200, "Job posting store returned HTTP 201/200");
$postingId = $data['posting']['id'] ?? null;
assertTest($postingId !== null, "Job posting ID created: {$postingId}");

$prf->refresh();
assertTest($prf->job_posting_id == $postingId, "PRF job_posting_id linked to Job Posting {$postingId}");

echo "\n--- 2. Testing Job Posting Update & Status Change ---\n";
$updateRequest = \Illuminate\Http\Request::create("/api/job-postings/{$postingId}", 'PUT', [
    'vacancies_count' => 4,
    'status' => 'closed',
    'location' => 'Remote, Philippines',
]);
$updateResponse = $controller->update($updateRequest, JobPosting::findOrFail($postingId));
$updateData = $updateResponse->getData(true);

assertTest($updateResponse->status() === 200, "Job posting update returned HTTP 200");
assertTest($updateData['posting']['vacancies_count'] === 4, "Updated vacancies_count is 4");
assertTest($updateData['posting']['status'] === 'closed', "Updated status is closed");
assertTest($updateData['posting']['is_published'] === false, "is_published automatically set to false on closed status");

echo "\n--- 3. Testing Single Deletion & PRF Unlinking ---\n";
$deleteResponse = $controller->destroy(JobPosting::findOrFail($postingId));
assertTest($deleteResponse->status() === 200, "Job posting single delete returned HTTP 200");
assertTest(JobPosting::find($postingId) === null, "Job posting is deleted from active listings");

$prf->refresh();
assertTest($prf->job_posting_id === null, "Manpower request was unlinked (job_posting_id is null)");

echo "\n--- 4. Testing Deletion Prevention When Applicants Exist ---\n";
// Create another job posting with an applicant
$postingWithApp = JobPosting::create([
    'job_library_id' => $jobLib->id,
    'department_id' => $dept->id,
    'requested_by' => $hr->id,
    'approved_by' => $hr->id,
    'approved_at' => now(),
    'approval_status' => 'approved',
    'status' => 'published',
    'is_published' => true,
    'vacancies_count' => 1,
]);

$applicant = Applicant::create([
    'job_posting_id' => $postingWithApp->id,
    'application_id' => 'APP-TEST-' . time(),
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john.doe.test' . time() . '@example.com',
    'phone' => '09123456789',
    'stage' => 'applied',
    'status' => 'active',
]);

$delBlockedResponse = $controller->destroy(JobPosting::findOrFail($postingWithApp->id));
assertTest($delBlockedResponse->status() === 409, "Deletion blocked with HTTP 409 Conflict when applicants exist");
assertTest(JobPosting::find($postingWithApp->id) !== null, "Posting with active applicant was not deleted");

echo "\n--- 5. Testing Bulk Deletion & Applicant Protection ---\n";
// Create 2 more clean postings
$cleanPosting1 = JobPosting::create([
    'job_library_id' => $jobLib->id,
    'department_id' => $dept->id,
    'requested_by' => $hr->id,
    'approval_status' => 'approved',
    'status' => 'published',
    'is_published' => true,
    'vacancies_count' => 1,
]);

$cleanPosting2 = JobPosting::create([
    'job_library_id' => $jobLib->id,
    'department_id' => $dept->id,
    'requested_by' => $hr->id,
    'approval_status' => 'approved',
    'status' => 'published',
    'is_published' => true,
    'vacancies_count' => 1,
]);

$bulkIds = [$cleanPosting1->id, $cleanPosting2->id, $postingWithApp->id];
$bulkRequest = \Illuminate\Http\Request::create('/api/job-postings/bulk-delete', 'POST', [
    'ids' => $bulkIds,
]);
$bulkResponse = $controller->bulkDelete($bulkRequest);
$bulkData = $bulkResponse->getData(true);

assertTest($bulkResponse->status() === 200, "Bulk delete returned HTTP 200");
assertTest($bulkData['count'] === 2, "2 clean postings deleted in bulk");
assertTest($bulkData['skipped'] === 1, "1 posting with applicants skipped safely");
assertTest(JobPosting::find($cleanPosting1->id) === null, "Clean posting 1 deleted");
assertTest(JobPosting::find($cleanPosting2->id) === null, "Clean posting 2 deleted");
assertTest(JobPosting::find($postingWithApp->id) !== null, "Posting with applicant remains intact");

// Cleanup test applicant & posting
$applicant->delete();
$postingWithApp->delete();
$prf->delete();

echo "\n=================================================================\n";
echo "TEST RESULTS: {$passCount} / {$totalTests} PASSED\n";
echo "=================================================================\n";
