<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobPostingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $postings = JobPosting::with(['jobLibrary', 'department', 'requester'])
            ->when($request->search, fn ($q) =>
                $q->whereHas('jobLibrary', fn ($j) =>
                    $j->where('job_title', 'like', "%{$request->search}%")
                )
            )
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($postings);
    }

    /**
     * GET /api/job-postings/public — for the public job listing page
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $postings = JobPosting::with(['jobLibrary', 'department'])
            ->where('is_published', true)
            ->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('closing_date')->orWhere('closing_date', '>=', today()))
            ->orderBy('posting_date', 'desc')
            ->paginate($request->per_page ?? 12);

        return response()->json($postings);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_library_id'      => ['nullable', 'exists:job_library,id'],
            'department_id'       => ['required', 'exists:departments,id'],
            'manpower_request_id' => ['nullable', 'exists:manpower_requests,id'],
            'vacancies_count'     => ['required', 'integer', 'min:1'],
            'location'            => ['nullable', 'string'],
            'description'         => ['nullable', 'string'],
            'posting_date'        => ['nullable', 'date'],
            'closing_date'        => ['nullable', 'date', 'after:posting_date'],
        ]);

        // If job_library_id is null but manpower_request_id is provided, 
        // try to use the job_library_id from the manpower request
        if (!isset($data['job_library_id']) && isset($data['manpower_request_id'])) {
            $manpowerRequest = \App\Models\ManpowerRequest::find($data['manpower_request_id']);
            if ($manpowerRequest && $manpowerRequest->job_library_id) {
                $data['job_library_id'] = $manpowerRequest->job_library_id;
            }
        }

        // If still no job_library_id, return validation error
        if (!isset($data['job_library_id']) || !$data['job_library_id']) {
            return response()->json([
                'message' => 'Job posting requires a job title from the Job Library. Please select a job title first.',
                'errors' => ['job_library_id' => ['The job library id field is required.']]
            ], 422);
        }

        $data['requested_by']    = auth()->id();
        $data['approval_status'] = 'pending';
        $data['status']          = 'pending_approval';

        $posting = JobPosting::create($data);
        AuditLog::record('create', 'job_posting', "Created job posting ID {$posting->id}");

        return response()->json(['message' => 'Job posting submitted for COO approval.', 'posting' => $posting], 201);
    }

    public function show(JobPosting $jobPosting): JsonResponse
    {
        return response()->json([
            'posting' => $jobPosting->load('jobLibrary', 'department', 'requester', 'approver', 'applicants'),
        ]);
    }

    public function update(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $data = $request->validate([
            'vacancies_count' => ['sometimes', 'integer', 'min:1'],
            'closing_date'    => ['nullable', 'date'],
        ]);

        $jobPosting->update($data);

        return response()->json(['message' => 'Job posting updated.', 'posting' => $jobPosting->fresh()]);
    }

    public function destroy(JobPosting $jobPosting): JsonResponse
    {
        if ($jobPosting->applicants()->exists()) {
            return response()->json(['message' => 'Cannot delete posting with existing applicants.'], 409);
        }

        AuditLog::record('delete', 'job_posting', "Deleted job posting ID {$jobPosting->id}");
        $jobPosting->delete();

        return response()->json(['message' => 'Job posting deleted.']);
    }

    /**
     * PATCH /api/job-postings/{id}/approve  — COO only
     */
    public function approve(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $data = $request->validate([
            'status'  => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $jobPosting->update([
            'approval_status'  => $data['status'],
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $data['remarks'],
            'status'           => $data['status'] === 'approved' ? 'published' : 'cancelled',
            'is_published'     => $data['status'] === 'approved',
            'posting_date'     => $data['status'] === 'approved' ? today() : null,
        ]);

        AuditLog::record('approve', 'job_posting', "Job posting {$data['status']} ID {$jobPosting->id}");

        return response()->json(['message' => "Job posting {$data['status']}.", 'posting' => $jobPosting->fresh()]);
    }

    /**
     * PATCH /api/job-postings/{id}/toggle-publish
     */
    public function togglePublish(JobPosting $jobPosting): JsonResponse
    {
        if ($jobPosting->approval_status !== 'approved') {
            return response()->json(['message' => 'Job posting must be approved before publishing.'], 422);
        }

        $jobPosting->update([
            'is_published' => ! $jobPosting->is_published,
            'status'       => ! $jobPosting->is_published ? 'published' : 'closed',
        ]);

        $state = $jobPosting->is_published ? 'published' : 'unpublished';

        return response()->json(['message' => "Job posting {$state}."]);
    }
}
