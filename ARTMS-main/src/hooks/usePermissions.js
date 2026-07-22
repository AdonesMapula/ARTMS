import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * ==================================================================================
 * ROBUST RBAC PERMISSION HOOK
 * ==================================================================================
 * 
 * This hook implements Role-Based Access Control with GUARANTEED Super Admin access.
 * 
 * Key Features:
 * 1. Super Admin ALWAYS has access (multiple bypass checks)
 * 2. Uses correct localStorage key (artms_user)
 * 3. Caches permissions for performance
 * 4. Provides refresh method for immediate updates
 * 5. Never locks out Super Admin under any circumstances
 * 
 * Usage:
 *   const { hasPermission, loading } = usePermissions();
 *   if (hasPermission('view_users')) { ... }
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  /**
   * Load permissions from backend
   * Uses /api/permissions/my-permissions which works for all authenticated users
   */
  const loadPermissions = async () => {
    try {
      // Get user from correct localStorage key
      const userStr = localStorage.getItem("artms_user");
      
      if (!userStr) {
        // Not logged in
        setPermissions([]);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      setUserRole(user.role);

      // ============================================================
      // SUPER ADMIN BYPASS #1: Hardcoded full access
      // ============================================================
      if (user.role === "super_admin") {
        // Grant wildcard permission that means "access everything"
        setPermissions(["*"]);
        setLoading(false);
        return;
      }

      // ============================================================
      // OTHER ROLES: Fetch permissions from backend
      // Using /api/permissions/my-permissions (works for all users)
      // ============================================================
      try {
        const res = await api.get(`/permissions/my-permissions`);
        const permissionNames = res.data.permissions.map((p) => p.name);
        setPermissions(permissionNames);
      } catch (apiError) {
        // ============================================================
        // SUPER ADMIN BYPASS #2: Fallback if API fails
        // ============================================================
        if (user.role === "super_admin") {
          setPermissions(["*"]);
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setError(err);
      
      // ============================================================
      // SUPER ADMIN BYPASS #3: Final emergency fallback
      // ============================================================
      try {
        const userStr = localStorage.getItem("artms_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === "super_admin") {
            setPermissions(["*"]);
            setUserRole("super_admin");
            setLoading(false);
            return;
          }
        }
      } catch (fallbackError) {
        console.error("Emergency fallback failed:", fallbackError);
      }
      
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific permission
   * 
   * @param {string} permission - Permission name (e.g., "view_users")
   * @returns {boolean} - True if user has permission or is Super Admin
   */
  const hasPermission = (permission) => {
    // ============================================================
    // SUPER ADMIN BYPASS #4: Role-based check
    // ============================================================
    if (userRole === "super_admin") {
      return true;
    }

    // ============================================================
    // SUPER ADMIN BYPASS #5: Wildcard check
    // ============================================================
    if (permissions.includes("*")) {
      return true;
    }

    // No permission required
    if (!permission) {
      return true;
    }

    // Check if user has the specific permission
    return permissions.includes(permission);
  };

  /**
   * Check if user has ANY of the provided permissions
   * 
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean} - True if user has at least one permission or is Super Admin
   */
  const hasAnyPermission = (permissionList) => {
    // ============================================================
    // SUPER ADMIN BYPASS #6: Role-based check
    // ============================================================
    if (userRole === "super_admin") {
      return true;
    }

    // ============================================================
    // SUPER ADMIN BYPASS #7: Wildcard check
    // ============================================================
    if (permissions.includes("*")) {
      return true;
    }

    // No permissions required
    if (!permissionList || permissionList.length === 0) {
      return true;
    }

    // Check if user has any of the permissions
    return permissionList.some((p) => permissions.includes(p));
  };

  /**
   * Check if user has ALL of the provided permissions
   * 
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean} - True if user has all permissions or is Super Admin
   */
  const hasAllPermissions = (permissionList) => {
    // ============================================================
    // SUPER ADMIN BYPASS #8: Role-based check
    // ============================================================
    if (userRole === "super_admin") {
      return true;
    }

    // ============================================================
    // SUPER ADMIN BYPASS #9: Wildcard check
    // ============================================================
    if (permissions.includes("*")) {
      return true;
    }

    // No permissions required
    if (!permissionList || permissionList.length === 0) {
      return true;
    }

    // Check if user has all of the permissions
    return permissionList.every((p) => permissions.includes(p));
  };

  /**
   * Refresh permissions from backend
   * Call this after updating role permissions to see changes immediately
   */
  const refreshPermissions = () => {
    setLoading(true);
    loadPermissions();
  };

  /**
   * Check if current user is Super Admin
   * @returns {boolean}
   */
  const isSuperAdmin = () => {
    return userRole === "super_admin" || permissions.includes("*");
  };

  return {
    permissions,
    loading,
    error,
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    isSuperAdmin,
  };
}
