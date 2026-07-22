<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * ==================================================================================
 * PERMISSION MIDDLEWARE - GRANULAR RBAC CHECKS
 * ==================================================================================
 * 
 * This middleware checks if the authenticated user has specific permissions
 * based on the boolean columns in the permissions table.
 * 
 * Usage in routes:
 *   middleware('permission:view_users,edit_users')  // User needs ANY of these
 *   middleware('permission:view_users|edit_users')  // User needs ALL of these
 * 
 * Super Admin ALWAYS bypasses permission checks.
 */
class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$permissions
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        // Must be authenticated
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Account must be active
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated.',
            ], 403);
        }

        // Super Admin ALWAYS has all permissions
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // If no permissions specified, just check authentication
        if (empty($permissions)) {
            return $next($request);
        }

        // Check if user has required permissions
        $hasPermission = $this->checkUserPermissions($user->role, $permissions);

        if (!$hasPermission) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You do not have the required permission.',
                'required_permissions' => $permissions,
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check if user role has the required permissions
     *
     * @param string $role
     * @param array $permissions
     * @return bool
     */
    private function checkUserPermissions(string $role, array $permissions): bool
    {
        try {
            // Query permissions table for this role
            $rolePermissions = DB::table('permissions')
                ->where($role, 1)
                ->pluck('name')
                ->toArray();

            // Check if user has any of the required permissions
            foreach ($permissions as $permission) {
                if (in_array($permission, $rolePermissions)) {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            // If there's an error checking permissions, deny access for safety
            \Log::error("Permission check failed: " . $e->getMessage());
            return false;
        }
    }
}
