<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AttendanceLog::with('employee.user')
            ->when($request->employee_id, fn ($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->date_from, fn ($q) => $q->where('date', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->where('date', '<=', $request->date_to))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'   => ['required', 'exists:employees,id'],
            'date'          => ['required', 'date'],
            'time_in'       => ['nullable', 'date_format:H:i'],
            'time_out'      => ['nullable', 'date_format:H:i', 'after:time_in'],
            'status'        => ['required', 'in:present,absent,late,half_day,on_leave,holiday'],
            'late_minutes'  => ['nullable', 'integer', 'min:0'],
            'hours_worked'  => ['nullable', 'numeric', 'min:0'],
            'remarks'       => ['nullable', 'string'],
        ]);

        $log = AttendanceLog::updateOrCreate(
            ['employee_id' => $data['employee_id'], 'date' => $data['date']],
            $data
        );

        return response()->json(['message' => 'Attendance recorded.', 'log' => $log], 201);
    }

    public function show(AttendanceLog $attendanceLog): JsonResponse
    {
        return response()->json(['log' => $attendanceLog->load('employee.user')]);
    }

    public function update(Request $request, AttendanceLog $attendanceLog): JsonResponse
    {
        $data = $request->validate([
            'time_in'      => ['nullable', 'date_format:H:i'],
            'time_out'     => ['nullable', 'date_format:H:i'],
            'status'       => ['sometimes', 'string'],
            'late_minutes' => ['nullable', 'integer'],
            'hours_worked' => ['nullable', 'numeric'],
            'remarks'      => ['nullable', 'string'],
        ]);

        $attendanceLog->update($data);

        return response()->json(['message' => 'Attendance updated.', 'log' => $attendanceLog->fresh()]);
    }

    /**
     * GET /api/attendance/summary
     * Returns absence/tardiness frequency per employee.
     */
    public function summary(Request $request): JsonResponse
    {
        $from = $request->date_from ?? now()->startOfMonth();
        $to   = $request->date_to ?? now()->endOfMonth();

        $summary = AttendanceLog::with('employee.user')
            ->whereBetween('date', [$from, $to])
            ->selectRaw('employee_id,
                SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absences,
                SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as tardiness,
                SUM(hours_worked) as total_hours,
                COUNT(*) as total_records')
            ->groupBy('employee_id')
            ->get();

        return response()->json(['summary' => $summary]);
    }
}
