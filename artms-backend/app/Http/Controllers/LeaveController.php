<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\LeaveRequest;
use App\Services\NotificationRecipientResolver;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $leaves = LeaveRequest::with('employee.user', 'approver')
            ->when($request->employee_id, fn ($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->leave_type, fn ($q) => $q->where('leave_type', $request->leave_type))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($leaves);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'leave_type'  => ['required', 'in:sick,vacation,emergency,maternity,paternity,other'],
            'start_date'  => ['required', 'date', 'after_or_equal:today'],
            'end_date'    => ['required', 'date', 'after_or_equal:start_date'],
            'reason'      => ['required', 'string'],
        ]);

        $data['days_count'] = \Carbon\Carbon::parse($data['start_date'])
            ->diffInWeekdays(\Carbon\Carbon::parse($data['end_date'])) + 1;

        $leave = LeaveRequest::create($data);

        // Targeted notification to Department Head / Approver
        $recipients = NotificationRecipientResolver::resolve('leave.created', $leave, auth()->user());
        if ($recipients->isNotEmpty()) {
            $empName = $leave->employee ? "{$leave->employee->first_name} {$leave->employee->last_name}" : "An employee";
            NotificationService::notifyRecipients(
                $recipients,
                'New Leave Request Submitted',
                "{$empName} requested {$leave->days_count} day(s) of {$leave->leave_type} leave.",
                '/department-head/leaves',
                'request',
                'leave_request',
                $leave->id
            );
        }

        return response()->json(['message' => 'Leave request submitted.', 'leave' => $leave], 201);
    }

    public function show(LeaveRequest $leaveRequest): JsonResponse
    {
        return response()->json(['leave' => $leaveRequest->load('employee.user', 'approver')]);
    }

    public function update(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $data = $request->validate([
            'leave_type' => ['sometimes', 'string'],
            'start_date' => ['sometimes', 'date'],
            'end_date'   => ['sometimes', 'date'],
            'reason'     => ['sometimes', 'string'],
        ]);

        $leaveRequest->update($data);

        return response()->json(['message' => 'Leave request updated.', 'leave' => $leaveRequest->fresh()]);
    }

    /**
     * PATCH /api/leaves/{id}/approve
     */
    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $data = $request->validate([
            'status'  => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $leaveRequest->update([
            'status'           => $data['status'],
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'approval_remarks' => $data['remarks'],
        ]);

        AuditLog::record('approve', 'leave', "Leave {$data['status']} for employee ID {$leaveRequest->employee_id}");

        // Targeted notification to requesting employee
        $recipients = NotificationRecipientResolver::resolve('leave.' . $data['status'], $leaveRequest, auth()->user());
        if ($recipients->isNotEmpty()) {
            $statusText = strtoupper($data['status']);
            NotificationService::notifyRecipients(
                $recipients,
                "Leave Request {$statusText}",
                "Your {$leaveRequest->leave_type} leave request ({$leaveRequest->start_date} to {$leaveRequest->end_date}) was {$statusText}.",
                '/profile',
                'alert',
                'leave_request',
                $leaveRequest->id
            );
        }

        return response()->json(['message' => "Leave {$data['status']}.", 'leave' => $leaveRequest->fresh()]);
    }

    public function destroy(LeaveRequest $leaveRequest): JsonResponse
    {
        if (in_array($leaveRequest->status, ['approved'])) {
            return response()->json(['message' => 'Cannot delete an approved leave request.'], 409);
        }

        $leaveRequest->delete();

        return response()->json(['message' => 'Leave request deleted.']);
    }
}
