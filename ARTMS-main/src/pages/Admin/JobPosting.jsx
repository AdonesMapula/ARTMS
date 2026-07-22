import { useEffect, useState } from "react";
import {
  Briefcase, Eye, EyeOff, CheckCircle, Clock, XCircle,
  Plus, X, AlertCircle, FileText, Edit, Trash2, Filter, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
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

const STATUS_TONE = {
  published: "success",
  pending_approval: "warning",
  draft: "info",
  closed: "default",
  cancelled: "danger",
};
const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "pending_approval", label: "Pending" },
  { value: "closed", label: "Closed" },
];

const taClass =
  "w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed outline-none transition resize-none focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";
const selectClass =
  "w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";

/**
 * Parse the pipe-delimited justification string stored on the PRF back into
 * structured fields so we can pre-fill the posting's requirement fields.
 * e.g. "Educational Background: X | Work Experience: Y | Skills: Z | ..."
 */
function parseJustification(raw = "") {
  const result = {
    educational_background: "",
    work_experience: "",
    skills: "",
    other: "",
    employment_status: "",
    plantilla_type: "",
  };
  if (!raw) return result;

  raw.split("|").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();

    if (key.includes("educational")) result.educational_background = val;
    else if (key.includes("experience")) result.work_experience = val;
    else if (key.includes("skill")) result.skills = val;
    else if (key.includes("other")) result.other = val;
    else if (key.includes("employment")) result.employment_status = val;
    else if (key.includes("plantilla")) result.plantilla_type = val;
  });

  return result;
}

export default function JobPosting() {
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
    educational_background: "",
    work_experience: "",
    skills: "",
    other: "",
    employment_status: "",
    plantilla_type: "",
    closing_date: "",
  });
  const [alertModal, setAlertModal] = useState({
    open: false,
    variant: "success",
    title: "",
    message: "",
  });

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

  const openCreateModal = (prf) => {
    setSelectedPRF(prf);

    // Pre-fill requirement fields from the PRF's justification string
    const parsed = parseJustification(prf.justification);

    setFormData({
      location: "",
      educational_background: parsed.educational_background,
      work_experience: parsed.work_experience,
      skills: parsed.skills,
      other: parsed.other,
      employment_status: parsed.employment_status,
      plantilla_type: parsed.plantilla_type,
      closing_date: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreatePosting = async () => {
    if (!selectedPRF) return;

    // The job_library_id MUST come from the PRF — if it's missing the PRF was
    // created before the Job Library flow was implemented.
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

    const descriptionParts = [
      formData.educational_background && `Educational Background: ${formData.educational_background}`,
      formData.work_experience        && `Work Experience: ${formData.work_experience}`,
      formData.skills                 && `Skills: ${formData.skills}`,
      formData.other                  && `Other: ${formData.other}`,
      formData.employment_status      && `Employment Status: ${formData.employment_status}`,
      formData.plantilla_type         && `Plantilla Type: ${formData.plantilla_type}`,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      await api.post("/job-postings", {
        job_library_id:      selectedPRF.job_library_id,
        department_id:       selectedPRF.department_id,
        manpower_request_id: selectedPRF.id,
        vacancies_count:     selectedPRF.headcount,
        location:            formData.location,
        description:         descriptionParts,
        closing_date:        formData.closing_date || null,
      });

      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "Job posting created and submitted for COO approval.",
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

    const descriptionParts = [
      formData.educational_background && `Educational Background: ${formData.educational_background}`,
      formData.work_experience        && `Work Experience: ${formData.work_experience}`,
      formData.skills                 && `Skills: ${formData.skills}`,
      formData.other                  && `Other: ${formData.other}`,
      formData.employment_status      && `Employment Status: ${formData.employment_status}`,
      formData.plantilla_type         && `Plantilla Type: ${formData.plantilla_type}`,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      await api.put(`/job-postings/${selectedPosting.id}`, {
        location: formData.location,
        description: descriptionParts,
        closing_date: formData.closing_date || null,
      });

      setAlertModal({
        open: true,
        variant: "success",
        title: "Success",
        message: "Job posting updated successfully.",
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

    // Parse description back into form fields
    const desc = posting.description || "";
    const parsed = {
      educational_background: "",
      work_experience: "",
      skills: "",
      other: "",
      employment_status: "",
      plantilla_type: "",
    };

    desc.split("|").forEach((part) => {
      const idx = part.indexOf(":");
      if (idx === -1) return;
      const key = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();

      if (key.includes("educational")) parsed.educational_background = val;
      else if (key.includes("experience")) parsed.work_experience = val;
      else if (key.includes("skill")) parsed.skills = val;
      else if (key.includes("other")) parsed.other = val;
      else if (key.includes("employment")) parsed.employment_status = val;
      else if (key.includes("plantilla")) parsed.plantilla_type = val;
    });

    setFormData({
      location: posting.location || "",
      educational_background: parsed.educational_background,
      work_experience: parsed.work_experience,
      skills: parsed.skills,
      other: parsed.other,
      employment_status: parsed.employment_status,
      plantilla_type: parsed.plantilla_type,
      closing_date: posting.closing_date || "",
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
        p.status?.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all" && p.status !== statusFilter) return false;

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
    pending: postings.filter((p) => p.status === "pending_approval").length,
    closed: postings.filter((p) => p.status === "closed").length,
    totalApps: postings.reduce((s, p) => s + (p.applicants_count || 0), 0),
  };

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

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === f.value
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
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#111A62] bg-[#111A62] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0d1449] hover:border-[#0d1449]"
            >
              <CheckCircle size={16} />
              Submit for COO Approval
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
                <div className="mt-2.5">
                  {selectedPRF.job_library_id ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <FileText size={11} />
                      Job Library:{" "}
                      {selectedPRF.jobLibrary?.job_title ||
                        `JL-${String(selectedPRF.job_library_id).padStart(3, "0")}`}
                    </div>
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

                {/* Section: Requirements */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Requirements &amp; Qualifications
                    </p>
                    {(formData.educational_background ||
                      formData.work_experience ||
                      formData.skills) && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        Pre-filled from PRF
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Educational Background
                      </label>
                      <textarea
                        rows={2}
                        className={taClass}
                        placeholder="e.g., Bachelor's degree in Computer Science…"
                        value={formData.educational_background}
                        onChange={(e) =>
                          setFormData({ ...formData, educational_background: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Work Experience
                      </label>
                      <textarea
                        rows={2}
                        className={taClass}
                        placeholder="e.g., At least 2 years of relevant experience…"
                        value={formData.work_experience}
                        onChange={(e) =>
                          setFormData({ ...formData, work_experience: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Skills
                      </label>
                      <textarea
                        rows={2}
                        className={taClass}
                        placeholder="e.g., Proficient in React, Node.js, SQL…"
                        value={formData.skills}
                        onChange={(e) =>
                          setFormData({ ...formData, skills: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Other Requirements
                      </label>
                      <textarea
                        rows={2}
                        className={taClass}
                        placeholder="e.g., Must be willing to work on-site, valid driver's license…"
                        value={formData.other}
                        onChange={(e) =>
                          setFormData({ ...formData, other: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Employment Details */}
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Employment Details
                  </p>
                  <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                          Employment Status
                        </label>
                        <select
                          className={selectClass}
                          value={formData.employment_status}
                          onChange={(e) =>
                            setFormData({ ...formData, employment_status: e.target.value })
                          }
                        >
                          <option value="">Select status…</option>
                          <option value="Regular">Regular</option>
                          <option value="Contractual">Contractual</option>
                          <option value="Project Based">Project Based</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Probationary">Probationary</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                          Plantilla Type
                        </label>
                        <select
                          className={selectClass}
                          value={formData.plantilla_type}
                          onChange={(e) =>
                            setFormData({ ...formData, plantilla_type: e.target.value })
                          }
                        >
                          <option value="">Select type…</option>
                          <option value="Regular">Regular</option>
                          <option value="Additional">Additional</option>
                          <option value="Replacement">Replacement</option>
                          <option value="New Position">New Position</option>
                        </select>
                      </div>
                    </div>
                  </div>
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

            {/* Section: Requirements */}
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Requirements &amp; Qualifications
              </p>
              <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Educational Background
                  </label>
                  <textarea
                    rows={2}
                    className={taClass}
                    placeholder="e.g., Bachelor's degree in Computer Science…"
                    value={formData.educational_background}
                    onChange={(e) =>
                      setFormData({ ...formData, educational_background: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Work Experience
                  </label>
                  <textarea
                    rows={2}
                    className={taClass}
                    placeholder="e.g., At least 2 years of relevant experience…"
                    value={formData.work_experience}
                    onChange={(e) =>
                      setFormData({ ...formData, work_experience: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Skills
                  </label>
                  <textarea
                    rows={2}
                    className={taClass}
                    placeholder="e.g., Proficient in React, Node.js, SQL…"
                    value={formData.skills}
                    onChange={(e) =>
                      setFormData({ ...formData, skills: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Other Requirements
                  </label>
                  <textarea
                    rows={2}
                    className={taClass}
                    placeholder="e.g., Must be willing to work on-site, valid driver's license…"
                    value={formData.other}
                    onChange={(e) =>
                      setFormData({ ...formData, other: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section: Employment Details */}
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Employment Details
              </p>
              <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                      Employment Status
                    </label>
                    <select
                      className={selectClass}
                      value={formData.employment_status}
                      onChange={(e) =>
                        setFormData({ ...formData, employment_status: e.target.value })
                      }
                    >
                      <option value="">Select status…</option>
                      <option value="Regular">Regular</option>
                      <option value="Contractual">Contractual</option>
                      <option value="Project Based">Project Based</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Probationary">Probationary</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                      Plantilla Type
                    </label>
                    <select
                      className={selectClass}
                      value={formData.plantilla_type}
                      onChange={(e) =>
                        setFormData({ ...formData, plantilla_type: e.target.value })
                      }
                    >
                      <option value="">Select type…</option>
                      <option value="Regular">Regular</option>
                      <option value="Additional">Additional</option>
                      <option value="Replacement">Replacement</option>
                      <option value="New Position">New Position</option>
                    </select>
                  </div>
                </div>
              </div>
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
