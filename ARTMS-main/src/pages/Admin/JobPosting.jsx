import { useEffect, useState } from "react";
import {
  Briefcase, Eye, EyeOff, CheckCircle, Clock, XCircle,
  Plus, X, AlertCircle, AlertTriangle, FileText, Edit, Trash2, Filter, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { FiAward, FiBriefcase } from "react-icons/fi";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import AlertModal from "../../components/ui/AlertModal";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../services/api";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";
import { useToast } from "../../context/ToastContext";

const STATUS_TONE = {
  published: "success",
  pending_approval: "warning",
  draft: "info",
  closed: "default",
  cancelled: "danger",
};
const APPROVAL_TONE = { approved: "success", pending: "warning", revised: "warning", rejected: "danger" };

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "pending_approval", label: "Pending" },
  { value: "revised", label: "Needs Revision" },
  { value: "closed", label: "Closed" },
];

const taClass =
  "w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed outline-none transition resize-none focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";
const selectClass =
  "w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";

// Helpers for comparing nested arrays
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function JobPosting() {
  const toast = useToast();
  const [approvedPRFs, setApprovedPRFs] = useState([]);
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePRFModalOpen, setDeletePRFModalOpen] = useState(false);
  const [selectedPRF, setSelectedPRF] = useState(null);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [prfToDelete, setPrfToDelete] = useState(null);
  const [formData, setFormData] = useState({
    location: "",
    qualifications: [],
    responsibilities: [],
    closing_date: "",
  });
  const [alertModal, setAlertModalState] = useState({
    open: false,
    variant: "success",
    title: "",
    message: "",
  });

  const setAlertModal = (modalConfig) => {
    setAlertModalState(modalConfig);
    if (modalConfig?.title) {
      const v = modalConfig.variant === "danger" ? "error" : modalConfig.variant || "info";
      toast[v] ? toast[v](modalConfig.title, modalConfig.message) : toast.showToast({ title: modalConfig.title, message: modalConfig.message, type: v });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prfRes, postingsRes] = await Promise.all([
        api.get("/manpower-requests-approved-for-posting"),
        api.get("/job-postings"),
      ]);
      setApprovedPRFs(prfRes.data.data || []);
      setPostings(postingsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: "Failed to load job posting data.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Array operations for nested items ──
  const handleAddBlock = (field) => {
    const newBlock = { id: Date.now(), title: "", details: [] };
    setFormData({ ...formData, [field]: [...(formData[field] || []), newBlock] });
  };
  const handleRemoveBlock = (field, idx) => {
    const arr = [...(formData[field] || [])];
    arr.splice(idx, 1);
    setFormData({ ...formData, [field]: arr });
  };
  const handleUpdateBlockTitle = (field, idx, val) => {
    const arr = [...(formData[field] || [])];
    arr[idx].title = val;
    setFormData({ ...formData, [field]: arr });
  };
  const handleAddDetail = (field, blockIdx) => {
    const arr = [...(formData[field] || [])];
    if (!arr[blockIdx].details) arr[blockIdx].details = [];
    arr[blockIdx].details.push({ id: Date.now() + Math.random(), value: "" });
    setFormData({ ...formData, [field]: arr });
  };
  const handleRemoveDetail = (field, blockIdx, detailIdx) => {
    const arr = [...(formData[field] || [])];
    arr[blockIdx].details.splice(detailIdx, 1);
    setFormData({ ...formData, [field]: arr });
  };
  const handleUpdateDetailValue = (field, blockIdx, detailIdx, val) => {
    const arr = [...(formData[field] || [])];
    arr[blockIdx].details[detailIdx].value = val;
    setFormData({ ...formData, [field]: arr });
  };

  const openCreateModal = (prf) => {
    setSelectedPRF(prf);
    setFormData({
      location: "",
      qualifications: prf.qualifications || [],
      responsibilities: prf.responsibilities || [],
      closing_date: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreatePosting = async () => {
    if (!selectedPRF) return;

    if (!selectedPRF.job_library_id) {
      setAlertModal({
        open: true,
        variant: "error",
        title: "No Job Library Entry Linked",
        message:
          "This PRF was submitted without selecting a position from the Job Library. " +
          "Please ask the Department Head to resubmit the PRF using the updated form.",
      });
      return;
    }

    const isModified =
      !deepEqual(formData.qualifications, selectedPRF.qualifications || []) ||
      !deepEqual(formData.responsibilities, selectedPRF.responsibilities || []);

    try {
      await api.post("/job-postings", {
        job_library_id: selectedPRF.job_library_id,
        department_id: selectedPRF.department_id,
        manpower_request_id: selectedPRF.id,
        vacancies_count: selectedPRF.headcount,
        location: formData.location,
        closing_date: formData.closing_date || null,
        qualifications: formData.qualifications,
        responsibilities: formData.responsibilities,
        is_modified_from_prf: isModified,
      });

      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: isModified
          ? "Job posting submitted for COO approval (requirements were modified)."
          : "Job posting was instantly published (no modifications made).",
      });
      setCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating posting:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to create job posting.",
      });
    }
  };

  const handleEditPosting = async () => {
    if (!selectedPosting) return;

    const isModified =
      !deepEqual(formData.qualifications, selectedPosting.qualifications || selectedPosting.job_library?.qualifications || []) ||
      !deepEqual(formData.responsibilities, selectedPosting.responsibilities || selectedPosting.job_library?.responsibilities || []);

    try {
      const response = await api.put(`/job-postings/${selectedPosting.id}`, {
        location: formData.location,
        closing_date: formData.closing_date || null,
        qualifications: formData.qualifications,
        responsibilities: formData.responsibilities,
        is_modified_from_prf: isModified,
      });

      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: response.data.message || "Job posting updated successfully.",
      });
      setEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating posting:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to update job posting.",
      });
    }
  };

  const handleDeletePosting = async () => {
    if (!selectedPosting) return;

    try {
      await api.delete(`/job-postings/${selectedPosting.id}`);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Deleted",
        message: "Job posting removed successfully.",
      });
      setDeleteModalOpen(false);
      setSelectedPosting(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting posting:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to delete job posting.",
      });
    }
  };

  const openEditModal = (posting) => {
    setSelectedPosting(posting);

    setFormData({
      location: posting.location || "",
      qualifications: posting.qualifications || [],
      responsibilities: posting.responsibilities || [],
      closing_date: posting.closing_date
        ? new Date(posting.closing_date).toISOString().split("T")[0]
        : "",
    });
    setEditModalOpen(true);
  };

  const handleDeletePRF = async () => {
    if (!prfToDelete) return;

    try {
      await api.delete(`/manpower-requests/${prfToDelete.id}`);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Deleted",
        message: "PRF removed successfully.",
      });
      setDeletePRFModalOpen(false);
      setPrfToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting PRF:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete PRF.";
      setAlertModal({
        open: true,
        variant: "error",
        title: "Cannot Delete PRF",
        message: errorMessage,
      });
      setDeletePRFModalOpen(false);
      setPrfToDelete(null);
    }
  };

  // Filter logic
  const filtered = postings.filter((p) => {
    // Search filter
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesSearch =
        p.job_library?.job_title?.toLowerCase().includes(s) ||
        p.department?.name?.toLowerCase().includes(s) ||
        p.status?.toLowerCase().includes(s) ||
        p.approval_status?.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "revised") {
        if (p.approval_status !== "revised" && p.approval_status !== "needs_revision") return false;
      } else if (p.status !== statusFilter) {
        return false;
      }
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
    published: postings.filter((p) => p.status === "published").length,
    pending: postings.filter((p) => p.status === "pending_approval" && p.approval_status !== "revised").length,
    revised: postings.filter((p) => p.approval_status === "revised" || p.approval_status === "needs_revision").length,
    closed: postings.filter((p) => p.status === "closed").length,
    totalApps: postings.reduce((s, p) => s + (p.applicants_count || 0), 0),
  };

  const isCreateModified = selectedPRF ? (
    !deepEqual(formData.qualifications, selectedPRF.qualifications || []) ||
    !deepEqual(formData.responsibilities, selectedPRF.responsibilities || [])
  ) : false;

  const renderArrayEditor = (field, label, icon) => (
    <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 p-5 mt-4">
      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span className="text-[#F97316]">{icon}</span>
          {label}
        </label>
        <button
          type="button"
          onClick={() => handleAddBlock(field)}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300 cursor-pointer"
        >
          <Plus size={14} /> Add Block
        </button>
      </div>

      <div className="space-y-4">
        {(formData[field] || []).map((block, idx) => (
          <div key={block.id || idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200">
            <div className="mb-3 flex items-center justify-between gap-3">
              <input
                type="text"
                value={block.title}
                onChange={(e) => handleUpdateBlockTitle(field, idx, e.target.value)}
                placeholder="Title..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleRemoveBlock(field, idx)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {(block.details || []).map((detail, dIdx) => (
                <div key={detail.id || dIdx} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"></span>
                  <textarea
                    rows={1}
                    value={detail.value}
                    onChange={(e) => handleUpdateDetailValue(field, idx, dIdx, e.target.value)}
                    placeholder="Add a detail..."
                    className="w-full resize-none rounded-lg border border-transparent bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDetail(field, idx, dIdx)}
                    className="mt-1 shrink-0 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddDetail(field, idx)}
                className="ml-4 mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus size={14} /> Add Detail
              </button>
            </div>
          </div>
        ))}
        {(!formData[field] || formData[field].length === 0) && (
          <p className="text-center text-sm text-slate-500 italic">No {label.toLowerCase()} added yet.</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
            Posting
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
            Job Posting Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor all active and pending job postings.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Needs Revision Alert Banner */}
      {stats.revised > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {stats.revised} Job Posting(s) Marked for Revision by COO
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The COO requested edits before live publication. Click "Review Revised Postings" to inspect feedback, make adjustments, and resubmit.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("revised")}
            className="self-start sm:self-center border-amber-400 bg-white text-amber-900 hover:bg-amber-100 font-bold whitespace-nowrap"
          >
            Review Revised Postings ({stats.revised})
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card
          onClick={() => setStatusFilter("published")}
          className={`cursor-pointer transition-all hover:border-emerald-400 ${statusFilter === "published" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <Eye size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Published</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.published}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter("pending_approval")}
          className={`cursor-pointer transition-all hover:border-amber-400 ${statusFilter === "pending_approval" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter("revised")}
          className={`cursor-pointer transition-all hover:border-amber-400 ${statusFilter === "revised" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <RefreshCw size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Needs Revision</p>
              <p className="text-2xl font-extrabold text-amber-600">{stats.revised}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter("closed")}
          className={`cursor-pointer transition-all hover:border-slate-400 ${statusFilter === "closed" ? "border-slate-500 ring-2 ring-slate-500/20 bg-slate-50/20" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <EyeOff size={24} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Closed</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.closed}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer transition-all hover:border-blue-400 ${statusFilter === "all" ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20" : ""}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Briefcase size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Apps</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.totalApps}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approved PRFs — Ready for Job Posting */}
      {approvedPRFs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approved PRFs — Ready for Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>Position</TH>
                  <TH>Job Library</TH>
                  <TH>Department</TH>
                  <TH>Headcount</TH>
                  <TH>Urgency</TH>
                  <TH>Approved By</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </THead>
              <tbody>
                {approvedPRFs.map((prf) => (
                  <tr key={prf.id} className="hover:bg-slate-50">
                    <TD>
                      <div>
                        <p className="font-semibold text-slate-900">{prf.position_needed}</p>
                        <p className="text-xs text-slate-400">
                          PRF-{String(prf.id).padStart(3, "0")}
                        </p>
                      </div>
                    </TD>
                    <TD>
                      {prf.job_library_id ? (
                        <div className="flex items-center gap-1.5">
                          <FileText size={12} className="text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">
                            {prf.jobLibrary?.job_title || `JL-${String(prf.job_library_id).padStart(3, "0")}`}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle size={11} /> Not linked
                        </span>
                      )}
                    </TD>
                    <TD className="text-slate-600">{prf.department?.name}</TD>
                    <TD className="font-bold text-slate-900">{prf.headcount}</TD>
                    <TD>
                      <Badge
                        tone={
                          prf.urgency === "critical"
                            ? "danger"
                            : prf.urgency === "high"
                              ? "warning"
                              : "info"
                        }
                      >
                        {prf.urgency}
                      </Badge>
                    </TD>
                    <TD className="text-sm text-slate-600">{prf.approver?.name || "N/A"}</TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-1.5">
                        {/* Create Posting Button */}
                        <button
                          onClick={() => openCreateModal(prf)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          title="Create Job Posting"
                        >
                          <Plus size={14} />
                          Create Posting
                        </button>

                        {/* Delete PRF Button */}
                        <button
                          onClick={() => {
                            setPrfToDelete(prf);
                            setDeletePRFModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="Delete PRF"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={16} />
              Filters:
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setStatusFilter(f.value);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === f.value
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
                placeholder="Search job postings..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Job Postings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Job Postings ({filtered.length} {filtered.length === 1 ? "posting" : "postings"})
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
              <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No job postings found</p>
              <p className="mt-1 text-xs text-slate-400">
                {q || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create a posting from an approved PRF above"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Job Title</TH>
                    <TH>Department</TH>
                    <TH>Vacancies</TH>
                    <TH>Applicants</TH>
                    <TH>COO Approval</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </THead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <Briefcase size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {p.job_library?.job_title || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">
                              JP-{String(p.id).padStart(3, "0")}
                            </p>
                            {(() => {
                              const jl = p.job_library || {};
                              const bd = calculateSalaryBreakdown(jl.salary_min, jl.salary_max, jl.salary_type);
                              if (!bd) return null;
                              return (
                                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                  {bd.formatted.monthly} <span className="text-[10px] font-normal text-slate-500">({bd.formatted.daily}/day, {bd.formatted.hourly}/hr)</span>
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </TD>
                      <TD className="text-slate-600">{p.department?.name}</TD>
                      <TD className="font-bold text-slate-900">{p.vacancies_count}</TD>
                      <TD>
                        <span className="font-bold text-slate-900">{p.applicants_count || 0}</span>
                        <span className="text-xs text-slate-400"> apps</span>
                      </TD>
                      <TD>
                        <Badge tone={APPROVAL_TONE[p.approval_status] ?? "default"}>
                          {p.approval_status}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[p.status] ?? "default"}>{p.status?.replace(/_/g, " ")}</Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                            title="Edit Posting"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setSelectedPosting(p);
                              setDeleteModalOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-transparent text-slate-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="Delete Posting"
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

      {/* ── Create Job Posting Modal ── */}
      <Modal
        open={createModalOpen}
        title="Create Job Posting"
        description={
          selectedPRF
            ? `Converting PRF-${String(selectedPRF.id).padStart(3, "0")} to a published job posting`
            : ""
        }
        onClose={() => setCreateModalOpen(false)}
        className="max-w-2xl"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleCreatePosting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#111A62] bg-[#111A62] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0d1449] hover:border-[#0d1449] cursor-pointer"
            >
              <CheckCircle size={16} />
              {isCreateModified ? "Submit for COO Approval" : "Ready for Posting"}
            </button>
          </div>
        }
      >
        {selectedPRF && (
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">

            {/* PRF + Job Library banner */}
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-0.5">
                  PRF-{String(selectedPRF.id).padStart(3, "0")}
                </p>
                <p className="font-semibold text-slate-900 truncate">
                  {selectedPRF.position_needed}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedPRF.department?.name}
                  <span className="mx-1.5 text-slate-300">•</span>
                  {selectedPRF.headcount}{" "}
                  {selectedPRF.headcount > 1 ? "positions" : "position"}
                </p>

                {/* Job Library linkage — read-only */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {selectedPRF.job_library_id ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <FileText size={11} />
                        Job Library:{" "}
                        {selectedPRF.jobLibrary?.job_title ||
                          `JL-${String(selectedPRF.job_library_id).padStart(3, "0")}`}
                      </div>
                      {(() => {
                        const jl = selectedPRF.jobLibrary || {};
                        const bd = calculateSalaryBreakdown(jl.salary_min, jl.salary_max, jl.salary_type);
                        if (!bd) return null;
                        return (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            ₱ Salary: {bd.formatted.monthly} ({bd.formatted.daily}/day, {bd.formatted.hourly}/hr)
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <AlertCircle size={11} />
                      No Job Library entry linked — resubmission required
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Warning for legacy PRFs without job_library_id */}
            {!selectedPRF.job_library_id && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 shrink-0 text-amber-500" size={16} />
                <div>
                  <p className="font-semibold">This PRF cannot be posted yet</p>
                  <p className="mt-1 text-xs text-amber-700">
                    It was submitted before the Job Library integration was in place. The Department
                    Head must resubmit the PRF by selecting a position from the Job Library dropdown.
                    This ensures the posting is properly linked to an approved job template.
                  </p>
                </div>
              </div>
            )}

            {/* Only show the form fields when a job library entry is linked */}
            {selectedPRF.job_library_id && (
              <>
                {/* Section: Posting Info */}
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Posting Info
                  </p>
                  <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Location"
                        placeholder="e.g., Makati City, Remote"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                      <Input
                        label="Application Deadline"
                        type="date"
                        value={formData.closing_date}
                        onChange={(e) =>
                          setFormData({ ...formData, closing_date: e.target.value })
                        }
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Requirements & Qualifications */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mt-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Requirements &amp; Responsibilities
                    </p>
                  </div>
                  {renderArrayEditor("qualifications", "Qualifications", <FiAward />)}
                  {renderArrayEditor("responsibilities", "Responsibilities", <FiBriefcase />)}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ── Edit Job Posting Modal ── */}
      <Modal
        open={editModalOpen}
        title="Edit Job Posting"
        description={
          selectedPosting
            ? `Editing JP-${String(selectedPosting.id).padStart(3, "0")}`
            : ""
        }
        onClose={() => setEditModalOpen(false)}
        className="max-w-2xl"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleEditPosting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#111A62] bg-[#111A62] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0d1449] hover:border-[#0d1449]"
            >
              <CheckCircle size={16} />
              Save Changes
            </button>
          </div>
        }
      >
        {selectedPosting && (
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">

            {/* Posting Info banner */}
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-0.5">
                  JP-{String(selectedPosting.id).padStart(3, "0")}
                </p>
                <p className="font-semibold text-slate-900 truncate">
                  {selectedPosting.job_library?.job_title || "N/A"}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedPosting.department?.name}
                  <span className="mx-1.5 text-slate-300">•</span>
                  {selectedPosting.vacancies_count}{" "}
                  {selectedPosting.vacancies_count > 1 ? "positions" : "position"}
                </p>
              </div>
            </div>

            {/* Section: Posting Info */}
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Posting Info
              </p>
              <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    placeholder="e.g., Makati City, Remote"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                  <Input
                    label="Application Deadline"
                    type="date"
                    value={formData.closing_date}
                    onChange={(e) =>
                      setFormData({ ...formData, closing_date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>

            {/* Section: Requirements & Qualifications */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mt-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Requirements &amp; Responsibilities
                </p>
              </div>
              {renderArrayEditor("qualifications", "Qualifications", <FiAward />)}
              {renderArrayEditor("responsibilities", "Responsibilities", <FiBriefcase />)}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Job Posting?"
        description={`Are you sure you want to delete "${selectedPosting?.job_library?.job_title || 'this posting'}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDeletePosting}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPosting(null);
        }}
      />

      {/* Delete PRF Confirm Dialog */}
      <ConfirmDialog
        open={deletePRFModalOpen}
        title="Delete PRF Request?"
        description={`Are you sure you want to delete PRF-${String(prfToDelete?.id || 0).padStart(3, "0")} for "${prfToDelete?.position_needed || 'this position'}"? This will permanently remove the approved PRF from the system.`}
        confirmLabel="Yes, Delete PRF"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDeletePRF}
        onClose={() => {
          setDeletePRFModalOpen(false);
          setPrfToDelete(null);
        }}
      />

      {/* Alert Modal */}
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
