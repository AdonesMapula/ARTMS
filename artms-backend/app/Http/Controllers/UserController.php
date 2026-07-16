<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * GET /api/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('department')
            ->when($request->search, fn ($q) =>
                $q->where('name', 'like', "%{$request->search}%")
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
        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'role'          => $request->role,
            'department_id' => $request->department_id,
        ]);

        AuditLog::record('create', 'user', "Created user: {$user->email}", null, $user->toArray(), User::class, $user->id);

        return response()->json([
            'message' => 'User created successfully.',
            'user'    => $user->load('department'),
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

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        AuditLog::record('update', 'user', "Updated user: {$user->email}", $old, $user->fresh()->toArray(), User::class, $user->id);

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $user->fresh()->load('department'),
        ]);
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        AuditLog::record('delete', 'user', "Deleted user: {$user->email}", $user->toArray(), null, User::class, $user->id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
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
}
