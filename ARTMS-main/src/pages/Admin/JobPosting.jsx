import { useEffect, useState } from "react";
import {
  Briefcase, Eye, EyeOff, CheckCircle, Clock, XCircle,
  Plus, X, AlertCircle, AlertTriangle, FileText, Edit, Trash2, Filter, RefreshCw, ChevronRight, ChevronDown,
  GraduationCap, List, FileCheck, Building2, MapPin, DollarSign, Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import DatePicker from "../../components/ui/DatePicker";
import Modal from "../../components/ui/Modal";
import AlertModal from "../../components/ui/AlertModal";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import JobPostingEditPanel from "../../components/job/JobPostingEditPanel";
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
  const pageSize = 5;

  // Selected Posting ID for Split View Detail & Edit Panel
  const [selectedPostingId, setSelectedPostingId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
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

  // Block modal state for Create Posting
  const [createBlockModal, setCreateBlockModal] = useState({ open: false, field: "qualifications", editingId: null });
  const [createBlockTitle, setCreateBlockTitle] = useState("");
  const [createBlockDetails, setCreateBlockDetails] = useState([{ id: Date.now(), value: "" }]);
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
    const handleScroll = () => {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 150;
      if (isScrollable && window.scrollY > 100) {
        setIsScrolled(true);
      } else if (window.scrollY < 20) {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (prf) => {
    setSelectedPRF(prf);
    setFormData({
      location: prf.jobLibrary?.location || "",
      qualifications: prf.qualifications || prf.jobLibrary?.qualifications || [],
      responsibilities: prf.responsibilities || prf.jobLibrary?.responsibilities || [],
      closing_date: "",
    });
    setCreateModalOpen(true);
  };

  // Block handlers for Create modal
  const openCreateAddBlock = (field) => {
    setCreateBlockModal({ open: true, field, editingId: null });
    setCreateBlockTitle("");
    setCreateBlockDetails([{ id: Date.now(), value: "" }]);
  };
  const openCreateEditBlock = (field, block) => {
    setCreateBlockModal({ open: true, field, editingId: block.id });
    setCreateBlockTitle(block.title || "");
    setCreateBlockDetails(
      block.details && block.details.length > 0
        ? block.details.map((d) => ({ id: d.id || Date.now() + Math.random(), value: d.value || "" }))
        : [{ id: Date.now(), value: "" }]
    );
  };
  const handleSaveCreateBlock = () => {
    const cleanDetails = createBlockDetails.filter((d) => d.value.trim());
    const newBlock = { id: createBlockModal.editingId || Date.now(), title: createBlockTitle.trim(), details: cleanDetails };
    setFormData((prev) => {
      const field = createBlockModal.field;
      const existing = prev[field] || [];
      if (createBlockModal.editingId) {
        return { ...prev, [field]: existing.map((b) => (b.id === createBlockModal.editingId ? newBlock : b)) };
      }
      return { ...prev, [field]: [...existing, newBlock] };
    });
    setCreateBlockModal({ open: false, field: "qualifications", editingId: null });
  };
  const removeCreateBlock = (field, blockId) => {
    setFormData((prev) => ({ ...prev, [field]: (prev[field] || []).filter((b) => b.id !== blockId) }));
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

  const handleDeletePosting = async () => {
    if (!selectedPosting) return;
    try {
      await api.delete(`/job-postings/${selectedPosting.id}`);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "Job posting deleted successfully.",
      });
      setDeleteModalOpen(false);
      if (selectedPostingId === selectedPosting.id) setSelectedPostingId(null);
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

  const handleDeletePRF = async () => {
    if (!prfToDelete) return;
    try {
      await api.delete(`/manpower-requests/${prfToDelete.id}`);
      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "PRF deleted successfully.",
      });
      setDeletePRFModalOpen(false);
      setPrfToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting PRF:", error);
      setAlertModal({
        open: true,
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to delete PRF.",
      });
    }
  };

  const uniquePostings = postings.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id));

  const filtered = uniquePostings.filter((p) => {
    const matchesSearch =
      !q ||
      p.job_library?.job_title?.toLowerCase().includes(q.toLowerCase()) ||
      (p.department?.department_name || p.department?.name || "").toLowerCase().includes(q.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "revised" ? p.approval_status === "revised" : p.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    published: postings.filter((p) => p.status === "published").length,
    pending: postings.filter((p) => p.status === "pending_approval" || p.approval_status === "pending").length,
    revised: postings.filter((p) => p.approval_status === "revised").length,
    closed: postings.filter((p) => p.status === "closed").length,
    totalApps: postings.reduce((sum, p) => sum + (p.applicants_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* ── Collapsible Title & Stats Container ─────────────────────── */}
      <div className={`transition-all duration-500 ease-in-out ${isScrolled ? "max-h-0 opacity-0 overflow-hidden pointer-events-none -translate-y-4 space-y-0" : "max-h-[800px] opacity-100 translate-y-0 space-y-6"}`}>
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Recruitment
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl">
              Job Postings Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create job ads from approved PRFs, manage listings, and view candidate applications
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2 bg-white">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            onClick={() => setStatusFilter("published")}
            className={`cursor-pointer transition-all hover:border-emerald-400 ${statusFilter === "published" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20" : ""}`}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle size={24} className="text-emerald-600" />
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
      </div>

      {/* Approved PRFs — Ready for Job Posting */}
      {approvedPRFs.length > 0 && !selectedPostingId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#111A62]">Approved PRFs — Ready for Job Posting ({approvedPRFs.length})</CardTitle>
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
                    <TD className="text-slate-600">{prf.department?.department_name || prf.department?.name}</TD>
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
                        <button
                          onClick={() => openCreateModal(prf)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                          title="Create Job Posting"
                        >
                          <Plus size={14} />
                          Create Posting
                        </button>
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

      {/* ── Split-Screen Master-Detail Layout ──────────────────────── */}
      <div className={`grid gap-5 transition-all duration-300 lg:grid-cols-12 ${selectedPostingId ? "h-[calc(100vh-8.5rem)] min-h-[550px]" : ""}`}>

        {/* ── LEFT SIDE: DIRECTORY (Full Table or Sidebar List) ────── */}
        <div className={`transition-all duration-300 ${selectedPostingId ? "lg:col-span-4 h-full min-h-0" : "lg:col-span-12"}`}>

          {selectedPostingId ? (
            /* ── COMPACT SIDEBAR LIST (When Job Panel is open) ──────── */
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 animate-fade-in flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Active Job Postings</h3>
                  <p className="text-[11px] text-slate-400">Click job to view specification & edit</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isScrolled && (
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="rounded-lg border border-[#111A62]/20 bg-[#111A62]/5 px-2 py-1 text-[10px] font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-0.5 cursor-pointer"
                      title="Scroll to top"
                    >
                      ↑ Stats
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPostingId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    title="Expand to Full Table"
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
                  placeholder="Search job title..."
                  className="text-xs"
                />

                <Select
                  icon={Filter}
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  buttonClassName="bg-slate-50 hover:bg-white"
                >
                  {STATUS_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-10 text-center text-xs text-slate-400">Loading postings...</div>
                ) : filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No jobs match filter.</div>
                ) : (
                  filtered.map((p) => {
                    const isSelected = p.id === selectedPostingId;
                    const title = p.job_library?.job_title || p.title || "Job Specification";
                    const dept = p.department?.department_name || p.department?.name || "General";

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPostingId(p.id)}
                        className={`p-3 rounded-2xl transition cursor-pointer border ${
                          isSelected
                            ? "border-[#111A62] bg-[#111A62]/10 ring-2 ring-[#111A62]/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-extrabold text-[#111A62] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            JP-{String(p.id).padStart(3, "0")}
                          </span>
                          <Badge tone={STATUS_TONE[p.status] || "default"} className="text-[9px] px-1.5 py-0.2 capitalize">
                            {p.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <p className={`text-xs font-extrabold mt-1.5 truncate ${isSelected ? "text-[#111A62]" : "text-slate-900"}`}>
                          {title}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-semibold">{dept}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700 border border-amber-200 text-[9px]">
                              {p.vacancies_count ?? 1} {p.vacancies_count === 1 ? "position needed" : "positions needed"}
                            </span>
                            <span className="text-emerald-700 font-bold">{p.applicants_count || 0} apps</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── FULL TABLE DIRECTORY (When no job is open) ─────────── */
            <Card className={`animate-fade-in transition-all duration-300 ${isScrolled && !selectedPostingId ? "sticky top-4 z-20 shadow-2xl ring-1 ring-slate-900/10 border-slate-300 bg-white" : ""}`}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Briefcase className="text-[#111A62]" size={18} /> Job Postings ({filtered.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="w-full sm:w-64 flex-1 sm:flex-initial min-w-[200px]">
                      <SearchBar
                        value={q}
                        onChange={(val) => { setQ(val); setPage(1); }}
                        placeholder="Search job title or department..."
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="flex-1 sm:flex-initial min-w-[160px]">
                      <Select
                        icon={Filter}
                        size="md"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        buttonClassName="bg-slate-50 hover:bg-white"
                      >
                        {STATUS_FILTERS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </Select>
                    </div>

                    {isScrolled && !selectedPostingId && (
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="h-10 rounded-xl border border-[#111A62]/20 bg-[#111A62]/5 px-3 py-1.5 text-xs font-extrabold text-[#111A62] hover:bg-[#111A62]/10 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Scroll to top"
                      >
                        ↑ Stats
                      </button>
                    )}
                  </div>
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
                          <tr key={p.id} onClick={() => setSelectedPostingId(p.id)} className="hover:bg-slate-50 cursor-pointer">
                            <TD>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                                  JP
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {p.job_library?.job_title || p.title || "N/A"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    JP-{String(p.id).padStart(3, "0")}
                                  </p>
                                </div>
                              </div>
                            </TD>
                            <TD className="text-slate-600">{p.department?.department_name || p.department?.name || "General"}</TD>
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
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPostingId(p.id);
                                  }}
                                  className="flex items-center gap-1 text-xs text-[#111A62] font-bold hover:bg-[#111A62]/10 px-2 py-1 rounded-lg transition cursor-pointer"
                                >
                                  <Edit size={14} /> Edit & View Specs <ChevronRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPosting(p);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                                  title="Delete Posting"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </TD>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <Pagination
                        page={page}
                        pageSize={pageSize}
                        total={filtered.length}
                        onPageChange={setPage}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT SIDE: JOB SPECIFICATION & EDIT PANEL (Smooth Slide In) ── */}
        {selectedPostingId && (
          <div className="lg:col-span-8 animate-slide-up transition-all duration-300 h-full min-h-0">
            <JobPostingEditPanel
              postingId={selectedPostingId}
              initialPosting={postings.find(p => p.id === selectedPostingId)}
              onClose={() => setSelectedPostingId(null)}
              onUpdated={fetchData}
            />
          </div>
        )}
      </div>

      {/* Delete Posting Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Job Posting"
        description={`Are you sure you want to delete job posting JP-${String(selectedPosting?.id || "").padStart(3, "0")}?`}
        confirmText="Delete Posting"
        variant="danger"
        onConfirm={handleDeletePosting}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* Delete PRF Confirmation Dialog */}
      <ConfirmDialog
        open={deletePRFModalOpen}
        title="Delete Approved PRF"
        description={`Are you sure you want to delete PRF-${String(prfToDelete?.id || "").padStart(3, "0")}?`}
        confirmText="Delete PRF"
        variant="danger"
        onConfirm={handleDeletePRF}
        onCancel={() => setDeletePRFModalOpen(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModalState({ ...alertModal, open: false })}
      />

      {/* Create Job Posting Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        className="max-w-3xl"
        title={
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#111A62]" />
            <span>Create Job Posting</span>
          </div>
        }
        description="Review PRF details, set posting information, and edit qualifications or responsibilities before publishing."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button type="button" variant="primary" onClick={handleCreatePosting} className="bg-[#111A62] text-white gap-1.5 cursor-pointer">
              <Save size={14} /> Create Posting
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          {/* PRF / Job Library Info Summary */}
          {selectedPRF && (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Position</p>
                  <p className="truncate text-xs font-bold text-slate-900">{selectedPRF.position_needed || selectedPRF.jobLibrary?.job_title || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                  <p className="truncate text-xs font-bold text-slate-900">{selectedPRF.department?.name || "General"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Salary Range</p>
                  <p className="truncate text-xs font-bold text-slate-900">
                    ₱{(selectedPRF.jobLibrary?.salary_min ?? 0).toLocaleString()} – ₱{(selectedPRF.jobLibrary?.salary_max ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Headcount</p>
                  <p className="truncate text-xs font-bold text-slate-900">{selectedPRF.headcount} {selectedPRF.headcount === 1 ? "position" : "positions"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Work Location / Setup"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Cebu City, Philippines"
              />
            </div>
            <div>
              <DatePicker
                label="Application Closing Date"
                value={formData.closing_date}
                onChange={(val) => setFormData({ ...formData, closing_date: val })}
                placeholder="Select Date"
              />
            </div>
          </div>

          {/* Qualifications & Responsibilities Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-200">
            {/* Qualifications */}
            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <GraduationCap size={16} className="text-slate-400" />
                  Qualifications
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateAddBlock("qualifications")}
                  className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
                >
                  <Plus size={14} /> Add Block
                </Button>
              </div>
              {(!Array.isArray(formData.qualifications) || formData.qualifications.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-500 italic">No qualifications added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.qualifications.map((block) => (
                    <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => openCreateEditBlock("qualifications", block)} className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Edit Block"><Edit size={14} /></button>
                          <button type="button" onClick={() => removeCreateBlock("qualifications", block.id)} className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Delete Block"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                          {block.details.map((detail, idx) => (
                            <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">{detail.value}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Responsibilities */}
            <div className="flex flex-col sm:border-l sm:border-slate-200 sm:pl-6 max-sm:border-t max-sm:border-slate-200 max-sm:pt-6">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <List size={16} className="text-slate-400" />
                  Responsibilities
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateAddBlock("responsibilities")}
                  className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
                >
                  <Plus size={14} /> Add Block
                </Button>
              </div>
              {(!Array.isArray(formData.responsibilities) || formData.responsibilities.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-500 italic">No responsibilities added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.responsibilities.map((block) => (
                    <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => openCreateEditBlock("responsibilities", block)} className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Edit Block"><Edit size={14} /></button>
                          <button type="button" onClick={() => removeCreateBlock("responsibilities", block.id)} className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Delete Block"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                          {block.details.map((detail, idx) => (
                            <li key={detail.id || idx} className="text-xs text-slate-600 leading-relaxed">{detail.value}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Block Sub-Modal for Create Posting */}
      <Modal
        open={createBlockModal.open}
        containerClassName="z-[110]"
        onClose={() => setCreateBlockModal({ open: false, field: "qualifications", editingId: null })}
        className="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            {createBlockModal.field === "qualifications" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <List className="h-5 w-5 text-blue-600" />
            )}
            <span>
              {createBlockModal.editingId ? "Edit" : "Add"}{" "}
              {createBlockModal.field === "qualifications" ? "Qualification Block" : "Responsibility Block"}
            </span>
          </div>
        }
        description={
          createBlockModal.field === "qualifications"
            ? "Group qualifications into categories (e.g. Educational Background, Skills) with bullet items."
            : "Group responsibilities into categories (e.g. Core Duties, Reporting) with bullet items."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateBlockModal({ open: false, field: "qualifications", editingId: null })} className="cursor-pointer">Cancel</Button>
            <Button type="button" variant="primary" onClick={handleSaveCreateBlock} disabled={!createBlockTitle.trim()} className="gap-1.5 cursor-pointer">
              <FileCheck size={16} /><span>Save Block</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileCheck size={14} className="text-slate-400" />
              Category / Block Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={createBlockTitle}
              onChange={(e) => setCreateBlockTitle(e.target.value)}
              placeholder={createBlockModal.field === "qualifications" ? "e.g. Educational Background" : "e.g. Core Duties"}
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <List size={14} className="text-slate-400" />
              Bullet Items
            </label>
            <div className="space-y-2">
              {createBlockDetails.map((detail, idx) => (
                <div key={detail.id} className="flex items-start gap-2">
                  <span className="mt-2.5 text-xs text-slate-400 font-bold w-5 text-center shrink-0">{idx + 1}.</span>
                  <textarea
                    rows={2}
                    value={detail.value}
                    onChange={(e) => {
                      const updated = [...createBlockDetails];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setCreateBlockDetails(updated);
                    }}
                    placeholder="Enter detail..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed outline-none transition resize-none focus:border-[#111A62] focus:ring-2 focus:ring-[#111A62]/20"
                  />
                  {createBlockDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCreateBlockDetails(createBlockDetails.filter((d) => d.id !== detail.id))}
                      className="mt-2 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCreateBlockDetails([...createBlockDetails, { id: Date.now(), value: "" }])}
                className="flex items-center gap-1 text-xs font-semibold text-[#111A62] hover:text-[#0d1449] transition-colors cursor-pointer mt-1"
              >
                <Plus size={14} /> Add Another Item
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
