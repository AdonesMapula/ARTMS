import { usePermissions } from "../hooks/usePermissions";
import InlineAccessDenied from "./InlineAccessDenied";

/**
 * ==================================================================================
 * PERMISSION PROTECTED ROUTE COMPONENT
 * ==================================================================================
 * 
 * This component wraps pages that require specific permissions.
 * 
 * Key Features:
 * 1. Super Admin ALWAYS bypasses all checks
 * 2. Shows "Access Denied" inline (keeps sidebar/topbar visible)
 * 3. Shows loading state while checking permissions
 * 4. Supports single permission or multiple permissions
 * 5. Never locks out Super Admin
 * 
 * Usage:
 *   <PermissionProtectedRoute permission="view_users">
 *     <UsersPage />
 *   </PermissionProtectedRoute>
 * 
 * Props:
 *   - permission: Single permission string (e.g., "view_users")
 *   - permissions: Array of permission strings (e.g., ["view_users", "edit_users"])
 *   - mode: "any" (default) or "all" - for multiple permissions
 *   - children: Component to render if permission check passes
 */
export default function PermissionProtectedRoute({
  children,
  permission,
  permissions = [],
  mode = "any", // "any" or "all"
}) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    userRole,
    loading,
  } = usePermissions();

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#111A62]"></div>
          <p className="mt-4 text-sm text-slate-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // SUPER ADMIN BYPASS: Always grant access
  // ============================================================
  if (isSuperAdmin() || userRole === "super_admin") {
    return children;
  }

  // ============================================================
  // PERMISSION CHECK
  // ============================================================
  let hasAccess = false;

  if (permission) {
    // Single permission check
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    // Multiple permissions check
    hasAccess =
      mode === "all"
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
  } else {
    // No permission required - allow access
    hasAccess = true;
  }

  // ============================================================
  // ACCESS DENIED: Show inline message (keeps layout)
  // ============================================================
  if (!hasAccess) {
    return <InlineAccessDenied requiredPermission={permission} />;
  }

  // ============================================================
  // ACCESS GRANTED: Render children
  // ============================================================
  return children;
}
