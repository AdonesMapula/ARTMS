<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\JobLibrary;
use App\Services\NotificationRecipientResolver;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobLibraryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $jobs = JobLibrary::with('creator', 'approver')
            ->when($request->search, fn ($q) =>
                $q->where('job_title', 'like', "%{$request->search}%")
                  ->orWhere('job_category', 'like', "%{$request->search}%")
            )
            ->when($request->approval_status, function ($q) use ($request) {
                if ($request->approval_status === 'resubmitted') {
                    $q->where('approval_status', 'pending')
                      ->whereNotNull('approval_remarks');
                } else if ($request->approval_status === 'new_pending') {
                    $q->where('approval_status', 'pending')
                      ->whereNull('approval_remarks');
                } else if ($request->approval_status === 'pending') {
                    $q->where('approval_status', 'pending');
                } else if ($request->approval_status === 'revised' || $request->approval_status === 'needs_revision') {
                    $q->whereIn('approval_status', ['revised', 'needs_revision']);
                } else {
                    $q->where('approval_status', $request->approval_status);
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 100);

        return response()->json($jobs);
    }

    /**
     * GET /api/job-library/approved — COO-approved, active jobs for PRF dropdowns
     */
    public function approved(): JsonResponse
    {
        $jobs = JobLibrary::where('approval_status', 'approved')
            ->where('is_active', true)
            ->orderBy('job_title')
            ->get([
                'id', 'job_title', 'job_category', 'employment_type',
                'qualifications', 'responsibilities', 'job_description',
                'salary_min', 'salary_max',
            ]);

        return response()->json(['data' => $jobs]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_title'        => ['required', 'string', 'max:255'],
            'job_description'  => ['required', 'string'],
            'qualifications'   => ['required', 'array'],
            'responsibilities' => ['required', 'array'],
            'job_category'     => ['nullable', 'string'],
            'employment_type'  => ['nullable', 'string'],
            'salary_type'      => ['nullable', 'in:exact,range'],
            'salary_min'       => ['nullable', 'numeric', 'min:0'],
            'salary_max'       => ['nullable', 'numeric', 'gte:salary_min'],
        ]);

        $data['created_by']      = auth()->id();
        $data['approval_status'] = 'pending';

        $job = JobLibrary::create($data);
        AuditLog::record('create', 'job_library', "Created job: {$job->job_title}");

        // Dispatch notifications to COO & SuperAdmin
        $recipients = NotificationRecipientResolver::resolve('job_library.created', $job, auth()->user());
        NotificationService::notifyRecipients(
            $recipients,
            'Job Template Approval Needed',
            "New job template '{$job->job_title}' is pending approval.",
            '/coo/job-library-approvals',
            'request',
            'job_library',
            $job->id
        );

        return response()->json(['message' => 'Job created. Awaiting COO approval.', 'job' => $job], 201);
    }

    public function show(JobLibrary $jobLibrary): JsonResponse
    {
        return response()->json(['job' => $jobLibrary->load('creator', 'approver', 'jobPostings')]);
    }

    public function update(Request $request, JobLibrary $jobLibrary): JsonResponse
    {
        $data = $request->validate([
            'job_title'        => ['sometimes', 'string', 'max:255'],
            'job_description'  => ['sometimes', 'string'],
            'job_category'     => ['sometimes', 'nullable', 'string'],
            'employment_type'  => ['sometimes', 'nullable', 'string'],
            'qualifications'   => ['sometimes', 'array'],
            'responsibilities' => ['sometimes', 'array'],
            'salary_type'      => ['sometimes', 'in:exact,range'],
            'salary_min'       => ['nullable', 'numeric'],
            'salary_max'       => ['nullable', 'numeric'],
            'hr_remarks'       => ['nullable', 'string'],
        ]);

        $old = $jobLibrary->toArray();
        $wasNeedsRevision = in_array($jobLibrary->approval_status, ['revised', 'needs_revision', 'rejected']);

        if ($wasNeedsRevision) {
            $data['approval_status'] = 'pending';
            if ($request->has('hr_remarks') && !empty($request->hr_remarks)) {
                $oldRemarks = $jobLibrary->approval_remarks ? trim(str_replace('[COO Requested]:', '', explode('| [HR Updated]:', $jobLibrary->approval_remarks)[0])) : "No remarks";
                $data['approval_remarks'] = "[COO Requested]: " . $oldRemarks . " | [HR Updated]: " . $request->hr_remarks;
            }
        }

        $jobLibrary->update($data);

        if ($wasNeedsRevision) {
            $recipients = NotificationRecipientResolver::resolve('job_library.revised', $jobLibrary, auth()->user());
            NotificationService::notifyRecipients(
                $recipients,
                'Revised Job Template Resubmitted',
                "Job template '{$jobLibrary->job_title}' was revised by HR and resubmitted for COO approval.",
                '/coo/job-library-approvals',
                'request',
                'job_library',
                $jobLibrary->id
            );
        }

        AuditLog::record('update', 'job_library', "Updated job: {$jobLibrary->job_title}" . ($wasNeedsRevision ? " (Resubmitted for COO approval)" : ""), $old, $jobLibrary->fresh()->toArray());

        $msg = $wasNeedsRevision ? 'Job entry updated and resubmitted to COO for approval.' : 'Job updated.';

        return response()->json(['message' => $msg, 'job' => $jobLibrary->fresh()]);
    }

    public function destroy(JobLibrary $jobLibrary): JsonResponse
    {
        if ($jobLibrary->jobPostings()->exists()) {
            return response()->json(['message' => 'Cannot delete job with existing postings.'], 409);
        }

        AuditLog::record('delete', 'job_library', "Deleted job: {$jobLibrary->job_title}");
        $jobLibrary->delete();

        return response()->json(['message' => 'Job deleted.']);
    }

    /**
     * POST /api/job-library/bulk-delete
     * Permanently deletes multiple job library templates by ID.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:job_libraries,id',
        ]);

        $jobs = JobLibrary::whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($jobs as $job) {
            if ($job->jobPostings()->exists()) {
                $skippedCount++;
                continue;
            }
            $job->delete();
            $deletedCount++;
        }

        AuditLog::record('bulk_delete', 'job_library', "Bulk deleted {$deletedCount} job templates (skipped {$skippedCount})");

        $message = "Successfully deleted {$deletedCount} job templates.";
        if ($skippedCount > 0) {
            $message .= " {$skippedCount} templates were skipped because they are associated with existing job postings.";
        }

        return response()->json([
            'message' => $message,
            'count'   => $deletedCount,
            'skipped' => $skippedCount,
        ]);
    }

    /**
     * PATCH /api/job-library/{id}/approve  — COO only
     */
    public function approve(Request $request, JobLibrary $jobLibrary): JsonResponse
    {
        $data = $request->validate([
            'status'           => ['required', 'in:approved,rejected,revised,needs_revision'],
            'remarks'          => ['nullable', 'string'],
            'approval_remarks' => ['nullable', 'string'],
        ]);

        $remarks = $data['remarks'] ?? $data['approval_remarks'] ?? null;
        $finalStatus = in_array($data['status'], ['revised', 'needs_revision']) ? 'revised' : $data['status'];

        $jobLibrary->update([
            'approval_status'  => $finalStatus,
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $remarks,
        ]);

        AuditLog::record('approve', 'job_library', "Job {$finalStatus}: {$jobLibrary->job_title}");

        $statusText = strtoupper($finalStatus);
        $title = $finalStatus === 'revised' ? "Job Template Marked for Revision" : "Job Template {$statusText}";
        $remarksMsg = $remarks ? " Remarks: {$remarks}" : "";
        $msg = $finalStatus === 'revised' 
            ? "Job template '{$jobLibrary->job_title}' requires REVISION per COO comments.{$remarksMsg}"
            : "Job template '{$jobLibrary->job_title}' was {$statusText} by COO.";

        $recipients = NotificationRecipientResolver::resolve('job_library.approved', $jobLibrary, auth()->user());
        NotificationService::notifyRecipients(
            $recipients,
            $title,
            $msg,
            '/admin/job-library',
            'alert',
            'job_library',
            $jobLibrary->id
        );

        return response()->json(['message' => "Job entry marked as {$finalStatus}.", 'job' => $jobLibrary->fresh()]);
    }
}
