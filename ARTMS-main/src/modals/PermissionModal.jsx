import { useEffect, useState, useMemo } from "react";
import { Shield, Check, X, Info, Search, CheckSquare, Square, Sparkles } from "lucide-react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import SearchBar from "../components/ui/SearchBar";
import { Card, CardContent } from "../components/ui/Card";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const ROLE_COLORS = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  developer: "bg-amber-100 text-amber-700 border-amber-200",
  hr_admin: "bg-blue-100 text-blue-700 border-blue-200",
  coo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  department_head: "bg-amber-100 text-amber-700 border-amber-200",
  employee: "bg-slate-100 text-slate-700 border-slate-200",
};

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  developer: "Developer",
  hr_admin: "HR Admin",
  coo: "COO",
  department_head: "Department Head",
  employee: "Employee",
};

export default function PermissionModal({ open, role, onClose, onSave }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open && role) {
      setSearchQuery("");
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
      const permissionIds = (roleRes.data.permissions || []).map((p) => p.id);
      setSelectedPermissions(new Set(permissionIds));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permission) => {
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

  const handleSelectAllInResource = (resourcePermissions) => {
    const resourceIds = resourcePermissions.map((p) => p.id);
    const allSelected = resourceIds.every((id) => selectedPermissions.has(id));

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all in this resource
        resourceIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all in this resource
        resourceIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSelectAllGlobal = () => {
    const allIds = Object.values(allPermissions).flat().map((p) => p.id);
    setSelectedPermissions(new Set(allIds));
  };

  const handleDeselectAllGlobal = () => {
    setSelectedPermissions(new Set());
  };

  const handleSave = async () => {
    if (role === "super_admin") {
      toast.info("Super Admin Notice", "Super Admin always retains root access across all system modules.");
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post(`/permissions/role/${role}`, {
        permission_ids: Array.from(selectedPermissions),
      });

      if (onSave) onSave();

      toast.success(
        "Permissions Saved",
        `Permissions updated successfully for ${ROLE_DISPLAY_NAMES[role] || role} (${selectedPermissions.size} assigned).`
      );

      onClose();

      const currentUser = JSON.parse(localStorage.getItem("artms_user") || localStorage.getItem("user") || "{}");
      if (currentUser.role === role && role !== "super_admin") {
        toast.warning(
          "Re-login Recommended",
          "You updated permissions for your active role. Please refresh or re-login for updated permission tokens.",
          {
            duration: 0,
            actionLabel: "Logout Now",
            onAction: () => {
              localStorage.clear();
              window.location.href = "/login";
            },
          }
        );
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

  // Filter permissions based on search query
  const filteredGroupedPermissions = useMemo(() => {
    if (!searchQuery.trim()) return allPermissions;
    const q = searchQuery.toLowerCase().trim();
    const result = {};

    Object.entries(allPermissions).forEach(([resource, permissions]) => {
      const matching = permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.display_name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          resource.toLowerCase().includes(q)
      );
      if (matching.length > 0) {
        result[resource] = matching;
      }
    });

    return result;
  }, [allPermissions, searchQuery]);

  if (!open) return null;

  const totalPermissions = Object.values(allPermissions).reduce(
    (sum, perms) => sum + perms.length,
    0
  );
  const selectedCount = selectedPermissions.size;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-5xl"
      title="Manage Role Permissions"
      footer={
        <div className="flex items-center justify-between gap-4 w-full">
          <p className="text-sm text-slate-600">
            <strong className="text-[#111A62] font-mono font-bold">{selectedCount}</strong> of{" "}
            <strong>{totalPermissions}</strong> permissions assigned to{" "}
            <strong className="text-[#111A62]">{ROLE_DISPLAY_NAMES[role] || role}</strong>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving} className="cursor-pointer">
              <X size={16} className="mr-1" />
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-[#111A62] text-white font-bold cursor-pointer"
            >
              <Check size={16} className="mr-1" />
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Role and count badges with Global Select/Deselect All */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`rounded-lg border px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                ROLE_COLORS[role] || "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {ROLE_DISPLAY_NAMES[role] || role}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {selectedCount} / {totalPermissions} Total Permissions Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllGlobal}
              className="h-7 px-2 text-xs font-bold bg-white text-[#111A62] hover:bg-slate-50 cursor-pointer"
            >
              <CheckSquare size={13} className="mr-1" /> Grant All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAllGlobal}
              className="h-7 px-2 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <Square size={13} className="mr-1" /> Revoke All
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search permissions (e.g. view_applicants, job_library, approve)..."
            className="h-9 text-xs"
          />
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white mt-0.5">
            <Shield size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Customizable Role Permissions</p>
            <p className="mt-0.5 text-blue-700">
              Check or uncheck any permission box below to grant or revoke specific module access for the{" "}
              <strong>{ROLE_DISPLAY_NAMES[role] || role}</strong> role. Changes take effect immediately upon saving.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Content Grid */}
      <div
        className="mt-4 px-1"
        style={{ maxHeight: "calc(75vh - 220px)", overflowY: "auto" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#111A62]"></div>
            <span className="ml-3 text-sm font-semibold">Loading system permissions...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : Object.keys(filteredGroupedPermissions).length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Shield size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No permissions match your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredGroupedPermissions).map(([resource, permissions]) => {
              const resourceIds = permissions.map((p) => p.id);
              const allSelected = resourceIds.every((id) => selectedPermissions.has(id));
              const selectedInResource = permissions.filter((p) => selectedPermissions.has(p.id)).length;

              return (
                <Card key={resource} className="border-slate-200 bg-white shadow-2xs">
                  <CardContent className="pt-4 pb-4">
                    {/* Resource Category Header */}
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#111A62]" />
                        <h3 className="font-extrabold text-sm text-slate-900">
                          {formatResourceName(resource)}
                        </h3>
                        <Badge tone={selectedInResource > 0 ? "info" : "default"} className="text-[10px]">
                          {selectedInResource} / {permissions.length} Enabled
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInResource(permissions)}
                        className="text-xs font-bold text-[#111A62] hover:underline cursor-pointer"
                      >
                        {allSelected ? "Deselect Group" : "Select Group"}
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {permissions.map((permission) => {
                        const isSelected = selectedPermissions.has(permission.id);

                        return (
                          <div
                            key={permission.id}
                            onClick={() => handleTogglePermission(permission)}
                            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer select-none ${
                              isSelected
                                ? "border-[#111A62] bg-blue-50/60 ring-1 ring-[#111A62]/30 shadow-2xs"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                isSelected
                                  ? "border-[#111A62] bg-[#111A62]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check size={11} className="text-white stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-bold font-mono truncate ${
                                  isSelected ? "text-[#111A62]" : "text-slate-800"
                                }`}
                                title={permission.name}
                              >
                                {permission.display_name || permission.name}
                              </p>
                              {permission.description && (
                                <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2 leading-tight">
                                  {permission.description}
                                </p>
                              )}
                              <span className="mt-1 inline-block text-[9px] font-mono text-slate-400">
                                {permission.name}
                              </span>
                            </div>
                          </div>
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
    </Modal>
  );
}
