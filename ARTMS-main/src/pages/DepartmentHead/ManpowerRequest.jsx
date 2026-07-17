import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiInfo, FiBookOpen } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import manpowerService from "../../services/manpowerService";
import AlertModal from "../../components/ui/AlertModal";
import api from "../../services/api";

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "probationary", label: "Probationary" },
  { value: "project_based", label: "Project-Based" },
  { value: "seasonal", label: "Seasonal" },
  { value: "ojt", label: "OJT" },
];

const PLANTILLA_OPTIONS = [
  { value: "replacement", label: "Replacement" },
  { value: "additional", label: "Additional Manpower" },
  { value: "new_position", label: "Newly Created Position" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// ── shared styles ────────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#111A62] focus:ring-4 focus:ring-[#111A62]/10";
const textareaClass = `${inputClass} resize-none`;
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800";
const hintClass = "text-xs font-normal text-slate-400";

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-[#111A62] bg-[#111A62] text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-600 hover:border-[#111A62]/40 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SectionCard({ eyebrow, title, description, children, badge }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      {(eyebrow || title) && (
        <div className="mb-5">
          <div className="flex items-center gap-2">
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F97316]">
                {eyebrow}
              </p>
            )}
            {badge}
          </div>
          {title && (
            <h3 className="mt-1 text-base font-extrabold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Parse a flat qualifications string (from Job Library) into structured fields.
 * The library stores qualifications as plain text; we do a best-effort extraction.
 * If the text contains the pipe-delimited format (from a previous PRF submission),
 * we parse that too.
 */
function parseQualifications(raw = "") {
  if (!raw) return {};
  const result = {};

  // Try pipe-delimited key: value format first
  if (raw.includes("|")) {
    raw.split("|").forEach((part) => {
      const idx = part.indexOf(":");
      if (idx === -1) return;
      const key = part.slice(0, idx).trim().toLowerCase().replace(/\s+/g, "_");
      const val = part.slice(idx + 1).trim();
      if (key.includes("educational") || key.includes("education")) result.educational_background = val;
      else if (key.includes("experience")) result.work_experience = val;
      else if (key.includes("skill")) result.skills = val;
      else if (key.includes("other")) result.other_characteristics = val;
    });
    return result;
  }

  // Otherwise treat the whole qualifications block as a description to pre-fill
  result.educational_background = raw;
  return result;
}

export default function ManpowerRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });

  // Job Library approved entries for the position dropdown
  const [jobLibrary, setJobLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  useEffect(() => {
    api
      .get("/job-library/approved")
      .then((res) => setJobLibrary(res.data.data || []))
      .catch(() => setJobLibrary([]))
      .finally(() => setLibraryLoading(false));
  }, []);

  const showAlert = (variant, title, message) =>
    setAlert({ open: true, variant, title, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  const initialForm = {
    job_library_id: "",
    position_needed: "",
    employment_status: "",
    needed_by: "",
    plantilla_type: "",
    replacement_for: "",
    educational_background: "",
    work_experience: "",
    skills: "",
    other_characteristics: "",
    headcount: 1,
    urgency: "medium",
    high_fit_min: 75,
    medium_fit_min: 50,
  };

  const [form, setForm] = useState(initialForm);
  // Track which Step 3 fields were auto-filled so we can show a badge
  const [autoFilled, setAutoFilled] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // ── When a job library entry is chosen, auto-populate Step 3 & 4 ──────────
  const handleJobLibrarySelect = (jobId) => {
    const selected = jobLibrary.find((j) => String(j.id) === String(jobId));
    if (!selected) {
      // Cleared — reset
      setForm((prev) => ({
        ...prev,
        job_library_id: "",
        position_needed: "",
        educational_background: "",
        work_experience: "",
        skills: "",
        other_characteristics: "",
      }));
      setAutoFilled(false);
      return;
    }

    const parsed = parseQualifications(selected.qualifications);

    setForm((prev) => ({
      ...prev,
      job_library_id: selected.id,
      position_needed: selected.job_title,
      // Step 3 auto-populate from qualifications
      educational_background: parsed.educational_background || prev.educational_background,
      work_experience: parsed.work_experience || prev.work_experience,
      skills: parsed.skills || prev.skills,
      other_characteristics: parsed.other_characteristics || prev.other_characteristics,
    }));
    setAutoFilled(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.job_library_id) {
      showAlert("error", "Missing Field", "Please select a position from the Job Library.");
      return;
    }
    if (!form.employment_status) {
      showAlert("error", "Missing Field", "Please select an Employment Status.");
      return;
    }
    if (!form.plantilla_type) {
      showAlert("error", "Missing Field", "Please select a Plantilla Requirement.");
      return;
    }

    const justification = [
      form.educational_background && `Educational Background: ${form.educational_background}`,
      form.work_experience && `Work Experience: ${form.work_experience}`,
      form.skills && `Skills: ${form.skills}`,
      form.other_characteristics && `Other: ${form.other_characteristics}`,
      `Employment Status: ${form.employment_status.replace(/_/g, " ")}`,
      `Plantilla Type: ${form.plantilla_type.replace(/_/g, " ")}`,
      form.replacement_for && `Replacement For: ${form.replacement_for}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const payload = {
      job_library_id: form.job_library_id,
      position_needed: form.position_needed,
      headcount: Number(form.headcount) || 1,
      justification,
      needed_by: form.needed_by || null,
      urgency: form.urgency,
      fit_threshold_high: Number(form.high_fit_min) || 75,
      fit_threshold_medium: Number(form.medium_fit_min) || 50,
    };

    try {
      setSubmitting(true);
      await manpowerService.create(payload);
      setForm(initialForm);
      setAutoFilled(false);
      showAlert(
        "success",
        "Request Submitted",
        "Your Personnel Requisition Form has been submitted for HR review. You will be notified once it is processed."
      );
    } catch (err) {
      showAlert(
        "error",
        "Submission Failed",
        err?.response?.data?.message ?? "Failed to submit request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Fit threshold derived widths ────────────────────────────────────────
  const medium = Math.min(Math.max(Number(form.medium_fit_min) || 0, 0), 100);
  const high = Math.min(Math.max(Number(form.high_fit_min) || 0, 0), 100);
  const lowWidth = Math.min(medium, high);
  const midWidth = Math.max(high - lowWidth, 0);
  const highWidth = Math.max(100 - lowWidth - midWidth, 0);

  // ── Selected job library entry for the preview card ────────────────────
  const selectedJob = jobLibrary.find((j) => String(j.id) === String(form.job_library_id));

  return (
    <div className="space-y-4">
      {/* Page heading */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F97316]">
          Manpower Request
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Personnel Requisition Form
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a position from the Job Library, then fill in the remaining details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Step 1: Position & Schedule ──────────────────────────────────── */}
        <SectionCard eyebrow="Step 1" title="Position &amp; Schedule">
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Position dropdown from Job Library */}
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Position Needed{" "}
                <span className="text-red-500">*</span>
                <span className={hintClass}> — from Job Library</span>
              </label>
              {libraryLoading ? (
                <div className={`${inputClass} text-slate-400`}>Loading job positions…</div>
              ) : jobLibrary.length === 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <FiBookOpen className="mt-0.5 shrink-0" />
                  <span>
                    No approved job entries yet. An HR Admin must first add entries to the{" "}
                    <span className="font-semibold">Job Library</span> and get COO approval before
                    they appear here.
                  </span>
                </div>
              ) : (
                <select
                  className={inputClass}
                  value={form.job_library_id}
                  onChange={(e) => handleJobLibrarySelect(e.target.value)}
                >
                  <option value="">Select a position from the Job Library…</option>
                  {jobLibrary.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_title}
                      {j.job_category ? ` — ${j.job_category}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Job Library preview card */}
            {selectedJob && (
              <div className="sm:col-span-2 rounded-xl border border-[#111A62]/20 bg-[#111A62]/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#111A62] mb-1">
                  Job Library Entry
                </p>
                <p className="font-semibold text-slate-900">{selectedJob.job_title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedJob.job_category && <span>{selectedJob.job_category} · </span>}
                  {selectedJob.employment_type?.replace(/_/g, " ")}
                  {selectedJob.salary_min && selectedJob.salary_max && (
                    <span>
                      {" "}· ₱{Number(selectedJob.salary_min).toLocaleString()} – ₱{Number(selectedJob.salary_max).toLocaleString()}
                    </span>
                  )}
                </p>
                {selectedJob.job_description && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2">{selectedJob.job_description}</p>
                )}
              </div>
            )}

            <div>
              <label className={labelClass}>Date Needed</label>
              <input
                type="date"
                value={form.needed_by}
                onChange={(e) => set("needed_by", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Number of Headcount</label>
              <input
                type="number"
                min="1"
                value={form.headcount}
                onChange={(e) => set("headcount", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>
              Employment Status <span className={hintClass}>(select one)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.employment_status === opt.value}
                  onClick={() =>
                    set("employment_status", form.employment_status === opt.value ? "" : opt.value)
                  }
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Step 2: Plantilla Requirement ───────────────────────────────── */}
        <SectionCard eyebrow="Step 2" title="Plantilla Requirement">
          <div className="flex flex-wrap gap-2">
            {PLANTILLA_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                active={form.plantilla_type === opt.value}
                onClick={() =>
                  set("plantilla_type", form.plantilla_type === opt.value ? "" : opt.value)
                }
              >
                {opt.label}
              </Pill>
            ))}
          </div>

          {form.plantilla_type === "replacement" && (
            <div className="mt-4">
              <label className={labelClass}>Replacement For</label>
              <input
                type="text"
                value={form.replacement_for}
                onChange={(e) => set("replacement_for", e.target.value)}
                className={inputClass}
                placeholder="Name of employee being replaced"
              />
            </div>
          )}
        </SectionCard>

        {/* ── Step 3: Personnel Requirement Details ───────────────────────── */}
        <SectionCard
          eyebrow="Step 3"
          title="Personnel Requirement Details"
          badge={
            autoFilled && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Auto-filled from Job Library
              </span>
            )
          }
          description={
            autoFilled
              ? "These fields were pre-filled from the selected Job Library entry. You can edit them as needed."
              : "Fill in the specific requirements for this position."
          }
        >
          <div className="grid gap-5">
            <div>
              <label className={labelClass}>Educational Background</label>
              <input
                type="text"
                value={form.educational_background}
                onChange={(e) => set("educational_background", e.target.value)}
                className={inputClass}
                placeholder="e.g. Bachelor's Degree in any field"
              />
            </div>

            <div>
              <label className={labelClass}>Work Experience</label>
              <textarea
                rows={3}
                value={form.work_experience}
                onChange={(e) => set("work_experience", e.target.value)}
                className={textareaClass}
                placeholder="e.g. At least 1 year of BPO or customer service experience"
              />
            </div>

            <div>
              <label className={labelClass}>Skills</label>
              <textarea
                rows={2}
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
                className={textareaClass}
                placeholder="e.g. Strong communication, MS Office, CRM tools"
              />
            </div>

            <div>
              <label className={labelClass}>Other Preferred Characteristics / Licenses</label>
              <input
                type="text"
                value={form.other_characteristics}
                onChange={(e) => set("other_characteristics", e.target.value)}
                className={inputClass}
                placeholder="e.g. Amenable to shifting schedules, has NC II"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Step 4: Priority ─────────────────────────────────────────────── */}
        <SectionCard eyebrow="Step 4" title="Priority Level">
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                active={form.urgency === opt.value}
                onClick={() => set("urgency", opt.value)}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        </SectionCard>

        {/* ── Fit Threshold Configuration ─────────────────────────────────── */}
        <SectionCard
          eyebrow="Fit Threshold Configuration"
          title="Applicant Score Matching"
          description="Set the score ranges used to classify how well an applicant fits this position."
        >
          {/* Gradient bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            <div className="bg-red-500 transition-all" style={{ width: `${lowWidth}%` }} />
            <div className="bg-orange-500 transition-all" style={{ width: `${midWidth}%` }} />
            <div className="bg-green-500 transition-all" style={{ width: `${highWidth}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>LOW (0&ndash;{Math.max(medium - 1, 0)}%)</span>
            <span>MEDIUM ({medium}&ndash;{Math.max(high - 1, medium)}%)</span>
            <span>HIGH ({high}&ndash;100%)</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <label className={labelClass}>High Fit Min Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.high_fit_min}
                  onChange={(e) => set("high_fit_min", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-green-600 outline-none transition focus:border-[#111A62] focus:ring-4 focus:ring-[#111A62]/10"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Above this = High Fit</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <label className={labelClass}>Medium Fit Min Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.medium_fit_min}
                  onChange={(e) => set("medium_fit_min", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-[#F97316] outline-none transition focus:border-[#111A62] focus:ring-4 focus:ring-[#111A62]/10"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Above this = Medium Fit</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <FiInfo className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Scores below the Medium threshold will be classified as{" "}
              <span className="font-semibold text-red-600">Low Fit</span>.
            </span>
          </div>
        </SectionCard>

        {/* ── For Human Resources Department ──────────────────────────────── */}
        <SectionCard
          eyebrow="HR Use Only"
          title="For Human Resources Department"
          description="These fields will be completed by HR once your request is received and processed."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Date of Receipt</label>
              <input
                type="text"
                disabled
                placeholder="Pending HR review"
                className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`}
              />
            </div>
            <div>
              <label className={labelClass}>Position Filled Up By</label>
              <input
                type="text"
                disabled
                placeholder="Pending HR review"
                className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`}
              />
            </div>
            <div>
              <label className={labelClass}>Date Start</label>
              <input
                type="text"
                disabled
                placeholder="Pending HR review"
                className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Requested by ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm">
          <div>
            <p className="font-semibold text-slate-800">Requested by {user?.name ?? "you"}</p>
            <p className="text-slate-500 capitalize">{user?.role?.replace(/_/g, " ") ?? ""}</p>
          </div>
          <p className="text-xs text-slate-400">
            Submitted requests are routed for approval automatically.
          </p>
        </div>

        {/* ── Submit row ───────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/department-head/request-history")}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#111A62] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d1550] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>

      {/* ── Alert Modal ─────────────────────────────────────────────────────── */}
      <AlertModal
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          closeAlert();
          if (alert.variant === "success") {
            navigate("/department-head/request-history");
          }
        }}
      />
    </div>
  );
}
