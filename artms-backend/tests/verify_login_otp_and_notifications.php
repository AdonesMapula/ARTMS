<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

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

Mail::fake();

echo "=================================================================\n";
echo "ARTMS AUTHENTICATION & TARGETED NOTIFICATIONS COMPREHENSIVE TEST\n";
echo "=================================================================\n\n";

$testsPassed = 0;
$totalTests = 0;

function assertTest($condition, $testName) {
    global $testsPassed, $totalTests;
    $totalTests++;
    if ($condition) {
        $testsPassed++;
        echo "  [PASS] {$testName}\n";
    } else {
        echo "  [FAIL] {$testName}\n";
    }
}

// ── Setup Test Users ────────────────────────────────────────────────────────
$deptA = Department::firstOrCreate(['department_name' => 'Engineering Test'], ['status' => 'active']);
$deptB = Department::firstOrCreate(['department_name' => 'Marketing Test'], ['status' => 'active']);

$superAdmin = User::firstOrCreate(['email' => 'superadmin_test@artms.com'], [
    'name' => 'Super Admin Test',
    'first_name' => 'Super',
    'last_name' => 'Admin',
    'role' => 'super_admin',
    'password' => Hash::make('Secret123!'),
    'is_active' => true,
]);

$hrAdmin = User::firstOrCreate(['email' => 'hr_test@artms.com'], [
    'name' => 'HR Admin Test',
    'first_name' => 'HR',
    'last_name' => 'Admin',
    'role' => 'hr_admin',
    'department_id' => $deptA->id,
    'password' => Hash::make('Secret123!'),
    'is_active' => true,
]);

$deptHeadA = User::firstOrCreate(['email' => 'depthead_a@artms.com'], [
    'name' => 'Dept Head A Test',
    'first_name' => 'Dept',
    'last_name' => 'Head A',
    'role' => 'department_head',
    'department_id' => $deptA->id,
    'password' => Hash::make('Secret123!'),
    'is_active' => true,
]);

$deptHeadB = User::firstOrCreate(['email' => 'depthead_b@artms.com'], [
    'name' => 'Dept Head B Test',
    'first_name' => 'Dept',
    'last_name' => 'Head B',
    'role' => 'department_head',
    'department_id' => $deptB->id,
    'password' => Hash::make('Secret123!'),
    'is_active' => true,
]);

$cooUser = User::firstOrCreate(['email' => 'coo_test@artms.com'], [
    'name' => 'COO User Test',
    'first_name' => 'COO',
    'last_name' => 'Executive',
    'role' => 'coo',
    'password' => Hash::make('Secret123!'),
    'is_active' => true,
]);

$authController = app(\App\Http\Controllers\AuthController::class);

echo "--- 1. Testing Super Admin Direct Login (Bypass OTP) ---\n";

$loginReqSuper = \App\Http\Requests\Auth\LoginRequest::create('/api/auth/login', 'POST', [
    'email' => 'superadmin_test@artms.com',
    'password' => 'Secret123!',
]);
$resSuper = $authController->login($loginReqSuper);
$dataSuper = $resSuper->getData(true);

assertTest($resSuper->getStatusCode() === 200, "Super Admin login returns HTTP 200");
assertTest(isset($dataSuper['token']) && !empty($dataSuper['token']), "Super Admin receives Sanctum token immediately");
assertTest(!isset($dataSuper['requires_otp']) || $dataSuper['requires_otp'] === false, "Super Admin requires_otp is false");
assertTest(AuthenticationOtp::where('user_id', $superAdmin->id)->whereNull('used_at')->count() === 0, "No login OTP record generated for Super Admin");

echo "\n--- 2. Testing Non-Super-Admin Login (HR Admin Requires OTP) ---\n";

$loginReqHR = \App\Http\Requests\Auth\LoginRequest::create('/api/auth/login', 'POST', [
    'email' => 'hr_test@artms.com',
    'password' => 'Secret123!',
]);
$resHR = $authController->login($loginReqHR);
$dataHR = $resHR->getData(true);

assertTest($resHR->getStatusCode() === 200, "HR Admin login returns HTTP 200");
assertTest(isset($dataHR['requires_otp']) && $dataHR['requires_otp'] === true, "HR Admin requires_otp is true");
assertTest(!isset($dataHR['token']), "No Sanctum token issued before OTP verification");
assertTest(isset($dataHR['verification_id']) && !empty($dataHR['verification_id']), "Temporary verification_id issued");

$verificationId = $dataHR['verification_id'];
$otpRecord = AuthenticationOtp::where('verification_id', $verificationId)->first();
assertTest($otpRecord !== null, "AuthenticationOtp record exists in database");
assertTest($otpRecord->purpose === 'login_verification', "OTP purpose is 'login_verification'");
assertTest(strlen($otpRecord->otp_code) === 6, "OTP is exactly 6 digits");

echo "\n--- 3. Testing Login OTP Verification ---\n";

// A. Invalid OTP
$verifyReqBad = Request::create('/api/auth/verify-login-otp', 'POST', [
    'verification_id' => $verificationId,
    'otp' => '000000',
]);
$resBad = $authController->verifyLoginOtp($verifyReqBad);
assertTest($resBad->getStatusCode() === 422, "Invalid OTP code rejected with 422");

// B. Resend OTP Cooldown
$resendReq = Request::create('/api/auth/resend-login-otp', 'POST', [
    'verification_id' => $verificationId,
]);
$resResendCooldown = $authController->resendLoginOtp($resendReq);
assertTest($resResendCooldown->getStatusCode() === 429, "Resend within 60s blocked with 429 cooldown error");

// C. Valid OTP Verification
$correctOtp = $otpRecord->otp_code;
$verifyReqGood = Request::create('/api/auth/verify-login-otp', 'POST', [
    'verification_id' => $verificationId,
    'otp' => $correctOtp,
]);
$resGood = $authController->verifyLoginOtp($verifyReqGood);
$dataGood = $resGood->getData(true);

assertTest($resGood->getStatusCode() === 200, "Correct OTP verification returns HTTP 200");
assertTest(isset($dataGood['token']) && !empty($dataGood['token']), "Sanctum token issued upon successful OTP verification");
assertTest($dataGood['user']['email'] === 'hr_test@artms.com', "Authenticated user returned in payload");

// D. Reuse prevention
$verifyReqReuse = Request::create('/api/auth/verify-login-otp', 'POST', [
    'verification_id' => $verificationId,
    'otp' => $correctOtp,
]);
$resReuse = $authController->verifyLoginOtp($verifyReqReuse);
assertTest($resReuse->getStatusCode() === 422, "Already used OTP rejected with 422");

echo "\n--- 4. Testing Targeted Notification Recipient Resolver ---\n";

// Create PRF for Dept Head A
$prf = ManpowerRequest::create([
    'department_id' => $deptA->id,
    'requested_by' => $deptHeadA->id,
    'position_needed' => 'Senior Laravel Architect',
    'headcount' => 1,
    'urgency' => 'high',
    'status' => 'pending',
]);

// Test PRF Created Resolver: should target COO and Super Admin, NOT Dept Head B
$recipientsCreated = NotificationRecipientResolver::resolve('manpower_request.created', $prf, $deptHeadA);
$recipientIdsCreated = $recipientsCreated->pluck('id')->toArray();

assertTest(in_array($cooUser->id, $recipientIdsCreated), "COO resolved for PRF creation");
assertTest(in_array($superAdmin->id, $recipientIdsCreated), "Super Admin resolved for PRF creation");
assertTest(!in_array($deptHeadB->id, $recipientIdsCreated), "Unrelated Dept Head B is NOT resolved");

// Test PRF Approved Resolver: should target Requester (Dept Head A) and HR Admin, NOT Dept Head B
$prf->update(['status' => 'approved', 'approved_by' => $cooUser->id]);
$recipientsApproved = NotificationRecipientResolver::resolve('manpower_request.approved', $prf, $cooUser);
$recipientIdsApproved = $recipientsApproved->pluck('id')->toArray();

assertTest(in_array($deptHeadA->id, $recipientIdsApproved), "Requester (Dept Head A) resolved for PRF approval");
assertTest(in_array($hrAdmin->id, $recipientIdsApproved), "HR Admin resolved for PRF approval");
assertTest(!in_array($deptHeadB->id, $recipientIdsApproved), "Unrelated Dept Head B is NOT resolved for PRF approval");

// Dispatch targeted notification to Dept Head A
NotificationService::notifyRecipients(
    $recipientsApproved,
    "PRF Approved",
    "Your PRF for Senior Laravel Architect was approved.",
    "/department-head/request-history",
    "alert",
    "manpower_request",
    $prf->id
);

// Verify In-App Notification scoping for Dept Head A vs Dept Head B
$notifController = app(\App\Http\Controllers\NotificationController::class);

$reqDeptHeadA = Request::create('/api/notifications', 'GET');
$reqDeptHeadA->setUserResolver(fn() => $deptHeadA);
$resNotifA = $notifController->index($reqDeptHeadA)->getData(true);

$reqDeptHeadB = Request::create('/api/notifications', 'GET');
$reqDeptHeadB->setUserResolver(fn() => $deptHeadB);
$resNotifB = $notifController->index($reqDeptHeadB)->getData(true);

$hasNotifA = collect($resNotifA['notifications'])->contains('entity_id', $prf->id);
$hasNotifB = collect($resNotifB['notifications'])->contains('entity_id', $prf->id);

assertTest($hasNotifA === true, "Dept Head A received the PRF approval notification in-app");
assertTest($hasNotifB === false, "Dept Head B did NOT receive Dept Head A's notification");

echo "\n--- 5. Testing Existing Password Reset OTP Isolation ---\n";

$forgotReq = \App\Http\Requests\Auth\ForgotPasswordRequest::create('/api/auth/forgot-password', 'POST', [
    'email' => 'hr_test@artms.com',
]);
$resForgot = $authController->forgotPassword($forgotReq);
$freshHr = $hrAdmin->fresh();

assertTest($resForgot->getStatusCode() === 200, "Forgot password endpoint returns HTTP 200");
assertTest(!empty($freshHr->otp_code), "Password reset OTP generated on user model");

$verifyResetReq = Request::create('/api/auth/verify-otp', 'POST', [
    'email' => 'hr_test@artms.com',
    'otp' => $freshHr->otp_code,
]);
$resVerifyReset = $authController->verifyOtp($verifyResetReq);
assertTest($resVerifyReset->getStatusCode() === 200, "Password reset OTP verified successfully");

echo "\n=================================================================\n";
echo "TEST RESULTS: {$testsPassed} / {$totalTests} PASSED\n";
echo "=================================================================\n";

if ($testsPassed === $totalTests) {
    exit(0);
} else {
    exit(1);
}
