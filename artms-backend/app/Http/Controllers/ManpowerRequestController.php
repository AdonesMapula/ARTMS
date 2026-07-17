<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ManpowerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManpowerRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $requests = ManpowerRequest::with(['department', 'requester', 'jobLibrary', 'approver'])
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when(
                $request->user()->isDepartmentHead(),
                fn ($q) => $q->where('department_id', $request->user()->department_id)
            )
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($requests);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_library_id'     => ['nullable', 'exists:job_library,id'],
            'position_needed'    => ['required', 'string'],
            'headcount'          => ['required', 'integer', 'min:1'],
            'justification'      => ['required', 'string'],
            'needed_by'          => ['nullable', 'date'],
            'urgency'            => ['required', 'in:low,medium,high,critical'],
            'fit_threshold_high' => ['nullable', 'integer', 'min:0', 'max:100'],
            'fit_threshold_medium' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $data['department_id'] = $request->user()->department_id;
        $data['requested_by']  = auth()->id();

        $req = ManpowerRequest::create($data);
        AuditLog::record('create', 'manpower_request', "Manpower request created for {$data['position_needed']}");

        return response()->json(['message' => 'Manpower request submitted.', 'request' => $req], 201);
    }

    public function show(ManpowerRequest $manpowerRequest): JsonResponse
    {
        return response()->json(['request' => $manpowerRequest->load('department', 'requester', 'jobLibrary', 'approver')]);
    }

    public function update(Request $request, ManpowerRequest $manpowerRequest): JsonResponse
    {
        if ($manpowerRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be edited.'], 409);
        }

        $data = $request->validate([
            'position_needed' => ['sometimes', 'string'],
            'headcount'       => ['sometimes', 'integer'],
            'justification'   => ['sometimes', 'string'],
            'needed_by'       => ['nullable', 'date'],
            'urgency'         => ['sometimes', 'in:low,medium,high,critical'],
        ]);

        $manpowerRequest->update($data);

        return response()->json(['message' => 'Request updated.', 'request' => $manpowerRequest->fresh()]);
    }

    public function destroy(ManpowerRequest $manpowerRequest): JsonResponse
    {
        if ($manpowerRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be deleted.'], 409);
        }

        $manpowerRequest->delete();

        return response()->json(['message' => 'Request deleted.']);
    }

    /**
     * PATCH /api/manpower-requests/{id}/approve
     */
    public function approve(Request $request, ManpowerRequest $manpowerRequest): JsonResponse
    {
        $data = $request->validate([
            'status'  => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $manpowerRequest->update([
            'status'           => $data['status'],
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $data['remarks'],
        ]);

        AuditLog::record('approve', 'manpower_request', "Request {$data['status']} ID {$manpowerRequest->id}");

        return response()->json(['message' => "Request {$data['status']}.", 'request' => $manpowerRequest->fresh()]);
    }

    /**
     * GET /api/manpower-requests/approved-for-posting
     * Returns approved PRFs that haven't been converted to job postings yet
     */
    public function approvedForPosting(Request $request): JsonResponse
    {
        $requests = ManpowerRequest::with(['department', 'requester', 'jobLibrary', 'approver'])
            ->where('status', 'approved')
            ->whereDoesntHave('jobPostings')
            ->orderBy('approved_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($requests);
    }
}
