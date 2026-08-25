import { useEffect, useState } from "react";
import {
  BookOpen, CheckCircle, Clock, Plus, Edit, Trash2, XCircle, Filter, RefreshCw, Eye, FileText, Briefcase, User, DollarSign, Calendar, MousePointerClick, AlertTriangle, ChevronRight, ChevronDown, X, Loader
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import AlertModal from "../../components/ui/AlertModal";
import ActionLoadingModal from "../../components/ui/ActionLoadingModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  JobLibraryFormModal,
  JobLibraryApproveModal,
  JobLibraryDeleteModal,
} from "../../modals";
import JobLibraryViewPanel from "../../components/job/JobLibraryViewPanel";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";
import { useToast } from "../../context/ToastContext";

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
  revised: "warning",
  rejected: "danger",
};

const APPROVAL_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "revised", label: "Needs Revision" },
  { value: "rejected", label: "Rejected" },
];

const EMPTY_FORM = {
  job_title: "",
  job_description: "",
  qualifications: [],
  responsibilities: [],
  job_category: "",
  employment_type: "full_time",
  salary_type: "exact",
  salary_min: "",
  salary_max: "",
};

export default function JobLibrary() {
  const toast = useToast();
  const { user } = useAuth();
  const isCOO = user?.role === "coo" || user?.role === "super_admin";
  const canEdit = ["hr_admin", "super_admin", "coo"].includes(user?.role);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Selected Job Template ID for Split View Detail Panel
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Modals
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create",
    data: null,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, job: null });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [approveModal, setApproveModal] = useState({
    open: false,
    job: null,
    status: "approved",
    remarks: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alert Modal state
  const [alertModal, setAlertModalState] = useState({
    open: false,
    variant: "success",
    title: "",
    message: "",
  });

  const showAlert = (variant, title, message) => {
    setAlertModalState({ open: true, variant, title, message });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/job-library", { params: { per_page: 100 } });
      setJobs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch job library:", err);
      toast.error("Failed to load job templates.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      !q ||
      j.job_title?.toLowerCase().includes(q.toLowerCase()) ||
      j.job_category?.toLowerCase().includes(q.toLowerCase()) ||
      j.creator?.name?.toLowerCase().includes(q.toLowerCase());

    const matchesStatus =
      filter === "all" || j.approval_status === filter;

    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: jobs.length,
    approved: jobs.filter((j) => j.approval_status === "approved").length,
    pending: jobs.filter((j) => j.approval_status === "pending").length,
    rejected: jobs.filter((j) => j.approval_status === "rejected").length,
    revised: jobs.filter((j) => j.approval_status === "revised" || j.approval_status === "needs_revision").length,
  };

  // Open Create Modal
  const openCreate = () => {
    setFormModal({ open: true, mode: "create", data: { ...EMPTY_FORM } });
  };

  // Open Edit Modal
  const openEdit = (job) => {
    setFormModal({
      open: true,
      mode: "edit",
      data: {
        id: job.id,
        job_title: job.job_title || "",
        job_description: job.job_description || "",
        qualifications: job.qualifications || [],
        responsibilities: job.responsibilities || [],
        job_category: job.job_category || "",
        employment_type: job.employment_type || "full_time",
        salary_type: job.salary_type || "exact",
        salary_min: job.salary_min ?? "",
        salary_max: job.salary_max ?? "",
        approval_status: job.approval_status,
        approval_remarks: job.approval_remarks,
        remarks: job.remarks,
      },
    });
  };

  // Save Form (Create or Edit)
  const handleSaveForm = async (formData) => {
    setSaving(true);
    try {
      if (formModal.mode === "create") {
        await api.post("/job-library", formData);
        showAlert(
          "success",
          "Success",
          "Job template created and submitted to COO for approval."
        );
      } else {
        await api.put(`/job-library/${formData.id}`, formData);
        showAlert(
          "success",
          "Success",
          "Job template updated and resubmitted to COO for approval."
        );
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

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/job-library/${deleteModal.job.id}`);
      showAlert("success", "Deleted", "Job entry removed from the library.");
      setDeleteModal({ open: false, job: null });
      if (selectedJobId === deleteModal.job.id) setSelectedJobId(null);
      fetchJobs();
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err.response?.data?.message || "Failed to delete job entry."
      );
      setDeleteModal({ open: false, job: null });
    } finally {
      setDeleting(false);
    }
  };

  // COO Approve / Reject
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await jobService.library.bulkDelete(selectedIds);
      showAlert(
        "success",
        "Bulk Deletion Complete",
        res.data?.message || `Successfully deleted ${selectedIds.length} job template(s).`
      );
      setSelectedIds([]);
      fetchJobs();
      window.dispatchEvent(new CustomEvent("artms-refresh-sidebar"));
    } catch (err) {
      showAlert(
        "error",
        "Bulk Deletion Failed",
        err.response?.data?.message || "Failed to delete selected job templates."
      );
    } finally {
      setBulkDeleting(false);
      setBulkDeleteConfirm(false);
    }
  };

  const handleToggleSelectAll = (items) => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((j) => j.id));
    }
  };

  const handleToggleSelectOne = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Title & Stats Container ─────────────────────── */}
      <div className="space-y-6">
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
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && canEdit && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkDeleting}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold animate-fade-in cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Selected ({selectedIds.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={fetchJobs}
              disabled={loading}
              className="gap-2 bg-white cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {canEdit && (
              <Button variant="primary" onClick={openCreate} className="gap-2 bg-[#111A62] cursor-pointer">
                <Plus size={14} />
                Add Job Entry
              </Button>
            )}
          </div>
        </div>

        {/* Needs Revision Banner for Revised Entries */}
        {stats.revised > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {stats.revised} Job {stats.revised === 1 ? "Entry Needs" : "Entries Need"} Revision & Resubmission
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  The COO has reviewed and returned job template(s) with feedback remarks. Click below to view COO comments and edit to resubmit.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setFilter("revised"); setPage(1); }}
              className="self-start sm:self-center border-amber-300 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-400 font-bold whitespace-nowrap"
            >
              Review Revised Entries ({stats.revised})
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
            onClick={() => { setFilter("revised"); setPage(1); }}
            className={`cursor-pointer transition-all hover:border-amber-400 ${filter === "revised" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30" : ""}`}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Needs Revision</p>
                <p className="text-2xl font-extrabold text-amber-600">
                  {stats.revised}
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
      </div>

      {/* ── Split-Screen Master-Detail Layout ──────────────────────── */}
      <div className={`grid gap-5 transition-all duration-300 lg:grid-cols-12 ${selectedJobId ? "h-[calc(100vh-8.5rem)] min-h-[550px]" : ""}`}>

        {/* ── LEFT SIDE: DIRECTORY (Full Cards Grid or Compact Sidebar List) ────── */}
        <div className={`transition-all duration-300 ${selectedJobId ? "lg:col-span-4 h-full min-h-0" : "lg:col-span-12"}`}>

          {selectedJobId ? (
            /* ── COMPACT SIDEBAR LIST (When Template Panel is open) ─── */
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 animate-fade-in flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Job Templates</h3>
                  <p className="text-[11px] text-slate-400">Click template to view specifications</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedJobId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    title="Expand Grid View"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="space-y-2 shrink-0">
                <SearchBar
                  value={q}
                  onChange={(val) => { setQ(val); setPage(1); }}
                  placeholder="Search template title..."
                  className="text-xs"
                />

                <Select
                  icon={Filter}
                  size="sm"
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                  buttonClassName="bg-slate-50 hover:bg-white"
                >
                  {APPROVAL_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-10 text-center text-xs text-slate-400">Loading templates...</div>
                ) : filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No templates match filter.</div>
                ) : (
                  filtered.map((j) => {
                    const isSelected = j.id === selectedJobId;
                    const jlId = `JL-${String(j.id).padStart(3, "0")}`;

                    const isChecked = selectedIds.includes(j.id);
                    return (
                      <div
                        key={j.id}
                        onClick={() => setSelectedJobId(j.id)}
                        className={`p-3 rounded-2xl transition cursor-pointer border ${isSelected
                          ? "border-[#111A62] bg-[#111A62]/10 ring-2 ring-[#111A62]/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleSelectOne(j.id, e)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer shrink-0"
                              />
                            )}
                            <span className="text-[10px] font-mono font-extrabold text-[#111A62] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {jlId}
                            </span>
                          </div>
                          <Badge tone={APPROVAL_TONE[j.approval_status] || "default"} className="text-[9px] px-1.5 py-0.2 capitalize">
                            {j.approval_status}
                          </Badge>
                        </div>

                        <p className={`text-xs font-extrabold mt-1.5 truncate ${isSelected ? "text-[#111A62]" : "text-slate-900"}`}>
                          {j.job_title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span>{j.job_category || "General"}</span>
                          <span className="text-slate-400">{j.creator?.name || "HR Admin"}</span>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── FULL CARDS GRID DIRECTORY (When no template is open) ─ */
            <div className="space-y-4">
              {/* Filters & Search Bar */}
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="w-full sm:flex-1 min-w-[220px]">
                      <SearchBar
                        value={q}
                        onChange={(val) => {
                          setQ(val);
                          setPage(1);
                        }}
                        placeholder="Search job templates by title or description..."
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="w-full sm:w-64 shrink-0">
                      <Select
                        icon={Filter}
                        size="lg"
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setPage(1);
                        }}
                        buttonClassName="bg-slate-50 hover:bg-white"
                      >
                        {APPROVAL_FILTERS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards Grid */}
              <Card className="animate-fade-in transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-[#111A62]" size={18} /> Job Templates ({filtered.length})
                      </CardTitle>
                      {canEdit && paginated.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer select-none bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === paginated.length && paginated.length > 0}
                            onChange={() => handleToggleSelectAll(paginated)}
                            className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Select All Page</span>
                        </label>
                      )}
                      {selectedIds.length > 0 && canEdit && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setBulkDeleteConfirm(true)}
                          disabled={bulkDeleting}
                          className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold animate-fade-in cursor-pointer h-8 text-xs"
                        >
                          <Trash2 size={13} />
                          <span>Delete Selected ({selectedIds.length})</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="py-20 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader size={18} className="animate-spin text-[#111A62]" />
                        <span>Loading job templates...</span>
                      </div>
                    </div>
                  ) : paginated.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No job templates found</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginated.map((j) => {
                          const isChecked = selectedIds.includes(j.id);
                          return (
                            <Card
                              key={j.id}
                              onClick={() => setSelectedJobId(j.id)}
                              className={`group border-slate-200 bg-white transition-all hover:shadow-lg hover:border-blue-300 cursor-pointer flex flex-col h-full ${isChecked ? "ring-2 ring-[#111A62] bg-blue-50/20" : ""}`}
                            >
                              <CardContent className="p-5 flex flex-col flex-1 justify-between">
                                {/* Top Content */}
                                <div>
                                  {/* Header */}
                                  <div className="mb-3 flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        {canEdit && (
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => handleToggleSelectOne(j.id, e)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="rounded border-slate-300 text-[#111A62] focus:ring-[#111A62] h-4 w-4 cursor-pointer shrink-0"
                                          />
                                        )}
                                        <Badge tone="default" className="text-xs font-semibold">
                                          JL-{String(j.id).padStart(3, "0")}
                                        </Badge>
                                        <span className="text-xs text-slate-400">{fmt(j.created_at)}</span>
                                      </div>
                                      <h3
                                        className="text-base font-extrabold text-[#111A62] line-clamp-2 min-h-[2.75rem] flex items-center leading-snug"
                                        title={j.job_title}
                                      >
                                        {j.job_title}
                                      </h3>
                                    </div>
                                    <Badge tone={APPROVAL_TONE[j.approval_status] ?? "default"} className="text-xs capitalize shrink-0">
                                      {j.approval_status}
                                    </Badge>
                                  </div>

                                  {/* Details Grid */}
                                  <div className="mb-4 grid grid-cols-2 gap-2.5">
                                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                      <Briefcase size={16} className="text-slate-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Category</p>
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                          {j.job_category || "—"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                      <User size={16} className="text-slate-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Created By</p>
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                          {j.creator?.name || "—"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions Bar (Anchored at Bottom) */}
                                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-[#111A62] group-hover:underline flex items-center gap-1">
                                    View Specification <ChevronRight size={14} />
                                  </span>
                                  {canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteModal({ open: true, job: j });
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                      title="Delete Template"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {filtered.length > 10 && (
                        <div className="mt-6 border-t border-slate-100 pt-4">
                          <Pagination
                            page={page}
                            pageSize={pageSize}
                            total={filtered.length}
                            onPageChange={setPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDE: JOB TEMPLATE SPECIFICATION PANEL (Smooth Slide In) ── */}
        {selectedJobId && (
          <div className="lg:col-span-8 animate-slide-up transition-all duration-300 h-full min-h-0">
            <JobLibraryViewPanel
              jobId={selectedJobId}
              initialJob={jobs.find(j => j.id === selectedJobId)}
              onClose={() => setSelectedJobId(null)}
              onUpdated={fetchJobs}
              onEdit={(job) => openEdit(job)}
            />
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <JobLibraryFormModal
        open={formModal.open}
        mode={formModal.mode}
        initialData={formModal.data}
        onClose={() => setFormModal({ open: false, mode: "create", data: null })}
        onSave={handleSaveForm}
        saving={saving}
      />

      {/* COO Approve/Reject Modal */}
      <JobLibraryApproveModal
        open={approveModal.open}
        job={approveModal.job}
        status={approveModal.status}
        remarks={approveModal.remarks}
        onClose={() =>
          setApproveModal({ open: false, job: null, status: "approved", remarks: "" })
        }
        onRemarksChange={(val) => setApproveModal((prev) => ({ ...prev, remarks: val }))}
        onConfirm={handleApprove}
        saving={saving}
      />

      {/* Delete Modal */}
      <JobLibraryDeleteModal
        open={deleteModal.open}
        job={deleteModal.job}
        onClose={() => setDeleteModal({ open: false, job: null })}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* Bulk Delete Modal */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Selected Job Templates"
        description={`Are you sure you want to delete all ${selectedIds.length} selected job template(s)? Note: Templates tied to existing job postings will be skipped.`}
        confirmText={bulkDeleting ? "Deleting..." : "Delete Selected"}
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModalState({ ...alertModal, open: false })}
      />

      {/* Full-screen blocking loading overlay for Delete */}
      <ActionLoadingModal
        open={deleting}
        type="delete"
        title="Deleting Job Entry..."
        message="Please wait while this position is removed from the library..."
      />

      {/* Full-screen blocking loading overlay for COO Approval */}
      <ActionLoadingModal
        open={saving && approveModal.open}
        type="process"
        title={approveModal.status === "approved" ? "Approving Job Entry..." : "Rejecting Job Entry..."}
        message="Updating approval status and publishing to library. Please wait..."
      />
    </div>
  );
}
