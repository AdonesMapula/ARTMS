import { useEffect, useState } from "react";
import {
  FiBriefcase, FiEye, FiEyeOff, FiCheckCircle, FiClock,
  FiPlus, FiX, FiAlertCircle, FiBookOpen,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Table, TD, TH, THead } from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import AlertModal from "../../components/ui/AlertModal";
import api from "../../services/api";

const STATUS_TONE = {
  published: "success",
  pending_approval: "warning",
  draft: "info",
  closed: "default",
  cancelled: "danger",
};
const APPROVAL_TONE = { approved: "success", pending: "warning", rejected: "danger" };

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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPRF, setSelectedPRF] = useState(null);
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          Posting
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Job Posting Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and monitor all active and pending job postings.
        </p>
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
                  <TH>Action</TH>
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
                          <FiBookOpen size={12} className="text-emerald-600" />
                          <span className="text-sm font-medium text-slateald-700">
                            {prf.jobLibrary?.job_title || `JL-${String(prf.job_library_id).padStart(3, "0")}`}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <FiAlertCircle size={11} /> Not linked
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
                    <TD>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openCreateModal(prf)}
                      >
                        <FiPlus /> Create Posting
                      </Button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          {
            label: "Published",
            value: postings.filter((p) => p.status === "published").length,
            icon: <FiEye />,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Pending",
            value: postings.filter((p) => p.status === "pending_approval").length,
            icon: <FiClock />,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Closed",
            value: postings.filter((p) => p.status === "closed").length,
            icon: <FiEyeOff />,
            tone: "bg-slate-100 text-slate-500",
          },
          {
            label: "Total Apps",
            value: postings.reduce((s, p) => s + (p.applicants_count || 0), 0),
            icon: <FiBriefcase />,
            tone: "bg-blue-50 text-blue-700",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.tone}`}
              >
                {s.icon}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {s.label}
                </p>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Job Postings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          {postings.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No job postings yet. Create one from an approved PRF above.
            </p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Job Title</TH>
                  <TH>Department</TH>
                  <TH>Vacancies</TH>
                  <TH>Applicants</TH>
                  <TH>COO Approval</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {postings.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <FiBriefcase size={14} />
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
                      <Badge tone={STATUS_TONE[p.status] ?? "default"}>{p.status}</Badge>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
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
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1"
            >
              <FiX /> Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePosting} className="flex-1">
              <FiCheckCircle /> Submit for COO Approval
            </Button>
          </div>
        }
      >
        {selectedPRF && (
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">

            {/* PRF + Job Library banner */}
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <FiBriefcase size={16} />
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
                      <FiBookOpen size={11} />
                      Job Library:{" "}
                      {selectedPRF.jobLibrary?.job_title ||
                        `JL-${String(selectedPRF.job_library_id).padStart(3, "0")}`}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <FiAlertCircle size={11} />
                      No Job Library entry linked — resubmission required
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Warning for legacy PRFs without job_library_id */}
            {!selectedPRF.job_library_id && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <FiAlertCircle className="mt-0.5 shrink-0 text-amber-500" size={16} />
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
