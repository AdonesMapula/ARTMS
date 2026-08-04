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
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->job_posting_id, fn ($q) => $q->where('job_posting_id', $request->job_posting_id))
            ->when($request->is_shortlisted, fn ($q) => $q->where('is_shortlisted', true))
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
     * PATCH /api/applicants/{id}/hire
     */
    public function hire(Applicant $applicant): JsonResponse
    {
        $applicant->update(['status' => 'hired']);
        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title ?? 'the position';

        // Notify applicant
        NotificationService::notifyEmail(
            $applicant->email,
            'Congratulations! Job Offer — ARTMS',
            "Hello {$applicant->first_name}, congratulations! We are pleased to extend a job offer for {$jobTitle}.",
            null,
            'alert'
        );

        // Notify HR & Admins
        NotificationService::notifyRoles(
            ['hr_admin', 'super_admin', 'coo'],
            'Applicant Hired',
            "Applicant {$applicant->first_name} {$applicant->last_name} was officially HIRED for '{$jobTitle}'.",
            '/admin/applicants',
            'alert'
        );

        AuditLog::record('hire', 'applicant', "Applicant hired: {$applicant->application_id}");

        return response()->json(['message' => 'Applicant marked as hired. Email notification sent.']);
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
}
