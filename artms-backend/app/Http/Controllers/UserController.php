<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\UserCreatedMail;

class UserController extends Controller
{
    /**
     * GET /api/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('department')
            ->when($request->search, fn ($q) =>
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('middle_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
            )
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id));

        $users = $query->orderBy('name')->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    /**
     * POST /api/users
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        // Combine name fields for backward compatibility
        $fullName = trim($request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name);
        
        // Auto-generate a temporary password if not explicitly supplied
        $plainPassword = $request->filled('password') ? trim($request->password) : Str::random(10);

        try {
            $user = User::create([
                'first_name'    => $request->first_name,
                'middle_name'   => $request->middle_name,
                'last_name'     => $request->last_name,
                'name'          => $fullName,
                'email'         => $request->email,
                'password'      => Hash::make($plainPassword),
                'role'          => $request->role,
                'department_id' => $request->department_id,
                'avatar'        => $request->avatar,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1062) {
                return response()->json([
                    'message' => 'The email address is already associated with an existing or archived user account.',
                    'errors'  => ['email' => ['The email address has already been taken.']]
                ], 422);
            }
            throw $e;
        }

        try {
            AuditLog::record('create', 'user', "Created user: {$user->email}", null, $user->toArray(), User::class, $user->id);
        } catch (\Throwable $e) {
            \Log::warning("Failed to record audit log for user creation: " . $e->getMessage());
        }

        $token = Str::random(60);
        try {
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => $token, 'created_at' => now()]
            );
        } catch (\Throwable $e) {
            \Log::warning("Failed to create password reset token: " . $e->getMessage());
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $setupUrl = $frontendUrl . '/setup-account?token=' . $token . '&email=' . urlencode($user->email);

        $emailSent = false;
        $emailError = null;
        try {
            Mail::to($user->email)->send(new UserCreatedMail($user, $plainPassword, $setupUrl));
            $emailSent = true;
        } catch (\Throwable $e) {
            \Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
            $emailError = $e->getMessage();
        }

        return response()->json([
            'message'            => $emailSent ? 'User created successfully and welcome email sent.' : 'User created successfully, but email delivery failed.',
            'user'               => $user->load('department'),
            'temporary_password' => $plainPassword,
            'email_sent'         => $emailSent,
            'email_error'        => $emailError,
        ], 201);
    }

    /**
     * GET /api/users/{id}
     */
    public function show(User $user): JsonResponse
    {
        return response()->json(['user' => $user->load('department', 'employee')]);
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $old = $user->toArray();
        $data = $request->validated();

        // Combine name fields for backward compatibility if provided
        if (isset($data['first_name']) || isset($data['middle_name']) || isset($data['last_name'])) {
            $firstName = $data['first_name'] ?? $user->first_name;
            $middleName = $data['middle_name'] ?? $user->middle_name;
            $lastName = $data['last_name'] ?? $user->last_name;
            $data['name'] = trim($firstName . ' ' . $middleName . ' ' . $lastName);
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make(trim($data['password']));
        }

        try {
            $user->update($data);
        } catch (\Illuminate\Database\QueryException $e) {
            if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1062) {
                return response()->json([
                    'message' => 'The email address is already associated with an existing or archived user account.',
                    'errors'  => ['email' => ['The email address has already been taken.']]
                ], 422);
            }
            throw $e;
        }

        try {
            AuditLog::record('update', 'user', "Updated user: {$user->email}", $old, $user->fresh()->toArray(), User::class, $user->id);
        } catch (\Throwable $e) {
            \Log::warning("Failed to record audit log for user update: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $user->fresh()->load('department'),
        ]);
    }

    /**
     * DELETE /api/users/{id}
     * Soft-deletes (archives) the user.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        AuditLog::record('delete', 'user', "Archived user: {$user->email}", $user->toArray(), null, User::class, $user->id);

        // Clean up reset tokens & Sanctum tokens
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();
        $user->tokens()->delete();

        // Soft delete (archive) the user instead of force delete
        $user->delete();

        return response()->json(['message' => 'User archived successfully.']);
    }

    /**
     * PATCH /api/users/{id}/toggle-status
     */
    public function toggleStatus(User $user): JsonResponse
    {
        $user->update(['is_active' => ! $user->is_active]);
        $status = $user->is_active ? 'activated' : 'deactivated';

        AuditLog::record('update', 'user', "Account {$status}: {$user->email}");

        return response()->json([
            'message'   => "User account {$status}.",
            'is_active' => $user->is_active,
        ]);
    }

    /**
     * GET /api/users/archived
     * Fetch all soft-deleted users.
     */
    public function archived(Request $request): JsonResponse
    {
        $query = User::onlyTrashed()->with('department')
            ->when($request->search, fn ($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
            );

        $users = $query->orderBy('deleted_at', 'desc')->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    /**
     * POST /api/users/{id}/restore
     * Restore a soft-deleted user.
     */
    public function restore($id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        AuditLog::record('update', 'user', "Restored user: {$user->email}", null, $user->toArray(), User::class, $user->id);

        return response()->json([
            'message' => 'User restored successfully.',
            'user'    => $user->load('department'),
        ]);
    }
    /**
     * DELETE /api/users/{id}/force
     * Hard-deletes the user. If database constraints block deletion, falls back to anonymizing.
     */
    public function forceDeleteUser($id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot permanently delete your own account.'], 403);
        }

        try {
            $user->forceDelete();
            AuditLog::record('delete', 'user', "Permanently deleted user ID: {$id}", null, null, User::class, $id);
            return response()->json(['message' => 'User permanently deleted.']);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == '23000') {
                $user->update([
                    'first_name'  => 'Deleted',
                    'middle_name' => null,
                    'last_name'   => 'User',
                    'name'        => 'Deleted User',
                    'email'       => 'deleted_' . Str::uuid() . '@example.com',
                    'password'    => Hash::make(Str::random(32)),
                    'avatar'      => null,
                    'is_active'   => false,
                ]);

                if (!$user->trashed()) {
                    $user->delete();
                }

                AuditLog::record('delete', 'user', "Anonymized user ID: {$id} due to constraints", null, null, User::class, $id);
                return response()->json(['message' => 'User anonymized permanently (data retained due to relations).']);
            }

            throw $e;
        }
    }

    /**
     * POST /api/users/bulk-archive
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ])['ids'];

        $currentUserId = auth()->id();
        $ids = array_values(array_filter($ids, fn ($id) => (int)$id !== (int)$currentUserId));

        if (empty($ids)) {
            return response()->json(['message' => 'No valid users to archive.'], 422);
        }

        $users = User::whereIn('id', $ids)->get();
        $count = 0;
        foreach ($users as $user) {
            $user->delete();
            AuditLog::record('delete', 'user', "Archived user: {$user->email}", null, null, User::class, $user->id);
            $count++;
        }

        return response()->json([
            'message' => "Successfully archived {$count} user(s).",
            'count'   => $count,
        ]);
    }

    /**
     * POST /api/users/bulk-restore
     */
    public function bulkRestore(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ])['ids'];

        $users = User::onlyTrashed()->whereIn('id', $ids)->get();
        $count = 0;
        foreach ($users as $user) {
            $user->restore();
            AuditLog::record('update', 'user', "Restored user: {$user->email}", null, $user->toArray(), User::class, $user->id);
            $count++;
        }

        return response()->json([
            'message' => "Successfully restored {$count} user(s).",
            'count'   => $count,
        ]);
    }

    /**
     * POST /api/users/bulk-force-delete
     */
    public function bulkForceDelete(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ])['ids'];

        $currentUserId = auth()->id();
        $ids = array_values(array_filter($ids, fn ($id) => (int)$id !== (int)$currentUserId));

        if (empty($ids)) {
            return response()->json(['message' => 'No valid users to permanently delete.'], 422);
        }

        $count = 0;
        foreach ($ids as $id) {
            $user = User::withTrashed()->find($id);
            if (!$user) continue;

            try {
                $user->forceDelete();
                AuditLog::record('delete', 'user', "Permanently deleted user ID: {$id}", null, null, User::class, $id);
                $count++;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() == '23000') {
                    $user->update([
                        'first_name'  => 'Deleted',
                        'middle_name' => null,
                        'last_name'   => 'User',
                        'name'        => 'Deleted User',
                        'email'       => 'deleted_' . Str::uuid() . '@example.com',
                        'password'    => Hash::make(Str::random(32)),
                        'avatar'      => null,
                        'is_active'   => false,
                    ]);
                    if (!$user->trashed()) {
                        $user->delete();
                    }
                    AuditLog::record('delete', 'user', "Anonymized user ID: {$id} due to constraints", null, null, User::class, $id);
                    $count++;
                }
            }
        }

        return response()->json([
            'message' => "Successfully permanently deleted {$count} user(s).",
            'count'   => $count,
        ]);
    }
}
