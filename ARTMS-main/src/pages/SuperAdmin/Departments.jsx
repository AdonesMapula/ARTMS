import { useEffect, useState } from "react";
import { Building2, Plus, Users, RefreshCw, Edit, Trash2, UserCheck, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Skeleton from "../../components/ui/Skeleton";
import DepartmentModal from "../../modals/DepartmentModal";
import departmentService from "../../services/departmentService";

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);

  const load = () => {
    setLoading(true);
    departmentService
      .getAll()
      .then((r) => setDepts(r.data.departments ?? r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditDept(null);
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditDept(d);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editDept) {
      await departmentService.update(editDept.id, formData);
    } else {
      await departmentService.create(formData);
    }
    load();
  };

  const handleDelete = async (id) => {
    try {
      await departmentService.delete(id);
      setDeleteId(null);
      setDeleteDept(null);
      load();
    } catch (error) {
      console.error("Failed to delete department:", error);
      alert(error.response?.data?.message || "Failed to delete department. Please try again.");
    }
  };

  // Filter logic
  const filtered = depts.filter((d) => {
    // Search filter
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesSearch =
        d.department_name?.toLowerCase().includes(s) ||
        d.department_code?.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter === "active" && !d.is_active) return false;
    if (statusFilter === "inactive" && d.is_active) return false;

    return true;
  });

  // Pagination
  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginated = filtered.slice(startIdx, endIdx);

  // Statistics
  const stats = {
    total: depts.length,
    active: depts.filter((d) => d.is_active).length,
    inactive: depts.filter((d) => !d.is_active).length,
    totalStaff: depts.reduce((sum, d) => sum + (d.employees_count || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Organization
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Department Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage departments, track staff members, and monitor organizational structure.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="primary" onClick={openCreate} className="gap-2">
            <Plus size={14} />
            Add Department
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Departments</p>
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
              <p className="text-sm font-semibold text-slate-500">Active Departments</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Building2 size={24} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Inactive Departments</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Users size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Staff</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.totalStaff}</p>
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
                placeholder="Search departments..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Departments ({filtered.length} {filtered.length === 1 ? "department" : "departments"})
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
              <Building2 size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No departments found</p>
              <p className="mt-1 text-xs text-slate-400">
                {q || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first department"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Department Name</TH>
                    <TH>Code</TH>
                    <TH>Staff Count</TH>
                    <TH>Department Head</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <TD className="font-semibold text-slate-900">
                        {d.department_name}
                      </TD>
                      <TD>
                        {d.department_code ? (
                          <Badge tone="default">{d.department_code}</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TD>
                      <TD>
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">
                            {d.employees_count || 0}
                          </span>
                        </div>
                      </TD>
                      <TD>
                        {d.department_head?.name ?? (
                          <span className="text-slate-400">Not assigned</span>
                        )}
                      </TD>
                      <TD>
                        <Badge tone={d.is_active ? "success" : "default"}>
                          {d.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEdit(d)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                            title="Edit Department"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setDeleteId(d.id);
                              setDeleteDept(d);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="Delete Department"
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

      {/* Department Modal */}
      <DepartmentModal
        open={modalOpen}
        editDept={editDept}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Department Permanently?"
        description={`Are you sure you want to permanently delete ${deleteDept?.department_name}? ${
          (deleteDept?.employees_count || 0) > 0
            ? `This department has ${deleteDept.employees_count} staff member(s). They will need to be reassigned.`
            : "This action cannot be undone."
        }`}
        confirmLabel="Yes, Delete Permanently"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => {
          setDeleteId(null);
          setDeleteDept(null);
        }}
      />
    </div>
  );
}
