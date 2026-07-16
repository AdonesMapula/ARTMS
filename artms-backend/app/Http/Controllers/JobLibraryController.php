<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\JobLibrary;
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
            ->when($request->approval_status, fn ($q) => $q->where('approval_status', $request->approval_status))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($jobs);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_title'        => ['required', 'string', 'max:255'],
            'job_description'  => ['required', 'string'],
            'qualifications'   => ['required', 'string'],
            'responsibilities' => ['required', 'string'],
            'job_category'     => ['nullable', 'string'],
            'employment_type'  => ['nullable', 'string'],
            'salary_min'       => ['nullable', 'numeric', 'min:0'],
            'salary_max'       => ['nullable', 'numeric', 'gte:salary_min'],
        ]);

        $data['created_by']      = auth()->id();
        $data['approval_status'] = 'pending';

        $job = JobLibrary::create($data);
        AuditLog::record('create', 'job_library', "Created job: {$job->job_title}");

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
            'qualifications'   => ['sometimes', 'string'],
            'responsibilities' => ['sometimes', 'string'],
            'salary_min'       => ['nullable', 'numeric'],
            'salary_max'       => ['nullable', 'numeric'],
        ]);

        $old = $jobLibrary->toArray();
        $jobLibrary->update($data);

        AuditLog::record('update', 'job_library', "Updated job: {$jobLibrary->job_title}", $old, $jobLibrary->fresh()->toArray());

        return response()->json(['message' => 'Job updated.', 'job' => $jobLibrary->fresh()]);
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
     * PATCH /api/job-library/{id}/approve  — COO only
     */
    public function approve(Request $request, JobLibrary $jobLibrary): JsonResponse
    {
        $data = $request->validate([
            'status'  => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $jobLibrary->update([
            'approval_status'  => $data['status'],
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $data['remarks'],
        ]);

        AuditLog::record('approve', 'job_library', "Job {$data['status']}: {$jobLibrary->job_title}");

        return response()->json(['message' => "Job {$data['status']}.", 'job' => $jobLibrary->fresh()]);
    }
}
