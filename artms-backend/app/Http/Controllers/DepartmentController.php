<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Department;
use App\Services\Cache\DepartmentCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    protected DepartmentCacheService $departmentCache;

    public function __construct(DepartmentCacheService $departmentCache)
    {
        $this->departmentCache = $departmentCache;
    }

    public function index(Request $request): JsonResponse
    {
        $departments = $this->departmentCache->all($request->search);

        return response()->json(['departments' => $departments]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'department_name' => ['required', 'string', 'max:255', 'unique:departments,department_name'],
            'department_code' => ['nullable', 'string', 'max:10', 'unique:departments,department_code'],
            'description'     => ['nullable', 'string'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        $dept = Department::create($data);
        AuditLog::record('create', 'department', "Created department: {$dept->department_name}");

        $this->departmentCache->invalidate($dept->id);

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
            'department_code' => ['nullable', 'string', 'max:10', 'unique:departments,department_code,' . $department->id],
            'description'     => ['nullable', 'string'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        $department->update($data);
        AuditLog::record('update', 'department', "Updated department: {$department->department_name}");

        $this->departmentCache->invalidate($department->id);

        return response()->json(['message' => 'Department updated.', 'department' => $department]);
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->employees()->exists()) {
            return response()->json(['message' => 'Cannot delete department with active employees.'], 409);
        }

        AuditLog::record('delete', 'department', "Deleted department: {$department->department_name}");
        $id = $department->id;
        $department->delete();

        $this->departmentCache->invalidate($id);

        return response()->json(['message' => 'Department deleted.']);
    }
}
