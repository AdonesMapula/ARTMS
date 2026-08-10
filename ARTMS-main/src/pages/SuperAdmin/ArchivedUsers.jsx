import { useEffect, useState } from "react";
import { Users as UsersIcon, RefreshCw, RefreshCcw, Filter, Search, Eye, Trash2, Briefcase, Hash, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Skeleton from "../../components/ui/Skeleton";
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

  const [selectedUser, setSelectedUser] = useState(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  const load = () => {
    setLoading(true);
    userService.getArchived()
      .then((uRes) => {
        setUsers(uRes.data.data ?? uRes.data);
      })
      .finally(() => setLoading(false));
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
            View and restore users that have been archived.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-[#111A62]">
              <UsersIcon size={20} className="text-[#E15B1D]" />
              Archived Directory
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Role Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-48 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Search Bar */}
              <div className="w-full sm:w-64">
                <SearchBar
                  placeholder="Search archived users..."
                  value={q}
                  onChange={(val) => {
                    setQ(val);
                    setPage(1);
                  }}
                  className="rounded-xl shadow-sm bg-white"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Employee</TH>
                <TH>Role</TH>
                <TH>Department</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <TD><Skeleton className="h-10 w-48 rounded-lg" /></TD>
                    <TD><Skeleton className="h-6 w-24 rounded-full" /></TD>
                    <TD><Skeleton className="h-6 w-32 rounded-lg" /></TD>
                    <TD><Skeleton className="h-8 w-16 rounded-lg ml-auto" /></TD>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm font-semibold text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-slate-50 p-3">
                        <UsersIcon size={24} className="text-slate-300" />
                      </div>
                      No archived users found.
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((user) => {
                  const combinedName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") || user.name || "Unknown User";
                  
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50/80">
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 shadow-sm border border-slate-200">
                            {user.avatar ? (
                              <img src={user.avatar} alt="avatar" className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              combinedName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">
                              {combinedName}
                              {user.employee_id && <span className="ml-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">ID: {user.employee_id}</span>}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={ROLE_TONE[user.role] ?? "default"} className="px-2.5 py-1 text-[10px] uppercase tracking-wide font-black">
                          {user.role?.replace(/_/g, " ")}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{user.department?.name || "N/A"}</span>
                          {user.department && <span className="text-[10px] font-semibold text-slate-400">Dept ID: {user.department.id}</span>}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setSlideOverOpen(true);
                            }}
                          >
                            <Eye size={14} />
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
          <div className="border-t border-slate-100 p-4 bg-slate-50 rounded-b-3xl">
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
