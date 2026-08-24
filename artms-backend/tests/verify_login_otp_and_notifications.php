<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AuditLog;
use App\Models\AuthenticationOtp;
use App\Models\Department;
use App\Models\ManpowerRequest;
use App\Models\User;
use App\Services\NotificationRecipientResolver;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

// Fake Mail to capture sent emails during testing
Mail::fake();

echo "====================================================\n";
echo "ARTMS LOGIN OTP & TARGETED NOTIFICATIONS TEST SUITE\n";
echo "====================================================\n\n";

$passCount = 0;
$failCount = 0;

function assertCondition($description, $condition) {
    global $passCount, $failCount;
    if ($condition) {
        echo "[PASS] " . $description . "\n";
        $passCount++;
    } else {
        echo "[FAIL] " . $description . "\n";
        $failCount++;
    }
}

// ── SETUP TEST USERS ─────────────────────────────────────────────────────────
echo "--- 1. Setting up test users ---\n";

$superAdmin = User::updateOrCreate(
    ['email' => 'test_superadmin@artms.test'],
    [
        'name' => 'Test Super Admin',
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'role' => 'super_admin',
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]
);

$deptHeadA = User::updateOrCreate(
    ['email' => 'test_depthead_a@artms.test'],
    [
        'name' => 'Test Dept Head A',
        'first_name' => 'Dept',
        'last_name' => 'Head A',
        'role' => 'department_head',
        'department_id' => 1,
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]
);

$deptHeadB = User::updateOrCreate(
    ['email' => 'test_depthead_b@artms.test'],
    [
        'name' => 'Test Dept Head B',
        'first_name' => 'Dept',
        'last_name' => 'Head B',
        'role' => 'department_head',
        'department_id' => 2,
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]
);

$hrAdmin = User::updateOrCreate(
    ['email' => 'test_hr_admin@artms.test'],
    [
        'name' => 'Test HR Admin',
        'first_name' => 'HR',
        'last_name' => 'Admin',
        'role' => 'hr_admin',
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]
);

$coo = User::updateOrCreate(
    ['email' => 'test_coo@artms.test'],
    [
        'name' => 'Test COO',
        'first_name' => 'Chief',
        'last_name' => 'Operating Officer',
        'role' => 'coo',
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]
);

$employee = User::updateOrCreate(
    ['email' => 'test_employee@artms.test'],
    [
        'name' => 'Test Employee',
        'first_name' => 'Normal',
        'last_name' => 'Employee',
        'role' => 'employee',
        'password' => Hash::make('Password123!'),
        'is_active' => true,
    ]
);

assertCondition("Test users verified in database", $superAdmin->id && $deptHeadA->id && $coo->id && $hrAdmin->id);

// ── TEST 1: SUPER ADMIN DIRECT LOGIN (NO OTP) ──────────────────────────────
echo "\n--- 2. Testing Super Admin Direct Login ---\n";
$authController = app(\App\Http\Controllers\AuthController::class);

$loginReq = new \App\Http\Requests\Auth\LoginRequest([
    'email' => 'test_superadmin@artms.test',
    'password' => 'Password123!',
]);

$response = $authController->login($loginReq);
$data = $response->getData(true);

assertCondition("Super Admin login returns 200 OK", $response->getStatusCode() === 200);
assertCondition("Super Admin requires_otp is FALSE", isset($data['requires_otp']) && $data['requires_otp'] === false);
assertCondition("Super Admin receives Sanctum token immediately", !empty($data['token']));
assertCondition("Super Admin user object returned", $data['user']['email'] === 'test_superadmin@artms.test');

// ── TEST 2: NON-SUPER-ADMIN LOGIN (REQUIRES OTP) ────────────────────────────
echo "\n--- 3. Testing Non-Super-Admin OTP Login (Dept Head) ---\n";
$loginReqDept = new \App\Http\Requests\Auth\LoginRequest([
    'email' => 'test_depthead_a@artms.test',
    'password' => 'Password123!',
]);

$responseDept = $authController->login($loginReqDept);
$dataDept = $responseDept->getData(true);

assertCondition("Dept Head login returns 200 OK", $responseDept->getStatusCode() === 200);
assertCondition("Dept Head requires_otp is TRUE", isset($dataDept['requires_otp']) && $dataDept['requires_otp'] === true);
assertCondition("Dept Head does NOT receive Sanctum token yet", empty($dataDept['token']));
assertCondition("Dept Head receives verification_id UUID", !empty($dataDept['verification_id']));
assertCondition("Dept Head receives masked email_hint", !empty($dataDept['email_hint']));

$verificationId = $dataDept['verification_id'];
$otpRecord = AuthenticationOtp::where('verification_id', $verificationId)->first();
assertCondition("AuthenticationOtp record created in DB", $otpRecord !== null);
assertCondition("OTP is 6 digits", strlen($otpRecord->otp_code) === 6);
assertCondition("OTP purpose is login_verification", $otpRecord->purpose === 'login_verification');

// ── TEST 3: INVALID OTP VERIFICATION ────────────────────────────────────────
echo "\n--- 4. Testing Invalid OTP Verification ---\n";
$verifyReqBad = new Request([
    'verification_id' => $verificationId,
    'otp' => '000000', // incorrect OTP
]);

$badResponse = $authController->verifyLoginOtp($verifyReqBad);
assertCondition("Invalid OTP returns 422 Unprocessable", $badResponse->getStatusCode() === 422);

$otpRecord->refresh();
assertCondition("Attempts incremented on bad OTP", $otpRecord->attempts === 1);

// ── TEST 4: VALID OTP VERIFICATION ──────────────────────────────────────────
echo "\n--- 5. Testing Valid OTP Verification ---\n";
$verifyReqGood = new Request([
    'verification_id' => $verificationId,
    'otp' => $otpRecord->otp_code,
]);

$goodResponse = $authController->verifyLoginOtp($verifyReqGood);
$goodData = $goodResponse->getData(true);

assertCondition("Valid OTP returns 200 OK", $goodResponse->getStatusCode() === 200);
assertCondition("Sanctum token issued upon valid OTP", !empty($goodData['token']));
assertCondition("Authenticated user payload returned", $goodData['user']['email'] === 'test_depthead_a@artms.test');

$otpRecord->refresh();
assertCondition("OTP record marked as used", $otpRecord->used_at !== null);

// ── TEST 5: PREVENT OTP REUSE (REPLAY PROTECTION) ───────────────────────────
echo "\n--- 6. Testing OTP Replay Prevention ---\n";
$replayResponse = $authController->verifyLoginOtp($verifyReqGood);
assertCondition("Reused OTP is rejected with 422", $replayResponse->getStatusCode() === 422);

// ── TEST 6: RESEND OTP & COOLDOWN ───────────────────────────────────────────
echo "\n--- 7. Testing Resend OTP & Cooldown ---\n";
// Create a new login session for testing resend
$loginReqHR = new \App\Http\Requests\Auth\LoginRequest([
    'email' => 'test_hr_admin@artms.test',
    'password' => 'Password123!',
]);
$resHR = $authController->login($loginReqHR);
$dataHR = $resHR->getData(true);
$vIdHR = $dataHR['verification_id'];

// Immediate resend should be blocked by 60s cooldown
$resendReq = new Request(['verification_id' => $vIdHR]);
$cooldownRes = $authController->resendLoginOtp($resendReq);
assertCondition("Immediate resend blocked with 429 Too Many Requests (cooldown)", $cooldownRes->getStatusCode() === 429);

// Manually bypass cooldown in test by setting resend_available_at in the past
$otpHR = AuthenticationOtp::where('verification_id', $vIdHR)->first();
$otpHR->update(['resend_available_at' => now()->subMinute()]);

$validResendRes = $authController->resendLoginOtp($resendReq);
$validResendData = $validResendRes->getData(true);
assertCondition("Resend OTP succeeds after cooldown", $validResendRes->getStatusCode() === 200);
assertCondition("New verification_id issued on resend", !empty($validResendData['verification_id']));

$oldOtpHR = AuthenticationOtp::where('verification_id', $vIdHR)->first();
assertCondition("Old OTP invalidated upon resend", $oldOtpHR->used_at !== null);

// ── TEST 7: TARGETED NOTIFICATION ISOLATION (MDR / PRF WORKFLOW) ────────────
echo "\n--- 8. Testing Targeted Notification Isolation (MDR Workflow) ---\n";

// Clear notifications for clean assertions
DB::table('notifications')->delete();

$testPrf = ManpowerRequest::create([
    'department_id' => 1,
    'requested_by' => $deptHeadA->id,
    'position_needed' => 'Lead AI Engineer',
    'headcount' => 2,
    'urgency' => 'high',
    'status' => 'pending',
]);

// 1. Manpower Request Created event
$createRecipients = NotificationRecipientResolver::resolve('manpower_request.created', $testPrf, $deptHeadA);
NotificationService::notifyRecipients(
    $createRecipients,
    'New PRF Request Pending Approval',
    "Engineering requested 2x Lead AI Engineer.",
    '/coo/prf-approvals',
    'request',
    'manpower_request',
    $testPrf->id
);

$cooNotifications = DB::table('notifications')->where('notifiable_id', $coo->id)->count();
$deptHeadBNotifications = DB::table('notifications')->where('notifiable_id', $deptHeadB->id)->count();
$employeeNotifications = DB::table('notifications')->where('notifiable_id', $employee->id)->count();

assertCondition("COO received PRF creation notification", $cooNotifications > 0);
assertCondition("Unrelated Dept Head B did NOT receive PRF notification", $deptHeadBNotifications === 0);
assertCondition("Unrelated Employee did NOT receive PRF notification", $employeeNotifications === 0);

// 2. COO Approves PRF event
$approveRecipients = NotificationRecipientResolver::resolve('manpower_request.approved', $testPrf, $coo);
NotificationService::notifyRecipients(
    $approveRecipients,
    'PRF Request Approved by COO',
    "Requisition for Lead AI Engineer was APPROVED by COO.",
    '/admin/job-posting',
    'alert',
    'manpower_request',
    $testPrf->id
);

$deptHeadANotifications = DB::table('notifications')->where('notifiable_id', $deptHeadA->id)->count();
$hrAdminNotifications = DB::table('notifications')->where('notifiable_id', $hrAdmin->id)->count();
$deptHeadBAfterApprove = DB::table('notifications')->where('notifiable_id', $deptHeadB->id)->count();

assertCondition("Requester (Dept Head A) received approval notification", $deptHeadANotifications > 0);
assertCondition("Recruitment HR Admin received approval notification", $hrAdminNotifications > 0);
assertCondition("Unrelated Dept Head B still has ZERO notifications", $deptHeadBAfterApprove === 0);

// 3. Notification Controller API ownership check
$notifController = app(\App\Http\Controllers\NotificationController::class);
$requestDeptA = new Request();
$requestDeptA->setUserResolver(fn() => $deptHeadA);

$deptANotifs = $notifController->index($requestDeptA)->getData(true);
assertCondition("Notification API returns only records owned by Dept Head A", count($deptANotifs['notifications']) === $deptHeadANotifications);

$requestDeptB = new Request();
$requestDeptB->setUserResolver(fn() => $deptHeadB);
$deptBNotifs = $notifController->index($requestDeptB)->getData(true);
assertCondition("Notification API returns 0 notifications for Dept Head B", count($deptBNotifs['notifications']) === 0);

// ── TEST 8: IDEMPOTENCY / DUPLICATE PREVENTION ──────────────────────────────
echo "\n--- 9. Testing Notification Idempotency ---\n";
$initialCount = DB::table('notifications')->where('notifiable_id', $deptHeadA->id)->count();

// Send the exact same notification immediately
NotificationService::notifyUser(
    $deptHeadA,
    'PRF Request Approved by COO',
    "Requisition for Lead AI Engineer was APPROVED by COO."
);

$afterDuplicateCount = DB::table('notifications')->where('notifiable_id', $deptHeadA->id)->count();
assertCondition("Duplicate notification within 15s was suppressed (Idempotent)", $initialCount === $afterDuplicateCount);

// ── SUMMARY ─────────────────────────────────────────────────────────────────
echo "\n====================================================\n";
echo "RESULTS: {$passCount} PASSED, {$failCount} FAILED\n";
echo "====================================================\n";

if ($failCount === 0) {
    echo "ALL TESTS PASSED SUCCESSFULLY!\n";
    exit(0);
} else {
    echo "SOME TESTS FAILED.\n";
    exit(1);
}
