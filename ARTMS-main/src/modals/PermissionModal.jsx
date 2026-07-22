import { useEffect, useState } from "react";
import { Shield, Check, X, Info, Lock, AlertCircle } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import api from "../services/api";

const ROLE_COLORS = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  hr_admin: "bg-blue-100 text-blue-700 border-blue-200",
  coo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  department_head: "bg-amber-100 text-amber-700 border-amber-200",
  employee: "bg-slate-100 text-slate-700 border-slate-200",
};

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  coo: "COO",
  department_head: "Department Head",
  employee: "Employee",
};

// Define which permissions are available for each role
const ROLE_AVAILABLE_PERMISSIONS = {
  super_admin: "*", // All permissions
  hr_admin: [
    // HR Admin can access recruitment and employee management
    "view_dashboard",
    "view_reports",
    "view_manpower_requests",
    "create_manpower_requests",
    "view_job_library",
    "create_job_library",
    "edit_job_library",
    "delete_job_library",
    "manage_job_library",
    "view_job_postings",
    "create_job_postings",
    "edit_job_postings",
    "delete_job_postings",
    "manage_job_postings",
    "publish_job_postings",
    "view_applicants",
    "create_applicants",
    "edit_applicants",
    "delete_applicants",
    "manage_applicants",
    "hire_applicants",
    "reject_applicants",
    "view_ai_screening",
    "perform_ai_screening",
    "review_ai_screening",
    "view_interviews",
    "create_interviews",
    "edit_interviews",
    "delete_interviews",
    "manage_interviews",
    "view_pipeline",
    "manage_pipeline",
    "view_employees",
    "manage_employees",
  ],
  coo: [
    // COO can only approve and view
    "view_dashboard",
    "view_reports",
    "view_prf_approvals",
    "view_job_library_approvals",
    "view_job_posting_approvals",
    "approve_manpower_requests",
    "approve_job_library",
    "approve_job_postings",
    "view_manpower_requests",
    "view_job_library",
    "view_job_postings",
    "view_applicants",
    "view_ai_screening",
    "view_interviews",
    "view_pipeline",
  ],
  department_head: [
    // Department Head can only create PRF and view history
    "view_dashboard",
    "view_manpower_request",
    "view_request_history",
    "create_manpower_requests",
    "edit_manpower_requests",
    "delete_manpower_requests",
    "view_reports",
  ],
  employee: [
    // Employee has basic access only
    "view_dashboard",
  ],
};

export default function PermissionModal({ open, role, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && role) {
      loadPermissions();
    }
  }, [open, role]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all permissions
      const allRes = await api.get("/permissions");
      const grouped = allRes.data.grouped || {};
      setAllPermissions(grouped);

      // Load role's current permissions
      const roleRes = await api.get(`/permissions/role/${role}`);
      const permissionIds = roleRes.data.permissions.map((p) => p.id);
      setSelectedPermissions(new Set(permissionIds));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  // Check if a permission is available for the current role
  const isPermissionAvailableForRole = (permissionName) => {
    const availablePerms = ROLE_AVAILABLE_PERMISSIONS[role];
    if (availablePerms === "*") return true; // Super Admin can access all
    return availablePerms?.includes(permissionName) || false;
  };

  const handleTogglePermission = (permission) => {
    // Don't allow toggling if permission is not available for this role
    if (!isPermissionAvailableForRole(permission.name)) return;

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permission.id)) {
        newSet.delete(permission.id);
      } else {
        newSet.add(permission.id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (resourcePermissions) => {
    // Only select permissions available for this role
    const availablePerms = resourcePermissions.filter((p) =>
      isPermissionAvailableForRole(p.name)
    );
    const resourceIds = availablePerms.map((p) => p.id);
    const allSelected = resourceIds.every((id) => selectedPermissions.has(id));

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all
        resourceIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all
        resourceIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post(`/permissions/role/${role}`, {
        permission_ids: Array.from(selectedPermissions),
      });
      
      // Notify parent to reload
      if (onSave) onSave();
      
      // Show success message
      alert(`Permissions updated successfully for ${ROLE_DISPLAY_NAMES[role]}!`);
      
      // Close modal
      onClose();
      
      // If current logged-in user belongs to this role, they need to re-login
      // to see permission changes take effect
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.role === role && role !== "super_admin") {
        const shouldReload = confirm(
          "You updated permissions for your own role. You need to logout and login again for changes to take effect. Logout now?"
        );
        if (shouldReload) {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const formatResourceName = (resource) => {
    return resource
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!open) return null;

  const totalPermissions = Object.values(allPermissions).reduce(
    (sum, perms) => sum + perms.length,
    0
  );
  const selectedCount = selectedPermissions.size;

  // Count available permissions for this role
  const availableForRole = Object.values(allPermissions)
    .flat()
    .filter((p) => isPermissionAvailableForRole(p.name)).length;

  return (
    <Modal open={open} onClose={onClose} className="max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Manage Permissions
            </h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                  ROLE_COLORS[role] || ""
                }`}
              >
                {ROLE_DISPLAY_NAMES[role] || role}
              </span>
              <span className="text-sm text-slate-500">
                {selectedCount} of {availableForRole} available permissions selected
              </span>
            </div>
          </div>
        </div>

        {/* Role-specific Info Banner */}
        {role === "super_admin" ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white">
              <Shield size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-purple-900">Super Admin Access</p>
              <p className="mt-0.5 text-xs text-purple-700">
                This role has full system access and cannot be restricted. All pages and features are automatically available.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Info size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-blue-900">Role-Based Access</p>
              <p className="mt-0.5 text-xs text-blue-700">
                <strong className="text-blue-900">✓ Checkable permissions</strong> are available for this role. 
                <strong className="text-slate-400 ml-2">🔒 Locked permissions</strong> are restricted and cannot be assigned.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="px-6 py-5"
        style={{ maxHeight: "calc(80vh - 220px)", overflowY: "auto" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#111A62]"></div>
            <span className="ml-3 text-sm">Loading permissions...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(allPermissions).map(([resource, permissions]) => {
              const availablePerms = permissions.filter((p) =>
                isPermissionAvailableForRole(p.name)
              );
              const resourceIds = availablePerms.map((p) => p.id);
              const allSelected = resourceIds.every((id) =>
                selectedPermissions.has(id)
              );
              const selectedInResource = permissions.filter((p) =>
                selectedPermissions.has(p.id)
              ).length;

              // Skip this resource if no permissions are available for this role
              if (availablePerms.length === 0 && role !== "super_admin") {
                return null;
              }

              return (
                <Card key={resource}>
                  <CardContent className="pt-4">
                    {/* Resource Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-slate-400" />
                        <h3 className="font-bold text-slate-900">
                          {formatResourceName(resource)}
                        </h3>
                        <Badge tone="default">
                          {selectedInResource}/{availablePerms.length}
                        </Badge>
                      </div>
                      {availablePerms.length > 0 && (
                        <button
                          onClick={() => handleSelectAll(permissions)}
                          className="text-xs font-semibold text-[#111A62] hover:underline"
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      )}
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {permissions.map((permission) => {
                        const isSelected = selectedPermissions.has(permission.id);
                        const isAvailable = isPermissionAvailableForRole(permission.name);

                        return (
                          <button
                            key={permission.id}
                            onClick={() => handleTogglePermission(permission)}
                            disabled={!isAvailable}
                            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                              !isAvailable
                                ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                                : isSelected
                                ? "border-[#111A62] bg-blue-50 hover:bg-blue-100"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                                !isAvailable
                                  ? "border-slate-300 bg-slate-100"
                                  : isSelected
                                  ? "border-[#111A62] bg-[#111A62]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {!isAvailable ? (
                                <Lock size={10} className="text-slate-400" />
                              ) : isSelected ? (
                                <Check size={12} className="text-white" />
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  !isAvailable
                                    ? "text-slate-400"
                                    : isSelected
                                    ? "text-[#111A62]"
                                    : "text-slate-900"
                                }`}
                              >
                                {permission.display_name}
                              </p>
                              {permission.description && (
                                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                                  {permission.description}
                                </p>
                              )}
                              {!isAvailable && (
                                <p className="mt-1 text-xs font-semibold text-slate-400 flex items-center gap-1">
                                  <Lock size={10} />
                                  Not available for this role
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            <strong className="text-[#111A62]">{selectedCount}</strong> permissions will be assigned to{" "}
            <strong>{ROLE_DISPLAY_NAMES[role]}</strong>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              <X size={16} className="mr-1" />
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || loading}
            >
              <Check size={16} className="mr-1" />
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
