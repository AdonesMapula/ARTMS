import { useEffect, useState } from "react";
import { Users as UsersIcon, User as UserIcon, UserPlus, UserCheck, UserX, Filter, RefreshCw, Trash2, Edit, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { UserModal, QuickAddRoleModal, QuickAddDepartmentModal } from "../../modals";
import userService from "../../services/userService";
import departmentService from "../../services/departmentService";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "coo", label: "COO" },
  { value: "department_head", label: "Department Head" },
  { value: "employee", label: "Employee" },
];

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ROLE_TONE = {
  super_admin: "danger",
  hr_admin: "info",
  coo: "accent",
  department_head: "warning",
  employee: "default",
};

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  // Multi-select bulk state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      userService.getAll(),
      departmentService.getAll(),
      api.get("/roles").catch(() => ({ data: [] }))
    ])
      .then(([uRes, dRes, rRes]) => {
        setUsers(uRes.data.data ?? uRes.data);
        setDepts(dRes.data.departments ?? dRes.data);
        setRoles(rRes.data.roles ?? rRes.data ?? []);
      })
      .finally(() => {
        setLoading(false);
        setSelectedIds([]);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    let result = null;
    if (editUser) {
      const payload = {
        email: formData.email,
        role: formData.role,
        department_id: formData.department_id || null,
      };

      if (formData.first_name) payload.first_name = formData.first_name;
      if (formData.middle_name) payload.middle_name = formData.middle_name;
      if (formData.last_name) payload.last_name = formData.last_name;

      payload.name = [formData.first_name, formData.middle_name, formData.last_name]
        .filter(Boolean)
        .join(" ");

      if (formData.department_id === "") {
        payload.department_id = null;
      }

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }
      result = await userService.update(editUser.id, payload);
      toast.success("User Updated", `${payload.name || "User"} has been updated successfully.`);
    } else {
      const combinedName = [formData.first_name, formData.middle_name, formData.last_name]
        .filter(Boolean)
        .join(" ");

      const createPayload = {
        ...formData,
        name: combinedName,
        department_id: formData.department_id || null,
      };

      if (!createPayload.password) {
        delete createPayload.password;
        delete createPayload.password_confirmation;
      }

      result = await userService.create(createPayload);
      toast.success("User Created", `${combinedName || "New user"} has been created successfully.`);
      setPage(1);
    }
    load();
    return result;
  };

  const handleToggle = async (id) => {
    const target = users.find((u) => u.id === id);
    const action = target?.is_active ? "disabled" : "enabled";
    const name = [target?.first_name, target?.last_name].filter(Boolean).join(" ") || target?.name || "User";
    try {
      await userService.toggleStatus(id);
      setConfirmId(null);
      setConfirmUser(null);
      load();
      toast.success(`Account ${action === "disabled" ? "Disabled" : "Enabled"}`, `${name}'s account has been ${action}.`);
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      toast.error("Action Failed", "Failed to update user status. Please try again.");
    }
  };

  const handleAddRole = async (roleData) => {
    await api.post("/roles", roleData);
    toast.success("Role Added", "New role has been created successfully.");
    load();
  };

  const handleAddDepartment = async (deptData) => {
    await departmentService.create(deptData);
    toast.success("Department Added", "New department has been created successfully.");
    load();
  };

  const handleDelete = async (id) => {
    const target = users.find((u) => u.id === id);
    const name = [target?.first_name, target?.last_name].filter(Boolean).join(" ") || target?.name || "User";
    try {
      await userService.delete(id);
      setDeleteId(null);
      setDeleteUser(null);
      load();
      toast.success("User Archived", `${name} has been moved to the archive.`);
    } catch (error) {
      console.error("Failed to archive user:", error);
      toast.error("Archive Failed", error.response?.data?.message || "Failed to archive user. Please try again.");
    }
  };

  // Bulk actions
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginated.map((u) => u.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(paginated.map((u) => u.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelectOne = (id, e) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await userService.bulkArchive(selectedIds);
      toast.success("Users Archived", `Successfully archived ${selectedIds.length} user(s).`);
      setBulkArchiveConfirm(false);
      setSelectedIds([]);
      load();
    } catch (error) {
      console.error("Bulk archive error:", error);
      toast.error("Bulk Archive Failed", error.response?.data?.message || "Failed to archive selected users.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Filter logic
  const filtered = users.filter((u) => {
    // Search filter
    if (q.trim()) {
      const s = q.toLowerCase();
      const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch =
        fullName.includes(s) ||
        (u.name && u.name.toLowerCase().includes(s)) ||
        u.email?.toLowerCase().includes(s) ||
        u.role?.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter !== "all" && u.role !== roleFilter) return false;

    // Status filter
    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "inactive" && u.is_active) return false;

    return true;
  });

  // Pagination
  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginated = filtered.slice(startIdx, endIdx);

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    hrAdmin: users.filter((u) => u.role === "hr_admin").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage user accounts, roles, and permissions across the system.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setBulkArchiveConfirm(true)}
              className="gap-2 font-bold"
            >
              <Trash2 size={15} />
              Archive Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="primary" onClick={openCreate} className="gap-2">
            <UserPlus size={14} />
            Create User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatFilterCard
          title="Total Users"
          value={stats.total}
          icon={<UsersIcon size={20} />}
          accentColor="navy"
          active={statusFilter === "all" && roleFilter === "all"}
          onClick={() => {
            setStatusFilter("all");
            setRoleFilter("all");
            setPage(1);
          }}
        />
        <StatFilterCard
          title="Active Users"
          value={stats.active}
          icon={<UserCheck size={20} />}
          accentColor="emerald"
          active={statusFilter === "active" && roleFilter === "all"}
          onClick={() => {
            setStatusFilter("active");
            setRoleFilter("all");
            setPage(1);
          }}
        />
        <StatFilterCard
          title="Inactive Users"
          value={stats.inactive}
          icon={<UserX size={20} />}
          accentColor="rose"
          active={statusFilter === "inactive" && roleFilter === "all"}
          onClick={() => {
            setStatusFilter("inactive");
            setRoleFilter("all");
            setPage(1);
          }}
        />
        <StatFilterCard
          title="HR Admins"
          value={stats.hrAdmin}
          icon={<UsersIcon size={20} />}
          accentColor="purple"
          active={statusFilter === "all" && roleFilter === "hr_admin"}
          onClick={() => {
            setStatusFilter("all");
            setRoleFilter("hr_admin");
            setPage(1);
          }}
        />
      </div>

      {/* Filters & Search */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="py-3 px-4 sm:px-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-full sm:flex-1 min-w-[220px]">
              <SearchBar
                value={q}
                onChange={(val) => {
                  setQ(val);
                  setPage(1);
                }}
                placeholder="Search users by name, email, or role..."
                className="h-9 text-xs"
              />
            </div>
            <div className="flex w-full sm:w-auto gap-2.5">
              <div className="w-full sm:w-44 shrink-0">
                <Select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  options={ROLES}
                  icon={Filter}
                  size="sm"
                  placeholder="All Roles"
                  buttonClassName="h-9 text-xs"
                />
              </div>
              <div className="w-full sm:w-44 shrink-0">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={STATUSES}
                  icon={Filter}
                  size="sm"
                  placeholder="All Status"
                  buttonClassName="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 py-3 px-4 sm:px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Users Directory</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filtered.length} {filtered.length === 1 ? "record" : "records"}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center">
              <UsersIcon size={40} className="mx-auto mb-2.5 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No users found</p>
              <p className="mt-1 text-xs text-slate-400">
                {q || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first user"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && paginated.every((u) => selectedIds.includes(u.id))}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer"
                      />
                    </TH>
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Role</TH>
                    <TH>Department</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((u) => {
                    const displayName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ") || u.name || "Unknown User";
                    const isChecked = selectedIds.includes(u.id);

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                        <TD className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleSelectOne(u.id, e)}
                            className="rounded border-slate-300 dark:border-slate-600 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer"
                          />
                        </TD>
                        <TD className="font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2.5">
                            {u.avatar ? (
                              <img src={u.avatar} alt={displayName} className="h-8 w-8 shrink-0 rounded-md object-cover border border-slate-200/80 dark:border-slate-700 shadow-2xs" />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#111A62]/10 dark:bg-blue-900/30 text-[#111A62] dark:text-blue-300 ring-1 ring-[#111A62]/20 font-bold text-xs" title="No photo">
                                {displayName[0]?.toUpperCase() || <UserIcon size={14} />}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                              {u.employee_id && (
                                <p className="text-[10px] font-mono text-slate-400">ID: {u.employee_id}</p>
                              )}
                            </div>
                          </div>
                        </TD>
                        <TD className="text-xs text-slate-600 dark:text-slate-400 font-medium">{u.email}</TD>
                        <TD>
                          <Badge tone={ROLE_TONE[u.role] ?? "default"} className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5">
                            {u.role?.replace(/_/g, " ")}
                          </Badge>
                        </TD>
                        <TD className="text-xs text-slate-700 dark:text-slate-300">
                          {u.department?.department_name ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </TD>
                        <TD>
                          <Badge tone={u.is_active ? "success" : "default"} className="text-[10px] px-1.5 py-0.5">
                            {u.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <div className="inline-flex gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => openEdit(u)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 cursor-pointer"
                              title="Edit User"
                            >
                              <Edit size={13} />
                            </button>

                            {/* Disable/Enable Button */}
                            {u.is_active ? (
                              <button
                                onClick={() => {
                                  setConfirmId(u.id);
                                  setConfirmUser(u);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 hover:text-amber-600 cursor-pointer"
                                title="Disable User"
                              >
                                <Ban size={13} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setConfirmId(u.id);
                                  setConfirmUser(u);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 hover:text-emerald-600 cursor-pointer"
                                title="Enable User"
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                setDeleteId(u.id);
                                setDeleteUser(u);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 hover:text-rose-600 cursor-pointer"
                              title="Archive User"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Modal */}
      <UserModal
        open={modalOpen}
        editUser={editUser}
        departments={depts}
        roles={roles}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onCreateRole={() => setRoleModalOpen(true)}
        onCreateDepartment={() => setDeptModalOpen(true)}
      />

      {/* Quick Add Role Modal */}
      <QuickAddRoleModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onAdd={handleAddRole}
      />

      {/* Quick Add Department Modal */}
      <QuickAddDepartmentModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        onAdd={handleAddDepartment}
      />

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        open={!!confirmId}
        title={confirmUser?.is_active ? "Disable User Account?" : "Enable User Account?"}
        description={
          confirmUser?.is_active
            ? `Are you sure you want to disable ${[confirmUser?.first_name, confirmUser?.middle_name, confirmUser?.last_name].filter(Boolean).join(" ") || confirmUser?.name}'s account? They will no longer be able to log in to the system.`
            : `Are you sure you want to enable ${[confirmUser?.first_name, confirmUser?.middle_name, confirmUser?.last_name].filter(Boolean).join(" ") || confirmUser?.name}'s account? They will be able to log in to the system again.`
        }
        confirmLabel={confirmUser?.is_active ? "Yes, Disable" : "Yes, Enable"}
        tone={confirmUser?.is_active ? "danger" : "primary"}
        onConfirm={() => handleToggle(confirmId)}
        onClose={() => {
          setConfirmId(null);
          setConfirmUser(null);
        }}
      />

      {/* Archive User Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Archive User?"
        description={`Are you sure you want to archive ${[deleteUser?.first_name, deleteUser?.middle_name, deleteUser?.last_name].filter(Boolean).join(" ") || deleteUser?.name}? They will be removed from this list, but you can restore them from the Archived Users menu.`}
        confirmLabel="Yes, Archive User"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => {
          setDeleteId(null);
          setDeleteUser(null);
        }}
      />

      {/* Bulk Archive Confirm */}
      <ConfirmDialog
        open={bulkArchiveConfirm}
        title="Archive Selected Users?"
        description={`Are you sure you want to move all ${selectedIds.length} selected user account(s) to the archive? You can restore them anytime from the Archived Users page.`}
        confirmLabel={bulkActionLoading ? "Archiving..." : "Yes, Archive Selected"}
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleBulkArchive}
        onClose={() => setBulkArchiveConfirm(false)}
      />
    </div>
  );
}

function StatFilterCard({ title, value, icon, accentColor, active, onClick }) {
  const colorMap = {
    navy: { bg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" },
    teal: { bg: "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" },
  };
  const theme = colorMap[accentColor] || colorMap.navy;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3.5 transition-all cursor-pointer ${
        active
          ? "border-[#111A62] dark:border-blue-500 ring-2 ring-[#111A62]/15 dark:ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/30 shadow-xs"
          : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${theme.bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <p className="font-mono text-xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
