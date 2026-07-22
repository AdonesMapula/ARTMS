import { useEffect, useState } from "react";
import { Users as UsersIcon, UserPlus, UserCheck, UserX, Filter, RefreshCw, Trash2, Edit, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Skeleton from "../../components/ui/Skeleton";
import { UserModal, QuickAddRoleModal, QuickAddDepartmentModal } from "../../modals";
import userService from "../../services/userService";
import departmentService from "../../services/departmentService";
import api from "../../services/api";

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
      .finally(() => setLoading(false));
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
    if (editUser) {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department_id: formData.department_id || null,
      };
      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }
      await userService.update(editUser.id, payload);
    } else {
      await userService.create({
        ...formData,
        department_id: formData.department_id || null,
      });
    }
    load();
  };

  const handleToggle = async (id) => {
    try {
      await userService.toggleStatus(id);
      setConfirmId(null);
      setConfirmUser(null);
      load(); // Reload users to show updated status
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      alert("Failed to update user status. Please try again.");
    }
  };

  const handleAddRole = async (roleData) => {
    await api.post("/roles", roleData);
    load();
  };

  const handleAddDepartment = async (deptData) => {
    await departmentService.create(deptData);
    load();
  };

  const handleDelete = async (id) => {
    try {
      await userService.delete(id);
      setDeleteId(null);
      setDeleteUser(null);
      load(); // Reload users after deletion
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(error.response?.data?.message || "Failed to delete user. Please try again.");
    }
  };

  // Filter logic
  const filtered = users.filter((u) => {
    // Search filter
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesSearch =
        u.name?.toLowerCase().includes(s) ||
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
        <div className="flex gap-2">
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <UsersIcon size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Users</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <UserCheck size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Active Users</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <UserX size={24} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Inactive Users</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <UsersIcon size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">HR Admins</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.hrAdmin}</p>
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
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    setRoleFilter(role.value);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    roleFilter === role.value
                      ? "border-[#111A62] bg-[#111A62] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {role.label}
                </button>
              ))}
              <div className="mx-2 h-6 w-px bg-slate-200"></div>
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setStatusFilter(status.value);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status.value
                      ? "border-[#111A62] bg-[#111A62] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {status.label}
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
                placeholder="Search users..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Users ({filtered.length} {filtered.length === 1 ? "user" : "users"})
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
              <UsersIcon size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No users found</p>
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
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Role</TH>
                    <TH>Department</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">
                        {u.name}
                        {u.employee_id && (
                          <div className="text-xs text-slate-400">{u.employee_id}</div>
                        )}
                      </TD>
                      <TD className="text-slate-600">{u.email}</TD>
                      <TD>
                        <Badge tone={ROLE_TONE[u.role] ?? "default"}>
                          {u.role?.replace(/_/g, " ")}
                        </Badge>
                      </TD>
                      <TD>
                        {u.department?.department_name ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </TD>
                      <TD>
                        <Badge tone={u.is_active ? "success" : "default"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEdit(u)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Disable/Enable Button */}
                          {u.is_active ? (
                            <button
                              onClick={() => {
                                setConfirmId(u.id);
                                setConfirmUser(u);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                              title="Disable User"
                            >
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmId(u.id);
                                setConfirmUser(u);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-green-500 hover:bg-green-50 hover:text-green-600 cursor-pointer"
                              title="Enable User"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setDeleteId(u.id);
                              setDeleteUser(u);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
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
            ? `Are you sure you want to disable ${confirmUser?.name}'s account? They will no longer be able to log in to the system.`
            : `Are you sure you want to enable ${confirmUser?.name}'s account? They will be able to log in to the system again.`
        }
        confirmLabel={confirmUser?.is_active ? "Yes, Disable" : "Yes, Enable"}
        tone={confirmUser?.is_active ? "danger" : "primary"}
        onConfirm={() => handleToggle(confirmId)}
        onClose={() => {
          setConfirmId(null);
          setConfirmUser(null);
        }}
      />

      {/* Delete User Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete User Permanently?"
        description={`Are you sure you want to permanently delete ${deleteUser?.name}? This action cannot be undone and all user data will be removed from the system.`}
        confirmLabel="Yes, Delete Permanently"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => {
          setDeleteId(null);
          setDeleteUser(null);
        }}
      />
    </div>
  );
}
