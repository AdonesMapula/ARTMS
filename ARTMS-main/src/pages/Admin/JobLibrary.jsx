import { useEffect, useState } from "react";
import {
  FiBookOpen, FiCheckCircle, FiClock, FiPlus, FiEdit2, FiTrash2,
  FiCheck, FiSearch, FiAlertCircle,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import AlertModal from "../../components/ui/AlertModal";
import { JobLibraryFormModal, JobLibraryApproveModal, JobLibraryDeleteModal } from "../../modals";
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
                    <TD className="w-40">
                      <div className="flex items-center gap-2">
                        {/* COO approve/reject button */}
                        {isCOO && j.approval_status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setApproveModal({ open: true, job: j, status: "approved", remarks: "" })
                            }
                          >
                            <FiCheck size={14} /> Review
                          </Button>
                        )}
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(j)}>
                              <FiEdit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleteModal({ open: true, job: j })}
                            >
                              <FiTrash2 size={14} />
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
      <JobLibraryFormModal
        open={formModal.open}
        mode={formModal.mode}
        data={formModal.data}
        form={form}
        setForm={setForm}
        onClose={() => setFormModal({ open: false, mode: "create", data: null })}
        onSave={handleSave}
        saving={saving}
      />

      {/* ── COO Approve/Reject Modal ── */}
      <JobLibraryApproveModal
        open={approveModal.open}
        job={approveModal.job}
        status={approveModal.status}
        remarks={approveModal.remarks}
        onStatusChange={(status) => setApproveModal({ ...approveModal, status })}
        onRemarksChange={(remarks) => setApproveModal({ ...approveModal, remarks })}
        onClose={() => setApproveModal({ open: false, job: null, status: "approved", remarks: "" })}
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
