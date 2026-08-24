<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\JobPosting;
use App\Services\Cache\BootCacheService;
use App\Services\Cache\CacheKeyService;
use App\Services\Cache\CacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobPostingController extends Controller
{
    protected CacheService $cache;
    protected BootCacheService $bootCache;

    public function __construct(CacheService $cache, BootCacheService $bootCache)
    {
        $this->cache = $cache;
        $this->bootCache = $bootCache;
    }

    public function index(Request $request): JsonResponse
    {
        $postings = JobPosting::with(['jobLibrary', 'department', 'requester'])
            ->when($request->search, fn ($q) =>
                $q->whereHas('jobLibrary', fn ($j) =>
                    $j->where('job_title', 'like', "%{$request->search}%")
                )
            )
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->approval_status, fn ($q) => $q->where('approval_status', $request->approval_status))
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
        $params = $request->only(['page', 'per_page', 'search', 'department_id']);
        $cacheKey = CacheKeyService::make('job-postings', 'public:' . CacheKeyService::hashParams($params));

        $postings = $this->cache->remember($cacheKey, 180, function () use ($request) {
            return JobPosting::with(['jobLibrary', 'department'])
                ->where('is_published', true)
                ->where('status', 'published')
                ->where(fn ($q) => $q->whereNull('closing_date')->orWhere('closing_date', '>=', today()))
                ->orderBy('posting_date', 'desc')
                ->paginate($request->per_page ?? 12);
        });

        return response()->json($postings);
    }

    protected function invalidatePostingCaches(): void
    {
        try {
            $this->bootCache->invalidateAllBootCache();
            $this->cache->flushTag('job_postings');
        } catch (\Throwable $e) {
            \Log::warning("Posting cache invalidation notice: " . $e->getMessage());
        }
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_library_id'       => ['nullable', 'exists:job_library,id'],
            'department_id'        => ['required', 'exists:departments,id'],
            'manpower_request_id'  => ['nullable', 'exists:manpower_requests,id'],
            'vacancies_count'      => ['required', 'integer', 'min:1'],
            'location'             => ['nullable', 'string'],
            'description'          => ['nullable', 'string'],
            'posting_date'         => ['nullable', 'date'],
            'closing_date'         => ['nullable', 'date', 'after:posting_date'],
            'qualifications'       => ['nullable', 'array'],
            'responsibilities'     => ['nullable', 'array'],
            'is_modified_from_prf' => ['boolean'],
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
        $data['approval_status'] = 'approved';
        $data['status']          = 'published';
        $data['is_published']    = true;
        $data['approved_by']     = auth()->id();
        $data['approved_at']     = now();
        $data['posting_date']    = now();
        $data['is_modified_from_prf'] = false;

        // Check if an active published posting for this job library position & department already exists
        $existing = JobPosting::where('job_library_id', $data['job_library_id'])
            ->where('department_id', $data['department_id'])
            ->where('status', 'published')
            ->whereNotIn('status', ['closed', 'cancelled'])
            ->first();

        if ($existing) {
            $previousVacancies = (int) $existing->vacancies_count;
            $additionalVacancies = (int) $data['vacancies_count'];
            $newTotalVacancies = $previousVacancies + $additionalVacancies;

            $updatePayload = [
                'vacancies_count' => $newTotalVacancies,
            ];

            if (!empty($data['location'])) {
                $updatePayload['location'] = $data['location'];
            }
            if (!empty($data['closing_date'])) {
                $updatePayload['closing_date'] = $data['closing_date'];
            }
            if (!empty($data['description'])) {
                $updatePayload['description'] = $data['description'];
            }

            $existing->update($updatePayload);

            // Link this PRF to the existing Job Posting
            if (!empty($data['manpower_request_id'])) {
                \App\Models\ManpowerRequest::where('id', $data['manpower_request_id'])->update([
                    'job_posting_id' => $existing->id
                ]);
            }

            AuditLog::record('update', 'job_posting', "Added {$additionalVacancies} vacancies from PRF-{$data['manpower_request_id']} to Job Posting ID {$existing->id} (Total: {$newTotalVacancies})");

            return response()->json([
                'message' => "Added {$additionalVacancies} vacancies to existing active job posting. (Total Vacancies: {$newTotalVacancies})",
                'posting' => $existing->fresh(['jobLibrary', 'department', 'requester']),
                'merged'  => true,
            ], 200);
        }

        $posting = JobPosting::create($data);

        // Link this PRF to the newly created Job Posting
        if (!empty($data['manpower_request_id'])) {
            \App\Models\ManpowerRequest::where('id', $data['manpower_request_id'])->update([
                'job_posting_id' => $posting->id
            ]);
        }

        $this->invalidatePostingCaches();
        AuditLog::record('create', 'job_posting', "Created job posting ID {$posting->id}");

        return response()->json([
            'message' => 'Job posting was successfully created and published.',
            'posting' => $posting->fresh(['jobLibrary', 'department', 'requester']),
            'merged'  => false,
        ], 201);
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
            'vacancies_count'      => ['sometimes', 'integer', 'min:1'],
            'closing_date'         => ['nullable', 'date'],
            'location'             => ['nullable', 'string'],
            'description'          => ['nullable', 'string'],
            'qualifications'       => ['nullable', 'array'],
            'responsibilities'     => ['nullable', 'array'],
            'is_modified_from_prf' => ['boolean'],
        ]);

        $jobPosting->update($data);
        $this->invalidatePostingCaches();

        return response()->json(['message' => 'Job posting updated successfully.', 'posting' => $jobPosting->fresh()]);
    }

    public function destroy(JobPosting $jobPosting): JsonResponse
    {
        if ($jobPosting->applicants()->exists()) {
            return response()->json(['message' => 'Cannot delete posting with existing applicants.'], 409);
        }

        AuditLog::record('delete', 'job_posting', "Deleted job posting ID {$jobPosting->id}");
        $jobPosting->delete();
        $this->invalidatePostingCaches();

        return response()->json(['message' => 'Job posting deleted.']);
    }

    /**
     * POST /api/job-postings/bulk-delete
     * Permanently deletes multiple job postings by ID.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:job_postings,id',
        ]);

        $postings = JobPosting::whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($postings as $posting) {
            // If posting has active applicants, skip or delete based on policy
            if ($posting->applicants()->exists()) {
                $skippedCount++;
                continue;
            }
            $posting->delete();
            $deletedCount++;
        }

        $this->invalidatePostingCaches();
        AuditLog::record('bulk_delete', 'job_posting', "Bulk deleted {$deletedCount} job postings (skipped {$skippedCount})");

        $message = "Successfully deleted {$deletedCount} job postings.";
        if ($skippedCount > 0) {
            $message .= " {$skippedCount} postings were skipped because they contain active applicants.";
        }

        return response()->json([
            'message' => $message,
            'count'   => $deletedCount,
            'skipped' => $skippedCount,
        ]);
    }

    /**
     * PATCH /api/job-postings/{id}/approve  — COO only
     */
    public function approve(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $data = $request->validate([
            'status'           => ['required', 'in:approved,rejected,revised,needs_revision'],
            'remarks'          => ['nullable', 'string'],
            'approval_remarks' => ['nullable', 'string'],
            'qualifications'   => ['nullable', 'array'],
            'responsibilities' => ['nullable', 'array'],
        ]);

        $remarks = $data['remarks'] ?? $data['approval_remarks'] ?? null;
        $finalStatus = in_array($data['status'], ['revised', 'needs_revision']) ? 'revised' : $data['status'];

        $updateData = [
            'approval_status'  => $finalStatus,
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $remarks,
            'status'           => $finalStatus === 'approved' ? 'published' : ($finalStatus === 'revised' ? 'pending_approval' : 'cancelled'),
            'is_published'     => $finalStatus === 'approved',
            'posting_date'     => $finalStatus === 'approved' ? today() : null,
        ];

        if ($request->has('qualifications')) {
            $updateData['qualifications'] = $data['qualifications'];
        }
        if ($request->has('responsibilities')) {
            $updateData['responsibilities'] = $data['responsibilities'];
        }

        $jobPosting->update($updateData);
        $this->invalidatePostingCaches();

        AuditLog::record('approve', 'job_posting', "Job posting {$finalStatus} ID {$jobPosting->id}");

        $position = $jobPosting->job_title;
        $remarksMsg = $remarks ? " Remarks: {$remarks}" : "";

        if ($finalStatus === 'revised') {
            NotificationService::notifyEvent(
                'job_posting.approved',
                $jobPosting,
                $request->user(),
                "Job Posting Marked for Revision",
                "Job posting for '{$position}' requires REVISION per COO comments.{$remarksMsg} Please edit and resubmit.",
                '/admin/job-posting',
                'alert'
            );
        } elseif ($finalStatus === 'approved') {
            NotificationService::notifyEvent(
                'job_posting.approved',
                $jobPosting,
                $request->user(),
                "Job Posting Approved by COO",
                "Job posting for '{$position}' was APPROVED by COO and is now live.",
                '/admin/job-posting',
                'alert'
            );
        }

        return response()->json(['message' => "Job posting marked as {$finalStatus}.", 'posting' => $jobPosting->fresh()]);
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
        $this->invalidatePostingCaches();

        $state = $jobPosting->is_published ? 'published' : 'unpublished';

        return response()->json(['message' => "Job posting {$state}."]);
    }
}
