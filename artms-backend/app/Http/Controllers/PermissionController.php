<?php

namespace App\Http\Controllers;

use App\Services\Cache\PermissionCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ==================================================================================
 * PERMISSION CONTROLLER - PRODUCTION-READY RBAC SYSTEM WITH CACHING
 * ==================================================================================
 */
class PermissionController extends Controller
{
    protected PermissionCacheService $permissionCache;

    public function __construct(PermissionCacheService $permissionCache)
    {
        $this->permissionCache = $permissionCache;
    }

    /**
     * GET /api/permissions
     * Get all available permissions with their role assignments (Cached).
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->permissionCache->all();

            return response()->json([
                'success'     => true,
                'permissions' => $data['permissions'],
                'grouped'     => $data['grouped'],
                'total'       => $data['total'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch permissions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * GET /api/permissions/role/{role}
     */
    public function getByRole(string $role): JsonResponse
    {
        try {
            $validRoles = ['super_admin', 'developer', 'hr_admin', 'coo', 'department_head', 'employee'];
            if (!in_array($role, $validRoles)) {
                return response()->json([
                    'success'     => false,
                    'message'     => 'Invalid role',
                    'valid_roles' => $validRoles,
                ], 400);
            }

            if ($role === 'super_admin' || $role === 'developer') {
                $permissions = DB::table('permissions')
                    ->orderBy('resource')
                    ->orderBy('name')
                    ->get();
            } else {
                $permissions = DB::table('permissions')
                    ->where($role, 1)
                    ->orderBy('resource')
                    ->orderBy('name')
                    ->get();
            }

            return response()->json([
                'success'     => true,
                'role'        => $role,
                'permissions' => $permissions,
                'count'       => $permissions->count(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to fetch permissions for role {$role}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch role permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * GET /api/permissions/my-permissions
     */
    public function getMyPermissions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $role = $user->role;

            $validRoles = ['super_admin', 'developer', 'hr_admin', 'coo', 'department_head', 'employee'];
            if (!in_array($role, $validRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid user role',
                ], 400);
            }

            if ($role === 'super_admin' || $role === 'developer') {
                $permissions = DB::table('permissions')
                    ->orderBy('resource')
                    ->orderBy('name')
                    ->get();
            } else {
                $permissions = DB::table('permissions')
                    ->where($role, 1)
                    ->orderBy('resource')
                    ->orderBy('name')
                    ->get();
            }

            return response()->json([
                'success'     => true,
                'role'        => $role,
                'permissions' => $permissions,
                'count'       => $permissions->count(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to fetch my permissions: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * POST /api/permissions/role/{role}
     */
    public function updateRolePermissions(Request $request, string $role): JsonResponse
    {
        try {
            $validRoles = ['super_admin', 'developer', 'hr_admin', 'coo', 'department_head', 'employee'];
            if (!in_array($role, $validRoles)) {
                return response()->json([
                    'success'     => false,
                    'message'     => 'Invalid role',
                    'valid_roles' => $validRoles,
                ], 400);
            }

            if ($role === 'super_admin' || $role === 'developer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot modify Super Admin / Developer permissions. Full access is always granted.',
                ], 403);
            }

            $request->validate([
                'permission_ids'   => ['required', 'array'],
                'permission_ids.*' => ['integer'],
            ]);

            $validIds = DB::table('permissions')->pluck('id')->toArray();
            $invalidIds = array_diff($request->permission_ids, $validIds);

            if (!empty($invalidIds)) {
                return response()->json([
                    'success'     => false,
                    'message'     => 'Some permission IDs are invalid',
                    'invalid_ids' => $invalidIds,
                ], 400);
            }

            DB::beginTransaction();
            try {
                DB::table('permissions')->update([
                    $role        => 0,
                    'updated_at' => now(),
                ]);

                if (!empty($request->permission_ids)) {
                    DB::table('permissions')
                        ->whereIn('id', $request->permission_ids)
                        ->update([
                            $role        => 1,
                            'updated_at' => now(),
                        ]);
                }

                DB::commit();

                // Invalidate all caches immediately
                $this->permissionCache->invalidateAll();

                $user = $request->user();
                Log::info("Permissions updated for role {$role} by user {$user->email}", [
                    'role'             => $role,
                    'permission_count' => count($request->permission_ids),
                    'updated_by'       => $user->email,
                ]);

                if (class_exists('\App\Models\AuditLog')) {
                    \App\Models\AuditLog::record(
                        'update_role_permissions',
                        'permissions',
                        "Updated permissions for role: {$role} (" . count($request->permission_ids) . " permissions)"
                    );
                }

                return response()->json([
                    'success'          => true,
                    'message'          => 'Permissions updated successfully',
                    'role'             => $role,
                    'permission_count' => count($request->permission_ids),
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error("Failed to update permissions for role {$role}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * GET /api/permissions/all-roles
     */
    public function getAllRoles(): JsonResponse
    {
        try {
            $roles = ['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'];

            $allPermissions = DB::table('permissions')
                ->orderBy('resource')
                ->orderBy('name')
                ->get();

            $rolePermissions = [];
            foreach ($roles as $role) {
                if ($role === 'super_admin') {
                    $permissions = $allPermissions;
                    $permissionIds = $allPermissions->pluck('id')->toArray();
                } else {
                    $permissions = $allPermissions->where($role, 1)->values();
                    $permissionIds = $permissions->pluck('id')->toArray();
                }

                $rolePermissions[$role] = [
                    'role'             => $role,
                    'display_name'     => $this->getRoleDisplayName($role),
                    'permissions'      => $permissions,
                    'permission_ids'   => $permissionIds,
                    'permission_count' => count($permissionIds),
                ];
            }

            return response()->json([
                'success'         => true,
                'roles'           => $rolePermissions,
                'all_permissions' => $allPermissions,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch all roles permissions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch role permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * GET /api/permissions/check/{role}/{permission}
     */
    public function checkPermission(string $role, string $permissionName): JsonResponse
    {
        try {
            $validRoles = ['super_admin', 'developer', 'hr_admin', 'coo', 'department_head', 'employee'];
            if (!in_array($role, $validRoles)) {
                return response()->json([
                    'success'     => false,
                    'message'     => 'Invalid role',
                    'valid_roles' => $validRoles,
                ], 400);
            }

            if ($role === 'super_admin' || $role === 'developer') {
                return response()->json([
                    'success'        => true,
                    'role'           => $role,
                    'permission'     => $permissionName,
                    'has_permission' => true,
                    'reason'         => 'Super Admin / Developer has full system access',
                ]);
            }

            $permission = DB::table('permissions')
                ->where('name', $permissionName)
                ->first();

            if (!$permission) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'Permission not found',
                    'permission' => $permissionName,
                ], 404);
            }

            $hasPermission = (bool) $permission->{$role};

            return response()->json([
                'success'        => true,
                'role'           => $role,
                'permission'     => $permissionName,
                'has_permission' => $hasPermission,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to check permission {$permissionName} for role {$role}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check permission',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * GET /api/permissions/available/{role}
     */
    public function getAvailablePermissions(string $role): JsonResponse
    {
        try {
            $roleAvailablePermissions = [
                'super_admin' => ['*'],
                'hr_admin' => [
                    'view_dashboard', 'view_reports',
                    'view_manpower_requests', 'create_manpower_requests', 'edit_manpower_requests', 'delete_manpower_requests', 'view_manpower_request', 'view_request_history',
                    'view_job_library', 'create_job_library', 'edit_job_library', 'delete_job_library', 'manage_job_library',
                    'view_job_postings', 'create_job_postings', 'edit_job_postings', 'delete_job_postings', 'manage_job_postings', 'publish_job_postings',
                    'view_applicants', 'create_applicants', 'edit_applicants', 'delete_applicants', 'manage_applicants', 'hire_applicants', 'reject_applicants',
                    'view_ai_screening', 'perform_ai_screening', 'review_ai_screening',
                    'view_interviews', 'create_interviews', 'edit_interviews', 'delete_interviews', 'manage_interviews',
                    'view_pipeline', 'manage_pipeline',
                    'view_employees', 'create_employees', 'edit_employees', 'delete_employees', 'manage_employees',
                ],
                'coo' => [
                    'view_dashboard', 'view_reports',
                    'view_prf_approvals', 'view_job_library_approvals', 'view_job_posting_approvals',
                    'view_manpower_requests', 'approve_manpower_requests', 'view_request_history',
                    'view_job_library', 'approve_job_library',
                    'view_job_postings', 'approve_job_postings',
                    'view_applicants', 'view_ai_screening', 'view_interviews', 'view_pipeline',
                ],
                'department_head' => [
                    'view_dashboard', 'view_reports',
                    'view_manpower_request', 'view_request_history',
                    'create_manpower_requests', 'edit_manpower_requests', 'delete_manpower_requests',
                ],
                'employee' => [
                    'view_dashboard',
                ],
            ];

            $available = $roleAvailablePermissions[$role] ?? [];

            if (in_array('*', $available)) {
                $permissions = DB::table('permissions')->get();
                $permissionNames = $permissions->pluck('name')->toArray();
            } else {
                $permissionNames = $available;
                $permissions = DB::table('permissions')->whereIn('name', $available)->get();
            }

            return response()->json([
                'success'               => true,
                'role'                  => $role,
                'available_permissions' => $permissionNames,
                'permissions'           => $permissions,
                'count'                 => count($permissionNames),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to fetch available permissions for role {$role}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * POST /api/permissions/sync-defaults
     */
    public function syncDefaultPermissions(): JsonResponse
    {
        try {
            // Run the permission seeder
            \Artisan::call('db:seed', [
                '--class' => 'PermissionSeeder',
                '--force' => true,
            ]);
            DB::commit();

            // Invalidate all caches
            $this->permissionCache->invalidateAll();

            $user = request()->user();
            Log::info("Permissions reset to defaults by user {$user->email}");

            if (class_exists('\App\Models\AuditLog')) {
                \App\Models\AuditLog::record(
                    'sync_default_permissions',
                    'permissions',
                    'Reset all permissions to default values'
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Default permissions synced successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to sync default permissions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync default permissions',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    private function getRoleDisplayName(string $role): string
    {
        $displayNames = [
            'super_admin'     => 'Super Admin',
            'developer'       => 'Developer',
            'hr_admin'        => 'HR Admin',
            'coo'             => 'COO',
            'department_head' => 'Department Head',
            'employee'        => 'Employee',
        ];

        return $displayNames[$role] ?? ucwords(str_replace('_', ' ', $role));
    }
}
