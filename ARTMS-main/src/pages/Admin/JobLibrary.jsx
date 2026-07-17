import { useEffect, useState } from "react";
import {
  FiBookOpen, FiCheckCircle, FiClock, FiPlus, FiEdit2, FiTrash2,
  FiX, FiAlertCircle, FiCheck, FiSearch,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import AlertModal from "../../components/ui/AlertModal";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };

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

const inputClass =
  "w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)]";
const textareaClass = `${inputClass} resize-none`;
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800";

export default function JobLibrary() {
  const { user } = useAuth();
  const isCOO = user?.role === "coo" || user?.role === "super_admin";
  const canEdit = ["hr_admin", "super_admin", "coo"].includes(user?.role);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  // Modals
  const [formModal, setFormModal] = useState({ open: false, mode: "create", data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, job: null });
  const [approveModal, setApproveModal] = useState({ open: false, job: null, status: "approved", remarks: "" });
  const [alertModal, setAlertModal] = useState({ open: false, variant: "success", title: "", message: "" });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchJobs(); }, []);

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

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const rows = jobs.filter((j) => {
    const query = q.trim().toLowerCase();
    const matchQ =
      !query ||
      j.job_title?.toLowerCase().includes(query) ||
      j.job_category?.toLowerCase().includes(query);
    const matchF = filter === "all" || j.approval_status === filter;
    return matchQ && matchF;
  });

  // ── Create / Edit ──────────────────────────────────────────────────────────
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
        showAlert("success", "Submitted", "Job entry created and sent to COO for approval.");
      } else {
        await api.put(`/job-library/${formModal.data.id}`, form);
        showAlert("success", "Updated", "Job entry updated successfully.");
      }
      setFormModal({ open: false, mode: "create", data: null });
      fetchJobs();
    } catch (err) {
      showAlert("error", "Error", err.response?.data?.message || "Failed to save job entry.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/job-library/${deleteModal.job.id}`);
      showAlert("success", "Deleted", "Job entry removed from the library.");
      setDeleteModal({ open: false, job: null });
      fetchJobs();
    } catch (err) {
      showAlert("error", "Error", err.response?.data?.message || "Failed to delete job entry.");
      setDeleteModal({ open: false, job: null });
    }
  };

  // ── COO Approve / Reject ───────────────────────────────────────────────────
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
      setApproveModal({ open: false, job: null, status: "approved", remarks: "" });
      fetchJobs();
    } catch (err) {
      showAlert("error", "Error", err.response?.data?.message || "Failed to update approval.");
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const approved = jobs.filter((j) => j.approval_status === "approved").length;
  const pending  = jobs.filter((j) => j.approval_status === "pending").length;
  const rejected = jobs.filter((j) => j.approval_status === "rejected").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">Library</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Job Library</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reusable job templates used in PRFs and job postings — requires COO approval.
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={openCreate}>
            <FiPlus /> Add Job Entry
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Approved", value: approved, icon: <FiCheckCircle />, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Pending",  value: pending,  icon: <FiClock />,       tone: "bg-amber-50 text-amber-700"    },
          { label: "Rejected", value: rejected, icon: <FiAlertCircle />, tone: "bg-red-50 text-red-600"        },
          { label: "Total",    value: jobs.length, icon: <FiBookOpen />, tone: "bg-blue-50 text-blue-700"      },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.tone}`}>{s.icon}</div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Job Templates</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter pills */}
              <div className="flex flex-wrap gap-1">
                {["all", "approved", "pending", "rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition ${
                      filter === f
                        ? "border-[var(--artms-primary)] bg-[var(--artms-primary)] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-52">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  className="w-full rounded-lg border border-[var(--artms-border)] bg-white py-1.5 pl-8 pr-3 text-sm text-slate-900 outline-none focus:border-[var(--artms-primary)] focus:ring-2 focus:ring-[var(--artms-ring)]"
                  placeholder="Search templates…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-slate-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-slate-400">No job templates match your filter.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Job Title</TH>
                  <TH>Category</TH>
                  <TH>Employment Type</TH>
                  <TH>Approval</TH>
                  <TH>Created By</TH>
                  <TH>Actions</TH>
                </tr>
              </THead>
              <tbody>
                {rows.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <TD>
                      <p className="font-semibold text-slate-900">{j.job_title}</p>
                      <p className="text-xs text-slate-400">JL-{String(j.id).padStart(3, "0")}</p>
                    </TD>
                    <TD className="text-slate-600">{j.job_category || "—"}</TD>
                    <TD>
                      <Badge tone="accent">{j.employment_type?.replace(/_/g, " ") || "—"}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={APPROVAL_TONE[j.approval_status] ?? "default"} className="capitalize">
                        {j.approval_status}
                      </Badge>
                    </TD>
                    <TD className="text-sm text-slate-600">{j.creator?.name || "—"}</TD>
                    <TD>
                      <div className="flex items-center gap-1.5">
                        {/* COO approve/reject button */}
                        {isCOO && j.approval_status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setApproveModal({ open: true, job: j, status: "approved", remarks: "" })
                            }
                          >
                            <FiCheck size={13} /> Review
                          </Button>
                        )}
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(j)}>
                              <FiEdit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleteModal({ open: true, job: j })}
                            >
                              <FiTrash2 size={13} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={formModal.open}
        title={formModal.mode === "create" ? "Add Job Entry" : "Edit Job Entry"}
        description={
          formModal.mode === "create"
            ? "New entries require COO approval before they appear in PRF dropdowns."
            : `Editing JL-${String(formModal.data?.id ?? 0).padStart(3, "0")}`
        }
        onClose={() => setFormModal({ open: false, mode: "create", data: null })}
        className="max-w-2xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setFormModal({ open: false, mode: "create", data: null })}>
              <FiX /> Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
              <FiCheckCircle /> {saving ? "Saving…" : formModal.mode === "create" ? "Submit for Approval" : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">
          {/* Basic Info */}
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Basic Info</p>
            <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Job Title <span className="text-red-500">*</span></label>
                  <input
                    className={inputClass}
                    placeholder="e.g., Customer Service Representative"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Category</label>
                  <input
                    className={inputClass}
                    placeholder="e.g., Operations, IT, Finance"
                    value={form.job_category}
                    onChange={(e) => setForm({ ...form, job_category: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Employment Type</label>
                  <select
                    className={inputClass}
                    value={form.employment_type}
                    onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  >
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contractual">Contractual</option>
                    <option value="project_based">Project-based</option>
                    <option value="probationary">Probationary</option>
                    <option value="ojt">OJT / Internship</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Salary Min (₱)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g., 20000"
                    value={form.salary_min}
                    onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Salary Max (₱)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="e.g., 35000"
                    value={form.salary_max}
                    onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Job Details</p>
            <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50/60 p-4 space-y-4">
              <div>
                <label className={labelClass}>Job Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  className={textareaClass}
                  placeholder="Brief overview of the role and its purpose…"
                  value={form.job_description}
                  onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Qualifications <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  className={textareaClass}
                  placeholder="Educational background, experience, skills required…"
                  value={form.qualifications}
                  onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-400">
                  This will auto-populate Steps 3 &amp; 4 in the PRF when this job is selected.
                </p>
              </div>
              <div>
                <label className={labelClass}>Responsibilities <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  className={textareaClass}
                  placeholder="Key duties and tasks for this role…"
                  value={form.responsibilities}
                  onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── COO Approve/Reject Modal ── */}
      <Modal
        open={approveModal.open}
        title="Review Job Entry"
        description={approveModal.job ? `Reviewing "${approveModal.job.job_title}"` : ""}
        onClose={() => setApproveModal({ open: false, job: null, status: "approved", remarks: "" })}
        className="max-w-lg"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setApproveModal({ open: false, job: null, status: "approved", remarks: "" })}
            >
              <FiX /> Cancel
            </Button>
            <Button
              variant={approveModal.status === "approved" ? "primary" : "danger"}
              className="flex-1"
              onClick={handleApprove}
              disabled={saving}
            >
              <FiCheckCircle /> {saving ? "Saving…" : approveModal.status === "approved" ? "Approve" : "Reject"}
            </Button>
          </div>
        }
      >
        {approveModal.job && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--artms-border)] bg-slate-50 p-4 text-sm text-slate-700 space-y-1">
              <p><span className="font-semibold">Category:</span> {approveModal.job.job_category || "—"}</p>
              <p><span className="font-semibold">Type:</span> {approveModal.job.employment_type?.replace(/_/g, " ")}</p>
              <p className="mt-2 text-xs text-slate-500">{approveModal.job.job_description}</p>
            </div>
            <div>
              <label className={labelClass}>Decision</label>
              <div className="flex gap-2">
                {["approved", "rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setApproveModal({ ...approveModal, status: s })}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold capitalize transition ${
                      approveModal.status === s
                        ? s === "approved"
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-red-500 bg-red-500 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Remarks (optional)</label>
              <textarea
                rows={2}
                className={textareaClass}
                placeholder="Leave a note for the HR team…"
                value={approveModal.remarks}
                onChange={(e) => setApproveModal({ ...approveModal, remarks: e.target.value })}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={deleteModal.open}
        title="Delete Job Entry"
        description="This action cannot be undone."
        onClose={() => setDeleteModal({ open: false, job: null })}
        className="max-w-sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal({ open: false, job: null })}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              <FiTrash2 /> Delete
            </Button>
          </div>
        }
      >
        {deleteModal.job && (
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">"{deleteModal.job.job_title}"</span>?
            {deleteModal.job.approval_status === "approved" && (
              <span className="mt-2 block text-xs text-amber-600">
                Warning: this is an approved entry used in PRF position dropdowns.
              </span>
            )}
          </p>
        )}
      </Modal>

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
