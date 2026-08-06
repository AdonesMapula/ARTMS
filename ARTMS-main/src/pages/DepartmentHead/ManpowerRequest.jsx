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
  FiStar,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import manpowerService from "../../services/manpowerService";
import { calculateSalaryBreakdown } from "../../utils/salaryUtils";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import Select from "../../components/ui/Select";
import DatePicker from "../../components/ui/DatePicker";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { GraduationCap, List, Plus, Trash2, Edit, FileCheck, X } from "lucide-react";
import AlertModal from "../../components/ui/AlertModal";

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
    <div className="group relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#111A62]/20 sm:p-8">
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

// Function parseQualifications removed as Job Library now provides structured arrays

export default function ManpowerRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitPayload, setConfirmSubmitPayload] = useState(null);

  const [jobLibrary, setJobLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  useEffect(() => {
    api
      .get("/job-library/approved")
      .then((res) => setJobLibrary(res.data.data || []))
      .catch(() => setJobLibrary([]))
      .finally(() => setLibraryLoading(false));
  }, []);

  const initialForm = {
    job_library_id: "",
    position_needed: "",
    employment_status: "",
    needed_by: "",
    plantilla_type: "",
    replacement_for: "",
    qualifications: [],
    responsibilities: [],
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
        qualifications: [],
        responsibilities: [],
      }));
      setAutoFilled(false);
      return;
    }

    setForm((prev) => ({
      ...prev,
      job_library_id: selected.id,
      position_needed: selected.job_title,
      // Step 3 auto-populate from nested arrays
      qualifications: selected.qualifications || [],
      responsibilities: selected.responsibilities || [],
    }));
    setAutoFilled(true);
  };

  // ── Block Modal State & Handlers (Qualifications & Responsibilities Step 3) ──
  const [blockModal, setBlockModal] = useState({
    open: false,
    field: "qualifications",
    editingIdx: null,
  });
  const [blockTitle, setBlockTitle] = useState("");
  const [blockDetails, setBlockDetails] = useState([]);

  const openAddBlockModal = (field) => {
    setBlockModal({ open: true, field, editingIdx: null });
    setBlockTitle("");
    setBlockDetails([{ id: Date.now(), value: "" }]);
  };

  const openEditBlockModal = (field, block, idx) => {
    setBlockModal({ open: true, field, editingIdx: idx });
    setBlockTitle(block.title || "");
    setBlockDetails(
      Array.isArray(block.details) && block.details.length > 0
        ? block.details.map((d) => ({
          id: d.id || Date.now() + Math.random(),
          value: typeof d === "string" ? d : (d.value ?? ""),
        }))
        : [{ id: Date.now(), value: "" }]
    );
  };

  const handleRemoveBlock = (field, idx) => {
    const list = Array.from(form[field] || []);
    list.splice(idx, 1);
    setForm((prev) => ({ ...prev, [field]: list }));
  };

  const handleAddModalDetail = () => {
    setBlockDetails((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), value: "" },
    ]);
  };

  const handleUpdateModalDetail = (id, value) => {
    setBlockDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value } : d))
    );
  };

  const handleRemoveModalDetail = (id) => {
    setBlockDetails((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveBlockModal = () => {
    if (!blockTitle.trim()) {
      alert("Please enter a category / block title.");
      return;
    }

    const cleanDetails = blockDetails.filter((d) => d.value.trim() !== "");
    const currentBlocks = Array.from(form[blockModal.field] || []);

    if (blockModal.editingIdx !== null) {
      currentBlocks[blockModal.editingIdx] = {
        ...currentBlocks[blockModal.editingIdx],
        title: blockTitle.trim(),
        details: cleanDetails,
      };
    } else {
      currentBlocks.push({
        id: Date.now(),
        title: blockTitle.trim(),
        details: cleanDetails,
      });
    }

    setForm((prev) => ({ ...prev, [blockModal.field]: currentBlocks }));
    setBlockModal({ open: false, field: "qualifications", editingIdx: null });
    setBlockTitle("");
    setBlockDetails([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.position_needed) {
      toast.warning("Missing Field", "Please enter a Position Title.");
      return;
    }
    if (!form.job_library_id) {
      toast.warning("Missing Field", "Please select a position from the Job Library.");
      return;
    }
    if (!form.employment_status) {
      toast.warning("Missing Field", "Please select an Employment Status.");
      return;
    }
    if (!form.plantilla_type) {
      toast.warning("Missing Field", "Please select a Plantilla Requirement.");
      return;
    }

    const justification = [
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
      qualifications: form.qualifications,
      responsibilities: form.responsibilities,
      needed_by: form.needed_by || null,
      urgency: form.urgency,
      fit_threshold_high: Number(form.high_fit_min) || 75,
      fit_threshold_medium: Number(form.medium_fit_min) || 50,
    };

    setConfirmSubmitPayload(payload);
  };

  const handleDoSubmit = async () => {
    if (!confirmSubmitPayload) return;
    const payload = confirmSubmitPayload;
    setConfirmSubmitPayload(null);

    try {
      setSubmitting(true);
      await manpowerService.create(payload);
      setForm(initialForm);
      setAutoFilled(false);
      toast.success(
        "Request Submitted",
        "Your Personnel Requisition Form has been submitted for HR review. You will be notified once it is processed.",
        { duration: 6000 }
      );
      navigate("/department-head/request-history");
    } catch (err) {
      toast.error(
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
          {/* 3-Column grid: Position Needed | Date Needed | Number of Headcount */}
          <div className="grid gap-6 sm:grid-cols-3">

            {/* Position Needed */}
            <div>
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
                <Select
                  value={form.job_library_id}
                  onChange={(e) => handleJobLibrarySelect(e.target.value)}
                  options={[
                    { value: "", label: "Select a position from the Job Library…" },
                    ...jobLibrary.map((j) => ({
                      value: String(j.id),
                      label: `${j.job_title}${j.job_category ? ` — ${j.job_category}` : ""}`,
                    })),
                  ]}
                />
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
                    {(() => {
                      const bd = calculateSalaryBreakdown(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_type);
                      if (!bd) return null;
                      return (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 shadow-xs text-xs">
                          <FiAward size={12} />
                          {bd.formatted.monthly} ({bd.formatted.daily}/day, {bd.formatted.hourly}/hr)
                        </span>
                      );
                    })()}
                  </div>

                  {selectedJob.job_description && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 line-clamp-2">
                      {selectedJob.job_description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Date Needed */}
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-2">
                  <FiCalendar size={14} className="text-[#F97316]" />
                  <span>Date Needed</span>
                </div>
              </label>
              <DatePicker
                value={form.needed_by}
                onChange={(val) => set("needed_by", val)}
                placeholder="Pick a date…"
                disablePast
              />
            </div>

            {/* Number of Headcount */}
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

          {/* Selected Job Preview Card — appears below the 3-column grid */}
          {selectedJob && (
            <div className="mt-4 group relative overflow-hidden rounded-xl border border-[#111A62]/30 bg-gradient-to-br from-[#111A62]/10 via-[#111A62]/5 to-transparent p-5 shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-[#111A62]/10 blur-2xl" />

              <div className="relative">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111A62] text-white shadow-lg">
                    <FiCheckCircle size={14} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#111A62]">
                    Selected Position Preview
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
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
                      {(() => {
                        const bd = calculateSalaryBreakdown(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_type);
                        if (!bd) return null;
                        return (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 shadow-xs text-xs">
                            <FiAward size={12} />
                            {bd.formatted.monthly} / month
                          </span>
                        );
                      })()}
                    </div>
                    {selectedJob.job_description && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-700 line-clamp-2">
                        {selectedJob.job_description}
                      </p>
                    )}
                  </div>

                  {(() => {
                    const bd = calculateSalaryBreakdown(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_type);
                    if (!bd) return null;
                    return (
                      <div className="grid grid-cols-3 gap-2 text-center self-start">
                        <div className="rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Weekly</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bd.formatted.weekly}</span>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Daily</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bd.formatted.daily}</span>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Hourly</span>
                          <span className="font-bold text-[#111A62] text-xs mt-0.5 block">{bd.formatted.hourly}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

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
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Qualifications */}
            <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <GraduationCap size={16} className="text-[#F97316]" />
                  Qualifications
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openAddBlockModal("qualifications")}
                  className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
                >
                  <Plus size={14} /> Add Block
                </Button>
              </div>

              {(!form.qualifications || form.qualifications.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-500 italic">No qualifications added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(form.qualifications || []).map((block, idx) => (
                    <div key={block.id || idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBlockModal("qualifications", block, idx)}
                            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Block"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock("qualifications", idx)}
                            className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                          {block.details.map((detail, dIdx) => (
                            <li key={detail.id || dIdx} className="text-xs text-slate-600 leading-relaxed">
                              {detail.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Responsibilities */}
            <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <List size={16} className="text-[#F97316]" />
                  Responsibilities
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openAddBlockModal("responsibilities")}
                  className="h-8 gap-1.5 border border-[#111A62] bg-transparent text-[#111A62] hover:bg-[#111A62]/10 transition-all duration-200 cursor-pointer shadow-2xs font-semibold px-2.5"
                >
                  <Plus size={14} /> Add Block
                </Button>
              </div>

              {(!form.responsibilities || form.responsibilities.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-500 italic">No responsibilities added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(form.responsibilities || []).map((block, idx) => (
                    <div key={block.id || idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{block.title || "Untitled Block"}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBlockModal("responsibilities", block, idx)}
                            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Block"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock("responsibilities", idx)}
                            className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {block.details && block.details.length > 0 && (
                        <ul className="mt-2 pl-4 list-disc space-y-1 marker:text-slate-300">
                          {block.details.map((detail, dIdx) => (
                            <li key={detail.id || dIdx} className="text-xs text-slate-600 leading-relaxed">
                              {detail.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
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

      {/* ── Confirmation Dialog ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmSubmitPayload}
        title="Submit Manpower Request?"
        description={`Are you sure you want to submit a request for ${confirmSubmitPayload?.headcount || 1} headcount of "${confirmSubmitPayload?.position_needed}"?`}
        confirmLabel="Yes, Submit Request"
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={handleDoSubmit}
        onClose={() => setConfirmSubmitPayload(null)}
      />

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

      {/* Qualification / Responsibility Block Sub-Modal */}
      <Modal
        open={blockModal.open}
        containerClassName="z-[110]"
        onClose={() => setBlockModal({ open: false, field: "qualifications", editingIdx: null })}
        className="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            {blockModal.field === "qualifications" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <List className="h-5 w-5 text-blue-600" />
            )}
            <span>
              {blockModal.editingIdx !== null ? "Edit" : "Add"}{" "}
              {blockModal.field === "qualifications" ? "Qualification Block" : "Responsibility Block"}
            </span>
          </div>
        }
        description={
          blockModal.field === "qualifications"
            ? "Group qualifications into categories (e.g. Educational Background, Skills) with bullet items."
            : "Group responsibilities into categories (e.g. Core Duties, Reporting) with bullet items."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockModal({ open: false, field: "qualifications", editingIdx: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveBlockModal}
              disabled={!blockTitle.trim()}
              className="gap-1.5"
            >
              <FileCheck size={16} />
              <span>Save Block</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileCheck size={14} className="text-slate-400" />
              Category / Block Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder={
                blockModal.field === "qualifications"
                  ? "e.g., Educational Background, Technical Skills"
                  : "e.g., Core Duties, Daily Operations"
              }
              autoFocus
            />
          </div>

          {/* Details Bullet Items */}
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <List size={14} className="text-slate-400" />
                <span>Specific Bullet Items</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModalDetail}
                className="h-7 gap-1 text-xs border-[#111A62] text-[#111A62] hover:bg-[#111A62]/10"
              >
                <Plus size={12} /> Add Item
              </Button>
            </label>

            {blockDetails.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No detail items added yet. Click &quot;Add Item&quot; to add bullet points.</p>
            ) : (
              <div className="space-y-2.5">
                {blockDetails.map((detail, index) => (
                  <div key={detail.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4 text-center shrink-0">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={
                        blockModal.field === "qualifications"
                          ? "e.g., Bachelor's Degree in Computer Science"
                          : "e.g., Manage customer inquiries and process support tickets"
                      }
                      value={detail.value}
                      onChange={(e) => handleUpdateModalDetail(detail.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveModalDetail(detail.id)}
                      className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10 px-2.5 cursor-pointer"
                      title="Remove Item"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
