<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $employees = Employee::with(['user', 'department', 'documents'])
            ->when($request->search, function ($q, $search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                })
                ->orWhere('position', 'like', "%{$search}%");
            })
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id))
            ->when($request->status && $request->status !== 'All', fn ($q) => $q->where('employment_status', $request->status))
            ->orderBy('id', 'desc')
            ->paginate($request->per_page ?? 15);

        // Stats summary
        $stats = [
            'total'      => Employee::count(),
            'active'     => Employee::where('employment_status', 'active')->count(),
            'on_leave'   => Employee::where('employment_status', 'on_leave')->count(),
            'resigned'   => Employee::where('employment_status', 'resigned')->count(),
            'terminated' => Employee::where('employment_status', 'terminated')->count(),
        ];

        return response()->json([
            'employees' => $employees,
            'stats'     => $stats,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'                  => ['nullable', 'exists:users,id', 'unique:employees,user_id'],
            'name'                     => ['required_without:user_id', 'nullable', 'string', 'max:255'],
            'email'                    => ['required_without:user_id', 'nullable', 'email', 'unique:users,email'],
            'department_id'            => ['required', 'exists:departments,id'],
            'position'                 => ['required', 'string', 'max:255'],
            'date_hired'               => ['required', 'date'],
            'salary'                   => ['required', 'numeric', 'min:0'],
            'employment_type'          => ['nullable', 'string'],
            'employment_status'        => ['nullable', 'in:active,resigned,terminated,on_leave'],
            'address'                  => ['nullable', 'string'],
            'contact_number'           => ['nullable', 'string'],
            'emergency_contact_name'   => ['nullable', 'string'],
            'emergency_contact_number' => ['nullable', 'string'],
        ]);

        // 1. Create or retrieve User
        if (empty($data['user_id'])) {
            $user = User::create([
                'name'       => $data['name'],
                'email'      => $data['email'],
                'password'   => Hash::make(Str::random(12)),
                'role'       => 'employee',
                'department_id' => $data['department_id'],
                'is_active'  => true,
            ]);
            $userId = $user->id;
        } else {
            $userId = $data['user_id'];
            $user   = User::findOrFail($userId);
        }

        // 2. Create Employee
        $employee = Employee::create([
            'user_id'                  => $userId,
            'department_id'            => $data['department_id'],
            'position'                 => $data['position'],
            'date_hired'               => $data['date_hired'],
            'salary'                   => $data['salary'],
            'employment_type'          => $data['employment_type'] ?? 'regular',
            'employment_status'        => $data['employment_status'] ?? 'active',
            'address'                  => $data['address'] ?? null,
            'contact_number'           => $data['contact_number'] ?? null,
            'emergency_contact_name'   => $data['emergency_contact_name'] ?? null,
            'emergency_contact_number' => $data['emergency_contact_number'] ?? null,
        ]);

        // 3. Auto-generate Employee Number (EMP-YYYY-XXXXX) & save to User
        $empId = $employee->generateEmployeeNumber();
        $user->update(['employee_id' => $empId]);

        // 4. Seed default 201 Document Checklist
        $employee->seedDefaultDocuments();

        AuditLog::record('create', 'employee', "Created 201 employee record {$empId} for {$user->name}", null, $employee->toArray(), Employee::class, $employee->id);

        return response()->json([
            'message'  => 'Employee 201 record created successfully.',
            'employee' => $employee->load('user', 'department', 'documents'),
        ], 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        // Ensure default 201 documents exist
        $employee->seedDefaultDocuments();

        $loaded = $employee->load([
            'user',
            'department',
            'documents.verifier',
            'attendanceLogs' => fn ($q) => $q->orderBy('id', 'desc')->take(10),
            'leaveRequests'  => fn ($q) => $q->orderBy('id', 'desc')->take(10),
            'payrolls'       => fn ($q) => $q->orderBy('id', 'desc')->take(10),
            'performanceEvaluations' => fn ($q) => $q->orderBy('id', 'desc')->take(10),
        ]);

        return response()->json([
            'employee' => $loaded,
        ]);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'name'                     => ['sometimes', 'string', 'max:255'],
            'email'                    => ['sometimes', 'email', "unique:users,email,{$employee->user_id}"],
            'department_id'            => ['sometimes', 'exists:departments,id'],
            'position'                 => ['sometimes', 'string', 'max:255'],
            'employment_type'          => ['sometimes', 'string'],
            'employment_status'        => ['sometimes', 'in:active,resigned,terminated,on_leave'],
            'salary'                   => ['sometimes', 'numeric', 'min:0'],
            'date_hired'               => ['sometimes', 'date'],
            'contact_number'           => ['nullable', 'string'],
            'address'                  => ['nullable', 'string'],
            'emergency_contact_name'   => ['nullable', 'string'],
            'emergency_contact_number' => ['nullable', 'string'],
        ]);

        $oldValues = $employee->load('user')->toArray();

        // Update User info if passed
        if (isset($data['name']) || isset($data['email'])) {
            $userUpdate = [];
            if (isset($data['name']))  $userUpdate['name']  = $data['name'];
            if (isset($data['email'])) $userUpdate['email'] = $data['email'];
            $employee->user()->update($userUpdate);
        }

        // Update Employee details
        $employeeFields = collect($data)->except(['name', 'email'])->toArray();
        $employee->update($employeeFields);

        $newValues = $employee->fresh()->load('user')->toArray();

        AuditLog::record(
            'update',
            'employee',
            "Updated 201 record for Employee {$employee->user->employee_id} ({$employee->user->name})",
            $oldValues,
            $newValues,
            Employee::class,
            $employee->id
        );

        return response()->json([
            'message'  => 'Employee 201 record updated successfully.',
            'employee' => $employee->fresh()->load('user', 'department', 'documents'),
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $empId = $employee->user->employee_id ?? "ID {$employee->id}";
        $name  = $employee->user->name ?? "Employee";

        AuditLog::record('delete', 'employee', "Deleted 201 employee record for {$name} ({$empId})");

        $employee->delete();

        return response()->json(['message' => 'Employee record soft-deleted.']);
    }

    /**
     * PATCH /api/employees/{id}/terminate
     * Status Tagging Control: Update employment_status & sync user active status
     */
    public function terminate(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required_if:type,resigned,terminated', 'nullable', 'string'],
            'type'   => ['required', 'in:active,resigned,terminated,on_leave'],
            'date'   => ['required_if:type,resigned,terminated', 'nullable', 'date'],
        ]);

        $oldStatus = $employee->employment_status;
        $newStatus = $data['type'];

        $updateData = [
            'employment_status' => $newStatus,
        ];

        if (in_array($newStatus, ['resigned', 'terminated'])) {
            $updateData['date_terminated']    = $data['date'] ?? now()->toDateString();
            $updateData['termination_reason'] = $data['reason'] ?? null;
            $employee->user->update(['is_active' => false]);
        } else if ($newStatus === 'active') {
            $updateData['date_terminated']    = null;
            $updateData['termination_reason'] = null;
            $employee->user->update(['is_active' => true]);
        }

        $employee->update($updateData);

        AuditLog::record(
            'status_change',
            'employee',
            "Changed employment status for {$employee->user->name} from {$oldStatus} to {$newStatus}",
            ['employment_status' => $oldStatus],
            ['employment_status' => $newStatus],
            Employee::class,
            $employee->id
        );

        return response()->json([
            'message'  => "Employment status updated to " . ucwords(str_replace('_', ' ', $newStatus)) . ".",
            'employee' => $employee->fresh()->load('user', 'department'),
        ]);
    }

    /**
     * PATCH /api/employees/{id}/clearance
     */
    public function clearance(Employee $employee): JsonResponse
    {
        $employee->update(['clearance_processed' => true]);
        AuditLog::record('clearance', 'employee', "Clearance processed for employee {$employee->user->employee_id}");

        return response()->json(['message' => 'Clearance processed successfully.']);
    }

    /**
     * POST /api/employees/{id}/documents
     * Secure file storage by Employee ID
     */
    public function uploadDocument(Request $request, Employee $employee): JsonResponse
    {
        $request->validate([
            'document_type' => ['required', 'string'],
            'file'          => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'], // Max 10MB
            'remarks'       => ['nullable', 'string'],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $folder = "employee_documents/" . ($employee->user->employee_id ?? "emp_{$employee->id}");

        $path = $file->store($folder, 'public');

        $doc = EmployeeDocument::updateOrCreate(
            [
                'employee_id'   => $employee->id,
                'document_type' => $request->document_type,
            ],
            [
                'file_path'     => $path,
                'original_name' => $originalName,
                'status'        => 'submitted',
                'remarks'       => $request->remarks ?? 'File uploaded by admin/employee',
                'submitted_at'  => now(),
            ]
        );

        AuditLog::record('upload_document', 'employee', "Uploaded 201 document ({$request->document_type}) for {$employee->user->name}");

        return response()->json([
            'message'  => 'Document uploaded successfully.',
            'document' => $doc->load('verifier'),
        ]);
    }

    /**
     * GET /api/employees/{id}/documents/{document}/download
     * Download secure 201 document
     */
    public function downloadDocument(Employee $employee, EmployeeDocument $document)
    {
        if ($document->employee_id !== $employee->id) {
            return response()->json(['message' => 'Document does not belong to this employee.'], 403);
        }

        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found on server.'], 404);
        }

        return Storage::disk('public')->download($document->file_path, $document->original_name ?? basename($document->file_path));
    }

    /**
     * PATCH /api/employees/{id}/documents/{document}/status
     * Verify / Reject / Update 201 document status
     */
    public function updateDocumentStatus(Request $request, Employee $employee, EmployeeDocument $document): JsonResponse
    {
        $data = $request->validate([
            'status'  => ['required', 'in:required,submitted,verified,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        if ($document->employee_id !== $employee->id) {
            return response()->json(['message' => 'Document does not belong to this employee.'], 403);
        }

        $document->update([
            'status'      => $data['status'],
            'remarks'     => $data['remarks'] ?? $document->remarks,
            'verified_by' => auth()->id(),
            'verified_at' => $data['status'] === 'verified' ? now() : $document->verified_at,
        ]);

        AuditLog::record('verify_document', 'employee', "Updated document status to {$data['status']} for {$document->document_type} on employee {$employee->user->name}");

        return response()->json([
            'message'  => "Document status updated to {$data['status']}.",
            'document' => $document->fresh()->load('verifier'),
        ]);
    }

    /**
     * GET /api/employees/{id}/history
     * Retrieve change log / edit history timeline for 201 File
     */
    public function getEditHistory(Employee $employee): JsonResponse
    {
        $history = AuditLog::where('module', 'employee')
            ->where('model_id', $employee->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'history' => $history,
        ]);
    }
}
