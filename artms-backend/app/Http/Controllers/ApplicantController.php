<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicantRequest;
use App\Models\AuditLog;
use App\Models\Applicant;
use App\Services\NotificationService;
use App\Models\ApplicantDocument;
use App\Models\ApplicantNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ApplicantController extends Controller
{
    /**
     * GET /api/applicants — HR admin view with filters
     */
    public function index(Request $request): JsonResponse
    {
        $applicants = Applicant::with(['jobPosting.jobLibrary', 'jobPosting.department', 'aiEvaluation'])
            ->when($request->search, fn ($q) =>
                // Grouped so OR doesn't bleed into AND filters (status, shortlisted, etc.)
                $q->where(fn ($q2) =>
                    $q2->where('first_name', 'like', "%{$request->search}%")
                       ->orWhere('last_name', 'like', "%{$request->search}%")
                       ->orWhere('email', 'like', "%{$request->search}%")
                       ->orWhere('application_id', 'like', "%{$request->search}%")
                )
            )
            ->when($request->status, function ($q) use ($request) {
                if ($request->status === 'interview_1') {
                    $q->whereIn('status', ['interview_1', 'interview_1_scheduled', 'interview_1_done']);
                } elseif ($request->status === 'interview_2') {
                    $q->whereIn('status', ['interview_2', 'interview_2_scheduled', 'interview_2_done']);
                } elseif ($request->status === 'ai_screening') {
                    $q->whereIn('status', ['ai_screening', 'under_review']);
                } elseif ($request->status === 'screening_passed') {
                    $q->whereIn('status', ['screening_passed', 'shortlisted']);
                } else {
                    $q->where('status', $request->status);
                }
            })
            ->when($request->job_posting_id, fn ($q) => $q->where('job_posting_id', $request->job_posting_id))
            ->when($request->is_shortlisted, fn ($q) => $q->where('is_shortlisted', true))
            ->when($request->exclude_hired, fn ($q) => $q->where('status', '!=', 'hired'))
            ->orderByDesc(fn ($q) => $q->select('ai_score')->from('ai_evaluations')->whereColumn('applicant_id', 'applicants.id'))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($applicants);
    }

    /**
     * POST /api/applicants — Public submission
     */
    public function store(StoreApplicantRequest $request): JsonResponse
    {
        // Generate unique application ID
        $appId = 'APP-' . now()->year . '-' . str_pad(Applicant::withTrashed()->count() + 1, 5, '0', STR_PAD_LEFT);

        // Handle resume upload
        $resumePath = null;
        $originalName = null;
        if ($request->hasFile('resume')) {
            $file = $request->file('resume');
            $resumePath   = $file->store("resumes/{$appId}", 'local');
            $originalName = $file->getClientOriginalName();
        }

        $applicant = Applicant::create([
            'application_id'       => $appId,
            'job_posting_id'       => $request->job_posting_id,
            'first_name'           => $request->first_name,
            'last_name'            => $request->last_name,
            'middle_name'          => $request->middle_name,
            'email'                => $request->email,
            'phone'                => $request->phone,
            'date_of_birth'        => $request->date_of_birth,
            'address'              => $request->address,
            'gender'               => $request->gender,
            'civil_status'         => $request->civil_status,
            'nationality'          => $request->nationality,
            'resume_path'          => $resumePath,
            'resume_original_name' => $originalName,
            'informed_consent'     => true,
            'status'               => 'applied',
        ]);

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'Job Position';

        // Notify HR Admins & SuperAdmin (In-App + Email)
        NotificationService::notifyRoles(
            ['hr_admin', 'super_admin'],
            'New Job Application Received',
            "{$applicant->first_name} {$applicant->last_name} applied for '{$jobTitle}' (Ref: {$appId}).",
            '/admin/applicants',
            'application'
        );

        // Confirmation Email to Applicant
        NotificationService::notifyEmail(
            $applicant->email,
            "Application Received — {$appId}",
            "Hello {$applicant->first_name}, your job application for '{$jobTitle}' was successfully received. Application ID: {$appId}.",
            null,
            'application'
        );

        return response()->json([
            'message'        => 'Application submitted successfully.',
            'application_id' => $appId,
        ], 201);
    }

    public function show(Applicant $applicant): JsonResponse
    {
        return response()->json([
            'applicant' => $applicant->load(
                'jobPosting.jobLibrary',
                'jobPosting.department',
                'documents',
                'aiEvaluation',
                'interviews',
                'notes.author'
            ),
        ]);
    }

    public function update(Request $request, Applicant $applicant): JsonResponse
    {
        $oldStatus       = $applicant->status;
        $oldShortlisted  = $applicant->is_shortlisted;

        $data = $request->validate([
            'status'         => ['sometimes', 'string'],
            'is_shortlisted' => ['sometimes', 'boolean'],
            'ranking'        => ['nullable', 'integer'],
        ]);

        $applicant->update($data);

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'the position';

        // 1. Trigger instant email & in-app notification on Status Change
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $readableStatus = ucwords(str_replace('_', ' ', $data['status']));

            if (in_array($data['status'], ['rejected', 'screening_failed'])) {
                NotificationService::sendScreeningRejectionEmail($applicant);
            } else {
                NotificationService::notifyEmail(
                    $applicant->email,
                    "Application Status Update — {$readableStatus}",
                    "Hello {$applicant->first_name}, your application status for {$jobTitle} has been updated to: {$readableStatus}.",
                    null,
                    'application'
                );
            }

            NotificationService::notifyRoles(
                ['hr_admin', 'super_admin'],
                "Applicant Status Updated — {$readableStatus}",
                "Applicant {$applicant->first_name} {$applicant->last_name} status was updated to {$readableStatus}.",
                '/admin/applicants',
                'application'
            );
        }

        // 2. Trigger instant email & in-app notification on Shortlisting
        if (isset($data['is_shortlisted']) && $data['is_shortlisted'] && !$oldShortlisted) {
            NotificationService::notifyEmail(
                $applicant->email,
                "Application Status Update — Shortlisted",
                "Hello {$applicant->first_name}, congratulations! You have been shortlisted for the {$jobTitle} position at ARTMS.",
                null,
                'application'
            );

            NotificationService::notifyRoles(
                ['hr_admin', 'super_admin'],
                "Applicant Shortlisted",
                "Applicant {$applicant->first_name} {$applicant->last_name} has been shortlisted for '{$jobTitle}'.",
                '/admin/applicants',
                'application'
            );
        }

        return response()->json(['message' => 'Applicant updated.', 'applicant' => $applicant->fresh()]);
    }

    /**
     * PATCH /api/applicants/{id}/ready-for-interview
     */
    public function readyForInterview(Request $request, Applicant $applicant): JsonResponse
    {
        $request->validate([
            'message' => ['nullable', 'string'],
        ]);

        $applicant->update(['status' => 'ready_for_interview']);
        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'the position';
        $msg = $request->message ?? "Congratulations! You have been selected for an interview for the {$jobTitle} position.";

        // Send email to applicant
        NotificationService::notifyEmail($applicant->email, 'Interview Invitation — ARTMS Recruitment', $msg, null, 'interview');

        // Notify HR Admins
        NotificationService::notifyRoles(
            ['hr_admin', 'super_admin'],
            'Applicant Ready for Interview',
            "Applicant {$applicant->first_name} {$applicant->last_name} marked ready for interview ({$jobTitle}).",
            '/admin/applicants',
            'interview'
        );

        AuditLog::record('ready_for_interview', 'applicant', "Applicant marked ready for interview: {$applicant->application_id}");

        return response()->json([
            'message' => 'Applicant marked as ready for interview. Email notification sent.',
            'applicant' => $applicant->fresh(),
        ]);
    }

    /**
     * PATCH /api/applicants/{id}/reject
     */
    public function reject(Request $request, Applicant $applicant): JsonResponse
    {
        $request->validate(['remarks' => ['nullable', 'string']]);

        $applicant->update(['status' => 'rejected']);

        // Send polite automated rejection email using dedicated template
        NotificationService::sendScreeningRejectionEmail($applicant, $request->input('remarks'));

        AuditLog::record('reject', 'applicant', "Applicant rejected: {$applicant->application_id}");

        return response()->json(['message' => 'Applicant rejected and notification email sent.']);
    }

    /**
     * POST /api/applicants/{id}/notes
     */
    public function addNote(Request $request, Applicant $applicant): JsonResponse
    {
        $request->validate(['note' => ['required', 'string']]);

        $note = ApplicantNote::create([
            'applicant_id' => $applicant->id,
            'created_by'   => auth()->id(),
            'note'         => $request->note,
        ]);

        return response()->json(['message' => 'Note added.', 'note' => $note->load('author')], 201);
    }

    /**
     * GET /api/applicants/{id}/track — public tracking by application_id token
     */
    public function track(Request $request): JsonResponse
    {
        $request->validate(['application_id' => ['required', 'string']]);

        $applicant = Applicant::where('application_id', $request->application_id)
            ->select('application_id', 'first_name', 'last_name', 'status', 'created_at')
            ->firstOrFail();

        return response()->json(['application' => $applicant]);
    }

    /**
     * DELETE /api/applicants/{id}
     * Delete an applicant record completely from database (along with evaluations, transcripts, interviews).
     */
    public function destroy(Applicant $applicant): JsonResponse
    {
        $name = "{$applicant->first_name} {$applicant->last_name}";
        $appId = $applicant->application_id;

        // Delete resume file if exists
        if ($applicant->resume_path && Storage::disk('local')->exists($applicant->resume_path)) {
            Storage::disk('local')->delete($applicant->resume_path);
        }

        // Cascade delete related records
        $applicant->aiEvaluation()?->delete();
        $applicant->documents()->delete();
        $applicant->interviews()->delete();
        $applicant->notes()->delete();
        $applicant->delete();

        AuditLog::record('delete_applicant', 'applicant', "Deleted applicant {$name} ({$appId})");

        return response()->json([
            'message' => 'Applicant deleted successfully.',
        ]);
    }

    /**
     * POST /api/applicants/{id}/hire
     * Mark applicant as hired, auto-generate Employee 201 file record & assign Employee Number (EMP-YYYY-XXXXX).
     */
    public function hire(Request $request, Applicant $applicant): JsonResponse
    {
        $request->validate([
            'date_hired'      => ['nullable', 'date'],
            'salary'          => ['nullable', 'numeric', 'min:0'],
            'employment_type' => ['nullable', 'string'],
        ]);

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? "Position";
        $deptId   = $applicant->jobPosting?->department_id ?? \App\Models\Department::first()?->id ?? 1;

        // 1. Mark Applicant as Hired
        $applicant->update(['status' => 'hired']);

        // 2. Create or find User
        $user = User::where('email', $applicant->email)->first();
        if (!$user) {
            $user = User::create([
                'name'          => "{$applicant->first_name} {$applicant->last_name}",
                'first_name'    => $applicant->first_name,
                'last_name'     => $applicant->last_name,
                'email'         => $applicant->email,
                'password'      => Hash::make(Str::random(12)),
                'role'          => 'employee',
                'department_id' => $deptId,
                'is_active'     => true,
            ]);
        }

        // 3. Create or find Employee record
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            $employee = Employee::create([
                'user_id'                  => $user->id,
                'department_id'            => $deptId,
                'position'                 => $jobTitle,
                'date_hired'               => $request->date_hired ?? now()->toDateString(),
                'salary'                   => $request->salary ?? ($applicant->jobPosting?->jobLibrary?->salary_min ?? 0),
                'employment_type'          => $request->employment_type ?? 'regular',
                'employment_status'        => 'active',
                'address'                  => $applicant->address,
                'contact_number'           => $applicant->phone,
                'emergency_contact_name'   => null,
                'emergency_contact_number' => null,
            ]);
        }

        // 4. Auto-generate Employee Number (EMP-YYYY-XXXXX) & save to User
        $empId = $employee->generateEmployeeNumber();
        $user->update(['employee_id' => $empId]);

        // 5. Seed default 201 Document Checklist
        $employee->seedDefaultDocuments();

        // 6. Transfer candidate resume to 201 documents if present
        if ($applicant->resume_path && Storage::disk('local')->exists($applicant->resume_path)) {
            $folder = "employee_documents/{$empId}";
            $targetPath = "{$folder}/Resume_{$empId}." . pathinfo($applicant->resume_path, PATHINFO_EXTENSION);
            Storage::disk('public')->put($targetPath, Storage::disk('local')->get($applicant->resume_path));

            $employee->documents()->updateOrCreate(
                ['document_type' => 'resume'],
                [
                    'file_path'     => $targetPath,
                    'original_name' => "Resume_{$applicant->first_name}_{$applicant->last_name}",
                    'status'        => 'submitted',
                    'submitted_at'  => now(),
                    'remarks'       => 'Auto-transferred from job application resume',
                ]
            );
        }

        // 7. Send Notifications
        NotificationService::notifyEmail(
            $applicant->email,
            "Congratulations! You have been hired — ARTMS 201 File Created",
            "Hello {$applicant->first_name}, welcome aboard! You have been officially hired as {$jobTitle}. Your Employee Number is {$empId}.",
            null,
            'application'
        );

        NotificationService::notifyRoles(
            ['hr_admin', 'super_admin'],
            "New Employee Hired — 201 File Created",
            "{$applicant->first_name} {$applicant->last_name} was hired as {$jobTitle}. Employee Number: {$empId}.",
            '/admin/employees',
            'application'
        );

        AuditLog::record('hire_applicant', 'employee', "Hired applicant {$applicant->first_name} {$applicant->last_name} ({$applicant->application_id}) as Employee {$empId}");

        return response()->json([
            'message'  => "Applicant hired successfully. Employee 201 record {$empId} created.",
            'employee' => $employee->load('user', 'department', 'documents'),
        ]);
    }
}
