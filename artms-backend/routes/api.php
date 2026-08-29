<?php

use App\Http\Controllers\AiScreeningController;
use App\Http\Controllers\AppBootController;
use App\Http\Controllers\ApplicantController;
use App\Http\Controllers\JobDocumentParserController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\JobLibraryController;
use App\Http\Controllers\JobPostingController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LiveKitWebhookController;
use App\Http\Controllers\ManpowerRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ResumeParserController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\JobCategoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (No authentication required)
|--------------------------------------------------------------------------
*/
Route::prefix('public')->group(function () {
    Route::get('health', function () {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $dbName = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
            $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
            $jobsCount = \App\Models\JobPosting::count();
            $usersCount = \App\Models\User::count();
            return response()->json([
                'status' => 'connected',
                'database' => $dbName,
                'driver' => $driver,
                'job_postings_count' => $jobsCount,
                'users_count' => $usersCount,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    });
    Route::get('boot', [AppBootController::class, 'publicBoot']);
    Route::get('job-postings', [JobPostingController::class, 'publicIndex']);
    Route::get('job-postings/{jobPosting}', [JobPostingController::class, 'show']);
    Route::post('applicants', [ApplicantController::class, 'store']); // online application form
    Route::post('applicants/track', [ApplicantController::class, 'track']); // track by application_id
    Route::post('parse-resume', [ResumeParserController::class, 'parse'])->middleware('throttle:ai-public-parser'); // AI resume parser
    Route::match(['get', 'post'], 'interviews/{interview}/livekit-token', [InterviewController::class, 'publicGenerateToken']); // applicant video room token
    Route::post('interviews/{interview}/transcript', [InterviewController::class, 'storePublicTranscript']); // applicant live transcript
    Route::post('interviews/{interview}/transcribe-audio', [InterviewController::class, 'publicTranscribeAudio'])->middleware('throttle:ai-transcription'); // applicant audio transcript
    Route::get('interviews/{interview}/processing-status', [InterviewController::class, 'getProcessingStatus']);
    Route::post('interviews/{interview}/behavioral-metrics', [InterviewController::class, 'saveBehavioralMetrics']);
    Route::post('interviews/{interview}/end-session', [InterviewController::class, 'endSession']); // applicant end session
    Route::match(['get', 'post', 'patch'], 'interviews/{interview}/confirm', [InterviewController::class, 'confirm']); // applicant confirm interview
});

// ── LiveKit Webhook (no Sanctum auth — signature validated inside controller) ──
Route::post('livekit/webhook', [LiveKitWebhookController::class, 'handle']);
Route::match(['get', 'post', 'patch'], 'interviews/{interview}/confirm', [InterviewController::class, 'confirm']);

/*
|--------------------------------------------------------------------------
| Auth Routes (No authentication required)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-login-otp', [AuthController::class, 'verifyLoginOtp'])->middleware('throttle:6,1');
    Route::post('resend-login-otp', [AuthController::class, 'resendLoginOtp'])->middleware('throttle:6,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    Route::post('setup-account', [AuthController::class, 'setupAccount']);
});

// Alias for direct login route
Route::match(['get', 'post'], 'login', [AuthController::class, 'login'])->name('login');

/*
|--------------------------------------------------------------------------
| Protected Routes (Require Sanctum token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::post('me/avatar', [AuthController::class, 'updateAvatar']);
    Route::put('me/profile', [AuthController::class, 'updateProfile']);
    Route::post('me/update-profile', [AuthController::class, 'updateProfile']);
    Route::get('boot', [AppBootController::class, 'boot']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    // ── Messages (All authenticated users) ──────────────────────────────────
    Route::get('messages/conversations', [\App\Http\Controllers\MessageController::class, 'conversations']);
    Route::get('messages/users', [\App\Http\Controllers\MessageController::class, 'users']);
    Route::get('messages/{userId}', [\App\Http\Controllers\MessageController::class, 'thread']);
    Route::post('messages', [\App\Http\Controllers\MessageController::class, 'store']);
    Route::put('messages/{id}/read', [\App\Http\Controllers\MessageController::class, 'markAsRead']);

    // ── Notifications ────────────────────────────────────────────────────────
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // ── Dashboards ──────────────────────────────────────────────────────────
    Route::get('dashboard/admin', [DashboardController::class, 'adminStats'])
        ->middleware('role:hr_admin');
    Route::get('dashboard/super-admin', [DashboardController::class, 'superAdminStats'])
        ->middleware('role:super_admin');
    Route::get('dashboard/department-head', [DashboardController::class, 'departmentHeadStats'])
        ->middleware('role:department_head');
    Route::get('dashboard/coo', [DashboardController::class, 'cooStats'])
        ->middleware('role:coo');
    Route::get('sidebar-counts', [DashboardController::class, 'sidebarCounts']);

    // ── Users  (Super Admin only) ────────────────────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        Route::get('users/archived', [UserController::class, 'archived']);
        Route::post('users/bulk-archive', [UserController::class, 'bulkArchive']);
        Route::post('users/bulk-restore', [UserController::class, 'bulkRestore']);
        Route::post('users/bulk-force-delete', [UserController::class, 'bulkForceDelete']);
        Route::post('users/{id}/restore', [UserController::class, 'restore']);
        Route::delete('users/{id}/force', [UserController::class, 'forceDeleteUser']);
        Route::apiResource('users', UserController::class);
        Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
        
        // Permissions Management (Super Admin only)
        Route::get('permissions', [PermissionController::class, 'index']);
        Route::get('permissions/role/{role}', [PermissionController::class, 'getByRole']);
        Route::post('permissions/role/{role}', [PermissionController::class, 'updateRolePermissions']);
        Route::get('permissions/all-roles', [PermissionController::class, 'getAllRoles']);
        Route::post('permissions/sync-defaults', [PermissionController::class, 'syncDefaultPermissions']);
        
        // Custom Roles Management
        Route::get('roles', [\App\Http\Controllers\RoleController::class, 'index']);
        Route::post('roles', [\App\Http\Controllers\RoleController::class, 'store']);
        Route::put('roles/{id}', [\App\Http\Controllers\RoleController::class, 'update']);
        Route::delete('roles/{id}', [\App\Http\Controllers\RoleController::class, 'destroy']);
    });

    // ── Permissions for Current User (All authenticated users) ──────────────
    // This allows any logged-in user to fetch their own role's permissions
    Route::get('permissions/my-permissions', [PermissionController::class, 'getMyPermissions']);

    // ── Departments  (Super Admin + HR Admin) ────────────────────────────────
    Route::middleware('role:super_admin,hr_admin')->group(function () {
        Route::post('departments/bulk-delete', [DepartmentController::class, 'bulkDelete']);
        Route::apiResource('departments', DepartmentController::class);
    });

    // ── Employees  (HR Admin + Super Admin) ─────────────────────────────────
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::post('employees/bulk-delete', [EmployeeController::class, 'bulkDelete']);
        Route::apiResource('employees', EmployeeController::class);
        Route::patch('employees/{employee}/terminate', [EmployeeController::class, 'terminate']);
        Route::patch('employees/{employee}/clearance', [EmployeeController::class, 'clearance']);
        Route::post('employees/{employee}/documents', [EmployeeController::class, 'uploadDocument']);
        Route::get('employees/{employee}/documents/{document}/download', [EmployeeController::class, 'downloadDocument']);
        Route::patch('employees/{employee}/documents/{document}/status', [EmployeeController::class, 'updateDocumentStatus']);
        Route::get('employees/{employee}/history', [EmployeeController::class, 'getEditHistory']);
    });

    // ── Job Library  (HR Admin creates; COO approves) ───────────────────────
    Route::middleware('role:hr_admin,super_admin,coo,department_head')->group(function () {
        Route::get('job-library/approved', [JobLibraryController::class, 'approved']);
    });
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::post('job-library/bulk-delete', [JobLibraryController::class, 'bulkDelete']);
        Route::apiResource('job-library', JobLibraryController::class);
        Route::post('job-library/parse-document', [JobDocumentParserController::class, 'parse'])->middleware('throttle:ai-document-parser');
        Route::get('job-categories', [JobCategoryController::class, 'index']);
        Route::post('job-categories', [JobCategoryController::class, 'store']);
    });
    Route::middleware('role:coo,super_admin')->group(function () {
        Route::patch('job-library/{jobLibrary}/approve', [JobLibraryController::class, 'approve']);
    });

    // ── Job Postings  (HR Admin creates; COO approves) ──────────────────────
    Route::middleware('role:hr_admin,super_admin,coo,department_head')->group(function () {
        Route::post('job-postings/bulk-delete', [JobPostingController::class, 'bulkDelete']);
        Route::apiResource('job-postings', JobPostingController::class)->except(['store']);
    });
    Route::middleware('role:hr_admin,super_admin,department_head')->group(function () {
        Route::post('job-postings', [JobPostingController::class, 'store']);
    });
    Route::middleware('role:coo,super_admin')->group(function () {
        Route::patch('job-postings/{jobPosting}/approve', [JobPostingController::class, 'approve']);
    });
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::patch('job-postings/{jobPosting}/toggle-publish', [JobPostingController::class, 'togglePublish']);
    });

    // ── Applicants  (HR Admin manages) ──────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::post('applicants/bulk-delete', [ApplicantController::class, 'bulkDelete']);
        Route::get('applicants', [ApplicantController::class, 'index']);
        Route::get('applicants/{applicant}', [ApplicantController::class, 'show']);
        Route::get('applicants/{applicant}/resume', [ApplicantController::class, 'resume']);
        Route::put('applicants/{applicant}', [ApplicantController::class, 'update']);
        Route::patch('applicants/{applicant}', [ApplicantController::class, 'update']);
        Route::patch('applicants/{applicant}/ready-for-interview', [ApplicantController::class, 'readyForInterview']);
        Route::patch('applicants/{applicant}/hire', [ApplicantController::class, 'hire']);
        Route::post('applicants/{applicant}/hire', [ApplicantController::class, 'hire']);
        Route::patch('applicants/{applicant}/reject', [ApplicantController::class, 'reject']);
        Route::delete('applicants/{applicant}', [ApplicantController::class, 'destroy']);
        Route::post('applicants/{applicant}/notes', [ApplicantController::class, 'addNote']);
    });

    // ── AI Screening ─────────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::get('ai/applicants',             [AiScreeningController::class, 'pendingQueue']);
        Route::get('ai/evaluations',            [AiScreeningController::class, 'index']);
        Route::post('ai/screen/{applicant}',    [AiScreeningController::class, 'screen'])->middleware('throttle:ai-screening');
        Route::post('ai/screen-batch',          [AiScreeningController::class, 'screenBatch'])->middleware('throttle:ai-screening');
        Route::patch('ai/review/{applicant}',   [AiScreeningController::class, 'hrReview']);
        Route::get('ai/rankings',               [AiScreeningController::class, 'rankings']);
    });

    // ── Interviews ───────────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::apiResource('interviews', InterviewController::class);
        Route::post('interviews/{interview}/send-reminder',  [InterviewController::class, 'sendReminder']);
        Route::post('interviews/{interview}/livekit-token',  [InterviewController::class, 'generateToken']);
        Route::post('interviews/{interview}/end-session',    [InterviewController::class, 'endSession']);
        Route::get('interviews/{interview}/processing-status', [InterviewController::class, 'getProcessingStatus']);
        Route::post('interviews/{interview}/behavioral-metrics', [InterviewController::class, 'saveBehavioralMetrics']);
        Route::get('interviews/{interview}/report',          [InterviewController::class, 'report']);
        Route::post('interviews/{interview}/transcript',     [InterviewController::class, 'storeTranscript']);
        Route::post('interviews/{interview}/transcribe-audio', [InterviewController::class, 'transcribeAudio'])->middleware('throttle:ai-transcription');
        Route::get('interviews/{interview}/transcripts',     [InterviewController::class, 'getTranscripts']);
        Route::post('interviews/{interview}/analyze-live',   [InterviewController::class, 'analyzeLive'])->middleware('throttle:ai-live-analysis');
        Route::post('interviews/{interview}/notes',          [InterviewController::class, 'saveNotes']);
    });

    // ── Attendance ───────────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::apiResource('attendance', AttendanceController::class);
        Route::get('attendance-summary', [AttendanceController::class, 'summary']);
    });

    // ── Leave Requests ───────────────────────────────────────────────────────
    Route::apiResource('leaves', LeaveController::class);
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::patch('leaves/{leaveRequest}/approve', [LeaveController::class, 'approve']);
    });

    // ── Payroll ──────────────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::apiResource('payroll', PayrollController::class);
        Route::patch('payroll/{payroll}/release', [PayrollController::class, 'release']);
    });

    // ── Manpower Requests ────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::delete('manpower-requests/clean-rejected', [ManpowerRequestController::class, 'cleanRejected']);
        Route::post('manpower-requests/bulk-delete', [ManpowerRequestController::class, 'bulkDelete']);
    });
    Route::apiResource('manpower-requests', ManpowerRequestController::class);
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::patch('manpower-requests/{manpowerRequest}/approve', [ManpowerRequestController::class, 'approve']);
        Route::get('manpower-requests-approved-for-posting', [ManpowerRequestController::class, 'approvedForPosting']);
    });
});
