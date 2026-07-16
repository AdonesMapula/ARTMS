<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $employees = Employee::with(['user', 'department'])
            ->when($request->search, fn ($q) =>
                $q->whereHas('user', fn ($u) =>
                    $u->where('name', 'like', "%{$request->search}%")
                      ->orWhere('employee_id', 'like', "%{$request->search}%")
                )
            )
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id))
            ->when($request->status, fn ($q) => $q->where('employment_status', $request->status))
            ->orderBy('id', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($employees);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'               => ['required', 'exists:users,id', 'unique:employees,user_id'],
            'department_id'         => ['required', 'exists:departments,id'],
            'position'              => ['required', 'string', 'max:255'],
            'date_hired'            => ['required', 'date'],
            'salary'                => ['required', 'numeric', 'min:0'],
            'employment_type'       => ['nullable', 'string'],
            'address'               => ['nullable', 'string'],
            'contact_number'        => ['nullable', 'string'],
            'emergency_contact_name'   => ['nullable', 'string'],
            'emergency_contact_number' => ['nullable', 'string'],
        ]);

        $employee = Employee::create($data);

        // Generate employee ID and assign to user
        $empId = 'EMP-' . now()->year . '-' . str_pad($employee->id, 5, '0', STR_PAD_LEFT);
        $employee->user->update(['employee_id' => $empId]);

        AuditLog::record('create', 'employee', "Created employee record for user ID {$data['user_id']}");

        return response()->json([
            'message'  => 'Employee created.',
            'employee' => $employee->load('user', 'department'),
        ], 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json([
            'employee' => $employee->load(
                'user',
                'department',
                'documents',
                'attendanceLogs',
                'leaveRequests',
                'payrolls',
                'performanceEvaluations'
            ),
        ]);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'department_id'   => ['sometimes', 'exists:departments,id'],
            'position'        => ['sometimes', 'string', 'max:255'],
            'employment_status' => ['sometimes', 'in:active,resigned,terminated,on_leave'],
            'salary'          => ['sometimes', 'numeric', 'min:0'],
            'contact_number'  => ['nullable', 'string'],
            'address'         => ['nullable', 'string'],
        ]);

        $old = $employee->toArray();
        $employee->update($data);

        AuditLog::record('update', 'employee', "Updated employee ID {$employee->id}", $old, $employee->fresh()->toArray(), Employee::class, $employee->id);

        return response()->json([
            'message'  => 'Employee updated.',
            'employee' => $employee->fresh()->load('user', 'department'),
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        AuditLog::record('delete', 'employee', "Deleted employee ID {$employee->id}");
        $employee->delete();

        return response()->json(['message' => 'Employee record deleted.']);
    }

    /**
     * PATCH /api/employees/{id}/terminate
     */
    public function terminate(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string'],
            'type'   => ['required', 'in:resigned,terminated'],
            'date'   => ['required', 'date'],
        ]);

        $employee->update([
            'employment_status'  => $data['type'],
            'date_terminated'    => $data['date'],
            'termination_reason' => $data['reason'],
        ]);

        $employee->user->update(['is_active' => false]);

        AuditLog::record('terminate', 'employee', "Employee {$data['type']}: ID {$employee->id}");

        return response()->json(['message' => "Employee marked as {$data['type']}."]);
    }

    /**
     * PATCH /api/employees/{id}/clearance
     */
    public function clearance(Employee $employee): JsonResponse
    {
        $employee->update(['clearance_processed' => true]);
        AuditLog::record('clearance', 'employee', "Clearance processed for employee ID {$employee->id}");

        return response()->json(['message' => 'Clearance processed.']);
    }
}
