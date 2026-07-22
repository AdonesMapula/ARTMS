import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiInfo, 
  FiBookOpen, 
  FiCalendar, 
  FiUsers, 
  FiBriefcase, 
  FiCheckCircle,
  FiFileText,
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiTarget,
  FiClock,
  FiStar
} from "react-icons/fi";
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
        "group relative overflow-hidden rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-200",
        active
          ? "border-[#111A62] bg-gradient-to-br from-[#111A62] to-[#0d1449] text-white shadow-lg shadow-[#111A62]/20 scale-105"
          : "border-slate-200 bg-white text-slate-700 hover:border-[#111A62]/40 hover:bg-gradient-to-br hover:from-slate-50 hover:to-white hover:shadow-md",
      ].join(" ")}
    >
      {active && (
        <div className="absolute right-2 top-2">
          <FiCheckCircle size={14} className="text-white" />
        </div>
      )}
      {children}
    </button>
  );
}

function SectionCard({ eyebrow, title, description, children, badge, icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#111A62]/20 sm:p-8">
      {/* Decorative gradient corner */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#111A62]/5 to-[#F97316]/5 blur-2xl transition-all duration-300 group-hover:scale-150" />
      
      {(eyebrow || title) && (
        <div className="relative mb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#111A62] to-[#0d1449] text-white shadow-lg">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {eyebrow && (
                  <p className="text-xs font-black uppercase tracking-[0.20em] text-[#F97316]">
                    {eyebrow}
                  </p>
                )}
                {badge}
              </div>
              {title && (
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">{title}</h3>
              )}
            </div>
          </div>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          )}
        </div>
      )}
      <div className="relative">{children}</div>
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
    <div className="space-y-6">
      {/* Modern Page Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#111A62] via-[#0d1449] to-[#111A62] p-8 shadow-xl">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[#F97316]/20 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <FiFileText className="text-[#F97316]" size={16} />
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F97316]">
              Manpower Request
            </p>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Personnel Requisition Form
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Select a position from the Job Library, then fill in the remaining details to submit your manpower request.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Step 1: Position & Schedule ──────────────────────────────────── */}
        <SectionCard 
          eyebrow="Step 1" 
          title="Position &amp; Schedule"
          icon={<FiBriefcase size={18} />}
        >
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Position dropdown from Job Library */}
            <div className="sm:col-span-2">
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiBookOpen size={14} className="text-[#F97316]" />
                  <span>Position Needed</span>
                  <span className="text-red-500">*</span>
                  <span className={hintClass}> — from Job Library</span>
                </div>
              </label>
              {libraryLoading ? (
                <div className={`${inputClass} flex items-center gap-2 text-slate-400`}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#111A62]" />
                  Loading job positions…
                </div>
              ) : jobLibrary.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-sm text-amber-800 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <FiBookOpen className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold">No approved job positions available</p>
                    <p className="mt-1 text-xs text-amber-700">
                      An HR Admin must first add entries to the Job Library and get COO approval before they appear here.
                    </p>
                  </div>
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

            {/* Job Library preview card - Modernized */}
            {selectedJob && (
              <div className="sm:col-span-2 group relative overflow-hidden rounded-xl border border-[#111A62]/30 bg-gradient-to-br from-[#111A62]/10 via-[#111A62]/5 to-transparent p-5 shadow-md transition-all duration-300 hover:shadow-xl">
                <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-[#111A62]/10 blur-2xl" />
                
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111A62] text-white shadow-lg">
                      <FiCheckCircle size={14} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#111A62]">
                      Selected Position
                    </p>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-900">{selectedJob.job_title}</h4>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {selectedJob.job_category && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">
                        <FiTarget size={12} />
                        {selectedJob.job_category}
                      </span>
                    )}
                    {selectedJob.employment_type && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">
                        <FiBriefcase size={12} />
                        {selectedJob.employment_type?.replace(/_/g, " ")}
                      </span>
                    )}
                    {selectedJob.salary_min && selectedJob.salary_max && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 shadow-sm">
                        <FiAward size={12} />
                        ₱{Number(selectedJob.salary_min).toLocaleString()} – ₱{Number(selectedJob.salary_max).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {selectedJob.job_description && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 line-clamp-2">
                      {selectedJob.job_description}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiCalendar size={14} className="text-[#F97316]" />
                  <span>Date Needed</span>
                </div>
              </label>
              <input
                type="date"
                value={form.needed_by}
                onChange={(e) => set("needed_by", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiUsers size={14} className="text-[#F97316]" />
                  <span>Number of Headcount</span>
                </div>
              </label>
              <input
                type="number"
                min="1"
                value={form.headcount}
                onChange={(e) => set("headcount", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className={labelClass}>
              <div className="flex items-center gap-2 mb-3">
                <FiBriefcase size={14} className="text-[#F97316]" />
                <span>Employment Status</span>
                <span className={hintClass}>(select one)</span>
              </div>
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <SectionCard 
          eyebrow="Step 2" 
          title="Plantilla Requirement"
          icon={<FiFileText size={18} />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
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
            <div className="mt-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiUsers size={14} className="text-blue-600" />
                  <span>Replacement For</span>
                </div>
              </label>
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
          icon={<FiAward size={18} />}
          badge={
            autoFilled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                <FiCheckCircle size={12} />
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
          <div className="grid gap-6">
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiAward size={14} className="text-[#F97316]" />
                  <span>Educational Background</span>
                </div>
              </label>
              <input
                type="text"
                value={form.educational_background}
                onChange={(e) => set("educational_background", e.target.value)}
                className={inputClass}
                placeholder="e.g. Bachelor's Degree in any field"
              />
            </div>

            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiBriefcase size={14} className="text-[#F97316]" />
                  <span>Work Experience</span>
                </div>
              </label>
              <textarea
                rows={3}
                value={form.work_experience}
                onChange={(e) => set("work_experience", e.target.value)}
                className={textareaClass}
                placeholder="e.g. At least 1 year of BPO or customer service experience"
              />
            </div>

            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiStar size={14} className="text-[#F97316]" />
                  <span>Skills</span>
                </div>
              </label>
              <textarea
                rows={2}
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
                className={textareaClass}
                placeholder="e.g. Strong communication, MS Office, CRM tools"
              />
            </div>

            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiCheckCircle size={14} className="text-[#F97316]" />
                  <span>Other Preferred Characteristics / Licenses</span>
                </div>
              </label>
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
        <SectionCard 
          eyebrow="Step 4" 
          title="Priority Level"
          icon={<FiClock size={18} />}
          description="Set the urgency level for this manpower request"
        >
          <div className="grid gap-3 sm:grid-cols-4">
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
          eyebrow="AI Configuration"
          title="Applicant Score Matching"
          icon={<FiTarget size={18} />}
          description="Set the score ranges used to classify how well an applicant fits this position."
        >
          {/* Modern Gradient bar with labels */}
          <div className="relative">
            <div className="flex h-4 w-full overflow-hidden rounded-full shadow-inner">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300" 
                style={{ width: `${lowWidth}%` }} 
              />
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300" 
                style={{ width: `${midWidth}%` }} 
              />
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300" 
                style={{ width: `${highWidth}%` }} 
              />
            </div>
            <div className="mt-3 flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1 text-red-600">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                LOW (0&ndash;{Math.max(medium - 1, 0)}%)
              </span>
              <span className="flex items-center gap-1 text-orange-600">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                MEDIUM ({medium}&ndash;{Math.max(high - 1, medium)}%)
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                HIGH ({high}&ndash;100%)
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 transition-all duration-300 hover:shadow-xl hover:border-green-300">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-green-200/30 blur-2xl" />
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500 text-white text-xs font-bold">
                    H
                  </div>
                  <span>High Fit Min Score</span>
                </div>
              </label>
              <div className="relative mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.high_fit_min}
                  onChange={(e) => set("high_fit_min", e.target.value)}
                  className="relative z-10 w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-lg font-extrabold text-green-600 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                />
                <span className="text-xl font-bold text-green-600">%</span>
              </div>
              <p className="mt-2 text-xs font-medium text-green-700">Above this score = High Fit candidate</p>
            </div>

            <div className="group relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 transition-all duration-300 hover:shadow-xl hover:border-orange-300">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-200/30 blur-2xl" />
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F97316] text-white text-xs font-bold">
                    M
                  </div>
                  <span>Medium Fit Min Score</span>
                </div>
              </label>
              <div className="relative mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.medium_fit_min}
                  onChange={(e) => set("medium_fit_min", e.target.value)}
                  className="relative z-10 w-full rounded-xl border-2 border-orange-200 bg-white px-4 py-3 text-lg font-extrabold text-[#F97316] outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
                <span className="text-xl font-bold text-[#F97316]">%</span>
              </div>
              <p className="mt-2 text-xs font-medium text-orange-700">Above this score = Medium Fit candidate</p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
              <FiInfo size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">AI Scoring Information</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                Scores below the Medium threshold will be classified as{" "}
                <span className="font-bold text-red-600">Low Fit</span>. The AI will automatically evaluate applicants based on these thresholds.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── For Human Resources Department ──────────────────────────────── */}
        <SectionCard
          eyebrow="HR Use Only"
          title="For Human Resources Department"
          icon={<FiAlertCircle size={18} />}
          description="These fields will be completed by HR once your request is received and processed."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiClock size={14} className="text-slate-400" />
                  <span>Date of Receipt</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  placeholder="Pending HR review"
                  className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-400`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiUsers size={14} className="text-slate-400" />
                  <span>Position Filled Up By</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  placeholder="Pending HR review"
                  className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-400`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiCalendar size={14} className="text-slate-400" />
                  <span>Date Start</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  placeholder="Pending HR review"
                  className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-400`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Requested by ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-lg">
          <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-[#111A62]/5 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#111A62] to-[#0d1449] text-white shadow-lg">
                <FiUsers size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Requested by</p>
                <p className="text-lg font-extrabold text-slate-900">{user?.name ?? "you"}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.replace(/_/g, " ") ?? ""}</p>
              </div>
            </div>
            <div className="hidden sm:block rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <FiCheckCircle size={14} />
                Auto-routed for approval
              </p>
            </div>
          </div>
        </div>

        {/* ── Submit row ───────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/department-head/request-history")}
            className="group flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
          >
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="group relative overflow-hidden rounded-xl border-2 border-[#111A62] bg-gradient-to-br from-[#111A62] to-[#0d1449] px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting Request…
                </>
              ) : (
                <>
                  <FiCheckCircle size={16} />
                  Submit Request
                  <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
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
