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
  Briefcase,
  User,
  DollarSign,
  Calendar,
  MousePointerClick,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import AlertModal from "../../components/ui/AlertModal";
import {
  JobLibraryFormModal,
  JobLibraryApproveModal,
  JobLibraryDeleteModal,
  JobLibraryViewModal,
} from "../../modals";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const fmtMoney = (v) =>
  v != null
    ? "₱" + parseFloat(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";

const APPROVAL_TONE = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

const APPROVAL_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Needs Revision (Rejected)" },
];

const EMPTY_FORM = {
  job_title: "",
  job_description: "",
  qualifications: [],
  responsibilities: [],
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
  const [viewModal, setViewModal] = useState({ open: false, job: null });
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
      qualifications: Array.isArray(job.qualifications) ? job.qualifications : [],
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
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
    if (!form.qualifications || form.qualifications.length === 0) {
      showAlert("error", "Validation", "Qualifications are required.");
      return;
    }
    if (!form.responsibilities || form.responsibilities.length === 0) {
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

      {/* Needs Revision Banner for Rejected Entries */}
      {stats.rejected > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                {stats.rejected} Job {stats.rejected === 1 ? "Entry Needs" : "Entries Need"} Revision & Resubmission
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                The COO has reviewed and returned job template(s) with feedback remarks. Click below to view COO comments and edit to resubmit.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFilter("rejected"); setPage(1); }}
            className="self-start sm:self-center border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-400 font-bold whitespace-nowrap"
          >
            Review Rejected Entries ({stats.rejected})
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          onClick={() => { setFilter("approved"); setPage(1); }}
          className={`cursor-pointer transition-all hover:border-emerald-400 ${filter === "approved" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20" : ""}`}
        >
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

        <Card
          onClick={() => { setFilter("pending"); setPage(1); }}
          className={`cursor-pointer transition-all hover:border-amber-400 ${filter === "pending" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20" : ""}`}
        >
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

        <Card
          onClick={() => { setFilter("rejected"); setPage(1); }}
          className={`cursor-pointer transition-all hover:border-red-400 ${filter === "rejected" ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Needs Revision</p>
              <p className="text-2xl font-extrabold text-red-600">
                {stats.rejected}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => { setFilter("all"); setPage(1); }}
          className={`cursor-pointer transition-all hover:border-blue-400 ${filter === "all" ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Templates</p>
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
        <CardHeader className="pb-6">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map((j) => (
                  <Card
                    key={j.id}
                    onClick={() => setViewModal({ open: true, job: j })}
                    className="group border-slate-200 bg-white transition-all hover:shadow-lg hover:border-blue-300 cursor-pointer"
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone="default" className="text-xs font-semibold">
                              JL-{String(j.id).padStart(3, "0")}
                            </Badge>
                            <span className="text-xs text-slate-400">{fmt(j.created_at)}</span>
                          </div>
                          <h3 className="text-lg font-extrabold text-[#111A62]">
                            {j.job_title}
                          </h3>
                        </div>
                        <Badge tone={APPROVAL_TONE[j.approval_status] ?? "default"} className="text-xs capitalize">
                          {j.approval_status}
                        </Badge>
                      </div>

                      {/* COO Rejection Feedback Box */}
                      {j.approval_status === "rejected" && (j.approval_remarks || j.remarks) && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs">
                          <p className="font-bold text-red-900 flex items-center gap-1.5 mb-1">
                            <XCircle size={14} className="text-red-600 shrink-0" />
                            COO Rejection Remarks:
                          </p>
                          <p className="text-red-800 line-clamp-2 italic leading-relaxed">
                            "{j.approval_remarks || j.remarks}"
                          </p>
                        </div>
                      )}

                      {/* Details Grid */}
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <Briefcase size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Category</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {j.job_category || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <User size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Created By</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {j.creator?.name || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <DollarSign size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Salary</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {j.salary_min || j.salary_max
                                ? `${fmtMoney(j.salary_min)} – ${fmtMoney(j.salary_max)}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <Calendar size={16} className="text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Type</p>
                            <p className="text-sm font-semibold text-slate-900 truncate capitalize">
                              {j.employment_type?.replace(/_/g, " ") || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">
                          <MousePointerClick size={14} />
                          <span>Click anywhere on card to view details</span>
                        </div>
                        <div className="flex gap-2">
                        {isCOO && j.approval_status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setApproveModal({
                                open: true,
                                job: j,
                                status: "approved",
                                remarks: "",
                              });
                            }}
                            className="flex-1 gap-1.5 border-green-200 bg-green-50/50 text-green-700 hover:bg-green-100 hover:border-green-300"
                          >
                            <Eye size={14} />
                            Review
                          </Button>
                        )}
                        {canEdit && (
                          <>
                            <Button
                              variant={j.approval_status === "rejected" ? "primary" : "outline"}
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); openEdit(j); }}
                              className={`flex-1 gap-1.5 ${
                                j.approval_status === "rejected"
                                  ? "bg-red-600 hover:bg-red-700 text-white font-bold"
                                  : "border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                              }`}
                            >
                              <Edit size={14} />
                              {j.approval_status === "rejected" ? "Revise & Resubmit" : "Edit"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, job: j }); }}
                              className="flex-1 gap-1.5 border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100 hover:border-red-300"
                            >
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          </>
                        )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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

      {/* ── View Modal ── */}
      <JobLibraryViewModal
        open={viewModal.open}
        job={viewModal.job}
        onClose={() => setViewModal({ open: false, job: null })}
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
