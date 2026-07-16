<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Payroll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payrolls = Payroll::with('employee.user', 'processor')
            ->when($request->employee_id, fn ($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->pay_date_from, fn ($q) => $q->where('pay_date', '>=', $request->pay_date_from))
            ->when($request->pay_date_to, fn ($q) => $q->where('pay_date', '<=', $request->pay_date_to))
            ->orderBy('pay_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($payrolls);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'  => ['required', 'exists:employees,id'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'allowance'    => ['nullable', 'numeric', 'min:0'],
            'overtime_pay' => ['nullable', 'numeric', 'min:0'],
            'deduction'    => ['nullable', 'numeric', 'min:0'],
            'tax'          => ['nullable', 'numeric', 'min:0'],
            'sss'          => ['nullable', 'numeric', 'min:0'],
            'philhealth'   => ['nullable', 'numeric', 'min:0'],
            'pagibig'      => ['nullable', 'numeric', 'min:0'],
            'pay_date'     => ['required', 'date'],
            'pay_period'   => ['required', 'string'],
        ]);

        // Calculate net salary
        $gross = ($data['basic_salary'] ?? 0) + ($data['allowance'] ?? 0) + ($data['overtime_pay'] ?? 0);
        $deductions = ($data['deduction'] ?? 0) + ($data['tax'] ?? 0) + ($data['sss'] ?? 0)
                    + ($data['philhealth'] ?? 0) + ($data['pagibig'] ?? 0);
        $data['net_salary']   = $gross - $deductions;
        $data['processed_by'] = auth()->id();

        $payroll = Payroll::create($data);
        AuditLog::record('create', 'payroll', "Payroll created for employee ID {$data['employee_id']}");

        return response()->json(['message' => 'Payroll entry created.', 'payroll' => $payroll], 201);
    }

    public function show(Payroll $payroll): JsonResponse
    {
        return response()->json(['payroll' => $payroll->load('employee.user', 'processor')]);
    }

    public function update(Request $request, Payroll $payroll): JsonResponse
    {
        if ($payroll->status === 'released') {
            return response()->json(['message' => 'Cannot edit a released payroll.'], 409);
        }

        $data = $request->validate([
            'allowance'    => ['nullable', 'numeric'],
            'overtime_pay' => ['nullable', 'numeric'],
            'deduction'    => ['nullable', 'numeric'],
            'pay_date'     => ['sometimes', 'date'],
        ]);

        $payroll->update($data);

        return response()->json(['message' => 'Payroll updated.', 'payroll' => $payroll->fresh()]);
    }

    /**
     * PATCH /api/payroll/{id}/release
     */
    public function release(Payroll $payroll): JsonResponse
    {
        $payroll->update(['status' => 'released']);
        AuditLog::record('release', 'payroll', "Payroll released ID {$payroll->id}");

        return response()->json(['message' => 'Payroll released.']);
    }
}
