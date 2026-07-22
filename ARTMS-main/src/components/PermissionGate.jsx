import { usePermissions } from "../hooks/usePermissions";

/**
 * Component to conditionally render children based on permissions
 * 
 * Usage:
 * <PermissionGate permission="view_users">
 *   <UsersPage />
 * </PermissionGate>
 * 
 * Or with multiple permissions (ANY):
 * <PermissionGate permissions={["view_users", "manage_users"]} mode="any">
 *   <UsersPage />
 * </PermissionGate>
 * 
 * Or with multiple permissions (ALL):
 * <PermissionGate permissions={["view_users", "manage_users"]} mode="all">
 *   <UsersPage />
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  permission,
  permissions = [],
  mode = "any", // "any" or "all"
  fallback = null,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } =
    usePermissions();

  if (loading) {
    return fallback;
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? children : fallback;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    const hasAccess =
      mode === "all"
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    return hasAccess ? children : fallback;
  }

  // No permission required
  return children;
}
