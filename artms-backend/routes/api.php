<?php

use App\Http\Controllers\AiScreeningController;
use App\Http\Controllers\ApplicantController;
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
use App\Http\Controllers\ManpowerRequestController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ResumeParserController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (No authentication required)
|--------------------------------------------------------------------------
*/
Route::prefix('public')->group(function () {
    Route::get('job-postings', [JobPostingController::class, 'publicIndex']);
    Route::get('job-postings/{jobPosting}', [JobPostingController::class, 'show']);
    Route::post('applicants', [ApplicantController::class, 'store']); // online application form
    Route::post('applicants/track', [ApplicantController::class, 'track']); // track by application_id
    Route::post('parse-resume', [ResumeParserController::class, 'parse']); // AI resume parser
});

/*
|--------------------------------------------------------------------------
| Auth Routes (No authentication required)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Alias for direct login route
Route::post('login', [AuthController::class, 'login']);

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
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    // ── Dashboards ──────────────────────────────────────────────────────────
    Route::get('dashboard/admin', [DashboardController::class, 'adminStats'])
        ->middleware('role:hr_admin');
    Route::get('dashboard/super-admin', [DashboardController::class, 'superAdminStats'])
        ->middleware('role:super_admin');
    Route::get('dashboard/department-head', [DashboardController::class, 'departmentHeadStats'])
        ->middleware('role:department_head');

    // ── Users  (Super Admin only) ────────────────────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });

    // ── Departments  (Super Admin + HR Admin) ────────────────────────────────
    Route::middleware('role:super_admin,hr_admin')->group(function () {
        Route::apiResource('departments', DepartmentController::class);
    });

    // ── Employees  (HR Admin + Super Admin) ─────────────────────────────────
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
        Route::patch('employees/{employee}/terminate', [EmployeeController::class, 'terminate']);
        Route::patch('employees/{employee}/clearance', [EmployeeController::class, 'clearance']);
    });

    // ── Job Library  (HR Admin creates; COO approves) ───────────────────────
    Route::middleware('role:hr_admin,super_admin,coo,department_head')->group(function () {
        Route::get('job-library/approved', [JobLibraryController::class, 'approved']);
    });
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::apiResource('job-library', JobLibraryController::class);
    });
    Route::middleware('role:coo,super_admin')->group(function () {
        Route::patch('job-library/{jobLibrary}/approve', [JobLibraryController::class, 'approve']);
    });

    // ── Job Postings  (HR Admin creates; COO approves) ──────────────────────
    Route::middleware('role:hr_admin,super_admin,coo,department_head')->group(function () {
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
        Route::get('applicants', [ApplicantController::class, 'index']);
        Route::get('applicants/{applicant}', [ApplicantController::class, 'show']);
        Route::put('applicants/{applicant}', [ApplicantController::class, 'update']);
        Route::patch('applicants/{applicant}', [ApplicantController::class, 'update']);
        Route::patch('applicants/{applicant}/hire', [ApplicantController::class, 'hire']);
        Route::patch('applicants/{applicant}/reject', [ApplicantController::class, 'reject']);
        Route::post('applicants/{applicant}/notes', [ApplicantController::class, 'addNote']);
    });

    // ── AI Screening ─────────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin')->group(function () {
        Route::get('ai/evaluations', [AiScreeningController::class, 'index']);
        Route::post('ai/screen/{applicant}', [AiScreeningController::class, 'screen']);
        Route::patch('ai/review/{applicant}', [AiScreeningController::class, 'hrReview']);
        Route::get('ai/rankings', [AiScreeningController::class, 'rankings']);
    });

    // ── Interviews ───────────────────────────────────────────────────────────
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::apiResource('interviews', InterviewController::class);
        Route::post('interviews/{interview}/send-reminder', [InterviewController::class, 'sendReminder']);
    });
    // Public-facing confirm (applicant uses a secure token link in email)
    Route::patch('interviews/{interview}/confirm', [InterviewController::class, 'confirm']);

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
    Route::apiResource('manpower-requests', ManpowerRequestController::class);
    Route::middleware('role:hr_admin,super_admin,coo')->group(function () {
        Route::patch('manpower-requests/{manpowerRequest}/approve', [ManpowerRequestController::class, 'approve']);
        Route::get('manpower-requests-approved-for-posting', [ManpowerRequestController::class, 'approvedForPosting']);
    });
});
