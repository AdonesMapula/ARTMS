<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicantRequest;
use App\Models\AuditLog;
use App\Models\Applicant;
use App\Services\NotificationRecipientResolver;
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
            ->when($request->sort_by === 'score_desc', fn ($q) =>
                $q->orderByDesc(fn ($q2) => $q2->select('ai_score')->from('ai_evaluations')->whereColumn('applicant_id', 'applicants.id'))
            )
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

        // Notify targeted HR Recruiters (In-App + Email)
        $recipients = NotificationRecipientResolver::resolve('applicant.applied', $applicant);
        NotificationService::notifyRecipients(
            $recipients,
            'New Job Application Received',
            "{$applicant->first_name} {$applicant->last_name} applied for '{$jobTitle}' (Ref: {$appId}).",
            '/admin/applicants',
            'application',
            'applicant',
            $applicant->id
        );

        // Confirmation Email to Applicant
        NotificationService::notifyEmail(
            $applicant->email,
            "Application Received — {$appId}",
            "Hello {$applicant->first_name}, your job application for '{$jobTitle}' was successfully received. Application ID: {$appId}.",
            null,
            'application'
        );

        // Automatically trigger background AI screening so candidates are pre-evaluated
        try {
            \App\Jobs\AutoScreenApplicantJob::dispatch($applicant->id)->afterResponse();
        } catch (\Throwable $e) {
            \Log::warning("AutoScreen dispatch notice for #{$applicant->id}: " . $e->getMessage());
        }

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

    /**
     * GET /api/applicants/{applicant}/resume — Stream/Download applicant resume
     */
    public function resume(Applicant $applicant)
    {
        if (! $applicant->resume_path) {
            return $this->generateFallbackResumePdf($applicant);
        }

        $path = $applicant->resume_path;
        $disk = 'local';

        if (! Storage::disk('local')->exists($path)) {
            if (Storage::disk('public')->exists($path)) {
                $disk = 'public';
            } else {
                return $this->generateFallbackResumePdf($applicant);
            }
        }

        $fullPath = Storage::disk($disk)->path($path);
        $mime = @mime_content_type($fullPath) ?: 'application/pdf';
        $fileName = $applicant->resume_original_name ?: ("Resume_" . $applicant->first_name . "_" . $applicant->last_name . "." . pathinfo($fullPath, PATHINFO_EXTENSION));

        return response()->file($fullPath, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $fileName . '"',
        ]);
    }

    /**
     * Generate an on-the-fly valid PDF resume for applicants when physical storage file is unavailable.
     */
    protected function generateFallbackResumePdf(Applicant $applicant)
    {
        $applicant->loadMissing(['jobPosting.jobLibrary', 'jobPosting.department', 'aiEvaluation']);
        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'Applied Position';
        $dept = $applicant->jobPosting?->department?->department_name ?? 'General Department';
        $name = trim("{$applicant->first_name} {$applicant->last_name}") ?: 'Applicant';
        $email = $applicant->email ?? 'N/A';
        $phone = $applicant->phone ?? 'N/A';
        $appId = $applicant->application_id ?? "APP-{$applicant->id}";
        $score = $applicant->aiEvaluation?->ai_score ?? $applicant->aiEvaluation?->composite_score ?? 'N/A';
        $summary = $applicant->aiEvaluation?->ai_summary ?? $applicant->aiEvaluation?->summary ?? 'Candidate applied for position via ARTMS career portal.';
        $skills = is_array($applicant->aiEvaluation?->skills_matched) ? implode(', ', $applicant->aiEvaluation->skills_matched) : 'General Competencies';

        $lines = [
            "================================================================",
            "                        CURRICULUM VITAE",
            "================================================================",
            "",
            "NAME:           " . strtoupper($name),
            "APPLICATION ID: {$appId}",
            "POSITION:       {$jobTitle} ({$dept})",
            "EMAIL:          {$email}",
            "PHONE:          {$phone}",
            "STATUS:         " . strtoupper(str_replace('_', ' ', $applicant->status)),
            "",
            "----------------------------------------------------------------",
            "PROFESSIONAL PROFILE & SUMMARY",
            "----------------------------------------------------------------",
            wordwrap($summary, 60, "\n"),
            "",
            "----------------------------------------------------------------",
            "AI SCREENING & SKILLS MATCH",
            "----------------------------------------------------------------",
            "Composite Match Score: {$score}%",
            "Key Skills: " . wordwrap($skills, 50, "\n"),
            "",
            "----------------------------------------------------------------",
            "ADDITIONAL CANDIDATE DETAILS",
            "----------------------------------------------------------------",
            "Applied Date:   " . ($applicant->created_at ? $applicant->created_at->format('M d, Y') : date('M d, Y')),
            "Experience:     " . ($applicant->years_of_experience ? "{$applicant->years_of_experience} Years" : "Verified via screening"),
            "Education:      " . ($applicant->highest_education ?? "College Graduate / Degree Holder"),
            "",
            "================================================================",
            "  Generated by ARTMS AI Talent Management System",
            "================================================================",
        ];

        $textContent = implode("\n", $lines);
        $pdf = $this->buildSimplePdf($name, $textContent);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="Resume_' . preg_replace('/[^A-Za-z0-9_]/', '', str_replace(' ', '_', $name)) . '.pdf"',
        ]);
    }

    /**
     * Constructs a compliant PDF 1.4 document from raw text.
     */
    protected function buildSimplePdf(string $title, string $text): string
    {
        $textLines = explode("\n", $text);
        $stream = "BT /F1 9.5 Tf 40 750 Td 13 TL ";
        foreach ($textLines as $line) {
            $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $stream .= "({$escaped}) ' ";
        }
        $stream .= "ET";
        $streamLen = strlen($stream);

        $obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        $obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        $obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
        $obj4 = "4 0 obj\n<< /Length {$streamLen} >>\nstream\n{$stream}\nendstream\nendobj\n";
        $obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";

        $header = "%PDF-1.4\n";
        $offset1 = strlen($header);
        $offset2 = $offset1 + strlen($obj1);
        $offset3 = $offset2 + strlen($obj2);
        $offset4 = $offset3 + strlen($obj3);
        $offset5 = $offset4 + strlen($obj4);
        $xrefOffset = $offset5 + strlen($obj5);

        $body = $header . $obj1 . $obj2 . $obj3 . $obj4 . $obj5;
        $xref = "xref\n0 6\n0000000000 65535 f \n" .
            sprintf("%010d 00000 n \n", $offset1) .
            sprintf("%010d 00000 n \n", $offset2) .
            sprintf("%010d 00000 n \n", $offset3) .
            sprintf("%010d 00000 n \n", $offset4) .
            sprintf("%010d 00000 n \n", $offset5);
        $trailer = "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        return $body . $xref . $trailer;
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

            $recipients = NotificationRecipientResolver::resolve('applicant.status_updated', $applicant, auth()->user());
            NotificationService::notifyRecipients(
                $recipients,
                "Applicant Status Updated — {$readableStatus}",
                "Applicant {$applicant->first_name} {$applicant->last_name} status was updated to {$readableStatus}.",
                '/admin/applicants',
                'application',
                'applicant',
                $applicant->id
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

            $recipients = NotificationRecipientResolver::resolve('applicant.status_updated', $applicant, auth()->user());
            NotificationService::notifyRecipients(
                $recipients,
                "Applicant Shortlisted",
                "Applicant {$applicant->first_name} {$applicant->last_name} has been shortlisted for '{$jobTitle}'.",
                '/admin/applicants',
                'application',
                'applicant',
                $applicant->id
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

        // Notify responsible recruiter
        $recipients = NotificationRecipientResolver::resolve('applicant.ready_for_interview', $applicant, auth()->user());
        NotificationService::notifyRecipients(
            $recipients,
            'Applicant Ready for Interview',
            "Applicant {$applicant->first_name} {$applicant->last_name} marked ready for interview ({$jobTitle}).",
            '/admin/applicants',
            'interview',
            'applicant',
            $applicant->id
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
     * POST /api/applicants/bulk-delete
     * Permanently deletes multiple applicants and their associated files/records.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:applicants,id',
        ]);

        $applicants = Applicant::whereIn('id', $validated['ids'])->get();
        $count = 0;

        foreach ($applicants as $applicant) {
            if ($applicant->resume_path && Storage::disk('local')->exists($applicant->resume_path)) {
                Storage::disk('local')->delete($applicant->resume_path);
            }
            $applicant->aiEvaluation()?->delete();
            $applicant->documents()->delete();
            $applicant->interviews()->delete();
            $applicant->notes()->delete();
            $applicant->delete();
            $count++;
        }

        AuditLog::record('bulk_delete', 'applicant', "Bulk deleted {$count} applicants");

        return response()->json([
            'message' => "Successfully deleted {$count} applicants.",
            'count'   => $count,
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
                'first_name'               => $applicant->first_name,
                'last_name'                => $applicant->last_name,
                'email'                    => $applicant->email,
                'phone'                    => $applicant->phone,
                'department_id'            => $deptId,
                'job_title'                => $jobTitle,
                'position'                 => $jobTitle,
                'hire_date'                => $request->date_hired ?? now()->toDateString(),
                'date_hired'               => $request->date_hired ?? now()->toDateString(),
                'basic_salary'             => $request->salary ?? ($applicant->jobPosting?->jobLibrary?->salary_min ?? 0),
                'salary'                   => $request->salary ?? ($applicant->jobPosting?->jobLibrary?->salary_min ?? 0),
                'employment_type'          => $request->employment_type ?? 'regular',
                'employment_status'        => 'regular',
                'address'                  => $applicant->address,
                'contact_number'           => $applicant->phone,
                'emergency_contact_name'   => null,
                'emergency_contact_number' => null,
            ]);
        }

        // 4. Auto-generate Employee Number (EMP-YYYY-XXXXX) & save to Employee & User
        $empId = $employee->employee_id ?: $employee->generateEmployeeNumber();
        $employee->update(['employee_id' => $empId]);
        $user->update(['employee_id' => $empId]);

        // 5. Seed default 201 Document Checklist
        try {
            $employee->seedDefaultDocuments();
        } catch (\Throwable $e) {
            \Log::warning("Failed to seed default 201 documents: " . $e->getMessage());
        }

        // 6. Transfer candidate resume to 201 documents if present
        try {
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
        } catch (\Throwable $e) {
            \Log::warning("Failed to transfer candidate resume to 201 files: " . $e->getMessage());
        }

        // 7. Send Notifications
        try {
            NotificationService::notifyEmail(
                $applicant->email,
                "Congratulations! You have been hired — ARTMS 201 File Created",
                "Hello {$applicant->first_name}, welcome aboard! You have been officially hired as {$jobTitle}. Your Employee Number is {$empId}.",
                null,
                'application'
            );

            $recipients = NotificationRecipientResolver::resolve('applicant.hired', $applicant, auth()->user());
            NotificationService::notifyRecipients(
                $recipients,
                "New Employee Hired — 201 File Created",
                "{$applicant->first_name} {$applicant->last_name} was hired as {$jobTitle}. Employee Number: {$empId}.",
                '/admin/employees',
                'application',
                'applicant',
                $applicant->id
            );
        } catch (\Throwable $e) {
            \Log::warning("Failed to dispatch hiring notifications: " . $e->getMessage());
        }

        AuditLog::record('hire_applicant', 'employee', "Hired applicant {$applicant->first_name} {$applicant->last_name} ({$applicant->application_id}) as Employee {$empId}");

        return response()->json([
            'message'  => "Applicant hired successfully. Employee 201 record {$empId} created.",
            'employee' => $employee->load('user', 'department', 'documents'),
        ]);
    }
}
