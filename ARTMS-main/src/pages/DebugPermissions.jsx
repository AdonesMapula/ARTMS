import { usePermissions } from "../hooks/usePermissions";

/**
 * Debug page to check permission system
 * Temporarily add this to your routes to diagnose issues
 */
export default function DebugPermissions() {
  const { permissions, loading, error, hasPermission } = usePermissions();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Permission System Debug</h1>

      {/* User Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-bold text-lg mb-2">User Info</h2>
        <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <p>⏳ Loading permissions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h2 className="font-bold text-lg mb-2 text-red-700">❌ Error</h2>
          <pre className="text-sm text-red-600">{error.message}</pre>
        </div>
      )}

      {/* Permissions */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Loaded Permissions</h2>
        <p className="mb-2">Total: {permissions.length}</p>
        <pre className="text-sm">{JSON.stringify(permissions, null, 2)}</pre>
      </div>

      {/* Permission Checks */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Permission Checks</h2>
        <ul className="space-y-2">
          <li>
            ✅ view_roles: {hasPermission("view_roles") ? "✓ YES" : "✗ NO"}
          </li>
          <li>
            ✅ view_users: {hasPermission("view_users") ? "✓ YES" : "✗ NO"}
          </li>
          <li>
            ✅ view_departments: {hasPermission("view_departments") ? "✓ YES" : "✗ NO"}
          </li>
          <li>
            ✅ Wildcard (*): {permissions.includes("*") ? "✓ YES (Super Admin)" : "✗ NO"}
          </li>
        </ul>
      </div>

      {/* Expected Behavior */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Expected for Super Admin</h2>
        <ul className="space-y-1 text-sm">
          <li>• User role should be: <code>super_admin</code></li>
          <li>• Permissions should contain: <code>["*"]</code></li>
          <li>• All permission checks should return: <code>true</code></li>
        </ul>
      </div>
    </div>
  );
}
