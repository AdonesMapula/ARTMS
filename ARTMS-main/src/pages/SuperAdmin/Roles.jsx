import { useEffect, useState } from "react";
import { Shield, RefreshCw, Settings, Key, Users, CheckCircle, Filter, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import { PermissionModal } from "../../modals";
import api from "../../services/api";

const ROLE_COLORS = {
  super_admin: "purple",
  hr_admin: "info",
  coo: "success",
  department_head: "warning",
  employee: "default",
};

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  coo: "COO",
  department_head: "Department Head",
  employee: "Employee",
};

const ROLE_DESCRIPTIONS = {
  super_admin: "Full system access and user management",
  hr_admin: "Recruitment operations and employee management",
  coo: "Approvals and strategic oversight",
  department_head: "Department-level requests and reporting",
  employee: "Basic employee access",
};

const PERMISSION_LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "high", label: "High (20+ permissions)" },
  { value: "medium", label: "Medium (10-19 permissions)" },
  { value: "low", label: "Low (<10 permissions)" },
];

export default function Roles() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [q, setQ] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create role form data
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/permissions/all-roles");
      const rolesData = res.data.roles;
      
      // Convert object to array with role info
      const rolesArray = Object.entries(rolesData).map(([roleKey, roleData]) => ({
        id: roleKey,
        name: ROLE_DISPLAY_NAMES[roleKey] || roleKey,
        description: ROLE_DESCRIPTIONS[roleKey] || "",
        permissions: roleData.permission_ids.length,
        permissionDetails: roleData.permissions,
        userCount: 0, // This would come from backend in real scenario
      }));
      
      setRoles(rolesArray);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleManagePermissions = (roleId) => {
    setSelectedRole(roleId);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRole(null);
  };

  const handleSavePermissions = () => {
    loadRoles(); // Reload to get updated counts
  };

  const handleSyncDefaults = async () => {
    if (!confirm("This will reset all role permissions to default settings. Continue?")) return;
    
    setSyncing(true);
    try {
      await api.post("/permissions/sync-defaults");
      alert("Default permissions synchronized successfully!");
      loadRoles();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to sync permissions");
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenCreateModal = () => {
    setRoleForm({ name: "", description: "" });
    setCreateModalOpen(true);
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      alert("Please enter a role name");
      return;
    }

    setSaving(true);
    try {
      await api.post("/roles", {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
      });
      
      setCreateModalOpen(false);
      setRoleForm({ name: "", description: "" });
      loadRoles();
      alert("Role created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filtered = roles.filter((r) => {
    // Search filter
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesSearch =
        r.name?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }

    // Permission level filter
    if (permissionLevel !== "all") {
      if (permissionLevel === "high" && r.permissions < 20) return false;
      if (permissionLevel === "medium" && (r.permissions < 10 || r.permissions >= 20)) return false;
      if (permissionLevel === "low" && r.permissions >= 10) return false;
    }

    return true;
  });

  // Pagination
  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginated = filtered.slice(startIdx, endIdx);

  // Statistics
  const stats = {
    total: roles.length,
    highAccess: roles.filter((r) => r.permissions >= 20).length,
    mediumAccess: roles.filter((r) => r.permissions >= 10 && r.permissions < 20).length,
    lowAccess: roles.filter((r) => r.permissions < 10).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Security
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage role-based access control and permissions for each user role.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="gap-2"
          >
            <Plus size={16} />
            Create Role
          </Button>
          <Button variant="outline" onClick={loadRoles} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncDefaults}
            disabled={syncing || loading}
            className="gap-2"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync Defaults"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Roles</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Key size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">High Access</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.highAccess}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <CheckCircle size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Medium Access</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.mediumAccess}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Users size={24} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Low Access</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.lowAccess}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={16} />
              Filters:
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              {PERMISSION_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => {
                    setPermissionLevel(level.value);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    permissionLevel === level.value
                      ? "border-[#111A62] bg-[#111A62] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-64">
              <SearchBar
                value={q}
                onChange={(val) => {
                  setQ(val);
                  setPage(1);
                }}
                placeholder="Search roles..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              System Roles ({filtered.length} {filtered.length === 1 ? "role" : "roles"})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center">
              <Shield size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No roles found</p>
              <p className="mt-1 text-xs text-slate-400">
                {q || permissionLevel !== "all"
                  ? "Try adjusting your search or filters"
                  : "No roles available"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Role</TH>
                    <TH>Description</TH>
                    <TH>Permissions</TH>
                    <TH>Access Level</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50">
                      <TD>
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-slate-400" />
                          <span className="font-semibold text-slate-900">{role.name}</span>
                        </div>
                      </TD>
                      <TD className="max-w-xs text-slate-600">{role.description}</TD>
                      <TD>
                        <Badge tone={ROLE_COLORS[role.id] || "default"}>
                          {role.permissions} permissions
                        </Badge>
                      </TD>
                      <TD>
                        {role.permissions >= 20 ? (
                          <Badge tone="danger">High</Badge>
                        ) : role.permissions >= 10 ? (
                          <Badge tone="warning">Medium</Badge>
                        ) : (
                          <Badge tone="default">Low</Badge>
                        )}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-1.5">
                          {/* Manage Permissions Button */}
                          <button
                            onClick={() => handleManagePermissions(role.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                            title="Manage Permissions"
                          >
                            <Settings size={14} />
                            Manage Permissions
                          </button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {total > pageSize && (
                <div className="mt-4">
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Permission Modal */}
      <PermissionModal
        open={modalOpen}
        role={selectedRole}
        onClose={handleModalClose}
        onSave={handleSavePermissions}
      />

      {/* Create Role Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Role"
        description="Add a new custom role to your system"
        className="max-w-lg"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
              disabled={saving}
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleCreateRole}
              disabled={saving || !roleForm.name.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#111A62] bg-[#111A62] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0d1449] hover:border-[#0d1449] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} />
              {saving ? "Creating..." : "Create Role"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Shield size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Creating a Custom Role
              </p>
              <p className="mt-1 text-xs text-slate-600">
                After creating the role, you can manage its permissions from the roles table.
              </p>
            </div>
          </div>

          {/* Role Details Section */}
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Role Details
            </p>
            <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
              <Input
                label="Role Name"
                placeholder="e.g., Finance Manager, IT Support"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Description <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#111A62] focus:ring-4 focus:ring-[#111A62]/10 resize-none"
                  placeholder="Describe what this role can do..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">📌 Next Steps:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Create the role with a descriptive name</li>
              <li>Click "Manage Permissions" to assign specific permissions</li>
              <li>Users can then be assigned to this role from the Users page</li>
            </ol>
          </div>
        </div>
      </Modal>
    </div>
  );
}
