<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ManpowerRequest;
use App\Services\NotificationService;
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
            'justification'      => ['nullable', 'string'],
            'qualifications'     => ['nullable', 'array'],
            'responsibilities'   => ['nullable', 'array'],
            'needed_by'          => ['nullable', 'date'],
            'urgency'            => ['required', 'in:low,medium,high,critical'],
            'fit_threshold_high' => ['nullable', 'integer', 'min:0', 'max:100'],
            'fit_threshold_medium' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $data['department_id'] = $request->user()->department_id;
        $data['requested_by']  = auth()->id();

        $req = ManpowerRequest::create($data);
        AuditLog::record('create', 'manpower_request', "Manpower request created for {$data['position_needed']}");

        // Dispatch real-time in-app + email notifications to COO & SuperAdmin
        $deptName = $req->department?->department_name ?? 'Department';
        NotificationService::notifyRoles(
            ['coo', 'super_admin'],
            'New PRF Request Pending Approval',
            "{$deptName} requested {$req->headcount}x {$req->position_needed} (Urgency: " . ucfirst($req->urgency) . ").",
            '/coo/prf-approvals',
            'request'
        );

        return response()->json(['message' => 'Manpower request submitted.', 'request' => $req], 201);
    }

    public function show(ManpowerRequest $manpowerRequest): JsonResponse
    {
        return response()->json(['request' => $manpowerRequest->load('department', 'requester', 'jobLibrary', 'approver')]);
    }

    public function update(Request $request, ManpowerRequest $manpowerRequest): JsonResponse
    {
        if (!in_array($manpowerRequest->status, ['pending', 'revised', 'needs_revision'])) {
            return response()->json(['message' => 'Only pending or revised requests can be edited.'], 409);
        }

        $data = $request->validate([
            'position_needed' => ['sometimes', 'string'],
            'headcount'       => ['sometimes', 'integer'],
            'justification'   => ['sometimes', 'nullable', 'string'],
            'qualifications'  => ['nullable', 'array'],
            'responsibilities'=> ['nullable', 'array'],
            'needed_by'       => ['nullable', 'date'],
            'urgency'         => ['sometimes', 'in:low,medium,high,critical'],
        ]);

        $wasRevised = in_array($manpowerRequest->status, ['revised', 'needs_revision']);

        if ($wasRevised) {
            $data['status'] = 'pending';
            $data['approval_remarks'] = null;
        }

        $manpowerRequest->update($data);

        if ($wasRevised) {
            NotificationService::notifyRoles(
                ['coo', 'super_admin'],
                'Revised PRF Resubmitted',
                "Manpower request for '{$manpowerRequest->position_needed}' was revised by HR and resubmitted for COO approval.",
                '/coo/prf-approvals',
                'request'
            );
            AuditLog::record('update', 'manpower_request', "Revised PRF ID {$manpowerRequest->id} resubmitted for COO approval");
        }

        $msg = $wasRevised ? 'Request revised and resubmitted to COO for approval.' : 'Request updated.';

        return response()->json(['message' => $msg, 'request' => $manpowerRequest->fresh()]);
    }

    public function destroy(ManpowerRequest $manpowerRequest): JsonResponse
    {
        // Allow deletion of pending/revised/rejected requests without restriction if no job postings exist
        if ($manpowerRequest->jobPostings()->exists()) {
            return response()->json([
                'message' => 'Cannot delete this PRF. It has been used to create job postings. Please delete the associated job postings first.'
            ], 409);
        }

        $statusName = $manpowerRequest->status;
        $manpowerRequest->delete();
        AuditLog::record('delete', 'manpower_request', "PRF deleted: {$manpowerRequest->position_needed} (Status: {$statusName})");

        return response()->json(['message' => 'Request deleted.']);
    }

    /**
     * DELETE /api/manpower-requests/clean-rejected
     * Clean up / delete all rejected manpower requests.
     */
    public function cleanRejected(): JsonResponse
    {
        $count = ManpowerRequest::where('status', 'rejected')->delete();
        AuditLog::record('clean_rejected', 'manpower_request', "Cleaned up {$count} rejected manpower request(s)");
        return response()->json(['message' => "Successfully cleaned up {$count} rejected request(s).", 'deleted_count' => $count]);
    }

    /**
     * PATCH /api/manpower-requests/{id}/approve
     */
    public function approve(Request $request, ManpowerRequest $manpowerRequest): JsonResponse
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
            'status'           => $finalStatus,
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $remarks,
        ];

        if (array_key_exists('qualifications', $data)) {
            $updateData['qualifications'] = $data['qualifications'];
        }
        if (array_key_exists('responsibilities', $data)) {
            $updateData['responsibilities'] = $data['responsibilities'];
        }

        $manpowerRequest->update($updateData);

        AuditLog::record('approve', 'manpower_request', "Request {$finalStatus} ID {$manpowerRequest->id}");

        $position = $manpowerRequest->position_needed;
        $remarksMsg = $remarks ? " Remarks: {$remarks}" : "";

        if ($finalStatus === 'approved') {
            if ($manpowerRequest->requester) {
                NotificationService::notifyUser(
                    $manpowerRequest->requester,
                    "PRF Request Approved by COO",
                    "Your manpower request for '{$position}' was APPROVED by COO. Ready for job posting.",
                    '/department-head/request-history',
                    'alert'
                );
            }
            NotificationService::notifyRoles(
                ['hr_admin', 'super_admin'],
                "PRF Approved by COO",
                "Requisition for '{$position}' was APPROVED by COO. You can now create a job posting.",
                '/admin/job-posting',
                'alert'
            );
        } elseif ($finalStatus === 'revised') {
            if ($manpowerRequest->requester) {
                NotificationService::notifyUser(
                    $manpowerRequest->requester,
                    "PRF Marked for Revision by COO",
                    "Your manpower request for '{$position}' requires REVISION per COO comments.{$remarksMsg}",
                    '/department-head/request-history',
                    'alert'
                );
            }
            NotificationService::notifyRoles(
                ['hr_admin', 'super_admin'],
                "PRF Marked for Revision by COO",
                "Requisition for '{$position}' requires REVISION per COO comments.{$remarksMsg} You may edit and resubmit.",
                '/admin/manpower-requests',
                'alert'
            );
        } else {
            if ($manpowerRequest->requester) {
                NotificationService::notifyUser(
                    $manpowerRequest->requester,
                    "PRF Request Rejected by COO",
                    "Your manpower request for '{$position}' was REJECTED by COO.{$remarksMsg}",
                    '/department-head/request-history',
                    'alert'
                );
            }
        }

        return response()->json(['message' => "Request marked as {$finalStatus}.", 'request' => $manpowerRequest->fresh()]);
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
