import { useEffect, useState } from "react";
import { Users as UsersIcon, RefreshCw, RefreshCcw, Filter, Search, Eye, Trash2, Briefcase, Hash, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import userService from "../../services/userService";
import { useToast } from "../../context/ToastContext";

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "coo", label: "COO" },
  { value: "department_head", label: "Department Head" },
  { value: "employee", label: "Employee" },
];

const ROLE_TONE = {
  super_admin: "danger",
  hr_admin: "info",
  coo: "accent",
  department_head: "warning",
  employee: "default",
};

export default function ArchivedUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [restoreId, setRestoreId] = useState(null);
  const [restoreUser, setRestoreUser] = useState(null);

  const [forceDeleteId, setForceDeleteId] = useState(null);
  const [forceDeleteUser, setForceDeleteUser] = useState(null);

  // Multi-select bulk state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  const load = () => {
    setLoading(true);
    userService.getArchived()
      .then((uRes) => {
        setUsers(uRes.data.data ?? uRes.data);
      })
      .finally(() => {
        setLoading(false);
        setSelectedIds([]);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (id) => {
    const target = users.find((u) => u.id === id);
    const name = [target?.first_name, target?.last_name].filter(Boolean).join(" ") || target?.name || "User";
    try {
      await userService.restore(id);
      setRestoreId(null);
      setRestoreUser(null);
      load();
      toast.success("User Restored", `${name} has been restored successfully.`);
    } catch (error) {
      toast.error("Restore Failed", error.response?.data?.message || "Failed to restore user. Please try again.");
    }
  };

  const handleForceDelete = async (id) => {
    const target = users.find((u) => u.id === id);
    const name = [target?.first_name, target?.last_name].filter(Boolean).join(" ") || target?.name || "User";
    try {
      await userService.forceDelete(id);
      setForceDeleteId(null);
      setForceDeleteUser(null);
      setSlideOverOpen(false);
      load();
      toast.success("User Permanently Deleted", `${name} has been permanently deleted or anonymized.`);
    } catch (error) {
      console.error("Failed to permanently delete user:", error);
      toast.error("Delete Failed", error.response?.data?.message || "Failed to permanently delete user.");
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

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await userService.bulkRestore(selectedIds);
      toast.success("Users Restored", `Successfully restored ${selectedIds.length} user(s).`);
      setBulkRestoreConfirm(false);
      setSelectedIds([]);
      load();
    } catch (error) {
      console.error("Bulk restore error:", error);
      toast.error("Bulk Restore Failed", error.response?.data?.message || "Failed to restore selected users.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkForceDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await userService.bulkForceDelete(selectedIds);
      toast.success("Users Permanently Deleted", `Successfully permanently deleted ${selectedIds.length} user(s).`);
      setBulkDeleteConfirm(false);
      setSelectedIds([]);
      load();
    } catch (error) {
      console.error("Bulk force delete error:", error);
      toast.error("Bulk Delete Failed", error.response?.data?.message || "Failed to permanently delete selected users.");
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

    return true;
  });

  // Pagination
  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginated = filtered.slice(startIdx, endIdx);

  const isAllPageSelected = paginated.length > 0 && paginated.every((u) => selectedIds.includes(u.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Archived Users
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, restore, or permanently delete users that have been archived.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="primary"
                onClick={() => setBulkRestoreConfirm(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <RefreshCcw size={15} />
                Restore Selected ({selectedIds.length})
              </Button>
              <Button
                variant="danger"
                onClick={() => setBulkDeleteConfirm(true)}
                className="gap-2 font-bold"
              >
                <Trash2 size={15} />
                Delete Selected ({selectedIds.length})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
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
                placeholder="Search archived users by name, email, or role..."
                className="h-9 text-xs"
              />
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <div className="w-full sm:w-48 shrink-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Filter size={13} className="text-slate-400" />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 w-full appearance-none rounded-md border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-850 pl-8 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#111A62] dark:focus:border-blue-500 cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
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
              <span>Archived Users</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filtered.length} {filtered.length === 1 ? "record" : "records"}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer"
                  />
                </TH>
                <TH>Employee</TH>
                <TH>Role</TH>
                <TH>Department</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <TD className="w-10 text-center"><Skeleton className="h-4 w-4 rounded" /></TD>
                    <TD><Skeleton className="h-10 w-48 rounded-md" /></TD>
                    <TD><Skeleton className="h-5 w-20 rounded" /></TD>
                    <TD><Skeleton className="h-5 w-28 rounded-md" /></TD>
                    <TD><Skeleton className="h-7 w-16 rounded-md ml-auto" /></TD>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-semibold text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-2.5">
                        <UsersIcon size={22} className="text-slate-400" />
                      </div>
                      No archived users found.
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((user) => {
                  const combinedName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") || user.name || "Unknown User";
                  const isChecked = selectedIds.includes(user.id);

                  return (
                    <tr key={user.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                      <TD className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleSelectOne(user.id, e)}
                          className="rounded border-slate-300 dark:border-slate-600 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer"
                        />
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {user.avatar ? (
                              <img src={user.avatar} alt="avatar" className="h-full w-full rounded-md object-cover" />
                            ) : (
                              combinedName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                              {combinedName}
                              {user.employee_id && <span className="ml-1.5 text-[10px] font-mono font-medium text-slate-400">ID: {user.employee_id}</span>}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={ROLE_TONE[user.role] ?? "default"} className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider">
                          {user.role?.replace(/_/g, " ")}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user.department?.name || user.department?.department_name || "N/A"}</span>
                          {user.department && <span className="text-[10px] font-mono text-slate-400">Dept ID: {user.department.id}</span>}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7.5 rounded-md text-xs font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            onClick={() => {
                              setSelectedUser(user);
                              setSlideOverOpen(true);
                            }}
                          >
                            <Eye size={13} />
                            View Details
                          </Button>
                        </div>
                      </TD>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </CardContent>
        {total > pageSize && (
          <div className="border-t border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-850/50">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* Restore User Confirm */}
      <ConfirmDialog
        open={!!restoreId}
        title="Restore User?"
        description={`Are you sure you want to restore ${[restoreUser?.first_name, restoreUser?.middle_name, restoreUser?.last_name].filter(Boolean).join(" ") || restoreUser?.name}? They will be moved back to the active user list and can log in normally.`}
        confirmLabel="Yes, Restore User"
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={() => handleRestore(restoreId)}
        onClose={() => {
          setRestoreId(null);
          setRestoreUser(null);
        }}
      />

      {/* Bulk Restore Confirm */}
      <ConfirmDialog
        open={bulkRestoreConfirm}
        title="Restore Selected Users?"
        description={`Are you sure you want to restore ${selectedIds.length} selected user account(s)? They will be moved back to the active user list and can log in normally.`}
        confirmLabel={bulkActionLoading ? "Restoring..." : "Yes, Restore Selected"}
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={handleBulkRestore}
        onClose={() => setBulkRestoreConfirm(false)}
      />

      {/* Bulk Force Delete Confirm */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Permanently Delete Selected Users?"
        description={`Are you sure you want to permanently delete ${selectedIds.length} selected user account(s)? If they have associated system records, their personal data will be anonymized. This action CANNOT be undone.`}
        confirmLabel={bulkActionLoading ? "Deleting..." : "Yes, Permanently Delete"}
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleBulkForceDelete}
        onClose={() => setBulkDeleteConfirm(false)}
      />

      {/* Force Delete User Confirm */}
      <ConfirmDialog
        open={!!forceDeleteId}
        title="Permanently Delete User?"
        description={`Are you sure you want to permanently delete ${[forceDeleteUser?.first_name, forceDeleteUser?.middle_name, forceDeleteUser?.last_name].filter(Boolean).join(" ") || forceDeleteUser?.name}? If they have system data (e.g. requests), their personal info will be anonymized to maintain data integrity. This action CANNOT be undone.`}
        confirmLabel="Yes, Permanently Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => handleForceDelete(forceDeleteId)}
        onClose={() => {
          setForceDeleteId(null);
          setForceDeleteUser(null);
        }}
      />

      {/* User Details Modal */}
      <Modal
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Archived User Details"
        className="max-w-md w-full"
      >
        {selectedUser && (
          <div className="flex flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600 shadow-sm border border-slate-200">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="avatar" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    ([selectedUser.first_name, selectedUser.middle_name, selectedUser.last_name].filter(Boolean).join(" ") || selectedUser.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {[selectedUser.first_name, selectedUser.middle_name, selectedUser.last_name].filter(Boolean).join(" ") || selectedUser.name || "Unknown User"}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Account Information</h4>
                
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm"><Briefcase size={16} className="text-slate-400" /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Role</p>
                      <p className="text-sm font-bold text-slate-700 capitalize">{selectedUser.role?.replace(/_/g, " ")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm"><Building2 size={16} className="text-slate-400" /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Department</p>
                      <p className="text-sm font-bold text-slate-700">{selectedUser.department?.name || "None Assigned"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm"><Hash size={16} className="text-slate-400" /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Employee ID</p>
                      <p className="text-sm font-bold text-slate-700">{selectedUser.employee_id || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 pb-6 pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-center gap-2 font-bold py-2 text-sm border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setForceDeleteUser(selectedUser);
                  setForceDeleteId(selectedUser.id);
                  setSlideOverOpen(false);
                }}
              >
                <Trash2 size={16} />
                Permanently Delete
              </Button>

              <Button
                variant="primary"
                className="w-full sm:w-auto justify-center gap-2 font-bold py-2 text-sm shadow-md"
                onClick={() => {
                  setRestoreUser(selectedUser);
                  setRestoreId(selectedUser.id);
                  setSlideOverOpen(false);
                }}
              >
                <RefreshCcw size={16} />
                Restore User Account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
