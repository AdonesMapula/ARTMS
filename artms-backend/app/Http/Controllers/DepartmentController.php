<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $departments = Department::withCount(['employees', 'users'])
            ->when($request->search, fn ($q) =>
                $q->where('department_name', 'like', "%{$request->search}%")
            )
            ->orderBy('department_name')
            ->get();

        return response()->json(['departments' => $departments]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'department_name' => ['required', 'string', 'max:255', 'unique:departments,department_name'],
            'description'     => ['nullable', 'string'],
        ]);

        $dept = Department::create($data);
        AuditLog::record('create', 'department', "Created department: {$dept->department_name}");

        return response()->json(['message' => 'Department created.', 'department' => $dept], 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json(['department' => $department->load('employees.user', 'users')]);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $data = $request->validate([
            'department_name' => ['sometimes', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        $department->update($data);
        AuditLog::record('update', 'department', "Updated department: {$department->department_name}");

        return response()->json(['message' => 'Department updated.', 'department' => $department]);
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->employees()->exists()) {
            return response()->json(['message' => 'Cannot delete department with active employees.'], 409);
        }

        AuditLog::record('delete', 'department', "Deleted department: {$department->department_name}");
        $department->delete();

        return response()->json(['message' => 'Department deleted.']);
    }
}
