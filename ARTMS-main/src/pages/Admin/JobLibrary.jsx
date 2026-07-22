import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  XCircle,
  Filter,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import AlertModal from "../../components/ui/AlertModal";
import {
  JobLibraryFormModal,
  JobLibraryApproveModal,
  JobLibraryDeleteModal,
} from "../../modals";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const APPROVAL_TONE = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

const APPROVAL_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const EMPTY_FORM = {
  job_title: "",
  job_description: "",
  qualifications: "",
  responsibilities: "",
  job_category: "",
  employment_type: "full_time",
  salary_min: "",
  salary_max: "",
};

export default function JobLibrary() {
  const { user } = useAuth();
  const isCOO = user?.role === "coo" || user?.role === "super_admin";
  const canEdit = ["hr_admin", "super_admin", "coo"].includes(user?.role);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create",
    data: null,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, job: null });
  const [approveModal, setApproveModal] = useState({
    open: false,
    job: null,
    status: "approved",
    remarks: "",
  });
  const [alertModal, setAlertModal] = useState({
    open: false,
    variant: "success",
    title: "",
    message: "",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/job-library");
      const raw = res.data.data ?? res.data ?? [];
      setJobs(Array.isArray(raw) ? raw : []);
    } catch {
      showAlert("error", "Error", "Failed to load Job Library.");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (variant, title, message) =>
    setAlertModal({ open: true, variant, title, message });

  // ── Filter logic ──
  const filtered = jobs.filter((j) => {
    // Search filter
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesSearch =
        j.job_title?.toLowerCase().includes(s) ||
        j.job_category?.toLowerCase().includes(s) ||
        j.employment_type?.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filter !== "all" && j.approval_status !== filter) return false;

    return true;
  });

  // Pagination
  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginated = filtered.slice(startIdx, endIdx);

  // Statistics
  const stats = {
    total: jobs.length,
    approved: jobs.filter((j) => j.approval_status === "approved").length,
    pending: jobs.filter((j) => j.approval_status === "pending").length,
    rejected: jobs.filter((j) => j.approval_status === "rejected").length,
  };

  // ── Create / Edit ──
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormModal({ open: true, mode: "create", data: null });
  };

  const openEdit = (job) => {
    setForm({
      job_title: job.job_title ?? "",
      job_description: job.job_description ?? "",
      qualifications: job.qualifications ?? "",
      responsibilities: job.responsibilities ?? "",
      job_category: job.job_category ?? "",
      employment_type: job.employment_type ?? "full_time",
      salary_min: job.salary_min ?? "",
      salary_max: job.salary_max ?? "",
    });
    setFormModal({ open: true, mode: "edit", data: job });
  };

  const handleSave = async () => {
    if (!form.job_title.trim()) {
      showAlert("error", "Validation", "Job title is required.");
      return;
    }
    if (!form.job_description.trim()) {
      showAlert("error", "Validation", "Job description is required.");
      return;
    }
    if (!form.qualifications.trim()) {
      showAlert("error", "Validation", "Qualifications are required.");
      return;
    }
    if (!form.responsibilities.trim()) {
      showAlert("error", "Validation", "Responsibilities are required.");
      return;
    }

    setSaving(true);
    try {
      if (formModal.mode === "create") {
        await api.post("/job-library", form);
        showAlert(
          "success",
          "Submitted",
          "Job entry created and sent to COO for approval."
        );
      } else {
        await api.put(`/job-library/${formModal.data.id}`, form);
        showAlert("success", "Updated", "Job entry updated successfully.");
      }
      setFormModal({ open: false, mode: "create", data: null });
      fetchJobs();
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err.response?.data?.message || "Failed to save job entry."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    try {
      await api.delete(`/job-library/${deleteModal.job.id}`);
      showAlert("success", "Deleted", "Job entry removed from the library.");
      setDeleteModal({ open: false, job: null });
      fetchJobs();
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err.response?.data?.message || "Failed to delete job entry."
      );
      setDeleteModal({ open: false, job: null });
    }
  };

  // ── COO Approve / Reject ──
  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.patch(`/job-library/${approveModal.job.id}/approve`, {
        status: approveModal.status,
        remarks: approveModal.remarks,
      });
      showAlert(
        approveModal.status === "approved" ? "success" : "error",
        approveModal.status === "approved" ? "Approved" : "Rejected",
        `Job entry "${approveModal.job.job_title}" has been ${approveModal.status}.`
      );
      setApproveModal({
        open: false,
        job: null,
        status: "approved",
        remarks: "",
      });
      fetchJobs();
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err.response?.data?.message || "Failed to update approval."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Recruitment
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Job Library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Reusable job templates for PRFs and job postings — requires COO approval.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchJobs}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canEdit && (
            <Button variant="primary" onClick={openCreate} className="gap-2">
              <Plus size={14} />
              Add Job Entry
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Approved</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats.approved}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Rejected</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats.rejected}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats.total}
              </p>
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
              {APPROVAL_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setFilter(f.value);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f.value
                      ? "border-[#111A62] bg-[#111A62] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
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
                placeholder="Search job templates..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Templates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Job Templates ({filtered.length}{" "}
              {filtered.length === 1 ? "template" : "templates"})
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
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                No job templates found
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {q || filter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first job template"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Job Title</TH>
                    <TH>Category</TH>
                    <TH>Employment Type</TH>
                    <TH>Approval Status</TH>
                    <TH>Created By</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <TD>
                        <div className="font-semibold text-slate-900">
                          {j.job_title}
                        </div>
                        <div className="text-xs text-slate-400">
                          JL-{String(j.id).padStart(3, "0")}
                        </div>
                      </TD>
                      <TD className="text-slate-600">
                        {j.job_category || "—"}
                      </TD>
                      <TD>
                        <Badge tone="accent">
                          {j.employment_type?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge
                          tone={APPROVAL_TONE[j.approval_status] ?? "default"}
                          className="capitalize"
                        >
                          {j.approval_status}
                        </Badge>
                      </TD>
                      <TD className="text-sm text-slate-600">
                        {j.creator?.name || "—"}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-1.5">
                          {/* COO Review button */}
                          {isCOO && j.approval_status === "pending" && (
                            <button
                              onClick={() =>
                                setApproveModal({
                                  open: true,
                                  job: j,
                                  status: "approved",
                                  remarks: "",
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-green-500 hover:bg-green-50 hover:text-green-600 cursor-pointer"
                              title="Review & Approve"
                            >
                              <Eye size={14} />
                              Review
                            </button>
                          )}

                          {canEdit && (
                            <>
                              {/* Edit Button */}
                              <button
                                onClick={() => openEdit(j)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                                title="Edit Job Template"
                              >
                                <Edit size={16} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() =>
                                  setDeleteModal({ open: true, job: j })
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                title="Delete Job Template"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
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

      {/* ── Create / Edit Modal ── */}
      <JobLibraryFormModal
        open={formModal.open}
        mode={formModal.mode}
        data={formModal.data}
        form={form}
        setForm={setForm}
        onClose={() =>
          setFormModal({ open: false, mode: "create", data: null })
        }
        onSave={handleSave}
        saving={saving}
      />

      {/* ── COO Approve/Reject Modal ── */}
      <JobLibraryApproveModal
        open={approveModal.open}
        job={approveModal.job}
        status={approveModal.status}
        remarks={approveModal.remarks}
        onStatusChange={(status) =>
          setApproveModal({ ...approveModal, status })
        }
        onRemarksChange={(remarks) =>
          setApproveModal({ ...approveModal, remarks })
        }
        onClose={() =>
          setApproveModal({
            open: false,
            job: null,
            status: "approved",
            remarks: "",
          })
        }
        onConfirm={handleApprove}
        saving={saving}
      />

      {/* ── Delete Confirm Modal ── */}
      <JobLibraryDeleteModal
        open={deleteModal.open}
        job={deleteModal.job}
        onClose={() => setDeleteModal({ open: false, job: null })}
        onConfirm={handleDelete}
      />

      {/* Alert */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
      />
    </div>
  );
}
